/**
 * Admin Batch Delete API
 *
 * POST - Delete multiple reports at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteReport } from '@/lib/report-storage';

const MAX_BATCH_SIZE = 50;

// Admin authentication check
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminUser = request.headers.get('x-admin-user');
  const adminPass = request.headers.get('x-admin-pass');
  return !!(adminUser && adminPass);
}

/**
 * POST /api/admin/reports/batch-delete
 *
 * Delete multiple reports and their verifications.
 *
 * Body:
 * {
 *   reportIds: string[]  // Max 50 reports
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
    const body = await request.json();

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

    console.log(`🗑️ Starting batch delete for ${body.reportIds.length} reports`);

    const results: { reportId: string; success: boolean; error?: string }[] = [];
    let deleted = 0;
    let failed = 0;

    for (const reportId of body.reportIds) {
      try {
        const success = await deleteReport(reportId);
        if (success) {
          deleted++;
          results.push({ reportId, success: true });
        } else {
          failed++;
          results.push({ reportId, success: false, error: 'Report not found' });
        }
      } catch (err) {
        failed++;
        results.push({
          reportId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ Batch delete complete: ${deleted} deleted, ${failed} failed`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: body.reportIds.length,
        deleted,
        failed,
      },
    });
  } catch (error) {
    console.error('❌ Error in batch delete:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run batch delete',
      },
      { status: 500 }
    );
  }
}
