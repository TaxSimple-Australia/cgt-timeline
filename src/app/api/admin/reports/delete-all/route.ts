/**
 * Admin Delete All Reports API
 *
 * POST - Delete all reports and their verifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteAllReports } from '@/lib/report-storage';

// Admin authentication check
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminUser = request.headers.get('x-admin-user');
  const adminPass = request.headers.get('x-admin-pass');
  return !!(adminUser && adminPass);
}

/**
 * POST /api/admin/reports/delete-all
 *
 * Delete all reports and their verifications.
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🗑️ Starting delete-all reports');

    const { deleted, failed } = await deleteAllReports();

    console.log(`✅ Delete-all complete: ${deleted} deleted, ${failed} failed`);

    return NextResponse.json({
      success: true,
      deleted,
      failed,
    });
  } catch (error) {
    console.error('❌ Error in delete-all:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete all reports',
      },
      { status: 500 }
    );
  }
}
