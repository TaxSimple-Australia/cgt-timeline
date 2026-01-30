'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Trash2,
  Clock,
  Home,
  Calendar,
  FileText,
  Brain,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  checkForSavedSession,
  shouldAutoRestore,
  discardSession,
  formatSessionAge,
  formatSessionSummary,
  type SessionInfo,
} from '@/lib/persistence/sessionRestore';
import { useTimelineStore } from '@/store/timeline';
import { restoreSession as restoreFromEnhancedStore } from '@/store/storeEnhancer';

interface SessionRestoreModalProps {
  onRestoreComplete?: () => void;
  onStartFresh?: () => void;
}

export default function SessionRestoreModal({
  onRestoreComplete,
  onStartFresh,
}: SessionRestoreModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [autoRestoreCountdown, setAutoRestoreCountdown] = useState<number | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const info = await checkForSavedSession();

        if (!info.exists) {
          console.log('📂 No saved session found, starting fresh');
          onStartFresh?.();
          return;
        }

        setSessionInfo(info);

        // Determine restore strategy
        const strategy = await shouldAutoRestore(info, {
          autoRestoreIfRecent: true,
          maxAgeHours: 4, // Auto-restore if less than 4 hours old
          showPromptAlways: false,
        });

        if (strategy === 'auto-restore') {
          // Auto-restore with countdown
          console.log('📂 Auto-restoring recent session...');
          setIsOpen(true);
          setAutoRestoreCountdown(5);
        } else if (strategy === 'prompt') {
          // Show prompt
          setIsOpen(true);
        } else {
          // No session worth restoring
          onStartFresh?.();
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        onStartFresh?.();
      }
    };

    checkSession();
  }, [onStartFresh]);

  // Auto-restore countdown
  useEffect(() => {
    if (autoRestoreCountdown === null || autoRestoreCountdown <= 0) return;

    const timer = setTimeout(() => {
      if (autoRestoreCountdown === 1) {
        handleRestore();
      } else {
        setAutoRestoreCountdown(autoRestoreCountdown - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoRestoreCountdown]);

  const handleRestore = async () => {
    setAutoRestoreCountdown(null);
    setIsRestoring(true);

    try {
      // Use the enhanced store's restore function
      const restored = await restoreFromEnhancedStore();
      if (restored) {
        console.log('✅ Session restored successfully');
        setIsOpen(false);
        onRestoreComplete?.();
      } else {
        // Fallback: manually restore from session info
        if (sessionInfo?.session) {
          const store = useTimelineStore.getState();
          store.importTimelineData({
            properties: sessionInfo.session.properties,
            events: sessionInfo.session.events,
          });
          if (sessionInfo.session.notes) {
            store.setTimelineNotes(sessionInfo.session.notes);
          }
          console.log('✅ Session restored (fallback method)');
          setIsOpen(false);
          onRestoreComplete?.();
        }
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      setIsRestoring(false);
    }
  };

  const handleStartFresh = async () => {
    setAutoRestoreCountdown(null);

    try {
      await discardSession();
      setIsOpen(false);
      onStartFresh?.();
    } catch (error) {
      console.error('❌ Failed to discard session:', error);
    }
  };

  const handleClose = () => {
    setAutoRestoreCountdown(null);
    setIsOpen(false);
    onStartFresh?.();
  };

  if (!sessionInfo?.metadata) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal - Centered using fixed positioning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[60] w-[calc(100%-2rem)] max-w-md inset-0 m-auto h-fit"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Restore Previous Session?
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        We found unsaved work from before
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                {/* Session Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300">
                      Last saved: <strong>{formatSessionAge(sessionInfo.metadata.lastModified)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Home className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>{sessionInfo.metadata.propertyCount}</strong> propert{sessionInfo.metadata.propertyCount === 1 ? 'y' : 'ies'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>{sessionInfo.metadata.eventCount}</strong> event{sessionInfo.metadata.eventCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  {sessionInfo.metadata.hasAnalysis && (
                    <div className="flex items-center gap-3 text-sm">
                      <Brain className="w-4 h-4 text-cyan-500" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Includes CGT analysis
                      </span>
                    </div>
                  )}

                  {sessionInfo.metadata.hasNotes && (
                    <div className="flex items-center gap-3 text-sm">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Includes notes
                      </span>
                    </div>
                  )}
                </div>

                {/* Auto-restore countdown */}
                {autoRestoreCountdown !== null && (
                  <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">
                      Auto-restoring in <strong>{autoRestoreCountdown}</strong> second{autoRestoreCountdown === 1 ? '' : 's'}...
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isRestoring ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore Session
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleStartFresh}
                    variant="outline"
                    className="flex-1 border-slate-300 dark:border-slate-600"
                    disabled={isRestoring}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Start Fresh
                  </Button>
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
                  Starting fresh will permanently delete your previous work
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
