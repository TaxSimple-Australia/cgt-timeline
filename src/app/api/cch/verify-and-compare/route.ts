import { NextRequest, NextResponse } from 'next/server';

const CCH_API_URL = 'https://cch.cgtbrain.com.au';

/**
 * Prepares the verification prompt for sending to CCH.
 * Sends the full prompt without aggressive formatting to preserve all content.
 */
function formatVerificationPrompt(prompt: string): string {
  if (!prompt) return '';

  // Only do minimal cleanup - preserve the full content
  return prompt
    // Remove leading/trailing whitespace only
    .trim();
}

/**
 * Extracts the full AI response (excluding verification_prompt) for comparison.
 * Returns the complete response JSON as a string so CCH can compare against our full analysis.
 */
function extractOurAnswer(response: any): string {
  if (!response) return '';

  // Create a deep copy and remove the verification_prompt field
  const responseCopy = JSON.parse(JSON.stringify(response));

  // Remove verification_prompt from various possible locations
  delete responseCopy.verification_prompt;
  if (responseCopy.data) {
    delete responseCopy.data.verification_prompt;
    if (responseCopy.data.data) {
      delete responseCopy.data.data.verification_prompt;
    }
  }

  // Return the full response as JSON string
  return JSON.stringify(responseCopy, null, 2);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { our_answer, scenario, timeline, ai_response } = body;

    // If ai_response is provided, extract verification_prompt and our_answer from it
    let formattedScenario = scenario;
    let formattedOurAnswer = our_answer;

    if (ai_response) {
      // Extract verification_prompt from the AI response
      const verificationPrompt = ai_response.verification_prompt ||
                                  ai_response.data?.verification_prompt ||
                                  scenario;

      formattedScenario = formatVerificationPrompt(verificationPrompt);
      formattedOurAnswer = our_answer || extractOurAnswer(ai_response);
    } else {
      formattedScenario = formatVerificationPrompt(scenario);
    }

    if (!formattedScenario) {
      return NextResponse.json(
        { success: false, error: 'Scenario/verification prompt is required' },
        { status: 400 }
      );
    }

    if (!formattedOurAnswer) {
      return NextResponse.json(
        { success: false, error: 'Our answer is required for comparison' },
        { status: 400 }
      );
    }

    console.log('📤 Sending to CCH API:', {
      scenario_length: formattedScenario.length,
      our_answer_length: formattedOurAnswer.length,
      has_timeline: !!timeline && timeline.length > 0
    });

    // Call the CCH API
    const cchResponse = await fetch(`${CCH_API_URL}/api/cch/verify-and-compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: formattedOurAnswer,
        verification_prompt: formattedScenario,
        timeline: timeline || []
      }),
      // Set a long timeout since CCH can take 2+ minutes
      signal: AbortSignal.timeout(180000) // 3 minutes
    });

    if (!cchResponse.ok) {
      const errorText = await cchResponse.text();
      console.error('❌ CCH API error:', cchResponse.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `CCH API returned ${cchResponse.status}`,
          code: cchResponse.status === 408 ? 'CCH_TIMEOUT' : 'CCH_ERROR',
          details: errorText
        },
        { status: cchResponse.status }
      );
    }

    const cchData = await cchResponse.json();
    console.log('📥 CCH API response received:', {
      success: cchData.success,
      has_comparison: !!cchData.comparison
    });

    return NextResponse.json({
      success: true,
      ...cchData,
      formatted_scenario: formattedScenario, // Include the formatted scenario for reference
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CCH verification error:', error);

    // Handle timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          success: false,
          error: 'CCH took too long to respond. Please try again.',
          code: 'CCH_TIMEOUT'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// Health check for CCH service
export async function GET() {
  try {
    const response = await fetch(`${CCH_API_URL}/api/health`, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'CCH service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      status: 'ok',
      cch_status: data
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to reach CCH service' },
      { status: 503 }
    );
  }
}
