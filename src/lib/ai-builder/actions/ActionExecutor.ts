// Action Executor - Executes timeline actions with undo/redo support

import type {
  TimelineAction,
  ActionType,
  ActionResult,
  StateSnapshot,
  AddPropertyPayload,
  AddEventPayload,
  UpdatePropertyPayload,
  UpdateEventPayload,
  DeletePropertyPayload,
  DeleteEventPayload,
  BulkImportPayload,
  ClearAllPayload,
} from '@/types/ai-builder';
import type { Property, TimelineEvent } from '@/store/timeline';
import { UndoManager, UndoableAction } from './UndoManager';

export interface TimelineStore {
  properties: Property[];
  events: TimelineEvent[];
  addProperty: (property: Omit<Property, 'id' | 'branch'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;
  importTimelineData: (data: { properties: Property[]; events: TimelineEvent[] }) => void;
  clearAllData: () => void;
}

export class ActionExecutor {
  private store: TimelineStore;
  private undoManager: UndoManager;

  constructor(store: TimelineStore) {
    this.store = store;
    this.undoManager = new UndoManager();
  }

  /**
   * Take a snapshot of current state
   */
  private takeSnapshot(): StateSnapshot {
    return {
      properties: [...this.store.properties],
      events: [...this.store.events],
      timestamp: new Date(),
    };
  }

  /**
   * Restore state from snapshot
   */
  private restoreSnapshot(snapshot: StateSnapshot): void {
    this.store.importTimelineData({
      properties: snapshot.properties,
      events: snapshot.events,
    });
  }

  /**
   * Execute an action
   */
  async execute(action: TimelineAction): Promise<ActionResult> {
    const previousState = this.takeSnapshot();

    try {
      const result = await this.executeAction(action);

      if (result.success) {
        this.undoManager.recordAction(action, previousState);
      }

      return result;
    } catch (error) {
      console.error('Action execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute the action based on type
   */
  private async executeAction(action: TimelineAction): Promise<ActionResult> {
    switch (action.type) {
      case 'ADD_PROPERTY':
        return this.executeAddProperty(action.payload as AddPropertyPayload);

      case 'UPDATE_PROPERTY':
        return this.executeUpdateProperty(action.payload as UpdatePropertyPayload);

      case 'DELETE_PROPERTY':
        return this.executeDeleteProperty(action.payload as DeletePropertyPayload);

      case 'ADD_EVENT':
        return this.executeAddEvent(action.payload as AddEventPayload);

      case 'UPDATE_EVENT':
        return this.executeUpdateEvent(action.payload as UpdateEventPayload);

      case 'DELETE_EVENT':
        return this.executeDeleteEvent(action.payload as DeleteEventPayload);

      case 'BULK_IMPORT':
        return this.executeBulkImport(action.payload as BulkImportPayload);

      case 'CLEAR_ALL':
        return this.executeClearAll(action.payload as ClearAllPayload);

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  }

  private executeAddProperty(payload: AddPropertyPayload): ActionResult {
    try {
      this.store.addProperty(payload.property);
      const newProperty = this.store.properties[this.store.properties.length - 1];
      return {
        success: true,
        entityId: newProperty?.id,
        message: `Added property: ${payload.property.address}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add property',
      };
    }
  }

  private executeUpdateProperty(payload: UpdatePropertyPayload): ActionResult {
    try {
      this.store.updateProperty(payload.propertyId, payload.updates);
      return {
        success: true,
        entityId: payload.propertyId,
        message: 'Property updated',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update property',
      };
    }
  }

  private executeDeleteProperty(payload: DeletePropertyPayload): ActionResult {
    try {
      // Delete all events for this property first
      payload.events.forEach((event) => {
        this.store.deleteEvent(event.id);
      });
      // Then delete the property
      this.store.deleteProperty(payload.property.id);
      return {
        success: true,
        message: `Deleted property: ${payload.property.address}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete property',
      };
    }
  }

  private executeAddEvent(payload: AddEventPayload): ActionResult {
    try {
      this.store.addEvent(payload.event);
      const newEvent = this.store.events[this.store.events.length - 1];
      return {
        success: true,
        entityId: newEvent?.id,
        message: `Added ${payload.event.type} event`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add event',
      };
    }
  }

  private executeUpdateEvent(payload: UpdateEventPayload): ActionResult {
    try {
      this.store.updateEvent(payload.eventId, payload.updates);
      return {
        success: true,
        entityId: payload.eventId,
        message: 'Event updated',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update event',
      };
    }
  }

  private executeDeleteEvent(payload: DeleteEventPayload): ActionResult {
    try {
      this.store.deleteEvent(payload.event.id);
      return {
        success: true,
        message: `Deleted ${payload.event.type} event`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete event',
      };
    }
  }

  private executeBulkImport(payload: BulkImportPayload): ActionResult {
    try {
      this.store.importTimelineData({
        properties: payload.properties,
        events: payload.events,
      });
      return {
        success: true,
        message: `Imported ${payload.properties.length} properties and ${payload.events.length} events`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import data',
      };
    }
  }

  private executeClearAll(_payload: ClearAllPayload): ActionResult {
    try {
      this.store.clearAllData();
      return {
        success: true,
        message: 'Cleared all timeline data',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear data',
      };
    }
  }

  /**
   * Undo the last action
   */
  async undo(): Promise<ActionResult> {
    if (!this.undoManager.canUndo()) {
      return { success: false, error: 'Nothing to undo' };
    }

    const action = this.undoManager.popUndo();
    if (!action || !action.previousState) {
      return { success: false, error: 'Cannot undo this action' };
    }

    try {
      this.restoreSnapshot(action.previousState);
      return {
        success: true,
        message: `Undid: ${action.description}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to undo',
      };
    }
  }

  /**
   * Redo the last undone action
   */
  async redo(): Promise<ActionResult> {
    if (!this.undoManager.canRedo()) {
      return { success: false, error: 'Nothing to redo' };
    }

    const action = this.undoManager.popRedo();
    if (!action) {
      return { success: false, error: 'Cannot redo this action' };
    }

    try {
      const result = await this.executeAction(action);
      return {
        ...result,
        message: result.success ? `Redid: ${action.description}` : result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redo',
      };
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoManager.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.undoManager.canRedo();
  }

  /**
   * Get undo description
   */
  getUndoDescription(): string | null {
    return this.undoManager.getUndoDescription();
  }

  /**
   * Get redo description
   */
  getRedoDescription(): string | null {
    return this.undoManager.getRedoDescription();
  }

  /**
   * Get stack sizes
   */
  getStackSizes(): { undo: number; redo: number } {
    return this.undoManager.getStackSizes();
  }

  /**
   * Clear undo/redo history
   */
  clearHistory(): void {
    this.undoManager.clear();
  }
}
