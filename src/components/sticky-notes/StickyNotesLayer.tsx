'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import StickyNote from './StickyNote';
import StickyNoteArrow from './StickyNoteArrow';
import {
  TimelineNotePosition,
  isTimelinePosition,
  STICKY_NOTE_COLORS,
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
    toggleStickyNoteArrow,
    updateStickyNoteArrowTarget,
    timelineStart,
    timelineEnd,
  } = useTimelineStore();

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
  );
}
