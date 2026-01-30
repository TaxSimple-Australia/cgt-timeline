# Session Restore & Undo/Redo System - Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to implement:
1. **Auto-Save & Session Restore** - Automatically persist timeline state to prevent data loss
2. **Universal Undo/Redo** - Available everywhere (main UI + AI Builder)
3. **AI Builder Integration** - Full undo/redo and session history for conversations

---

## Current State Analysis

### What Currently Exists

| Feature | Status | Location |
|---------|--------|----------|
| In-memory state (Zustand) | ✅ Full | `src/store/timeline.ts` |
| Logo preference persistence | ✅ localStorage | `src/store/timeline.ts` |
| Shareable timeline links | ✅ Vercel KV | `src/app/api/timeline/` |
| AI Builder undo/redo | ⚠️ Partial | `src/lib/ai-builder/actions/` |
| Manual export/import | ✅ JSON files | Various components |
| Session storage (auth only) | ✅ Limited | Landing components |

### Critical Gaps

1. **No auto-save** - Page reload loses everything
2. **No session restore** - Crash = total data loss
3. **Undo/redo only in AI Builder** - Main UI has no undo
4. **AI conversation history not persisted** - Lost on close
5. **No IndexedDB** - localStorage has 5MB limit
6. **No offline support** - Requires connection

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Main Timeline │  │  AI Builder  │  │   Modals     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┴─────────────────┘                        │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    UNIFIED ACTION SYSTEM                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │ ActionTypes │  │ UndoManager │  │ SessionPersistence  │   │  │
│  │  │ (expanded)  │  │ (enhanced)  │  │ (NEW)               │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    ZUSTAND STORE                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │Properties│  │  Events  │  │ UI State │  │ Undo History │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    PERSISTENCE LAYER                           │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                 │  │
│  │  │ IndexedDB │  │localStorage│  │ Vercel KV │                 │  │
│  │  │(timeline) │  │(settings) │  │ (sharing) │                 │  │
│  │  └───────────┘  └───────────┘  └───────────┘                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Persistence Layer (IndexedDB + Auto-Save)

#### 1.1 Create IndexedDB Service

**File**: `src/lib/persistence/IndexedDBService.ts`

```typescript
interface TimelineSession {
  id: string;                    // 'current' for active session
  version: string;               // Schema version
  createdAt: Date;
  updatedAt: Date;
  properties: Property[];
  events: TimelineEvent[];
  notes: string;
  stickyNotes: StickyNote[];
  savedAnalysis?: SavedAnalysis;
  undoStack: UndoableAction[];
  redoStack: UndoableAction[];
}

interface AIBuilderSession {
  id: string;
  conversationHistory: ConversationMessage[];
  processedDocuments: ProcessedDocument[];
  lastProvider: string;
  createdAt: Date;
  updatedAt: Date;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'cgt-brain-db';
  private readonly DB_VERSION = 1;

  // Database stores
  private readonly STORES = {
    TIMELINE_SESSIONS: 'timeline-sessions',
    AI_BUILDER_SESSIONS: 'ai-builder-sessions',
    SETTINGS: 'settings',
    UNDO_HISTORY: 'undo-history'
  };

  async initialize(): Promise<void>;
  async saveTimelineSession(session: TimelineSession): Promise<void>;
  async loadTimelineSession(id?: string): Promise<TimelineSession | null>;
  async saveAIBuilderSession(session: AIBuilderSession): Promise<void>;
  async loadAIBuilderSession(): Promise<AIBuilderSession | null>;
  async clearSession(type: 'timeline' | 'ai-builder'): Promise<void>;
  async getAllSessions(): Promise<TimelineSession[]>;  // For session picker
}
```

#### 1.2 Create Auto-Save Middleware for Zustand

**File**: `src/lib/persistence/autoSaveMiddleware.ts`

```typescript
interface AutoSaveConfig {
  debounceMs: number;           // Default: 1000ms
  saveOnUnload: boolean;        // Save before page close
  excludeKeys: string[];        // UI state we don't persist
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

// Keys to persist
const PERSIST_KEYS = [
  'properties',
  'events',
  'timelineNotes',
  'timelineStickyNotes',
  'savedAnalysis',
  'analysisStickyNotes',
  // Undo/Redo stacks (new)
  'undoStack',
  'redoStack'
];

// Keys to exclude (UI state)
const EXCLUDE_KEYS = [
  'selectedProperty',
  'selectedEvent',
  'isAnalyzing',
  'centerDate',
  'zoom'
];

export const createAutoSaveMiddleware = (config: AutoSaveConfig) => {
  // Returns Zustand middleware that:
  // 1. Subscribes to state changes
  // 2. Debounces saves
  // 3. Persists to IndexedDB
  // 4. Shows save indicator
};
```

#### 1.3 Session Restore on App Load

**File**: `src/lib/persistence/sessionRestore.ts`

```typescript
interface RestoreOptions {
  showPrompt: boolean;          // Ask user before restoring
  autoRestoreIfRecent: boolean; // Auto-restore if < 24hrs old
  maxAgeHours: number;          // Discard sessions older than this
}

async function checkForSavedSession(): Promise<{
  hasSession: boolean;
  session?: TimelineSession;
  lastModified?: Date;
  propertyCount?: number;
  eventCount?: number;
}>;

async function restoreSession(session: TimelineSession): Promise<void>;
async function discardSession(): Promise<void>;
async function promptUserForRestore(): Promise<'restore' | 'discard' | 'new'>;
```

#### 1.4 UI Components for Session Restore

**File**: `src/components/SessionRestoreModal.tsx`

Features:
- Shows when saved session detected on load
- Displays: last modified time, property count, event count
- Options: "Restore Session", "Start Fresh", "View Details"
- Preview mode to see what will be restored
- Auto-dismiss after timeout with restore as default

**File**: `src/components/SaveIndicator.tsx`

Features:
- Small indicator in corner showing save status
- States: "Saving...", "Saved", "Error saving"
- Click to force save or see last save time
- Pulsing animation during save

---

### Phase 2: Universal Undo/Redo System

#### 2.1 Expand Action Types

**File**: `src/types/actions.ts` (new unified location)

```typescript
// Expanded action types for full coverage
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
  | 'MOVE_EVENT'           // Drag to new date
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
  | 'TOGGLE_SUBDIVISION_COLLAPSE'
  // Notes & annotations
  | 'UPDATE_TIMELINE_NOTES'
  | 'ADD_STICKY_NOTE'
  | 'UPDATE_STICKY_NOTE'
  | 'DELETE_STICKY_NOTE'
  // Analysis
  | 'SET_AI_ANALYSIS'
  | 'CLEAR_AI_ANALYSIS'
  // Verification
  | 'RESOLVE_VERIFICATION_ALERT'
  // Session
  | 'CLEAR_ALL_DATA'
  | 'LOAD_DEMO_DATA'
  | 'IMPORT_TIMELINE';

export interface TimelineAction {
  id: string;
  type: ActionType;
  timestamp: Date;
  payload: ActionPayload;
  description: string;        // Human-readable
  reversible: boolean;        // Some actions can't be undone
  previousState?: StateSnapshot;
}
```

#### 2.2 Enhanced UndoManager

**File**: `src/lib/undo/UndoManager.ts` (refactored from ai-builder)

```typescript
interface UndoManagerConfig {
  maxStackSize: number;         // Default: 100
  persistStacks: boolean;       // Save to IndexedDB
  groupActions: boolean;        // Group rapid actions
  groupTimeoutMs: number;       // Time window for grouping
}

class UndoManager {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private actionGroup: UndoableAction[] = [];
  private groupTimer: NodeJS.Timeout | null = null;

  // Core operations
  record(action: TimelineAction, previousState: StateSnapshot): void;
  undo(): UndoableAction | null;
  redo(): UndoableAction | null;

  // Action grouping (for rapid changes)
  startGroup(): void;
  endGroup(description: string): void;

  // Queries
  canUndo(): boolean;
  canRedo(): boolean;
  getUndoStack(): UndoableAction[];
  getRedoStack(): UndoableAction[];
  getUndoDescription(): string | null;
  getRedoDescription(): string | null;

  // Persistence
  serialize(): SerializedUndoState;
  deserialize(state: SerializedUndoState): void;

  // Utilities
  clear(): void;
  clearRedo(): void;
}
```

#### 2.3 Integrate into Zustand Store

**File**: `src/store/timeline.ts` (additions)

```typescript
interface TimelineState {
  // ... existing state ...

  // New undo/redo state
  undoManager: UndoManager;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;

  // New actions
  undo: () => void;
  redo: () => void;

  // Wrapper for all mutations to track undo
  executeAction: (action: TimelineAction) => void;
}

// Example: Wrap addEvent to support undo
addEvent: (event) => {
  const previousState = takeSnapshot();

  set(state => ({
    events: [...state.events, { ...event, id: generateId() }]
  }));

  get().undoManager.record({
    type: 'ADD_EVENT',
    payload: event,
    description: `Add ${event.type} event`
  }, previousState);

  updateUndoState();
}
```

#### 2.4 Keyboard Shortcuts

**File**: `src/hooks/useUndoRedoShortcuts.ts`

```typescript
export function useUndoRedoShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useTimelineStore.getState().undo();
      }
      // Ctrl/Cmd + Shift + Z = Redo
      // OR Ctrl/Cmd + Y = Redo
      if ((e.ctrlKey || e.metaKey) && (
        (e.key === 'z' && e.shiftKey) || e.key === 'y'
      )) {
        e.preventDefault();
        useTimelineStore.getState().redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

#### 2.5 Undo/Redo UI Components

**File**: `src/components/UndoRedoButtons.tsx`

```typescript
// Compact buttons for toolbar
export function UndoRedoButtons() {
  const { canUndo, canRedo, undo, redo, undoDescription, redoDescription } = useTimelineStore();

  return (
    <div className="flex items-center gap-1">
      <Tooltip content={undoDescription || 'Nothing to undo'}>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content={redoDescription || 'Nothing to redo'}>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canRedo}
          onClick={redo}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
}
```

**File**: `src/components/UndoHistoryPanel.tsx`

```typescript
// Full history view (optional, in settings or debug)
export function UndoHistoryPanel() {
  // Shows full undo/redo stack
  // Allows jumping to specific point in history
  // Shows action descriptions with timestamps
}
```

---

### Phase 3: AI Builder Integration

#### 3.1 Persist Conversation History

**File**: `src/lib/ai-builder/conversation/ConversationPersistence.ts`

```typescript
interface PersistedConversation {
  id: string;
  messages: ConversationMessage[];
  processedDocuments: ProcessedDocument[];
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

class ConversationPersistence {
  async save(conversation: PersistedConversation): Promise<void>;
  async load(): Promise<PersistedConversation | null>;
  async clear(): Promise<void>;
  async getHistory(): Promise<PersistedConversation[]>;
}
```

#### 3.2 Connect AI Builder to Main Undo System

**File**: `src/lib/ai-builder/actions/ActionExecutor.ts` (modifications)

```typescript
class ActionExecutor {
  // Use the shared UndoManager from store
  private get undoManager(): UndoManager {
    return useTimelineStore.getState().undoManager;
  }

  async execute(action: TimelineAction): Promise<ActionResult> {
    // Take snapshot before execution
    const previousState = this.takeSnapshot();

    // Execute the action
    const result = await this.executeAction(action);

    // Record in shared undo manager (not separate one)
    if (result.success && action.reversible !== false) {
      this.undoManager.record(action, previousState);
    }

    return result;
  }

  // Undo/redo now delegate to shared manager
  async undo(): Promise<ActionResult> {
    return useTimelineStore.getState().undo();
  }

  async redo(): Promise<ActionResult> {
    return useTimelineStore.getState().redo();
  }
}
```

#### 3.3 AI Builder Session Restore

**File**: `src/components/ai-builder/AITimelineBuilder.tsx` (modifications)

```typescript
// On mount, check for saved conversation
useEffect(() => {
  const loadSavedConversation = async () => {
    const saved = await conversationPersistence.load();
    if (saved && saved.messages.length > 0) {
      const shouldRestore = await promptRestoreConversation(saved);
      if (shouldRestore) {
        setMessages(saved.messages);
        setProcessedDocuments(saved.processedDocuments);
      }
    }
  };
  loadSavedConversation();
}, []);

// Auto-save conversation on changes
useEffect(() => {
  const saveConversation = debounce(async () => {
    await conversationPersistence.save({
      id: 'current',
      messages,
      processedDocuments,
      provider: selectedLLMProvider,
      createdAt: sessionStart,
      updatedAt: new Date()
    });
  }, 2000);

  saveConversation();
}, [messages, processedDocuments]);
```

---

### Phase 4: User Experience Enhancements

#### 4.1 Session Recovery Toast

When app detects crash recovery opportunity:

```typescript
// Show non-blocking toast
toast({
  title: "Session recovered",
  description: "Your previous work has been restored",
  action: <Button onClick={viewChanges}>View Changes</Button>,
  duration: 10000
});
```

#### 4.2 Unsaved Changes Warning

**File**: `src/hooks/useBeforeUnload.ts`

```typescript
export function useBeforeUnload() {
  const hasUnsavedChanges = useTimelineStore(state => state.hasUnsavedChanges);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
```

#### 4.3 Save Status Indicator

Always visible in header/footer showing:
- Last auto-save time
- Save in progress indicator
- Manual save button
- Error state with retry

#### 4.4 Session Management UI

**File**: `src/components/SessionManager.tsx`

Features:
- View all saved sessions
- Restore previous sessions
- Delete old sessions
- Export session to file
- Import session from file
- Clear all local data

---

## Data Flow Diagrams

### Auto-Save Flow

```
User Action (e.g., add event)
        │
        ▼
┌───────────────────┐
│   Zustand Store   │
│   (state update)  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Auto-Save        │
│  Middleware       │
│  (debounce 1s)    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   IndexedDB       │
│   Service         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Browser         │
│   IndexedDB       │
└───────────────────┘
```

### Undo/Redo Flow

```
User triggers Undo (Ctrl+Z or button)
        │
        ▼
┌───────────────────┐
│   useTimelineStore│
│   .undo()         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   UndoManager     │
│   .undo()         │
│   - pop undoStack │
│   - push redoStack│
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Restore         │
│   previousState   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Update Store    │
│   (properties,    │
│    events, etc.)  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   UI Re-renders   │
│   (Timeline view) │
└───────────────────┘
```

### Session Restore Flow

```
App Loads
    │
    ▼
┌─────────────────────┐
│ Check IndexedDB for │
│ saved session       │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
 No Session   Has Session
     │           │
     ▼           ▼
 Start Fresh  ┌──────────────┐
              │ Show Restore │
              │ Modal        │
              └──────┬───────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    Restore      Discard      Preview
        │            │            │
        ▼            ▼            │
   Load State    Clear DB        │
        │            │            │
        └────────────┴────────────┘
                     │
                     ▼
              App Ready
```

---

## Implementation Order

### Sprint 1: Core Persistence (Week 1-2)
1. Create IndexedDBService
2. Implement auto-save middleware
3. Add session restore on app load
4. Add SessionRestoreModal component
5. Add SaveIndicator component

### Sprint 2: Universal Undo/Redo (Week 3-4)
1. Refactor UndoManager to be shared
2. Integrate into Zustand store
3. Wrap all mutations with undo tracking
4. Add keyboard shortcuts
5. Add UndoRedoButtons component

### Sprint 3: AI Builder Integration (Week 5)
1. Add ConversationPersistence
2. Connect AI Builder to shared undo system
3. Add conversation restore prompt
4. Test undo/redo across AI and manual actions

### Sprint 4: Polish & Testing (Week 6)
1. Add session management UI
2. Handle edge cases (conflicts, corruption)
3. Performance optimization
4. Comprehensive testing
5. Documentation

---

## Technical Considerations

### IndexedDB vs localStorage

| Aspect | localStorage | IndexedDB |
|--------|-------------|-----------|
| Size limit | 5-10 MB | 50+ MB (browser dependent) |
| Data types | Strings only | Objects, blobs, arrays |
| Async | No | Yes |
| Indexed queries | No | Yes |
| Transaction support | No | Yes |

**Recommendation**: Use IndexedDB for timeline data (can grow large), localStorage for small settings.

### Performance Considerations

1. **Debounce saves**: Don't save on every keystroke
2. **Incremental snapshots**: Consider storing diffs, not full state
3. **Lazy loading**: Load undo history on demand
4. **Memory management**: Limit undo stack size
5. **Background saves**: Use Web Workers for large saves

### Error Handling

1. **Quota exceeded**: Warn user, offer to clear old data
2. **Corruption**: Offer to reset, provide export first
3. **Browser incompatibility**: Fallback to localStorage
4. **Save failures**: Retry with exponential backoff

### Security Considerations

1. **Sensitive data**: Don't persist API keys or tokens in IndexedDB
2. **Clear on logout**: Option to clear all local data
3. **Encryption**: Consider encrypting financial data at rest

---

## Testing Strategy

### Unit Tests
- IndexedDBService CRUD operations
- UndoManager stack operations
- Serialization/deserialization
- Action grouping

### Integration Tests
- Full save/restore cycle
- Undo/redo across sessions
- AI Builder + Main UI undo synchronization

### E2E Tests
- Page refresh recovery
- Browser crash simulation
- Multi-tab scenarios
- Storage quota handling

---

## Success Metrics

1. **Data loss prevention**: 0 reported cases of unexpected data loss
2. **Restore success rate**: >99% successful session restores
3. **Undo usage**: Track undo/redo usage patterns
4. **Performance**: Auto-save completes in <100ms
5. **User satisfaction**: Survey feedback on reliability

---

## Future Enhancements

1. **Cloud sync**: Sync sessions across devices
2. **Collaboration**: Real-time multi-user editing
3. **Version history**: Full timeline of all changes
4. **Branching**: Create alternative scenarios from any point
5. **Offline mode**: Full functionality without network

---

## Files to Create/Modify

### New Files
- `src/lib/persistence/IndexedDBService.ts`
- `src/lib/persistence/autoSaveMiddleware.ts`
- `src/lib/persistence/sessionRestore.ts`
- `src/lib/undo/UndoManager.ts`
- `src/types/actions.ts`
- `src/hooks/useUndoRedoShortcuts.ts`
- `src/hooks/useBeforeUnload.ts`
- `src/components/SessionRestoreModal.tsx`
- `src/components/SaveIndicator.tsx`
- `src/components/UndoRedoButtons.tsx`
- `src/components/UndoHistoryPanel.tsx`
- `src/components/SessionManager.tsx`
- `src/lib/ai-builder/conversation/ConversationPersistence.ts`

### Modified Files
- `src/store/timeline.ts` - Add undo/redo state and actions
- `src/app/page.tsx` - Add session restore check
- `src/components/Timeline.tsx` - Add undo/redo buttons
- `src/lib/ai-builder/actions/ActionExecutor.ts` - Use shared UndoManager
- `src/components/ai-builder/AITimelineBuilder.tsx` - Add conversation persistence

---

## Conclusion

This plan provides a comprehensive solution for:
1. **Never losing work** - Auto-save with IndexedDB persistence
2. **Easy recovery** - Session restore modal on app load
3. **Mistake correction** - Universal undo/redo everywhere
4. **Seamless AI integration** - Shared undo system between manual and AI actions

The implementation is modular, allowing incremental rollout and testing of each component.
