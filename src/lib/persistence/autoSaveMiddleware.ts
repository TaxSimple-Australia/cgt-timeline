/**
 * Auto-Save Configuration and Types
 * Note: The actual auto-save logic is implemented in storeEnhancer.ts
 * This file provides types and configuration for the auto-save system
 */

import {
  saveTimelineSession,
  loadTimelineSession,
  type TimelineSession,
} from './IndexedDBService';
import type { SerializedUndoState } from '../undo/UndoManager';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AutoSaveConfig {
  debounceMs: number;              // Debounce delay (default: 1000ms)
  sessionId: string;               // Session ID for storage (default: 'current')
  enabled: boolean;                // Enable/disable auto-save (default: true)
  saveOnUnload: boolean;           // Save before page unload (default: true)
  onSaveStart?: () => void;        // Callback when save starts
  onSaveComplete?: () => void;     // Callback when save completes
  onSaveError?: (error: Error) => void;  // Callback on save error
  onRestoreComplete?: () => void;  // Callback when restore completes
}

export const DEFAULT_CONFIG: AutoSaveConfig = {
  debounceMs: 1000,
  sessionId: 'current',
  enabled: true,
  saveOnUnload: true,
};

// Keys to persist (data that should survive page reload)
export const PERSIST_KEYS = [
  'properties',
  'events',
  'timelineNotes',
  'timelineStickyNotes',
  'analysisStickyNotes',
  'savedAnalysis',
] as const;

// Keys to exclude (UI state that shouldn't be persisted)
export const EXCLUDE_KEYS = [
  'selectedProperty',
  'selectedEvent',
  'isAnalyzing',
  'centerDate',
  'zoom',
  'zoomLevel',
  'timelineStart',
  'timelineEnd',
  'absoluteStart',
  'absoluteEnd',
  'aiResponse',
  'verificationAlerts',
  'currentAlertIndex',
  'timelineIssues',
] as const;

// ============================================================================
// TYPES
// ============================================================================

type PersistKeys = typeof PERSIST_KEYS[number];

export interface AutoSaveState {
  // Auto-save status
  _autoSave: {
    lastSavedAt: Date | null;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    error: string | null;
    enabled: boolean;
  };

  // Actions
  _saveNow: () => Promise<void>;
  _restoreSession: () => Promise<boolean>;
  _clearSavedSession: () => Promise<void>;
  _setAutoSaveEnabled: (enabled: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract session data from store state
 */
export function extractSessionData(
  state: Record<string, unknown>,
  sessionId: string
): TimelineSession {
  // Extract undo/redo stacks if they exist
  let undoStack: TimelineSession['undoStack'] = [];
  let redoStack: TimelineSession['redoStack'] = [];

  if (state.undoManager && typeof (state.undoManager as { serialize?: () => SerializedUndoState }).serialize === 'function') {
    const serialized = (state.undoManager as { serialize: () => SerializedUndoState }).serialize();
    undoStack = serialized.undoStack as TimelineSession['undoStack'];
    redoStack = serialized.redoStack as TimelineSession['redoStack'];
  }

  return {
    id: sessionId,
    version: '2.3.0',
    properties: (state.properties as TimelineSession['properties']) || [],
    events: (state.events as TimelineSession['events']) || [],
    notes: (state.timelineNotes as string) || '',
    timelineStickyNotes: (state.timelineStickyNotes as TimelineSession['timelineStickyNotes']) || [],
    analysisStickyNotes: (state.analysisStickyNotes as TimelineSession['analysisStickyNotes']) || [],
    savedAnalysis: state.savedAnalysis as TimelineSession['savedAnalysis'],
    undoStack,
    redoStack,
    createdAt: (state._autoSave as AutoSaveState['_autoSave'])?.lastSavedAt?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Debounce utility function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  }) as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

export default {
  DEFAULT_CONFIG,
  PERSIST_KEYS,
  EXCLUDE_KEYS,
  extractSessionData,
  debounce,
};
