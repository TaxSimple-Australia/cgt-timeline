'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useEnhancedStore } from '@/store/storeEnhancer';
import { cn } from '@/lib/utils';

interface SaveIndicatorProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showAlways?: boolean;
}

export default function SaveIndicator({
  className,
  position = 'bottom-right',
  showAlways = false,
}: SaveIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get auto-save state from enhanced store
  const { autoSave, saveNow } = useEnhancedStore();

  const { lastSavedAt, isSaving, hasUnsavedChanges, error, enabled } = autoSave;

  // Determine status
  let status: 'saving' | 'saved' | 'unsaved' | 'error' | 'disabled';
  if (!enabled) {
    status = 'disabled';
  } else if (error) {
    status = 'error';
  } else if (isSaving) {
    status = 'saving';
  } else if (hasUnsavedChanges) {
    status = 'unsaved';
  } else {
    status = 'saved';
  }

  // Don't show if nothing to show
  if (!showAlways && status === 'saved' && !isExpanded) {
    return null;
  }

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSavedAt) return 'Never saved';

    const now = new Date();
    const diff = now.getTime() - lastSavedAt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const handleClick = () => {
    if (status === 'error' || status === 'unsaved') {
      saveNow();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      className={cn(
        'fixed z-40',
        positionClasses[position],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-full shadow-lg',
          'backdrop-blur-md border transition-all duration-200',
          'text-xs font-medium',
          status === 'saving' && 'bg-blue-50/90 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
          status === 'saved' && 'bg-green-50/90 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
          status === 'unsaved' && 'bg-amber-50/90 dark:bg-amber-900/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
          status === 'error' && 'bg-red-50/90 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
          status === 'disabled' && 'bg-slate-50/90 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
        <AnimatePresence mode="wait">
          {status === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 180 }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.div>
          )}
          {status === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
          {status === 'unsaved' && (
            <motion.div
              key="unsaved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Cloud className="w-4 h-4" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AlertCircle className="w-4 h-4" />
            </motion.div>
          )}
          {status === 'disabled' && (
            <motion.div
              key="disabled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CloudOff className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text */}
        <AnimatePresence>
          {(isExpanded || status !== 'saved') && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {status === 'saving' && 'Saving...'}
              {status === 'saved' && formatLastSaved()}
              {status === 'unsaved' && 'Unsaved changes'}
              {status === 'error' && 'Save failed - Click to retry'}
              {status === 'disabled' && 'Auto-save disabled'}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Retry button for errors */}
        {status === 'error' && (
          <RefreshCw className="w-3 h-3 ml-1" />
        )}
      </motion.button>

      {/* Pulsing dot for unsaved changes */}
      {status === 'unsaved' && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
    </motion.div>
  );
}
