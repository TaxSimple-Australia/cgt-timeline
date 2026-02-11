/**
 * CGT Report and Verification Types
 *
 * These types define the structure for persistent storage of CGT analysis reports
 * and their associated CCH verification records.
 */

/**
 * Main CGT Report entity - created for every analysis
 */
export interface CGTReport {
  id: string;                          // report_xxxxx
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
  source: 'app' | 'admin' | 'api';     // Where the analysis originated
  llmProvider: string;                 // deepseek, claude, openai, etc.
  status: ReportStatus;

  // Input Data
  timelineData: TimelineInputData;
  shareId?: string;                    // If from a shared timeline

  // Analysis Results
  analysisResponse?: any;              // Full AI JSON response
  verificationPrompt?: string;         // The scenario text for CCH
  netCapitalGain?: number;             // Calculated net CGT
  analyzedAt?: string;                 // When analysis completed

  // Verifications (supports multiple re-verifications)
  verificationIds: string[];           // Array of verification IDs
  latestVerificationId?: string;       // Most recent verification
  verificationCount: number;           // Total verifications run

  // Metadata
  userEmail?: string;
  notes?: string;
  tags?: string[];

  // Summary fields for quick display
  propertyCount: number;
  eventCount: number;
  primaryPropertyAddress?: string;     // First property address for display
}

export type ReportStatus =
  | 'pending'      // Created but not yet analyzed
  | 'analyzing'    // Analysis in progress
  | 'analyzed'     // Analysis complete, not verified
  | 'verifying'    // CCH verification in progress
  | 'verified'     // Has at least one successful verification
  | 'failed';      // Analysis or verification failed

/**
 * Timeline data structure for storage
 */
export interface TimelineInputData {
  properties: any[];
  events: any[];
  notes?: any[];
  metadata?: {
    timelineVersion?: string;
    exportedAt?: string;
  };
}

/**
 * CCH Verification Record - created for each verification run
 */
export interface VerificationRecord {
  id: string;                          // verif_xxxxx
  reportId: string;                    // Parent report ID
  verifiedAt: string;                  // ISO timestamp
  verifiedBy: 'admin' | 'batch';       // Who triggered it
  duration?: number;                   // Time taken in ms

  // Data sent to CCH
  ourAnswer: string;                   // Formatted text sent to CCH
  scenario: string;                    // Verification prompt

  // CCH Response
  cchResponse?: CCHResponse;

  // Comparison Results
  comparison?: ComparisonResult;

  // Status
  status: VerificationStatus;
  errorMessage?: string;

  // Review (admin annotation)
  review?: VerificationReview;
}

export type VerificationStatus = 'success' | 'failed' | 'error' | 'timeout';

export type ReviewCorrectness = 'correct' | 'partial' | 'incorrect' | 'unsure';
export type ReviewStatus = 'pending' | 'reviewed' | 'skipped';

export interface VerificationReview {
  reviewStatus: ReviewStatus;
  correctness?: ReviewCorrectness;
  correctAnswer?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  editedAt?: string;
}

/**
 * CCH API Response structure
 */
export interface CCHResponse {
  text: string;
  sources: CCHSource[];
  queriedAt: string;
}

export interface CCHSource {
  title: string;
  url: string;
}

/**
 * Comparison results from CCH verification
 */
export interface ComparisonResult {
  overallAlignment: 'high' | 'medium' | 'low';
  confidenceScore: number;             // 0-100
  matchPercentage: number;             // 0-100

  checkboxes: VerificationCheckboxes;

  ourNetCgt: string | null;
  externalNetCgt: string | null;
  calculationDifference: string | null;

  keyDifferences: string[];
  externalLlmErrors: string[];
  summary: string;
}

/**
 * Verification checkboxes (6 categories)
 */
export interface VerificationCheckboxes {
  scenarioMatch: boolean;
  timelineMatch: boolean;
  ownershipMatch: boolean;
  costBaseMatch: boolean;
  rulesMatch: boolean;
  calculationMatch: boolean;
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Filters for listing reports
 */
export interface ReportListFilters {
  status?: ReportStatus | ReportStatus[];
  source?: CGTReport['source'];
  llmProvider?: string;
  dateFrom?: string;                   // ISO date
  dateTo?: string;                     // ISO date
  hasVerification?: boolean;
  searchQuery?: string;                // Search in address, notes
  sortBy?: 'createdAt' | 'updatedAt' | 'netCapitalGain' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;                        // 1-indexed
  limit: number;                       // Items per page (max 100)
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Create report request
 */
export interface CreateReportRequest {
  timelineData: TimelineInputData;
  source: CGTReport['source'];
  llmProvider: string;
  shareId?: string;
  userEmail?: string;
  notes?: string;
  tags?: string[];
  // If true, run analysis immediately
  runAnalysis?: boolean;
}

/**
 * Update report request
 */
export interface UpdateReportRequest {
  notes?: string;
  tags?: string[];
  userEmail?: string;
}

/**
 * Batch verification request
 */
export interface BatchVerificationRequest {
  reportIds: string[];
}

/**
 * Single batch verification result
 */
export interface BatchVerificationResult {
  reportId: string;
  success: boolean;
  verificationId?: string;
  alignment?: 'high' | 'medium' | 'low';
  matchPercentage?: number;
  error?: string;
  duration?: number;
}

/**
 * Batch verification response
 */
export interface BatchVerificationResponse {
  results: BatchVerificationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    highAlignment: number;
    mediumAlignment: number;
    lowAlignment: number;
  };
  completedAt: string;
}

// ============================================
// Storage Constants
// ============================================

export const REPORT_STORAGE = {
  // Key prefixes
  REPORT_KEY: 'cgt_report:',
  VERIFICATION_KEY: 'cgt_verification:',
  REPORTS_INDEX: 'cgt_reports_index',
  REPORTS_BY_STATUS: 'cgt_reports_by_status:',

  // Limits
  MAX_REPORTS: 10000,
  MAX_BATCH_SIZE: 20,

  // Retention (in seconds)
  REPORT_TTL: 365 * 24 * 60 * 60,      // 1 year
  VERIFICATION_TTL: 365 * 24 * 60 * 60, // 1 year

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================
// Helper Types
// ============================================

/**
 * Report with populated verifications (for detail view)
 */
export interface CGTReportWithVerifications extends CGTReport {
  verifications: VerificationRecord[];
}

/**
 * Report summary for list view (lighter weight)
 */
export interface CGTReportSummary {
  id: string;
  createdAt: string;
  source: CGTReport['source'];
  llmProvider: string;
  status: ReportStatus;
  netCapitalGain?: number;
  propertyCount: number;
  primaryPropertyAddress?: string;
  verificationCount: number;
  latestVerification?: {
    alignment: 'high' | 'medium' | 'low';
    matchPercentage: number;
    verifiedAt: string;
    reviewStatus?: ReviewStatus;
  };
}

/**
 * Stats for dashboard
 */
export interface ReportStats {
  totalReports: number;
  byStatus: Record<ReportStatus, number>;
  bySource: Record<string, number>;
  byProvider: Record<string, number>;
  verificationsToday: number;
  averageAlignment: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
}
