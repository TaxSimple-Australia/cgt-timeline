import type { CGTModelResponse } from '@/types/model-response';

/**
 * Transform the API response to the expected format
 * Handles both verification responses and calculation responses
 */
export function transformAPIResponse(apiResponse: any): CGTModelResponse {
  // Check if it's a verification failure response
  if (apiResponse.status === 'verification_failed' && apiResponse.verification) {
    const verification = apiResponse.verification;

    // Transform verification issues to our issue format
    const issues = verification.issues?.map((issue: any) => ({
      type: issue.severity === 'critical' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info',
      field: issue.property_id || issue.field || undefined,
      message: issue.question || issue.message,
      severity: issue.severity === 'critical' ? 'high' : issue.severity === 'warning' ? 'medium' : 'low',
    })) || [];

    return {
      properties: verification.normalized_data?.properties || apiResponse.properties || [],
      user_query: apiResponse.user_query || verification.normalized_data?.user_query,
      additional_info: apiResponse.additional_info || verification.normalized_data?.additional_info,
      use_claude: apiResponse.use_claude || false,
      response: {
        summary: `Data verification found ${verification.summary?.critical_issues || 0} critical issues and ${verification.summary?.warnings || 0} warnings. Please fix these issues before CGT can be calculated.`,
        recommendation: 'Complete the missing information in your timeline to get an accurate CGT analysis.',
        issues: issues,
        visual_metrics: {
          data_completeness: Math.max(0, 100 - (verification.summary?.total_issues || 0) * 10),
          confidence_score: 0,
        },
      },
    };
  }

  // Check if it's a successful calculation response
  if (apiResponse.response) {
    return apiResponse as CGTModelResponse;
  }

  // If the response already has the structure we need
  if (apiResponse.summary || apiResponse.detailed_breakdown) {
    return {
      properties: apiResponse.properties || [],
      user_query: apiResponse.user_query,
      additional_info: apiResponse.additional_info,
      use_claude: apiResponse.use_claude,
      response: apiResponse,
    };
  }

  // Fallback: return empty/error response
  return {
    properties: [],
    response: {
      summary: 'Unable to process API response. Check console for details.',
      issues: [{
        type: 'error',
        message: 'Invalid API response format',
      }],
    },
  };
}
