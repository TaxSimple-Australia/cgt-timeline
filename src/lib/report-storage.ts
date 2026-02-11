/**
 * Report Storage Library
 *
 * Handles persistent storage of CGT reports and verification records
 * using Vercel KV (Upstash Redis).
 */

import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import type {
  CGTReport,
  CGTReportSummary,
  CGTReportWithVerifications,
  VerificationRecord,
  VerificationReview,
  ReportListFilters,
  PaginationOptions,
  PaginatedResponse,
  CreateReportRequest,
  UpdateReportRequest,
  ReportStats,
  ReportStatus,
  REPORT_STORAGE,
} from '@/types/cgt-report';

// Storage constants
const STORAGE = {
  REPORT_KEY: 'cgt_report:',
  VERIFICATION_KEY: 'cgt_verification:',
  REPORTS_INDEX: 'cgt_reports_index',
  REPORTS_BY_STATUS: 'cgt_reports_by_status:',
  MAX_REPORTS: 10000,
  MAX_BATCH_SIZE: 20,
  REPORT_TTL: 365 * 24 * 60 * 60,      // 1 year
  VERIFICATION_TTL: 365 * 24 * 60 * 60, // 1 year
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Initialize Redis client
function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

// ============================================
// ID Generation
// ============================================

export function generateReportId(): string {
  return `report_${nanoid(12)}`;
}

export function generateVerificationId(): string {
  return `verif_${nanoid(12)}`;
}

// ============================================
// Report CRUD Operations
// ============================================

/**
 * Create a new CGT report
 */
export async function createReport(data: CreateReportRequest): Promise<CGTReport> {
  const redis = getRedis();
  const now = new Date().toISOString();
  const id = generateReportId();

  // Extract summary info from timeline data
  const properties = data.timelineData.properties || [];
  const events = data.timelineData.events || [];
  const primaryProperty = properties[0];

  const report: CGTReport = {
    id,
    createdAt: now,
    updatedAt: now,
    source: data.source,
    llmProvider: data.llmProvider,
    status: 'pending',
    timelineData: data.timelineData,
    shareId: data.shareId,
    verificationIds: [],
    verificationCount: 0,
    propertyCount: properties.length,
    eventCount: events.length,
    primaryPropertyAddress: primaryProperty?.address || primaryProperty?.name,
    userEmail: data.userEmail,
    notes: data.notes,
    tags: data.tags,
  };

  // Store report
  await redis.set(
    `${STORAGE.REPORT_KEY}${id}`,
    JSON.stringify(report),
    { ex: STORAGE.REPORT_TTL }
  );

  // Add to index (prepend for newest first)
  const index = await redis.get<string[]>(STORAGE.REPORTS_INDEX) || [];
  index.unshift(id);

  // Trim if over limit
  if (index.length > STORAGE.MAX_REPORTS) {
    const removedIds = index.splice(STORAGE.MAX_REPORTS);
    // Clean up old reports
    for (const oldId of removedIds) {
      await deleteReport(oldId);
    }
  }

  await redis.set(STORAGE.REPORTS_INDEX, JSON.stringify(index));

  // Add to status index
  await addToStatusIndex(id, 'pending');

  console.log(`✅ Report created: ${id}`, {
    source: report.source,
    provider: report.llmProvider,
    properties: report.propertyCount,
    events: report.eventCount,
  });

  return report;
}

/**
 * Get a single report by ID
 */
export async function getReport(id: string): Promise<CGTReport | null> {
  const redis = getRedis();
  const data = await redis.get<string>(`${STORAGE.REPORT_KEY}${id}`);

  if (!data) return null;

  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * Get a report with all its verifications populated
 */
export async function getReportWithVerifications(id: string): Promise<CGTReportWithVerifications | null> {
  const report = await getReport(id);
  if (!report) return null;

  const verifications = await getVerificationHistory(id);

  return {
    ...report,
    verifications,
  };
}

/**
 * Update a report
 */
export async function updateReport(
  id: string,
  updates: Partial<CGTReport>
): Promise<CGTReport | null> {
  const redis = getRedis();
  const report = await getReport(id);

  if (!report) return null;

  const oldStatus = report.status;
  const updatedReport: CGTReport = {
    ...report,
    ...updates,
    id, // Prevent ID from being changed
    createdAt: report.createdAt, // Prevent creation date from being changed
    updatedAt: new Date().toISOString(),
  };

  await redis.set(
    `${STORAGE.REPORT_KEY}${id}`,
    JSON.stringify(updatedReport),
    { ex: STORAGE.REPORT_TTL }
  );

  // Update status index if status changed
  if (updates.status && updates.status !== oldStatus) {
    await removeFromStatusIndex(id, oldStatus);
    await addToStatusIndex(id, updates.status);
  }

  return updatedReport;
}

/**
 * Delete a report and its verifications
 */
export async function deleteReport(id: string): Promise<boolean> {
  const redis = getRedis();
  const report = await getReport(id);

  if (!report) return false;

  // Delete all verifications
  for (const verifId of report.verificationIds) {
    await redis.del(`${STORAGE.VERIFICATION_KEY}${verifId}`);
  }

  // Delete report
  await redis.del(`${STORAGE.REPORT_KEY}${id}`);

  // Remove from main index
  const index = await redis.get<string[]>(STORAGE.REPORTS_INDEX) || [];
  const newIndex = index.filter(rid => rid !== id);
  await redis.set(STORAGE.REPORTS_INDEX, JSON.stringify(newIndex));

  // Remove from status index
  await removeFromStatusIndex(id, report.status);

  console.log(`🗑️ Report deleted: ${id}`);

  return true;
}

/**
 * List reports with filtering and pagination
 */
export async function listReports(
  filters: ReportListFilters = {},
  pagination: PaginationOptions = { page: 1, limit: STORAGE.DEFAULT_PAGE_SIZE }
): Promise<PaginatedResponse<CGTReportSummary>> {
  const redis = getRedis();

  // Clamp pagination values
  const page = Math.max(1, pagination.page);
  const limit = Math.min(STORAGE.MAX_PAGE_SIZE, Math.max(1, pagination.limit));

  // Get all report IDs
  let reportIds = await redis.get<string[]>(STORAGE.REPORTS_INDEX) || [];

  // If filtering by status, use status index for efficiency
  if (filters.status && !Array.isArray(filters.status)) {
    const statusIndex = await redis.get<string[]>(
      `${STORAGE.REPORTS_BY_STATUS}${filters.status}`
    ) || [];
    reportIds = reportIds.filter(id => statusIndex.includes(id));
  }

  // Fetch all reports for filtering
  const reports: CGTReport[] = [];
  for (const id of reportIds) {
    const report = await getReport(id);
    if (report) {
      reports.push(report);
    }
  }

  // Apply filters
  let filtered = reports.filter(report => {
    // Status filter (array)
    if (filters.status && Array.isArray(filters.status)) {
      if (!filters.status.includes(report.status)) return false;
    }

    // Source filter
    if (filters.source && report.source !== filters.source) return false;

    // LLM Provider filter
    if (filters.llmProvider && report.llmProvider !== filters.llmProvider) return false;

    // Date range filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (new Date(report.createdAt) < fromDate) return false;
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (new Date(report.createdAt) > toDate) return false;
    }

    // Has verification filter
    if (filters.hasVerification !== undefined) {
      const hasVerif = report.verificationCount > 0;
      if (filters.hasVerification !== hasVerif) return false;
    }

    // Search query (in address and notes)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        report.primaryPropertyAddress,
        report.notes,
        report.userEmail,
        ...(report.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) return false;
    }

    return true;
  });

  // Apply sorting
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'netCapitalGain':
        comparison = (a.netCapitalGain || 0) - (b.netCapitalGain || 0);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Calculate pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReports = filtered.slice(startIndex, endIndex);

  // Convert to summaries (fetch latest verification if exists)
  const summaries: CGTReportSummary[] = await Promise.all(
    paginatedReports.map(async (report) => {
      let latestVerification: CGTReportSummary['latestVerification'] = undefined;

      if (report.latestVerificationId) {
        const verif = await getVerification(report.latestVerificationId);
        if (verif && verif.comparison) {
          latestVerification = {
            alignment: verif.comparison.overallAlignment,
            matchPercentage: verif.comparison.matchPercentage,
            verifiedAt: verif.verifiedAt,
            reviewStatus: verif.review?.reviewStatus,
          };
        }
      }

      return {
        id: report.id,
        createdAt: report.createdAt,
        source: report.source,
        llmProvider: report.llmProvider,
        status: report.status,
        netCapitalGain: report.netCapitalGain,
        propertyCount: report.propertyCount,
        primaryPropertyAddress: report.primaryPropertyAddress,
        verificationCount: report.verificationCount,
        latestVerification,
      };
    })
  );

  return {
    items: summaries,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ============================================
// Verification Operations
// ============================================

/**
 * Create a verification record for a report
 */
export async function createVerification(
  reportId: string,
  data: Omit<VerificationRecord, 'id' | 'reportId'>
): Promise<VerificationRecord | null> {
  const redis = getRedis();
  const report = await getReport(reportId);

  if (!report) {
    console.error(`❌ Cannot create verification: Report ${reportId} not found`);
    return null;
  }

  const id = generateVerificationId();

  const verification: VerificationRecord = {
    ...data,
    id,
    reportId,
  };

  // Store verification
  await redis.set(
    `${STORAGE.VERIFICATION_KEY}${id}`,
    JSON.stringify(verification),
    { ex: STORAGE.VERIFICATION_TTL }
  );

  // Update report
  const newStatus: ReportStatus = data.status === 'success' ? 'verified' : report.status;

  await updateReport(reportId, {
    verificationIds: [...report.verificationIds, id],
    latestVerificationId: id,
    verificationCount: report.verificationCount + 1,
    status: newStatus,
  });

  console.log(`✅ Verification created: ${id} for report ${reportId}`, {
    status: data.status,
    alignment: data.comparison?.overallAlignment,
    matchPercentage: data.comparison?.matchPercentage,
  });

  return verification;
}

/**
 * Get a single verification by ID
 */
export async function getVerification(id: string): Promise<VerificationRecord | null> {
  const redis = getRedis();
  const data = await redis.get<string>(`${STORAGE.VERIFICATION_KEY}${id}`);

  if (!data) return null;

  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * Get all verifications for a report
 */
export async function getVerificationHistory(reportId: string): Promise<VerificationRecord[]> {
  const report = await getReport(reportId);
  if (!report) return [];

  const verifications: VerificationRecord[] = [];

  for (const verifId of report.verificationIds) {
    const verif = await getVerification(verifId);
    if (verif) {
      verifications.push(verif);
    }
  }

  // Sort by date (newest first)
  verifications.sort(
    (a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
  );

  return verifications;
}

/**
 * Update the review on a verification record
 */
export async function updateVerificationReview(
  verificationId: string,
  review: VerificationReview
): Promise<VerificationRecord | null> {
  const redis = getRedis();
  const verification = await getVerification(verificationId);

  if (!verification) {
    console.error(`❌ Cannot update review: Verification ${verificationId} not found`);
    return null;
  }

  const updatedVerification: VerificationRecord = {
    ...verification,
    review,
  };

  await redis.set(
    `${STORAGE.VERIFICATION_KEY}${verificationId}`,
    JSON.stringify(updatedVerification),
    { ex: STORAGE.VERIFICATION_TTL }
  );

  console.log(`✅ Verification review updated: ${verificationId}`, {
    reviewStatus: review.reviewStatus,
    correctness: review.correctness,
  });

  return updatedVerification;
}

// ============================================
// Status Index Helpers
// ============================================

async function addToStatusIndex(reportId: string, status: ReportStatus): Promise<void> {
  const redis = getRedis();
  const key = `${STORAGE.REPORTS_BY_STATUS}${status}`;
  const index = await redis.get<string[]>(key) || [];

  if (!index.includes(reportId)) {
    index.push(reportId);
    await redis.set(key, JSON.stringify(index));
  }
}

async function removeFromStatusIndex(reportId: string, status: ReportStatus): Promise<void> {
  const redis = getRedis();
  const key = `${STORAGE.REPORTS_BY_STATUS}${status}`;
  const index = await redis.get<string[]>(key) || [];
  const newIndex = index.filter(id => id !== reportId);
  await redis.set(key, JSON.stringify(newIndex));
}

// ============================================
// Statistics
// ============================================

/**
 * Get report statistics for dashboard
 */
export async function getReportStats(): Promise<ReportStats> {
  const redis = getRedis();

  const index = await redis.get<string[]>(STORAGE.REPORTS_INDEX) || [];
  const totalReports = index.length;

  // Initialize stats
  const byStatus: Record<ReportStatus, number> = {
    pending: 0,
    analyzing: 0,
    analyzed: 0,
    verifying: 0,
    verified: 0,
    failed: 0,
  };
  const bySource: Record<string, number> = {};
  const byProvider: Record<string, number> = {};

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setMonth(monthStart.getMonth() - 1);

  let verificationsToday = 0;
  let reportsThisWeek = 0;
  let reportsThisMonth = 0;
  let totalMatchPercentage = 0;
  let verifiedCount = 0;

  // Fetch all reports for stats
  for (const id of index) {
    const report = await getReport(id);
    if (!report) continue;

    // Status count
    byStatus[report.status]++;

    // Source count
    bySource[report.source] = (bySource[report.source] || 0) + 1;

    // Provider count
    byProvider[report.llmProvider] = (byProvider[report.llmProvider] || 0) + 1;

    // Date-based counts
    const createdAt = new Date(report.createdAt);
    if (createdAt >= weekStart) reportsThisWeek++;
    if (createdAt >= monthStart) reportsThisMonth++;

    // Verification stats
    if (report.latestVerificationId) {
      const verif = await getVerification(report.latestVerificationId);
      if (verif) {
        const verifDate = new Date(verif.verifiedAt);
        if (verifDate >= todayStart) verificationsToday++;

        if (verif.comparison?.matchPercentage) {
          totalMatchPercentage += verif.comparison.matchPercentage;
          verifiedCount++;
        }
      }
    }
  }

  const averageAlignment = verifiedCount > 0
    ? Math.round(totalMatchPercentage / verifiedCount)
    : 0;

  return {
    totalReports,
    byStatus,
    bySource,
    byProvider,
    verificationsToday,
    averageAlignment,
    reportsThisWeek,
    reportsThisMonth,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if storage is configured and accessible
 */
export async function checkStorageHealth(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    const redis = getRedis();
    await redis.ping();
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get reports that need verification (analyzed but not verified)
 */
export async function getUnverifiedReports(limit = 50): Promise<CGTReportSummary[]> {
  const result = await listReports(
    {
      status: 'analyzed',
      hasVerification: false,
      sortBy: 'createdAt',
      sortOrder: 'asc', // Oldest first
    },
    { page: 1, limit }
  );

  return result.items;
}

/**
 * Export storage constants for use in other modules
 */
export { STORAGE as REPORT_STORAGE_CONSTANTS };
