/**
 * Admin Report Detail API
 *
 * GET    - Get a single report with verifications
 * PATCH  - Update report metadata
 * DELETE - Delete a report and its verifications
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getReport,
  getReportWithVerifications,
  updateReport,
  deleteReport,
} from '@/lib/report-storage';
import type { UpdateReportRequest } from '@/types/cgt-report';

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
 * GET /api/admin/reports/[id]
 *
 * Returns the full report with all verifications populated.
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
    const report = await getReportWithVerifications(id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('❌ Error getting report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get report',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reports/[id]
 *
 * Update report metadata (notes, tags, userEmail).
 *
 * Body:
 * {
 *   notes?: string,
 *   tags?: string[],
 *   userEmail?: string
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json() as UpdateReportRequest;

    // Only allow updating specific fields
    const updates: Partial<UpdateReportRequest> = {};
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.userEmail !== undefined) updates.userEmail = body.userEmail;

    const report = await updateReport(id, updates);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('❌ Error updating report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update report',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reports/[id]
 *
 * Delete a report and all its verifications.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Check if report exists first
    const existing = await getReport(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const deleted = await deleteReport(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Report ${id} deleted successfully`,
    });
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete report',
      },
      { status: 500 }
    );
  }
}
