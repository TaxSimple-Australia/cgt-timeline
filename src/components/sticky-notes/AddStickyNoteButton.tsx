'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StickyNote, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import { DEFAULT_STICKY_NOTE_COLOR, TimelineNotePosition, AnalysisNotePosition } from '@/types/sticky-note';

interface AddStickyNoteButtonProps {
  /** Button context: 'timeline' or 'analysis' */
  context: 'timeline' | 'analysis';
  /** Optional callback when note is added */
  onNoteAdded?: (noteId: string) => void;
  /** Custom position for the note (optional) */
  position?: TimelineNotePosition | AnalysisNotePosition;
  /** Reference to the timeline container (for calculating visible center) */
  containerRef?: React.RefObject<HTMLDivElement>;
  className?: string;
}

export default function AddStickyNoteButton({
  context,
  onNoteAdded,
  position,
  containerRef,
  className,
}: AddStickyNoteButtonProps) {
  const {
    addTimelineStickyNote,
    addAnalysisStickyNote,
    timelineStickyNotes,
    analysisStickyNotes,
    timelineStart,
    timelineEnd,
  } = useTimelineStore();

  // Calculate the visible center of the timeline viewport
  const getVisibleCenterPosition = (): TimelineNotePosition => {
    const container = containerRef?.current;

    if (!container) {
      // Fallback to center of entire timeline if no container ref
      return {
        anchorDate: new Date((timelineStart.getTime() + timelineEnd.getTime()) / 2).toISOString(),
        verticalOffset: 0,
      };
    }

    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const viewportHeight = rect.height;
    const viewportWidth = rect.width;

    // Calculate the center of the visible viewport in content coordinates
    const visibleCenterY = scrollTop + (viewportHeight / 2);

    // Convert to verticalOffset (relative to 50% of content height)
    const contentCenterY = scrollHeight / 2;
    const verticalOffset = visibleCenterY - contentCenterY;

    // Calculate what date is at the horizontal center of the viewport
    // The timeline width maps to timelineStart -> timelineEnd
    const totalTimeRange = timelineEnd.getTime() - timelineStart.getTime();

    // Horizontal center is at 50% of viewport width
    // Since the timeline fills the container, 50% of width = 50% through the time range
    const centerDate = new Date(timelineStart.getTime() + (totalTimeRange * 0.5));

    return {
      anchorDate: centerDate.toISOString(),
      verticalOffset: verticalOffset,
    };
  };

  const handleClick = () => {
    let noteId: string;

    if (context === 'timeline') {
      // Use provided position or calculate visible center
      const notePosition: TimelineNotePosition = position as TimelineNotePosition || getVisibleCenterPosition();

      noteId = addTimelineStickyNote({
        content: '',
        color: DEFAULT_STICKY_NOTE_COLOR,
        context: 'timeline',
        position: notePosition,
        isMinimized: true, // Start as icon - user clicks to expand
        zIndex: 1000 + timelineStickyNotes.length,
      });
    } else {
      // Default position: top-left of analysis view
      const defaultPosition: AnalysisNotePosition = position as AnalysisNotePosition || {
        section: 'general',
        relativeX: 10,
        relativeY: 10,
      };

      noteId = addAnalysisStickyNote({
        content: '',
        color: DEFAULT_STICKY_NOTE_COLOR,
        context: 'analysis',
        position: defaultPosition,
        isMinimized: true, // Start as icon - user clicks to expand
        zIndex: 1000 + analysisStickyNotes.length,
      });
    }

    onNoteAdded?.(noteId);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-md',
        'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50',
        'text-amber-700 dark:text-amber-300',
        'border border-amber-300 dark:border-amber-700',
        'transition-colors shadow-sm',
        className
      )}
      title={`Add sticky note to ${context}`}
    >
      <div className="relative">
        <StickyNote className="w-3.5 h-3.5" />
        <Plus className="w-2 h-2 absolute -bottom-0.5 -right-0.5 bg-amber-100 dark:bg-amber-900 rounded-full" />
      </div>
      <span className="text-xs font-medium hidden sm:inline">Note</span>
    </motion.button>
  );
}
