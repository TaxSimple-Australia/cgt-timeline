'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SummaryCard from './SummaryCard';
import PropertyIssueCard from './PropertyIssueCard';
import CGTBreakdownChart from './CGTBreakdownChart';
import TaxBreakdownPieChart from './TaxBreakdownPieChart';
import PropertyComparisonChart from './PropertyComparisonChart';
import PropertyTimelineChart from './PropertyTimelineChart';
import DetailedReportModal from './DetailedReportModal';
import VisualSummary from './VisualSummary';
import VerificationDashboard from './VerificationDashboard';
import ValidationMetricsDisplay from './ValidationMetricsDisplay';
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

        {/* Visual Metrics Summary (Data Completeness & Confidence) */}
        {response.visual_metrics && (
          <VisualSummary metrics={response.visual_metrics} delay={0.05} />
        )}

        {/* Hero Summary Card - Full Width */}
        {response.summary && (
          <SummaryCard
            summary={response.summary}
            recommendation={response.recommendation}
            delay={0.1}
          />
        )}

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
          </motion.div>
        )}

        {/* Validation & Verification Section */}
        {response.validation && (
          <ValidationMetricsDisplay
            validation={response.validation}
            metadata={response.metadata}
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
                        (acc, prop) => acc + prop.property_history.length,
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

            {/* Analysis Metadata Info */}
            {response.metadata && (response.metadata.confidence !== undefined || response.metadata.llm_used) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.0 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Analysis Info
                </h4>
                <div className="space-y-2">
                  {response.metadata.confidence !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Confidence
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {response.metadata.confidence}%
                      </span>
                    </div>
                  )}
                  {response.metadata.llm_used && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Model
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                        {response.metadata.llm_used}
                      </span>
                    </div>
                  )}
                  {response.metadata.chunks_retrieved !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Sources Reviewed
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {response.metadata.chunks_retrieved}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Powered by AI Badge */}
        {responseData.use_claude && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.0 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 rounded-full">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Powered by Claude AI
              </span>
            </div>
          </motion.div>
        )}
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
