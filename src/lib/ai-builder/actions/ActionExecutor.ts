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
  ZoomTimelinePayload,
  PanToDatePayload,
  FocusOnPropertyPayload,
  FocusOnEventPayload,
  LoadDemoDataPayload,
  ToggleThemePayload,
  ToggleEventDisplayPayload,
  SelectPropertyPayload,
  SelectEventPayload,
  GetVerificationAlertsPayload,
  ResolveVerificationAlertPayload,
  GetAnalysisResultsPayload,
  SetTimelineNotesPayload,
  GetActionHistoryPayload,
  UpdateSettingsPayload,
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
  // Timeline Navigation & Visualization (optional - may not be implemented in all stores)
  zoomIn?: () => void;
  zoomOut?: () => void;
  setZoom?: (level: string) => void;
  panToDate?: (date: Date) => void;
  panToPosition?: (position: number) => void;
  // Data Operations
  loadDemoData?: () => void;
  // UI State Operations
  setSelectedPropertyId?: (id: string | null) => void;
  setSelectedEventId?: (id: string | null) => void;
  // Settings
  timelineNotes?: string;
  setTimelineNotes?: (notes: string) => void;
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
      // ============================================================================
      // DATA OPERATIONS (with undo support)
      // ============================================================================
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

      case 'LOAD_DEMO_DATA':
        return this.executeLoadDemoData(action.payload as LoadDemoDataPayload);

      // ============================================================================
      // TIMELINE NAVIGATION & VISUALIZATION (no undo needed)
      // ============================================================================
      case 'ZOOM_TIMELINE':
        return this.executeZoomTimeline(action.payload as ZoomTimelinePayload);

      case 'PAN_TO_DATE':
        return this.executePanToDate(action.payload as PanToDatePayload);

      case 'FOCUS_ON_PROPERTY':
        return this.executeFocusOnProperty(action.payload as FocusOnPropertyPayload);

      case 'FOCUS_ON_EVENT':
        return this.executeFocusOnEvent(action.payload as FocusOnEventPayload);

      // ============================================================================
      // UI STATE OPERATIONS (no undo needed)
      // ============================================================================
      case 'TOGGLE_THEME':
        return this.executeToggleTheme(action.payload as ToggleThemePayload);

      case 'TOGGLE_EVENT_DISPLAY':
        return this.executeToggleEventDisplay(action.payload as ToggleEventDisplayPayload);

      case 'SELECT_PROPERTY':
        return this.executeSelectProperty(action.payload as SelectPropertyPayload);

      case 'SELECT_EVENT':
        return this.executeSelectEvent(action.payload as SelectEventPayload);

      // ============================================================================
      // VERIFICATION & ANALYSIS (read operations)
      // ============================================================================
      case 'GET_VERIFICATION_ALERTS':
        return this.executeGetVerificationAlerts(action.payload as GetVerificationAlertsPayload);

      case 'RESOLVE_VERIFICATION_ALERT':
        return this.executeResolveVerificationAlert(action.payload as ResolveVerificationAlertPayload);

      case 'GET_ANALYSIS_RESULTS':
        return this.executeGetAnalysisResults(action.payload as GetAnalysisResultsPayload);

      // ============================================================================
      // TIMELINE NOTES
      // ============================================================================
      case 'SET_TIMELINE_NOTES':
        return this.executeSetTimelineNotes(action.payload as SetTimelineNotesPayload);

      case 'GET_TIMELINE_NOTES':
        return this.executeGetTimelineNotes();

      // ============================================================================
      // HISTORY OPERATIONS
      // ============================================================================
      case 'GET_ACTION_HISTORY':
        return this.executeGetActionHistory(action.payload as GetActionHistoryPayload);

      // ============================================================================
      // SETTINGS
      // ============================================================================
      case 'UPDATE_SETTINGS':
        return this.executeUpdateSettings(action.payload as UpdateSettingsPayload);

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

  // ============================================================================
  // LOAD DEMO DATA
  // ============================================================================

  private executeLoadDemoData(_payload: LoadDemoDataPayload): ActionResult {
    try {
      if (this.store.loadDemoData) {
        this.store.loadDemoData();
        return {
          success: true,
          message: 'Demo data loaded successfully',
        };
      }
      return {
        success: false,
        error: 'Load demo data not supported',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load demo data',
      };
    }
  }

  // ============================================================================
  // TIMELINE NAVIGATION & VISUALIZATION
  // ============================================================================

  private executeZoomTimeline(payload: ZoomTimelinePayload): ActionResult {
    try {
      if (payload.level && this.store.setZoom) {
        this.store.setZoom(payload.level);
      } else if (payload.direction === 'in' && this.store.zoomIn) {
        this.store.zoomIn();
      } else if (payload.direction === 'out' && this.store.zoomOut) {
        this.store.zoomOut();
      }
      return {
        success: true,
        message: payload.level ? `Zoomed to ${payload.level}` : `Zoomed ${payload.direction}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to zoom timeline',
      };
    }
  }

  private executePanToDate(payload: PanToDatePayload): ActionResult {
    try {
      if (this.store.panToDate) {
        this.store.panToDate(payload.date);
      }
      return {
        success: true,
        message: `Panned to ${payload.date.toLocaleDateString()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pan timeline',
      };
    }
  }

  private executeFocusOnProperty(payload: FocusOnPropertyPayload): ActionResult {
    try {
      if (this.store.setSelectedPropertyId) {
        this.store.setSelectedPropertyId(payload.propertyId);
      }
      return {
        success: true,
        message: 'Focused on property',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to focus on property',
      };
    }
  }

  private executeFocusOnEvent(payload: FocusOnEventPayload): ActionResult {
    try {
      if (this.store.setSelectedEventId) {
        this.store.setSelectedEventId(payload.eventId);
      }
      return {
        success: true,
        message: 'Focused on event',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to focus on event',
      };
    }
  }

  // ============================================================================
  // UI STATE OPERATIONS
  // ============================================================================

  private executeToggleTheme(_payload: ToggleThemePayload): ActionResult {
    // Theme toggling is handled at the UI level, not in the store
    return {
      success: true,
      message: 'Theme toggle triggered',
    };
  }

  private executeToggleEventDisplay(_payload: ToggleEventDisplayPayload): ActionResult {
    // Event display mode is handled at the UI level
    return {
      success: true,
      message: 'Event display toggle triggered',
    };
  }

  private executeSelectProperty(payload: SelectPropertyPayload): ActionResult {
    try {
      if (this.store.setSelectedPropertyId) {
        this.store.setSelectedPropertyId(payload.propertyId);
      }
      return {
        success: true,
        message: payload.propertyId ? 'Property selected' : 'Property deselected',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select property',
      };
    }
  }

  private executeSelectEvent(payload: SelectEventPayload): ActionResult {
    try {
      if (this.store.setSelectedEventId) {
        this.store.setSelectedEventId(payload.eventId);
      }
      return {
        success: true,
        message: payload.eventId ? 'Event selected' : 'Event deselected',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to select event',
      };
    }
  }

  // ============================================================================
  // VERIFICATION & ANALYSIS
  // ============================================================================

  private executeGetVerificationAlerts(_payload: GetVerificationAlertsPayload): ActionResult {
    // Verification alerts are retrieved from the store directly in the handler
    return {
      success: true,
      message: 'Verification alerts retrieved',
    };
  }

  private executeResolveVerificationAlert(_payload: ResolveVerificationAlertPayload): ActionResult {
    // Alert resolution is handled in the conversation manager via store methods
    return {
      success: true,
      message: 'Verification alert resolved',
    };
  }

  private executeGetAnalysisResults(_payload: GetAnalysisResultsPayload): ActionResult {
    // Analysis results are retrieved from the store directly
    return {
      success: true,
      message: 'Analysis results retrieved',
    };
  }

  // ============================================================================
  // TIMELINE NOTES
  // ============================================================================

  private executeSetTimelineNotes(payload: SetTimelineNotesPayload): ActionResult {
    try {
      if (this.store.setTimelineNotes) {
        if (payload.append && this.store.timelineNotes) {
          this.store.setTimelineNotes(this.store.timelineNotes + '\n' + payload.notes);
        } else {
          this.store.setTimelineNotes(payload.notes);
        }
      }
      return {
        success: true,
        message: 'Timeline notes updated',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set timeline notes',
      };
    }
  }

  private executeGetTimelineNotes(): ActionResult {
    return {
      success: true,
      message: this.store.timelineNotes || 'No notes set',
    };
  }

  // ============================================================================
  // HISTORY OPERATIONS
  // ============================================================================

  private executeGetActionHistory(payload: GetActionHistoryPayload): ActionResult {
    const stackSizes = this.undoManager.getStackSizes();
    return {
      success: true,
      message: `Undo stack: ${stackSizes.undo}, Redo stack: ${stackSizes.redo}`,
    };
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  private executeUpdateSettings(_payload: UpdateSettingsPayload): ActionResult {
    // Settings are managed at the UI level
    return {
      success: true,
      message: 'Settings update triggered',
    };
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
