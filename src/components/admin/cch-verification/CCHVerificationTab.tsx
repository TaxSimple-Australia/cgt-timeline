'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, CheckCircle, FileJson, Copy, Download } from 'lucide-react';
import VerificationResults from './VerificationResults';
import ComparisonView from './ComparisonView';
import AnalysisSummary from './AnalysisSummary';

interface TimelineEvent {
  date: string;
  event: string;
  details?: string;
}

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
  // Pre-populated data from AI analysis
  aiResponse?: any;
  verificationPrompt?: string;
}

export default function CCHVerificationTab({ aiResponse, verificationPrompt }: CCHVerificationTabProps) {
  const [scenario, setScenario] = useState('');
  const [ourAnswer, setOurAnswer] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [showRawJSON, setShowRawJSON] = useState(false);

  // Pre-populate from AI response when available
  useEffect(() => {
    if (aiResponse) {
      // Extract verification prompt
      const prompt = aiResponse.verification_prompt ||
                     aiResponse.data?.verification_prompt ||
                     verificationPrompt || '';
      setScenario(prompt);

      // Extract our answer from AI response
      const answer = extractOurAnswer(aiResponse);
      setOurAnswer(answer);

      // Extract timeline if available
      const timelineData = extractTimeline(aiResponse);
      if (timelineData.length > 0) {
        setTimeline(timelineData);
      }
    }
  }, [aiResponse, verificationPrompt]);

  const extractOurAnswer = (response: any): string => {
    if (!response) return '';

    // If there's a direct answer field
    if (response.answer) return response.answer;

    // If there's analysis data with properties
    const analysisData = response.data?.data || response.data || response;

    if (analysisData?.properties && Array.isArray(analysisData.properties)) {
      const parts: string[] = [];

      for (const prop of analysisData.properties) {
        parts.push(`## Property: ${prop.property_address || 'Unknown'}`);

        if (prop.calculation_summary) {
          const summary = prop.calculation_summary;
          parts.push(`\n### Calculation Summary`);
          parts.push(`- Sale Price: $${Number(summary.sale_price).toLocaleString()}`);
          parts.push(`- Total Cost Base: $${Number(summary.total_cost_base).toLocaleString()}`);
          parts.push(`- Gross Capital Gain: $${Number(summary.gross_capital_gain).toLocaleString()}`);
          parts.push(`- Main Residence Exemption: ${summary.main_residence_exemption_percentage}%`);
          parts.push(`- Exemption Amount: $${Number(summary.main_residence_exemption_amount).toLocaleString()}`);
          parts.push(`- Taxable Capital Gain: $${Number(summary.taxable_capital_gain).toLocaleString()}`);
          if (summary.cgt_discount_applicable) {
            parts.push(`- CGT Discount: ${summary.cgt_discount_percentage}%`);
            parts.push(`- Discount Amount: $${Number(summary.cgt_discount_amount).toLocaleString()}`);
          }
          parts.push(`- **Net Capital Gain: $${Number(summary.net_capital_gain).toLocaleString()}**`);
        }

        if (prop.result) {
          parts.push(`\n**Result:** ${prop.result}`);
        }

        parts.push('\n---\n');
      }

      return parts.join('\n');
    }

    return '';
  };

  const extractTimeline = (response: any): TimelineEvent[] => {
    const analysisData = response.data?.data || response.data || response;

    if (analysisData?.properties && Array.isArray(analysisData.properties)) {
      const events: TimelineEvent[] = [];

      for (const prop of analysisData.properties) {
        if (prop.timeline && Array.isArray(prop.timeline)) {
          for (const event of prop.timeline) {
            events.push({
              date: event.date,
              event: event.event,
              details: event.details
            });
          }
        }
      }

      return events;
    }

    return [];
  };

  const handleVerify = async () => {
    if (!scenario.trim()) {
      setError('Please enter a scenario/verification prompt');
      return;
    }

    if (!ourAnswer.trim()) {
      setError('Please enter our AI answer for comparison');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingMessage('Sending request to CCH iKnowConnect...');

    try {
      // Update loading message after a delay
      const loadingInterval = setInterval(() => {
        setLoadingMessage(prev => {
          if (prev.includes('CCH')) return 'Waiting for CCH response (this may take 1-2 minutes)...';
          if (prev.includes('1-2 minutes')) return 'Analyzing responses with GPT-4o...';
          return 'Finalizing comparison...';
        });
      }, 20000);

      const response = await fetch('/api/cch/verify-and-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario,
          our_answer: ourAnswer,
          timeline: timeline.length > 0 ? timeline : undefined,
          ai_response: aiResponse || undefined
        })
      });

      clearInterval(loadingInterval);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">CCH Verification</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Verify CGT calculations against CCH iKnowConnect professional tax research
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
            <div>
              <p className="text-red-700 dark:text-red-300 font-medium">Verification Failed</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Auto-populated indicator */}
        {aiResponse && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 text-sm">
              Form auto-populated from latest CGT analysis
            </span>
          </div>
        )}
      </div>

      {/* Show raw JSON if toggled */}
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
          <ComparisonView result={result} ourAnswer={ourAnswer} />
          <AnalysisSummary result={result} />

          {/* Re-verify button */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              New Verification
            </button>
          </div>
        </>
      )}

      {/* Input Form - show when no results */}
      {!result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario Input */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Property Scenario (Verification Prompt)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              This will be sent to CCH for verification. Line feeds and special characters will be automatically cleaned.
            </p>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Describe the CGT scenario including property details, timeline of events, ownership periods, and cost base elements..."
              className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm font-mono resize-none"
              disabled={isLoading}
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {scenario.length} characters
            </div>
          </div>

          {/* Our Answer Input */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Our AI's Answer
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              The CGT calculation from our system to compare against CCH's response.
            </p>
            <textarea
              value={ourAnswer}
              onChange={(e) => setOurAnswer(e.target.value)}
              placeholder="Paste the CGT calculation from our system..."
              className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm font-mono resize-none"
              disabled={isLoading}
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {ourAnswer.length} characters
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {!result && (
        <div className="flex justify-center">
          <button
            onClick={handleVerify}
            disabled={isLoading || !scenario.trim() || !ourAnswer.trim()}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium text-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {loadingMessage || 'Verifying...'}
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Verify with CCH
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading indicator with estimated time */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-blue-700 dark:text-blue-300 font-medium">{loadingMessage}</p>
          <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
            This process typically takes 60-120 seconds as it queries CCH and analyzes both responses.
          </p>
        </div>
      )}
    </div>
  );
}
