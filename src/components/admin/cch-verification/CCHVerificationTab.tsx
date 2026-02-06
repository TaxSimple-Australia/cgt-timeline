'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, FileJson, Copy, Download, Clock, Loader2 } from 'lucide-react';
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
}

/**
 * Formats the verification prompt by removing escape characters, line feeds,
 * and special characters to ensure it can be pasted cleanly into CCH chat.
 */
function formatVerificationPrompt(prompt: string): string {
  if (!prompt) return '';

  return prompt
    // Remove literal \n and \r escape sequences
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    // Replace actual newlines with spaces
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    // Replace tabs with spaces
    .replace(/\t/g, ' ')
    // Remove markdown headers but keep the text
    .replace(/#{1,6}\s*/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();
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

export default function CCHVerificationTab({ aiResponse }: CCHVerificationTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [hasVerificationPrompt, setHasVerificationPrompt] = useState(false);
  const [verificationStarted, setVerificationStarted] = useState(false);

  // Extract verification prompt from AI response
  const getVerificationPrompt = useCallback((response: any): string => {
    if (!response) return '';
    return response.verification_prompt ||
           response.data?.verification_prompt ||
           response.data?.data?.verification_prompt ||
           '';
  }, []);

  // Run verification with CCH API
  const runVerification = useCallback(async (response: any, verificationPrompt: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Sending to CCH iKnowConnect...');
    setVerificationStarted(true);

    try {
      // Format the verification prompt (remove escape chars, line feeds, etc.)
      const formattedPrompt = formatVerificationPrompt(verificationPrompt);
      const ourAnswer = extractOurAnswer(response);

      console.log('📤 CCH Verification - Formatted prompt length:', formattedPrompt.length);
      console.log('📤 CCH Verification - Our answer length:', ourAnswer.length);

      // Update loading message after delay
      const loadingInterval = setInterval(() => {
        setLoadingMessage(prev => {
          if (prev.includes('CCH iKnowConnect')) return 'Waiting for CCH response (this may take 1-2 minutes)...';
          if (prev.includes('1-2 minutes')) return 'Analyzing responses with GPT-4o...';
          return 'Finalizing comparison...';
        });
      }, 20000);

      const apiResponse = await fetch('/api/cch/verify-and-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: formattedPrompt,
          our_answer: ourAnswer,
          ai_response: response
        })
      });

      clearInterval(loadingInterval);

      const data = await apiResponse.json();

      if (!apiResponse.ok || !data.success) {
        throw new Error(data.error || 'CCH verification failed');
      }

      console.log('✅ CCH Verification completed successfully');
      setResult(data);
    } catch (err) {
      console.error('❌ CCH Verification error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  // Auto-verify when AI response with verification_prompt is provided
  useEffect(() => {
    const verificationPrompt = getVerificationPrompt(aiResponse);
    setHasVerificationPrompt(!!verificationPrompt);

    // Auto-start verification if we have a verification prompt and haven't started yet
    if (verificationPrompt && !verificationStarted && !result && !isLoading) {
      console.log('🔄 Auto-starting CCH verification...');
      runVerification(aiResponse, verificationPrompt);
    }
  }, [aiResponse, getVerificationPrompt, runVerification, verificationStarted, result, isLoading]);

  const handleRetry = () => {
    if (aiResponse) {
      const verificationPrompt = getVerificationPrompt(aiResponse);
      if (verificationPrompt) {
        setResult(null);
        setError(null);
        setVerificationStarted(false);
        runVerification(aiResponse, verificationPrompt);
      }
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

  // No AI response yet
  if (!aiResponse) {
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
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-blue-700 dark:text-blue-300 font-medium text-lg">{loadingMessage}</p>
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
          <ComparisonView result={result} ourAnswer={extractOurAnswer(aiResponse)} />
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
