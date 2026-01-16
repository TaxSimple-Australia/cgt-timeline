'use client';

import React, { useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import DrawingAnnotation from './DrawingAnnotation';
import DrawingCanvas from './DrawingCanvas';
import {
  DrawingAnnotation as DrawingAnnotationType,
  DrawingPoint,
  TimelineDrawingPosition,
  isTimelineDrawingPosition,
  calculatePathBounds,
} from '@/types/drawing-annotation';
import { TimelineNotePosition, DEFAULT_STICKY_NOTE_COLOR } from '@/types/sticky-note';

interface DrawingAnnotationsLayerProps {
  /** The timeline container element for position calculations */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the view is read-only (shared link) */
  isReadOnly?: boolean;
}

/**
 * DrawingAnnotationsLayer - Manages all drawing annotations on the timeline
 *
 * Renders:
 * - DrawingCanvas for creating new drawings (when drawing mode is active)
 * - All existing DrawingAnnotations with their notes
 *
 * Drawings are STATIC and cannot be moved. Only notes can be dragged.
 */
export default function DrawingAnnotationsLayer({
  containerRef,
  isReadOnly = false,
}: DrawingAnnotationsLayerProps) {
  const {
    timelineDrawingAnnotations,
    addTimelineDrawingAnnotation,
    updateTimelineDrawingAnnotation,
    deleteTimelineDrawingAnnotation,
    moveTimelineDrawingAnnotationNote,
    isDrawingMode,
    currentDrawingStroke,
    setDrawingMode,
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

  // Calculate pixel position for a drawing annotation
  const getDrawingStyle = useCallback(
    (position: TimelineDrawingPosition): React.CSSProperties => {
      const xPercent = dateToPosition(new Date(position.anchorDate));

      return {
        position: 'absolute',
        left: `${xPercent}%`,
        top: `calc(50% + ${position.verticalOffset}px)`,
        // No transform - the SVG handles its own positioning
      };
    },
    [dateToPosition]
  );

  // Calculate pixel position for a note
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

  // Handle drawing completion from canvas
  const handleDrawingComplete = useCallback(
    (
      path: DrawingPoint[],
      anchorX: number,
      anchorY: number,
      startClientX: number,
      startClientY: number
    ) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const contentHeight = container.scrollHeight;

      // Calculate drawing anchor position (where user started drawing)
      const xPercent = (anchorX / rect.width) * 100;
      const anchorDate = positionToDate(Math.max(0, Math.min(100, xPercent)));

      // Calculate vertical offset from content center
      const contentY = anchorY + scrollTop;
      const contentCenterY = contentHeight / 2;
      const verticalOffset = contentY - contentCenterY;

      // Calculate note position - place it very close to the drawing
      // Use path bounds to position note just to the right of the drawing
      const pathBounds = calculatePathBounds(path);

      // Position note just 30px to the right of the drawing's right edge
      // and vertically centered with the drawing
      const noteOffsetX = pathBounds.maxX + 30;
      const noteOffsetY = (pathBounds.minY + pathBounds.maxY) / 2; // vertical center of drawing

      // Position the note relative to the anchor (where drawing started)
      const noteAnchorX = anchorX + noteOffsetX;
      const noteXPercent = (noteAnchorX / rect.width) * 100;
      const noteDate = positionToDate(Math.max(0, Math.min(100, noteXPercent)));
      const noteVerticalOffset = verticalOffset + noteOffsetY;

      const drawingPosition: TimelineDrawingPosition = {
        anchorDate: anchorDate.toISOString(),
        verticalOffset,
      };

      const notePosition: TimelineNotePosition = {
        anchorDate: noteDate.toISOString(),
        verticalOffset: noteVerticalOffset,
      };

      // Create the annotation
      addTimelineDrawingAnnotation({
        context: 'timeline',
        path,
        stroke: { ...currentDrawingStroke },
        drawingPosition,
        note: {
          content: '',
          color: DEFAULT_STICKY_NOTE_COLOR,
          position: notePosition,
          isMinimized: false,
        },
        zIndex: 1000,
      });

      // Turn off drawing mode after creating annotation
      setDrawingMode(false);

      console.log('🖊️ Created drawing annotation:', {
        pathPoints: path.length,
        drawingPosition,
        notePosition,
      });
    },
    [containerRef, positionToDate, currentDrawingStroke, addTimelineDrawingAnnotation, setDrawingMode]
  );

  // Handle note drag end (drawings are static, only notes can be moved)
  const handleNoteDragEnd = useCallback(
    (annotationId: string, clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const contentHeight = container.scrollHeight;

      const xPercent = ((clientX - rect.left) / rect.width) * 100;
      const newDate = positionToDate(Math.max(0, Math.min(100, xPercent)));

      const contentY = (clientY - rect.top) + scrollTop;
      const contentCenterY = contentHeight / 2;
      const newVerticalOffset = contentY - contentCenterY;

      moveTimelineDrawingAnnotationNote(annotationId, {
        anchorDate: newDate.toISOString(),
        verticalOffset: newVerticalOffset,
      });
    },
    [containerRef, positionToDate, moveTimelineDrawingAnnotationNote]
  );

  // Filter to only timeline annotations
  const timelineAnnotations = useMemo(
    () => timelineDrawingAnnotations.filter((ann) => ann.context === 'timeline'),
    [timelineDrawingAnnotations]
  );

  // Don't render the layer container if no annotations and not in drawing mode
  if (timelineAnnotations.length === 0 && !isDrawingMode) {
    return null;
  }

  return (
    <>
      {/* Drawing Canvas (only when drawing mode is active) */}
      {isDrawingMode && !isReadOnly && (
        <DrawingCanvas
          isActive={isDrawingMode}
          stroke={currentDrawingStroke}
          onDrawingComplete={handleDrawingComplete}
          containerRef={containerRef}
        />
      )}

      {/* Annotations Layer - drawings are static, only notes are interactive */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          pointerEvents: 'none',
          zIndex: isDrawingMode ? 99 : 45,
        }}
      >
        <AnimatePresence>
          {timelineAnnotations.map((annotation) => {
            if (!isTimelineDrawingPosition(annotation.drawingPosition)) return null;

            const drawingPosition = annotation.drawingPosition as TimelineDrawingPosition;
            const notePosition = annotation.note.position as TimelineNotePosition;

            const drawingStyle = getDrawingStyle(drawingPosition);
            const noteStyle = getNoteStyle(notePosition);

            return (
              <DrawingAnnotation
                key={annotation.id}
                annotation={annotation}
                onUpdate={updateTimelineDrawingAnnotation}
                onDelete={deleteTimelineDrawingAnnotation}
                onNoteDragEnd={handleNoteDragEnd}
                drawingStyle={drawingStyle}
                noteStyle={noteStyle}
                isReadOnly={isReadOnly}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
