import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the API URL from environment variables
    const API_URL = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;

    // If API URL is not configured, return error
    if (!API_URL || API_URL === 'YOUR_MODEL_API_URL_HERE') {
      console.error('❌ CGT Model API URL not configured!');
      return NextResponse.json(
        {
          success: false,
          error: 'API URL not configured. Please set NEXT_PUBLIC_CGT_MODEL_API_URL in your .env.local file.',
        },
        { status: 500 }
      );
    }

    console.log(`🔗 Calling CGT Model API: ${API_URL}`);
    console.log('📤 Request payload:', JSON.stringify(body, null, 2));

    // Call your actual model API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers here if needed
        // 'Authorization': `Bearer ${process.env.CGT_MODEL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    console.log(`📥 API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response Data:', JSON.stringify(data, null, 2));

    // Check for clarification needed response
    if (data.success === false && data.needs_clarification === true) {
      console.log('⚠️ Clarification needed:', data.clarification_questions?.length || 0, 'questions');

      // Transform clarification questions to GapQuestionsPanel format
      const transformedQuestions = (data.clarification_questions || []).map((q: any) => ({
        question: q.question,
        type: 'clarification',
        properties_involved: [q.property_address],
        period: {
          start: q.period.start_date,
          end: q.period.end_date,
          days: q.period.days
        },
        possible_answers: q.options || [],
        severity: q.severity || 'info',
        // Generate consistent question_id from property and period if not provided by API
        question_id: q.question_id || `${q.property_address}-${q.period.start_date}-${q.period.end_date}`
      }));

      // Transform to verification_failed format for compatibility with CGTAnalysisDisplay
      return NextResponse.json({
        success: true,
        data: {
          status: 'verification_failed',
          verification: {
            clarification_questions: transformedQuestions,
            issues: [] // Optional: add any general issues
          },
          summary: {
            total_properties: data.clarification_questions?.length || 0,
            requires_clarification: true
          }
        }
      });
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
