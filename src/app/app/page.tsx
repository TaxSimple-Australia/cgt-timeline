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
// deserializeTimeline replaced by importShareableData from store
import '@/lib/test-verification-alerts'; // Load test utilities for browser console
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AITimelineBuilder, AIBuilderButton } from '@/components/ai-builder';
import SessionRestoreModal from '@/components/SessionRestoreModal';
import SaveIndicator from '@/components/SaveIndicator';
import TermsAcceptanceModal, { hasAcceptedTerms as checkTermsAccepted } from '@/components/TermsAcceptanceModal';
import { useEnhancedStore, initializeEnhancer } from '@/store/storeEnhancer';
import { useUndoRedoShortcuts } from '@/hooks/useUndoRedoShortcuts';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

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
  const { showModal, handleAccept, handleClose, hasAcceptedTerms } = useTermsAcceptance();
  const {
    selectedProperty,
    loadDemoData,
    migrateSaleEventTitles,
    importTimelineData,
    importShareableData,
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
    setAPIResponseMode,
    setTimelineNotes,
    selectedLLMProvider,
    savedAnalysis,
    aiResponse,
    setAIResponse,
    marginalTaxRate,
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

  // AI Timeline Builder state
  const [isAIBuilderOpen, setIsAIBuilderOpen] = useState(false);

  // CCH Verification state
  const [cchVerifying, setCchVerifying] = useState(false);

  /**
   * Automatically run CCH verification after successful CGT analysis
   */
  const runAutoCCHVerification = async (response: any) => {
    // Store the AI response in sessionStorage so CCH tab can access it
    try {
      sessionStorage.setItem('cgt_ai_response', JSON.stringify(response));
      console.log('💾 Stored AI response in sessionStorage');
    } catch (e) {
      console.error('Error storing AI response:', e);
    }

    // Extract verification_prompt from various response structures
    const verificationPrompt = response?.verification_prompt ||
                               response?.data?.verification_prompt ||
                               response?.data?.data?.verification_prompt;

    if (!verificationPrompt) {
      console.log('ℹ️ No verification_prompt in response, skipping CCH verification');
      return;
    }

    console.log('🔄 Auto-triggering CCH verification...');
    setCchVerifying(true);

    try {
      const apiResponse = await fetch('/api/cch/verify-and-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_response: response
        })
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok || !data.success) {
        console.error('❌ CCH verification failed:', data.error);
        return;
      }

      console.log('✅ CCH Verification completed successfully');
      // Store result in sessionStorage for the CCH tab to display
      sessionStorage.setItem('cch_verification_result', JSON.stringify(data));
    } catch (err) {
      console.error('❌ CCH verification error:', err);
    } finally {
      setCchVerifying(false);
    }
  };

  // Terms Acceptance state - shows first before anything else
  const [termsAccepted, setTermsAccepted] = useState(() => {
    // Check on initial render if terms are already accepted
    if (typeof window !== 'undefined') {
      return checkTermsAccepted();
    }
    return false;
  });

  // Session Restore state - only shows after terms are accepted
  // Initialize to true if terms are already accepted
  const [showSessionRestore, setShowSessionRestore] = useState(() => {
    if (typeof window !== 'undefined') {
      return checkTermsAccepted();
    }
    return false;
  });
  const [sessionRestoreComplete, setSessionRestoreComplete] = useState(false);

  // Enhanced store hooks (auto-save, undo/redo)
  const enhancedStore = useEnhancedStore();

  // Keyboard shortcuts for undo/redo (Ctrl+Z, Ctrl+Y)
  useUndoRedoShortcuts({ enabled: sessionRestoreComplete });

  // Warn before leaving with unsaved changes
  useBeforeUnload({ enabled: sessionRestoreComplete });

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
        console.log('✅ Shared timeline loaded successfully:', {
          properties: result.data.properties?.length,
          events: result.data.events?.length,
          timelineStickyNotes: result.data.timelineStickyNotes?.length,
          hasAnalysis: !!result.data.savedAnalysis,
          analysisStickyNotes: result.data.savedAnalysis?.analysisStickyNotes?.length,
        });

        // Use importShareableData to load EVERYTHING including sticky notes and analysis
        importShareableData(result.data);

        // If there's saved analysis, auto-show it
        if (result.data.savedAnalysis?.response) {
          console.log('📊 Shared timeline has analysis - auto-showing');
          setAnalysisData(result.data.savedAnalysis.response);
          setShowAnalysis(true);
        }

        // Clear URL parameter without page reload
        router.replace('/app', { scroll: false });
      }
    } catch (error) {
      console.error('❌ Error loading shared timeline:', error);
      setShareError(error instanceof Error ? error.message : 'Failed to load shared timeline');
      // Clear URL parameter even on error
      router.replace('/app', { scroll: false });
    } finally {
      setIsLoadingShare(false);
    }
  }

  // NOTE: Demo data loading disabled - app starts with empty timeline
  // Users can manually load demo data or use the AI Timeline Builder
  // useEffect(() => {
  //   const shareId = searchParams.get('share');
  //   if (properties.length === 0 && !shareId) {
  //     loadDemoData().catch(err => {
  //       console.error('Failed to load demo data:', err);
  //     });
  //   }
  // }, []);

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

  // Run data migration on mount (one-time fix for sale event titles)
  useEffect(() => {
    migrateSaleEventTitles();
  }, [migrateSaleEventTitles]);

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

  // Helper function to check if API response format is valid/recognizable
  // Returns true if the response can be displayed properly
  const isValidResponseFormat = (response: any): boolean => {
    if (!response) return false;

    // Check for JSON formats (double-wrapped, wrapped, or direct)
    const isDoubleWrappedFormat = response.success !== undefined &&
      response.data?.success !== undefined &&
      response.data?.data?.properties &&
      response.data?.data?.properties.length > 0;

    const isWrappedFormat = !isDoubleWrappedFormat &&
      response.success !== undefined &&
      response.data &&
      response.data.properties &&
      response.data.properties.length > 0;

    const isDirectFormat = !isDoubleWrappedFormat &&
      !isWrappedFormat &&
      response.properties &&
      response.properties.length > 0 &&
      response.properties[0]?.property_address;

    const isNewJSONFormat = isDoubleWrappedFormat || isWrappedFormat || isDirectFormat;

    // Check for markdown formats
    const isNewMarkdownFormat = typeof response.answer === 'string' && response.answer.length > 0;
    const hasLegacyMarkdownAnalysis = typeof response.analysis === 'string' && response.analysis.length > 0;
    const hasMarkdownAnalysis = isNewMarkdownFormat || hasLegacyMarkdownAnalysis;

    return isNewJSONFormat || hasMarkdownAnalysis;
  };

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
      const apiData = transformTimelineToAPIFormat(properties, events, customQuery, undefined);

      console.log('📤 Sending data to API:', JSON.stringify(apiData, null, 2));
      console.log(`🔗 Using API Response Mode: ${apiResponseMode}`);
      console.log(`🤖 Using LLM Provider: ${selectedLLMProvider}`);

      // Call the Next.js API route
      const response = await fetch('/api/calculate-cgt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...apiData, responseMode: apiResponseMode, llmProvider: selectedLLMProvider }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      let result = await response.json();
      console.log('📥 Received from API:', result);

      if (!result.success) {
        const errorMessage = result.error || 'API request failed';
        const displayError = `Analysis Error: ${errorMessage}`;

        if (result.errorDetails) {
          console.error('📋 Error details:', result.errorDetails);
        }

        throw new Error(displayError);
      }

      // Check if response format is valid - if not and we're in JSON mode, auto-fallback to markdown
      if (!isValidResponseFormat(result.data) && apiResponseMode === 'json') {
        console.log('⚠️ Unknown response format detected in JSON mode - auto-switching to markdown mode');
        setAPIResponseMode('markdown');

        // Retry the API call with markdown mode
        const retryResponse = await fetch('/api/calculate-cgt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...apiData, responseMode: 'markdown', llmProvider: selectedLLMProvider }),
        });

        if (!retryResponse.ok) {
          throw new Error(`API retry request failed with status ${retryResponse.status}`);
        }

        result = await retryResponse.json();
        console.log('📥 Received from API (markdown fallback):', result);

        if (!result.success) {
          const errorMessage = result.error || 'API request failed';
          throw new Error(`Analysis Error: ${errorMessage}`);
        }
      }

      // Use raw API response data
      console.log('✅ Using raw API data:', result.data);

      // IMPORTANT: Keep the FULL response structure including sources, query, etc.
      const fullResponse = result.data;
      // For backwards compatibility, also get the inner data for checks
      const innerData = result.data.data || result.data;

      // Debug: Log the full structure to verify sources are present
      console.log('📊 Full response structure keys:', Object.keys(fullResponse || {}));
      console.log('📊 Has sources?:', !!fullResponse?.sources);
      console.log('📊 Has query?:', !!fullResponse?.query);
      console.log('📊 Inner analysis data keys:', Object.keys(innerData || {}));

      // Check if API needs clarification - handle multiple response formats
      // Use innerData for compatibility checks
      const needsClarification =
        innerData?.needs_clarification === true ||
        fullResponse?.needs_clarification === true ||
        innerData?.summary?.requires_clarification === true ||
        innerData?.status === "verification_failed";

      if (needsClarification) {
        // Extract verification alerts for failed properties
        const alerts = extractVerificationAlerts(innerData, properties);
        console.log('🚨 Extracted alerts (needs clarification):', alerts);
        setVerificationAlerts(alerts);

        // Set validation issues in store if present
        if (innerData.verification?.issues) {
          setValidationIssues(innerData.verification.issues, properties);
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
        // IMPORTANT: Store the FULL response including sources, query, etc.
        setAnalysisData(fullResponse);
        setAIResponse(fullResponse); // Also save to store for sharing
        // Auto-trigger CCH verification
        runAutoCCHVerification(fullResponse);
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
      const apiData = transformTimelineToAPIFormat(properties, events, undefined, undefined);

      console.log('📤 Fetching suggested questions:', apiData);
      console.log(`🤖 Using LLM Provider: ${selectedLLMProvider}`);

      const response = await fetch('/api/suggest-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...apiData, llmProvider: selectedLLMProvider }),
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
      const apiData = transformTimelineToAPIFormat(properties, events, undefined, undefined);

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
        console.log(`🤖 Using LLM Provider: ${selectedLLMProvider}`);

        // Call the Next.js API route with verification responses
        const response = await fetch('/api/calculate-cgt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...requestData, responseMode: apiResponseMode, llmProvider: selectedLLMProvider }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        result = await response.json();
        console.log('📥 Received from API after resolution:', result);

        if (!result.success) {
          const errorMessage = result.error || 'API request failed';
          const displayError = `Analysis Error: ${errorMessage}`;

          if (result.errorDetails) {
            console.error('📋 Error details:', result.errorDetails);
          }

          throw new Error(displayError);
        }

        // Check if response format is valid - if not and we're in JSON mode, auto-fallback to markdown
        if (!isValidResponseFormat(result.data) && apiResponseMode === 'json') {
          console.log('⚠️ Unknown response format detected in JSON mode - auto-switching to markdown mode');
          setAPIResponseMode('markdown');

          // Retry the API call with markdown mode
          const retryResponse = await fetch('/api/calculate-cgt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...requestData, responseMode: 'markdown', llmProvider: selectedLLMProvider }),
          });

          if (!retryResponse.ok) {
            throw new Error(`API retry request failed with status ${retryResponse.status}`);
          }

          result = await retryResponse.json();
          console.log('📥 Received from API after resolution (markdown fallback):', result);

          if (!result.success) {
            const errorMessage = result.error || 'API request failed';
            throw new Error(`Analysis Error: ${errorMessage}`);
          }
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

      // Store the FULL response including sources, query, etc.
      // result.data contains the complete external API response
      const fullResponse = result.data;
      console.log('📊 Re-submit: Full response keys:', Object.keys(fullResponse || {}));
      console.log('📊 Re-submit: Has sources?:', !!fullResponse?.sources);

      // Set validation issues in store if present
      const innerData = result.data.data || result.data;
      if (innerData.verification?.issues) {
        setValidationIssues(innerData.verification.issues, properties);
      }

      // Store the FULL response (not just inner data) to preserve sources and metadata
      setAnalysisData(fullResponse);
      setAIResponse(fullResponse); // Also save to store for sharing
      // Auto-trigger CCH verification
      runAutoCCHVerification(fullResponse);

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
      const apiData = transformTimelineToAPIFormat(properties, events, undefined, undefined);

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
      console.log(`🤖 Using LLM Provider: ${selectedLLMProvider}`);

      // Call the Next.js API route with clarification answers included
      const response = await fetch('/api/calculate-cgt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...requestData, responseMode: apiResponseMode, llmProvider: selectedLLMProvider }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      let result = await response.json();
      console.log('📥 Received from API after gap clarifications:', result);

      if (!result.success) {
        const errorMessage = result.error || 'API request failed';
        const displayError = `Analysis Error: ${errorMessage}`;

        if (result.errorDetails) {
          console.error('📋 Error details:', result.errorDetails);
        }

        throw new Error(displayError);
      }

      // Check if response format is valid - if not and we're in JSON mode, auto-fallback to markdown
      if (!isValidResponseFormat(result.data) && apiResponseMode === 'json') {
        console.log('⚠️ Unknown response format detected in JSON mode - auto-switching to markdown mode');
        setAPIResponseMode('markdown');

        // Retry the API call with markdown mode
        const retryResponse = await fetch('/api/calculate-cgt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...requestData, responseMode: 'markdown', llmProvider: selectedLLMProvider }),
        });

        if (!retryResponse.ok) {
          throw new Error(`API retry request failed with status ${retryResponse.status}`);
        }

        result = await retryResponse.json();
        console.log('📥 Received from API after gap clarifications (markdown fallback):', result);

        if (!result.success) {
          const errorMessage = result.error || 'API request failed';
          throw new Error(`Analysis Error: ${errorMessage}`);
        }
      }

      // Check if API still needs clarification - handle multiple response formats
      const stillNeedsClarification =
        result.data?.needs_clarification === true ||
        result.data?.summary?.requires_clarification === true ||
        result.data?.status === "verification_failed";

      // Store the FULL response including sources, query, etc.
      const fullResponse = result.data;
      const innerData = result.data.data || result.data;
      console.log('📊 Gap retry: Full response keys:', Object.keys(fullResponse || {}));
      console.log('📊 Gap retry: Has sources?:', !!fullResponse?.sources);

      if (stillNeedsClarification) {
        // Extract verification alerts for remaining issues
        const alerts = extractVerificationAlerts(innerData, properties);
        console.log('🚨 Extracted alerts after retry (still needs clarification):', alerts);
        setVerificationAlerts(alerts);

        // Set validation issues in store if present
        if (innerData.verification?.issues) {
          setValidationIssues(innerData.verification.issues, properties);
        }

        // DON'T set analysisData - we want ONLY timeline alerts, not panel questions
        setAnalysisData(null);
        console.log('⚠️ Still have verification alerts - closing panel to show alerts on timeline ONLY');
        setShowAnalysis(false);
      } else {
        // Analysis is complete - no more clarifications needed
        console.log('✅ Analysis successful after gap clarifications - no more clarifications needed');
        setVerificationAlerts([]); // Clear any previous alerts
        // Store the FULL response (not just inner data) to preserve sources and metadata
        setAnalysisData(fullResponse);
        setAIResponse(fullResponse); // Also save to store for sharing
        // Auto-trigger CCH verification
        runAutoCCHVerification(fullResponse);
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

      {/* Terms Acceptance Modal - Shows first before anything else */}
      {!termsAccepted && (
        <TermsAcceptanceModal
          onAccept={() => {
            setTermsAccepted(true);
            setShowSessionRestore(true);
          }}
        />
      )}

      {/* Session Restore Modal - Only shows after terms are accepted */}
      {termsAccepted && showSessionRestore && (
        <SessionRestoreModal
          onRestoreComplete={() => {
            setShowSessionRestore(false);
            setSessionRestoreComplete(true);
          }}
          onStartFresh={() => {
            setShowSessionRestore(false);
            setSessionRestoreComplete(true);
          }}
        />
      )}

      {/* Save Indicator */}
      {sessionRestoreComplete && (
        <SaveIndicator position="bottom-right" showAlways={false} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Timeline Area */}
        <div className="flex-1 h-full">
          <Timeline
            className="w-full h-full"
            onAlertClick={(alertId) => setSelectedAlertForModal(alertId)}
            onOpenAIBuilder={() => setIsAIBuilderOpen(true)}
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
          showViewAnalysisButton={!!(analysisData || aiResponse || savedAnalysis?.response)}
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
                ) : (analysisData || aiResponse || savedAnalysis?.response) && getUnresolvedAlerts().length === 0 ? (
                  <CGTAnalysisDisplay
                    response={analysisData || aiResponse || savedAnalysis?.response}
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

      {/* AI Timeline Builder - Voice/Chat interface for building timelines */}
      <AIBuilderButton
        onClick={() => setIsAIBuilderOpen(true)}
        isOpen={isAIBuilderOpen}
      />
      <AITimelineBuilder
        isOpen={isAIBuilderOpen}
        onClose={() => setIsAIBuilderOpen(false)}
      />

      {/* Terms & Conditions Modal - Safety check for direct access */}
      <TermsAndConditionsModal
        isOpen={showModal}
        onAccept={handleAccept}
        onClose={handleClose}
      />
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
