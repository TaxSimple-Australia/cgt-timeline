'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Cpu, Zap, Clock, FileJson, Download, Home, LayoutGrid, FileText, Settings2, BookOpen, FileQuestion, HelpCircle, Calendar, DollarSign, Calculator, AlertTriangle, Info, TrendingUp, Lightbulb, Brain, MessageCircle } from 'lucide-react';
import GapQuestionsPanel from './GapQuestionsPanel';
import DetailedReportSection from './DetailedReportSection';
import TwoColumnLayout from '../timeline-viz/TwoColumnLayout';
import PropertyTwoColumnView from './PropertyTwoColumnView';
import { useTimelineStore } from '@/store/timeline';
import MarkdownDisplay from '../model-response/MarkdownDisplay';
import CitationsSection from './CitationsSection';
import PropertyTimelineEvents from './PropertyTimelineEvents';
import WhatIfScenariosSection from './WhatIfScenariosSection';
import ApplicableRulesDisplay from './ApplicableRulesDisplay';
import OwnershipPeriodsChart from './OwnershipPeriodsChart';
import FollowUpChatWindow from './FollowUpChatWindow';
import { AnalysisData, Citations } from '@/types/model-response';
import { AnalysisStickyNotesLayer, ShareLinkButton } from '../sticky-notes';
import { SendToTaxAgentButton } from '../send-to-agent';
import FeedbackPopup from '../FeedbackPopup';
import TimelineSummaryTable from './TimelineSummaryTable';
import OwnershipPeriodsTable from './OwnershipPeriodsTable';
import PropertyTimelineTable from './PropertyTimelineTable';
import DetailedCalculationSection from './DetailedCalculationSection';
import ImportantNotesSection from './ImportantNotesSection';

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
  const [showRulesSummary, setShowRulesSummary] = useState(true); // Rules Summary expanded by default (important)
  const [showFollowUpChat, setShowFollowUpChat] = useState(false);

  // Ref for sticky notes layer
  const analysisContainerRef = useRef<HTMLDivElement>(null);

  // Feedback popup state
  const [showFeedback, setShowFeedback] = useState(false);

  // Trigger feedback popup 3 seconds after analysis loads
  useEffect(() => {
    // Check if feedback was already shown
    const feedbackShown = localStorage.getItem('cgtBrain_feedbackShown');
    if (feedbackShown) return;

    // Show feedback popup after 3 seconds
    const timer = setTimeout(() => {
      setShowFeedback(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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

  // ============================================================================
  // FORMAT DETECTION - Handle multiple API response formats
  // ============================================================================
  // Format 1 (double-wrapped): { success, data: { success, query, data: { properties: [...] }, sources, session_id } }
  // Format 2 (wrapped): { success, data: { properties: [...] }, citations }
  // Format 3 (direct): { properties: [...] }
  // Format 4 (markdown): { query, answer, sources, ... }
  // ============================================================================

  // Check for double-wrapped format (new JSON endpoint with our API wrapper)
  // Structure: response.data.data.properties
  const isDoubleWrappedFormat = response.success !== undefined &&
    response.data?.success !== undefined &&
    response.data?.data?.properties &&
    response.data?.data?.properties.length > 0;

  // Check for single-wrapped format: response.data.properties
  const isWrappedFormat = !isDoubleWrappedFormat &&
    response.success !== undefined &&
    response.data &&
    response.data.properties &&
    response.data.properties.length > 0;

  // Check for direct format: response.properties
  const isDirectFormat = !isDoubleWrappedFormat &&
    !isWrappedFormat &&
    response.properties &&
    response.properties.length > 0 &&
    response.properties[0]?.property_address;

  // Combined JSON format check
  const isNewJSONFormat = isDoubleWrappedFormat || isWrappedFormat || isDirectFormat;

  // Check for new markdown API format (from /calculate-cgt/)
  // Format: { query, answer, sources, properties_analyzed, llm_used, needs_clarification }
  const isNewMarkdownFormat = typeof response.answer === 'string' && response.answer.length > 0;

  // Check for legacy markdown analysis string format
  const hasLegacyMarkdownAnalysis = typeof response.analysis === 'string' && response.analysis.length > 0;

  // Combined markdown check
  const hasMarkdownAnalysis = isNewMarkdownFormat || hasLegacyMarkdownAnalysis;

  // Debug log for format detection
  console.log('📊 CGTAnalysisDisplay Format Detection:', {
    isDoubleWrappedFormat,
    isWrappedFormat,
    isDirectFormat,
    isNewJSONFormat,
    isNewMarkdownFormat,
    hasLegacyMarkdownAnalysis,
    hasMarkdownAnalysis
  });

  // Determine which display mode to use - Auto-detect based on available data
  const getEffectiveDisplayMode = () => {
    // If JSON data is available, use json-sections view
    if (isNewJSONFormat) {
      return 'json-sections';
    }
    // If markdown is available, use markdown view
    if (hasMarkdownAnalysis) {
      return 'markdown';
    }
    // Default to markdown
    return 'markdown';
  };

  const effectiveDisplayMode = getEffectiveDisplayMode();

  // Display mode toggle component - Currently hidden as we only use Markdown mode
  const DisplayModeToggle = () => {
    // Return null - we're only using Markdown mode for now
    return null;
  };

  // Helper function for formatting numbers (used in multiple places)
  const formatNumber = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-AU');
  };

  // ============================================================================
  // DATA EXTRACTION - Extract analysis data based on detected format
  // ============================================================================
  // Prepare analysis data for JSON sections view (if available)
  const analysisData = isNewJSONFormat
    ? (isDoubleWrappedFormat
        ? (response.data.data as AnalysisData)
        : isWrappedFormat
          ? (response.data as AnalysisData)
          : (response as AnalysisData))
    : null;

  // Extract citations/sources - check multiple locations
  const citations = isNewJSONFormat
    ? (isDoubleWrappedFormat
        ? (response.data.sources as Citations)
        : isWrappedFormat
          ? ((response.citations || response.data.sources) as Citations)
          : ((response as any).citations as Citations))
    : null;

  // Extract session_id for follow-up questions - check all possible locations
  // Double-wrapped: response.data.session_id
  // Wrapped: response.session_id or response.data.session_id
  // Direct: response.session_id
  const sessionId = response.session_id
    || response.data?.session_id
    || response.data?.data?.session_id
    || (analysisData as any)?.session_id
    || null;

  // Extract initial query for context - check all possible locations
  const initialQuery = response.query
    || response.data?.query
    || response.data?.data?.query
    || (analysisData as any)?.query
    || null;

  console.log('📊 CGTAnalysisDisplay Data Extraction:', {
    hasAnalysisData: !!analysisData,
    hasCitations: !!citations,
    sessionId,
    initialQuery: initialQuery?.substring(0, 50) + '...'
  });

  // Helper function to convert LLM display name to API key
  // The API expects keys like 'deepseek', 'claude', 'openai', 'olmo'
  // But the response contains display names like 'DeepSeek Chat (DeepSeek)'
  const getLLMProviderKey = (displayName: string | null | undefined): string => {
    if (!displayName) return 'deepseek'; // Default
    const lowerName = displayName.toLowerCase();
    if (lowerName.includes('deepseek')) return 'deepseek';
    if (lowerName.includes('claude') || lowerName.includes('anthropic')) return 'claude';
    if (lowerName.includes('openai') || lowerName.includes('gpt')) return 'openai';
    if (lowerName.includes('olmo') || lowerName.includes('openrouter')) return 'olmo';
    // If it's already a key format, return as-is
    if (['deepseek', 'claude', 'openai', 'olmo'].includes(lowerName)) return lowerName;
    return 'deepseek'; // Default fallback
  };

  // Get LLM provider KEY (not display name) from response - check all locations
  const llmUsedRaw = response.llm_used
    || response.data?.llm_used
    || response.data?.data?.llm_used
    || (analysisData as any)?.llm_used
    || null;
  const llmProvider = getLLMProviderKey(llmUsedRaw);

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
      <div ref={analysisContainerRef} className="relative space-y-6">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            {/* Share Link Button */}
            <ShareLinkButton variant="analysis" includeAnalysis={true} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" />

            {/* Send to Tax Agent Button */}
            <SendToTaxAgentButton includeAnalysis={true} />
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


        {/* Show Raw JSON Link */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowRawJSON(true)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            Show Raw JSON
          </button>
        </div>

        {/* Analysis Sticky Notes Layer */}
        <AnalysisStickyNotesLayer containerRef={analysisContainerRef} />
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
      <div ref={analysisContainerRef} className="relative space-y-6">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            {/* Follow-up Questions Button - only show if session_id is available */}
            {sessionId && (
              <button
                onClick={() => setShowFollowUpChat(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Follow-up
              </button>
            )}

            {/* Share Link Button */}
            <ShareLinkButton variant="analysis" includeAnalysis={true} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" />

            {/* Send to Tax Agent Button */}
            <SendToTaxAgentButton includeAnalysis={true} />
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
          data-sticky-section="summary"
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
                data-sticky-section="rules"
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

        {/* Follow-up Chat Window */}
        {sessionId && (
          <FollowUpChatWindow
            isOpen={showFollowUpChat}
            onClose={() => setShowFollowUpChat(false)}
            sessionId={sessionId}
            initialQuery={initialQuery}
            llmProvider={llmProvider}
          />
        )}

        {/* Show Raw JSON Link */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowRawJSON(true)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            Show Raw JSON
          </button>
        </div>

        {/* Analysis Sticky Notes Layer */}
        <AnalysisStickyNotesLayer containerRef={analysisContainerRef} />
      </div>
    );
  }

  // ============================================================================
  // JSON SECTIONS MODE: Beautiful structured view from GilbertBranch
  // ============================================================================
  if (effectiveDisplayMode === 'json-sections' && analysisData) {
    // Extract additional data from wrapped response - check multiple paths
    // The response could be in various formats:
    // 1. Double-wrapped: { success, data: { success, query, data: {...}, sources: {...}, session_id } }
    // 2. Wrapped: { success, query, data: {...}, sources: {...} }
    // 3. Direct: { analysis_date, properties, sources, ... }
    // 4. Legacy: { citations: {...}, ... }
    const queryAsked = response.query
      || response.data?.query
      || response.data?.data?.query
      || (response as any).user_query
      || null;
    const timelineUnderstanding = response.timeline_understanding
      || response.data?.timeline_understanding
      || response.data?.data?.timeline_understanding
      || (analysisData as any).timeline_understanding
      || null;

    // Sources can be at multiple locations - check all possible paths including double-wrapped
    // Priority: response.sources > response.data.sources (double-wrapped) > response.citations > etc.
    const sources = response.sources
      || response.data?.sources  // Double-wrapped format: sources at response.data.sources
      || response.citations
      || response.data?.citations
      || (analysisData as any).sources
      || (analysisData as any).citations
      || null;

    // Debug: Log where sources were found
    console.log('📊 CGTAnalysisDisplay JSON Sections: Sources location check:', {
      'response.sources': !!response.sources,
      'response.data?.sources': !!response.data?.sources,
      'response.citations': !!response.citations,
      'response.data?.citations': !!response.data?.citations,
      'analysisData.sources': !!(analysisData as any).sources,
      'foundSources': !!sources,
      'isDoubleWrappedFormat': isDoubleWrappedFormat
    });

    // Rules summary can be at multiple locations
    const rulesAppliedSummary = sources?.rules_summary
      || response.rules_summary
      || response.data?.rules_summary
      || response.data?.data?.rules_summary
      || (analysisData as any).rules_summary
      || null;

    // Source references can be at multiple locations
    const sourceReferences = sources?.references
      || response.references
      || response.data?.references
      || response.data?.data?.references
      || (analysisData as any).references
      || [];

    const propertiesAnalyzedCount = response.properties_analyzed
      || response.data?.properties_analyzed
      || analysisData.total_properties
      || 0;
    const llmUsed = response.llm_used
      || response.data?.llm_used
      || response.data?.data?.llm_used
      || (analysisData as any).llm_used
      || null;
    const analysisDate = analysisData.analysis_date
      || response.data?.data?.analysis_date
      || (response as any).analysis_date
      || null;

    return (
      <div ref={analysisContainerRef} className="relative space-y-6">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            {/* Follow-up Questions Button - only show if session_id is available */}
            {sessionId && (
              <button
                onClick={() => setShowFollowUpChat(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Follow-up
              </button>
            )}

            {/* Share Link Button */}
            <ShareLinkButton variant="analysis" includeAnalysis={true} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" />

            {/* Send to Tax Agent Button */}
            <SendToTaxAgentButton includeAnalysis={true} />
          </div>
        </div>

        {/* Query Asked Banner */}
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

        {/* Top-Level Summary */}
        {analysisData.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Summary</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysisData.description}
            </p>
          </motion.div>
        )}

        {/* Per-Property Analysis */}
        {analysisData.properties && analysisData.properties.length > 0 && (
          <div className="space-y-4">
            {analysisData.properties.map((property, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                data-sticky-section="property-card"
                data-sticky-element={(property as any).property_id || property.property_address}
              >
                {/* Property Header - Clean and Professional */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center justify-center shadow-sm">
                        {index + 1}
                      </span>
                      <Home className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                        {property.property_address}
                      </h3>
                    </div>

                    {/* Result Badge */}
                    <div className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                      property.cgt_payable
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    }`}>
                      {property.cgt_payable ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      <span>{property.result}</span>
                    </div>
                  </div>
                </div>

                {/* Property Content - Timeline Analysis View */}
                <div className="p-4 space-y-6">
                    {/* Section 1: Summary */}
                    <TimelineSummaryTable
                      property={property}
                      timelineUnderstanding={timelineUnderstanding}
                    />

                    {/* Timeline of Events */}
                    <PropertyTimelineTable property={property} />

                    {/* Section O2: Ownership Periods Analysis */}
                    <OwnershipPeriodsTable property={property} />

                    {/* Section O1: Ownership Periods Bar */}
                    {property.ownership_periods && property.ownership_periods.length > 0 && (
                      <OwnershipPeriodsChart periods={property.ownership_periods} />
                    )}

                    {/* Section O3: CGT Calculation */}
                    <DetailedCalculationSection property={property} />

                    {/* Section O6: What-If Scenarios */}
                    {property.what_if_scenarios && property.what_if_scenarios.length > 0 && (
                      <WhatIfScenariosSection scenarios={property.what_if_scenarios} />
                    )}

                    {/* Section O7: Important Notes */}
                    <ImportantNotesSection property={property} />

                    {/* Section O8: Warnings */}
                    {property.warnings && property.warnings.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <h3 className="text-base font-bold text-amber-800 dark:text-amber-200">Warnings</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 pl-6 list-disc">
                          {property.warnings.map((warning, warnIndex) => (
                            <li key={warnIndex}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                </div>
              </motion.div>
            ))}
          </div>
        )}


        {/* General Notes - Compact */}
        {analysisData.general_notes && analysisData.general_notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              General Notes
            </h3>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 pl-6 list-disc">
              {analysisData.general_notes.map((note, noteIndex) => (
                <li key={noteIndex}>{note}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Sources & Rules Summary */}
        {(rulesAppliedSummary || sourceReferences.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-3"
          >
            {/* Rules Summary Section - Always visible, expanded by default */}
            {rulesAppliedSummary && (
              <div className="bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-800 overflow-hidden">
                <button
                  onClick={() => setShowRulesSummary(!showRulesSummary)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span className="font-bold text-base text-teal-800 dark:text-teal-200">
                      CGT Rules Applied
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-teal-500 transition-transform ${showRulesSummary ? 'rotate-180' : ''}`} />
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
                      <div className="px-4 pb-4">
                        <MarkdownDisplay
                          content={rulesAppliedSummary}
                          className="prose prose-sm prose-gray dark:prose-invert max-w-none"
                          compactMode={true}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* References Section - Collapsed by default */}
            {sourceReferences.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-base text-gray-800 dark:text-gray-200">
                      Source References ({sourceReferences.length})
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSources ? 'rotate-180' : ''}`} />
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
                      <div className="px-4 pb-3 space-y-1.5">
                        {sourceReferences.map((ref: any, refIndex: number) => (
                          <div
                            key={refIndex}
                            className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                          >
                            <span className="flex-shrink-0 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded text-center text-xs font-medium text-gray-600 dark:text-gray-400 leading-5">
                              {refIndex + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                {ref.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {ref.source_document}{ref.page && ` • Page ${ref.page}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer: Metadata Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-4"
        >
          {/* Analysis Date */}
          {analysisDate && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Analyzed: {analysisDate}</span>
            </div>
          )}
          {/* Properties Analyzed */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm text-blue-700 dark:text-blue-300">
            <Home className="w-4 h-4" />
            <span>{propertiesAnalyzedCount} {propertiesAnalyzedCount === 1 ? 'property' : 'properties'} analyzed</span>
          </div>
        </motion.div>

        {/* Disclaimer */}
        {analysisData.disclaimer && (
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-bold">Disclaimer:</span> {analysisData.disclaimer}
            </p>
          </div>
        )}

        {/* Follow-up Chat Window */}
        {sessionId && (
          <FollowUpChatWindow
            isOpen={showFollowUpChat}
            onClose={() => setShowFollowUpChat(false)}
            sessionId={sessionId}
            initialQuery={initialQuery}
            llmProvider={llmProvider}
          />
        )}

        {/* Show Raw JSON Link */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowRawJSON(true)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            Show Raw JSON
          </button>
        </div>

        {/* Analysis Sticky Notes Layer */}
        <AnalysisStickyNotesLayer containerRef={analysisContainerRef} />
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
      <div ref={analysisContainerRef} className="relative space-y-8">
        {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
        <div className="flex items-center justify-between gap-4">
          <DisplayModeToggle />
          <div className="flex items-center gap-2">
            {/* Share Link Button */}
            <ShareLinkButton variant="analysis" includeAnalysis={true} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" />

            {/* Send to Tax Agent Button */}
            <SendToTaxAgentButton includeAnalysis={true} />
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
                data-sticky-section="property-card"
                data-sticky-element={(property as any).property_id || (property as any).address}
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
              data-sticky-section="detailed-report"
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


        {/* Show Raw JSON Link */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowRawJSON(true)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            Show Raw JSON
          </button>
        </div>

        {/* Analysis Sticky Notes Layer */}
        <AnalysisStickyNotesLayer containerRef={analysisContainerRef} />
      </div>
    );
  }

  // Unknown status - Display full JSON response with toggle
  return (
    <div ref={analysisContainerRef} className="relative space-y-6">
      {/* Toolbar: Display Mode Toggle + Raw JSON Button */}
      <div className="flex items-center justify-between gap-4">
        <DisplayModeToggle />
        <div className="flex items-center gap-2">
          {/* Share Link Button */}
          <ShareLinkButton variant="analysis" includeAnalysis={true} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" />

          {/* Send to Tax Agent Button */}
          <SendToTaxAgentButton includeAnalysis={true} />
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

      {/* Show Raw JSON Link */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => setShowRawJSON(true)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
        >
          <FileJson className="w-3.5 h-3.5" />
          Show Raw JSON
        </button>
      </div>

      {/* Analysis Sticky Notes Layer */}
      <AnalysisStickyNotesLayer containerRef={analysisContainerRef} />

      {/* Feedback Popup */}
      <FeedbackPopup
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </div>
  );
}
