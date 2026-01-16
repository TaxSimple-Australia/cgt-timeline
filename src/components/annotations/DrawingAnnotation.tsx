'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical, Minimize2, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DrawingAnnotation as DrawingAnnotationType,
  pathToSvgD,
  calculatePathBounds,
} from '@/types/drawing-annotation';
import { STICKY_NOTE_COLORS as NOTE_COLORS, StickyNoteColor } from '@/types/sticky-note';

// Extend Window interface for global drag flag
declare global {
  interface Window {
    __drawingAnnotationDragging?: boolean;
  }
}

interface DrawingAnnotationProps {
  annotation: DrawingAnnotationType;
  onUpdate: (id: string, updates: Partial<DrawingAnnotationType>) => void;
  onDelete: (id: string) => void;
  /** Callback when the note is dragged */
  onNoteDragEnd?: (id: string, clientX: number, clientY: number) => void;
  /** Position style for the drawing (absolute positioning) */
  drawingStyle?: React.CSSProperties;
  /** Position style for the note (absolute positioning) */
  noteStyle?: React.CSSProperties;
  /** Whether the view is read-only */
  isReadOnly?: boolean;
  className?: string;
}

/**
 * DrawingAnnotation - Renders a freehand drawing with an attached note
 *
 * The drawing is STATIC and cannot be moved.
 * Only the note can be dragged independently.
 */
export default function DrawingAnnotation({
  annotation,
  onUpdate,
  onDelete,
  onNoteDragEnd,
  drawingStyle,
  noteStyle,
  isReadOnly = false,
  className,
}: DrawingAnnotationProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(annotation.note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  // Drag state refs for NOTE only (drawing is static)
  const isDraggingNoteRef = useRef(false);
  const isDragPendingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0 });
  const dragCloneRef = useRef<HTMLElement | null>(null);
  const initialRectRef = useRef<DOMRect | null>(null);

  const DRAG_THRESHOLD = 5;

  const colors = NOTE_COLORS[annotation.note.color];

  // Calculate drawing bounds for SVG
  const pathBounds = useMemo(() => calculatePathBounds(annotation.path), [annotation.path]);

  // SVG padding for stroke width
  const svgPadding = Math.max(annotation.stroke.width * 2, 8);

  // Calculate SVG dimensions
  const svgWidth = pathBounds.width + svgPadding * 2;
  const svgHeight = pathBounds.height + svgPadding * 2;

  // Calculate offset to position SVG so path origin (0,0) is at the CSS position
  // Path origin (0,0) is at position (0 - minX + padding, 0 - minY + padding) within the SVG
  const originOffsetX = -pathBounds.minX + svgPadding;
  const originOffsetY = -pathBounds.minY + svgPadding;

  // The SVG needs to be positioned so that point (originOffsetX, originOffsetY) appears at the CSS position
  // So we translate by negative of that offset
  const svgTranslateX = -originOffsetX;
  const svgTranslateY = -originOffsetY;

  // Translate path points to SVG coordinate space (from minX-padding to fit in viewBox)
  const translatedPath = annotation.path.map((p) => ({
    x: p.x - pathBounds.minX + svgPadding,
    y: p.y - pathBounds.minY + svgPadding,
  }));

  const svgPathD = pathToSvgD(translatedPath);

  // Sync content with annotation prop
  useEffect(() => {
    setNoteContent(annotation.note.content);
  }, [annotation.note.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditingNote) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [noteContent, isEditingNote]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditingNote && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditingNote]);

  // Note drag handler (only for notes, not drawings)
  const handleNoteMouseDown = useCallback((e: React.MouseEvent) => {
    if (isReadOnly || isEditingNote) return;

    e.preventDefault();
    e.stopPropagation();

    const element = noteRef.current;
    if (!element) return;

    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY };
    initialRectRef.current = element.getBoundingClientRect();
    isDragPendingRef.current = true;

    const startActualDrag = () => {
      isDragPendingRef.current = false;
      isDraggingNoteRef.current = true;

      window.__drawingAnnotationDragging = true;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      if (element) {
        element.style.visibility = 'hidden';
      }

      // Create clone for drag visualization
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

      if (isDragPendingRef.current && distance >= DRAG_THRESHOLD) {
        startActualDrag();
      }

      if (isDraggingNoteRef.current && dragCloneRef.current) {
        dragCloneRef.current.style.left = `${initialRectRef.current!.left + deltaX}px`;
        dragCloneRef.current.style.top = `${initialRectRef.current!.top + deltaY}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const wasDragging = isDraggingNoteRef.current;
      const wasPending = isDragPendingRef.current;

      isDragPendingRef.current = false;

      if (wasDragging) {
        isDraggingNoteRef.current = false;

        if (dragCloneRef.current) {
          dragCloneRef.current.remove();
          dragCloneRef.current = null;
        }

        if (element) {
          element.style.visibility = '';
        }

        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (onNoteDragEnd) {
          onNoteDragEnd(annotation.id, upEvent.clientX, upEvent.clientY);
        }

        setTimeout(() => {
          window.__drawingAnnotationDragging = false;
        }, 100);
      } else if (wasPending) {
        // Click without drag - toggle minimize for note
        if (annotation.note.isMinimized) {
          onUpdate(annotation.id, {
            note: { ...annotation.note, isMinimized: false },
          });
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isReadOnly, isEditingNote, annotation.id, annotation.note, onUpdate, onNoteDragEnd]);

  // Cleanup clone on unmount
  useEffect(() => {
    return () => {
      if (dragCloneRef.current) {
        dragCloneRef.current.remove();
        dragCloneRef.current = null;
      }
    };
  }, []);

  const handleNoteSave = () => {
    if (noteContent.trim() !== annotation.note.content) {
      onUpdate(annotation.id, {
        note: { ...annotation.note, content: noteContent.trim() },
      });
    }
    setIsEditingNote(false);
  };

  const handleColorChange = (color: StickyNoteColor) => {
    onUpdate(annotation.id, {
      note: { ...annotation.note, color },
    });
  };

  const handleMinimizeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onUpdate(annotation.id, {
      note: { ...annotation.note, isMinimized: !annotation.note.isMinimized },
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(annotation.id);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* The Drawing (SVG) - STATIC, no drag capability */}
      <div
        className={cn('absolute', className)}
        style={{
          ...drawingStyle,
          pointerEvents: 'none', // Drawing is completely static - no interactions
        }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="overflow-visible"
          style={{
            // Position SVG so that path origin (0,0) is at the CSS position
            transform: `translate(${svgTranslateX}px, ${svgTranslateY}px)`,
          }}
        >
          {/* The freehand path */}
          <path
            d={svgPathD}
            fill="none"
            stroke={annotation.stroke.color}
            strokeWidth={annotation.stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={annotation.stroke.opacity ?? 1}
          />
        </svg>
      </div>

      {/* Delete button for the drawing (separate from drawing div for interactivity) */}
      {!isReadOnly && (
        <div
          className="absolute"
          style={{
            ...drawingStyle,
            pointerEvents: 'auto',
            zIndex: (annotation.zIndex || 1000) + 1,
          }}
        >
          <button
            onClick={handleDelete}
            className={cn(
              'absolute w-5 h-5 rounded-full',
              'bg-red-500 hover:bg-red-600 text-white',
              'flex items-center justify-center shadow-md',
              'opacity-50 hover:opacity-100 transition-opacity',
              'z-10'
            )}
            style={{
              // Position delete button at top-right of the actual drawing path
              // pathBounds.maxX is the rightmost point relative to anchor
              // pathBounds.minY is the topmost point relative to anchor
              left: `${pathBounds.maxX + 5}px`,
              top: `${pathBounds.minY - 20}px`,
            }}
            title="Delete annotation"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* The Note - can be dragged */}
      {annotation.note.isMinimized ? (
        // Minimized note - small icon
        <motion.div
          ref={noteRef}
          onMouseDown={handleNoteMouseDown}
          onClick={stopPropagation}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={!isReadOnly ? { scale: 1.15 } : undefined}
          className={cn(
            'absolute group select-none',
            !isReadOnly && 'cursor-grab'
          )}
          style={{
            ...noteStyle,
            pointerEvents: 'auto',
            zIndex: annotation.zIndex || 1000,
          }}
          title={annotation.note.content ? `Note: ${annotation.note.content.substring(0, 50)}...` : 'Click to expand'}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-lg shadow-lg flex items-center justify-center',
              'border-2 transition-all duration-200',
              'hover:shadow-xl'
            )}
            style={{
              backgroundColor: colors.light,
              borderColor: colors.border,
            }}
          >
            <Pencil className="w-4 h-4" style={{ color: colors.text }} />
          </div>

          {annotation.note.content && (
            <div
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: colors.border }}
            />
          )}

          {!isReadOnly && (
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
              title="Delete annotation"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      ) : (
        // Expanded note
        <motion.div
          ref={noteRef}
          onMouseDown={handleNoteMouseDown}
          onClick={stopPropagation}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={!isReadOnly && !isEditingNote ? { boxShadow: '0 8px 25px rgba(0,0,0,0.15)' } : undefined}
          className={cn(
            'absolute rounded-lg shadow-lg border-l-4 overflow-hidden',
            'min-w-[180px] max-w-[280px]',
            'min-h-[100px]',
            !isReadOnly && !isEditingNote && 'cursor-grab',
          )}
          style={{
            ...noteStyle,
            backgroundColor: colors.light,
            borderLeftColor: colors.border,
            pointerEvents: 'auto',
            zIndex: annotation.zIndex || 1000,
          }}
        >
          {/* Header */}
          <div
            className={cn(
              'flex items-center justify-between px-2 py-1',
              !isReadOnly && !isEditingNote && 'cursor-grab active:cursor-grabbing'
            )}
            style={{ backgroundColor: colors.dark }}
          >
            <div className="flex items-center gap-1">
              {!isReadOnly && (
                <GripVertical className="w-3 h-3" style={{ color: colors.text }} />
              )}
              <Pencil className="w-3 h-3" style={{ color: colors.text }} />
              <span className="text-xs font-medium" style={{ color: colors.text }}>
                Annotation
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              {!isReadOnly && (
                <>
                  <button
                    onClick={handleMinimizeToggle}
                    onMouseDown={stopPropagation}
                    className="p-1 hover:bg-black/10 rounded transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 className="w-3.5 h-3.5" style={{ color: colors.text }} />
                  </button>
                  <button
                    onClick={handleDelete}
                    onMouseDown={stopPropagation}
                    className="p-1 hover:bg-red-200 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-2" onMouseDown={isEditingNote ? stopPropagation : undefined}>
            {isEditingNote && !isReadOnly ? (
              <textarea
                ref={textareaRef}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onBlur={handleNoteSave}
                onMouseDown={stopPropagation}
                onClick={stopPropagation}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') {
                    setNoteContent(annotation.note.content);
                    setIsEditingNote(false);
                  }
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleNoteSave();
                  }
                }}
                className={cn(
                  'w-full bg-transparent border-none outline-none resize-none',
                  'text-sm placeholder-gray-500'
                )}
                style={{ color: colors.text }}
                placeholder="Add note for this annotation..."
                rows={2}
              />
            ) : (
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReadOnly) setIsEditingNote(true);
                }}
                onMouseDown={stopPropagation}
                className={cn(
                  'text-sm whitespace-pre-wrap break-words',
                  !isReadOnly && 'cursor-text hover:bg-black/5 rounded p-1 -m-1 min-h-[40px]'
                )}
                style={{ color: colors.text }}
              >
                {annotation.note.content || (isReadOnly ? '' : 'Click to add note...')}
              </p>
            )}

            {/* Color Picker */}
            {!isReadOnly && (
              <div className="flex gap-1 mt-2 pt-2 border-t border-gray-300/30">
                {(Object.keys(NOTE_COLORS) as StickyNoteColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorChange(color);
                    }}
                    onMouseDown={stopPropagation}
                    className={cn(
                      'w-4 h-4 rounded-full border-2 transition-all hover:scale-110',
                      annotation.note.color === color
                        ? 'border-gray-600 scale-110 ring-2 ring-gray-400/50'
                        : 'border-white/50 hover:border-gray-400'
                    )}
                    style={{ backgroundColor: NOTE_COLORS[color].border }}
                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
