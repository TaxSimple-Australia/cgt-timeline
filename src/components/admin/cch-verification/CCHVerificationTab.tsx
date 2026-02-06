'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, FileJson, Copy, Download, Clock, Loader2, Play } from 'lucide-react';
import VerificationResults from './VerificationResults';
import ComparisonView from './ComparisonView';
import AnalysisSummary from './AnalysisSummary';

interface CCHSource {
  title: string;
  url: string;
}

interface VerifyResponse {
  success: boolean;
  our_answer: string;
  scenario: string;
  formatted_scenario?: string;
  cch_response?: {
    text: string;
    sources: CCHSource[];
    queried_at: string;
  };
  comparison?: {
    overall_alignment: 'high' | 'medium' | 'low';
    confidence_score: number;
    match_percentage: number;
    checkboxes: {
      scenario_match: boolean;
      timeline_match: boolean;
      ownership_match: boolean;
      cost_base_match: boolean;
      rules_match: boolean;
      calculation_match: boolean;
    };
    our_net_cgt: string | null;
    external_net_cgt: string | null;
    calculation_difference: string | null;
    key_differences: string[];
    external_llm_errors: string[];
    summary: string;
  };
  verified_at: string;
  error?: string;
  code?: string;
}

interface CCHVerificationTabProps {
  // AI response that was returned from the analysis
  aiResponse?: any;
  // Whether the CGT analysis is currently running
  analysisLoading?: boolean;
  // The LLM provider being used for analysis
  llmProvider?: string;
  // CCH verification result (passed from parent)
  cchResult?: VerifyResponse | null;
  // Whether CCH verification is loading
  cchLoading?: boolean;
  // CCH verification error
  cchError?: string | null;
  // Callback to retry CCH verification
  onRetry?: () => void;
}

/**
 * Extracts the full AI response (excluding verification_prompt) for comparison.
 * Returns the complete response JSON as a string so CCH can compare against our full analysis.
 */
function extractOurAnswer(response: any): string {
  if (!response) return '';

  // Create a copy and remove the verification_prompt field
  const responseCopy = JSON.parse(JSON.stringify(response));

  // Remove verification_prompt from various possible locations
  delete responseCopy.verification_prompt;
  if (responseCopy.data) {
    delete responseCopy.data.verification_prompt;
    if (responseCopy.data.data) {
      delete responseCopy.data.data.verification_prompt;
    }
  }

  // Return the full response as JSON string
  return JSON.stringify(responseCopy, null, 2);
}

export default function CCHVerificationTab({
  aiResponse,
  analysisLoading,
  llmProvider,
  cchResult,
  cchLoading,
  cchError,
  onRetry
}: CCHVerificationTabProps) {
  const [showRawJSON, setShowRawJSON] = useState(false);
  // Local state to store results from sessionStorage (for when analysis runs from main app)
  const [storedResult, setStoredResult] = useState<VerifyResponse | null>(null);
  const [storedAIResponse, setStoredAIResponse] = useState<any>(null);

  // Load CCH verification result from sessionStorage on mount and when tab is focused
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        // Load CCH result
        const storedCCHResult = sessionStorage.getItem('cch_verification_result');
        if (storedCCHResult) {
          const parsed = JSON.parse(storedCCHResult);
          setStoredResult(parsed);
          console.log('📥 Loaded CCH result from sessionStorage');
        }

        // Load AI response (if stored by main app)
        const storedAI = sessionStorage.getItem('cgt_ai_response');
        if (storedAI) {
          const parsed = JSON.parse(storedAI);
          setStoredAIResponse(parsed);
          console.log('📥 Loaded AI response from sessionStorage');
        }
      } catch (e) {
        console.error('Error loading from sessionStorage:', e);
      }
    };

    // Load on mount
    loadFromStorage();

    // Also reload when window gains focus (in case user ran analysis in another tab)
    const handleFocus = () => loadFromStorage();
    window.addEventListener('focus', handleFocus);

    // Poll for updates every 2 seconds while on this tab
    const interval = setInterval(loadFromStorage, 2000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Extract verification prompt from AI response
  const getVerificationPrompt = useCallback((response: any): string => {
    if (!response) return '';
    return response.verification_prompt ||
           response.data?.verification_prompt ||
           response.data?.data?.verification_prompt ||
           '';
  }, []);

  // Use props from parent first, fall back to sessionStorage
  const effectiveAIResponse = aiResponse || storedAIResponse;
  const result = cchResult || storedResult || null;
  const isLoading = cchLoading || false;
  const error = cchError || null;
  const hasVerificationPrompt = !!getVerificationPrompt(effectiveAIResponse);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleCopyResults = () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
  };

  const handleExportReport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cch-verification-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Analysis is currently running
  if (analysisLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            CGT Analysis Running
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4">
            Analyzing property data with {llmProvider || 'AI'}...
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            CCH verification will start automatically once the analysis is complete.
          </p>
        </div>
      </div>
    );
  }

  // No AI response yet - but check if we have stored CCH result
  if (!effectiveAIResponse && !result) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            No CGT Analysis Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            CCH verification will run automatically after a CGT analysis is completed.
            Run an analysis first to see verification results here.
          </p>
        </div>
      </div>
    );
  }

  // AI response exists but no verification_prompt
  if (!hasVerificationPrompt) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            No Verification Prompt Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            The AI analysis response does not contain a verification prompt.
            This may happen with older API responses or certain analysis types.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">CCH Verification Results</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Automatic verification against CCH iKnowConnect professional tax research
            </p>
          </div>
          {result && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowRawJSON(!showRawJSON)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <FileJson className="w-4 h-4" />
                {showRawJSON ? 'Formatted View' : 'JSON View'}
              </button>
              <button
                onClick={handleCopyResults}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300 font-medium">Verification Failed</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-700 dark:text-red-300 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Status indicator */}
        {result && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 text-sm">
              Verification completed at {new Date(result.verified_at).toLocaleString()}
            </span>
          </div>
        )}

        {/* Manual Trigger Button - Show when no result and not loading */}
        {!result && !isLoading && !error && (
          <div className="mt-4 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Ready for CCH Verification
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  A verification prompt is available. Click the button to send to CCH iKnowConnect for verification.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              >
                <Play className="w-5 h-5" />
                Start CCH Verification
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-blue-700 dark:text-blue-300 font-medium text-lg">Verifying with CCH iKnowConnect...</p>
          <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
            This process typically takes 60-120 seconds as it queries CCH and analyzes both responses.
          </p>
        </div>
      )}

      {/* Raw JSON View */}
      {showRawJSON && result && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Raw JSON Response</h3>
          <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[600px] text-xs font-mono text-slate-700 dark:text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Results Display */}
      {result && !showRawJSON && (
        <>
          <VerificationResults result={result} />
          <ComparisonView result={result} ourAnswer={extractOurAnswer(effectiveAIResponse)} />
          <AnalysisSummary result={result} />

          {/* Re-verify button */}
          <div className="flex justify-center">
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Re-verify with CCH
            </button>
          </div>
        </>
      )}
    </div>
  );
}
