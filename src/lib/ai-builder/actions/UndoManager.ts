// Undo Manager - Manages undo/redo stacks for timeline actions

import type {
  TimelineAction,
  ActionType,
  StateSnapshot,
  AddPropertyPayload,
  AddEventPayload,
  UpdatePropertyPayload,
  UpdateEventPayload,
  DeletePropertyPayload,
  DeleteEventPayload,
} from '@/types/ai-builder';
import type { Property, TimelineEvent } from '@/store/timeline';

export interface UndoableAction extends TimelineAction {
  previousState?: StateSnapshot;
}

export class UndoManager {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private maxStackSize: number;

  constructor(maxStackSize = 50) {
    this.maxStackSize = maxStackSize;
  }

  /**
   * Record an action for potential undo
   */
  recordAction(action: TimelineAction, previousState?: StateSnapshot): void {
    const undoableAction: UndoableAction = {
      ...action,
      previousState,
    };

    this.undoStack.push(undoableAction);
    this.redoStack = []; // Clear redo stack on new action

    // Trim stack if too large
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  /**
   * Pop the last action from undo stack
   */
  popUndo(): UndoableAction | null {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
    }
    return action || null;
  }

  /**
   * Pop the last action from redo stack
   */
  popRedo(): UndoableAction | null {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
    }
    return action || null;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get description of the action that would be undone
   */
  getUndoDescription(): string | null {
    const action = this.undoStack[this.undoStack.length - 1];
    return action ? action.description : null;
  }

  /**
   * Get description of the action that would be redone
   */
  getRedoDescription(): string | null {
    const action = this.redoStack[this.redoStack.length - 1];
    return action ? action.description : null;
  }

  /**
   * Get the undo stack
   */
  getUndoStack(): UndoableAction[] {
    return [...this.undoStack];
  }

  /**
   * Get the redo stack
   */
  getRedoStack(): UndoableAction[] {
    return [...this.redoStack];
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get stack sizes
   */
  getStackSizes(): { undo: number; redo: number } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
    };
  }
}
