'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Palette, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import {
  DRAWING_STROKE_COLORS,
  DRAWING_STROKE_WIDTHS,
} from '@/types/drawing-annotation';

interface DrawingToolButtonProps {
  className?: string;
}

/**
 * DrawingToolButton - Toggle button for drawing mode with stroke options
 *
 * When clicked, enters drawing mode where users can draw freehand on the timeline.
 * Includes a popover for selecting stroke color and width.
 */
export default function DrawingToolButton({ className }: DrawingToolButtonProps) {
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center justify-center p-2 rounded-lg transition-all',
          'shadow-md hover:shadow-lg',
          isDrawingMode
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-white dark:bg-slate-600 dark:hover:bg-slate-500'
        )}
        title={isDrawingMode ? 'Exit drawing mode (ESC)' : 'Enter drawing mode to annotate timeline'}
      >
        {isDrawingMode ? (
          <X className="w-4 h-4" />
        ) : (
          <Pencil className="w-4 h-4" />
        )}
      </motion.button>

      {/* Options Button (only when drawing mode is active) */}
      {isDrawingMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowOptions(!showOptions)}
          className={cn(
            'absolute -right-2 -top-2 w-6 h-6 rounded-full',
            'bg-white dark:bg-slate-700 shadow-md',
            'flex items-center justify-center',
            'hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors'
          )}
          title="Stroke options"
        >
          <Palette
            className="w-3.5 h-3.5"
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
                Click and drag on the timeline to draw. A note will be created automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing Mode Indicator Overlay */}
      {isDrawingMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Pencil className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Drawing Mode - Click and drag to draw</span>
            <span className="text-xs opacity-75">(ESC to exit)</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
