/**
 * Store Enhancer
 * Adds auto-save and undo/redo capabilities to the timeline store
 * This is a non-invasive approach that subscribes to store changes
 */

import { useTimelineStore } from './timeline';
import { UndoManager } from '@/lib/undo/UndoManager';
import { takeSnapshot } from '@/lib/undo/snapshot';
import type { TimelineAction, ActionType, StateSnapshot } from '@/lib/undo/actionTypes';
import {
  saveTimelineSession,
  loadTimelineSession,
  deleteTimelineSession,
  type TimelineSession,
} from '@/lib/persistence/IndexedDBService';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface EnhancerConfig {
  autoSaveEnabled: boolean;
  autoSaveDebounceMs: number;
  sessionId: string;
  maxUndoStackSize: number;
}

const DEFAULT_CONFIG: EnhancerConfig = {
  autoSaveEnabled: true,
  autoSaveDebounceMs: 2000,
  sessionId: 'current',
  maxUndoStackSize: 100,
};

// ============================================================================
// ENHANCED STORE STATE
// ============================================================================

interface EnhancedStoreState {
  // Auto-save state
  autoSave: {
    enabled: boolean;
    isSaving: boolean;
    lastSavedAt: Date | null;
    hasUnsavedChanges: boolean;
    error: string | null;
  };

  // Undo/redo state
  undoManager: {
    canUndo: boolean;
    canRedo: boolean;
    undoStackSize: number;
    redoStackSize: number;
  };
}

// Store enhanced state
let enhancedState: EnhancedStoreState = {
  autoSave: {
    enabled: true,
    isSaving: false,
    lastSavedAt: null,
    hasUnsavedChanges: false,
    error: null,
  },
  undoManager: {
    canUndo: false,
    canRedo: false,
    undoStackSize: 0,
    redoStackSize: 0,
  },
};

// Subscribers to enhanced state changes
type EnhancedStateSubscriber = (state: EnhancedStoreState) => void;
const subscribers = new Set<EnhancedStateSubscriber>();

function notifySubscribers() {
  subscribers.forEach(subscriber => subscriber(enhancedState));
}

// ============================================================================
// UNDO MANAGER INSTANCE
// ============================================================================

const undoManager = new UndoManager({ maxStackSize: DEFAULT_CONFIG.maxUndoStackSize });

// Track the previous state for undo recording
let previousSnapshot: StateSnapshot | null = null;

// Flag to prevent recording actions during undo/redo operations
let isUndoingOrRedoing = false;

// ============================================================================
// AUTO-SAVE LOGIC
// ============================================================================

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let config = { ...DEFAULT_CONFIG };

function extractSessionData(): TimelineSession {
  const state = useTimelineStore.getState();

  // Convert savedAnalysis to match TimelineSession type
  let savedAnalysis: TimelineSession['savedAnalysis'] = null;
  if (state.savedAnalysis && state.savedAnalysis.response) {
    savedAnalysis = {
      response: state.savedAnalysis.response,
      analyzedAt: state.savedAnalysis.analyzedAt || new Date().toISOString(),
      provider: state.savedAnalysis.provider || undefined,
    };
  }

  return {
    id: config.sessionId,
    version: '2.3.0',
    properties: state.properties,
    events: state.events,
    notes: state.timelineNotes || '',
    timelineStickyNotes: state.timelineStickyNotes || [],
    analysisStickyNotes: state.analysisStickyNotes || [],
    savedAnalysis,
    undoStack: undoManager.serialize().undoStack as TimelineSession['undoStack'],
    redoStack: undoManager.serialize().redoStack as TimelineSession['redoStack'],
    createdAt: enhancedState.autoSave.lastSavedAt?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function performSave(): Promise<void> {
  if (!config.autoSaveEnabled) return;

  // Update state to saving
  enhancedState = {
    ...enhancedState,
    autoSave: {
      ...enhancedState.autoSave,
      isSaving: true,
      error: null,
    },
  };
  notifySubscribers();

  try {
    const session = extractSessionData();
    await saveTimelineSession(session);

    // Update state to saved
    enhancedState = {
      ...enhancedState,
      autoSave: {
        ...enhancedState.autoSave,
        isSaving: false,
        lastSavedAt: new Date(),
        hasUnsavedChanges: false,
        error: null,
      },
    };
    notifySubscribers();
    console.log('💾 Auto-saved at', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('❌ Auto-save failed:', error);
    enhancedState = {
      ...enhancedState,
      autoSave: {
        ...enhancedState.autoSave,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Save failed',
      },
    };
    notifySubscribers();
  }
}

function scheduleSave(): void {
  if (!config.autoSaveEnabled) return;

  // Mark as having unsaved changes
  enhancedState = {
    ...enhancedState,
    autoSave: {
      ...enhancedState.autoSave,
      hasUnsavedChanges: true,
    },
  };
  notifySubscribers();

  // Clear existing debounce timer
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  // Schedule new save
  saveDebounceTimer = setTimeout(performSave, config.autoSaveDebounceMs);
}

// ============================================================================
// UNDO/REDO ACTIONS
// ============================================================================

function updateUndoState(): void {
  enhancedState = {
    ...enhancedState,
    undoManager: {
      canUndo: undoManager.canUndo(),
      canRedo: undoManager.canRedo(),
      undoStackSize: undoManager.undoStackSize,
      redoStackSize: undoManager.redoStackSize,
    },
  };
  notifySubscribers();
}

function recordAction(actionType: ActionType, payload: unknown): void {
  // Skip recording during undo/redo operations to prevent corrupting the undo stack
  if (isUndoingOrRedoing) {
    console.log('⏭️ Skipping action recording during undo/redo');
    return;
  }

  if (!previousSnapshot) return;

  const action: TimelineAction = {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: actionType,
    payload: payload as TimelineAction['payload'],
    timestamp: new Date(),
    description: `${actionType} action`,
    reversible: true,
  };

  undoManager.record(action, previousSnapshot);
  updateUndoState();

  // Update previous snapshot for next action
  const state = useTimelineStore.getState();
  previousSnapshot = takeSnapshot(state.properties, state.events, state.timelineNotes);
}

// Store for redo states - maps action ID to the state AFTER the action was performed
const redoStates = new Map<string, StateSnapshot>();

export function undo(): boolean {
  // Set flag to prevent recording the undo operation as a new action
  isUndoingOrRedoing = true;

  try {
    // Take a snapshot of current state BEFORE undo - this is what redo will restore
    const currentState = useTimelineStore.getState();
    const currentSnapshot = takeSnapshot(currentState.properties, currentState.events, currentState.timelineNotes);

    const undoAction = undoManager.undo();
    if (!undoAction) {
      isUndoingOrRedoing = false;
      return false;
    }

    // Store the current state (the "after" state) for redo
    redoStates.set(undoAction.id, currentSnapshot);

    // Restore the previous state
    const state = useTimelineStore.getState();

    // Apply the snapshot
    state.importTimelineData({
      properties: undoAction.previousState.properties,
      events: undoAction.previousState.events,
    });

    if (undoAction.previousState.notes !== undefined) {
      state.setTimelineNotes(undoAction.previousState.notes);
    }

    // Update the previous snapshot to the restored state
    previousSnapshot = takeSnapshot(useTimelineStore.getState().properties, useTimelineStore.getState().events, useTimelineStore.getState().timelineNotes);

    updateUndoState();
    scheduleSave();

    console.log('⏪ Undo:', undoAction.description);
    return true;
  } finally {
    isUndoingOrRedoing = false;
  }
}

export function redo(): boolean {
  // Set flag to prevent recording the redo operation as a new action
  isUndoingOrRedoing = true;

  try {
    const redoAction = undoManager.redo();
    if (!redoAction) {
      isUndoingOrRedoing = false;
      return false;
    }

    // Get the stored "after" state for this action
    const afterState = redoStates.get(redoAction.id);

    if (afterState) {
      // Restore the state that existed after this action was originally performed
      const state = useTimelineStore.getState();

      state.importTimelineData({
        properties: afterState.properties,
        events: afterState.events,
      });

      if (afterState.notes !== undefined) {
        state.setTimelineNotes(afterState.notes);
      }

      // Clean up the stored redo state
      redoStates.delete(redoAction.id);
    } else {
      console.warn('⚠️ No redo state found for action:', redoAction.id);
    }

    // Update previous snapshot to the restored state
    previousSnapshot = takeSnapshot(useTimelineStore.getState().properties, useTimelineStore.getState().events, useTimelineStore.getState().timelineNotes);

    updateUndoState();
    scheduleSave();

    console.log('⏩ Redo:', redoAction.description);
    return true;
  } finally {
    isUndoingOrRedoing = false;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function configureEnhancer(newConfig: Partial<EnhancerConfig>): void {
  config = { ...config, ...newConfig };
  enhancedState = {
    ...enhancedState,
    autoSave: {
      ...enhancedState.autoSave,
      enabled: config.autoSaveEnabled,
    },
  };
  notifySubscribers();
}

export function saveNow(): Promise<void> {
  // Clear any pending debounced save
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  return performSave();
}

export async function restoreSession(): Promise<boolean> {
  // Set flag to prevent recording during session restoration
  isUndoingOrRedoing = true;

  try {
    const session = await loadTimelineSession(config.sessionId);
    if (!session) {
      console.log('📂 No saved session found');
      return false;
    }

    const state = useTimelineStore.getState();

    // Restore timeline data
    state.importTimelineData({
      properties: session.properties,
      events: session.events,
    });

    // Restore notes
    if (session.notes) {
      state.setTimelineNotes(session.notes);
    }

    // Restore sticky notes by setting them directly
    if (session.timelineStickyNotes?.length) {
      // Clear existing and add new ones
      state.clearTimelineStickyNotes();
      session.timelineStickyNotes.forEach(note => {
        state.addTimelineStickyNote(note);
      });
    }

    if (session.analysisStickyNotes?.length) {
      state.clearAnalysisStickyNotes();
      session.analysisStickyNotes.forEach(note => {
        state.addAnalysisStickyNote(note);
      });
    }

    // Restore undo/redo stacks
    if (session.undoStack || session.redoStack) {
      undoManager.deserialize({
        undoStack: (session.undoStack || []) as unknown as Parameters<typeof undoManager.deserialize>[0]['undoStack'],
        redoStack: (session.redoStack || []) as unknown as Parameters<typeof undoManager.deserialize>[0]['redoStack'],
        version: 1,
      });
      updateUndoState();
    }

    // Update auto-save state
    enhancedState = {
      ...enhancedState,
      autoSave: {
        ...enhancedState.autoSave,
        lastSavedAt: new Date(session.updatedAt),
        hasUnsavedChanges: false,
      },
    };
    notifySubscribers();

    // Initialize previous snapshot to the restored state
    previousSnapshot = takeSnapshot(useTimelineStore.getState().properties, useTimelineStore.getState().events, useTimelineStore.getState().timelineNotes);

    console.log('📂 Session restored from', new Date(session.updatedAt).toLocaleString());
    return true;
  } catch (error) {
    console.error('❌ Failed to restore session:', error);
    return false;
  } finally {
    isUndoingOrRedoing = false;
  }
}

export async function clearSession(): Promise<void> {
  await deleteTimelineSession(config.sessionId);
  console.log('🗑️ Session cleared');
}

export function setAutoSaveEnabled(enabled: boolean): void {
  config.autoSaveEnabled = enabled;
  enhancedState = {
    ...enhancedState,
    autoSave: {
      ...enhancedState.autoSave,
      enabled,
    },
  };
  notifySubscribers();
}

export function getEnhancedState(): EnhancedStoreState {
  return enhancedState;
}

export function subscribeToEnhancedState(subscriber: EnhancedStateSubscriber): () => void {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

export function startGroup(): void {
  undoManager.startGroup();
}

export function endGroup(description?: string): void {
  undoManager.endGroup(description);
  updateUndoState();
}

// ============================================================================
// STORE SUBSCRIPTION
// ============================================================================

let initialized = false;
let unsubscribe: (() => void) | null = null;

// Keys that trigger auto-save
const PERSIST_KEYS = [
  'properties',
  'events',
  'timelineNotes',
  'timelineStickyNotes',
  'analysisStickyNotes',
  'savedAnalysis',
];

export function initializeEnhancer(): void {
  if (initialized) return;

  // Take initial snapshot
  previousSnapshot = takeSnapshot(useTimelineStore.getState().properties, useTimelineStore.getState().events, useTimelineStore.getState().timelineNotes);

  // Subscribe to store changes
  let previousState = useTimelineStore.getState();

  unsubscribe = useTimelineStore.subscribe((state) => {
    // Check if any persist keys changed
    let shouldSave = false;
    let changedKey: string | null = null;

    for (const key of PERSIST_KEYS) {
      if ((state as any)[key] !== (previousState as any)[key]) {
        shouldSave = true;
        changedKey = key;
        break;
      }
    }

    if (shouldSave && changedKey) {
      // Record action for undo
      recordAction(getActionTypeForKey(changedKey), { key: changedKey });

      // Schedule auto-save
      scheduleSave();
    }

    previousState = state;
  });

  // Setup beforeunload handler
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
      }
      // Attempt synchronous save
      performSave();
    });
  }

  initialized = true;
  console.log('✅ Store enhancer initialized');
}

function getActionTypeForKey(key: string): ActionType {
  switch (key) {
    case 'properties':
      return 'UPDATE_PROPERTY';
    case 'events':
      return 'UPDATE_EVENT';
    case 'timelineNotes':
      return 'UPDATE_TIMELINE_NOTES';
    default:
      return 'BULK_IMPORT';
  }
}

export function destroyEnhancer(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  initialized = false;
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * Hook to access enhanced store state (auto-save and undo/redo)
 */
export function useEnhancedStore() {
  const [state, setState] = useState(enhancedState);

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = subscribeToEnhancedState(setState);

    // Initialize if not already
    initializeEnhancer();

    return unsubscribe;
  }, []);

  return {
    ...state,
    undo,
    redo,
    saveNow,
    restoreSession,
    clearSession,
    setAutoSaveEnabled,
    startGroup,
    endGroup,
  };
}

export default {
  initializeEnhancer,
  destroyEnhancer,
  configureEnhancer,
  undo,
  redo,
  saveNow,
  restoreSession,
  clearSession,
  setAutoSaveEnabled,
  getEnhancedState,
  subscribeToEnhancedState,
  startGroup,
  endGroup,
  useEnhancedStore,
};
