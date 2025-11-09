'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

interface VerificationSummary {
  critical_issues: number;
  warnings: number;
  resolved_false_positives?: number;
  total_issues_flagged?: number;
  total_issues_after_llm?: number;
}

interface VerificationData {
  status: string;
  summary: VerificationSummary;
  issues?: any[];
  clarification_questions?: string[];
  llm_summary?: string;
}

interface VerificationDashboardProps {
  verification: VerificationData;
}

export default function VerificationDashboard({ verification }: VerificationDashboardProps) {
  const { status, summary } = verification;

  const isPassed = status === 'passed';
  const hasCritical = summary.critical_issues > 0;
  const hasWarnings = summary.warnings > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header with Status */}
      <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${
        isPassed
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
          : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isPassed
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-red-100 dark:bg-red-900/40'
            }`}>
              <Shield className={`w-6 h-6 ${
                isPassed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Data Verification
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automated quality checks on your property data
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            isPassed
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
          }`}>
            {isPassed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {isPassed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50">
        <VerificationStat
          icon={<XCircle className="w-5 h-5" />}
          label="Critical Issues"
          value={summary.critical_issues}
          color={summary.critical_issues > 0 ? 'red' : 'green'}
          delay={0.1}
        />
        <VerificationStat
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Warnings"
          value={summary.warnings}
          color={summary.warnings > 0 ? 'amber' : 'green'}
          delay={0.2}
        />
        <VerificationStat
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Resolved"
          value={summary.resolved_false_positives || 0}
          color="green"
          delay={0.3}
        />
        <VerificationStat
          icon={<Info className="w-5 h-5" />}
          label="Total Flagged"
          value={summary.total_issues_flagged || 0}
          color="blue"
          delay={0.4}
        />
      </div>

      {/* Progress Indicator */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Verification Progress
          </span>
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {summary.total_issues_after_llm === 0 ? '100%' :
             `${Math.max(0, 100 - (summary.total_issues_after_llm || 0) * 20)}%`}
          </span>
        </div>

        <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: summary.total_issues_after_llm === 0
                ? '100%'
                : `${Math.max(0, 100 - (summary.total_issues_after_llm || 0) * 20)}%`
            }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-full rounded-full ${
              summary.total_issues_after_llm === 0
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : summary.critical_issues > 0
                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500'
            }`}
          />
        </div>

        {/* LLM Summary */}
        {verification.llm_summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  AI Verification Summary
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  {verification.llm_summary}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Clarification Questions */}
        {verification.clarification_questions && verification.clarification_questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="mt-4"
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Questions for Better Analysis
            </h4>
            <div className="space-y-2">
              {verification.clarification_questions.map((question, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {question}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detailed Issues */}
        {verification.issues && verification.issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="mt-4"
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              Issues Detected
            </h4>
            <div className="space-y-2">
              {verification.issues.map((issue: any, index: number) => (
                <IssueCard key={index} issue={issue} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Verification Stat Component
function VerificationStat({
  icon,
  label,
  value,
  color,
  delay
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'red' | 'amber' | 'green' | 'blue';
  delay: number;
}) {
  const colorClasses = {
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="text-center"
    >
      <div className={`flex justify-center mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {label}
      </div>
    </motion.div>
  );
}

// Issue Card Component
function IssueCard({ issue, index }: { issue: any; index: number }) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-3 border rounded-lg ${getSeverityColor(issue.severity)}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getSeverityIcon(issue.severity)}
        </div>
        <div className="flex-1 min-w-0">
          {issue.property_id && (
            <p className="text-xs font-semibold mb-1">
              {issue.property_id}
            </p>
          )}
          <p className="text-sm">
            {issue.message || issue.question}
          </p>
          {issue.impact && (
            <p className="text-xs mt-1 opacity-75">
              Impact: {issue.impact}
            </p>
          )}
          {issue.suggestion && (
            <p className="text-xs mt-1 opacity-75">
              💡 {issue.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
