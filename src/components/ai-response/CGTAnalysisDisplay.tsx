'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Cpu, Zap, Clock, FileJson, Download, Home, LayoutGrid, FileText, Settings2, StickyNote, BookOpen, FileQuestion, HelpCircle } from 'lucide-react';
import GapQuestionsPanel from './GapQuestionsPanel';
import DetailedReportSection from './DetailedReportSection';
import TwoColumnLayout from '../timeline-viz/TwoColumnLayout';
import PropertyTwoColumnView from './PropertyTwoColumnView';
import { useTimelineStore } from '@/store/timeline';
import MarkdownDisplay from '../model-response/MarkdownDisplay';
import PortfolioSummarySection from './PortfolioSummarySection';
import CitationsSection from './CitationsSection';
import PropertyTimelineEvents from './PropertyTimelineEvents';
import WhatIfScenariosSection from './WhatIfScenariosSection';
import ApplicableRulesDisplay from './ApplicableRulesDisplay';
import OwnershipPeriodsChart from './OwnershipPeriodsChart';
import { AnalysisData, Citations } from '@/types/model-response';

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
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showRulesSummary, setShowRulesSummary] = useState(false);

  // Get timeline data and display mode from store
  const properties = useTimelineStore(state => state.properties);
  const events = useTimelineStore(state => state.events);
  const analysisDisplayMode = useTimelineStore(state => state.analysisDisplayMode);
  const setAnalysisDisplayMode = useTimelineStore(state => state.setAnalysisDisplayMode);
  const openNotesModal = useTimelineStore(state => state.openNotesModal);
  const timelineNotes = useTimelineStore(state => state.timelineNotes);

  // Helper function to get step number color
  const getStepColor = (stepNumber: number) => {
    const colors = [
      'text-blue-600 dark:text-blue-400',      // Step 1
      'text-green-600 dark:text-green-400',    // Step 2
      'text-purple-600 dark:text-purple-400',  // Step 3
      'text-orange-600 dark:text-orange-400',  // Step 4
      'text-pink-600 dark:text-pink-400',      // Step 5
      'text-cyan-600 dark:text-cyan-400',      // Step 6
      'text-indigo-600 dark:text-indigo-400',  // Step 7
      'text-teal-600 dark:text-teal-400',      // Step 8
    ];
    return colors[(stepNumber - 1) % colors.length] || 'text-purple-600 dark:text-purple-400';
  };

  if (!response) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500 dark:text-gray-400">No analysis data available</p>
      </div>
    );
  }

  // If showing raw JSON, display it and return early
  if (showRawJSON) {
    return (
      <div className="space-y-4">
        {/* Toggle Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowRawJSON(false)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
          >
            <FileJson className="w-4 h-4" />
            Show Formatted View
          </button>
        </div>

        {/* Raw JSON Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-6 overflow-auto max-h-[800px]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Raw JSON Response
          </h3>
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Check for new JSON API response format (from /calculate-cgt-json/)
  // Support both wrapped format { success, data: { properties }, citations } and direct format { properties }
  const isWrappedFormat = response.success !== undefined && response.data && response.data.properties && response.data.properties.length > 0;
  const isDirectFormat = !isWrappedFormat && response.properties && response.properties.length > 0 && response.properties[0]?.property_address;
  const isNewJSONFormat = isWrappedFormat || isDirectFormat;

  // Check for new markdown API format (from /calculate-cgt/)
  // Format: { query, answer, sources, properties_analyzed, llm_used, needs_clarification }
  const isNewMarkdownFormat = typeof response.answer === 'string' && response.answer.length > 0;

  // Check for legacy markdown analysis string format
  const hasLegacyMarkdownAnalysis = typeof response.analysis === 'string' && response.analysis.length > 0;

  // Combined markdown check
  const hasMarkdownAnalysis = isNewMarkdownFormat || hasLegacyMarkdownAnalysis;

  // Determine which display mode to use based on setting and response type
  const getEffectiveDisplayMode = () => {
    if (analysisDisplayMode !== 'auto') {
      return analysisDisplayMode;
    }
    // Auto mode: prefer JSON sections if available, otherwise markdown
    if (isNewJSONFormat) {
      return 'json-sections';
    }
    if (hasMarkdownAnalysis) {
      return 'markdown';
    }
    // Fall back to whatever is available
    return isNewJSONFormat ? 'json-sections' : 'markdown';
  };

  const effectiveDisplayMode = getEffectiveDisplayMode();

  // Display mode toggle component
  const DisplayModeToggle = () => {
    // Only show toggle if we have both formats available or if user has forced a mode
    const canShowBothModes = (isNewJSONFormat || hasMarkdownAnalysis);
    if (!canShowBothModes && analysisDisplayMode === 'auto') return null;

    return (
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setAnalysisDisplayMode('auto')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            analysisDisplayMode === 'auto'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title="Auto-detect display mode based on response type"
        >
          <Settings2 className="w-4 h-4" />
          Auto
        </button>
        <button
          onClick={() => setAnalysisDisplayMode('json-sections')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            analysisDisplayMode === 'json-sections'
              ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title="Display as beautiful structured JSON sections"
        >
          <LayoutGrid className="w-4 h-4" />
          Sections
        </button>
        <button
          onClick={() => setAnalysisDisplayMode('markdown')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            analysisDisplayMode === 'markdown'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title="Display as markdown text"
        >
          <FileText className="w-4 h-4" />
          Markdown
        </button>
      </div>
    );
  };

  // Helper function for formatting numbers (used in multiple places)
  const formatNumber = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-AU');
  };

  // Prepare analysis data for JSON sections view (if available)
  const analysisData = isNewJSONFormat
    ? ((isWrappedFormat ? response.data : response) as AnalysisData)
    : null;
  const citations = isNewJSONFormat
    ? ((isWrappedFormat ? response.citations : (response as any).citations) as Citations)
    : null;

  // ============================================================================
  // PRIORITY CHECK: VERIFICATION FAILED / GAP QUESTIONS (applies to ALL modes)
  // ============================================================================
  // This MUST be checked BEFORE display mode logic to ensure gaps are handled
  // regardless of whether user selected JSON or Markdown mode in settings.
  // Gap handling works the same way for both endpoint responses.
  //
  // New markdown format uses: needs_clarification: true, clarification_questions: []
  // Legacy JSON format uses: status: 'verification_failed', verification: { clarification_questions: [] }
  const isVerificationFailed = response.status === 'verification_failed' ||
    (response.data?.status === 'verification_failed') ||
    (response.needs_clarification === true && response.clarification_questions && response.clarification_questions.length > 0);
  const verificationData = response.data || response;

  if (isVerificationFailed) {
    const { summary, verification, properties: apiProperties } = verificationData;

    return (
      <div className="space-y-6">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            <button
              onClick={openNotesModal}
              className={`flex items-center gap-2 px-4 py-2 ${timelineNotes ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-lg transition-colors shadow-md text-sm relative`}
            >
              <StickyNote className="w-4 h-4" />
              Notes
              {timelineNotes && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-amber-600"></span>
              )}
            </button>
            <button
              onClick={() => setShowRawJSON(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-md text-sm"
            >
              <FileJson className="w-4 h-4" />
              Show Raw JSON
            </button>
          </div>
        </div>

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
                      {summary?.properties_failed || (summary?.requires_clarification ? 1 : 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gap Questions - support both new markdown format and legacy JSON format */}
        {(
          (verification?.clarification_questions && verification.clarification_questions.length > 0) ||
          (response.clarification_questions && response.clarification_questions.length > 0)
        ) && (
          <GapQuestionsPanel
            questions={verification?.clarification_questions || response.clarification_questions}
            issues={verification?.issues}
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

  // ============================================================================
  // FORCE MARKDOWN MODE: If user selected markdown mode, show markdown view
  // ============================================================================
  if (effectiveDisplayMode === 'markdown' && hasMarkdownAnalysis) {
    // Get markdown content from new or legacy format
    const markdownContent = isNewMarkdownFormat ? response.answer : response.analysis;

    // Extract sources data from new format
    const sources = isNewMarkdownFormat ? response.sources : null;
    const queryAsked = isNewMarkdownFormat ? response.query : null;
    const propertiesAnalyzed = isNewMarkdownFormat ? response.properties_analyzed : null;

    return (
      <div className="space-y-6">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            <button
              onClick={openNotesModal}
              className={`flex items-center gap-2 px-4 py-2 ${timelineNotes ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-lg transition-colors shadow-md text-sm relative`}
            >
              <StickyNote className="w-4 h-4" />
              Notes
              {timelineNotes && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-amber-600"></span>
              )}
            </button>
            <button
              onClick={() => setShowRawJSON(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-md text-sm"
            >
              <FileJson className="w-4 h-4" />
              Show Raw JSON
            </button>
          </div>
        </div>

        {/* Query Asked Banner (if available) */}
        {queryAsked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                  Question Asked
                </div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{queryAsked}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Analysis Content - Markdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <div className="p-6 lg:p-8">
            <MarkdownDisplay
              content={markdownContent}
              className="prose prose-gray dark:prose-invert max-w-none"
            />
          </div>
        </motion.div>

        {/* Sources Section (Collapsible) */}
        {sources && (
          <div className="space-y-4">
            {/* References Section */}
            {sources.references && sources.references.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      References ({sources.references.length})
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showSources ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSources && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 space-y-2">
                        {sources.references.map((ref: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800"
                          >
                            <span className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-300 text-sm font-semibold">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {ref.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <span>{ref.source_document}</span>
                                {ref.page && (
                                  <>
                                    <span>•</span>
                                    <span>Page {ref.page}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Rules Summary Section */}
            {sources.rules_summary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setShowRulesSummary(!showRulesSummary)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileQuestion className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      CGT Rules Applied
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showRulesSummary ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showRulesSummary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <MarkdownDisplay
                          content={sources.rules_summary}
                          className="prose prose-sm prose-gray dark:prose-invert max-w-none"
                          compactMode={true}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* Properties Summary (if present - legacy format) */}
        {response.properties && response.properties.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Properties Analyzed ({response.properties.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {response.properties.map((prop: any, index: number) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {prop.address || prop.property_address || `Property ${index + 1}`}
                  </h4>
                  {prop.property_history && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {prop.property_history.length} events
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Properties Analyzed Count Badge (new format) */}
        {propertiesAnalyzed && !response.properties && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
              <Home className="w-4 h-4" />
              <span>{propertiesAnalyzed} {propertiesAnalyzed === 1 ? 'property' : 'properties'} analyzed</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // JSON SECTIONS MODE: Beautiful structured view from GilbertBranch
  // ============================================================================
  if (effectiveDisplayMode === 'json-sections' && analysisData) {
    return (
      <div className="space-y-6">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            <button
              onClick={openNotesModal}
              className={`flex items-center gap-2 px-4 py-2 ${timelineNotes ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-lg transition-colors shadow-md text-sm relative`}
            >
              <StickyNote className="w-4 h-4" />
              Notes
              {timelineNotes && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-amber-600"></span>
              )}
            </button>
            <button
              onClick={() => setShowRawJSON(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-md text-sm"
            >
              <FileJson className="w-4 h-4" />
              Show Raw JSON
            </button>
          </div>
        </div>

        {/* Top-Level Summary */}
        {analysisData.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-green-950 border-2 border-green-500 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-green-400 mb-3">Portfolio Summary</h3>
            <p className="text-gray-300 leading-relaxed text-base">
              {analysisData.description}
            </p>
          </motion.div>
        )}

        {/* Per-Property Analysis */}
        {analysisData.properties && analysisData.properties.length > 0 && (
          <div className="space-y-8">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                Property Analysis
              </h2>
            </motion.div>

            {analysisData.properties.map((property, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-slate-200 dark:border-slate-700"
              >
                {/* Property Header with Gradient Accent */}
                <div className="relative bg-green-950 border-b-4 border-green-500 dark:border-green-500/30">
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-bl-full"></div>

                  <div className="relative z-10 p-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg">
                            {index + 1}
                          </span>
                          <Home className="w-6 h-6 text-white" />
                          {property.property_address}
                        </h3>
                      </div>

                      {/* Result Badge - Prominent */}
                      <div className={`flex-shrink-0 px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 ${
                        property.cgt_payable
                          ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      }`}>
                        {property.cgt_payable ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        <span>{property.result}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Content */}
                <div className="p-6 space-y-6">

                {/* High Level Description */}
                {property.high_level_description && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      High Level Description
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {property.high_level_description}
                    </p>
                  </div>
                )}

                {/* Reasoning Section */}
                {property.reasoning && (
                  <div className="bg-green-950 border-2 border-green-500 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-green-400 mb-3">Reasoning</h3>
                    <p className="text-gray-300 leading-relaxed text-base">
                      {property.reasoning}
                    </p>
                  </div>
                )}

                {/* Key Facts Section - Compact Grid with Colored Badges */}
                <div className="space-y-3">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    Key Facts
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Purchase Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 mb-2">
                        PURCHASED
                      </span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {property.key_facts?.purchase_date || property.purchase_date}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${formatNumber(property.key_facts?.purchase_price || property.purchase_price)}
                      </div>
                    </div>

                    {/* Sale Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 mb-2">
                        SOLD
                      </span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {property.key_facts?.sale_date || property.sale_date}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${formatNumber(property.key_facts?.sale_price || property.sale_price)}
                      </div>
                    </div>

                    {/* Ownership Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 mb-2">
                        OWNERSHIP
                      </span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {property.key_facts?.total_ownership_days || property.total_ownership_days} days
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {property.total_ownership_years || (Math.round((property.key_facts?.total_ownership_days || property.total_ownership_days || 0) / 365 * 10) / 10)} years
                      </div>
                    </div>

                    {/* Main Residence Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 mb-2">
                        MAIN RESIDENCE
                      </span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {property.key_facts?.main_residence_days || property.main_residence_days} days
                      </div>
                    </div>

                    {/* Non-Main Residence Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 mb-2">
                        NON-MAIN RES
                      </span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {property.key_facts?.non_main_residence_days || ((property.key_facts?.total_ownership_days || property.total_ownership_days || 0) - (property.key_facts?.main_residence_days || property.main_residence_days || 0))} days
                      </div>
                    </div>

                    {/* Conditional: Move In */}
                    {(property.key_facts?.move_in_date || property.move_in_date) && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 mb-2">
                          MOVE IN
                        </span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {property.key_facts?.move_in_date || property.move_in_date}
                        </div>
                      </div>
                    )}

                    {/* Conditional: Move Out */}
                    {(property.key_facts?.move_out_date || property.move_out_date) && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 mb-2">
                          MOVE OUT
                        </span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {property.key_facts?.move_out_date || property.move_out_date}
                        </div>
                      </div>
                    )}

                    {/* Conditional: Rent Start */}
                    {(property.key_facts?.rent_start_date || property.rent_start_date) && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 mb-2">
                          RENT START
                        </span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {property.key_facts?.rent_start_date || property.rent_start_date}
                        </div>
                      </div>
                    )}

                    {/* Conditional: Market Value at First Rental */}
                    {(property.key_facts?.market_value_at_first_rental || property.market_value_at_first_rental) && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 mb-2">
                          MARKET VALUE
                        </span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${formatNumber(property.key_facts?.market_value_at_first_rental || property.market_value_at_first_rental)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          at first rental
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Timeline of Events */}
                <PropertyTimelineEvents timeline={property.timeline_of_events || (property as any).timeline} />

                {/* CGT Calculation - Minimal clean layout */}
                {(property.cgt_calculation || (property.calculation_steps && property.calculation_steps.length > 0)) && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      CGT Calculation
                    </h4>

                    {/* New format: cgt_calculation with step1-7 */}
                    {property.cgt_calculation && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'].map((stepKey, index) => {
                          const step = property.cgt_calculation[stepKey as keyof typeof property.cgt_calculation];
                          if (!step || typeof step === 'string') return null;

                          return (
                            <div key={stepKey} className="py-5 first:pt-0">
                              <div className="flex items-start gap-6">
                                {/* Step Label - Fixed Width */}
                                <span className="font-bold text-purple-600 dark:text-purple-400 w-16 flex-shrink-0">
                                  Step {index + 1}
                                </span>

                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                  {/* Title with underline */}
                                  <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <h5 className="font-bold text-gray-900 dark:text-white">
                                      {step.title}
                                    </h5>
                                  </div>

                                  {/* Content */}
                                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                    {step.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Final Result */}
                        {property.cgt_calculation.result && (
                          <div className="py-5">
                            <div className="flex items-start gap-6">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 w-16 flex-shrink-0">
                                Result
                              </span>
                              <p className="text-emerald-600 dark:text-emerald-400">
                                {property.cgt_calculation.result}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Legacy format: calculation_steps array */}
                    {!property.cgt_calculation && property.calculation_steps && property.calculation_steps.length > 0 && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {property.calculation_steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="py-5 first:pt-0">
                            <div className="flex items-start gap-6">
                              {/* Step Label - Fixed Width */}
                              <span className={`font-bold w-16 flex-shrink-0 ${getStepColor(step.step_number)}`}>
                                Step {step.step_number}
                              </span>

                              {/* Content */}
                              <div className="flex-1 space-y-3">
                                {/* Title with underline */}
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                                  <h5 className="font-bold text-gray-900 dark:text-white">
                                    {step.title}
                                  </h5>
                                </div>

                                {/* Description */}
                                {step.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {step.description}
                                  </p>
                                )}

                                {/* Calculation */}
                                {step.calculation && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {step.calculation}
                                  </p>
                                )}

                                {/* Result - Green Pill */}
                                <div className="inline-flex">
                                  <span className="px-4 py-2 border-2 border-emerald-500 dark:border-emerald-500 text-white bg-transparent rounded-full text-sm font-semibold">
                                    {step.result}
                                  </span>
                                </div>

                                {/* Validation Checks */}
                                {step.checks && step.checks.length > 0 && (
                                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex flex-wrap gap-2">
                                      {step.checks.map((check, checkIndex) => {
                                        const colors = [
                                          'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                                          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                                          'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
                                          'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                                          'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
                                          'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
                                        ];
                                        return (
                                          <span
                                            key={checkIndex}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors[checkIndex % colors.length]}`}
                                          >
                                            {check}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Section 4: Applicable Rules */}
                <ApplicableRulesDisplay
                  rules={property.applicable_rules?.filter(rule => rule.applies) || []}
                />

                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // LEGACY RESPONSE FORMATS: status-based responses (success)
  // Note: verification_failed is now handled earlier (before display mode logic)
  // ============================================================================
  const isSuccess = response.status === 'success';

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

    return (
      <div className="space-y-8">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            <button
              onClick={openNotesModal}
              className={`flex items-center gap-2 px-4 py-2 ${timelineNotes ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-lg transition-colors shadow-md text-sm relative`}
            >
              <StickyNote className="w-4 h-4" />
              Notes
              {timelineNotes && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-amber-600"></span>
              )}
            </button>
            <button
              onClick={() => setShowRawJSON(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-md text-sm"
            >
              <FileJson className="w-4 h-4" />
              Show Raw JSON
            </button>
          </div>
        </div>

        {/* Horizontal Property Card Tabs */}
        {apiProperties && apiProperties.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Select Property for Analysis:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {apiProperties.map((property: any, index: number) => {
                const calculations = response.calculations?.per_property?.find(
                  (calc: any) =>
                    calc.property_id === property.property_id ||
                    calc.property_id === property.address ||
                    calc.property_address === property.address
                );

                const netGain = calculations?.net_capital_gain || 0;
                // Only show as exempt if explicitly 100% exempt or full exemption type
                const isExempt = property.exempt_percentage === 100 || property.exemption_type === 'full';
                const isActive = activeTab === `property-${index}`;

                return (
                  <button
                    key={property.property_id || property.address || index}
                    onClick={() => setActiveTab(`property-${index}`)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      isActive
                        ? 'border-t-4 border-green-500 dark:border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-lg'
                        : 'border-t-2 border-blue-500 dark:border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 hover:border-opacity-70 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="text-left space-y-2.5">
                      {/* Address */}
                      <h4 className={`font-bold text-sm flex items-center gap-1.5 ${isActive ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                        <Home className={`w-4 h-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                        {property.address}
                      </h4>

                      {/* Status & Exemption */}
                      <div className="flex gap-3 text-xs">
                        <div className="flex-1">
                          <div className="text-gray-500 dark:text-gray-400">Status</div>
                          <div className={`font-semibold ${isActive ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                            {property.status || 'N/A'}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-500 dark:text-gray-400">Exemption</div>
                          <div className={`font-semibold ${isActive ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                            {property.exempt_percentage || 0}%
                          </div>
                        </div>
                      </div>

                      {/* Net Capital Gain */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Net Capital Gain</div>
                        <div className="flex items-center justify-between">
                          <div className={`text-lg font-bold ${
                            netGain === 0 ? 'text-green-600 dark:text-green-400' :
                            netGain > 0 ? 'text-red-600 dark:text-red-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {formatCurrency(netGain)}
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

            // Find property-specific analysis
            const propertyAnalysis = perPropertyAnalysis.find(
              (pa: any) => pa.property_address === property.address
            );

            return activeTab === `property-${index}` && (
              <motion.div
                key={`property-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Two Column View: Timeline + Calculation Details */}
                <PropertyTwoColumnView
                  property={property}
                  calculations={calculations}
                  propertyAnalysis={propertyAnalysis}
                  recommendations={recommendations}
                  validation={response.validation}
                  analysis={analysis}
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

  // Unknown status - Display full JSON response with toggle
  return (
    <div className="space-y-6">
      {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
      <div className="flex items-center justify-between gap-4">
        <DisplayModeToggle />
        <div className="flex items-center gap-2">
          <button
            onClick={openNotesModal}
            className={`flex items-center gap-2 px-4 py-2 ${timelineNotes ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-lg transition-colors shadow-md text-sm relative`}
          >
            <StickyNote className="w-4 h-4" />
            Notes
            {timelineNotes && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-amber-600"></span>
            )}
          </button>
          <button
            onClick={() => setShowRawJSON(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-md text-sm"
          >
            <FileJson className="w-4 h-4" />
            Show Raw JSON
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Unknown Response Format
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The response format was not recognized. Here is the full JSON response:
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 p-4 overflow-auto max-h-96">
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
