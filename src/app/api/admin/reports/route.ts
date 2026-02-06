/**
 * Admin Reports API
 *
 * GET  - List all reports with filtering/pagination
 * POST - Create a new report (with optional auto-analysis)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createReport,
  listReports,
  getReportStats,
  checkStorageHealth,
} from '@/lib/report-storage';
import type {
  CreateReportRequest,
  ReportListFilters,
  PaginationOptions,
  ReportStatus,
} from '@/types/cgt-report';

// Admin authentication check
function isAdminAuthenticated(request: NextRequest): boolean {
  // Check for admin credentials in headers (set by frontend)
  const adminUser = request.headers.get('x-admin-user');
  const adminPass = request.headers.get('x-admin-pass');

  // Simple check - in production, use proper auth
  return !!(adminUser && adminPass);
}

/**
 * GET /api/admin/reports
 *
 * Query Parameters:
 * - status: filter by status (comma-separated for multiple)
 * - source: filter by source (app, admin, api)
 * - llmProvider: filter by provider
 * - dateFrom: filter from date (ISO)
 * - dateTo: filter to date (ISO)
 * - hasVerification: true/false
 * - search: search query
 * - sortBy: createdAt, updatedAt, netCapitalGain, status
 * - sortOrder: asc, desc
 * - page: page number (default 1)
 * - limit: items per page (default 20, max 100)
 * - stats: if true, also return statistics
 */
export async function GET(request: NextRequest) {
  // Check admin auth
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check storage health
    const health = await checkStorageHealth();
    if (!health.healthy) {
      return NextResponse.json(
        { success: false, error: `Storage unavailable: ${health.error}` },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters: ReportListFilters = {};

    const status = searchParams.get('status');
    if (status) {
      const statuses = status.split(',') as ReportStatus[];
      filters.status = statuses.length === 1 ? statuses[0] : statuses;
    }

    const source = searchParams.get('source');
    if (source && ['app', 'admin', 'api'].includes(source)) {
      filters.source = source as 'app' | 'admin' | 'api';
    }

    const llmProvider = searchParams.get('llmProvider');
    if (llmProvider) {
      filters.llmProvider = llmProvider;
    }

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = dateTo;
    }

    const hasVerification = searchParams.get('hasVerification');
    if (hasVerification !== null) {
      filters.hasVerification = hasVerification === 'true';
    }

    const search = searchParams.get('search');
    if (search) {
      filters.searchQuery = search;
    }

    const sortBy = searchParams.get('sortBy');
    if (sortBy && ['createdAt', 'updatedAt', 'netCapitalGain', 'status'].includes(sortBy)) {
      filters.sortBy = sortBy as ReportListFilters['sortBy'];
    }

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      filters.sortOrder = sortOrder as 'asc' | 'desc';
    }

    // Parse pagination
    const pagination: PaginationOptions = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    // Fetch reports
    const result = await listReports(filters, pagination);

    // Optionally include stats
    const includeStats = searchParams.get('stats') === 'true';
    let stats = null;
    if (includeStats) {
      stats = await getReportStats();
    }

    return NextResponse.json({
      success: true,
      ...result,
      stats,
    });
  } catch (error) {
    console.error('❌ Error listing reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list reports',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reports
 *
 * Create a new report.
 *
 * Body:
 * {
 *   timelineData: { properties, events, notes? },
 *   source: 'app' | 'admin' | 'api',
 *   llmProvider: string,
 *   shareId?: string,
 *   userEmail?: string,
 *   notes?: string,
 *   tags?: string[],
 *   runAnalysis?: boolean  // If true, trigger analysis immediately
 * }
 */
export async function POST(request: NextRequest) {
  // Check admin auth
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as CreateReportRequest;

    // Validate required fields
    if (!body.timelineData) {
      return NextResponse.json(
        { success: false, error: 'timelineData is required' },
        { status: 400 }
      );
    }

    if (!body.timelineData.properties || !body.timelineData.events) {
      return NextResponse.json(
        { success: false, error: 'timelineData must include properties and events' },
        { status: 400 }
      );
    }

    if (!body.source) {
      return NextResponse.json(
        { success: false, error: 'source is required' },
        { status: 400 }
      );
    }

    if (!body.llmProvider) {
      return NextResponse.json(
        { success: false, error: 'llmProvider is required' },
        { status: 400 }
      );
    }

    // Create the report
    const report = await createReport(body);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('❌ Error creating report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create report',
      },
      { status: 500 }
    );
  }
}
