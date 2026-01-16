'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import {
  DRAWING_STROKE_COLORS,
  DRAWING_STROKE_WIDTHS,
} from '@/types/drawing-annotation';

interface AddDrawingButtonProps {
  /** Button context: 'timeline' or 'analysis' */
  context: 'timeline' | 'analysis';
  className?: string;
}

/**
 * AddDrawingButton - Toggle button for drawing mode (for toolbars)
 *
 * A compact button that matches the style of AddStickyNoteButton.
 * When clicked, enters drawing mode where users can draw freehand.
 * Right-click or click options button to adjust stroke color/width.
 */
export default function AddDrawingButton({
  context,
  className,
}: AddDrawingButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const {
    isDrawingMode,
    setDrawingMode,
    currentDrawingStroke,
    setDrawingStroke,
  } = useTimelineStore();

  const handleToggleDrawingMode = () => {
    if (isDrawingMode) {
      setDrawingMode(false);
      setShowOptions(false);
    } else {
      setDrawingMode(true);
    }
  };

  const handleColorSelect = (color: string) => {
    setDrawingStroke({ color });
  };

  const handleWidthSelect = (width: number) => {
    setDrawingStroke({ width });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Button */}
      <motion.button
        onClick={handleToggleDrawingMode}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowOptions(!showOptions);
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md',
          'transition-colors shadow-sm',
          isDrawingMode
            ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
        )}
        title={isDrawingMode ? 'Exit drawing mode (ESC)' : `Draw on ${context}`}
      >
        {isDrawingMode ? (
          <X className="w-3.5 h-3.5" />
        ) : (
          <Pencil className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-medium hidden sm:inline">
          {isDrawingMode ? 'Exit' : 'Draw'}
        </span>
      </motion.button>

      {/* Options Button (only when drawing mode is active) */}
      {isDrawingMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowOptions(!showOptions)}
          className={cn(
            'absolute -right-1 -top-1 w-4 h-4 rounded-full',
            'bg-white dark:bg-slate-700 shadow-md',
            'flex items-center justify-center',
            'hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors',
            'border border-slate-200 dark:border-slate-600'
          )}
          title="Stroke options"
        >
          <Palette
            className="w-2.5 h-2.5"
            style={{ color: currentDrawingStroke.color }}
          />
        </motion.button>
      )}

      {/* Options Popover */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full left-0 mt-2 p-3 rounded-lg',
              'bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700',
              'z-50 min-w-[180px]'
            )}
          >
            {/* Color Selection */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                Stroke Color
              </label>
              <div className="flex flex-wrap gap-2">
                {DRAWING_STROKE_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                      currentDrawingStroke.color === color
                        ? 'border-slate-800 dark:border-white ring-2 ring-slate-400/50 scale-110'
                        : 'border-transparent hover:border-slate-400'
                    )}
                    style={{ backgroundColor: color }}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* Width Selection */}
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                Stroke Width
              </label>
              <div className="flex items-center gap-2">
                {DRAWING_STROKE_WIDTHS.map((width) => (
                  <button
                    key={width}
                    onClick={() => handleWidthSelect(width)}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      'border-2',
                      currentDrawingStroke.width === width
                        ? 'border-slate-800 dark:border-white bg-slate-100 dark:bg-slate-700'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                    title={`${width}px`}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: width * 2,
                        height: width * 2,
                        backgroundColor: currentDrawingStroke.color,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                Preview
              </label>
              <svg width="100%" height="30" className="overflow-visible">
                <path
                  d="M 10 15 Q 30 5 50 15 T 90 15"
                  fill="none"
                  stroke={currentDrawingStroke.color}
                  strokeWidth={currentDrawingStroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Instructions */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Click and drag to draw. A note will be created automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
