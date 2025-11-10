'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  FileCheck,
  Calculator,
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';

interface ValidationMetrics {
  citation_check?: {
    total_citations: number;
    valid_citations: number;
    invalid_citations: string[];
    citation_details?: any[];
  };
  calculation_check?: {
    calculations_found: number;
    calculations_verified: number;
    calculation_errors: any[];
  };
  logic_check?: {
    logic_checks: Array<{
      check: string;
      status: string;
      note: string;
    }>;
    completeness_score: number;
    consistency_issues: any[];
  };
  warnings?: string[];
  overall_confidence?: number;
}

interface Metadata {
  chunks_retrieved?: number;
  llm_used?: string;
  confidence?: number;
  warnings?: string[];
}

interface VisualMetrics {
  data_completeness: number;
  confidence_score: number;
}

interface ValidationMetricsDisplayProps {
  validation?: ValidationMetrics;
  metadata?: Metadata;
  visualMetrics?: VisualMetrics;
}

export default function ValidationMetricsDisplay({
  validation,
  metadata,
  visualMetrics
}: ValidationMetricsDisplayProps) {
  if (!validation && !metadata && !visualMetrics) return null;

  const confidence = validation?.overall_confidence || metadata?.confidence || 0;

  // Visual metrics data
  const dataCompleteness = visualMetrics?.data_completeness || 0;
  const confidenceScore = visualMetrics?.confidence_score || 0;
  const confidencePercentage = Math.round(confidenceScore * 100);

  // Helper functions for visual metrics
  const getCompletenessStatus = (value: number) => {
    if (value >= 90) return { color: '#10B981', label: 'Excellent', icon: CheckCircle };
    if (value >= 70) return { color: '#3B82F6', label: 'Good', icon: TrendingUp };
    if (value >= 50) return { color: '#F59E0B', label: 'Fair', icon: AlertCircle };
    return { color: '#EF4444', label: 'Needs Improvement', icon: AlertCircle };
  };

  const getConfidenceStatusVisual = (value: number) => {
    if (value >= 90) return { color: '#10B981', label: 'Very High' };
    if (value >= 70) return { color: '#3B82F6', label: 'High' };
    if (value >= 50) return { color: '#F59E0B', label: 'Moderate' };
    return { color: '#EF4444', label: 'Low' };
  };

  const completenessStatus = getCompletenessStatus(dataCompleteness);
  const confidenceStatusVisual = getConfidenceStatusVisual(confidencePercentage);

  // Data for radial charts
  const completenessData = [
    {
      name: 'Completeness',
      value: dataCompleteness,
      fill: completenessStatus.color,
    },
  ];

  const confidenceData = [
    {
      name: 'Confidence',
      value: confidencePercentage,
      fill: confidenceStatusVisual.color,
    },
  ];

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Analysis Quality Metrics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered validation and confidence scoring
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Visual Metrics Charts - Data Completeness & Confidence Score */}
        {visualMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Data Completeness Chart */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={completenessData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                      fill={completenessStatus.color}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 dark:text-gray-200"
                  >
                    {dataCompleteness}%
                  </motion.div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Completeness
                </h4>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${completenessStatus.color}20`,
                    color: completenessStatus.color,
                  }}
                >
                  {completenessStatus.label}
                </span>
              </div>
            </div>

            {/* Confidence Score Chart */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={confidenceData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                      fill={confidenceStatusVisual.color}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 dark:text-gray-200"
                  >
                    {confidencePercentage}%
                  </motion.div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confidence Score
                </h4>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${confidenceStatusVisual.color}20`,
                    color: confidenceStatusVisual.color,
                  }}
                >
                  {confidenceStatusVisual.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Overall Confidence Score */}
        {(validation || metadata) && (
        <div className="text-center">
          <div className="inline-flex flex-col items-center">
            <div className="relative w-32 h-32 mb-3">
              {/* Background circle */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-800"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#confidence-gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 352 }}
                  animate={{ strokeDashoffset: 352 - (352 * confidence) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeDasharray="352"
                />
                <defs>
                  <linearGradient id="confidence-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={`${getConfidenceBg(confidence).split(' ')[0].replace('from-', 'text-')}`} stopColor="currentColor" />
                    <stop offset="100%" className={`${getConfidenceBg(confidence).split(' ')[1].replace('to-', 'text-')}`} stopColor="currentColor" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className={`text-3xl font-bold ${getConfidenceColor(confidence)}`}
                  >
                    {confidence}%
                  </motion.div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              {confidence >= 80 ? 'High Confidence' : confidence >= 60 ? 'Moderate Confidence' : 'Low Confidence'}
            </p>
          </div>
        </div>
        )}

        {/* Citation Check */}
        {validation?.citation_check && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Citation Verification
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Valid Citations</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {validation.citation_check.valid_citations}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Total Citations</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {validation.citation_check.total_citations}
                </div>
              </div>
            </div>

            {validation.citation_check.invalid_citations.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Invalid Citations
                  </span>
                </div>
                <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 ml-6 list-disc">
                  {validation.citation_check.invalid_citations.map((citation, index) => (
                    <li key={index}>{citation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Calculation Check */}
        {validation?.calculation_check && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Calculation Verification
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Verified</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {validation.calculation_check.calculations_verified}
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Found</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {validation.calculation_check.calculations_found}
                </div>
              </div>
            </div>

            {validation.calculation_check.calculation_errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                    Calculation Errors Found
                  </span>
                </div>
                <p className="text-xs text-red-800 dark:text-red-300">
                  {validation.calculation_check.calculation_errors.length} errors detected
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logic Check */}
        {validation?.logic_check && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Logic Validation
              </h4>
            </div>

            {/* Completeness Score */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completeness Score
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {validation.logic_check.completeness_score}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${validation.logic_check.completeness_score}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full bg-gradient-to-r ${getConfidenceBg(validation.logic_check.completeness_score)}`}
                />
              </div>
            </div>

            {/* Logic Checks */}
            <div className="space-y-2">
              {validation.logic_check.logic_checks.map((check, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    check.status === 'pass'
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {check.check.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {check.note}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Consistency Issues */}
            {validation.logic_check.consistency_issues.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                    Consistency Issues
                  </span>
                </div>
                <p className="text-xs text-red-800 dark:text-red-300">
                  {validation.logic_check.consistency_issues.length} issues found
                </p>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        {metadata && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Analysis Metadata
              </h4>
            </div>

            {/*<div className="grid grid-cols-2 gap-3 text-sm">
              {metadata.llm_used && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Model:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {metadata.llm_used}
                  </span>
                </div>
              )}
              {metadata.chunks_retrieved !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Sources:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {metadata.chunks_retrieved} documents
                  </span>
                </div>
              )}
            </div>*/}

            {metadata.warnings && metadata.warnings.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Warnings
                  </span>
                </div>
                <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 ml-6 list-disc">
                  {metadata.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
