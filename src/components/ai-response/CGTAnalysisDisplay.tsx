'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import GapQuestionsPanel from './GapQuestionsPanel';
import DetailedReportSection from './DetailedReportSection';
import TwoColumnLayout from '../timeline-viz/TwoColumnLayout';
import StructuredCalculationDisplay from './StructuredCalculationDisplay';
import ResultHighlight from './ResultHighlight';
import ApplicableRulesSection from './ApplicableRulesSection';
import { useTimelineStore } from '@/store/timeline';

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
  const [expandedDetailedReport, setExpandedDetailedReport] = useState(false);
  const [activeTab, setActiveTab] = useState('property-0');

  // Get timeline data from store for visualizations
  const properties = useTimelineStore(state => state.properties);
  const events = useTimelineStore(state => state.events);

  if (!response) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500 dark:text-gray-400">No analysis data available</p>
      </div>
    );
  }

  const isSuccess = response.status === 'success';
  const isVerificationFailed = response.status === 'verification_failed';

  // Success Response Display - TABBED STRUCTURE
  if (isSuccess) {
    const { summary, properties: apiProperties, analysis, verification } = response;

    // Helper function for formatting currency
    const formatCurrency = (amount: number | null | undefined) => {
      if (amount === null || amount === undefined) return '$0';
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.abs(amount));
    };

    // Parse analysis summary from JSON
    let analysisSummaryText = '';
    try {
      if (analysis && analysis.content) {
        const analysisData = JSON.parse(analysis.content);
        analysisSummaryText = analysisData.summary || '';
      }
    } catch (e) {
      console.error('Failed to parse analysis content:', e);
    }

    return (
      <div className="space-y-8">
        {/* Analysis Summary Text */}
        {analysisSummaryText && (
          <div className="bg-gray-800/30 dark:bg-gray-800/30 border border-gray-700/50 dark:border-gray-700 rounded-xl p-5 shadow-md">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-sm">
                <span className="text-xl">📊</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Portfolio Analysis Summary
              </h2>
            </div>

            {/* Portfolio Summary Metrics */}
            {apiProperties && apiProperties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Net Capital Gain</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(summary?.net_taxable_gain || response.calculations?.portfolio_total?.total_cgt_liability || 0)}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Properties with CGT</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {response.calculations?.portfolio_total?.properties_with_cgt || 0}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fully Exempt Properties</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {response.calculations?.portfolio_total?.properties_exempt || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Parse and display structured summary */}
            {(() => {
              // Get property addresses from apiProperties
              const propertyAddresses = apiProperties?.map((p: any) => p.address) || [];
              const propertyCount = propertyAddresses.length;

              // Helper to shorten address (e.g., "123 Smith Street, Melbourne VIC" -> "123 Smith Street")
              const shortenAddress = (address: string) => {
                const parts = address.split(',');
                return parts[0] || address;
              };

              // Color scheme for properties (cycles through colors)
              const propertyColors = [
                { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
                { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
                { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
                { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
                { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300' },
                { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
              ];

              return (
                <div className="space-y-4">
                  {/* Key Insights Card */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-blue-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                        {propertyCount}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {propertyCount === 1 ? 'Property Analyzed' : 'Properties Analyzed'}
                      </h3>
                    </div>

                    {/* Property Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {propertyAddresses.map((address: string, index: number) => {
                        const colors = propertyColors[index % propertyColors.length];
                        return (
                          <span key={index} className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${colors.bg} ${colors.text} text-xs font-semibold rounded-full`}>
                            🏠 {shortenAddress(address)}
                          </span>
                        );
                      })}
                    </div>

                    {/* Summary Text - Enhanced */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {analysisSummaryText}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Horizontal Property Card Tabs */}
        {apiProperties && apiProperties.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Select Property for Analysis:
            </h3>
            <div className="flex overflow-x-auto gap-4 pb-2">
              {apiProperties.map((property: any, index: number) => {
                const calculations = response.calculations?.per_property?.find(
                  (calc: any) =>
                    calc.property_id === property.property_id ||
                    calc.property_id === property.address ||
                    calc.property_address === property.address
                );

                const netGain = calculations?.net_capital_gain || 0;
                const isExempt = property.exempt_percentage === 100 || netGain === 0;
                const isActive = activeTab === `property-${index}`;

                return (
                  <button
                    key={property.property_id || property.address || index}
                    onClick={() => setActiveTab(`property-${index}`)}
                    className={`flex-shrink-0 w-72 p-4 rounded-lg border-2 transition-all ${
                      isActive
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="text-left space-y-2.5">
                      {/* Address */}
                      <h4 className={`font-bold text-sm ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                        {property.address}
                      </h4>

                      {/* Status & Exemption */}
                      <div className="flex gap-3 text-xs">
                        <div className="flex-1">
                          <div className="text-gray-500 dark:text-gray-400">Status</div>
                          <div className={`font-semibold ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                            {property.status || 'N/A'}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-500 dark:text-gray-400">Exemption</div>
                          <div className={`font-semibold ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                            {property.exempt_percentage || 0}%
                          </div>
                        </div>
                      </div>

                      {/* Net Capital Gain */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Net Capital Gain</div>
                        <div className="flex items-center justify-between">
                          <div className={`text-lg font-bold ${isExempt ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {isExempt ? '$0' : formatCurrency(netGain)}
                          </div>
                          {isExempt && (
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-1.5 py-0.5 rounded">
                              EXEMPT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Property Analysis Content */}
        <AnimatePresence mode="wait">

          {/* Individual Property Tab Content */}
          {apiProperties && apiProperties.map((property: any, index: number) => {
            const calculations = response.calculations?.per_property?.find(
              (calc: any) =>
                calc.property_id === property.property_id ||
                calc.property_id === property.address ||
                calc.property_address === property.address
            );

            return activeTab === `property-${index}` && (
              <motion.div
                key={`property-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Result Highlight */}
                <ResultHighlight
                  property={property}
                  calculations={calculations}
                />

                {/* Structured Calculation Display */}
                <StructuredCalculationDisplay
                  property={property}
                  calculations={calculations}
                />

                {/* Applicable Rules */}
                <ApplicableRulesSection
                  property={property}
                  calculations={calculations}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Visual Divider */}
        <div className="flex items-center gap-4 py-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          <button
            onClick={() => setExpandedDetailedReport(!expandedDetailedReport)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <span>Detailed Analysis Report</span>
            {expandedDetailedReport ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
        </div>

        {/* Detailed Report (Collapsible) */}
        <AnimatePresence>
          {expandedDetailedReport && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <DetailedReportSection
                properties={apiProperties}
                analysis={analysis}
                calculations={response.calculations}
                validation={response.validation}
                verification={verification}
                response={response}
                timelineProperties={properties}
                timelineEvents={events}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Verification Failed Response Display (unchanged)
  if (isVerificationFailed) {
    const { summary, verification, properties: apiProperties } = response;

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
                  Portfolio Summary
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
        {apiProperties && apiProperties.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Property Status
            </h3>
            {apiProperties.map((property: any, index: number) => (
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
