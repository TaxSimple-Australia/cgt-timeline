'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timeline';
import StickyNote from './StickyNote';
import {
  AnalysisNotePosition,
  isAnalysisPosition,
} from '@/types/sticky-note';

interface AnalysisStickyNotesLayerProps {
  /** The analysis container element for position calculations */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the view is read-only (shared link) */
  isReadOnly?: boolean;
}

/**
 * AnalysisStickyNotesLayer - Renders sticky notes on the analysis view
 *
 * IMPORTANT: This layer uses pointer-events: none on the container
 * and pointer-events: auto only on the actual notes. This ensures
 * that the analysis content underneath remains fully interactive
 * while notes can still be interacted with.
 */
export default function AnalysisStickyNotesLayer({
  containerRef,
  isReadOnly = false,
}: AnalysisStickyNotesLayerProps) {
  const {
    analysisStickyNotes,
    updateAnalysisStickyNote,
    deleteAnalysisStickyNote,
    moveAnalysisStickyNote,
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

  // Get pixel position for analysis note relative to container
  const getNoteStyle = useCallback(
    (position: AnalysisNotePosition): React.CSSProperties | null => {
      const key = position.elementId
        ? `${position.section}-${position.elementId}`
        : position.section;
      const sectionRect = sectionRects.get(key);

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return null;

      // If no section rect found, use general positioning relative to container
      if (!sectionRect) {
        // For general section or missing section, position relative to container
        const left = containerRect.width * position.relativeX / 100;
        const top = containerRect.height * position.relativeY / 100;

        return {
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          transform: 'translate(-50%, -50%)',
        };
      }

      // Calculate position relative to the container
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

  // Handle drag end - update note position
  // Uses raw clientX/clientY from native mouse events (same approach as timeline events)
  const handleDragEnd = useCallback(
    (noteId: string, clientX: number, clientY: number) => {
      // Find which section the note was dropped on
      const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
      const section = elementsAtPoint.find((el) => el.hasAttribute('data-sticky-section'));

      const container = containerRef.current;
      if (!container) return;

      if (!section) {
        // Dropped outside any section - use general positioning relative to container
        const containerRect = container.getBoundingClientRect();
        const relativeX = ((clientX - containerRect.left) / containerRect.width) * 100;
        const relativeY = ((clientY - containerRect.top) / containerRect.height) * 100;

        moveAnalysisStickyNote(noteId, {
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

      moveAnalysisStickyNote(noteId, {
        section: sectionType,
        elementId,
        relativeX: Math.max(5, Math.min(95, relativeX)),
        relativeY: Math.max(5, Math.min(95, relativeY)),
      });
    },
    [containerRef, moveAnalysisStickyNote]
  );

  // Filter to only analysis notes
  const analysisNotes = useMemo(
    () => analysisStickyNotes.filter((note) => note.context === 'analysis'),
    [analysisStickyNotes]
  );

  // Don't render anything if no notes
  if (analysisNotes.length === 0) {
    return null;
  }

  return (
    // Container with pointer-events: none - allows analysis content interactions to pass through
    <div
      className="absolute inset-0 overflow-visible"
      style={{
        pointerEvents: 'none',
        zIndex: 50, // Above content but below modals
      }}
    >
      <AnimatePresence>
        {analysisNotes.map((note) => {
          if (!isAnalysisPosition(note.position)) return null;
          const position = note.position as AnalysisNotePosition;
          const noteStyle = getNoteStyle(position);

          // If we can't calculate position, don't render
          if (!noteStyle) return null;

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
