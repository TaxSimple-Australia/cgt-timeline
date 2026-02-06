'use client';

import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface VerifyResponse {
  success: boolean;
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

interface VerificationResultsProps {
  result: VerifyResponse;
}

export default function VerificationResults({ result }: VerificationResultsProps) {
  const comparison = result.comparison;

  if (!comparison) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <p className="text-yellow-700 dark:text-yellow-300">
            Comparison data not available. CCH may not have provided a comparable response.
          </p>
        </div>
      </div>
    );
  }

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'high':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'low':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getAlignmentEmoji = (alignment: string) => {
    switch (alignment) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🔴';
      default: return '⚪';
    }
  };

  const checkboxLabels: Record<string, string> = {
    scenario_match: 'Scenario Match',
    timeline_match: 'Timeline Match',
    ownership_match: 'Ownership Match',
    cost_base_match: 'Cost Base Match',
    rules_match: 'Rules Applied',
    calculation_match: 'Calculation Match'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Verification Results
      </h3>

      {/* Top metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Overall Alignment */}
        <div className={`rounded-lg border-2 p-4 text-center ${getAlignmentColor(comparison.overall_alignment)}`}>
          <div className="text-3xl mb-2">{getAlignmentEmoji(comparison.overall_alignment)}</div>
          <div className="font-bold text-lg uppercase">{comparison.overall_alignment}</div>
          <div className="text-sm opacity-80">Overall Alignment</div>
          <div className="text-xs mt-1 opacity-60">
            Confidence: {comparison.confidence_score}%
          </div>
        </div>

        {/* Match Percentage */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center bg-slate-50 dark:bg-slate-900">
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {comparison.match_percentage}%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Match Percentage</div>
          {/* Progress bar */}
          <div className="mt-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                comparison.match_percentage >= 80
                  ? 'bg-green-500'
                  : comparison.match_percentage >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${comparison.match_percentage}%` }}
            />
          </div>
        </div>

        {/* Verified At */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center bg-slate-50 dark:bg-slate-900">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Verified At</div>
          <div className="text-lg font-medium text-slate-900 dark:text-slate-100">
            {new Date(result.verified_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Verification Checkboxes */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Verification Checkboxes
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(comparison.checkboxes).map(([key, value]) => (
            <div
              key={key}
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                value
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              {value ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${
                value
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {checkboxLabels[key] || key}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Net CGT Comparison */}
      {(comparison.our_net_cgt || comparison.external_net_cgt) && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Net CGT Comparison
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Our System</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {comparison.our_net_cgt || 'N/A'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">CCH Result</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {comparison.external_net_cgt || 'N/A'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Difference</div>
              <div className={`text-xl font-bold ${
                comparison.calculation_difference === '$0' || comparison.calculation_difference === '0'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {comparison.calculation_difference || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
