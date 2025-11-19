'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyIssueCard from './PropertyIssueCard';
import CGTBreakdownChart from './CGTBreakdownChart';
import TaxBreakdownPieChart from './TaxBreakdownPieChart';
import PropertyComparisonChart from './PropertyComparisonChart';
import PropertyTimelineChart from './PropertyTimelineChart';
import DetailedReportModal from './DetailedReportModal';
import VerificationDashboard from './VerificationDashboard';
import ValidationMetricsDisplay from './ValidationMetricsDisplay';
import PropertyGanttChart from './PropertyGanttChart';
import TimelineAnalysisChart from './TimelineAnalysisChart';
import MarkdownDisplay from './MarkdownDisplay';
import type { CGTModelResponse, Issue } from '@/types/model-response';

interface ModelResponseDisplayProps {
  responseData: CGTModelResponse;
  className?: string;
}

export default function ModelResponseDisplay({
  responseData,
  className = '',
}: ModelResponseDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Safely extract response and properties with fallbacks
  const response = responseData?.response;
  const properties = responseData?.properties || [];

  // Get verification and timeline data from response (new API format)
  const apiData = (responseData as any);
  const verification = apiData.verification || apiData.pre_verification;
  const timelineAnalysis = verification?.timeline_analysis;

  // If no response data, show error
  if (!response) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
          Invalid API Response
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The API did not return a valid response format. Check the console for details.
        </p>
      </div>
    );
  }

  // Group issues by property address (if field matches address pattern or is property-specific)
  const groupIssuesByProperty = () => {
    const issuesByProperty: Record<string, Issue[]> = {};
    const generalIssues: Issue[] = [];

    if (!response || !response.issues) return { issuesByProperty, generalIssues };

    response.issues.forEach((issue) => {
      // Try to match issue to a property based on field or address
      let matched = false;

      properties.forEach((property) => {
        // Check if issue field contains property address or vice versa
        if (
          issue.field?.toLowerCase().includes(property.address.toLowerCase()) ||
          property.address.toLowerCase().includes(issue.field?.toLowerCase() || '') ||
          issue.message.toLowerCase().includes(property.address.toLowerCase())
        ) {
          if (!issuesByProperty[property.address]) {
            issuesByProperty[property.address] = [];
          }
          issuesByProperty[property.address].push(issue);
          matched = true;
        }
      });

      if (!matched) {
        generalIssues.push(issue);
      }
    });

    return { issuesByProperty, generalIssues };
  };

  const { issuesByProperty, generalIssues } = groupIssuesByProperty();
  const hasIssues = response && response.issues && response.issues.length > 0;
  const hasBreakdown = response && response.detailed_breakdown;

  // Function to extract "Final Answer" section from markdown
  const extractFinalAnswer = (markdown: string): string | null => {
    if (!markdown) return null;

    // Try to find "## Final Answer" or "# Final Answer" heading
    const patterns = [
      /##\s*Final Answer\s*\n([\s\S]*?)(?=\n##|\n#|$)/i,
      /#\s*Final Answer\s*\n([\s\S]*?)(?=\n##|\n#|$)/i,
    ];

    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Container with animations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* User Query Display (if present) */}
        {responseData.user_query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Your question:
            </p>
            <p className="text-gray-900 dark:text-gray-100 font-medium">
              {responseData.user_query}
            </p>
          </motion.div>
        )}

        {/* Summary Section - Answers user's question */}
        {response.summary && (() => {
          // Check for critical issues
          const hasCriticalIssues = response.issues?.some(
            issue =>
              issue.severity === 'high' ||
              issue.type === 'error' ||
              issue.type === 'missing_data'
          );

          const criticalIssueCount = response.issues?.filter(
            issue =>
              issue.severity === 'high' ||
              issue.type === 'error' ||
              issue.type === 'missing_data'
          ).length || 0;

          // Get tax amount if available
          const taxAmount = response.detailed_breakdown?.tax_payable;
          const hasBreakdown = taxAmount !== undefined;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="relative overflow-hidden"
            >
              <div
                className={`relative rounded-2xl shadow-lg border p-6 ${
                  hasCriticalIssues
                    ? 'bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/30 dark:via-gray-900 dark:to-orange-950/30 border-red-300 dark:border-red-700/50'
                    : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-purple-950/30 border-blue-200 dark:border-blue-700/50'
                }`}
              >
                {/* Decorative glow effect */}
                <div
                  className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 ${
                    hasCriticalIssues
                      ? 'bg-red-400/10 dark:bg-red-500/5'
                      : 'bg-blue-400/10 dark:bg-blue-500/5'
                  }`}
                />

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.15, type: 'spring' }}
                    className={`p-3 rounded-xl ${
                      hasCriticalIssues
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {hasCriticalIssues ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </motion.div>

                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3
                          className={`text-lg font-semibold mb-1 ${
                            hasCriticalIssues
                              ? 'text-red-900 dark:text-red-200'
                              : 'text-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {hasCriticalIssues ? 'Analysis Summary - Action Required' : 'Analysis Summary'}
                        </h3>
                        {hasCriticalIssues && (
                          <span className="text-xs font-medium px-2 py-1 bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full">
                            {criticalIssueCount} critical {criticalIssueCount === 1 ? 'issue' : 'issues'}
                          </span>
                        )}
                      </div>

                      {/* Tax Amount Display */}
                      {hasBreakdown && !hasCriticalIssues && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.25 }}
                          className="text-right"
                        >
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Tax Payable
                          </p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {new Intl.NumberFormat('en-AU', {
                              style: 'currency',
                              currency: 'AUD',
                              minimumFractionDigits: 0,
                            }).format(taxAmount)}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Summary Text */}
                    <div
                      className={`leading-relaxed ${
                        hasCriticalIssues
                          ? 'text-red-800 dark:text-red-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      {hasCriticalIssues ? (
                        // Show detailed summary for critical issues
                        response.summary.split('\n').map((paragraph, index) => (
                          paragraph.trim() && (
                            <p key={index} className="mb-2 last:mb-0">
                              {paragraph}
                            </p>
                          )
                        ))
                      ) : (
                        // Success - Show Final Answer section from markdown
                        (() => {
                          const finalAnswer = extractFinalAnswer(response.summary);

                          if (finalAnswer) {
                            return (
                              <div className="space-y-2">
                                <p className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">
                                  ✅ Analysis Successful
                                </p>
                                <MarkdownDisplay content={finalAnswer} />
                              </div>
                            );
                          } else {
                            // Fallback if no Final Answer section found
                            return (
                              <p className="text-base font-medium">
                                ✅ Analysis Successful! View the Detailed Report below to see everything.
                              </p>
                            );
                          }
                        })()
                      )}
                    </div>

                    {/* Critical Issues Warning */}
                    {hasCriticalIssues && (
                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-sm font-medium text-red-900 dark:text-red-200">
                          ⚠️ Important: Address the critical issues below to get an accurate CGT calculation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Highlight Section - Full Width */}
        {response.recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden"
          >
            <div className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950/30 dark:via-gray-900 dark:to-orange-950/30 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-700/50 p-6">
              {/* Decorative glow effect */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl -z-10" />

              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                  className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    Highlight
                  </h3>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    {response.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Critical Questions Section - Below Highlight */}
        {response.issues && response.issues.length > 0 && (() => {
          const criticalIssues = response.issues.filter(
            issue =>
              issue.severity === 'high' ||
              issue.type === 'error' ||
              issue.type === 'missing_data'
          );

          return criticalIssues.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/30 dark:via-gray-900 dark:to-orange-950/30 rounded-2xl shadow-lg border-2 border-red-300 dark:border-red-700/50 p-6">
                {/* Decorative glow effect */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-400/10 dark:bg-red-500/5 rounded-full blur-3xl -z-10" />

                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.25, type: 'spring' }}
                    className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </motion.div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
                      Critical Questions Required
                      <span className="text-xs font-normal px-2 py-1 bg-red-200 dark:bg-red-900/50 rounded-full">
                        {criticalIssues.length} {criticalIssues.length === 1 ? 'issue' : 'issues'}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {criticalIssues.map((issue, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-red-200 dark:border-red-800/50"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            {issue.field && (
                              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                                {issue.field}
                              </p>
                            )}
                            <p className="text-sm text-red-800 dark:text-red-200">
                              {issue.message}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-3">
                      ⚠️ Please address these critical items to get an accurate CGT calculation
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null;
        })()}

        {/* Visual Charts Section - Show section if we have ANY charts to display */}
        {(hasBreakdown || properties.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Section Header */}
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Visual Analysis
              </h3>
            </div>

            {/* Financial Charts Grid - 2 columns on desktop */}
            {hasBreakdown && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CGT Breakdown Bar Chart */}
                {response.detailed_breakdown && (
                  <CGTBreakdownChart data={response.detailed_breakdown} delay={0.3} />
                )}

                {/* Tax Breakdown Pie Chart */}
                {response.detailed_breakdown && (
                  <TaxBreakdownPieChart data={response.detailed_breakdown} delay={0.4} />
                )}
              </div>
            )}

            {/* Property Comparison - Full Width (for multi-property portfolios) */}
            {properties.length > 1 && (
              <PropertyComparisonChart properties={properties} delay={0.5} />
            )}

            {/* Portfolio Timeline - ALWAYS show if properties exist */}
            {properties.length > 0 && (
              <PropertyTimelineChart properties={properties} delay={0.6} />
            )}

            {/* Property Gantt Chart - Visual timeline for properties */}
            {properties.length > 0 && (
              <PropertyGanttChart properties={properties} />
            )}

            {/* Timeline Analysis Chart - Show gaps and overlaps */}
            {timelineAnalysis && (
              <TimelineAnalysisChart timelineAnalysis={timelineAnalysis} />
            )}
          </motion.div>
        )}

        {/* Verification Dashboard - Data quality and verification status */}
        {verification && (
          <VerificationDashboard verification={verification} />
        )}

        {/* Validation & Verification Section - Includes Visual Metrics */}
        {(response.validation || response.visual_metrics) && (
          <ValidationMetricsDisplay
            validation={response.validation}
            metadata={response.metadata}
            visualMetrics={response.visual_metrics}
          />
        )}

        {/* Issues and Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Issues */}
          <div className="lg:col-span-7 space-y-6">
            {/* Property-Specific Issues */}
            {Object.entries(issuesByProperty).map(([address, issues], index) => (
              <PropertyIssueCard
                key={address}
                propertyAddress={address}
                issues={issues}
                delay={0.7 + index * 0.1}
              />
            ))}

            {/* General Issues (not property-specific) */}
            {generalIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2"
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  General Notes
                </h4>
                {generalIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {issue.message}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right Column: Actions & Stats */}
          <div className="lg:col-span-5 space-y-6">
            {/* View Detailed Report Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full h-auto py-4 flex items-center justify-between group"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">View Detailed Report</div>
                    <div className="text-xs opacity-90">
                      Complete breakdown and property history
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>

            {/* Quick Stats */}
            {properties.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Quick Stats
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Properties Analyzed
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {properties.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Events
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {properties.reduce(
                        (acc, prop) => acc + (prop.property_history?.length || 0),
                        0
                      )}
                    </span>
                  </div>
                  {hasIssues && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">
                        Items Needing Attention
                      </span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {response.issues?.length || 0}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Financial Summary Card */}
            {hasBreakdown && response.detailed_breakdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-xl p-5 border border-purple-200 dark:border-purple-800"
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Financial Summary
                </h4>
                <div className="space-y-3">
                  {response.detailed_breakdown?.capital_gain !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Capital Gain
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                          minimumFractionDigits: 0,
                        }).format(response.detailed_breakdown.capital_gain)}
                      </span>
                    </div>
                  )}
                  {response.detailed_breakdown?.tax_payable !== undefined && (
                    <div className="flex justify-between items-center pt-3 border-t border-purple-200 dark:border-purple-800">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tax Payable
                      </span>
                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {new Intl.NumberFormat('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                          minimumFractionDigits: 0,
                        }).format(response.detailed_breakdown.tax_payable)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Detailed Report Modal */}
      <DetailedReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={responseData}
      />
    </div>
  );
}
