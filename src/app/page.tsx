'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Timeline from '@/components/Timeline';
import PropertyPanel from '@/components/PropertyPanel';
import ConversationBox from '@/components/ConversationBox';
import CGTAnalysisDisplay from '@/components/ai-response/CGTAnalysisDisplay';
import LoadingSpinner from '@/components/model-response/LoadingSpinner';
import ErrorDisplay from '@/components/model-response/ErrorDisplay';
import FeedbackModal from '@/components/FeedbackModal';
import NotesModal from '@/components/NotesModal';
import AllResolvedPopup from '@/components/AllResolvedPopup';
import PropertyIssueOverlay from '@/components/PropertyIssueOverlay';
import SuggestedQuestionsPanel from '@/components/SuggestedQuestionsPanel';
import { useTimelineStore } from '@/store/timeline';
import type { SuggestedQuestion } from '@/types/suggested-questions';
import { useValidationStore } from '@/store/validation';
import { transformTimelineToAPIFormat } from '@/lib/transform-timeline-data';
import { extractVerificationAlerts } from '@/lib/extract-verification-alerts';
import { deserializeTimeline } from '@/lib/timeline-serialization';
import '@/lib/test-verification-alerts'; // Load test utilities for browser console
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Loading screen component for Suspense fallback
function ShareLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-sm text-center shadow-xl">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Loading shared timeline...</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we load your data</p>
      </div>
    </div>
  );
}

// Main page content component
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    selectedProperty,
    loadDemoData,
    importTimelineData,
    properties,
    events,
    selectedIssue,
    timelineIssues,
    selectIssue,
    resolveIssue,
    verificationAlerts,
    setVerificationAlerts,
    clearVerificationAlerts,
    getAllVerificationAlertsResolved,
    getCurrentAlert,
    getUnresolvedAlerts,
    resolveVerificationAlert,
    panToDate,
    enableAISuggestedQuestions,
    apiResponseMode,
    setTimelineNotes,
  } = useTimelineStore();
  const { setValidationIssues, clearValidationIssues, setApiConnected } = useValidationStore();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllResolvedPopup, setShowAllResolvedPopup] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<string | null>(null);
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // AI Suggested Questions state
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [suggestedQuestionsContext, setSuggestedQuestionsContext] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Ref to track if we've loaded demo alerts (prevent re-loading on resolution)
  const demoAlertsLoadedRef = useRef(false);
  // Ref to track if we've already processed the share parameter
  const shareProcessedRef = useRef(false);

  // Load shared timeline from URL parameter
  useEffect(() => {
    const shareId = searchParams.get('share');

    // Only process if there's a share param and we haven't processed it yet
    if (shareId && !shareProcessedRef.current) {
      shareProcessedRef.current = true;
      loadSharedTimeline(shareId);
    }
  }, [searchParams]);

  // Function to load shared timeline data
  async function loadSharedTimeline(shareId: string) {
    setIsLoadingShare(true);
    setShareError(null);
    console.log(`🔗 Loading shared timeline: ${shareId}`);

    try {
      const response = await fetch(`/api/timeline/${shareId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load timeline');
      }

      if (result.success && result.data) {
        console.log('✅ Shared timeline loaded successfully:', result.data);

        // Deserialize and import the timeline data
        const deserialized = deserializeTimeline({
          version: 1,
          properties: result.data.properties,
          events: result.data.events,
          notes: result.data.notes,
        });

        importTimelineData({
          properties: deserialized.properties,
          events: deserialized.events,
        });

        // Load notes if present
        if (deserialized.notes) {
          setTimelineNotes(deserialized.notes);
        }

        // Clear URL parameter without page reload
        router.replace('/', { scroll: false });
      }
    } catch (error) {
      console.error('❌ Error loading shared timeline:', error);
      setShareError(error instanceof Error ? error.message : 'Failed to load shared timeline');
      // Clear URL parameter even on error
      router.replace('/', { scroll: false });
    } finally {
      setIsLoadingShare(false);
    }
  }

  // Load demo data on initial mount (only if not loading from share link)
  useEffect(() => {
    const shareId = searchParams.get('share');
    if (properties.length === 0 && !shareId) {
      loadDemoData().catch(err => {
        console.error('Failed to load demo data:', err);
      });
    }
  }, []); // Only run once on mount

  // TEST: Auto-load verification alerts from demo response on mount (ONCE ONLY)
  // DISABLED: Complete demo scenario has no gaps, so no need to auto-load alerts
  // useEffect(() => {
  //   const loadDemoVerificationAlerts = async () => {
  //     try {
  //       const response = await fetch('/NewRequestsAndResponses/4_new_response_with_gaps.json');
  //       const demoResponse = await response.json();
  //       console.log('🧪 TEST: Loading demo response with gaps:', demoResponse);

  //       // Extract verification alerts
  //       const alerts = extractVerificationAlerts(demoResponse, properties);
  //       console.log('🧪 TEST: Extracted alerts from demo response:', alerts);

  //       if (alerts.length > 0) {
  //         setVerificationAlerts(alerts);
  //         demoAlertsLoadedRef.current = true; // Mark as loaded
  //         console.log('🧪 TEST: Set verification alerts in store');
  //       }
  //     } catch (err) {
  //       console.error('🧪 TEST: Failed to load demo verification alerts:', err);
  //     }
  //   };

  //   // Only load ONCE after properties are loaded and we haven't loaded before
  //   if (properties.length > 0 && !demoAlertsLoadedRef.current) {
  //     loadDemoVerificationAlerts();
  //   }
  // }, [properties.length]); // Only re-run when properties.length changes

  // Check API connection on mount
  useEffect(() => {
    // Check if API is configured
    const apiUrl = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;
    setApiConnected(!!apiUrl && apiUrl !== 'YOUR_MODEL_API_URL_HERE');
  }, []);

  // Watch for all verification alerts being resolved
  useEffect(() => {
    if (getAllVerificationAlertsResolved()) {
      console.log('✅ All verification alerts resolved!');
      setShowAllResolvedPopup(true);
    }
  }, [verificationAlerts, getAllVerificationAlertsResolved]);

  // Clear analysis data when timeline is cleared
  useEffect(() => {
    if (properties.length === 0 && events.length === 0) {
      console.log('🗑️ Timeline cleared - clearing analysis data');
      setAnalysisData(null);
      setError(null);
      setShowAnalysis(false);
    }
  }, [properties.length, events.length]);

  // Function to trigger CGT analysis with custom query
  const handleAnalyze = async (customQuery?: string) => {
    if (properties.length === 0) {
      setError('No properties to analyze. Please add properties to your timeline first.');
      setShowAnalysis(true);
      return;
    }

    // Check if API is configured
    const apiUrl = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;
    if (!apiUrl || apiUrl === 'YOUR_MODEL_API_URL_HERE') {
      setError('API URL not configured. Please add NEXT_PUBLIC_CGT_MODEL_API_URL to your .env.local file.');
      setShowAnalysis(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowAnalysis(true); // Show analysis panel immediately to display loading progress

    try {
      // Debug: Log sale events before transformation
      const saleEvents = events.filter(e => e.type === 'sale');
      console.log('🔍 Sale events before transform:', saleEvents.map(e => ({
        id: e.id,
        date: e.date,
        contractDate: e.contractDate,
        dateStr: e.date instanceof Date ? e.date.toISOString() : e.date,
        contractDateStr: e.contractDate instanceof Date ? e.contractDate.toISOString() : e.contractDate,
      })));

      // Transform timeline data to API format
      const apiData = transformTimelineToAPIFormat(properties, events, customQuery);

      console.log('📤 Sending data to API:', JSON.stringify(apiData, null, 2));
      console.log(`🔗 Using API Response Mode: ${apiResponseMode}`);

      // Call the API with the response mode setting
      const response = await fetch('/api/analyze-cgt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...apiData, responseMode: apiResponseMode }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 Received from API:', result);

      if (!result.success) {
        // Format error message for better user experience
        const errorMessage = result.error || 'API request failed';
        const displayError = `Analysis Error: ${errorMessage}`;

        if (result.errorDetails) {
          console.error('📋 Error details:', result.errorDetails);
        }

        throw new Error(displayError);
      }

      // Use raw API response data
      console.log('✅ Using raw API data:', result.data);

      // Extract data from nested structure (new API format: result.data.data)
      // Also support old format for backwards compatibility
      const analysisData = result.data.data || result.data;
      console.log('📊 Extracted analysis data:', analysisData);

      // Check if API needs clarification - handle multiple response formats
      const needsClarification =
        analysisData?.needs_clarification === true ||
        analysisData?.summary?.requires_clarification === true ||
        analysisData?.status === "verification_failed";

      if (needsClarification) {
        // Extract verification alerts for failed properties
        const alerts = extractVerificationAlerts(analysisData, properties);
        console.log('🚨 Extracted alerts (needs clarification):', alerts);
        setVerificationAlerts(alerts);

        // Set validation issues in store if present
        if (analysisData.verification?.issues) {
          setValidationIssues(analysisData.verification.issues, properties);
        }

        // Close the analysis panel - alerts will be displayed on timeline ONLY
        console.log('⚠️ Verification alerts detected - closing analysis panel to show alerts on timeline');
        setShowAnalysis(false);
        // DON'T set analysisData when we have clarifications - we want ONLY timeline alerts, not panel questions
        setAnalysisData(null);
      } else {
        // Analysis is complete - no clarifications needed
        console.log('✅ Analysis complete - no clarifications needed');
        setVerificationAlerts([]); // Clear any previous alerts
        setAnalysisData(analysisData); // Set the actual analysis results
      }

      setApiConnected(true);
      // If no alerts, analysis panel stays open showing results
    } catch (err) {
      console.error('❌ Error analyzing CGT:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to analyze CGT. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for conversation queries
  const handleQuerySubmit = async (query: string) => {
    await handleAnalyze(query);
  };

  // Handler for fetching AI suggested questions
  const handleFetchSuggestedQuestions = async () => {
    if (properties.length === 0) {
      setSuggestionsError('No properties to analyze. Please add properties to your timeline first.');
      setShowSuggestedQuestions(true);
      return;
    }

    setShowSuggestedQuestions(true);
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);
    setSuggestedQuestions([]);
    setSuggestedQuestionsContext('');

    try {
      // Transform timeline data to API format
      const apiData = transformTimelineToAPIFormat(properties, events);

      console.log('📤 Fetching suggested questions:', apiData);

      const response = await fetch('/api/suggest-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();
      console.log('📥 Suggested questions response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch suggested questions');
      }

      setSuggestedQuestions(result.data.suggested_questions || []);
      setSuggestedQuestionsContext(result.data.context_summary || '');
    } catch (err) {
      console.error('❌ Error fetching suggested questions:', err);
      setSuggestionsError(
        err instanceof Error ? err.message : 'Failed to generate question suggestions'
      );
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handler for when user selects a suggested question
  const handleSelectSuggestedQuestion = async (question: string) => {
    setShowSuggestedQuestions(false);
    await handleAnalyze(question);
  };

  // Handler for re-submitting after all verification issues are resolved
  const handleResubmitWithResolutions = async () => {
    console.log('📤 Re-submitting with resolved verification alerts');
    console.log('📊 Current verification alerts:', verificationAlerts);
    console.log('📊 Properties:', properties.length);
    console.log('📊 Events:', events.length);

    setIsLoading(true);
    setError(null);
    setShowAnalysis(true); // Open analysis panel immediately to show loading state

    try {
      // Transform timeline data to API format
      const apiData = transformTimelineToAPIFormat(properties, events);

      // Add verification responses to API data
      const verificationsData = verificationAlerts.map((alert) => {
        const verification: any = {
          property_address: alert.propertyAddress,
          issue_period: {
            start_date: alert.startDate,
            end_date: alert.endDate,
          },
          resolution_question: alert.resolutionText,
          user_response: alert.userResponse,
          resolved_at: alert.resolvedAt,
        };

        // Include question_id if available
        if (alert.questionId) {
          verification.question_id = alert.questionId;
        }

        return verification;
      });

      console.log('✅ TIMELINE alerts converted to verification_responses:', {
        totalAlerts: verificationAlerts.length,
        resolvedAlerts: verificationAlerts.filter(a => a.resolved).length,
        alertsWithQuestionId: verificationAlerts.filter(a => a.questionId).length,
        verificationsData: JSON.stringify(verificationsData, null, 2),
      });

      // Include verifications in the request
      const requestData = {
        ...apiData,
        verification_responses: verificationsData,
      };

      console.log('📤 Sending resolved data to API:', requestData);

      // Check if API is configured
      const apiUrl = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;
      const isApiConfigured = apiUrl && apiUrl !== 'YOUR_MODEL_API_URL_HERE';

      let result;

      if (isApiConfigured) {
        console.log('🌐 Calling CGT API with verified responses...');
        console.log(`🔗 Using API Response Mode: ${apiResponseMode}`);
        // Call the same API endpoint with verification responses
        const response = await fetch('/api/analyze-cgt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...requestData, responseMode: apiResponseMode }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        result = await response.json();
        console.log('📥 Received from API after resolution:', result);

        if (!result.success) {
          // Format error message for better user experience
          const errorMessage = result.error || 'API request failed';
          const displayError = `Analysis Error: ${errorMessage}`;

          if (result.errorDetails) {
            console.error('📋 Error details:', result.errorDetails);
          }

          throw new Error(displayError);
        }
      } else {
        console.log('🧪 DEMO MODE: Using successful demo response (no API configured)');
        // Load successful demo response for demonstration
        const demoResponseFile = await fetch('/NewRequestsAndResponses/1_new_successful_response_json.json');
        const demoData = await demoResponseFile.json();
        result = {
          success: true,
          data: demoData,
        };
        console.log('📥 Loaded demo success response:', result);

        // Simulate API delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Clear old verification alerts since they've been resolved
      clearVerificationAlerts();

      // Popup already closed by button click
      // setShowAllResolvedPopup(false); // Not needed - already closed

      // Set validation issues in store if present
      if (result.data.verification?.issues) {
        setValidationIssues(result.data.verification.issues, properties);
      }

      setAnalysisData(result.data);

      // Analysis panel is already open (set at start of function)
      console.log('✅ Successfully re-submitted with verifications - showing CGT analysis');
    } catch (err) {
      console.error('❌ Error re-submitting with verifications:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to re-submit verification data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Retry function
  const handleRetry = () => {
    setError(null);
    handleAnalyze();
  };

  // Handler for retrying analysis with gap question answers
  const handleRetryWithGapAnswers = async (
    answers: Array<{
      question: string;
      answer: string;
      period: { start: string; end: string; days: number };
      properties_involved: string[];
      question_id?: string; // Include question_id for API matching
    }>
  ) => {
    console.log('📤 Retrying analysis with gap answers:', answers);

    setIsLoading(true);
    setError(null);
    // Keep analysis panel open to show loading state

    try {
      // Transform timeline data to API format
      const apiData = transformTimelineToAPIFormat(properties, events);

      // Transform gap answers to verification_responses format expected by API
      const verificationsData = answers.map((answer) => {
        const verification: any = {
          property_address: answer.properties_involved[0] || 'Unknown',
          issue_period: {
            start_date: answer.period.start,
            end_date: answer.period.end,
          },
          resolution_question: answer.question,
          user_response: answer.answer,
          resolved_at: new Date().toISOString(),
        };

        // Include question_id if provided (API uses this for matching)
        if (answer.question_id) {
          verification.question_id = answer.question_id;
        }

        return verification;
      });

      // Add gap answers to the request
      const requestData = {
        ...apiData,
        verification_responses: verificationsData,
      };

      console.log('📤 Sending data with gap clarifications to API:');
      console.log('📋 Original Answers from GapQuestionsPanel:', JSON.stringify(answers, null, 2));
      console.log('📋 Transformed Verification Responses:', JSON.stringify(verificationsData, null, 2));
      console.log('📋 Full Request Payload:', JSON.stringify(requestData, null, 2));
      console.log(`🔗 Using API Response Mode: ${apiResponseMode}`);

      // Call the same API endpoint with clarification answers included
      const response = await fetch('/api/analyze-cgt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...requestData, responseMode: apiResponseMode }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('📥 Received from API after gap clarifications:', result);

      if (!result.success) {
        const errorMessage = result.error || 'API request failed';
        const displayError = `Analysis Error: ${errorMessage}`;

        if (result.errorDetails) {
          console.error('📋 Error details:', result.errorDetails);
        }

        throw new Error(displayError);
      }

      // Check if API still needs clarification - handle multiple response formats
      const stillNeedsClarification =
        result.data?.needs_clarification === true ||
        result.data?.summary?.requires_clarification === true ||
        result.data?.status === "verification_failed";

      if (stillNeedsClarification) {
        // Extract verification alerts for remaining issues
        const alerts = extractVerificationAlerts(result.data, properties);
        console.log('🚨 Extracted alerts after retry (still needs clarification):', alerts);
        setVerificationAlerts(alerts);

        // Set validation issues in store if present
        if (result.data.verification?.issues) {
          setValidationIssues(result.data.verification.issues, properties);
        }

        // DON'T set analysisData - we want ONLY timeline alerts, not panel questions
        setAnalysisData(null);
        console.log('⚠️ Still have verification alerts - closing panel to show alerts on timeline ONLY');
        setShowAnalysis(false);
      } else {
        // Analysis is complete - no more clarifications needed
        console.log('✅ Analysis successful after gap clarifications - no more clarifications needed');
        setVerificationAlerts([]); // Clear any previous alerts
        setAnalysisData(result.data); // Now we can show the actual results
        // Keep panel open to show final results
      }
    } catch (err) {
      console.error('❌ Error retrying with gap answers:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to retry analysis with gap clarifications. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col">
      {/* Share Loading Overlay */}
      {isLoadingShare && <ShareLoadingScreen />}

      {/* Share Error Toast */}
      {shareError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <p className="font-medium">Failed to load shared timeline</p>
          <p className="text-sm text-red-100">{shareError}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Timeline Area */}
        <div className="flex-1 h-full">
          <Timeline
            className="w-full h-full"
            onAlertClick={(alertId) => setSelectedAlertForModal(alertId)}
          />
        </div>

        {/* Property Details Panel (slides in when property selected) */}
        {selectedProperty && <PropertyPanel />}
      </div>

      {/* Conversation Box - Always visible at bottom center */}
      {!showAnalysis && (
        <ConversationBox
          onSendQuery={handleQuerySubmit}
          isLoading={isLoading}
          showViewAnalysisButton={!!analysisData}
          onViewAnalysis={() => setShowAnalysis(true)}
          useAISuggestions={enableAISuggestedQuestions}
          onQuestionButtonClick={handleFetchSuggestedQuestions}
        />
      )}

      {/* AI Suggested Questions Panel */}
      <SuggestedQuestionsPanel
        isOpen={showSuggestedQuestions}
        onClose={() => setShowSuggestedQuestions(false)}
        onSelectQuestion={handleSelectSuggestedQuestion}
        suggestedQuestions={suggestedQuestions}
        contextSummary={suggestedQuestionsContext}
        isLoading={isLoadingSuggestions}
        error={suggestionsError}
      />

      {/* CGT Analysis Panel (Full Screen Overlay) */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.4 }}
            className="absolute inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col"
          >
            {/* Toggle Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  CGT Analysis Results
                </h2>
                {isLoading && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    Analyzing...
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowAnalysis(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close analysis panel"
              >
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content - Takes remaining space */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                {isLoading ? (
                  <LoadingSpinner />
                ) : error ? (
                  <ErrorDisplay message={error} onRetry={handleRetry} />
                ) : analysisData && getUnresolvedAlerts().length === 0 ? (
                  <CGTAnalysisDisplay
                    response={analysisData}
                    onRetryWithAnswers={handleRetryWithGapAnswers}
                  />
                ) : getUnresolvedAlerts().length > 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Verification Required
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Please resolve {getUnresolvedAlerts().length} verification{' '}
                        {getUnresolvedAlerts().length === 1 ? 'issue' : 'issues'} before viewing
                        the CGT analysis.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        The verification dialog will appear above the timeline.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Feedback Modal - Only for non-gap issues */}
      {/* Gap issues are handled by GilbertBranch VerificationAlertBar → PropertyIssueOverlay */}
      <FeedbackModal
        issue={selectedIssue ? timelineIssues.find(i => i.id === selectedIssue && i.category !== 'timeline_gap') || null : null}
        onClose={() => selectIssue(null)}
        onResolve={resolveIssue}
      />

      {/* All Verification Alerts Resolved Popup */}
      <AllResolvedPopup
        isOpen={showAllResolvedPopup}
        onClose={() => setShowAllResolvedPopup(false)}
        onProceed={handleResubmitWithResolutions}
        resolvedCount={verificationAlerts.length}
        isSubmitting={isLoading}
      />

      {/* Property Verification Issue Overlay - Shows when user clicks on alert */}
      {selectedAlertForModal && (
        <PropertyIssueOverlay
          alert={verificationAlerts.find((a) => a.id === selectedAlertForModal)!}
          onClose={() => setSelectedAlertForModal(null)}
          onResolve={(alertId, userResponse) => {
            console.log('✅ Resolving alert:', alertId, 'with response:', userResponse);
            resolveVerificationAlert(alertId, userResponse);

            // Close modal immediately to show green tick
            setSelectedAlertForModal(null);

            // Check if there's a next alert after a delay so user can see the green tick
            setTimeout(() => {
              const nextAlert = getCurrentAlert();
              if (nextAlert && nextAlert.id !== alertId) {
                console.log('📍 Panning to next alert:', nextAlert.id);

                // Calculate the midpoint of the alert period for smooth panning
                const alertStartDate = new Date(nextAlert.startDate);
                const alertEndDate = new Date(nextAlert.endDate);
                const midpoint = new Date(
                  (alertStartDate.getTime() + alertEndDate.getTime()) / 2
                );

                // Pan timeline to center on the next alert (1000ms smooth animation)
                panToDate(midpoint);

                // Open modal after pan animation completes (1000ms + 100ms buffer)
                setTimeout(() => {
                  console.log('📂 Opening next alert modal:', nextAlert.id);
                  setSelectedAlertForModal(nextAlert.id);
                }, 1100); // Delay for smooth pan animation to complete
              } else {
                // No more unresolved alerts
                console.log('✅ All alerts resolved - popup will appear');
              }
            }, 800); // Delay to show green tick and let user see the change
          }}
          alertNumber={
            verificationAlerts.findIndex((a) => a.id === selectedAlertForModal) + 1
          }
          totalAlerts={verificationAlerts.length}
        />
      )}

      {/* Notes Modal - Timeline notes/feedback */}
      <NotesModal />
    </main>
  );
}

// Main export with Suspense wrapper for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={<ShareLoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}
