'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, StickyNote, Save, Check, FileText } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';

export default function NotesModal() {
  const {
    isNotesModalOpen,
    closeNotesModal,
    timelineNotes,
    setTimelineNotes,
  } = useTimelineStore();

  const [localNotes, setLocalNotes] = useState(timelineNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync local notes with store when modal opens
  useEffect(() => {
    if (isNotesModalOpen) {
      setLocalNotes(timelineNotes);
    }
  }, [isNotesModalOpen, timelineNotes]);

  // Auto-save with debounce
  const saveNotes = useCallback((notes: string) => {
    setIsSaving(true);
    setTimelineNotes(notes);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 300);
  }, [setTimelineNotes]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isNotesModalOpen) return;

    const timer = setTimeout(() => {
      if (localNotes !== timelineNotes) {
        saveNotes(localNotes);
      }
    }, 500); // Auto-save after 500ms of no typing

    return () => clearTimeout(timer);
  }, [localNotes, isNotesModalOpen, timelineNotes, saveNotes]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNotesModalOpen) {
        // Save before closing
        if (localNotes !== timelineNotes) {
          saveNotes(localNotes);
        }
        closeNotesModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isNotesModalOpen, closeNotesModal, localNotes, timelineNotes, saveNotes]);

  const handleClose = () => {
    // Save before closing
    if (localNotes !== timelineNotes) {
      saveNotes(localNotes);
    }
    closeNotesModal();
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    return lastSaved.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isNotesModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
              className="w-full max-w-3xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Timeline Notes & Feedback
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Add notes about your timeline analysis. Notes are saved automatically.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Save Status */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {isSaving ? (
                        <>
                          <Save className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                          <span>Saving...</span>
                        </>
                      ) : lastSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span>Saved at {formatLastSaved()}</span>
                        </>
                      ) : null}
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-6">
                  <div className="h-full flex flex-col">
                    {/* Tips */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Tip:</strong> Use these notes to document your findings, questions, or feedback about the CGT analysis.
                          Notes are automatically saved and will be included when you share this timeline.
                        </p>
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={localNotes}
                      onChange={(e) => setLocalNotes(e.target.value)}
                      placeholder="Write your notes here...

Example notes:
• Reviewed CGT calculation for 123 Main Street
• Need to verify the move-out date with client
• Six-year rule applies but exemption percentage looks correct
• Follow up: Check if any capital improvements were missed"
                      className="flex-1 w-full min-h-[300px] p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                      autoFocus
                    />

                    {/* Character Count */}
                    <div className="mt-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>{localNotes.length} characters</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Auto-save enabled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-md"
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
