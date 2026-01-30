'use client';

import { useEffect, useCallback } from 'react';
import { useEnhancedStore } from '@/store/storeEnhancer';

interface UseBeforeUnloadOptions {
  enabled?: boolean;
  message?: string;
  onBeforeUnload?: () => void;
}

/**
 * Hook to warn users before leaving the page with unsaved changes
 * Also triggers a final save attempt on unload
 */
export function useBeforeUnload(options: UseBeforeUnloadOptions = {}) {
  const {
    enabled = true,
    message = 'You have unsaved changes. Are you sure you want to leave?',
    onBeforeUnload,
  } = options;

  // Get auto-save state from enhanced store
  const { autoSave, saveNow } = useEnhancedStore();
  const hasUnsavedChanges = autoSave.hasUnsavedChanges;

  // Handle beforeunload event
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges) return;

    // Trigger callback
    onBeforeUnload?.();

    // Try to save (this may or may not complete before page unloads)
    try {
      saveNow();
    } catch (error) {
      console.error('❌ Failed to save on unload:', error);
    }

    // Show browser's default confirmation dialog
    event.preventDefault();
    // Modern browsers require returnValue to be set
    event.returnValue = message;
    return message;
  }, [hasUnsavedChanges, saveNow, message, onBeforeUnload]);

  // Handle visibility change (for mobile tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
      console.log('📱 Page hidden, attempting save...');
      try {
        saveNow();
      } catch (error) {
        console.error('❌ Failed to save on visibility change:', error);
      }
    }
  }, [hasUnsavedChanges, saveNow]);

  // Handle page hide (more reliable on mobile)
  const handlePageHide = useCallback(() => {
    if (hasUnsavedChanges) {
      console.log('📱 Page hide event, attempting save...');
      try {
        saveNow();
      } catch (error) {
        console.error('❌ Failed to save on page hide:', error);
      }
    }
  }, [hasUnsavedChanges, saveNow]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [enabled, handleBeforeUnload, handleVisibilityChange, handlePageHide]);

  return { hasUnsavedChanges };
}

export default useBeforeUnload;
