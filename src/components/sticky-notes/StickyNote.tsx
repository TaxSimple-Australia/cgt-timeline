'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical, Minimize2, Trash2, StickyNote as StickyNoteIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StickyNote as StickyNoteType,
  STICKY_NOTE_COLORS,
  StickyNoteColor,
} from '@/types/sticky-note';

// Extend Window interface for global drag flag
declare global {
  interface Window {
    __stickyNoteDragging?: boolean;
  }
}

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (id: string, updates: Partial<StickyNoteType>) => void;
  onDelete: (id: string) => void;
  onDragEnd?: (id: string, clientX: number, clientY: number) => void;
  isReadOnly?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function StickyNote({
  note,
  onUpdate,
  onDelete,
  onDragEnd,
  isReadOnly = false,
  style,
  className,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  // Use refs for ALL drag state - NO state updates during drag for maximum smoothness
  const isDraggingRef = useRef(false);
  const isDragPendingRef = useRef(false); // True between mousedown and drag threshold
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0 });
  const dragCloneRef = useRef<HTMLElement | null>(null);
  const initialRectRef = useRef<DOMRect | null>(null);

  // Drag threshold - only start drag after moving this many pixels
  const DRAG_THRESHOLD = 5;

  // State only for post-drag UI updates (not used during drag)
  const [isDraggingState, setIsDraggingState] = useState(false);

  const colors = STICKY_NOTE_COLORS[note.color];

  // Sync content with note prop
  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isReadOnly || isEditing) return;

    e.preventDefault();
    e.stopPropagation();

    const element = noteRef.current;
    if (!element) return;

    // Store initial mouse position and element rect
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    initialRectRef.current = element.getBoundingClientRect();

    // Mark as pending drag (not actual drag yet - need to pass threshold)
    isDragPendingRef.current = true;
    isDraggingRef.current = false;

    // Function to start actual drag (called when threshold is passed)
    const startActualDrag = () => {
      isDragPendingRef.current = false;
      isDraggingRef.current = true;

      // Set global flag so Timeline knows not to handle clicks
      window.__stickyNoteDragging = true;

      // Set cursor on body
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      // Hide the original element
      if (noteRef.current) {
        noteRef.current.style.visibility = 'hidden';
      }

      // Create a clone for drag visualization - attached to document.body
      // This completely bypasses React/Framer Motion
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = `${initialRectRef.current!.left}px`;
      clone.style.top = `${initialRectRef.current!.top}px`;
      clone.style.width = `${initialRectRef.current!.width}px`;
      clone.style.height = `${initialRectRef.current!.height}px`;
      clone.style.margin = '0';
      clone.style.transform = 'none';
      clone.style.transition = 'none';
      clone.style.animation = 'none';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '99999';
      clone.style.opacity = '0.95';
      clone.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
      clone.style.cursor = 'grabbing';
      document.body.appendChild(clone);
      dragCloneRef.current = clone;
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.mouseX;
      const deltaY = moveEvent.clientY - dragStartRef.current.mouseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Check if we should start actual drag (threshold passed)
      if (isDragPendingRef.current && distance >= DRAG_THRESHOLD) {
        startActualDrag();
      }

      // Update clone position if we're actually dragging
      if (isDraggingRef.current && dragCloneRef.current) {
        dragCloneRef.current.style.left = `${initialRectRef.current!.left + deltaX}px`;
        dragCloneRef.current.style.top = `${initialRectRef.current!.top + deltaY}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      // Remove listeners immediately
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const wasDragging = isDraggingRef.current;
      const wasPending = isDragPendingRef.current;

      // Reset pending state
      isDragPendingRef.current = false;

      if (wasDragging) {
        // End actual drag
        isDraggingRef.current = false;

        // Remove the clone
        if (dragCloneRef.current) {
          dragCloneRef.current.remove();
          dragCloneRef.current = null;
        }

        // Show the original element again
        if (noteRef.current) {
          noteRef.current.style.visibility = '';
        }

        // Reset body styles
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Call onDragEnd with the final mouse position
        if (onDragEnd) {
          onDragEnd(note.id, upEvent.clientX, upEvent.clientY);
        }

        // Clear global flag after a delay to block the click event
        setTimeout(() => {
          window.__stickyNoteDragging = false;
        }, 100);
      } else if (wasPending) {
        // Never passed threshold - this is a CLICK, not a drag
        // For minimized notes, this should expand them
        if (note.isMinimized) {
          onUpdate(note.id, { isMinimized: false });
        }
      }
    };

    // Add listeners directly in mousedown handler
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isReadOnly, isEditing, note.id, note.isMinimized, onDragEnd, onUpdate]);

  // Cleanup clone on unmount
  useEffect(() => {
    return () => {
      if (dragCloneRef.current) {
        dragCloneRef.current.remove();
        dragCloneRef.current = null;
      }
    };
  }, []);

  const handleContentSave = () => {
    if (content.trim() !== note.content) {
      onUpdate(note.id, { content: content.trim() });
    }
    setIsEditing(false);
  };

  const handleColorChange = (color: StickyNoteColor) => {
    onUpdate(note.id, { color });
  };

  const handleMinimizeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onUpdate(note.id, { isMinimized: !note.isMinimized });
  };

  const handleExpand = (e: React.MouseEvent) => {
    // Click-to-expand is now handled in handleMouseDown via drag threshold
    // This handler is kept for the onClick event but defers to mousedown logic
    e.stopPropagation();
    e.preventDefault();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(note.id);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Minimized state: Show only a small icon
  if (note.isMinimized) {
    return (
      <motion.div
        ref={noteRef}
        onMouseDown={handleMouseDown}
        onClick={handleExpand}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        whileHover={!isDraggingState ? { scale: 1.15 } : undefined}
        className={cn(
          'relative group select-none',
          isDraggingState ? 'cursor-grabbing' : 'cursor-grab',
          className
        )}
        style={{
          zIndex: isDraggingState ? 10000 : (note.zIndex || 1000),
          ...style,
        }}
        title={note.content ? `Note: ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}` : 'Click to expand note'}
      >
        {/* Icon Container */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg shadow-lg flex items-center justify-center',
            'border-2 transition-all duration-200',
            'hover:shadow-xl'
          )}
          style={{
            backgroundColor: colors.light,
            borderColor: colors.border,
          }}
        >
          <StickyNoteIcon
            className="w-5 h-5"
            style={{ color: colors.text }}
          />
        </div>

        {/* Content indicator badge */}
        {note.content && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: colors.border }}
          />
        )}

        {/* Delete button on hover (only when not read-only) */}
        {!isReadOnly && !isDraggingState && (
          <button
            onClick={handleDelete}
            onMouseDown={stopPropagation}
            className={cn(
              'absolute -top-2 -right-2 w-5 h-5 rounded-full',
              'bg-red-500 hover:bg-red-600 text-white',
              'flex items-center justify-center shadow-md',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'z-10'
            )}
            title="Delete note"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    );
  }

  // Expanded state: Full sticky note
  return (
    <motion.div
      ref={noteRef}
      onMouseDown={handleMouseDown}
      onClick={stopPropagation}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={!isDraggingState ? { boxShadow: '0 8px 25px rgba(0,0,0,0.15)' } : undefined}
      className={cn(
        'rounded-lg shadow-lg border-l-4 overflow-hidden',
        'min-w-[200px] max-w-[300px]',
        'min-h-[120px]',
        isDraggingState ? 'cursor-grabbing' : (!isReadOnly && !isEditing ? 'cursor-grab' : ''),
        className
      )}
      style={{
        backgroundColor: colors.light,
        borderLeftColor: colors.border,
        zIndex: isDraggingState ? 10000 : (note.zIndex || 1000),
        ...style,
      }}
    >
      {/* Header / Drag Handle */}
      <div
        className={cn(
          'flex items-center justify-between px-2 py-1.5',
          !isReadOnly && !isEditing && 'cursor-grab active:cursor-grabbing'
        )}
        style={{ backgroundColor: colors.dark }}
      >
        <div className="flex items-center gap-1">
          {!isReadOnly && (
            <GripVertical className="w-3.5 h-3.5" style={{ color: colors.text }} />
          )}
          <span className="text-xs font-medium" style={{ color: colors.text }}>
            Note
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isReadOnly && (
            <>
              <button
                onClick={handleMinimizeToggle}
                onMouseDown={stopPropagation}
                className="p-1.5 hover:bg-black/10 rounded transition-colors"
                title="Minimize to icon"
              >
                <Minimize2 className="w-4 h-4" style={{ color: colors.text }} />
              </button>
              <button
                onClick={handleDelete}
                onMouseDown={stopPropagation}
                className="p-1.5 hover:bg-red-200 rounded transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5" onMouseDown={isEditing ? stopPropagation : undefined}>
        {isEditing && !isReadOnly ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentSave}
            onMouseDown={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                setContent(note.content);
                setIsEditing(false);
              }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleContentSave();
              }
            }}
            className={cn(
              'w-full bg-transparent border-none outline-none resize-none',
              'text-sm placeholder-gray-500'
            )}
            style={{ color: colors.text }}
            placeholder="Write your note..."
            rows={3}
          />
        ) : (
          <p
            onClick={(e) => {
              e.stopPropagation();
              if (!isReadOnly) setIsEditing(true);
            }}
            onMouseDown={stopPropagation}
            className={cn(
              'text-sm whitespace-pre-wrap break-words',
              !isReadOnly && 'cursor-text hover:bg-black/5 rounded p-1 -m-1 min-h-[50px]'
            )}
            style={{ color: colors.text }}
          >
            {note.content || (isReadOnly ? '' : 'Click to add note...')}
          </p>
        )}

        {/* Color Picker */}
        {!isReadOnly && (
          <div className="flex gap-1.5 mt-3 pt-2 border-t border-gray-300/30">
            {(Object.keys(STICKY_NOTE_COLORS) as StickyNoteColor[]).map((color) => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(color);
                }}
                onMouseDown={stopPropagation}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                  note.color === color
                    ? 'border-gray-600 scale-110 ring-2 ring-gray-400/50'
                    : 'border-white/50 hover:border-gray-400'
                )}
                style={{ backgroundColor: STICKY_NOTE_COLORS[color].border }}
                title={color.charAt(0).toUpperCase() + color.slice(1)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
