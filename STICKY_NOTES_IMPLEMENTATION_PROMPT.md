# Sticky Notes System - Complete Implementation Prompt

## Project Context

You are implementing a sticky notes system for CGT Brain AI, a Next.js 14 application that visualizes Capital Gains Tax timelines for Australian property portfolios. The application uses:

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand (main store at `src/store/timeline.ts`)
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: Radix UI + Lucide Icons + Framer Motion
- **Storage**: Vercel KV (Redis) for shareable links
- **Current Sharing**: Timeline data is already shareable via `/api/timeline/save` and `/api/timeline/load`

---

## Feature Overview

Implement a comprehensive sticky notes system that allows users to:

1. Add persistent sticky notes to specific positions on the timeline visualization
2. Add sticky notes to CGT analysis results after analysis is complete
3. Save all data (timeline + sticky notes + analysis + analysis notes) when generating shareable links
4. Access quick share functionality from the timeline toolbar
5. Preserve exact note positions when links are shared and viewed by others

---

## Part 1: Sticky Note Data Structures

### 1.1 TypeScript Interfaces

Create a new file `src/types/sticky-note.ts`:

```typescript
// Sticky note position types for different contexts
export type StickyNoteContext = 'timeline' | 'analysis';

// Position on timeline (relative to date and vertical offset)
export interface TimelineNotePosition {
  // The date on the timeline where the note is anchored
  anchorDate: string; // ISO date string
  // Vertical offset from the timeline center (in pixels, can be negative)
  verticalOffset: number;
  // Optional: anchor to a specific property lane
  propertyId?: string;
  // Optional: anchor to a specific event
  eventId?: string;
}

// Position on analysis view (relative to section and element)
export interface AnalysisNotePosition {
  // Which section of the analysis (e.g., 'summary', 'property-card', 'calculation', 'detailed-report')
  section: 'summary' | 'property-card' | 'calculation-breakdown' | 'detailed-report' | 'recommendations';
  // ID of the specific element (e.g., property ID for property cards)
  elementId?: string;
  // Relative position within the element (percentage from top-left)
  relativeX: number; // 0-100
  relativeY: number; // 0-100
}

// Main sticky note interface
export interface StickyNote {
  id: string;
  // Content
  content: string;
  // Visual customization
  color: StickyNoteColor;
  // Timestamps
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Context and positioning
  context: StickyNoteContext;
  position: TimelineNotePosition | AnalysisNotePosition;
  // Optional metadata
  author?: string;
  isMinimized?: boolean;
  zIndex?: number;
}

// Available colors for sticky notes
export type StickyNoteColor =
  | 'yellow'    // #FEF3C7 / #FDE68A
  | 'pink'      // #FCE7F3 / #F9A8D4
  | 'blue'      // #DBEAFE / #93C5FD
  | 'green'     // #D1FAE5 / #6EE7B7
  | 'purple'    // #EDE9FE / #C4B5FD
  | 'orange';   // #FFEDD5 / #FDBA74

// Color mappings for light and dark mode
export const STICKY_NOTE_COLORS: Record<StickyNoteColor, { light: string; dark: string; border: string }> = {
  yellow: { light: '#FEF3C7', dark: '#FDE68A', border: '#F59E0B' },
  pink:   { light: '#FCE7F3', dark: '#F9A8D4', border: '#EC4899' },
  blue:   { light: '#DBEAFE', dark: '#93C5FD', border: '#3B82F6' },
  green:  { light: '#D1FAE5', dark: '#6EE7B7', border: '#10B981' },
  purple: { light: '#EDE9FE', dark: '#C4B5FD', border: '#8B5CF6' },
  orange: { light: '#FFEDD5', dark: '#FDBA74', border: '#F97316' },
};
```

### 1.2 Extend Timeline Store Types

The existing shareable data structure needs to be extended. Update the serialization types:

```typescript
// Extended shareable data structure
export interface ShareableTimelineData {
  version: string; // Schema version for backwards compatibility
  // Existing data
  properties: Property[];
  events: TimelineEvent[];
  // NEW: Sticky notes on timeline
  timelineStickyNotes: StickyNote[];
  // NEW: Saved analysis data (if analysis has been run)
  savedAnalysis?: {
    // The full AI response
    response: AIResponse;
    // When the analysis was performed
    analyzedAt: string;
    // Sticky notes on the analysis
    analysisStickyNotes: StickyNote[];
    // Which LLM provider was used
    provider?: string;
  };
  // Metadata
  createdAt: string;
  updatedAt: string;
  title?: string;
  description?: string;
}
```

---

## Part 2: Zustand Store Updates

### 2.1 Add Sticky Notes State to Timeline Store

Update `src/store/timeline.ts` to include sticky notes management:

```typescript
// Add to the store interface
interface TimelineStore {
  // ... existing state ...

  // Timeline sticky notes
  timelineStickyNotes: StickyNote[];
  addTimelineStickyNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTimelineStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteTimelineStickyNote: (id: string) => void;
  moveTimelineStickyNote: (id: string, newPosition: TimelineNotePosition) => void;

  // Analysis sticky notes
  analysisStickyNotes: StickyNote[];
  addAnalysisStickyNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAnalysisStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteAnalysisStickyNote: (id: string) => void;
  moveAnalysisStickyNote: (id: string, newPosition: AnalysisNotePosition) => void;

  // Saved analysis state
  savedAnalysis: {
    response: AIResponse | null;
    analyzedAt: string | null;
    provider: string | null;
  } | null;
  saveCurrentAnalysis: () => void;
  clearSavedAnalysis: () => void;

  // Enhanced export/import for sharing
  exportShareableData: () => ShareableTimelineData;
  importShareableData: (data: ShareableTimelineData) => void;
}
```

### 2.2 Implementation Details for Store Methods

```typescript
// Generate unique IDs for sticky notes
const generateStickyNoteId = () => `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Add timeline sticky note
addTimelineStickyNote: (noteData) => {
  const id = generateStickyNoteId();
  const now = new Date().toISOString();
  const note: StickyNote = {
    ...noteData,
    id,
    createdAt: now,
    updatedAt: now,
  };
  set((state) => ({
    timelineStickyNotes: [...state.timelineStickyNotes, note],
  }));
  return id;
},

// Update timeline sticky note
updateTimelineStickyNote: (id, updates) => {
  set((state) => ({
    timelineStickyNotes: state.timelineStickyNotes.map((note) =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    ),
  }));
},

// Delete timeline sticky note
deleteTimelineStickyNote: (id) => {
  set((state) => ({
    timelineStickyNotes: state.timelineStickyNotes.filter((note) => note.id !== id),
  }));
},

// Move timeline sticky note (updates position)
moveTimelineStickyNote: (id, newPosition) => {
  set((state) => ({
    timelineStickyNotes: state.timelineStickyNotes.map((note) =>
      note.id === id
        ? { ...note, position: newPosition, updatedAt: new Date().toISOString() }
        : note
    ),
  }));
},

// Save current analysis to state
saveCurrentAnalysis: () => {
  const { aiResponse, selectedProvider } = get();
  if (aiResponse) {
    set({
      savedAnalysis: {
        response: aiResponse,
        analyzedAt: new Date().toISOString(),
        provider: selectedProvider || null,
      },
    });
  }
},

// Export all data for sharing
exportShareableData: () => {
  const state = get();
  return {
    version: '2.0.0', // Bump version for new schema
    properties: state.properties,
    events: state.events,
    timelineStickyNotes: state.timelineStickyNotes,
    savedAnalysis: state.savedAnalysis && state.aiResponse ? {
      response: state.aiResponse,
      analyzedAt: state.savedAnalysis.analyzedAt || new Date().toISOString(),
      analysisStickyNotes: state.analysisStickyNotes,
      provider: state.savedAnalysis.provider || undefined,
    } : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
},

// Import shared data
importShareableData: (data) => {
  set({
    properties: data.properties || [],
    events: data.events || [],
    timelineStickyNotes: data.timelineStickyNotes || [],
    analysisStickyNotes: data.savedAnalysis?.analysisStickyNotes || [],
    aiResponse: data.savedAnalysis?.response || null,
    savedAnalysis: data.savedAnalysis ? {
      response: data.savedAnalysis.response,
      analyzedAt: data.savedAnalysis.analyzedAt,
      provider: data.savedAnalysis.provider || null,
    } : null,
  });
},
```

---

## Part 3: UI Components

### 3.1 StickyNote Component

Create `src/components/sticky-notes/StickyNote.tsx`:

```typescript
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { X, GripVertical, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StickyNote as StickyNoteType, STICKY_NOTE_COLORS, StickyNoteColor } from '@/types/sticky-note';

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (id: string, updates: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
  isReadOnly?: boolean;
  style?: React.CSSProperties;
}

export default function StickyNote({
  note,
  onUpdate,
  onDelete,
  onDragEnd,
  isReadOnly = false,
  style,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

  const colors = STICKY_NOTE_COLORS[note.color];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, isEditing]);

  const handleContentSave = () => {
    if (content.trim() !== note.content) {
      onUpdate(note.id, { content: content.trim() });
    }
    setIsEditing(false);
  };

  const handleColorChange = (color: StickyNoteColor) => {
    onUpdate(note.id, { color });
  };

  const handleMinimizeToggle = () => {
    onUpdate(note.id, { isMinimized: !note.isMinimized });
  };

  return (
    <motion.div
      drag={!isReadOnly}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info: PanInfo) => {
        onDragEnd(note.id, { x: info.point.x, y: info.point.y });
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={{ boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
      className={cn(
        'absolute rounded-lg shadow-lg border-l-4 overflow-hidden',
        'min-w-[200px] max-w-[300px]',
        note.isMinimized ? 'h-auto' : 'min-h-[120px]'
      )}
      style={{
        backgroundColor: colors.light,
        borderLeftColor: colors.border,
        zIndex: note.zIndex || 1000,
        ...style,
      }}
    >
      {/* Header / Drag Handle */}
      <div
        className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: colors.dark }}
        onPointerDown={(e) => !isReadOnly && dragControls.start(e)}
      >
        <div className="flex items-center gap-1">
          {!isReadOnly && <GripVertical className="w-4 h-4 text-gray-600" />}
          <span className="text-xs text-gray-600 font-medium">Note</span>
        </div>

        <div className="flex items-center gap-1">
          {!isReadOnly && (
            <>
              <button
                onClick={handleMinimizeToggle}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                {note.isMinimized ? (
                  <Maximize2 className="w-3 h-3 text-gray-600" />
                ) : (
                  <Minimize2 className="w-3 h-3 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="p-1 hover:bg-red-200 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {!note.isMinimized && (
        <div className="p-3">
          {isEditing && !isReadOnly ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setContent(note.content);
                  setIsEditing(false);
                }
                if (e.key === 'Enter' && e.metaKey) {
                  handleContentSave();
                }
              }}
              autoFocus
              className={cn(
                'w-full bg-transparent border-none outline-none resize-none',
                'text-sm text-gray-800 placeholder-gray-500'
              )}
              placeholder="Write your note..."
              rows={3}
            />
          ) : (
            <p
              onClick={() => !isReadOnly && setIsEditing(true)}
              className={cn(
                'text-sm text-gray-800 whitespace-pre-wrap',
                !isReadOnly && 'cursor-text hover:bg-black/5 rounded p-1 -m-1'
              )}
            >
              {note.content || (isReadOnly ? '' : 'Click to add note...')}
            </p>
          )}

          {/* Color Picker (only when editing and not read-only) */}
          {!isReadOnly && (
            <div className="flex gap-1 mt-3 pt-2 border-t border-gray-300/50">
              {(Object.keys(STICKY_NOTE_COLORS) as StickyNoteColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                    note.color === color ? 'border-gray-600 scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: STICKY_NOTE_COLORS[color].border }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
```

### 3.2 StickyNotesLayer Component (for Timeline)

Create `src/components/sticky-notes/StickyNotesLayer.tsx`:

This component renders as an overlay on the timeline and handles:
- Rendering all timeline sticky notes at their correct positions
- Converting date-based positions to pixel coordinates based on current zoom/pan
- Handling drag-and-drop to update note positions
- Double-click on empty space to create new note

```typescript
'use client';

import React, { useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import StickyNote from './StickyNote';
import { TimelineNotePosition, StickyNoteColor } from '@/types/sticky-note';

interface StickyNotesLayerProps {
  // Function to convert a date to X pixel position on the timeline
  dateToPixelX: (date: Date) => number;
  // Function to convert X pixel position back to a date
  pixelXToDate: (x: number) => Date;
  // The timeline container ref for positioning
  containerRef: React.RefObject<HTMLDivElement>;
  // Whether the view is read-only (shared link)
  isReadOnly?: boolean;
}

export default function StickyNotesLayer({
  dateToPixelX,
  pixelXToDate,
  containerRef,
  isReadOnly = false,
}: StickyNotesLayerProps) {
  const {
    timelineStickyNotes,
    addTimelineStickyNote,
    updateTimelineStickyNote,
    deleteTimelineStickyNote,
    moveTimelineStickyNote,
  } = useTimelineStore();

  // Calculate pixel position for a sticky note
  const getNotePixelPosition = useCallback(
    (position: TimelineNotePosition) => {
      const x = dateToPixelX(new Date(position.anchorDate));
      const y = position.verticalOffset;
      return { x, y };
    },
    [dateToPixelX]
  );

  // Handle creating a new note on double-click
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isReadOnly) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + container.scrollLeft;
      const y = e.clientY - rect.top;

      const anchorDate = pixelXToDate(x);
      const centerY = rect.height / 2;
      const verticalOffset = y - centerY;

      addTimelineStickyNote({
        content: '',
        color: 'yellow' as StickyNoteColor,
        context: 'timeline',
        position: {
          anchorDate: anchorDate.toISOString(),
          verticalOffset,
        },
      });
    },
    [isReadOnly, containerRef, pixelXToDate, addTimelineStickyNote]
  );

  // Handle drag end - update note position
  const handleDragEnd = useCallback(
    (noteId: string, pixelPosition: { x: number; y: number }) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newDate = pixelXToDate(pixelPosition.x - rect.left + container.scrollLeft);
      const centerY = rect.height / 2;
      const newVerticalOffset = pixelPosition.y - rect.top - centerY;

      moveTimelineStickyNote(noteId, {
        anchorDate: newDate.toISOString(),
        verticalOffset: newVerticalOffset,
      });
    },
    [containerRef, pixelXToDate, moveTimelineStickyNote]
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onDoubleClick={handleDoubleClick}
      style={{ pointerEvents: isReadOnly ? 'none' : 'auto' }}
    >
      <AnimatePresence>
        {timelineStickyNotes.map((note) => {
          const position = note.position as TimelineNotePosition;
          const { x, y } = getNotePixelPosition(position);

          return (
            <div
              key={note.id}
              className="pointer-events-auto"
              style={{
                position: 'absolute',
                left: x,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <StickyNote
                note={note}
                onUpdate={updateTimelineStickyNote}
                onDelete={deleteTimelineStickyNote}
                onDragEnd={handleDragEnd}
                isReadOnly={isReadOnly}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

### 3.3 AnalysisStickyNotesLayer Component

Create `src/components/sticky-notes/AnalysisStickyNotesLayer.tsx`:

Similar to timeline layer but for the analysis view. Notes are positioned relative to specific sections/elements of the analysis display.

```typescript
'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import StickyNote from './StickyNote';
import { AnalysisNotePosition, StickyNoteColor } from '@/types/sticky-note';

interface AnalysisStickyNotesLayerProps {
  // The analysis container ref
  containerRef: React.RefObject<HTMLDivElement>;
  // Whether the view is read-only
  isReadOnly?: boolean;
}

export default function AnalysisStickyNotesLayer({
  containerRef,
  isReadOnly = false,
}: AnalysisStickyNotesLayerProps) {
  const {
    analysisStickyNotes,
    addAnalysisStickyNote,
    updateAnalysisStickyNote,
    deleteAnalysisStickyNote,
    moveAnalysisStickyNote,
  } = useTimelineStore();

  const [sectionRects, setSectionRects] = useState<Map<string, DOMRect>>(new Map());

  // Update section positions on scroll/resize
  useEffect(() => {
    const updateSectionRects = () => {
      const container = containerRef.current;
      if (!container) return;

      const newRects = new Map<string, DOMRect>();

      // Find all sections with data-sticky-section attribute
      const sections = container.querySelectorAll('[data-sticky-section]');
      sections.forEach((section) => {
        const sectionId = section.getAttribute('data-sticky-section');
        const elementId = section.getAttribute('data-sticky-element');
        const key = elementId ? `${sectionId}-${elementId}` : sectionId;
        if (key) {
          newRects.set(key, section.getBoundingClientRect());
        }
      });

      setSectionRects(newRects);
    };

    updateSectionRects();

    const container = containerRef.current;
    if (container) {
      const observer = new ResizeObserver(updateSectionRects);
      observer.observe(container);
      container.addEventListener('scroll', updateSectionRects);

      return () => {
        observer.disconnect();
        container.removeEventListener('scroll', updateSectionRects);
      };
    }
  }, [containerRef]);

  // Get pixel position for analysis note
  const getNotePixelPosition = useCallback(
    (position: AnalysisNotePosition) => {
      const key = position.elementId
        ? `${position.section}-${position.elementId}`
        : position.section;
      const rect = sectionRects.get(key);

      if (!rect) return { x: 0, y: 0 };

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return { x: 0, y: 0 };

      return {
        x: rect.left - containerRect.left + (rect.width * position.relativeX / 100),
        y: rect.top - containerRect.top + (rect.height * position.relativeY / 100),
      };
    },
    [sectionRects, containerRef]
  );

  // Handle creating new note
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isReadOnly) return;

      // Find which section was clicked
      const target = e.target as HTMLElement;
      const section = target.closest('[data-sticky-section]');

      if (!section) return;

      const sectionType = section.getAttribute('data-sticky-section') as AnalysisNotePosition['section'];
      const elementId = section.getAttribute('data-sticky-element') || undefined;
      const rect = section.getBoundingClientRect();

      const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100;

      addAnalysisStickyNote({
        content: '',
        color: 'yellow' as StickyNoteColor,
        context: 'analysis',
        position: {
          section: sectionType,
          elementId,
          relativeX,
          relativeY,
        },
      });
    },
    [isReadOnly, addAnalysisStickyNote]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (noteId: string, pixelPosition: { x: number; y: number }) => {
      // Find which section the note was dropped on
      const container = containerRef.current;
      if (!container) return;

      const elementsAtPoint = document.elementsFromPoint(pixelPosition.x, pixelPosition.y);
      const section = elementsAtPoint.find((el) => el.hasAttribute('data-sticky-section'));

      if (!section) return;

      const sectionType = section.getAttribute('data-sticky-section') as AnalysisNotePosition['section'];
      const elementId = section.getAttribute('data-sticky-element') || undefined;
      const rect = section.getBoundingClientRect();

      const relativeX = ((pixelPosition.x - rect.left) / rect.width) * 100;
      const relativeY = ((pixelPosition.y - rect.top) / rect.height) * 100;

      moveAnalysisStickyNote(noteId, {
        section: sectionType,
        elementId,
        relativeX: Math.max(0, Math.min(100, relativeX)),
        relativeY: Math.max(0, Math.min(100, relativeY)),
      });
    },
    [containerRef, moveAnalysisStickyNote]
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onDoubleClick={handleDoubleClick}
      style={{ pointerEvents: isReadOnly ? 'none' : 'auto' }}
    >
      <AnimatePresence>
        {analysisStickyNotes.map((note) => {
          const position = note.position as AnalysisNotePosition;
          const { x, y } = getNotePixelPosition(position);

          if (x === 0 && y === 0) return null; // Section not found

          return (
            <div
              key={note.id}
              className="pointer-events-auto"
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <StickyNote
                note={note}
                onUpdate={updateAnalysisStickyNote}
                onDelete={deleteAnalysisStickyNote}
                onDragEnd={handleDragEnd}
                isReadOnly={isReadOnly}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

### 3.4 Add Sticky Note Button Component

Create `src/components/sticky-notes/AddStickyNoteButton.tsx`:

A floating action button to add sticky notes.

```typescript
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StickyNote, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddStickyNoteButtonProps {
  onClick: () => void;
  context: 'timeline' | 'analysis';
  className?: string;
}

export default function AddStickyNoteButton({
  onClick,
  context,
  className,
}: AddStickyNoteButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50',
        'text-amber-700 dark:text-amber-300',
        'border border-amber-300 dark:border-amber-700',
        'transition-colors shadow-sm',
        className
      )}
      title={`Add sticky note to ${context}`}
    >
      <StickyNote className="w-4 h-4" />
      <Plus className="w-3 h-3" />
      <span className="text-sm font-medium">Add Note</span>
    </motion.button>
  );
}
```

---

## Part 4: Quick Share Feature

### 4.1 ShareLinkButton Component

Create `src/components/ShareLinkButton.tsx`:

```typescript
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Check, Copy, Link, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';

interface ShareLinkButtonProps {
  className?: string;
  variant?: 'toolbar' | 'analysis';
}

export default function ShareLinkButton({
  className,
  variant = 'toolbar',
}: ShareLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { exportShareableData, saveCurrentAnalysis } = useTimelineStore();

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generate share link
  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Save current analysis state if in analysis view
      if (variant === 'analysis') {
        saveCurrentAnalysis();
      }

      // Get all shareable data
      const data = exportShareableData();

      // Save to API
      const response = await fetch('/api/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const { id } = await response.json();
      const link = `${window.location.origin}?share=${id}`;
      setShareLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy link to clipboard
  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // Fallback: select input text
      inputRef.current?.select();
    }
  };

  // Open popup and generate link
  const handleClick = () => {
    setIsOpen(true);
    if (!shareLink) {
      handleGenerateLink();
    }
  };

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50',
          'text-blue-700 dark:text-blue-300',
          'border border-blue-300 dark:border-blue-700',
          'transition-colors',
          className
        )}
        title="Share timeline"
      >
        <Share2 className="w-4 h-4" />
        {variant === 'toolbar' && (
          <span className="text-sm font-medium hidden sm:inline">Share</span>
        )}
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2',
              'w-80 p-4 rounded-xl shadow-xl',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              variant === 'toolbar' ? 'right-0' : 'left-0'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Share Link
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Generating link...</span>
              </div>
            ) : error ? (
              <div className="py-4">
                <p className="text-sm text-red-500 mb-2">{error}</p>
                <button
                  onClick={handleGenerateLink}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : shareLink ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Anyone with this link can view your timeline
                  {variant === 'analysis' && ', analysis, '} and sticky notes.
                </p>

                {/* Link Input */}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={shareLink}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg',
                      'bg-gray-100 dark:bg-gray-700',
                      'border border-gray-200 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  />
                  <motion.button
                    onClick={handleCopy}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'px-3 py-2 rounded-lg',
                      'transition-colors',
                      isCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    )}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>

                {/* Copy Success Message */}
                <AnimatePresence>
                  {isCopied && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-green-500 mt-2"
                    >
                      Link copied to clipboard!
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Regenerate Option */}
                <button
                  onClick={handleGenerateLink}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-3"
                >
                  Generate new link
                </button>
              </div>
            ) : null}

            {/* What's included info */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                <strong>Includes:</strong> Timeline, properties, events, sticky notes
                {variant === 'analysis' && ', CGT analysis results'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Part 5: Integration Points

### 5.1 Update Timeline.tsx

Add the sticky notes layer and share button to the main timeline component:

```typescript
// In Timeline.tsx
import StickyNotesLayer from './sticky-notes/StickyNotesLayer';
import ShareLinkButton from './ShareLinkButton';
import AddStickyNoteButton from './sticky-notes/AddStickyNoteButton';

// Inside the Timeline component:
// 1. Add ShareLinkButton to the toolbar (next to existing controls)
// 2. Add AddStickyNoteButton to the toolbar
// 3. Wrap the timeline content with StickyNotesLayer
// 4. Pass the dateToPixelX and pixelXToDate conversion functions to StickyNotesLayer
// 5. Pass isReadOnly={true} when viewing a shared link

// Example toolbar integration:
<div className="timeline-toolbar flex items-center gap-2">
  {/* Existing controls */}
  <ZoomControls />
  <ViewModeToggle />

  {/* New controls */}
  <AddStickyNoteButton
    onClick={() => {/* Add note at center of visible area */}}
    context="timeline"
  />
  <ShareLinkButton variant="toolbar" />
</div>

// Example layer integration:
<div className="timeline-content relative" ref={timelineContainerRef}>
  {/* Existing timeline rendering */}
  <PropertyBranches />
  <Events />

  {/* Sticky notes overlay */}
  <StickyNotesLayer
    dateToPixelX={dateToPixelX}
    pixelXToDate={pixelXToDate}
    containerRef={timelineContainerRef}
    isReadOnly={isSharedView}
  />
</div>
```

### 5.2 Update CGTAnalysisDisplay.tsx

Add sticky notes and share capability to the analysis view:

```typescript
// In CGTAnalysisDisplay.tsx or the parent analysis container
import AnalysisStickyNotesLayer from './sticky-notes/AnalysisStickyNotesLayer';
import ShareLinkButton from './ShareLinkButton';
import AddStickyNoteButton from './sticky-notes/AddStickyNoteButton';

// Add data attributes to sections for sticky note positioning:
<div data-sticky-section="summary">
  <AnalysisSummary />
</div>

<div data-sticky-section="property-card" data-sticky-element={property.id}>
  <PropertyAnalysisCard property={property} />
</div>

<div data-sticky-section="calculation-breakdown" data-sticky-element={property.id}>
  <CalculationBreakdown property={property} />
</div>

<div data-sticky-section="detailed-report">
  <DetailedReport />
</div>

// Add the layer and controls:
<div className="analysis-container relative" ref={analysisContainerRef}>
  {/* Analysis header with share button */}
  <div className="analysis-header flex items-center justify-between">
    <h2>CGT Analysis Results</h2>
    <div className="flex items-center gap-2">
      <AddStickyNoteButton context="analysis" onClick={handleAddNote} />
      <ShareLinkButton variant="analysis" />
    </div>
  </div>

  {/* Analysis content */}
  <div className="analysis-content">
    {/* ... existing analysis sections with data attributes ... */}
  </div>

  {/* Sticky notes overlay */}
  <AnalysisStickyNotesLayer
    containerRef={analysisContainerRef}
    isReadOnly={isSharedView}
  />
</div>
```

### 5.3 Update API Endpoints

Update `/api/timeline/save/route.ts` to handle the new data structure:

```typescript
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { ShareableTimelineData } from '@/types/sticky-note';

export async function POST(request: NextRequest) {
  try {
    const data: ShareableTimelineData = await request.json();

    // Validate required fields
    if (!data.properties || !Array.isArray(data.properties)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Ensure version is set
    data.version = data.version || '2.0.0';
    data.createdAt = data.createdAt || new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    // Generate unique ID
    const id = nanoid(10);

    // Store in KV with 30-day expiration
    await kv.set(`timeline:${id}`, JSON.stringify(data), {
      ex: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Error saving timeline:', error);
    return NextResponse.json(
      { error: 'Failed to save timeline' },
      { status: 500 }
    );
  }
}
```

Update `/api/timeline/load/route.ts`:

```typescript
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { ShareableTimelineData } from '@/types/sticky-note';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing timeline ID' },
        { status: 400 }
      );
    }

    const data = await kv.get<string>(`timeline:${id}`);

    if (!data) {
      return NextResponse.json(
        { error: 'Timeline not found or expired' },
        { status: 404 }
      );
    }

    const parsed: ShareableTimelineData = typeof data === 'string'
      ? JSON.parse(data)
      : data;

    // Handle backwards compatibility for older versions
    if (!parsed.version || parsed.version < '2.0.0') {
      parsed.timelineStickyNotes = parsed.timelineStickyNotes || [];
      parsed.version = '2.0.0';
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error loading timeline:', error);
    return NextResponse.json(
      { error: 'Failed to load timeline' },
      { status: 500 }
    );
  }
}
```

### 5.4 Update page.tsx to Handle Shared Data

In the main page component, update the shared link loading logic:

```typescript
// In page.tsx or the main timeline container
useEffect(() => {
  const loadSharedTimeline = async () => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');

    if (shareId) {
      setIsSharedView(true);
      setIsLoading(true);

      try {
        const response = await fetch(`/api/timeline/load?id=${shareId}`);
        const data: ShareableTimelineData = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Import all data including sticky notes and analysis
        importShareableData(data);

        // If analysis was saved, show the analysis view
        if (data.savedAnalysis) {
          setShowAnalysis(true);
        }
      } catch (error) {
        console.error('Failed to load shared timeline:', error);
        // Show error toast
      } finally {
        setIsLoading(false);
      }
    }
  };

  loadSharedTimeline();
}, []);
```

---

## Part 6: Styling & Dark Mode

### 6.1 Tailwind Config Updates

Ensure these colors are available in your Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        sticky: {
          yellow: { light: '#FEF3C7', DEFAULT: '#FDE68A', dark: '#F59E0B' },
          pink: { light: '#FCE7F3', DEFAULT: '#F9A8D4', dark: '#EC4899' },
          blue: { light: '#DBEAFE', DEFAULT: '#93C5FD', dark: '#3B82F6' },
          green: { light: '#D1FAE5', DEFAULT: '#6EE7B7', dark: '#10B981' },
          purple: { light: '#EDE9FE', DEFAULT: '#C4B5FD', dark: '#8B5CF6' },
          orange: { light: '#FFEDD5', DEFAULT: '#FDBA74', dark: '#F97316' },
        },
      },
    },
  },
};
```

---

## Part 7: Testing Considerations

### 7.1 Unit Tests

Write tests for:
- Sticky note CRUD operations in the store
- Position calculations for timeline notes
- Position calculations for analysis notes
- Share link generation and loading
- Backwards compatibility with older share links

### 7.2 Integration Tests

Test these workflows:
1. Create sticky note on timeline → Save → Share → Load → Note appears in correct position
2. Run analysis → Add sticky notes to analysis → Share → Load → Analysis and notes preserved
3. Drag sticky note to new position → Position updates correctly
4. Edit sticky note content → Content saves
5. Delete sticky note → Note removed
6. Change note color → Color updates
7. Minimize/maximize note → State persists

### 7.3 Edge Cases

- Notes at extreme zoom levels (ensure they scale/position correctly)
- Many notes (performance testing)
- Notes near timeline edges
- Notes on collapsed/expanded property lanes
- Notes when analysis sections are expanded/collapsed

---

## Part 8: Implementation Order

### Phase 1: Data Layer (Day 1)
1. Create `src/types/sticky-note.ts`
2. Update Zustand store with sticky notes state and methods
3. Update serialization/deserialization logic
4. Update API endpoints for new data structure

### Phase 2: Timeline Sticky Notes (Day 2)
1. Create `StickyNote.tsx` component
2. Create `StickyNotesLayer.tsx` for timeline
3. Integrate with Timeline.tsx
4. Test create, edit, delete, move on timeline

### Phase 3: Analysis Sticky Notes (Day 3)
1. Create `AnalysisStickyNotesLayer.tsx`
2. Add data-sticky-section attributes to analysis components
3. Integrate with CGTAnalysisDisplay.tsx
4. Test create, edit, delete, move on analysis

### Phase 4: Share Features (Day 4)
1. Create `ShareLinkButton.tsx` component
2. Add to timeline toolbar
3. Add to analysis view
4. Test full share flow with sticky notes and analysis

### Phase 5: Polish & Testing (Day 5)
1. Dark mode styling verification
2. Mobile responsiveness
3. Edge case handling
4. Performance optimization
5. Final testing

---

## Summary

This implementation creates a comprehensive sticky notes system with:

1. **Flexible positioning** - Notes anchor to dates on timeline or relative positions in analysis
2. **Full persistence** - All notes save with their exact positions
3. **Analysis saving** - Complete analysis results can be saved and shared
4. **Quick sharing** - One-click share from toolbar with copy functionality
5. **Rich features** - Color options, minimize/maximize, drag to reposition
6. **Backwards compatible** - Old share links still work
7. **Dark mode support** - Full theming for all components
8. **Type-safe** - Full TypeScript coverage

The system integrates seamlessly with the existing codebase architecture and follows established patterns for state management, styling, and component structure.
