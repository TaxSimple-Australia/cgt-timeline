'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VerificationAlert } from '@/types/verification-alert';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface PropertyIssueOverlayProps {
  alert: VerificationAlert;
  onResolve: (alertId: string, userResponse: string) => void;
  alertNumber?: number;
  totalAlerts?: number;
}

export default function PropertyIssueOverlay({
  alert,
  onResolve,
  alertNumber = 1,
  totalAlerts = 1,
}: PropertyIssueOverlayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get question text and possible answers from alert
  const questionText = alert.clarificationQuestion || alert.resolutionText;
  const possibleAnswers = alert.possibleAnswers;

  // Reset state when alert changes
  useEffect(() => {
    setSelectedAnswer('');
    setCustomAnswer('');
    setShowCustomInput(false);
    setError(null);
  }, [alert.id]);

  const handleAnswerSelect = (answer: string) => {
    if (answer === 'other') {
      setShowCustomInput(true);
      setSelectedAnswer('other');
    } else {
      setShowCustomInput(false);
      setSelectedAnswer(answer);
      setCustomAnswer('');
    }
    setError(null);
  };

  const handleSubmit = async () => {
    // Validate input
    const finalAnswer = selectedAnswer === 'other' ? customAnswer : selectedAnswer;

    if (!finalAnswer || finalAnswer.trim().length === 0) {
      setError('Please select or enter an answer');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the resolve function
      await onResolve(alert.id, finalAnswer.trim());

      // Success - component will unmount/update when alert changes
      console.log('✅ Alert resolved:', alert.id, finalAnswer);
    } catch (err) {
      console.error('❌ Error resolving alert:', err);
      setError('Failed to submit answer. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 flex items-center justify-center p-4"
        style={{ zIndex: 20000 }}
      >
        {/* Overlay Card */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Property Verification Required
                </h2>
                <p className="text-sm text-red-100">
                  Issue {alertNumber} of {totalAlerts}
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-sm font-semibold text-white">
                {totalAlerts - alertNumber + 1} remaining
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Property Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {alert.propertyAddress}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Affected Period: {formatDate(alert.startDate)} → {formatDate(alert.endDate)}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    alert.severity === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : alert.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}
                >
                  {alert.severity?.toUpperCase() || 'WARNING'}
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Clarification Required:
              </label>
              <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                {questionText}
              </p>
            </div>

            {/* Answer Options */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Your Answer:
              </label>

              {possibleAnswers && possibleAnswers.length > 0 ? (
                // Show answer options if available
                <div className="space-y-2">
                  {possibleAnswers.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={isSubmitting}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedAnswer === option && !showCustomInput
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-purple-300 dark:hover:border-purple-700'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswer === option && !showCustomInput
                              ? 'border-purple-600 bg-purple-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedAnswer === option && !showCustomInput && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="flex-1">{option}</span>
                      </div>
                    </button>
                  ))}

                  {/* Other option */}
                  <button
                    onClick={() => handleAnswerSelect('other')}
                    disabled={isSubmitting}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      showCustomInput
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-purple-300 dark:hover:border-purple-700'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          showCustomInput
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {showCustomInput && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="flex-1 font-medium">Other (specify below)</span>
                    </div>
                  </button>
                </div>
              ) : (
                // Show textarea if no options parsed
                <div>
                  <textarea
                    value={customAnswer}
                    onChange={(e) => {
                      setCustomAnswer(e.target.value);
                      setSelectedAnswer('custom');
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    placeholder="Enter your answer here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none transition-all resize-none"
                  />
                </div>
              )}

              {/* Custom text input (shown when "Other" is selected) */}
              <AnimatePresence>
                {showCustomInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <textarea
                      value={customAnswer}
                      onChange={(e) => {
                        setCustomAnswer(e.target.value);
                        setError(null);
                      }}
                      disabled={isSubmitting}
                      placeholder="Please specify your answer..."
                      rows={4}
                      autoFocus
                      className="w-full px-4 py-3 rounded-lg border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none transition-all resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your answer will help us provide accurate CGT analysis
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!selectedAnswer && !customAnswer)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                isSubmitting || (!selectedAnswer && !customAnswer)
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Answer
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
