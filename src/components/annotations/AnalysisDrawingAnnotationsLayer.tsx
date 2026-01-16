'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import DrawingAnnotation from './DrawingAnnotation';
import DrawingCanvas from './DrawingCanvas';
import {
  DrawingAnnotation as DrawingAnnotationType,
  DrawingPoint,
  AnalysisDrawingPosition,
  isAnalysisDrawingPosition,
  calculatePathBounds,
} from '@/types/drawing-annotation';
import { AnalysisNotePosition, DEFAULT_STICKY_NOTE_COLOR } from '@/types/sticky-note';

interface AnalysisDrawingAnnotationsLayerProps {
  /** The analysis container element for position calculations */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the view is read-only (shared link) */
  isReadOnly?: boolean;
}

/**
 * AnalysisDrawingAnnotationsLayer - Manages drawing annotations on the CGT Analysis view
 *
 * Renders:
 * - DrawingCanvas for creating new drawings (when drawing mode is active)
 * - All existing DrawingAnnotations with their notes
 *
 * Drawings are STATIC and cannot be moved. Only notes can be dragged.
 * Uses section-based positioning (similar to analysis sticky notes).
 */
export default function AnalysisDrawingAnnotationsLayer({
  containerRef,
  isReadOnly = false,
}: AnalysisDrawingAnnotationsLayerProps) {
  const {
    analysisDrawingAnnotations,
    addAnalysisDrawingAnnotation,
    updateAnalysisDrawingAnnotation,
    deleteAnalysisDrawingAnnotation,
    moveAnalysisDrawingAnnotationNote,
    isDrawingMode,
    currentDrawingStroke,
    setDrawingMode,
  } = useTimelineStore();

  const [sectionRects, setSectionRects] = useState<Map<string, DOMRect>>(new Map());

  // Update section positions periodically and on scroll/resize
  useEffect(() => {
    const updateSectionRects = () => {
      const container = containerRef.current;
      if (!container) return;

      const newRects = new Map<string, DOMRect>();

      // Find all sections with data-sticky-section attribute
      const sections = container.querySelectorAll('[data-sticky-section]');
      sections.forEach((section) => {
        const sectionType = section.getAttribute('data-sticky-section');
        const elementId = section.getAttribute('data-sticky-element');
        const key = elementId ? `${sectionType}-${elementId}` : sectionType || '';
        if (key) {
          newRects.set(key, section.getBoundingClientRect());
        }
      });

      setSectionRects(newRects);
    };

    // Initial update
    updateSectionRects();

    // Set up observers
    const container = containerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(updateSectionRects);
      resizeObserver.observe(container);

      // Listen for scroll events
      container.addEventListener('scroll', updateSectionRects);
      window.addEventListener('scroll', updateSectionRects);
      window.addEventListener('resize', updateSectionRects);

      // Periodic update to catch dynamic content changes
      const interval = setInterval(updateSectionRects, 1000);

      return () => {
        resizeObserver.disconnect();
        container.removeEventListener('scroll', updateSectionRects);
        window.removeEventListener('scroll', updateSectionRects);
        window.removeEventListener('resize', updateSectionRects);
        clearInterval(interval);
      };
    }
  }, [containerRef]);

  // Get pixel position for drawing based on section
  const getDrawingStyle = useCallback(
    (position: AnalysisDrawingPosition): React.CSSProperties | null => {
      const key = position.elementId
        ? `${position.section}-${position.elementId}`
        : position.section;
      const sectionRect = sectionRects.get(key);

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return null;

      // If no section rect found, use general positioning relative to container
      if (!sectionRect) {
        const left = containerRect.width * position.relativeX / 100;
        const top = containerRect.height * position.relativeY / 100;

        return {
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
        };
      }

      // Calculate position relative to the container
      const left = sectionRect.left - containerRect.left + (sectionRect.width * position.relativeX / 100);
      const top = sectionRect.top - containerRect.top + (sectionRect.height * position.relativeY / 100);

      return {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
      };
    },
    [sectionRects, containerRef]
  );

  // Get pixel position for note based on section
  const getNoteStyle = useCallback(
    (position: AnalysisNotePosition): React.CSSProperties | null => {
      const key = position.elementId
        ? `${position.section}-${position.elementId}`
        : position.section;
      const sectionRect = sectionRects.get(key);

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return null;

      if (!sectionRect) {
        const left = containerRect.width * position.relativeX / 100;
        const top = containerRect.height * position.relativeY / 100;

        return {
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          transform: 'translate(-50%, -50%)',
        };
      }

      const left = sectionRect.left - containerRect.left + (sectionRect.width * position.relativeX / 100);
      const top = sectionRect.top - containerRect.top + (sectionRect.height * position.relativeY / 100);

      return {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translate(-50%, -50%)',
      };
    },
    [sectionRects, containerRef]
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

      const containerRect = container.getBoundingClientRect();

      // Find which section the drawing started in
      const elementsAtPoint = document.elementsFromPoint(startClientX, startClientY);
      const section = elementsAtPoint.find((el) => el.hasAttribute('data-sticky-section'));

      let drawingPosition: AnalysisDrawingPosition;
      let notePosition: AnalysisNotePosition;

      if (section) {
        const sectionType = section.getAttribute('data-sticky-section') as AnalysisDrawingPosition['section'];
        const elementId = section.getAttribute('data-sticky-element') || undefined;
        const sectionRect = section.getBoundingClientRect();

        // Calculate relative position within section
        const relativeX = ((startClientX - sectionRect.left) / sectionRect.width) * 100;
        const relativeY = ((startClientY - sectionRect.top) / sectionRect.height) * 100;

        drawingPosition = {
          section: sectionType,
          elementId,
          relativeX: Math.max(5, Math.min(95, relativeX)),
          relativeY: Math.max(5, Math.min(95, relativeY)),
        };

        // Position note to the right of drawing
        const pathBounds = calculatePathBounds(path);
        const noteOffsetX = pathBounds.maxX + 30;
        const noteOffsetY = (pathBounds.minY + pathBounds.maxY) / 2;

        // Calculate note position relative to section
        const noteRelativeX = ((startClientX - sectionRect.left + noteOffsetX) / sectionRect.width) * 100;
        const noteRelativeY = ((startClientY - sectionRect.top + noteOffsetY) / sectionRect.height) * 100;

        notePosition = {
          section: sectionType,
          elementId,
          relativeX: Math.max(5, Math.min(95, noteRelativeX)),
          relativeY: Math.max(5, Math.min(95, noteRelativeY)),
        };
      } else {
        // Fallback to general positioning relative to container
        const relativeX = ((startClientX - containerRect.left) / containerRect.width) * 100;
        const relativeY = ((startClientY - containerRect.top) / containerRect.height) * 100;

        drawingPosition = {
          section: 'general',
          relativeX: Math.max(5, Math.min(95, relativeX)),
          relativeY: Math.max(5, Math.min(95, relativeY)),
        };

        const pathBounds = calculatePathBounds(path);
        const noteOffsetX = pathBounds.maxX + 30;
        const noteOffsetY = (pathBounds.minY + pathBounds.maxY) / 2;

        const noteRelativeX = ((startClientX - containerRect.left + noteOffsetX) / containerRect.width) * 100;
        const noteRelativeY = ((startClientY - containerRect.top + noteOffsetY) / containerRect.height) * 100;

        notePosition = {
          section: 'general',
          relativeX: Math.max(5, Math.min(95, noteRelativeX)),
          relativeY: Math.max(5, Math.min(95, noteRelativeY)),
        };
      }

      // Create the annotation
      addAnalysisDrawingAnnotation({
        context: 'analysis',
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

      console.log('🖊️ Created analysis drawing annotation:', {
        pathPoints: path.length,
        drawingPosition,
        notePosition,
      });
    },
    [containerRef, currentDrawingStroke, addAnalysisDrawingAnnotation, setDrawingMode]
  );

  // Handle note drag end (drawings are static, only notes can be moved)
  const handleNoteDragEnd = useCallback(
    (annotationId: string, clientX: number, clientY: number) => {
      // Find which section the note was dropped on
      const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
      const section = elementsAtPoint.find((el) => el.hasAttribute('data-sticky-section'));

      const container = containerRef.current;
      if (!container) return;

      if (!section) {
        // Dropped outside any section - use general positioning
        const containerRect = container.getBoundingClientRect();
        const relativeX = ((clientX - containerRect.left) / containerRect.width) * 100;
        const relativeY = ((clientY - containerRect.top) / containerRect.height) * 100;

        moveAnalysisDrawingAnnotationNote(annotationId, {
          section: 'general',
          relativeX: Math.max(5, Math.min(95, relativeX)),
          relativeY: Math.max(5, Math.min(95, relativeY)),
        });
        return;
      }

      const sectionType = section.getAttribute('data-sticky-section') as AnalysisNotePosition['section'];
      const elementId = section.getAttribute('data-sticky-element') || undefined;
      const rect = section.getBoundingClientRect();

      const relativeX = ((clientX - rect.left) / rect.width) * 100;
      const relativeY = ((clientY - rect.top) / rect.height) * 100;

      moveAnalysisDrawingAnnotationNote(annotationId, {
        section: sectionType,
        elementId,
        relativeX: Math.max(5, Math.min(95, relativeX)),
        relativeY: Math.max(5, Math.min(95, relativeY)),
      });
    },
    [containerRef, moveAnalysisDrawingAnnotationNote]
  );

  // Filter to only analysis annotations
  const analysisAnnotations = useMemo(
    () => analysisDrawingAnnotations.filter((ann) => ann.context === 'analysis'),
    [analysisDrawingAnnotations]
  );

  // Don't render the layer container if no annotations and not in drawing mode
  if (analysisAnnotations.length === 0 && !isDrawingMode) {
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
        className="absolute inset-0 overflow-visible"
        style={{
          pointerEvents: 'none',
          zIndex: isDrawingMode ? 99 : 45,
        }}
      >
        <AnimatePresence>
          {analysisAnnotations.map((annotation) => {
            if (!isAnalysisDrawingPosition(annotation.drawingPosition)) return null;

            const drawingPosition = annotation.drawingPosition as AnalysisDrawingPosition;
            const notePosition = annotation.note.position as AnalysisNotePosition;

            const drawingStyle = getDrawingStyle(drawingPosition);
            const noteStyle = getNoteStyle(notePosition);

            // If we can't calculate positions, don't render
            if (!drawingStyle || !noteStyle) return null;

            return (
              <div
                key={annotation.id}
                style={{ pointerEvents: 'auto' }}
              >
                <DrawingAnnotation
                  annotation={annotation}
                  onUpdate={updateAnalysisDrawingAnnotation}
                  onDelete={deleteAnalysisDrawingAnnotation}
                  onNoteDragEnd={handleNoteDragEnd}
                  drawingStyle={drawingStyle}
                  noteStyle={noteStyle}
                  isReadOnly={isReadOnly}
                />
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
