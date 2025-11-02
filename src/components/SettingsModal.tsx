'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Eye } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { lockFutureDates, toggleLockFutureDates, eventDisplayMode, toggleEventDisplayMode } = useTimelineStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-md"
            >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-6">
                {/* Timeline Settings Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Timeline Settings
                  </h3>

                  {/* Lock Future Dates Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <label htmlFor="lock-future" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                        Lock Future Dates
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Prevent panning beyond today's date
                      </p>
                    </div>
                    <button
                      id="lock-future"
                      onClick={toggleLockFutureDates}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                        lockFutureDates
                          ? 'bg-blue-600'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          lockFutureDates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Display Settings Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Display Settings
                  </h3>

                  {/* Event Display Mode Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <label htmlFor="display-mode" className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
                        Event Display Mode
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {eventDisplayMode === 'card' ? 'Detailed cards' : 'Simple circles'}
                      </p>
                    </div>
                    <button
                      id="display-mode"
                      onClick={toggleEventDisplayMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                        eventDisplayMode === 'card'
                          ? 'bg-blue-600'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          eventDisplayMode === 'card' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
