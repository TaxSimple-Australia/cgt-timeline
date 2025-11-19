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
}

export interface VerificationIssue {
  property_address?: string;
  issue_type?: string;
  severity?: 'critical' | 'warning' | 'info';
  question?: string;
  message?: string;
  suggested_resolution?: string;
  affected_period?: {
    start_date?: string;
    end_date?: string;
  };
}

export interface VerificationProperty {
  property_address?: string;
  verification_status?: 'passed' | 'failed' | 'warning';
  issues?: VerificationIssue[];
}

export interface VerificationResponse {
  status?: string;
  verification?: {
    properties?: VerificationProperty[];
    issues?: VerificationIssue[];
  };
  properties?: VerificationProperty[];
}
