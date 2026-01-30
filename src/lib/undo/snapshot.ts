/**
 * State Snapshot Utilities for Undo/Redo System
 * Provides functions to capture and restore application state
 */

import type { Property, TimelineEvent } from '@/store/timeline';
import type { StateSnapshot } from './actionTypes';

// ============================================================================
// SNAPSHOT CREATION
// ============================================================================

/**
 * Create a deep copy of the current state
 */
export function takeSnapshot(
  properties: Property[],
  events: TimelineEvent[],
  notes?: string
): StateSnapshot {
  return {
    properties: deepCloneProperties(properties),
    events: deepCloneEvents(events),
    notes: notes,
    timestamp: new Date(),
  };
}

/**
 * Create a minimal snapshot with only the changed items
 * Useful for reducing memory usage in large timelines
 */
export function takePartialSnapshot(
  properties: Property[],
  events: TimelineEvent[],
  affectedPropertyIds: string[],
  affectedEventIds: string[]
): StateSnapshot {
  return {
    properties: properties
      .filter(p => affectedPropertyIds.includes(p.id))
      .map(deepCloneProperty),
    events: events
      .filter(e => affectedEventIds.includes(e.id))
      .map(deepCloneEvent),
    timestamp: new Date(),
  };
}

// ============================================================================
// DEEP CLONING UTILITIES
// ============================================================================

function deepCloneProperties(properties: Property[]): Property[] {
  return properties.map(deepCloneProperty);
}

function deepCloneProperty(property: Property): Property {
  return {
    ...property,
    purchaseDate: property.purchaseDate ? new Date(property.purchaseDate) : undefined,
    saleDate: property.saleDate ? new Date(property.saleDate) : undefined,
    // Deep clone any nested objects
  };
}

function deepCloneEvents(events: TimelineEvent[]): TimelineEvent[] {
  return events.map(deepCloneEvent);
}

function deepCloneEvent(event: TimelineEvent): TimelineEvent {
  return {
    ...event,
    date: new Date(event.date),
    contractDate: event.contractDate ? new Date(event.contractDate) : undefined,
    settlementDate: event.settlementDate ? new Date(event.settlementDate) : undefined,
    // Deep clone cost bases
    costBases: event.costBases ? event.costBases.map(cb => ({ ...cb })) : undefined,
    // Deep clone checkbox state
    checkboxState: event.checkboxState ? { ...event.checkboxState } : undefined,
    // Deep clone floor area data
    floorAreaData: event.floorAreaData ? { ...event.floorAreaData } : undefined,
    // Deep clone subdivision details
    subdivisionDetails: event.subdivisionDetails ? {
      ...event.subdivisionDetails,
      childProperties: event.subdivisionDetails.childProperties?.map(child => ({ ...child })),
    } : undefined,
    // Deep clone ownership arrays
    leavingOwners: event.leavingOwners ? [...event.leavingOwners] : undefined,
    newOwners: event.newOwners ? event.newOwners.map(o => ({ ...o })) : undefined,
  };
}

// ============================================================================
// SNAPSHOT COMPARISON
// ============================================================================

/**
 * Compare two snapshots and return the differences
 */
export function diffSnapshots(
  before: StateSnapshot,
  after: StateSnapshot
): {
  addedProperties: Property[];
  removedProperties: Property[];
  modifiedProperties: Array<{ id: string; changes: Partial<Property> }>;
  addedEvents: TimelineEvent[];
  removedEvents: TimelineEvent[];
  modifiedEvents: Array<{ id: string; changes: Partial<TimelineEvent> }>;
  notesChanged: boolean;
} {
  const beforePropertyIds = new Set(before.properties.map(p => p.id));
  const afterPropertyIds = new Set(after.properties.map(p => p.id));
  const beforeEventIds = new Set(before.events.map(e => e.id));
  const afterEventIds = new Set(after.events.map(e => e.id));

  // Find added/removed properties
  const addedProperties = after.properties.filter(p => !beforePropertyIds.has(p.id));
  const removedProperties = before.properties.filter(p => !afterPropertyIds.has(p.id));

  // Find modified properties
  const modifiedProperties: Array<{ id: string; changes: Partial<Property> }> = [];
  for (const afterProp of after.properties) {
    if (beforePropertyIds.has(afterProp.id)) {
      const beforeProp = before.properties.find(p => p.id === afterProp.id)!;
      const changes = getPropertyChanges(beforeProp, afterProp);
      if (Object.keys(changes).length > 0) {
        modifiedProperties.push({ id: afterProp.id, changes });
      }
    }
  }

  // Find added/removed events
  const addedEvents = after.events.filter(e => !beforeEventIds.has(e.id));
  const removedEvents = before.events.filter(e => !afterEventIds.has(e.id));

  // Find modified events
  const modifiedEvents: Array<{ id: string; changes: Partial<TimelineEvent> }> = [];
  for (const afterEvent of after.events) {
    if (beforeEventIds.has(afterEvent.id)) {
      const beforeEvent = before.events.find(e => e.id === afterEvent.id)!;
      const changes = getEventChanges(beforeEvent, afterEvent);
      if (Object.keys(changes).length > 0) {
        modifiedEvents.push({ id: afterEvent.id, changes });
      }
    }
  }

  return {
    addedProperties,
    removedProperties,
    modifiedProperties,
    addedEvents,
    removedEvents,
    modifiedEvents,
    notesChanged: before.notes !== after.notes,
  };
}

function getPropertyChanges(before: Property, after: Property): Partial<Property> {
  const changes: Partial<Property> = {};
  const keys = Object.keys(after) as (keyof Property)[];

  for (const key of keys) {
    if (!isEqual(before[key], after[key])) {
      (changes as Record<string, unknown>)[key] = after[key];
    }
  }

  return changes;
}

function getEventChanges(before: TimelineEvent, after: TimelineEvent): Partial<TimelineEvent> {
  const changes: Partial<TimelineEvent> = {};
  const keys = Object.keys(after) as (keyof TimelineEvent)[];

  for (const key of keys) {
    if (!isEqual(before[key], after[key])) {
      (changes as Record<string, unknown>)[key] = after[key];
    }
  }

  return changes;
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }
  return false;
}

// ============================================================================
// SNAPSHOT SERIALIZATION
// ============================================================================

/**
 * Serialize a snapshot for storage
 */
export function serializeSnapshot(snapshot: StateSnapshot): string {
  return JSON.stringify({
    ...snapshot,
    timestamp: snapshot.timestamp.toISOString(),
    properties: snapshot.properties.map(p => ({
      ...p,
      purchaseDate: p.purchaseDate instanceof Date ? p.purchaseDate.toISOString() : p.purchaseDate,
      saleDate: p.saleDate instanceof Date ? p.saleDate.toISOString() : p.saleDate,
    })),
    events: snapshot.events.map(e => ({
      ...e,
      date: e.date instanceof Date ? e.date.toISOString() : e.date,
      contractDate: e.contractDate instanceof Date ? e.contractDate.toISOString() : e.contractDate,
      settlementDate: e.settlementDate instanceof Date ? e.settlementDate.toISOString() : e.settlementDate,
    })),
  });
}

/**
 * Deserialize a snapshot from storage
 */
export function deserializeSnapshot(json: string): StateSnapshot {
  const data = JSON.parse(json);
  return {
    ...data,
    timestamp: new Date(data.timestamp),
    properties: data.properties.map((p: Property) => ({
      ...p,
      purchaseDate: p.purchaseDate ? new Date(p.purchaseDate as unknown as string) : undefined,
      saleDate: p.saleDate ? new Date(p.saleDate as unknown as string) : undefined,
    })),
    events: data.events.map((e: TimelineEvent) => ({
      ...e,
      date: new Date(e.date as unknown as string),
      contractDate: e.contractDate ? new Date(e.contractDate as unknown as string) : undefined,
      settlementDate: e.settlementDate ? new Date(e.settlementDate as unknown as string) : undefined,
    })),
  };
}

// ============================================================================
// SNAPSHOT DESCRIPTION GENERATION
// ============================================================================

/**
 * Generate a human-readable description of what changed between snapshots
 */
export function describeSnapshotDiff(before: StateSnapshot, after: StateSnapshot): string {
  const diff = diffSnapshots(before, after);
  const parts: string[] = [];

  if (diff.addedProperties.length > 0) {
    parts.push(`Added ${diff.addedProperties.length} property(s)`);
  }
  if (diff.removedProperties.length > 0) {
    parts.push(`Removed ${diff.removedProperties.length} property(s)`);
  }
  if (diff.modifiedProperties.length > 0) {
    parts.push(`Modified ${diff.modifiedProperties.length} property(s)`);
  }
  if (diff.addedEvents.length > 0) {
    parts.push(`Added ${diff.addedEvents.length} event(s)`);
  }
  if (diff.removedEvents.length > 0) {
    parts.push(`Removed ${diff.removedEvents.length} event(s)`);
  }
  if (diff.modifiedEvents.length > 0) {
    parts.push(`Modified ${diff.modifiedEvents.length} event(s)`);
  }
  if (diff.notesChanged) {
    parts.push(`Updated notes`);
  }

  if (parts.length === 0) {
    return 'No changes';
  }

  return parts.join(', ');
}

// ============================================================================
// SNAPSHOT VALIDATION
// ============================================================================

/**
 * Validate that a snapshot contains valid data
 */
export function validateSnapshot(snapshot: StateSnapshot): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check properties
  if (!Array.isArray(snapshot.properties)) {
    errors.push('Properties must be an array');
  } else {
    snapshot.properties.forEach((p, i) => {
      if (!p.id) errors.push(`Property at index ${i} missing id`);
      if (!p.address) errors.push(`Property at index ${i} missing address`);
    });
  }

  // Check events
  if (!Array.isArray(snapshot.events)) {
    errors.push('Events must be an array');
  } else {
    snapshot.events.forEach((e, i) => {
      if (!e.id) errors.push(`Event at index ${i} missing id`);
      if (!e.propertyId) errors.push(`Event at index ${i} missing propertyId`);
      if (!e.type) errors.push(`Event at index ${i} missing type`);
      if (!e.date) errors.push(`Event at index ${i} missing date`);
    });
  }

  // Check timestamp
  if (!(snapshot.timestamp instanceof Date) || isNaN(snapshot.timestamp.getTime())) {
    errors.push('Invalid timestamp');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
