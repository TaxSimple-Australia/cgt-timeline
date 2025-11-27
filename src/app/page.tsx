'use client';

import { useEffect, useState, useRef } from 'react';
import Timeline from '@/components/Timeline';
import PropertyPanel from '@/components/PropertyPanel';
import ConversationBox from '@/components/ConversationBox';
import CGTAnalysisDisplay from '@/components/ai-response/CGTAnalysisDisplay';
import LoadingSpinner from '@/components/model-response/LoadingSpinner';
import ErrorDisplay from '@/components/model-response/ErrorDisplay';
import FeedbackModal from '@/components/FeedbackModal';
import AllResolvedPopup from '@/components/AllResolvedPopup';
import PropertyIssueOverlay from '@/components/PropertyIssueOverlay';
import { useTimelineStore } from '@/store/timeline';
import { useValidationStore } from '@/store/validation';
import { transformTimelineToAPIFormat } from '@/lib/transform-timeline-data';
import { extractVerificationAlerts } from '@/lib/extract-verification-alerts';
import '@/lib/test-verification-alerts'; // Load test utilities for browser console
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const {
    selectedProperty,
    loadDemoData,
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
  } = useTimelineStore();
  const { setValidationIssues, clearValidationIssues, setApiConnected } = useValidationStore();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllResolvedPopup, setShowAllResolvedPopup] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<string | null>(null);

  // Ref to track if we've loaded demo alerts (prevent re-loading on resolution)
  const demoAlertsLoadedRef = useRef(false);

  // Load demo data on initial mount
  useEffect(() => {
    if (properties.length === 0) {
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
      // Transform timeline data to API format
      const apiData = transformTimelineToAPIFormat(properties, events, customQuery);

      console.log('📤 Sending data to API:', apiData);

      // Call the API
      const response = await fetch('/api/analyze-cgt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
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

      // Extract verification alerts for failed properties
      const alerts = extractVerificationAlerts(result.data, properties);
      console.log('🚨 Extracted alerts:', alerts);
      setVerificationAlerts(alerts);

      // Set validation issues in store if present
      if (result.data.verification?.issues) {
        setValidationIssues(result.data.verification.issues, properties);
      }
      setApiConnected(true);

      setAnalysisData(result.data);

      // If verification alerts are detected, close the analysis panel
      // Alerts will be displayed on timeline for user to resolve
      if (alerts.length > 0) {
        console.log('⚠️ Verification alerts detected - closing analysis panel to show alerts on timeline');
        setShowAnalysis(false);
      }
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
      const verificationsData = verificationAlerts.map((alert) => ({
        property_address: alert.propertyAddress,
        issue_period: {
          start_date: alert.startDate,
          end_date: alert.endDate,
        },
        resolution_question: alert.resolutionText,
        user_response: alert.userResponse,
        resolved_at: alert.resolvedAt,
      }));

      console.log('✅ Verification responses prepared:', {
        totalAlerts: verificationAlerts.length,
        resolvedAlerts: verificationAlerts.filter(a => a.resolved).length,
        verificationsData,
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
        console.log('🌐 Calling real API with verification resolutions...');
        // Call the analyze-with-resolution API endpoint
        const response = await fetch('/api/analyze-with-resolution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
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
    }>
  ) => {
    console.log('📤 Retrying analysis with gap answers:', answers);

    setIsLoading(true);
    setError(null);
    // Keep analysis panel open to show loading state

    try {
      // Transform timeline data to API format
      const apiData = transformTimelineToAPIFormat(properties, events);

      // Add gap answers to the request
      const requestData = {
        ...apiData,
        gap_clarifications: answers,
      };

      console.log('📤 Sending data with gap clarifications to API:', requestData);

      // Call the API
      const response = await fetch('/api/analyze-cgt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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

      // Extract verification alerts for failed properties (in case there are still issues)
      const alerts = extractVerificationAlerts(result.data, properties);
      console.log('🚨 Extracted alerts after retry:', alerts);
      setVerificationAlerts(alerts);

      // Set validation issues in store if present
      if (result.data.verification?.issues) {
        setValidationIssues(result.data.verification.issues, properties);
      }

      setAnalysisData(result.data);

      // If no more verification alerts, analysis panel stays open showing results
      if (alerts.length === 0) {
        console.log('✅ Analysis successful after gap clarifications - showing results');
      } else {
        console.log('⚠️ Still have verification alerts - closing panel to show alerts');
        setShowAnalysis(false);
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
        />
      )}

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
    </main>
  );
}
