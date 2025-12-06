'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageSquare, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { SuggestedQuestion, questionCategoryInfo } from '@/types/suggested-questions';

interface SuggestedQuestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: string) => void;
  suggestedQuestions: SuggestedQuestion[];
  contextSummary: string;
  isLoading: boolean;
  error: string | null;
}

export default function SuggestedQuestionsPanel({
  isOpen,
  onClose,
  onSelectQuestion,
  suggestedQuestions,
  contextSummary,
  isLoading,
  error,
}: SuggestedQuestionsPanelProps) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setCustomQuestion('');
      setShowCustomInput(false);
    }
  }, [isOpen]);

  const handleSelectQuestion = (question: string) => {
    onSelectQuestion(question);
    onClose();
  };

  const handleSubmitCustom = () => {
    if (customQuestion.trim()) {
      onSelectQuestion(customQuestion.trim());
      onClose();
    }
  };

  const getCategoryInfo = (category: string) => {
    return questionCategoryInfo[category] || questionCategoryInfo.general;
  };

  if (!mounted) return null;

  const panelContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
              className="w-full sm:max-w-lg max-h-[85vh] overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Ask About Your CGT
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        AI-suggested questions based on your timeline
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Analyzing your timeline...
                      </p>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4">
                        {error}
                      </p>
                      <button
                        onClick={() => setShowCustomInput(true)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Enter a custom question instead
                      </button>
                    </div>
                  )}

                  {/* Questions List */}
                  {!isLoading && !error && suggestedQuestions.length > 0 && (
                    <div className="space-y-3">
                      {/* Context Summary */}
                      {contextSummary && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg mb-4">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {contextSummary}
                          </p>
                        </div>
                      )}

                      {/* Suggested Questions - Show only the first (highest priority) question */}
                      {suggestedQuestions
                        .sort((a, b) => a.priority - b.priority)
                        .slice(0, 1) // Only show the first question
                        .map((sq, index) => {
                          const categoryInfo = getCategoryInfo(sq.category);
                          return (
                            <motion.button
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleSelectQuestion(sq.question)}
                              className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-lg">{categoryInfo.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                    {sq.question}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryInfo.color}`}>
                                      {categoryInfo.label}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {sq.relevance_reason}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                              </div>
                            </motion.button>
                          );
                        })}
                    </div>
                  )}

                  {/* Custom Question Toggle */}
                  {!isLoading && !showCustomInput && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setShowCustomInput(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Ask a custom question
                      </button>
                    </div>
                  )}

                  {/* Custom Question Input */}
                  {showCustomInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                    >
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Your Question
                      </label>
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="E.g., What is my CGT liability for the Sydney property?"
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setShowCustomInput(false)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmitCustom}
                          disabled={!customQuestion.trim()}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          Ask Question
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(panelContent, document.body);
}
