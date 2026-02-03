/**
 * IndexedDB Service for CGT Brain
 * Handles persistent storage for timeline sessions, AI conversations, and settings
 */

import type { Property, TimelineEvent } from '@/store/timeline';
import type { StickyNote } from '@/types/sticky-note';

// Database configuration
const DB_NAME = 'cgt-brain-db';
const DB_VERSION = 1;

// Store names
export const STORES = {
  TIMELINE_SESSIONS: 'timeline-sessions',
  AI_CONVERSATIONS: 'ai-conversations',
  SETTINGS: 'settings',
} as const;

// Types
export interface TimelineSession {
  id: string;
  version: string;
  properties: Property[];
  events: TimelineEvent[];
  notes: string;
  timelineStickyNotes: StickyNote[];
  analysisStickyNotes: StickyNote[];
  savedAnalysis?: {
    response: unknown;
    analyzedAt: string;
    provider?: string;
  } | null;
  undoStack: SerializedAction[];
  redoStack: SerializedAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AIConversation {
  id: string;
  messages: ConversationMessage[];
  processedDocuments?: ProcessedDocument[];
  pendingActions?: unknown[];
  provider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isVoice?: boolean;
  audioUrl?: string;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  extractedData?: unknown;
  processedAt: string;
}

export interface SerializedAction {
  id: string;
  type: string;
  timestamp: string;
  payload: unknown;
  description: string;
  reversible: boolean;
  previousState?: {
    properties: Property[];
    events: TimelineEvent[];
    notes?: string;
    timestamp: string;
  };
}

export interface SettingsEntry {
  key: string;
  value: unknown;
}

// Singleton instance
let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initializeDB(): Promise<IDBDatabase> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Return existing initialization promise if in progress
  if (initPromise) {
    return initPromise;
  }

  // Start new initialization
  initPromise = new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexedDB initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('📦 Creating IndexedDB stores...');

      // Timeline sessions store
      if (!db.objectStoreNames.contains(STORES.TIMELINE_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.TIMELINE_SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        console.log('  ✓ Created timeline-sessions store');
      }

      // AI conversations store
      if (!db.objectStoreNames.contains(STORES.AI_CONVERSATIONS)) {
        const conversationStore = db.createObjectStore(STORES.AI_CONVERSATIONS, { keyPath: 'id' });
        conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        console.log('  ✓ Created ai-conversations store');
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        console.log('  ✓ Created settings store');
      }
    };
  });

  return initPromise;
}

/**
 * Get the database instance (initializes if needed)
 */
async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    await initializeDB();
  }
  if (!dbInstance) {
    throw new Error('Failed to initialize IndexedDB');
  }
  return dbInstance;
}

// ============================================================================
// TIMELINE SESSION OPERATIONS
// ============================================================================

/**
 * Save a timeline session
 */
export async function saveTimelineSession(session: TimelineSession): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TIMELINE_SESSIONS, 'readwrite');
    const store = transaction.objectStore(STORES.TIMELINE_SESSIONS);

    // Serialize dates to ISO strings for storage
    // The serialized version has string dates instead of Date objects
    const serialized = {
      ...session,
      properties: session.properties.map(serializeProperty),
      events: session.events.map(serializeEvent),
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(serialized);

    request.onsuccess = () => {
      console.log('💾 Timeline session saved:', session.id);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to save timeline session:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Load a timeline session by ID
 */
export async function loadTimelineSession(id: string = 'current'): Promise<TimelineSession | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TIMELINE_SESSIONS, 'readonly');
    const store = transaction.objectStore(STORES.TIMELINE_SESSIONS);
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        // Deserialize dates from ISO strings
        const session = request.result as TimelineSession;
        const deserialized: TimelineSession = {
          ...session,
          properties: session.properties.map(deserializeProperty),
          events: session.events.map(deserializeEvent),
        };
        console.log('📂 Timeline session loaded:', id);
        resolve(deserialized);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('❌ Failed to load timeline session:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete a timeline session
 */
export async function deleteTimelineSession(id: string = 'current'): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TIMELINE_SESSIONS, 'readwrite');
    const store = transaction.objectStore(STORES.TIMELINE_SESSIONS);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('🗑️ Timeline session deleted:', id);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to delete timeline session:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all timeline sessions (for session picker)
 */
export async function getAllTimelineSessions(): Promise<TimelineSession[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TIMELINE_SESSIONS, 'readonly');
    const store = transaction.objectStore(STORES.TIMELINE_SESSIONS);
    const request = store.getAll();

    request.onsuccess = () => {
      const sessions = (request.result as TimelineSession[]).map(session => ({
        ...session,
        properties: session.properties.map(deserializeProperty),
        events: session.events.map(deserializeEvent),
      }));
      resolve(sessions);
    };

    request.onerror = () => {
      console.error('❌ Failed to get all timeline sessions:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Check if a session exists without loading full data
 */
export async function hasTimelineSession(id: string = 'current'): Promise<boolean> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.TIMELINE_SESSIONS, 'readonly');
    const store = transaction.objectStore(STORES.TIMELINE_SESSIONS);
    const request = store.count(IDBKeyRange.only(id));

    request.onsuccess = () => {
      resolve(request.result > 0);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get session metadata without loading full data
 */
export async function getSessionMetadata(id: string = 'current'): Promise<{
  exists: boolean;
  updatedAt?: Date;
  propertyCount?: number;
  eventCount?: number;
} | null> {
  const session = await loadTimelineSession(id);
  if (!session) {
    return { exists: false };
  }

  return {
    exists: true,
    updatedAt: new Date(session.updatedAt),
    propertyCount: session.properties.length,
    eventCount: session.events.length,
  };
}

// ============================================================================
// AI CONVERSATION OPERATIONS
// ============================================================================

/**
 * Save an AI conversation
 */
export async function saveAIConversation(conversation: AIConversation): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AI_CONVERSATIONS, 'readwrite');
    const store = transaction.objectStore(STORES.AI_CONVERSATIONS);

    const serialized: AIConversation = {
      ...conversation,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(serialized);

    request.onsuccess = () => {
      console.log('💾 AI conversation saved:', conversation.id);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to save AI conversation:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Load an AI conversation
 */
export async function loadAIConversation(id: string = 'current'): Promise<AIConversation | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AI_CONVERSATIONS, 'readonly');
    const store = transaction.objectStore(STORES.AI_CONVERSATIONS);
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        console.log('📂 AI conversation loaded:', id);
        resolve(request.result as AIConversation);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('❌ Failed to load AI conversation:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete an AI conversation
 */
export async function deleteAIConversation(id: string = 'current'): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AI_CONVERSATIONS, 'readwrite');
    const store = transaction.objectStore(STORES.AI_CONVERSATIONS);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('🗑️ AI conversation deleted:', id);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to delete AI conversation:', request.error);
      reject(request.error);
    };
  });
}

/**
 * List all AI conversations
 */
export async function listAIConversations(): Promise<AIConversation[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.AI_CONVERSATIONS, 'readonly');
    const store = transaction.objectStore(STORES.AI_CONVERSATIONS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as AIConversation[]);
    };

    request.onerror = () => {
      console.error('❌ Failed to list AI conversations:', request.error);
      reject(request.error);
    };
  });
}

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

/**
 * Save a setting
 */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load a setting
 */
export async function loadSetting<T>(key: string): Promise<T | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get(key);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.value as T);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all data from all stores
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();

  const storeNames = [STORES.TIMELINE_SESSIONS, STORES.AI_CONVERSATIONS, STORES.SETTINGS];

  for (const storeName of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  console.log('🗑️ All IndexedDB data cleared');
}

/**
 * Get database storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentUsed: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
    };
  }
  return null;
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

function serializeProperty(property: Property): unknown {
  return {
    ...property,
    purchaseDate: property.purchaseDate instanceof Date
      ? property.purchaseDate.toISOString()
      : property.purchaseDate,
    saleDate: property.saleDate instanceof Date
      ? property.saleDate.toISOString()
      : property.saleDate,
  };
}

// Helper to safely parse dates - returns undefined for invalid dates
function safeParseDate(dateValue: unknown): Date | undefined {
  if (!dateValue) return undefined;
  const parsed = new Date(dateValue as string);
  // Check if date is valid (Invalid Date returns NaN for getTime())
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

function deserializeProperty(property: Property): Property {
  return {
    ...property,
    purchaseDate: safeParseDate(property.purchaseDate),
    saleDate: safeParseDate(property.saleDate),
  } as Property;
}

function serializeEvent(event: TimelineEvent): unknown {
  // Safely serialize date - handle both Date objects and already-serialized strings
  const serializeDate = (d: Date | string | undefined | null): string | undefined => {
    if (!d) return undefined;
    if (d instanceof Date) {
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    }
    // Already a string, validate it
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? undefined : d;
  };

  return {
    ...event,
    date: serializeDate(event.date as Date | string),
    contractDate: serializeDate(event.contractDate as Date | string | undefined),
    settlementDate: serializeDate(event.settlementDate as Date | string | undefined),
  };
}

function deserializeEvent(event: TimelineEvent): TimelineEvent {
  const parsedDate = safeParseDate(event.date);
  return {
    ...event,
    // Use current date as fallback if date is invalid
    date: parsedDate || new Date(),
    contractDate: safeParseDate(event.contractDate),
    settlementDate: safeParseDate(event.settlementDate),
  } as TimelineEvent;
}

// Export the service as a singleton object for convenience
export const IndexedDBService = {
  initialize: initializeDB,
  // Timeline sessions
  saveTimelineSession,
  loadTimelineSession,
  deleteTimelineSession,
  getAllTimelineSessions,
  hasTimelineSession,
  getSessionMetadata,
  // AI conversations
  saveAIConversation,
  loadAIConversation,
  deleteAIConversation,
  listAIConversations,
  // Settings
  saveSetting,
  loadSetting,
  // Utilities
  clearAllData,
  getStorageEstimate,
};

export default IndexedDBService;
