// AI Server Response Type Definitions
// Based on sample responses from public/aiserverresponses

export type AIResponseStatus = 'success' | 'verification_failed';
export type IssueSeverity = 'critical' | 'warning';
export type IssueCategory =
  | 'cost_base_missing'
  | 'timeline_gap'
  | 'completeness_missing_purchase'
  | 'missing_sale_price'
  | 'missing_building_costs'
  | 'missing_contract_date';

// Issue object from verification
export interface AIIssue {
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  field?: string | null;
  property_id?: string | null; // Address of affected property
  property_address?: string; // Property address (new format)
  property_index?: number | null; // 0-based array index
  detected_value?: any | null;
  question?: string; // Question to ask user
  clarification_question?: string; // New format
  suggestion?: string | null;
  suggested_resolution?: string; // New format
  impact?: string; // Impact on CGT calculation
  reasoning?: string | null;
  // For timeline_gap issues
  affected_period?: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
    days: number;
  };
  gap_days?: Record<string, string>; // Map of date -> status (e.g., "unknown")
}

// Timeline gap object
export interface TimelineGap {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  duration_days: number;
  owned_properties: string[]; // Property addresses owned during gap
}

// Timeline overlap object
export interface TimelineOverlap {
  start_date: string;
  end_date: string;
  duration_days: number;
  properties: string[]; // Overlapping property addresses
}

// Timeline analysis structure
export interface TimelineAnalysis {
  status: string;
  analysis_period: {
    start: string;
    end: string;
    total_days: number;
  };
  gaps: TimelineGap[];
  overlaps: TimelineOverlap[];
  statistics: {
    total_days: number;
    gap_days: number;
    overlap_days: number;
    accounted_days: number;
    accounted_percentage: number;
    total_gaps: number;
    total_overlaps: number;
  };
  has_issues: boolean;
}

// Pre-verification / Verification object
export interface AIVerification {
  status: 'passed' | 'failed';
  summary: {
    critical_issues: number;
    warnings: number;
    resolved_false_positives: number;
    total_issues_flagged: number;
    total_issues_after_llm: number;
  };
  issues: AIIssue[];
  clarification_questions: string[];
  normalized_data: any; // Normalized request data
  timeline_analysis: TimelineAnalysis;
  llm_decision: {
    critical: Array<{
      index: number;
      issue_category: string;
      reasoning: string;
      question: string;
      impact: string;
    }>;
    resolved: Array<{
      index: number;
      issue_category: string;
      reasoning: string;
      original_message: string;
    }>;
    clarify: any[];
    summary: string;
    verification_passed: boolean;
  };
  llm_summary: string;
}

// Metadata from successful response
export interface AIMetadata {
  chunks_retrieved: number;
  llm_used: string;
  confidence: number;
  warnings: string[];
  retrieved_documents: Array<{
    content: string;
    metadata: {
      page_num: number;
      source_file: string;
      chunk_type: string;
      category: string;
      word_count: number;
      people: string;
      sections: string;
    };
    score: number;
    retrieval_strategy: string;
  }>;
}

// Validation from successful response
export interface AIValidation {
  citation_check: {
    total_citations: number;
    valid_citations: number;
    invalid_citations: any[];
    citation_details: any[];
  };
  calculation_check: {
    calculations_found: number;
    calculations_verified: number;
    calculation_errors: any[];
  };
  logic_check: {
    logic_checks: any[];
    completeness_score: number;
    consistency_issues: any[];
  };
  warnings: string[];
  overall_confidence: number;
}

// Success response structure
export interface AISuccessResponse {
  status: 'success';
  timestamp: string;
  num_properties: number;
  analysis: string; // Markdown formatted analysis
  metadata: AIMetadata;
  validation: AIValidation;
  error: null;
  pre_verification: AIVerification;
}

// Failed verification response
export interface AIFailedResponse {
  status: 'verification_failed';
  timestamp: string;
  verification: AIVerification;
  message: string;
}

// Union type for all responses
export type AIResponse = AISuccessResponse | AIFailedResponse;

// Helper type for UI display
export interface TimelineIssue {
  id: string; // Generated unique ID
  eventId?: string; // Link to specific timeline event
  propertyId?: string; // Link to property
  gapId?: string; // Link to gap (for timeline gaps)
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  question: string;
  impact: string;
  suggestion: string | null;
  // For gap-specific issues
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  // User response
  userResponse?: string;
  resolved?: boolean;
}

// Helper type for positioned gaps on timeline
export interface PositionedGap extends TimelineGap {
  id: string;
  x: number; // Timeline x coordinate
  width: number; // Timeline width in pixels
  relatedIssue?: AIIssue;
  propertyIds: string[]; // IDs of properties this gap applies to
}

// Helper function type guards
export function isSuccessResponse(response: AIResponse): response is AISuccessResponse {
  return response.status === 'success';
}

export function isFailedResponse(response: AIResponse): response is AIFailedResponse {
  return response.status === 'verification_failed';
}

// Extract issues from any response type
export function getIssuesFromResponse(response: AIResponse): AIIssue[] {
  if (isSuccessResponse(response)) {
    return response.pre_verification.issues || [];
  } else {
    return response.verification.issues || [];
  }
}

// Extract gaps from any response type
export function getGapsFromResponse(response: AIResponse): TimelineGap[] {
  if (isSuccessResponse(response)) {
    return response.pre_verification.timeline_analysis.gaps || [];
  } else {
    return response.verification.timeline_analysis.gaps || [];
  }
}

// Extract timeline analysis from any response type
export function getTimelineAnalysis(response: AIResponse): TimelineAnalysis | null {
  if (isSuccessResponse(response)) {
    return response.pre_verification.timeline_analysis;
  } else {
    return response.verification.timeline_analysis;
  }
}
