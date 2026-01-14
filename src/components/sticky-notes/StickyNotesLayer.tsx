'use client';

import React, { useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import StickyNote from './StickyNote';
import {
  TimelineNotePosition,
  isTimelinePosition,
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
    timelineStart,
    timelineEnd,
  } = useTimelineStore();

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

  // Handle drag end - update note position
  // Uses raw clientX/clientY from native mouse events (same approach as timeline events)
  const handleDragEnd = useCallback(
    (noteId: string, clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // X POSITION: Convert viewport X to percentage of container width
      const xPercent = ((clientX - rect.left) / rect.width) * 100;
      const newDate = positionToDate(Math.max(0, Math.min(100, xPercent)));

      // Y POSITION: Must account for scroll and use full content height
      // clientY is a viewport coordinate from the native mouseup event

      // Step 1: Get scroll position and full content height
      const scrollTop = container.scrollTop;
      const contentHeight = container.scrollHeight; // FULL scrollable content height

      // Step 2: Convert viewport Y to content-relative Y
      // viewport Y -> container-relative Y -> content-relative Y (add scroll)
      const contentY = (clientY - rect.top) + scrollTop;

      // Step 3: Calculate offset from center of CONTENT (not viewport)
      // This matches getNoteStyle which uses calc(50% + offset) where 50% is of content
      const contentCenterY = contentHeight / 2;
      const newVerticalOffset = contentY - contentCenterY;

      console.log('📍 Sticky note drop calculation:', {
        clientX,
        clientY,
        containerTop: rect.top,
        containerLeft: rect.left,
        scrollTop,
        contentHeight,
        contentY,
        contentCenterY,
        newVerticalOffset,
        xPercent,
      });

      moveTimelineStickyNote(noteId, {
        anchorDate: newDate.toISOString(),
        verticalOffset: newVerticalOffset,
      });
    },
    [containerRef, positionToDate, moveTimelineStickyNote]
  );

  // Filter to only timeline notes
  const timelineNotes = useMemo(
    () => timelineStickyNotes.filter((note) => note.context === 'timeline'),
    [timelineStickyNotes]
  );

  // Don't render anything if no notes
  if (timelineNotes.length === 0) {
    return null;
  }

  return (
    // Container with pointer-events: none - allows timeline interactions to pass through
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        pointerEvents: 'none',
        zIndex: 50, // Above timeline events but below modals
      }}
    >
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
                isReadOnly={isReadOnly}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
