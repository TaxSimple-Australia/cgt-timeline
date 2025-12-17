import { NextRequest, NextResponse } from 'next/server';

// API Response Mode type
type APIResponseMode = 'markdown' | 'json';

// Endpoint paths for each mode
const ENDPOINT_PATHS: Record<APIResponseMode, string> = {
  markdown: '/api/v1/analyze-portfolio',
  json: '/api/v1/analyze-portfolio-json',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract the response mode from the request (default to 'json' for better display)
    const responseMode: APIResponseMode = body.responseMode || 'json';

    // Remove responseMode from the payload before sending to external API
    const { responseMode: _, ...apiPayload } = body;

    // Get the base API URL from environment variables
    let API_BASE_URL = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;

    // If API URL is not configured, return error
    if (!API_BASE_URL || API_BASE_URL === 'YOUR_MODEL_API_URL_HERE') {
      console.error('❌ CGT Model API URL not configured!');
      return NextResponse.json(
        {
          success: false,
          error: 'API URL not configured. Please set NEXT_PUBLIC_CGT_MODEL_API_URL in your .env.local file.',
        },
        { status: 500 }
      );
    }

    // Extract base URL (remove any existing endpoint path)
    // e.g., https://cgtbrain.com.au/api/v1/analyze-portfolio → https://cgtbrain.com.au
    const urlObj = new URL(API_BASE_URL);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Construct the full URL with the correct endpoint based on response mode
    const endpointPath = ENDPOINT_PATHS[responseMode];
    const API_URL = `${baseUrl}${endpointPath}`;

    console.log(`🔗 API Response Mode: ${responseMode}`);
    console.log(`🔗 Calling CGT Model API: ${API_URL}`);
    console.log('📤 Request payload:', JSON.stringify(apiPayload, null, 2));

    // Call your actual model API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers here if needed
        // 'Authorization': `Bearer ${process.env.CGT_MODEL_API_KEY}`,
      },
      body: JSON.stringify(apiPayload),
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
    // Format 1: { success: false, needs_clarification: true, clarification_questions: [...] }
    // Format 2: { status: 'verification_failed', verification: { clarification_questions: [...] } }
    // Format 3: { needs_clarification: true, clarification_questions: [...] } (success may be undefined)
    // Format 4: { summary: { requires_clarification: true }, ... }
    // Format 5: Has properties with verification_status === 'failed'
    // Format 6: Has gaps array or timeline_gaps

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
          // Generate consistent question_id from property and period if not provided by API
          question_id: q.question_id || `${propertyAddress}-${startDate}-${endDate}`
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
    // This ensures the UI still knows there's an issue that needs attention
    if (needsClarification && rawQuestions.length === 0) {
      console.log('⚠️ Clarification needed but no specific questions found - passing through with verification_failed status');

      // If the response already has status: 'verification_failed', pass it through
      // Otherwise, wrap it to ensure the UI can handle it
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

    return NextResponse.json({
      success: true,
      data,
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
