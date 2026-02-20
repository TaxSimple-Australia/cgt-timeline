'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StickyNote as StickyNoteIcon, Plus } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import StickyNote from './StickyNote';
import StickyNoteArrow from './StickyNoteArrow';
import {
  TimelineNotePosition,
  isTimelinePosition,
  STICKY_NOTE_COLORS,
  DEFAULT_STICKY_NOTE_COLOR,
} from '@/types/sticky-note';

interface StickyNotesLayerProps {
  /** The timeline container element for position calculations */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the view is read-only (shared link) */
  isReadOnly?: boolean;
}

/**
 * StickyNotesLayer - Renders sticky notes on the timeline
 *
 * IMPORTANT: This layer uses pointer-events: none on the container
 * and pointer-events: auto only on the actual notes. This ensures
 * that the timeline underneath remains fully interactive (clicking,
 * hovering on events, etc.) while notes can still be interacted with.
 *
 * POSITIONING: Notes are positioned using:
 * - X: percentage of container width (based on date)
 * - Y: calc(50% + verticalOffset) where 50% is of the FULL SCROLLABLE CONTENT height
 *
 * When calculating drop position, we must:
 * 1. Account for scroll position (scrollTop)
 * 2. Use scrollHeight (full content) not clientHeight (visible viewport)
 */
export default function StickyNotesLayer({
  containerRef,
  isReadOnly = false,
}: StickyNotesLayerProps) {
  const {
    timelineStickyNotes,
    updateTimelineStickyNote,
    deleteTimelineStickyNote,
    moveTimelineStickyNote,
    addTimelineStickyNote,
    toggleStickyNoteArrow,
    updateStickyNoteArrowTarget,
    timelineStart,
    timelineEnd,
  } = useTimelineStore();

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Track container dimensions for SVG viewBox
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDims = () => {
      setContainerDims({
        width: container.scrollWidth,
        height: container.scrollHeight,
      });
    };

    updateDims();

    const observer = new ResizeObserver(updateDims);
    observer.observe(container);

    // Also update on scroll (scrollHeight may change)
    container.addEventListener('scroll', updateDims);

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', updateDims);
    };
  }, [containerRef]);

  // Attach right-click handler to the container element directly
  useEffect(() => {
    if (isReadOnly) return;
    const container = containerRef.current;
    if (!container) return;

    const onContextMenu = (e: MouseEvent) => {
      // Don't show context menu if right-clicking on a sticky note itself
      const target = e.target as HTMLElement;
      if (target.closest('[data-sticky-note]')) return;

      e.preventDefault();
      const containerRect = container.getBoundingClientRect();
      setContextMenu({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    };

    container.addEventListener('contextmenu', onContextMenu);
    return () => {
      container.removeEventListener('contextmenu', onContextMenu);
    };
  }, [isReadOnly, containerRef]);

  // Close context menu on click-away or Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickAway = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  // Convert a date to X position (percentage of timeline width)
  const dateToPosition = useCallback(
    (date: Date): number => {
      const totalRange = timelineEnd.getTime() - timelineStart.getTime();
      const dateOffset = date.getTime() - timelineStart.getTime();
      return (dateOffset / totalRange) * 100;
    },
    [timelineStart, timelineEnd]
  );

  // Convert X position (percentage) to a date
  const positionToDate = useCallback(
    (position: number): Date => {
      const totalRange = timelineEnd.getTime() - timelineStart.getTime();
      const dateTime = timelineStart.getTime() + (position / 100) * totalRange;
      return new Date(dateTime);
    },
    [timelineStart, timelineEnd]
  );

  // Convert anchor position to pixel coordinates
  const getPixelPosition = useCallback(
    (anchorDate: string, verticalOffset: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const xPercent = dateToPosition(new Date(anchorDate));
      const x = (xPercent / 100) * container.scrollWidth;
      const y = container.scrollHeight / 2 + verticalOffset;
      return { x, y };
    },
    [dateToPosition, containerRef]
  );

  // Calculate pixel position for a sticky note
  // Uses percentage for X and calc(50% + offset) for Y
  // The 50% is relative to the full scrollable content height
  const getNoteStyle = useCallback(
    (position: TimelineNotePosition): React.CSSProperties => {
      const xPercent = dateToPosition(new Date(position.anchorDate));

      return {
        position: 'absolute',
        left: `${xPercent}%`,
        top: `calc(50% + ${position.verticalOffset}px)`,
        transform: 'translate(-50%, -50%)',
      };
    },
    [dateToPosition]
  );

  // Convert clientX/clientY to anchorDate + verticalOffset
  const clientToTimelinePosition = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      // Account for scrollLeft: convert client coords to content-relative coords,
      // then divide by scrollWidth (full content width, not viewport width).
      // This matches how getPixelPosition/getNoteStyle use scrollWidth for rendering.
      const scrollLeft = container.scrollLeft;
      const contentX = (clientX - rect.left) + scrollLeft;
      const xPercent = (contentX / container.scrollWidth) * 100;
      const newDate = positionToDate(Math.max(0, Math.min(100, xPercent)));

      const scrollTop = container.scrollTop;
      const contentHeight = container.scrollHeight;
      const contentY = (clientY - rect.top) + scrollTop;
      const contentCenterY = contentHeight / 2;
      const verticalOffset = contentY - contentCenterY;

      return { anchorDate: newDate.toISOString(), verticalOffset };
    },
    [containerRef, positionToDate]
  );

  // Handle drag end - update note position
  const handleDragEnd = useCallback(
    (noteId: string, clientX: number, clientY: number) => {
      const pos = clientToTimelinePosition(clientX, clientY);
      if (!pos) return;

      console.log('📍 Sticky note drop calculation:', pos);
      moveTimelineStickyNote(noteId, pos);
    },
    [clientToTimelinePosition, moveTimelineStickyNote]
  );

  // Handle arrow drag end - update arrow target position
  const handleArrowDragEnd = useCallback(
    (noteId: string, clientX: number, clientY: number) => {
      const pos = clientToTimelinePosition(clientX, clientY);
      if (!pos) return;

      updateStickyNoteArrowTarget(noteId, pos);
    },
    [clientToTimelinePosition, updateStickyNoteArrowTarget]
  );

  // Add note at context menu position
  const handleAddNoteAtPosition = useCallback(() => {
    if (!contextMenu) return;
    const pos = clientToTimelinePosition(contextMenu.clientX, contextMenu.clientY);
    if (!pos) return;

    addTimelineStickyNote({
      content: '',
      color: DEFAULT_STICKY_NOTE_COLOR,
      context: 'timeline',
      position: { anchorDate: pos.anchorDate, verticalOffset: pos.verticalOffset },
      isMinimized: false,
      zIndex: 1000 + timelineStickyNotes.length,
    });
    setContextMenu(null);
  }, [contextMenu, clientToTimelinePosition, addTimelineStickyNote, timelineStickyNotes.length]);

  // Filter to only timeline notes
  const timelineNotes = useMemo(
    () => timelineStickyNotes.filter((note) => note.context === 'timeline'),
    [timelineStickyNotes]
  );

  // Notes with active arrows
  const notesWithArrows = useMemo(
    () => timelineNotes.filter(
      (note) => note.arrow?.enabled && isTimelinePosition(note.position)
    ),
    [timelineNotes]
  );

  return (
    <>
      {/* Context menu popup */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-[9999]"
          style={{ left: contextMenu.clientX, top: contextMenu.clientY }}
        >
          <button
            onClick={handleAddNoteAtPosition}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 w-full text-left transition-colors"
          >
            <div className="relative">
              <StickyNoteIcon className="w-4 h-4 text-amber-600" />
              <Plus className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-amber-600" />
            </div>
            Add Note Here
          </button>
        </div>
      )}

      {/* Container with pointer-events: none - allows timeline interactions to pass through */}
      {timelineNotes.length > 0 && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            pointerEvents: 'none',
            zIndex: 50, // Above timeline events but below modals
          }}
        >
          {/* Arrow SVG layer - behind notes */}
          {notesWithArrows.length > 0 && containerDims.width > 0 && (
            <svg
              className="absolute inset-0"
              width={containerDims.width}
              height={containerDims.height}
              style={{ pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}
            >
              {notesWithArrows.map((note) => {
                const position = note.position as TimelineNotePosition;
                const notePos = getPixelPosition(position.anchorDate, position.verticalOffset);
                const targetPos = getPixelPosition(
                  note.arrow!.target.anchorDate,
                  note.arrow!.target.verticalOffset
                );
                return (
                  <StickyNoteArrow
                    key={`arrow-${note.id}`}
                    noteId={note.id}
                    noteX={notePos.x}
                    noteY={notePos.y}
                    targetX={targetPos.x}
                    targetY={targetPos.y}
                    color={STICKY_NOTE_COLORS[note.color].border}
                    isMinimized={!!note.isMinimized}
                    isReadOnly={isReadOnly}
                    onArrowDragEnd={handleArrowDragEnd}
                  />
                );
              })}
            </svg>
          )}

          {/* Notes layer */}
          <AnimatePresence>
            {timelineNotes.map((note) => {
              if (!isTimelinePosition(note.position)) return null;
              const position = note.position as TimelineNotePosition;
              const noteStyle = getNoteStyle(position);

              return (
                // Each note wrapper has pointer-events: auto - can be interacted with
                <div
                  key={note.id}
                  style={{
                    ...noteStyle,
                    pointerEvents: 'auto', // Only the note itself captures events
                  }}
                >
                  <StickyNote
                    note={note}
                    onUpdate={updateTimelineStickyNote}
                    onDelete={deleteTimelineStickyNote}
                    onDragEnd={handleDragEnd}
                    onToggleArrow={toggleStickyNoteArrow}
                    isReadOnly={isReadOnly}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
