/**
 * Types for verification alerts on the timeline
 */

export interface VerificationAlert {
  id: string;
  propertyAddress: string;
  propertyId?: string; // Matched property ID from timeline
  startDate: string;
  endDate: string;
  resolutionText: string;
  clarificationQuestion?: string; // The actual question to ask user
  possibleAnswers?: string[]; // Possible answer options from API
  severity?: 'critical' | 'warning' | 'info';
  resolved?: boolean; // Whether user has resolved this alert
  userResponse?: string; // User's answer/resolution input
  resolvedAt?: string; // ISO timestamp when resolved
  questionId?: string; // Question ID from API for matching responses
}

export interface VerificationIssue {
  property_address?: string;
  issue_type?: string;
  category?: string; // timeline_gap, conflict, etc.
  severity?: 'critical' | 'warning' | 'info';
  question?: string;
  message?: string;
  suggested_resolution?: string;
  clarification_question?: string;
  affected_period?: {
    start?: string; // Can be "start" or "start_date"
    end?: string;   // Can be "end" or "end_date"
    start_date?: string;
    end_date?: string;
    days?: number;
  };
}

export interface VerificationProperty {
  property_address?: string;
  verification_status?: 'passed' | 'failed' | 'warning';
  issues?: VerificationIssue[];
}

export interface VerificationResponse {
  status?: string;
  needs_clarification?: boolean;
  clarification_questions?: any[];
  summary?: {
    total_properties?: number;
    properties_passed?: number;
    properties_failed?: number;
    critical_issues?: number;
    warnings?: number;
    total_issues_flagged?: number;
    requires_clarification?: boolean;
  };
  verification?: {
    status?: string;
    properties?: VerificationProperty[];
    issues?: VerificationIssue[];
    clarification_questions?: any[];
    summary?: {
      critical_issues?: number;
      warnings?: number;
      total_issues_flagged?: number;
    };
  };
  properties?: VerificationProperty[];
}
