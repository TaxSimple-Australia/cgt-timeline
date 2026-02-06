/**
 * Admin Report Verification API
 *
 * POST - Run CCH verification on a report
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getReport,
  updateReport,
  createVerification,
} from '@/lib/report-storage';
import type { VerificationRecord, VerificationStatus } from '@/types/cgt-report';

const CCH_API_URL = 'https://cch.cgtbrain.com.au';

// Admin authentication check
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminUser = request.headers.get('x-admin-user');
  const adminPass = request.headers.get('x-admin-pass');
  return !!(adminUser && adminPass);
}

/**
 * Prepares the verification prompt for sending to CCH.
 */
function formatVerificationPrompt(prompt: string): string {
  if (!prompt) return '';
  return prompt.trim();
}

/**
 * Converts AI response JSON into human-readable text format for comparison.
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
  }

  return lines.join('\n');
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/reports/[id]/verify
 *
 * Run CCH verification on a stored report.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    const { id } = await params;
    const report = await getReport(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if report has been analyzed
    if (!report.analysisResponse) {
      return NextResponse.json(
        { success: false, error: 'Report has not been analyzed yet. Cannot verify.' },
        { status: 400 }
      );
    }

    // Get verification prompt and our answer
    const verificationPrompt = report.verificationPrompt ||
      report.analysisResponse?.verification_prompt ||
      report.analysisResponse?.data?.verification_prompt;

    if (!verificationPrompt) {
      return NextResponse.json(
        { success: false, error: 'No verification prompt available for this report' },
        { status: 400 }
      );
    }

    const formattedScenario = formatVerificationPrompt(verificationPrompt);
    const formattedOurAnswer = extractOurAnswer(report.analysisResponse);

    if (!formattedOurAnswer || formattedOurAnswer === 'No property analysis data available.') {
      return NextResponse.json(
        { success: false, error: 'No analysis data available for comparison' },
        { status: 400 }
      );
    }

    // Update report status to verifying
    await updateReport(id, { status: 'verifying' });

    console.log(`📤 Verifying report ${id}:`, {
      scenario_length: formattedScenario.length,
      our_answer_length: formattedOurAnswer.length,
    });

    // Call CCH API
    let cchData: any;
    let verificationStatus: VerificationStatus = 'success';
    let errorMessage: string | undefined;

    try {
      const cchResponse = await fetch(`${CCH_API_URL}/api/cch/verify-and-compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: formattedOurAnswer,
          verification_prompt: formattedScenario,
          timeline: [],
        }),
        signal: AbortSignal.timeout(180000), // 3 minutes
      });

      if (!cchResponse.ok) {
        const errorText = await cchResponse.text();
        console.error(`❌ CCH API error for report ${id}:`, cchResponse.status, errorText);

        verificationStatus = cchResponse.status === 408 ? 'timeout' : 'error';
        errorMessage = `CCH API returned ${cchResponse.status}: ${errorText}`;
        cchData = null;
      } else {
        cchData = await cchResponse.json();

        if (!cchData.success) {
          verificationStatus = 'failed';
          errorMessage = cchData.error || 'CCH verification failed';
        }
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'TimeoutError') {
        verificationStatus = 'timeout';
        errorMessage = 'CCH took too long to respond (>3 minutes)';
      } else {
        verificationStatus = 'error';
        errorMessage = fetchError instanceof Error ? fetchError.message : 'Network error';
      }
      cchData = null;
    }

    const duration = Date.now() - startTime;

    // Create verification record
    const verificationData: Omit<VerificationRecord, 'id' | 'reportId'> = {
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'admin',
      duration,
      ourAnswer: formattedOurAnswer,
      scenario: formattedScenario,
      status: verificationStatus,
      errorMessage,
    };

    // Add CCH response if available
    if (cchData && cchData.success) {
      verificationData.cchResponse = {
        text: cchData.cch_response?.text || '',
        sources: cchData.cch_response?.sources || [],
        queriedAt: cchData.cch_response?.queried_at || new Date().toISOString(),
      };

      if (cchData.comparison) {
        verificationData.comparison = {
          overallAlignment: cchData.comparison.overall_alignment,
          confidenceScore: cchData.comparison.confidence_score,
          matchPercentage: cchData.comparison.match_percentage,
          checkboxes: {
            scenarioMatch: cchData.comparison.checkboxes?.scenario_match ?? false,
            timelineMatch: cchData.comparison.checkboxes?.timeline_match ?? false,
            ownershipMatch: cchData.comparison.checkboxes?.ownership_match ?? false,
            costBaseMatch: cchData.comparison.checkboxes?.cost_base_match ?? false,
            rulesMatch: cchData.comparison.checkboxes?.rules_match ?? false,
            calculationMatch: cchData.comparison.checkboxes?.calculation_match ?? false,
          },
          ourNetCgt: cchData.comparison.our_net_cgt,
          externalNetCgt: cchData.comparison.external_net_cgt,
          calculationDifference: cchData.comparison.calculation_difference,
          keyDifferences: cchData.comparison.key_differences || [],
          externalLlmErrors: cchData.comparison.external_llm_errors || [],
          summary: cchData.comparison.summary || '',
        };
      }
    }

    // Create verification record in storage
    const verification = await createVerification(id, verificationData);

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Failed to save verification record' },
        { status: 500 }
      );
    }

    console.log(`✅ Verification complete for report ${id}:`, {
      status: verificationStatus,
      alignment: verification.comparison?.overallAlignment,
      matchPercentage: verification.comparison?.matchPercentage,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      verification,
    });
  } catch (error) {
    console.error('❌ Error verifying report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify report',
      },
      { status: 500 }
    );
  }
}
