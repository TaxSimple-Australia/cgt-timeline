'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Home, Calendar, DollarSign } from 'lucide-react';
import { Property, TimelineEvent } from '@/store/timeline';

interface DeletePropertyModalProps {
  property: Property;
  events: TimelineEvent[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeletePropertyModal({
  property,
  events,
  onConfirm,
  onCancel
}: DeletePropertyModalProps) {
  // Group events by type
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eventTypeLabels: Record<string, string> = {
    purchase: 'Purchase',
    move_in: 'Move In',
    move_out: 'Move Out',
    rent_start: 'Rent Start',
    rent_end: 'Rent End',
    sale: 'Sale',
    improvement: 'Improvement',
    refinance: 'Inherit',
    status_change: 'Status Change',
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Warning */}
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900 dark:text-red-100">Delete Property?</h2>
                  <p className="text-sm text-red-600 dark:text-red-400">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-red-500 dark:text-red-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Property Info */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: property.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {property.name}
                  </h3>
                  {property.address && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {property.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                Deleting this property will permanently remove:
              </p>
            </div>

            {/* What Will Be Deleted */}
            <div className="space-y-3">
              {/* Events Count */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Timeline Events
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {events.length}
                </span>
              </div>

              {/* Event Types Breakdown */}
              {events.length > 0 && (
                <div className="pl-6 space-y-1">
                  {Object.entries(eventsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        {eventTypeLabels[type] || type}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Property Data */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Property Data
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  All details
                </span>
              </div>

              {/* Cost Base Data - Updated to use new costBases array */}
              {events.some(e => e.costBases && e.costBases.length > 0) && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Cost Base Records
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    All CGT data
                  </span>
                </div>
              )}
            </div>

            {/* Final Warning */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                This action is permanent and cannot be undone. All data associated with this property will be lost forever.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              Delete Property
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
