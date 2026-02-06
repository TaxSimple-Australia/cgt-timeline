'use client';

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

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

interface AnalysisSummaryProps {
  result: VerifyResponse;
}

export default function AnalysisSummary({ result }: AnalysisSummaryProps) {
  const comparison = result.comparison;

  if (!comparison) {
    return null;
  }

  const getRecommendationStyle = (alignment: string) => {
    switch (alignment) {
      case 'high':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-300',
          icon: <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        };
      case 'low':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-900',
          border: 'border-slate-200 dark:border-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
          icon: <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        };
    }
  };

  const style = getRecommendationStyle(comparison.overall_alignment);

  const getRecommendationText = (alignment: string) => {
    switch (alignment) {
      case 'high':
        return 'Our calculation appears accurate. The results closely align with CCH professional guidance.';
      case 'medium':
        return 'Our calculation partially aligns with CCH. Review the key differences noted above for potential improvements.';
      case 'low':
        return 'Significant discrepancies detected. Manual review recommended to verify the calculation methodology.';
      default:
        return 'Unable to determine alignment. Please review both responses manually.';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Analysis Summary
      </h3>

      {/* GPT-4o Summary */}
      {comparison.summary && (
        <div className="mb-6">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Comparison Analysis
          </h4>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {comparison.summary}
            </p>
          </div>
        </div>
      )}

      {/* Errors Identified in CCH Response */}
      {comparison.external_llm_errors && comparison.external_llm_errors.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Issues Identified in CCH Response
          </h4>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <ul className="space-y-2">
              {comparison.external_llm_errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Recommendation
        </h4>
        <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
          <div className="flex items-start gap-3">
            {style.icon}
            <p className={`${style.text} text-sm`}>
              {getRecommendationText(comparison.overall_alignment)}
            </p>
          </div>
        </div>
      </div>

      {/* Passed/Failed counts */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>
            Checks Passed: {Object.values(comparison.checkboxes).filter(v => v).length} / {Object.keys(comparison.checkboxes).length}
          </span>
          <span>
            Verified: {new Date(result.verified_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
