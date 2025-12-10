'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, TrendingUp, DollarSign, Shield, Home } from 'lucide-react';
import GapQuestionsPanel from './GapQuestionsPanel';
import DetailedReportSection from './DetailedReportSection';
import TwoColumnLayout from '../timeline-viz/TwoColumnLayout';
import SimplifiedPropertyView from './SimplifiedPropertyView';
import { useTimelineStore } from '@/store/timeline';
import { transformPropertyToReport } from '@/lib/transform-api-to-report';

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

    // Get colorful styling for property tabs (rainbow progression)
    const getPropertyTabColor = (index: number) => {
      const colors = [
        {
          border: 'border-blue-500 dark:border-blue-600',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          text: 'text-blue-900 dark:text-blue-100',
          gainText: 'text-blue-600 dark:text-blue-400'
        },
        {
          border: 'border-purple-500 dark:border-purple-600',
          bg: 'bg-purple-50 dark:bg-purple-950/30',
          text: 'text-purple-900 dark:text-purple-100',
          gainText: 'text-purple-600 dark:text-purple-400'
        },
        {
          border: 'border-pink-500 dark:border-pink-600',
          bg: 'bg-pink-50 dark:bg-pink-950/30',
          text: 'text-pink-900 dark:text-pink-100',
          gainText: 'text-pink-600 dark:text-pink-400'
        },
        {
          border: 'border-orange-500 dark:border-orange-600',
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          text: 'text-orange-900 dark:text-orange-100',
          gainText: 'text-orange-600 dark:text-orange-400'
        },
        {
          border: 'border-teal-500 dark:border-teal-600',
          bg: 'bg-teal-50 dark:bg-teal-950/30',
          text: 'text-teal-900 dark:text-teal-100',
          gainText: 'text-teal-600 dark:text-teal-400'
        },
        {
          border: 'border-indigo-500 dark:border-indigo-600',
          bg: 'bg-indigo-50 dark:bg-indigo-950/30',
          text: 'text-indigo-900 dark:text-indigo-100',
          gainText: 'text-indigo-600 dark:text-indigo-400'
        }
      ];
      return colors[index % colors.length];
    };

    // Parse analysis summary from JSON
    let analysisSummaryText = '';
    let perPropertyAnalysis: any[] = [];
    let recommendations: string[] = [];
    try {
      if (analysis && analysis.content) {
        const analysisData = JSON.parse(analysis.content);
        analysisSummaryText = analysisData.summary || '';
        perPropertyAnalysis = analysisData.per_property_analysis || [];
        recommendations = analysisData.recommendations || [];
      }
    } catch (e) {
      console.error('Failed to parse analysis content:', e);
    }

    // Calculate portfolio summary metrics
    const portfolioMetrics = {
      totalProperties: apiProperties?.length || 0,
      totalCapitalGain: 0,
      totalCGTPayable: 0,
      exemptProperties: 0
    };

    if (apiProperties && response.calculations?.per_property) {
      apiProperties.forEach((property: any) => {
        const calculations = response.calculations.per_property.find(
          (calc: any) =>
            calc.property_id === property.property_id ||
            calc.property_id === property.address ||
            calc.property_address === property.address
        );

        if (calculations) {
          portfolioMetrics.totalCapitalGain += calculations.raw_capital_gain || 0;
          portfolioMetrics.totalCGTPayable += calculations.net_capital_gain || 0;
        }

        if (property.exempt_percentage === 100 || property.exemption_type === 'full') {
          portfolioMetrics.exemptProperties += 1;
        }
      });
    }

    return (
      <div className="space-y-8">
        {/* Portfolio Summary Section - Vibrant Gradient Hero Card */}
        {apiProperties && apiProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 rounded-2xl p-6 shadow-2xl overflow-hidden"
          >
            {/* Glassmorphism pattern overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-pink-400/20 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Portfolio Summary
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Properties Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 hover:bg-white/30 transition-all hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Home className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs text-white/90 font-medium">Total Properties</div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {portfolioMetrics.totalProperties}
                  </div>
                </motion.div>

                {/* Capital Gains Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 hover:bg-white/30 transition-all hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs text-white/90 font-medium">Capital Gains</div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(portfolioMetrics.totalCapitalGain)}
                  </div>
                </motion.div>

                {/* CGT Payable Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 hover:bg-white/30 transition-all hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${
                      portfolioMetrics.totalCGTPayable === 0
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : 'bg-gradient-to-br from-red-400 to-pink-500'
                    }`}>
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs text-white/90 font-medium">CGT Payable</div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(portfolioMetrics.totalCGTPayable)}
                  </div>
                </motion.div>

                {/* Exempt Properties Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30 hover:bg-white/30 transition-all hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs text-white/90 font-medium">Exempt Properties</div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {portfolioMetrics.exemptProperties}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Property Tabs - Sleek Pill Navigation */}
        {apiProperties && apiProperties.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-lg">
                <Home className="w-5 h-5 text-blue-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Select Property
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {apiProperties.map((property: any, index: number) => {
                const isActive = activeTab === `property-${index}`;

                return (
                  <motion.button
                    key={property.property_id || property.address || index}
                    onClick={() => setActiveTab(`property-${index}`)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg shadow-pink-500/50'
                        : 'bg-white/10 dark:bg-gray-800/50 backdrop-blur border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/50 hover:border-pink-400 dark:hover:border-pink-500'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span className="line-clamp-1">{property.address}</span>
                  </motion.button>
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

            // Find property-specific analysis
            const propertyAnalysis = perPropertyAnalysis.find(
              (pa: any) => pa.property_address === property.address
            );

            return activeTab === `property-${index}` && (() => {
              // Transform API data to report display format
              const transformResult = transformPropertyToReport(
                property,
                calculations,
                response.analysis.validation
              );

              // Log any warnings or missing fields
              if (transformResult.warnings.length > 0) {
                console.warn('⚠️ Report transformation warnings:', transformResult.warnings);
              }
              if (transformResult.missingFields.length > 0) {
                console.warn('❌ Missing fields in API response:', transformResult.missingFields);
              }

              return (
                <motion.div
                  key={`property-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
                >
                  {/* Simplified Property View: 3 Sections */}
                  <SimplifiedPropertyView
                    reportData={transformResult.reportData}
                  />
                </motion.div>
              );
            })();
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
                validation={response.analysis.validation}
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
