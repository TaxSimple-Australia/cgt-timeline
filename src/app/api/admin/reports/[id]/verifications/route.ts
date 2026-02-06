/**
 * Admin Report Verifications History API
 *
 * GET - Get all verifications for a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport, getVerificationHistory } from '@/lib/report-storage';

// Admin authentication check
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminUser = request.headers.get('x-admin-user');
  const adminPass = request.headers.get('x-admin-pass');
  return !!(adminUser && adminPass);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/reports/[id]/verifications
 *
 * Returns all verification records for a report, sorted newest first.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Check if report exists
    const report = await getReport(id);
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const verifications = await getVerificationHistory(id);

    return NextResponse.json({
      success: true,
      reportId: id,
      verifications,
      total: verifications.length,
    });
  } catch (error) {
    console.error('❌ Error getting verifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get verifications',
      },
      { status: 500 }
    );
  }
}
