'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Eye, Copy, Check, Sparkles, Settings, Share2 } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import { serializeTimeline } from '@/lib/timeline-serialization';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Toggle component
function Toggle({
  enabled,
  onChange,
  id,
}: {
  enabled: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <button
      id={id}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
        enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    lockFutureDates, toggleLockFutureDates,
    eventDisplayMode, toggleEventDisplayMode,
    enableDragEvents, toggleDragEvents,
    enableAISuggestedQuestions, toggleAISuggestedQuestions,
    apiResponseMode, setAPIResponseMode,
    properties, events
  } = useTimelineStore();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const canShare = properties.length > 0;

  async function handleCopyShareLink() {
    if (!canShare) return;

    setIsGeneratingLink(true);
    setShareError(null);

    try {
      const serialized = serializeTimeline(properties, events);

      const response = await fetch('/api/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serialized),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate link');
      }

      const shareUrl = `${window.location.origin}?share=${result.shareId}`;
      await navigator.clipboard.writeText(shareUrl);

      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating share link:', error);
      setShareError(error instanceof Error ? error.message : 'Failed to generate link');
    } finally {
      setIsGeneratingLink(false);
    }
  }

  if (!mounted) return null;

  const modalContent = (
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

          {/* Modal - Wider */}
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-3xl"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Settings
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Content - Two Column Layout */}
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      {/* Timeline Settings Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Timeline Settings
                        </h3>

                        <div className="space-y-2">
                          {/* Lock Future Dates Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 mr-3">
                              <label htmlFor="lock-future" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                                Lock Future Dates
                              </label>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Prevent panning beyond today's date
                              </p>
                            </div>
                            <Toggle enabled={lockFutureDates} onChange={toggleLockFutureDates} id="lock-future" />
                          </div>

                          {/* Enable Event Dragging Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 mr-3">
                              <label htmlFor="drag-events" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                                Enable Event Dragging
                              </label>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Drag events along the timeline to change dates
                              </p>
                            </div>
                            <Toggle enabled={enableDragEvents} onChange={toggleDragEvents} id="drag-events" />
                          </div>
                        </div>
                      </div>

                      {/* Display Settings Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Display Settings
                        </h3>

                        <div className="space-y-2">
                          {/* Event Display Mode Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 mr-3">
                              <label htmlFor="display-mode" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                                Event Display Mode
                              </label>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {eventDisplayMode === 'card' ? 'Showing detailed cards' : 'Showing simple circles'}
                              </p>
                            </div>
                            <Toggle enabled={eventDisplayMode === 'card'} onChange={toggleEventDisplayMode} id="display-mode" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      {/* AI Features Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI Features
                        </h3>

                        <div className="space-y-2">
                          {/* AI Suggested Questions Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 mr-3">
                              <label htmlFor="ai-questions" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                                AI Question Suggestions
                              </label>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Get AI-generated questions based on your timeline
                              </p>
                            </div>
                            <Toggle enabled={enableAISuggestedQuestions} onChange={toggleAISuggestedQuestions} id="ai-questions" />
                          </div>
                        </div>
                      </div>

                      {/* Analysis View Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Analysis View
                        </h3>

                        <div className="flex gap-2">
                          {/* View 1 - Markdown (Default) */}
                          <button
                            onClick={() => setAPIResponseMode('markdown')}
                            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                              apiResponseMode === 'markdown'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                          >
                            View 1
                          </button>

                          {/* View 2 - JSON */}
                          <button
                            onClick={() => setAPIResponseMode('json')}
                            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                              apiResponseMode === 'json'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                          >
                            View 2
                          </button>
                        </div>
                      </div>

                      {/* Share Timeline Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Share Timeline
                        </h3>

                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Generate a shareable link to this timeline. Anyone with the link can view the exact timeline data.
                          </p>

                          {shareError && (
                            <div className="mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                              <p className="text-xs text-red-600 dark:text-red-400">{shareError}</p>
                            </div>
                          )}

                          <button
                            onClick={handleCopyShareLink}
                            disabled={!canShare || isGeneratingLink}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                              !canShare
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : shareSuccess
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {isGeneratingLink ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                              </>
                            ) : shareSuccess ? (
                              <>
                                <Check className="w-4 h-4" />
                                Link Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy Share Link
                              </>
                            )}
                          </button>

                          {!canShare && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                              Add at least one property to enable sharing
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
