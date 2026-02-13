'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StickyNote as StickyNoteIcon, Plus } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import StickyNote from './StickyNote';
import StickyNoteArrow from './StickyNoteArrow';
import {
  AnalysisNotePosition,
  isAnalysisPosition,
  STICKY_NOTE_COLORS,
  DEFAULT_STICKY_NOTE_COLOR,
  AnalysisArrowTarget,
} from '@/types/sticky-note';

interface AnalysisStickyNotesLayerProps {
  /** The analysis container element for position calculations */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the view is read-only (shared link) */
  isReadOnly?: boolean;
}

/**
 * AnalysisStickyNotesLayer - Renders sticky notes and arrows on the analysis view
 *
 * IMPORTANT: This layer uses pointer-events: none on the container
 * and pointer-events: auto only on the actual notes. This ensures
 * that the analysis content underneath remains fully interactive
 * while notes can still be interacted with.
 *
 * Features:
 * - Sticky notes with drag repositioning
 * - Arrow callouts from notes to targets
 * - Right-click context menu to add notes at cursor position
 * - Floating add-note button (bottom-right)
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
    addAnalysisStickyNote,
    toggleAnalysisStickyNoteArrow,
    updateAnalysisStickyNoteArrowTarget,
  } = useTimelineStore();

  const [sectionRects, setSectionRects] = useState<Map<string, DOMRect>>(new Map());
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Find the scroll parent of the container (the overflow-y-auto element)
  const getScrollParent = useCallback((el: HTMLElement): HTMLElement => {
    let parent = el.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') return parent;
      parent = parent.parentElement;
    }
    return document.documentElement;
  }, []);

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

      // Also update container dimensions
      setContainerDims({
        width: container.scrollWidth,
        height: container.scrollHeight,
      });
    };

    // Initial update
    updateSectionRects();

    // Set up observers
    const container = containerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(updateSectionRects);
      resizeObserver.observe(container);

      // Listen for scroll events on the scroll parent too
      const scrollParent = getScrollParent(container);
      container.addEventListener('scroll', updateSectionRects);
      if (scrollParent !== document.documentElement) {
        scrollParent.addEventListener('scroll', updateSectionRects);
      }
      window.addEventListener('scroll', updateSectionRects);
      window.addEventListener('resize', updateSectionRects);

      // Periodic update to catch dynamic content changes
      const interval = setInterval(updateSectionRects, 1000);

      return () => {
        resizeObserver.disconnect();
        container.removeEventListener('scroll', updateSectionRects);
        if (scrollParent !== document.documentElement) {
          scrollParent.removeEventListener('scroll', updateSectionRects);
        }
        window.removeEventListener('scroll', updateSectionRects);
        window.removeEventListener('resize', updateSectionRects);
        clearInterval(interval);
      };
    }
  }, [containerRef, getScrollParent]);

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

  // Get pixel position for an analysis arrow target
  const getArrowTargetPixelPos = useCallback(
    (target: AnalysisArrowTarget): { x: number; y: number } | null => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return null;

      // If the target has a section, try to use that section's rect
      if (target.section) {
        const key = target.elementId
          ? `${target.section}-${target.elementId}`
          : target.section;
        const sectionRect = sectionRects.get(key);
        if (sectionRect) {
          return {
            x: sectionRect.left - containerRect.left + (sectionRect.width * target.relativeX / 100),
            y: sectionRect.top - containerRect.top + (sectionRect.height * target.relativeY / 100),
          };
        }
      }

      // Fallback: position relative to container
      return {
        x: containerRect.width * target.relativeX / 100,
        y: containerRect.height * target.relativeY / 100,
      };
    },
    [sectionRects, containerRef]
  );

  // Get pixel position for a note (for arrow start point)
  const getNotePixelPos = useCallback(
    (position: AnalysisNotePosition): { x: number; y: number } | null => {
      const style = getNoteStyle(position);
      if (!style || !style.left || !style.top) return null;
      return {
        x: parseFloat(style.left as string),
        y: parseFloat(style.top as string),
      };
    },
    [getNoteStyle]
  );

  // Handle drag end - update note position
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

  // Handle arrow drag end - update arrow target position
  const handleArrowDragEnd = useCallback(
    (noteId: string, clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      // Check if dropped on a specific section
      const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
      const section = elementsAtPoint.find((el) => el.hasAttribute('data-sticky-section'));

      if (section) {
        const sectionType = section.getAttribute('data-sticky-section') as AnalysisNotePosition['section'];
        const elementId = section.getAttribute('data-sticky-element') || undefined;
        const rect = section.getBoundingClientRect();

        updateAnalysisStickyNoteArrowTarget(noteId, {
          relativeX: Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)),
          relativeY: Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100)),
          section: sectionType,
          elementId,
        });
      } else {
        // Fallback: position relative to container
        const containerRect = container.getBoundingClientRect();
        updateAnalysisStickyNoteArrowTarget(noteId, {
          relativeX: Math.max(2, Math.min(98, ((clientX - containerRect.left) / containerRect.width) * 100)),
          relativeY: Math.max(2, Math.min(98, ((clientY - containerRect.top) / containerRect.height) * 100)),
        });
      }
    },
    [containerRef, updateAnalysisStickyNoteArrowTarget]
  );

  // Add note at context menu position
  const handleAddNoteAtPosition = useCallback(() => {
    if (!contextMenu) return;
    const container = containerRef.current;
    if (!container) return;

    // Determine which section was right-clicked
    const elementsAtPoint = document.elementsFromPoint(contextMenu.clientX, contextMenu.clientY);
    const section = elementsAtPoint.find((el) => el.hasAttribute('data-sticky-section'));

    let position: AnalysisNotePosition;

    if (section) {
      const sectionType = section.getAttribute('data-sticky-section') as AnalysisNotePosition['section'];
      const elementId = section.getAttribute('data-sticky-element') || undefined;
      const rect = section.getBoundingClientRect();
      position = {
        section: sectionType,
        elementId,
        relativeX: Math.max(5, Math.min(95, ((contextMenu.clientX - rect.left) / rect.width) * 100)),
        relativeY: Math.max(5, Math.min(95, ((contextMenu.clientY - rect.top) / rect.height) * 100)),
      };
    } else {
      const containerRect = container.getBoundingClientRect();
      position = {
        section: 'general',
        relativeX: Math.max(5, Math.min(95, ((contextMenu.clientX - containerRect.left) / containerRect.width) * 100)),
        relativeY: Math.max(5, Math.min(95, ((contextMenu.clientY - containerRect.top) / containerRect.height) * 100)),
      };
    }

    addAnalysisStickyNote({
      content: '',
      color: DEFAULT_STICKY_NOTE_COLOR,
      context: 'analysis',
      position,
      isMinimized: false,
      zIndex: 1000 + analysisStickyNotes.length,
    });

    setContextMenu(null);
  }, [contextMenu, containerRef, addAnalysisStickyNote, analysisStickyNotes.length]);

  // Floating add button: add note at center of visible viewport
  const handleFloatingAdd = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollParent = getScrollParent(container);
    const containerRect = container.getBoundingClientRect();

    // Calculate center of the visible viewport within the container
    let visibleCenterX: number;
    let visibleCenterY: number;

    if (scrollParent !== document.documentElement) {
      const scrollRect = scrollParent.getBoundingClientRect();
      // Center of the visible scroll area
      visibleCenterX = (scrollRect.width / 2);
      visibleCenterY = (scrollRect.top + scrollRect.height / 2) - containerRect.top;
    } else {
      visibleCenterX = containerRect.width / 2;
      visibleCenterY = (window.innerHeight / 2) - containerRect.top;
    }

    const relativeX = Math.max(10, Math.min(90, (visibleCenterX / containerRect.width) * 100));
    const relativeY = Math.max(5, Math.min(95, (visibleCenterY / containerRect.height) * 100));

    addAnalysisStickyNote({
      content: '',
      color: DEFAULT_STICKY_NOTE_COLOR,
      context: 'analysis',
      position: {
        section: 'general',
        relativeX,
        relativeY,
      },
      isMinimized: false,
      zIndex: 1000 + analysisStickyNotes.length,
    });
  }, [containerRef, getScrollParent, addAnalysisStickyNote, analysisStickyNotes.length]);

  // Filter to only analysis notes
  const analysisNotes = useMemo(
    () => analysisStickyNotes.filter((note) => note.context === 'analysis'),
    [analysisStickyNotes]
  );

  // Notes with active arrows
  const notesWithArrows = useMemo(
    () => analysisNotes.filter(
      (note) => note.arrow?.enabled && note.arrow?.analysisTarget && isAnalysisPosition(note.position)
    ),
    [analysisNotes]
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

      {/* Floating add-note button (bottom-right corner) */}
      {!isReadOnly && (
        <div
          className="sticky bottom-4 ml-auto mr-4 z-[51] w-fit"
          style={{ pointerEvents: 'auto', float: 'right' }}
        >
          <button
            onClick={handleFloatingAdd}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
            title="Add sticky note"
          >
            <div className="relative">
              <StickyNoteIcon className="w-5 h-5" />
              <Plus className="w-3 h-3 absolute -bottom-0.5 -right-1 bg-amber-400 dark:bg-amber-600 rounded-full" />
            </div>
          </button>
        </div>
      )}

      {/* Main notes + arrows container */}
      {analysisNotes.length > 0 && (
        <div
          className="absolute inset-0 overflow-visible"
          style={{
            pointerEvents: 'none',
            zIndex: 50,
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
                const position = note.position as AnalysisNotePosition;
                const notePos = getNotePixelPos(position);
                const targetPos = note.arrow?.analysisTarget
                  ? getArrowTargetPixelPos(note.arrow.analysisTarget)
                  : null;

                if (!notePos || !targetPos) return null;

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
            {analysisNotes.map((note) => {
              if (!isAnalysisPosition(note.position)) return null;
              const position = note.position as AnalysisNotePosition;
              const noteStyle = getNoteStyle(position);

              // If we can't calculate position, don't render
              if (!noteStyle) return null;

              return (
                <div
                  key={note.id}
                  style={{
                    ...noteStyle,
                    pointerEvents: 'auto',
                  }}
                >
                  <StickyNote
                    note={note}
                    onUpdate={updateAnalysisStickyNote}
                    onDelete={deleteAnalysisStickyNote}
                    onDragEnd={handleDragEnd}
                    onToggleArrow={toggleAnalysisStickyNoteArrow}
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
