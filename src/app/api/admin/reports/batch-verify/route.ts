/**
 * Admin Batch Verification API
 *
 * POST - Run CCH verification on multiple reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport, updateReport, createVerification } from '@/lib/report-storage';
import type {
  BatchVerificationRequest,
  BatchVerificationResult,
  BatchVerificationResponse,
  VerificationRecord,
  VerificationStatus,
} from '@/types/cgt-report';

const CCH_API_URL = 'https://cch.cgtbrain.com.au';
const MAX_BATCH_SIZE = 20;

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

  if (response.query) {
    lines.push('QUERY:');
    lines.push(response.query);
    lines.push('');
  }

  if (data.timeline_understanding) {
    lines.push('TIMELINE UNDERSTANDING:');
    lines.push(data.timeline_understanding);
    lines.push('');
  }

  for (const property of properties) {
    lines.push('='.repeat(60));
    lines.push(`PROPERTY: ${property.property_address || 'Unknown Address'}`);
    lines.push('='.repeat(60));
    lines.push('');

    if (property.timeline && property.timeline.length > 0) {
      lines.push('TIMELINE OF EVENTS:');
      lines.push('-'.repeat(40));
      for (const event of property.timeline) {
        lines.push(`• ${event.date}: ${event.event} - ${event.details}`);
      }
      lines.push('');
    }

    if (property.ownership_periods && property.ownership_periods.length > 0) {
      lines.push('OWNERSHIP PERIOD CLASSIFICATIONS:');
      lines.push('-'.repeat(40));
      for (const period of property.ownership_periods) {
        const percentage = period.percentage ? ` (${period.percentage}%)` : '';
        lines.push(`• ${period.period_type}: ${period.start_date} to ${period.end_date} = ${period.days} days${percentage}`);
      }
      lines.push('');
    }

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

    if (property.calculation_summary) {
      const summary = property.calculation_summary;
      lines.push('CALCULATION SUMMARY:');
      lines.push('-'.repeat(40));
      if (summary.net_capital_gain) {
        lines.push(`NET CAPITAL GAIN: ${parseFloat(summary.net_capital_gain).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
      }
      lines.push('');
    }

    if (property.result) {
      lines.push('FINAL RESULT:');
      lines.push('-'.repeat(40));
      lines.push(property.result);
      lines.push('');
    }
  }

  if (properties.length > 0 && data.total_net_capital_gain) {
    lines.push('='.repeat(60));
    lines.push('PORTFOLIO SUMMARY');
    lines.push('='.repeat(60));
    lines.push(`Total Net Capital Gain: ${parseFloat(data.total_net_capital_gain).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}`);
  }

  return lines.join('\n');
}

/**
 * Verify a single report (internal helper)
 */
async function verifySingleReport(reportId: string): Promise<BatchVerificationResult> {
  const startTime = Date.now();

  try {
    const report = await getReport(reportId);

    if (!report) {
      return {
        reportId,
        success: false,
        error: 'Report not found',
      };
    }

    if (!report.analysisResponse) {
      return {
        reportId,
        success: false,
        error: 'Report has not been analyzed',
      };
    }

    const verificationPrompt = report.verificationPrompt ||
      report.analysisResponse?.verification_prompt ||
      report.analysisResponse?.data?.verification_prompt;

    if (!verificationPrompt) {
      return {
        reportId,
        success: false,
        error: 'No verification prompt available',
      };
    }

    const formattedScenario = formatVerificationPrompt(verificationPrompt);
    const formattedOurAnswer = extractOurAnswer(report.analysisResponse);

    if (!formattedOurAnswer || formattedOurAnswer === 'No property analysis data available.') {
      return {
        reportId,
        success: false,
        error: 'No analysis data for comparison',
      };
    }

    // Update status
    await updateReport(reportId, { status: 'verifying' });

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
        signal: AbortSignal.timeout(180000),
      });

      if (!cchResponse.ok) {
        const errorText = await cchResponse.text();
        verificationStatus = cchResponse.status === 408 ? 'timeout' : 'error';
        errorMessage = `CCH API returned ${cchResponse.status}`;
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
        errorMessage = 'CCH timeout (>3 minutes)';
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
      verifiedBy: 'batch',
      duration,
      ourAnswer: formattedOurAnswer,
      scenario: formattedScenario,
      status: verificationStatus,
      errorMessage,
    };

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

    const verification = await createVerification(reportId, verificationData);

    if (!verification) {
      return {
        reportId,
        success: false,
        error: 'Failed to save verification',
        duration,
      };
    }

    return {
      reportId,
      success: verificationStatus === 'success',
      verificationId: verification.id,
      alignment: verification.comparison?.overallAlignment,
      matchPercentage: verification.comparison?.matchPercentage,
      error: errorMessage,
      duration,
    };
  } catch (error) {
    return {
      reportId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * POST /api/admin/reports/batch-verify
 *
 * Run CCH verification on multiple reports.
 * Reports are verified sequentially to avoid overwhelming the CCH API.
 *
 * Body:
 * {
 *   reportIds: string[]  // Max 20 reports
 * }
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as BatchVerificationRequest;

    if (!body.reportIds || !Array.isArray(body.reportIds)) {
      return NextResponse.json(
        { success: false, error: 'reportIds array is required' },
        { status: 400 }
      );
    }

    if (body.reportIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one report ID is required' },
        { status: 400 }
      );
    }

    if (body.reportIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, error: `Maximum batch size is ${MAX_BATCH_SIZE} reports` },
        { status: 400 }
      );
    }

    console.log(`📦 Starting batch verification for ${body.reportIds.length} reports`);

    // Process reports sequentially
    const results: BatchVerificationResult[] = [];
    let successful = 0;
    let failed = 0;
    let highAlignment = 0;
    let mediumAlignment = 0;
    let lowAlignment = 0;

    for (const reportId of body.reportIds) {
      console.log(`🔄 Verifying report ${reportId} (${results.length + 1}/${body.reportIds.length})`);

      const result = await verifySingleReport(reportId);
      results.push(result);

      if (result.success) {
        successful++;
        if (result.alignment === 'high') highAlignment++;
        else if (result.alignment === 'medium') mediumAlignment++;
        else if (result.alignment === 'low') lowAlignment++;
      } else {
        failed++;
      }

      // Small delay between requests to be nice to CCH API
      if (results.length < body.reportIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const response: BatchVerificationResponse = {
      results,
      summary: {
        total: body.reportIds.length,
        successful,
        failed,
        highAlignment,
        mediumAlignment,
        lowAlignment,
      },
      completedAt: new Date().toISOString(),
    };

    console.log(`✅ Batch verification complete:`, response.summary);

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('❌ Error in batch verification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run batch verification',
      },
      { status: 500 }
    );
  }
}
