import { NextRequest, NextResponse } from 'next/server';
import { createReport, updateReport, checkStorageHealth } from '@/lib/report-storage';

// JSON endpoint (single endpoint — markdown endpoint phased out)
const API_ENDPOINT = '/calculate-cgt-json/';

// Base API URL
const API_BASE_URL = 'https://cgtbrain.com.au';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract LLM provider from the request (default to 'claude')
    const llmProvider: string = body.llmProvider || 'claude';

    // Detect re-submissions that already include user's verification_responses.
    // When this flag is set we skip the needsClarification re-wrapping so the
    // backend's final analysis (which may still echo verification_failed fields
    // from the first round) is passed straight through to the client.
    const isResubmitWithResponses = request.headers.get('x-resubmit-with-responses') === 'true';

    // Remove internal fields from the payload before sending to external API
    const { llmProvider: __, ...apiPayload } = body;

    // Add llm_provider to the payload
    const finalPayload = {
      ...apiPayload,
      llm_provider: llmProvider,
    };

    // Construct the full URL
    const API_URL = `${API_BASE_URL}${API_ENDPOINT}`;

    console.log(`🤖 LLM Provider: ${llmProvider}`);
    console.log(`🔗 Calling CGT Model API: ${API_URL}`);
    console.log(`🔄 Is re-submission with responses: ${isResubmitWithResponses}`);
    console.log('📤 Request payload:', JSON.stringify(finalPayload, null, 2));

    // Call the CGT Model API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    console.log(`📥 API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response Data:', JSON.stringify(data, null, 2));

    // ============================================================================
    // CHECK FOR CLARIFICATION/GAP RESPONSES - Handle MULTIPLE formats from BOTH endpoints
    // ============================================================================
    // IMPORTANT: This block is SKIPPED for re-submissions (isResubmitWithResponses === true).
    // The backend often echoes verification_failed fields even in its final analysis response
    // (after processing the user's answers). If we re-wrap those responses here, the client
    // loops forever. Instead, let the client's own stillNeedsClarification check decide
    // whether a genuine new round of questions is needed.
    //
    // Format 1: { success: false, needs_clarification: true, clarification_questions: [...] }
    // Format 2: { status: 'verification_failed', verification: { clarification_questions: [...] } }
    // Format 3: { needs_clarification: true, clarification_questions: [...] } (success may be undefined)
    // Format 4: { summary: { requires_clarification: true }, ... }
    // Format 5: Has properties with verification_status === 'failed'
    // Format 6: Has gaps array or timeline_gaps

    if (!isResubmitWithResponses) {
      // Check for gap indicators
      const hasFailedProperties = Array.isArray(data.properties) &&
        data.properties.some((p: any) => p.verification_status === 'failed');

      const needsClarification =
        (data.success === false && data.needs_clarification === true) ||
        (data.needs_clarification === true) ||
        (data.status === 'verification_failed') ||
        (data.summary?.requires_clarification === true) ||
        hasFailedProperties;

      // Get clarification questions from various possible locations
      let rawQuestions: any[] =
        data.clarification_questions ||
        data.verification?.clarification_questions ||
        data.gaps ||
        data.timeline_gaps ||
        [];

      // If no questions found but we have failed properties, try to extract from property issues
      if (rawQuestions.length === 0 && hasFailedProperties) {
        console.log('🔍 Extracting questions from failed properties...');
        rawQuestions = [];
        data.properties.forEach((prop: any) => {
          if (prop.verification_status === 'failed' && prop.issues) {
            prop.issues.forEach((issue: any) => {
              rawQuestions.push({
                question: issue.clarification_question || issue.question || issue.message || 'Please clarify this period',
                property_address: prop.property_address || prop.address,
                period: issue.affected_period || issue.period || {},
                options: issue.options || issue.possible_answers || [],
                severity: issue.severity || 'warning'
              });
            });
          }
        });
        console.log(`📋 Extracted ${rawQuestions.length} questions from failed properties`);
      }

      // Also check verification.issues for gap-related issues
      if (rawQuestions.length === 0 && data.verification?.issues?.length > 0) {
        console.log('🔍 Extracting questions from verification.issues...');
        rawQuestions = data.verification.issues
          .filter((issue: any) => issue.type === 'gap' || issue.requires_clarification)
          .map((issue: any) => ({
            question: issue.clarification_question || issue.question || issue.message,
            property_address: issue.property_address,
            period: issue.affected_period || issue.period || {},
            options: issue.options || issue.possible_answers || [],
            severity: issue.severity || 'warning'
          }));
        console.log(`📋 Extracted ${rawQuestions.length} questions from verification.issues`);
      }

      if (needsClarification && rawQuestions.length > 0) {
        console.log('⚠️ Clarification needed:', rawQuestions.length, 'questions');
        console.log('📋 Raw questions format:', JSON.stringify(rawQuestions[0], null, 2));

        // Transform clarification questions to GapQuestionsPanel format
        // Handle different question formats from different endpoints
        const transformedQuestions = rawQuestions.map((q: any) => {
          // Handle period in different formats
          const period = q.period || {};
          const startDate = period.start_date || period.start || '';
          const endDate = period.end_date || period.end || '';
          const days = period.days || 0;

          // Handle property address in different formats
          const propertyAddress = q.property_address ||
            (q.properties_involved && q.properties_involved[0]) ||
            '';

          // Handle properties_involved - might be array or need to create from property_address
          const propertiesInvolved = q.properties_involved ||
            (q.property_address ? [q.property_address] : []);

          return {
            question: q.question || '',
            type: q.type || 'clarification',
            properties_involved: propertiesInvolved,
            period: {
              start: startDate,
              end: endDate,
              days: days
            },
            possible_answers: q.possible_answers || q.options || [],
            severity: q.severity || 'info',
            // Preserve the real gap_id from the backend — this is the matching key for re-submissions.
            // Also expose it as question_id for backwards compatibility with other code paths.
            gap_id: q.gap_id || null,
            question_id: q.question_id || q.gap_id || `${propertyAddress}-${startDate}-${endDate}`
          };
        });

        console.log('📋 Transformed questions:', JSON.stringify(transformedQuestions, null, 2));

        // Transform to verification_failed format for compatibility with CGTAnalysisDisplay
        // Also include the original clarification_questions at top level for extractVerificationAlerts
        return NextResponse.json({
          success: true,
          data: {
            status: 'verification_failed',
            // Include at top level for extractVerificationAlerts compatibility
            clarification_questions: transformedQuestions,
            verification: {
              clarification_questions: transformedQuestions,
              issues: data.verification?.issues || []
            },
            summary: {
              total_properties: transformedQuestions.length,
              requires_clarification: true,
              properties_passed: 0,
              properties_failed: transformedQuestions.length
            },
            // Preserve any analysis text that came with the response
            analysis: data.analysis
          }
        });
      }

      // Handle case where clarification is needed but we couldn't extract specific questions
      if (needsClarification && rawQuestions.length === 0) {
        console.log('⚠️ Clarification needed but no specific questions found - passing through with verification_failed status');

        if (data.status !== 'verification_failed') {
          return NextResponse.json({
            success: true,
            data: {
              ...data,
              status: 'verification_failed',
              summary: {
                ...data.summary,
                requires_clarification: true
              }
            }
          });
        }
      }
    } else {
      console.log('🔄 Re-submission with responses: skipping clarification re-wrapping, passing backend response through directly');
    }

    // Check if the API returned an error response
    if (data.status === 'error') {
      console.error('❌ API returned error status:', data.error);
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Analysis failed',
          errorDetails: data,
        },
        { status: 200 } // Still return 200 since the API call itself succeeded
      );
    }

    // ============================================================================
    // AUTO-SAVE REPORT TO STORAGE
    // ============================================================================
    // Save successful analysis to persistent storage for admin review/verification
    let reportId: string | undefined;

    try {
      // Check if storage is available
      const storageHealth = await checkStorageHealth();

      if (storageHealth.healthy) {
        // Extract timeline data from the payload
        const timelineData = {
          properties: apiPayload.properties || [],
          events: apiPayload.events || [],
          notes: apiPayload.notes || [],
        };

        // Determine source (default to 'app', could be 'admin' or 'api' based on header)
        const source = (request.headers.get('x-report-source') as 'app' | 'admin' | 'api') || 'app';

        // Extract verification prompt from response
        const verificationPrompt = data.verification_prompt ||
          data.data?.verification_prompt ||
          null;

        // Extract net capital gain
        const netCapitalGain = data.total_net_capital_gain ||
          data.data?.total_net_capital_gain ||
          undefined;

        // Create the report
        const report = await createReport({
          timelineData,
          source,
          llmProvider,
          shareId: apiPayload.shareId,
          userEmail: apiPayload.userEmail,
        });

        // Extract session_id for annotation mapping (backend uses this as item_id)
        const sessionId = data.session_id
          || data.data?.session_id
          || data.id
          || data.data?.id
          || null;

        if (sessionId) {
          console.log(`🔑 Session ID extracted: ${sessionId}`);
        } else {
          console.log('⚠️ No session_id found in API response. Keys:', Object.keys(data));
        }

        // Update with analysis results
        await updateReport(report.id, {
          status: 'analyzed',
          analysisResponse: data,
          sessionId,
          verificationPrompt,
          netCapitalGain: netCapitalGain ? parseFloat(netCapitalGain) : undefined,
          analyzedAt: new Date().toISOString(),
        });

        reportId = report.id;
        console.log(`📊 Report saved: ${reportId}`);
      } else {
        console.log('⚠️ Storage not available, skipping report save');
      }
    } catch (saveError) {
      // Don't fail the request if saving fails, just log it
      console.error('⚠️ Failed to save report (non-blocking):', saveError);
    }

    return NextResponse.json({
      success: true,
      data,
      reportId, // Include report ID in response for reference
    });
  } catch (error) {
    console.error('❌ Error calling CGT model API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
