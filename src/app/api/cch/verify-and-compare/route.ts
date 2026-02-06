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
 * Converts our AI response JSON into a human-readable text format for comparison.
 * This makes it easier for the comparison LLM to understand and compare against CCH's response.
 */
function extractOurAnswer(response: any): string {
  if (!response) return '';

  const data = response.data || response;
  const properties = data.properties || [];

  if (properties.length === 0) {
    return 'No property analysis data available.';
  }

  const lines: string[] = [];

  // Add query/question if available
  if (response.query) {
    lines.push('QUERY:');
    lines.push(response.query);
    lines.push('');
  }

  // Add timeline understanding if available
  if (data.timeline_understanding) {
    lines.push('TIMELINE UNDERSTANDING:');
    lines.push(data.timeline_understanding);
    lines.push('');
  }

  // Process each property
  for (const property of properties) {
    lines.push('='.repeat(60));
    lines.push(`PROPERTY: ${property.property_address || 'Unknown Address'}`);
    lines.push('='.repeat(60));
    lines.push('');

    // Timeline of Events
    if (property.timeline && property.timeline.length > 0) {
      lines.push('TIMELINE OF EVENTS:');
      lines.push('-'.repeat(40));
      for (const event of property.timeline) {
        lines.push(`• ${event.date}: ${event.event} - ${event.details}`);
      }
      lines.push('');
    }

    // Ownership Periods
    if (property.ownership_periods && property.ownership_periods.length > 0) {
      lines.push('OWNERSHIP PERIOD CLASSIFICATIONS:');
      lines.push('-'.repeat(40));
      for (const period of property.ownership_periods) {
        const percentage = period.percentage ? ` (${period.percentage}%)` : '';
        lines.push(`• ${period.period_type}: ${period.start_date} to ${period.end_date} = ${period.days} days${percentage}`);
        if (period.note) {
          lines.push(`  Reference: ${period.note}`);
        }
      }
      lines.push('');
    }

    // Cost Base Items
    if (property.cost_base_items && property.cost_base_items.length > 0) {
      lines.push('COST BASE BREAKDOWN:');
      lines.push('-'.repeat(40));
      for (const item of property.cost_base_items) {
        const amount = parseFloat(item.amount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
        lines.push(`• ${item.description}: ${amount}`);
      }
      if (property.total_cost_base) {
        const total = parseFloat(property.total_cost_base).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
        lines.push(`TOTAL COST BASE: ${total}`);
      }
      lines.push('');
    }

    // Calculation Steps
    if (property.calculation_steps && property.calculation_steps.length > 0) {
      lines.push('STEP-BY-STEP CALCULATION:');
      lines.push('-'.repeat(40));
      for (const step of property.calculation_steps) {
        lines.push(`Step ${step.step_number}: ${step.title}`);
        lines.push(`  ${step.description}`);
        if (step.calculation) {
          lines.push(`  Calculation: ${step.calculation}`);
        }
        lines.push(`  Result: ${step.result}`);
        lines.push('');
      }
    }

    // Calculation Summary
    if (property.calculation_summary) {
      const summary = property.calculation_summary;
      lines.push('CALCULATION SUMMARY:');
      lines.push('-'.repeat(40));

      if (summary.sale_price) {
        lines.push(`Sale Price: ${parseFloat(summary.sale_price).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      if (summary.total_cost_base) {
        lines.push(`Total Cost Base: ${parseFloat(summary.total_cost_base).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      if (summary.gross_capital_gain) {
        lines.push(`Gross Capital Gain: ${parseFloat(summary.gross_capital_gain).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      if (summary.main_residence_exemption_percentage) {
        lines.push(`Main Residence Exemption: ${summary.main_residence_exemption_percentage}%`);
      }
      if (summary.main_residence_exemption_amount) {
        lines.push(`Exempt Amount: ${parseFloat(summary.main_residence_exemption_amount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      if (summary.taxable_capital_gain) {
        lines.push(`Taxable Capital Gain: ${parseFloat(summary.taxable_capital_gain).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      if (summary.cgt_discount_applicable) {
        lines.push(`CGT Discount: ${summary.cgt_discount_percentage}% (held > 12 months)`);
      }
      if (summary.cgt_discount_amount) {
        lines.push(`Discount Amount: ${parseFloat(summary.cgt_discount_amount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      if (summary.net_capital_gain) {
        lines.push(`NET CAPITAL GAIN: ${parseFloat(summary.net_capital_gain).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      lines.push('');
    }

    // Result
    if (property.result) {
      lines.push('FINAL RESULT:');
      lines.push('-'.repeat(40));
      lines.push(property.result);
      lines.push('');
    }

    // Important Notes
    if (property.important_notes && property.important_notes.length > 0) {
      lines.push('IMPORTANT NOTES:');
      lines.push('-'.repeat(40));
      for (const note of property.important_notes) {
        lines.push(`• ${note}`);
      }
      lines.push('');
    }
  }

  // Total summary across all properties
  if (properties.length > 0) {
    lines.push('='.repeat(60));
    lines.push('PORTFOLIO SUMMARY');
    lines.push('='.repeat(60));
    if (data.total_net_capital_gain) {
      lines.push(`Total Net Capital Gain: ${parseFloat(data.total_net_capital_gain).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
    }
    if (data.total_gross_gains) {
      lines.push(`Total Gross Gains: ${parseFloat(data.total_gross_gains).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
    }
    if (data.properties_with_cgt !== undefined) {
      lines.push(`Properties with CGT Payable: ${data.properties_with_cgt}`);
    }
    if (data.properties_fully_exempt !== undefined) {
      lines.push(`Properties Fully Exempt: ${data.properties_fully_exempt}`);
    }
  }

  // Sources/References
  if (response.sources?.references && response.sources.references.length > 0) {
    lines.push('');
    lines.push('REFERENCES:');
    lines.push('-'.repeat(40));
    for (const ref of response.sources.references) {
      lines.push(`• ${ref.title} (${ref.source_document})`);
    }
  }

  // Rules Summary
  if (response.sources?.rules_summary) {
    lines.push('');
    lines.push('RULES APPLIED:');
    lines.push('-'.repeat(40));
    lines.push(response.sources.rules_summary);
  }

  return lines.join('\n');
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
