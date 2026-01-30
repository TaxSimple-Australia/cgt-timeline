/**
 * UndoManager - Manages undo/redo history for the CGT Brain application
 *
 * Features:
 * - Two-stack pattern (undo stack + redo stack)
 * - Action grouping for rapid changes
 * - Serialization for persistence
 * - Configurable max stack size
 */

import type {
  TimelineAction,
  UndoableAction,
  StateSnapshot,
  ActionGroup
} from './actionTypes';
import { getActionDescription, createActionGroup } from './actionTypes';
import type { Property, TimelineEvent } from '@/store/timeline';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface UndoManagerConfig {
  maxStackSize: number;           // Maximum items in each stack (default: 100)
  groupTimeoutMs: number;         // Time window for action grouping (default: 500ms)
  enableGrouping: boolean;        // Enable automatic action grouping (default: true)
  onStackChange?: () => void;     // Callback when stacks change
}

const DEFAULT_CONFIG: UndoManagerConfig = {
  maxStackSize: 100,
  groupTimeoutMs: 500,
  enableGrouping: true,
};

// ============================================================================
// UNDO MANAGER CLASS
// ============================================================================

export class UndoManager {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private config: UndoManagerConfig;

  // Action grouping
  private pendingGroupActions: UndoableAction[] = [];
  private groupTimer: ReturnType<typeof setTimeout> | null = null;
  private isGrouping: boolean = false;

  constructor(config: Partial<UndoManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // CORE OPERATIONS
  // ============================================================================

  /**
   * Record a new action with its previous state
   */
  record(action: TimelineAction, previousState: StateSnapshot): void {
    const undoableAction: UndoableAction = {
      ...action,
      previousState,
    };

    // If grouping is active, add to pending group
    if (this.isGrouping) {
      this.pendingGroupActions.push(undoableAction);
      return;
    }

    // If auto-grouping is enabled, check for rapid actions
    if (this.config.enableGrouping) {
      this.handleAutoGrouping(undoableAction);
      return;
    }

    // Otherwise, add directly to stack
    this.pushToUndoStack(undoableAction);
  }

  /**
   * Undo the last action
   * Returns the action that was undone (with previousState to restore)
   */
  undo(): UndoableAction | null {
    if (!this.canUndo()) {
      return null;
    }

    const action = this.undoStack.pop()!;
    this.redoStack.push(action);
    this.trimStack(this.redoStack);
    this.notifyStackChange();

    console.log('↩️ Undo:', getActionDescription(action));
    return action;
  }

  /**
   * Redo the last undone action
   * Returns the action to re-execute
   */
  redo(): UndoableAction | null {
    if (!this.canRedo()) {
      return null;
    }

    const action = this.redoStack.pop()!;
    this.undoStack.push(action);
    this.trimStack(this.undoStack);
    this.notifyStackChange();

    console.log('↪️ Redo:', getActionDescription(action));
    return action;
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoStackSize(): number {
    return this.undoStack.length;
  }

  get redoStackSize(): number {
    return this.redoStack.length;
  }

  getUndoStack(): UndoableAction[] {
    return [...this.undoStack];
  }

  getRedoStack(): UndoableAction[] {
    return [...this.redoStack];
  }

  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return getActionDescription(this.undoStack[this.undoStack.length - 1]);
  }

  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return getActionDescription(this.redoStack[this.redoStack.length - 1]);
  }

  getUndoCount(): number {
    return this.undoStack.length;
  }

  getRedoCount(): number {
    return this.redoStack.length;
  }

  // ============================================================================
  // ACTION GROUPING
  // ============================================================================

  /**
   * Start a manual action group
   * All actions recorded until endGroup() will be grouped as one undo operation
   */
  startGroup(): void {
    this.flushPendingGroup();
    this.isGrouping = true;
    this.pendingGroupActions = [];
    console.log('🔗 Started action group');
  }

  /**
   * End a manual action group
   */
  endGroup(description?: string): void {
    if (!this.isGrouping) return;

    this.isGrouping = false;

    if (this.pendingGroupActions.length === 0) {
      console.log('🔗 Ended action group (empty)');
      return;
    }

    // Create a grouped action
    const groupedAction = this.createGroupedAction(
      this.pendingGroupActions,
      description || 'Multiple changes'
    );

    this.pushToUndoStack(groupedAction);
    this.pendingGroupActions = [];
    console.log('🔗 Ended action group:', description);
  }

  /**
   * Cancel the current action group without saving
   */
  cancelGroup(): void {
    this.isGrouping = false;
    this.pendingGroupActions = [];
    console.log('🔗 Cancelled action group');
  }

  // ============================================================================
  // STACK MANAGEMENT
  // ============================================================================

  /**
   * Clear both stacks
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.pendingGroupActions = [];
    this.cancelGroupTimer();
    this.notifyStackChange();
    console.log('🗑️ Cleared undo/redo history');
  }

  /**
   * Clear only the redo stack
   * Called when a new action is recorded (branches history)
   */
  clearRedo(): void {
    this.redoStack = [];
    this.notifyStackChange();
  }

  /**
   * Set the maximum stack size
   */
  setMaxStackSize(size: number): void {
    this.config.maxStackSize = size;
    this.trimStack(this.undoStack);
    this.trimStack(this.redoStack);
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Serialize the undo manager state for persistence
   */
  serialize(): SerializedUndoState {
    return {
      undoStack: this.undoStack.map(serializeAction),
      redoStack: this.redoStack.map(serializeAction),
      version: 1,
    };
  }

  /**
   * Restore the undo manager state from serialized data
   */
  deserialize(state: SerializedUndoState): void {
    if (state.version !== 1) {
      console.warn('⚠️ Unknown undo state version:', state.version);
      return;
    }

    this.undoStack = state.undoStack.map(deserializeAction);
    this.redoStack = state.redoStack.map(deserializeAction);
    this.trimStack(this.undoStack);
    this.trimStack(this.redoStack);
    this.notifyStackChange();
    console.log('📂 Restored undo history:', this.undoStack.length, 'undo,', this.redoStack.length, 'redo');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private pushToUndoStack(action: UndoableAction): void {
    // Clear redo stack when new action is recorded (branches history)
    this.clearRedo();

    this.undoStack.push(action);
    this.trimStack(this.undoStack);
    this.notifyStackChange();
  }

  private trimStack(stack: UndoableAction[]): void {
    while (stack.length > this.config.maxStackSize) {
      stack.shift(); // Remove oldest items
    }
  }

  private notifyStackChange(): void {
    this.config.onStackChange?.();
  }

  private handleAutoGrouping(action: UndoableAction): void {
    // Add to pending group
    this.pendingGroupActions.push(action);

    // Reset the group timer
    this.cancelGroupTimer();
    this.groupTimer = setTimeout(() => {
      this.flushPendingGroup();
    }, this.config.groupTimeoutMs);
  }

  private flushPendingGroup(): void {
    this.cancelGroupTimer();

    if (this.pendingGroupActions.length === 0) return;

    if (this.pendingGroupActions.length === 1) {
      // Single action, no need to group
      this.pushToUndoStack(this.pendingGroupActions[0]);
    } else {
      // Multiple actions, create group
      const groupedAction = this.createGroupedAction(
        this.pendingGroupActions,
        `${this.pendingGroupActions.length} changes`
      );
      this.pushToUndoStack(groupedAction);
    }

    this.pendingGroupActions = [];
  }

  private cancelGroupTimer(): void {
    if (this.groupTimer) {
      clearTimeout(this.groupTimer);
      this.groupTimer = null;
    }
  }

  private createGroupedAction(
    actions: UndoableAction[],
    description: string
  ): UndoableAction {
    // Use the first action's previousState as the group's previousState
    // This allows us to restore to the state before all grouped actions
    const firstAction = actions[0];

    return {
      id: `group-${Date.now()}`,
      type: actions.length === 1 ? actions[0].type : 'BULK_UPDATE_EVENTS',
      timestamp: new Date(),
      payload: {
        actions: actions.map(a => ({
          type: a.type,
          payload: a.payload,
        })),
      } as unknown as UndoableAction['payload'],
      description,
      reversible: true,
      previousState: firstAction.previousState,
    };
  }
}

// ============================================================================
// SERIALIZATION TYPES AND HELPERS
// ============================================================================

export interface SerializedUndoState {
  undoStack: SerializedAction[];
  redoStack: SerializedAction[];
  version: number;
}

interface SerializedAction {
  id: string;
  type: string;
  timestamp: string;
  payload: unknown;
  description: string;
  reversible: boolean;
  previousState: {
    properties: unknown[];
    events: unknown[];
    notes?: string;
    timestamp: string;
  };
}

function serializeAction(action: UndoableAction): SerializedAction {
  return {
    id: action.id,
    type: action.type,
    timestamp: action.timestamp.toISOString(),
    payload: serializePayload(action.payload),
    description: action.description,
    reversible: action.reversible,
    previousState: {
      properties: action.previousState.properties.map(serializeProperty),
      events: action.previousState.events.map(serializeEvent),
      notes: action.previousState.notes,
      timestamp: action.previousState.timestamp.toISOString(),
    },
  };
}

function deserializeAction(data: SerializedAction): UndoableAction {
  return {
    id: data.id,
    type: data.type as UndoableAction['type'],
    timestamp: new Date(data.timestamp),
    payload: deserializePayload(data.payload) as UndoableAction['payload'],
    description: data.description,
    reversible: data.reversible,
    previousState: {
      properties: (data.previousState.properties as unknown[]).map(deserializeProperty) as Property[],
      events: (data.previousState.events as unknown[]).map(deserializeEvent) as TimelineEvent[],
      notes: data.previousState.notes,
      timestamp: new Date(data.previousState.timestamp),
    },
  };
}

function serializePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;

  const obj = payload as Record<string, unknown>;
  const serialized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(item => serializePayload(item));
    } else if (typeof value === 'object' && value !== null) {
      serialized[key] = serializePayload(value);
    } else {
      serialized[key] = value;
    }
  }

  return serialized;
}

function deserializePayload(payload: unknown): unknown {
  // For now, return as-is since we don't know which fields are dates
  // The store will handle date conversion when applying the action
  return payload;
}

function serializeProperty(property: unknown): unknown {
  const p = property as Record<string, unknown>;
  return {
    ...p,
    purchaseDate: p.purchaseDate instanceof Date ? (p.purchaseDate as Date).toISOString() : p.purchaseDate,
    saleDate: p.saleDate instanceof Date ? (p.saleDate as Date).toISOString() : p.saleDate,
  };
}

function deserializeProperty(data: unknown): unknown {
  const p = data as Record<string, unknown>;
  return {
    ...p,
    purchaseDate: p.purchaseDate ? new Date(p.purchaseDate as string) : undefined,
    saleDate: p.saleDate ? new Date(p.saleDate as string) : undefined,
  };
}

function serializeEvent(event: unknown): unknown {
  const e = event as Record<string, unknown>;
  return {
    ...e,
    date: e.date instanceof Date ? (e.date as Date).toISOString() : e.date,
    contractDate: e.contractDate instanceof Date ? (e.contractDate as Date).toISOString() : e.contractDate,
    settlementDate: e.settlementDate instanceof Date ? (e.settlementDate as Date).toISOString() : e.settlementDate,
  };
}

function deserializeEvent(data: unknown): unknown {
  const e = data as Record<string, unknown>;
  return {
    ...e,
    date: e.date ? new Date(e.date as string) : new Date(),
    contractDate: e.contractDate ? new Date(e.contractDate as string) : undefined,
    settlementDate: e.settlementDate ? new Date(e.settlementDate as string) : undefined,
  };
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

// Create a default instance for the application
export const undoManager = new UndoManager();

export default UndoManager;
