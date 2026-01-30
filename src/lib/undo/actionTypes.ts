/**
 * Action Types for Undo/Redo System
 * Defines all undoable actions in the CGT Brain application
 */

import type { Property, TimelineEvent, CostBaseItem } from '@/store/timeline';
import type { StickyNote } from '@/types/sticky-note';

// ============================================================================
// ACTION TYPE DEFINITIONS
// ============================================================================

export type ActionType =
  // Property actions
  | 'ADD_PROPERTY'
  | 'UPDATE_PROPERTY'
  | 'DELETE_PROPERTY'
  | 'DUPLICATE_PROPERTY'
  // Event actions
  | 'ADD_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'MOVE_EVENT'
  | 'DUPLICATE_EVENT'
  // Bulk actions
  | 'BULK_ADD_EVENTS'
  | 'BULK_DELETE_EVENTS'
  | 'BULK_UPDATE_EVENTS'
  | 'BULK_IMPORT'
  // Cost base actions
  | 'ADD_COST_BASE'
  | 'UPDATE_COST_BASE'
  | 'DELETE_COST_BASE'
  // Subdivision actions
  | 'SUBDIVIDE_PROPERTY'
  // Notes & annotations
  | 'UPDATE_TIMELINE_NOTES'
  | 'ADD_STICKY_NOTE'
  | 'UPDATE_STICKY_NOTE'
  | 'DELETE_STICKY_NOTE'
  // Analysis
  | 'SET_AI_ANALYSIS'
  | 'CLEAR_AI_ANALYSIS'
  // Session actions
  | 'CLEAR_ALL_DATA'
  | 'LOAD_DEMO_DATA'
  | 'IMPORT_TIMELINE';

// ============================================================================
// ACTION PAYLOADS
// ============================================================================

export interface AddPropertyPayload {
  property: Partial<Property>;
}

export interface UpdatePropertyPayload {
  propertyId: string;
  updates: Partial<Property>;
  previousValues?: Partial<Property>;
}

export interface DeletePropertyPayload {
  propertyId: string;
  deletedProperty?: Property;
  deletedEvents?: TimelineEvent[];
}

export interface DuplicatePropertyPayload {
  sourcePropertyId: string;
  newPropertyId?: string;
  newAddress?: string;
}

export interface AddEventPayload {
  event: Partial<TimelineEvent>;
}

export interface UpdateEventPayload {
  eventId: string;
  updates: Partial<TimelineEvent>;
  previousValues?: Partial<TimelineEvent>;
}

export interface DeleteEventPayload {
  eventId: string;
  deletedEvent?: TimelineEvent;
}

export interface MoveEventPayload {
  eventId: string;
  newDate: Date | string;
  previousDate?: Date | string;
}

export interface DuplicateEventPayload {
  sourceEventId: string;
  newEventId?: string;
  newDate?: Date | string;
}

export interface BulkAddEventsPayload {
  events: Partial<TimelineEvent>[];
  propertyId?: string;
}

export interface BulkDeleteEventsPayload {
  eventIds: string[];
  deletedEvents?: TimelineEvent[];
}

export interface BulkUpdateEventsPayload {
  updates: Array<{ eventId: string; updates: Partial<TimelineEvent> }>;
  previousValues?: Array<{ eventId: string; values: Partial<TimelineEvent> }>;
}

export interface BulkImportPayload {
  properties: Property[];
  events: TimelineEvent[];
  previousProperties?: Property[];
  previousEvents?: TimelineEvent[];
}

export interface AddCostBasePayload {
  eventId: string;
  costBase: CostBaseItem;
}

export interface UpdateCostBasePayload {
  eventId: string;
  costBaseId: string;
  updates: Partial<CostBaseItem>;
  previousValues?: Partial<CostBaseItem>;
}

export interface DeleteCostBasePayload {
  eventId: string;
  costBaseId: string;
  deletedCostBase?: CostBaseItem;
}

export interface SubdividePropertyPayload {
  parentPropertyId: string;
  subdivisionDate: Date | string;
  lots: Array<{
    name: string;
    address?: string;
    lotSize: number;
  }>;
  fees?: {
    surveyorFees?: number;
    planningFees?: number;
    legalFees?: number;
    titleFees?: number;
  };
  createdPropertyIds?: string[];
  subdivisionEventId?: string;
}

export interface UpdateTimelineNotesPayload {
  notes: string;
  previousNotes?: string;
}

export interface AddStickyNotePayload {
  stickyNote: StickyNote;
  target: 'timeline' | 'analysis';
}

export interface UpdateStickyNotePayload {
  stickyNoteId: string;
  updates: Partial<StickyNote>;
  previousValues?: Partial<StickyNote>;
  target: 'timeline' | 'analysis';
}

export interface DeleteStickyNotePayload {
  stickyNoteId: string;
  deletedStickyNote?: StickyNote;
  target: 'timeline' | 'analysis';
}

export interface SetAIAnalysisPayload {
  response: unknown;
  provider?: string;
  previousAnalysis?: unknown;
}

export interface ClearAIAnalysisPayload {
  previousAnalysis?: unknown;
}

export interface ClearAllDataPayload {
  previousProperties?: Property[];
  previousEvents?: TimelineEvent[];
  previousNotes?: string;
}

export interface LoadDemoDataPayload {
  previousProperties?: Property[];
  previousEvents?: TimelineEvent[];
}

export interface ImportTimelinePayload {
  data: {
    properties: Property[];
    events: TimelineEvent[];
    notes?: string;
  };
  previousProperties?: Property[];
  previousEvents?: TimelineEvent[];
  previousNotes?: string;
}

// Union type for all payloads
export type ActionPayload =
  | AddPropertyPayload
  | UpdatePropertyPayload
  | DeletePropertyPayload
  | DuplicatePropertyPayload
  | AddEventPayload
  | UpdateEventPayload
  | DeleteEventPayload
  | MoveEventPayload
  | DuplicateEventPayload
  | BulkAddEventsPayload
  | BulkDeleteEventsPayload
  | BulkUpdateEventsPayload
  | BulkImportPayload
  | AddCostBasePayload
  | UpdateCostBasePayload
  | DeleteCostBasePayload
  | SubdividePropertyPayload
  | UpdateTimelineNotesPayload
  | AddStickyNotePayload
  | UpdateStickyNotePayload
  | DeleteStickyNotePayload
  | SetAIAnalysisPayload
  | ClearAIAnalysisPayload
  | ClearAllDataPayload
  | LoadDemoDataPayload
  | ImportTimelinePayload;

// ============================================================================
// ACTION INTERFACE
// ============================================================================

export interface TimelineAction {
  id: string;
  type: ActionType;
  timestamp: Date;
  payload: ActionPayload;
  description: string;
  reversible: boolean;
}

export interface StateSnapshot {
  properties: Property[];
  events: TimelineEvent[];
  notes?: string;
  timestamp: Date;
}

export interface UndoableAction extends TimelineAction {
  previousState: StateSnapshot;
}

// ============================================================================
// ACTION CREATORS
// ============================================================================

let actionIdCounter = 0;

function generateActionId(): string {
  return `action-${Date.now()}-${++actionIdCounter}`;
}

export function createAction(
  type: ActionType,
  payload: ActionPayload,
  description: string,
  reversible: boolean = true
): TimelineAction {
  return {
    id: generateActionId(),
    type,
    timestamp: new Date(),
    payload,
    description,
    reversible,
  };
}

// ============================================================================
// ACTION DESCRIPTION GENERATORS
// ============================================================================

export function getActionDescription(action: TimelineAction): string {
  // If action already has a description, use it
  if (action.description) {
    return action.description;
  }

  // Generate description based on action type
  switch (action.type) {
    case 'ADD_PROPERTY':
      return `Add property`;
    case 'UPDATE_PROPERTY':
      return `Update property`;
    case 'DELETE_PROPERTY':
      return `Delete property`;
    case 'DUPLICATE_PROPERTY':
      return `Duplicate property`;
    case 'ADD_EVENT':
      return `Add event`;
    case 'UPDATE_EVENT':
      return `Update event`;
    case 'DELETE_EVENT':
      return `Delete event`;
    case 'MOVE_EVENT':
      return `Move event`;
    case 'DUPLICATE_EVENT':
      return `Duplicate event`;
    case 'BULK_ADD_EVENTS':
      return `Add multiple events`;
    case 'BULK_DELETE_EVENTS':
      return `Delete multiple events`;
    case 'BULK_UPDATE_EVENTS':
      return `Update multiple events`;
    case 'BULK_IMPORT':
      return `Import timeline data`;
    case 'ADD_COST_BASE':
      return `Add cost base item`;
    case 'UPDATE_COST_BASE':
      return `Update cost base item`;
    case 'DELETE_COST_BASE':
      return `Delete cost base item`;
    case 'SUBDIVIDE_PROPERTY':
      return `Subdivide property`;
    case 'UPDATE_TIMELINE_NOTES':
      return `Update notes`;
    case 'ADD_STICKY_NOTE':
      return `Add sticky note`;
    case 'UPDATE_STICKY_NOTE':
      return `Update sticky note`;
    case 'DELETE_STICKY_NOTE':
      return `Delete sticky note`;
    case 'SET_AI_ANALYSIS':
      return `Set AI analysis`;
    case 'CLEAR_AI_ANALYSIS':
      return `Clear AI analysis`;
    case 'CLEAR_ALL_DATA':
      return `Clear all data`;
    case 'LOAD_DEMO_DATA':
      return `Load demo data`;
    case 'IMPORT_TIMELINE':
      return `Import timeline`;
    default:
      return `Unknown action`;
  }
}

// ============================================================================
// ACTION REVERSIBILITY CHECK
// ============================================================================

export function isReversibleAction(type: ActionType): boolean {
  // Most actions are reversible
  const irreversibleActions: ActionType[] = [
    // None currently - all actions should be reversible
  ];

  return !irreversibleActions.includes(type);
}

// ============================================================================
// ACTION GROUPING
// ============================================================================

export type ActionGroup = {
  id: string;
  actions: UndoableAction[];
  description: string;
  timestamp: Date;
};

export function createActionGroup(
  actions: UndoableAction[],
  description: string
): ActionGroup {
  return {
    id: generateActionId(),
    actions,
    description,
    timestamp: new Date(),
  };
}
