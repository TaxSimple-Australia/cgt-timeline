'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import CGTSummaryCard from './CGTSummaryCard';
import PropertyAnalysisCard from './PropertyAnalysisCard';
import RecommendationsSection from './RecommendationsSection';
import GapQuestionsPanel from './GapQuestionsPanel';
import DetailedReportSection from './DetailedReportSection';

interface CGTAnalysisDisplayProps {
  response: any; // AI response (success or verification_failed)
  onRetryWithAnswers?: (answers: Array<{
    question: string;
    answer: string;
    period: { start: string; end: string; days: number };
    properties_involved: string[];
  }>) => void;
}

export default function CGTAnalysisDisplay({ response, onRetryWithAnswers }: CGTAnalysisDisplayProps) {
  if (!response) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500 dark:text-gray-400">No analysis data available</p>
      </div>
    );
  }

  const isSuccess = response.status === 'success';
  const isVerificationFailed = response.status === 'verification_failed';

  // Success Response Display
  if (isSuccess) {
    const { summary, properties, analysis, verification } = response;

    return (
      <div className="space-y-6">
        {/* Hero Summary */}
        <CGTSummaryCard summary={summary} />

        {/* Property Analysis Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Property Analysis
          </h2>

          {properties && properties.length > 0 ? (
            properties.map((property: any, index: number) => (
              <PropertyAnalysisCard
                key={property.property_id || index}
                property={property}
                calculations={response.calculations?.per_property?.find(
                  (calc: any) => calc.property_id === property.property_id
                )}
              />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No property data available</p>
          )}
        </div>

        {/* Timeline Issues (if any) */}
        {verification?.timeline_analysis?.has_issues && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Timeline Overlaps Detected
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {verification.timeline_analysis.statistics.total_overlaps} overlap(s) found on{' '}
                  {verification.timeline_analysis.statistics.overlap_days} day(s). This may affect exemption calculations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <RecommendationsSection recommendations={analysis.recommendations} />
        )}

        {/* Detailed Report (Collapsible) */}
        <DetailedReportSection
          analysis={analysis}
          calculations={response.calculations}
          validation={response.validation}
          response={response}
        />
      </div>
    );
  }

  // Verification Failed Response Display
  if (isVerificationFailed) {
    const { summary, verification, properties } = response;

    return (
      <div className="space-y-6">
        {/* Alert Banner */}
        <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                Analysis Blocked - Information Required
              </h2>
              <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                We need clarification about timeline gaps to calculate your CGT accurately.
              </p>

              {/* Portfolio Summary */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  📊 Portfolio Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Total Properties</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {summary?.total_properties || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Passed</div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {summary?.properties_passed || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Need Clarification</div>
                    <div className="font-semibold text-red-600 dark:text-red-400">
                      {summary?.properties_failed || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gap Questions */}
        {verification?.clarification_questions && verification.clarification_questions.length > 0 && (
          <GapQuestionsPanel
            questions={verification.clarification_questions}
            issues={verification.issues}
            onSubmit={onRetryWithAnswers}
          />
        )}

        {/* Property Status List */}
        {properties && properties.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Property Status
            </h3>
            {properties.map((property: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  property.verification_status === 'passed'
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {property.verification_status === 'passed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {property.address}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {property.quick_summary}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Unknown status
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-gray-600 dark:text-gray-400">Unknown response format</p>
    </div>
  );
}
