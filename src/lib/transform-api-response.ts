import type { CGTModelResponse } from '@/types/model-response';

/**
 * Transform the API response to the expected format
 * Handles both verification responses and calculation responses
 * Updated to support the new API format with analysis.content
 */
export function transformAPIResponse(apiResponse: any): CGTModelResponse {
  console.log('🔄 Transforming API response:', {
    status: apiResponse.status,
    hasVerification: !!apiResponse.verification,
    hasAnalysis: !!apiResponse.analysis,
    hasResponse: !!apiResponse.response,
  });

  // NEW FORMAT: Check if it's a successful response with analysis.content
  if (apiResponse.status === 'success' && apiResponse.analysis) {
    const analysis = apiResponse.analysis;
    const verification = apiResponse.verification;

    console.log('✅ Detected new API format with analysis.content');

    // Extract issues from verification if they exist
    let issues = [];
    if (verification?.issues && Array.isArray(verification.issues)) {
      issues = verification.issues.map((issue: any) => ({
        type: issue.severity === 'critical' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info',
        field: issue.property_id || issue.field || undefined,
        message: issue.question || issue.message,
        severity: issue.severity === 'critical' ? 'high' : issue.severity === 'warning' ? 'medium' : 'low',
      }));
    }

    // Get clarification questions if they exist
    if (verification?.clarification_questions && Array.isArray(verification.clarification_questions)) {
      const clarificationIssues = verification.clarification_questions.map((question: string) => ({
        type: 'info' as const,
        message: question,
        severity: 'low' as const,
      }));
      issues = [...issues, ...clarificationIssues];
    }

    return {
      properties: verification?.normalized_data?.properties || [],
      user_query: verification?.normalized_data?.user_query || apiResponse.user_query,
      additional_info: verification?.normalized_data?.additional_info || apiResponse.additional_info,
      use_claude: apiResponse.use_claude || true, // Assume Claude was used for new format
      response: {
        summary: analysis.content || 'Analysis completed successfully.',
        recommendation: verification?.llm_summary || undefined,
        issues: issues,
        visual_metrics: {
          data_completeness: verification?.summary
            ? Math.max(0, 100 - (verification.summary.total_issues_after_llm || 0) * 10)
            : 100,
          confidence_score: (analysis.metadata?.confidence || 100) / 100,
        },
        // Include metadata for reference
        metadata: analysis.metadata,
        validation: analysis.validation,
      },
    };
  }

  // Check if it's a verification failure response
  if (apiResponse.status === 'verification_failed' && apiResponse.verification) {
    const verification = apiResponse.verification;

    console.log('⚠️ Detected verification failed response');

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
        recommendation: verification.llm_summary || 'Complete the missing information in your timeline to get an accurate CGT analysis.',
        issues: issues,
        visual_metrics: {
          data_completeness: Math.max(0, 100 - (verification.summary?.total_issues || 0) * 10),
          confidence_score: 0,
        },
      },
    };
  }

  // OLD FORMAT: Check if it's a successful calculation response
  if (apiResponse.response) {
    console.log('📦 Detected old API format with response field');
    return apiResponse as CGTModelResponse;
  }

  // OLD FORMAT: If the response already has the structure we need
  if (apiResponse.summary || apiResponse.detailed_breakdown) {
    console.log('📦 Detected old API format with summary/detailed_breakdown');
    return {
      properties: apiResponse.properties || [],
      user_query: apiResponse.user_query,
      additional_info: apiResponse.additional_info,
      use_claude: apiResponse.use_claude,
      response: apiResponse,
    };
  }

  // Fallback: return empty/error response
  console.error('❌ Unable to parse API response format');
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
