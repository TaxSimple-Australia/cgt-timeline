'use client';

import { useEffect, useState } from 'react';
import Timeline from '@/components/Timeline';
import PropertyPanel from '@/components/PropertyPanel';
import ConversationBox from '@/components/ConversationBox';
import { ModelResponseDisplay } from '@/components/model-response';
import LoadingSpinner from '@/components/model-response/LoadingSpinner';
import ErrorDisplay from '@/components/model-response/ErrorDisplay';
import { useTimelineStore } from '@/store/timeline';
import { useValidationStore } from '@/store/validation';
import { transformTimelineToAPIFormat } from '@/lib/transform-timeline-data';
import { transformAPIResponse } from '@/lib/transform-api-response';
import { ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CGTModelResponse } from '@/types/model-response';

export default function Home() {
  const { selectedProperty, loadDemoData, properties, events } = useTimelineStore();
  const { setValidationIssues, clearValidationIssues, setApiConnected } = useValidationStore();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<CGTModelResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check API connection on mount
  useEffect(() => {
    // Check if API is configured
    const apiUrl = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;
    setApiConnected(!!apiUrl && apiUrl !== 'YOUR_MODEL_API_URL_HERE');
  }, []);

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
    setShowAnalysis(true);

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
        throw new Error(result.error || 'API request failed');
      }

      // Transform API response to expected format
      const transformedData = transformAPIResponse(result.data);
      console.log('🔄 Transformed data:', transformedData);

      // Set validation issues in store
      if (transformedData.response?.issues) {
        setValidationIssues(transformedData.response.issues, properties);
      }
      setApiConnected(true);

      setAnalysisData(transformedData);
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

  // Retry function
  const handleRetry = () => {
    setError(null);
    handleAnalyze();
  };

  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Timeline Area */}
        <div className="flex-1 h-full">
          <Timeline className="w-full h-full" />
        </div>

        {/* Property Details Panel (slides in when property selected) */}
        {selectedProperty && <PropertyPanel />}
      </div>

      {/* Conversation Box - Always visible at bottom center */}
      {!showAnalysis && (
        <ConversationBox
          onSendQuery={handleQuerySubmit}
          isLoading={isLoading}
        />
      )}

      {/* CGT Analysis Panel (Collapsible Bottom Panel) */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 overflow-hidden"
          >
            <div className="relative">
              {/* Toggle Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
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
                >
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                  {isLoading ? (
                    <LoadingSpinner message="Analyzing your CGT with AI..." />
                  ) : error ? (
                    <ErrorDisplay message={error} onRetry={handleRetry} />
                  ) : analysisData ? (
                    <ModelResponseDisplay responseData={analysisData} />
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
