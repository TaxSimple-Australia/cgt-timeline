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
  className?: string;
}

export default function AddStickyNoteButton({
  context,
  onNoteAdded,
  position,
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

  const handleClick = () => {
    let noteId: string;

    if (context === 'timeline') {
      // Default position: center of visible timeline, slightly above center
      const defaultPosition: TimelineNotePosition = position as TimelineNotePosition || {
        anchorDate: new Date((timelineStart.getTime() + timelineEnd.getTime()) / 2).toISOString(),
        verticalOffset: -50,
      };

      noteId = addTimelineStickyNote({
        content: '',
        color: DEFAULT_STICKY_NOTE_COLOR,
        context: 'timeline',
        position: defaultPosition,
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
