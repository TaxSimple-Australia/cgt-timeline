# Session Restore & Undo/Redo - Implementation Plan

## Implementation Order (Executed Now)

### Phase 1: IndexedDB Persistence Layer

#### Step 1.1: Create IndexedDB Service
**File**: `src/lib/persistence/IndexedDBService.ts`

```typescript
// Core service for all IndexedDB operations
// Handles: timeline sessions, AI conversations, settings

Stores to create:
- timeline-sessions: { id, version, properties, events, notes, stickyNotes, savedAnalysis, undoStack, redoStack, createdAt, updatedAt }
- ai-conversations: { id, messages, processedDocuments, provider, createdAt, updatedAt }
- settings: { key, value }
```

#### Step 1.2: Create Auto-Save Middleware
**File**: `src/lib/persistence/autoSaveMiddleware.ts`

```typescript
// Zustand middleware that:
// 1. Subscribes to state changes
// 2. Debounces saves (1 second)
// 3. Saves to IndexedDB
// 4. Updates save status indicator

Keys to persist:
- properties, events, timelineNotes, timelineStickyNotes
- savedAnalysis, analysisStickyNotes
- undoStack, redoStack (new)

Keys to exclude (UI state):
- selectedProperty, selectedEvent, isAnalyzing
- centerDate, zoom, zoomLevel
```

#### Step 1.3: Create Session Restore Logic
**File**: `src/lib/persistence/sessionRestore.ts`

```typescript
// Functions:
// - checkForSavedSession(): Check if IndexedDB has saved data
// - restoreSession(): Load saved data into store
// - discardSession(): Clear saved data
// - getSessionMetadata(): Get summary without loading full data
```

---

### Phase 2: Unified Undo/Redo System

#### Step 2.1: Create Enhanced UndoManager
**File**: `src/lib/undo/UndoManager.ts`

```typescript
// Features:
// - Two stacks: undoStack, redoStack
// - Max 100 actions
// - Action grouping for rapid changes
// - Serialization for persistence
// - Clear redo on new action

Methods:
- record(action, previousState)
- undo(): UndoableAction | null
- redo(): UndoableAction | null
- canUndo/canRedo
- getDescription()
- serialize/deserialize
```

#### Step 2.2: Create Action Types
**File**: `src/lib/undo/actionTypes.ts`

```typescript
// All undoable action types:
// Properties: ADD, UPDATE, DELETE, DUPLICATE
// Events: ADD, UPDATE, DELETE, MOVE, DUPLICATE
// Cost Bases: ADD, UPDATE, DELETE
// Bulk: BULK_ADD, BULK_DELETE, BULK_UPDATE, IMPORT
// Subdivision: SUBDIVIDE_PROPERTY
// Notes: UPDATE_NOTES, ADD_STICKY, UPDATE_STICKY, DELETE_STICKY
// Session: CLEAR_ALL, LOAD_DEMO
```

#### Step 2.3: Create State Snapshot Utility
**File**: `src/lib/undo/snapshot.ts`

```typescript
// Functions:
// - takeSnapshot(): Capture current state
// - restoreSnapshot(snapshot): Apply snapshot to store
// - diffSnapshots(before, after): Get changes (for descriptions)
```

#### Step 2.4: Integrate UndoManager into Zustand Store
**Modify**: `src/store/timeline.ts`

```typescript
// Add to state:
undoStack: UndoableAction[]
redoStack: UndoableAction[]
canUndo: boolean
canRedo: boolean
undoDescription: string | null
redoDescription: string | null
lastSavedAt: Date | null
hasUnsavedChanges: boolean

// Add actions:
undo: () => void
redo: () => void
recordAction: (action, previousState) => void

// Wrap existing mutations to track undo:
// - addProperty, updateProperty, deleteProperty
// - addEvent, updateEvent, deleteEvent, moveEvent
// - All cost base operations
// - subdivideProperty
// - clearAllData, loadDemoData
// - importTimelineData
```

---

### Phase 3: UI Components

#### Step 3.1: Session Restore Modal
**File**: `src/components/SessionRestoreModal.tsx`

```typescript
// Shows on app load if saved session exists
// Displays:
// - Last saved time
// - Property count, event count
// - Preview button
// Options:
// - "Restore Session" (primary)
// - "Start Fresh"
// - "View Details"
```

#### Step 3.2: Save Status Indicator
**File**: `src/components/SaveIndicator.tsx`

```typescript
// Small indicator in corner
// States:
// - Idle: "Saved at HH:MM"
// - Saving: "Saving..." with spinner
// - Error: "Save failed" with retry button
// Click to force save
```

#### Step 3.3: Undo/Redo Buttons
**File**: `src/components/UndoRedoButtons.tsx`

```typescript
// Two icon buttons with tooltips
// Shows action description in tooltip
// Disabled state when nothing to undo/redo
// Keyboard shortcut hints
```

#### Step 3.4: Keyboard Shortcuts Hook
**File**: `src/hooks/useUndoRedoShortcuts.ts`

```typescript
// Registers:
// - Ctrl/Cmd + Z: Undo
// - Ctrl/Cmd + Shift + Z: Redo
// - Ctrl/Cmd + Y: Redo (alternative)
// - Ctrl/Cmd + S: Force save (optional)
```

#### Step 3.5: Before Unload Warning Hook
**File**: `src/hooks/useBeforeUnload.ts`

```typescript
// Shows browser warning if unsaved changes
// "You have unsaved changes. Are you sure you want to leave?"
```

---

### Phase 4: AI Builder Integration

#### Step 4.1: Conversation Persistence
**File**: `src/lib/ai-builder/persistence/ConversationPersistence.ts`

```typescript
// Save/load AI Builder conversation
// - Messages array
// - Processed documents
// - Selected provider
// - Timestamps
```

#### Step 4.2: Modify AI Builder to Use Shared Undo
**Modify**: `src/lib/ai-builder/actions/ActionExecutor.ts`

```typescript
// Change to use store's undoManager instead of own
// All AI actions recorded in shared history
// Undo/redo delegates to store
```

#### Step 4.3: Add Conversation Restore to AI Builder
**Modify**: `src/components/ai-builder/AITimelineBuilder.tsx`

```typescript
// On mount: Check for saved conversation
// If exists: Show restore prompt
// Auto-save conversation on changes (debounced)
```

---

### Phase 5: Integration Points

#### Step 5.1: Modify Main App Page
**Modify**: `src/app/page.tsx`

```typescript
// On mount:
// 1. Initialize IndexedDB
// 2. Check for saved session
// 3. Show restore modal if needed
// 4. Load undo/redo stacks
```

#### Step 5.2: Add Undo/Redo to Timeline Controls
**Modify**: `src/components/TimelineControls.tsx`

```typescript
// Add UndoRedoButtons to toolbar
// Position: Left side, before zoom controls
```

#### Step 5.3: Add Save Indicator to Layout
**Modify**: `src/app/layout.tsx` or main page

```typescript
// Add SaveIndicator component
// Position: Bottom-right corner, fixed
```

---

## File Creation Order

### Batch 1: Core Infrastructure
1. `src/lib/persistence/IndexedDBService.ts`
2. `src/lib/undo/actionTypes.ts`
3. `src/lib/undo/snapshot.ts`
4. `src/lib/undo/UndoManager.ts`

### Batch 2: Store Integration
5. `src/lib/persistence/autoSaveMiddleware.ts`
6. `src/lib/persistence/sessionRestore.ts`
7. Modify `src/store/timeline.ts` (add undo/redo state and wrap mutations)

### Batch 3: UI Components
8. `src/components/SessionRestoreModal.tsx`
9. `src/components/SaveIndicator.tsx`
10. `src/components/UndoRedoButtons.tsx`
11. `src/hooks/useUndoRedoShortcuts.ts`
12. `src/hooks/useBeforeUnload.ts`

### Batch 4: AI Builder Integration
13. `src/lib/ai-builder/persistence/ConversationPersistence.ts`
14. Modify `src/lib/ai-builder/actions/ActionExecutor.ts`
15. Modify `src/components/ai-builder/AITimelineBuilder.tsx`

### Batch 5: Final Integration
16. Modify `src/app/page.tsx`
17. Modify `src/components/TimelineControls.tsx`
18. Modify `src/components/Timeline.tsx` (add keyboard shortcuts hook)

---

## Execution Plan

I will now implement in this exact order:

### Step 1: IndexedDBService (Foundation)
- Create the database service
- Define schemas for all stores
- Implement CRUD operations

### Step 2: Action Types & Snapshot Utilities
- Define all action types
- Create snapshot take/restore functions

### Step 3: UndoManager
- Implement the enhanced undo manager
- Add serialization support

### Step 4: Store Modifications
- Add undo/redo state to Zustand
- Wrap all mutations with undo tracking
- This is the largest change

### Step 5: Auto-Save Middleware
- Create middleware for Zustand
- Integrate with IndexedDB

### Step 6: Session Restore
- Create restore logic
- Handle various scenarios

### Step 7: UI Components
- Create all UI components
- Add hooks

### Step 8: AI Builder Integration
- Add conversation persistence
- Connect to shared undo system

### Step 9: Final Integration
- Wire everything together
- Test full flow

---

## Ready to Execute

Starting implementation now...
