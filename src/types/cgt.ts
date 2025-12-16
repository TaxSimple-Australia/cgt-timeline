/**
 * CGT Analysis Types
 *
 * Type definitions for Capital Gains Tax analysis flow including
 * clarification questions and answers.
 */

/**
 * Clarification question from API when success: false, needs_clarification: true
 */
export interface ClarificationQuestion {
  question_id: string;
  property_address: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  question: string;
  options: string[];
  severity: 'critical' | 'warning' | 'info';
  context?: string;
}

/**
 * User's answer to a clarification question
 */
export interface ClarificationAnswer {
  question_id: string;
  property_address: string;
  period: {
    start_date: string;
    end_date: string;
  };
  answer: string;
  additional_details?: string;
}

/**
 * API response when clarification is needed
 */
export interface ClarificationNeededResponse {
  success: false;
  needs_clarification: true;
  clarification_questions: ClarificationQuestion[];
  data: null;
  error: null;
}

/**
 * API response when analysis is successful
 */
export interface SuccessfulAnalysisResponse {
  success: true;
  needs_clarification: false;
  clarification_questions: null | [];
  data: any; // Use AnalysisData from model-response.ts
  error: null;
  citations?: any; // Use Citations from model-response.ts
}

/**
 * Union type for all possible API responses
 */
export type CGTAnalysisResponse = ClarificationNeededResponse | SuccessfulAnalysisResponse;

/**
 * Request payload that can include clarification answers
 */
export interface CGTAnalysisRequest {
  properties: any[];
  user_query?: string;
  additional_info?: any;
  clarification_answers?: ClarificationAnswer[];
}
