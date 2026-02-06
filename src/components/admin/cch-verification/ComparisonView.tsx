'use client';

import { ExternalLink, BookOpen } from 'lucide-react';

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
}

interface ComparisonViewProps {
  result: VerifyResponse;
  ourAnswer: string;
}

export default function ComparisonView({ result, ourAnswer }: ComparisonViewProps) {
  const cchResponse = result.cch_response;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Detailed Comparison
      </h3>

      {/* Side-by-side responses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Our AI Response */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Our AI Response</h4>
          </div>
          <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono">
              {ourAnswer || result.our_answer || 'No answer provided'}
            </pre>
          </div>
        </div>

        {/* CCH Response */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">CCH iKnowConnect Response</h4>
          </div>
          <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 overflow-auto max-h-[400px]">
            {cchResponse ? (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono">
                {cchResponse.text}
              </pre>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic">
                No CCH response available
              </p>
            )}
          </div>
          {cchResponse?.queried_at && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Queried at: {new Date(cchResponse.queried_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Key Differences */}
      {result.comparison?.key_differences && result.comparison.key_differences.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Key Differences
          </h4>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <ul className="space-y-2">
              {result.comparison.key_differences.map((diff, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <span className="text-amber-500 dark:text-amber-400 mt-0.5">⚠️</span>
                  {diff}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CCH Sources */}
      {cchResponse?.sources && cchResponse.sources.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            CCH Sources ({cchResponse.sources.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cchResponse.sources.map((source, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400">📚</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {source.title}
                    </span>
                  </div>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                    >
                      Open
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
