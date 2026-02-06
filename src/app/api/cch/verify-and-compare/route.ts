import { NextRequest, NextResponse } from 'next/server';

const CCH_API_URL = 'https://cch.cgtbrain.com.au';

/**
 * Formats the verification prompt by removing escape characters, line feeds,
 * and special characters to ensure it can be pasted cleanly into CCH chat.
 */
function formatVerificationPrompt(prompt: string): string {
  if (!prompt) return '';

  return prompt
    // Remove literal \n and \r escape sequences
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    // Replace actual newlines with spaces
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    // Replace tabs with spaces
    .replace(/\t/g, ' ')
    // Remove markdown headers but keep the text
    .replace(/#{1,6}\s*/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();
}

/**
 * Extracts the answer text from our AI response for comparison
 */
function extractOurAnswer(response: any): string {
  // Handle different response formats
  if (!response) return '';

  // If there's a direct answer field
  if (response.answer) return response.answer;

  // If there's analysis data with properties
  const analysisData = response.data?.data || response.data || response;

  if (analysisData?.properties && Array.isArray(analysisData.properties)) {
    const parts: string[] = [];

    for (const prop of analysisData.properties) {
      parts.push(`Property: ${prop.property_address || 'Unknown'}`);

      if (prop.calculation_summary) {
        const summary = prop.calculation_summary;
        parts.push(`Sale Price: ${summary.sale_price}`);
        parts.push(`Total Cost Base: ${summary.total_cost_base}`);
        parts.push(`Gross Capital Gain: ${summary.gross_capital_gain}`);
        parts.push(`Main Residence Exemption: ${summary.main_residence_exemption_percentage}%`);
        parts.push(`Taxable Capital Gain: ${summary.taxable_capital_gain}`);
        if (summary.cgt_discount_applicable) {
          parts.push(`CGT Discount: ${summary.cgt_discount_percentage}%`);
        }
        parts.push(`Net Capital Gain: ${summary.net_capital_gain}`);
      }

      if (prop.result) {
        parts.push(`Result: ${prop.result}`);
      }
    }

    return parts.join(' | ');
  }

  return '';
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
        our_answer: formattedOurAnswer,
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
