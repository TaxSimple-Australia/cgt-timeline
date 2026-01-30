'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Undo2, Redo2 } from 'lucide-react';
import { useEnhancedStore } from '@/store/storeEnhancer';
import { cn } from '@/lib/utils';

interface UndoRedoButtonsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  variant?: 'default' | 'minimal' | 'outline';
}

export default function UndoRedoButtons({
  className,
  size = 'md',
  showLabels = false,
  variant = 'default',
}: UndoRedoButtonsProps) {
  // Get undo/redo state from enhanced store
  const {
    undoManager,
    undo: performUndo,
    redo: performRedo,
  } = useEnhancedStore();

  const canUndo = undoManager.canUndo;
  const canRedo = undoManager.canRedo;

  // Size classes
  const sizeClasses = {
    sm: 'h-7 w-7 text-sm',
    md: 'h-9 w-9 text-base',
    lg: 'h-11 w-11 text-lg',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Variant classes
  const variantClasses = {
    default: cn(
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
      'hover:bg-slate-50 dark:hover:bg-slate-700',
      'shadow-sm'
    ),
    minimal: cn(
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
    ),
    outline: cn(
      'bg-transparent border-2 border-slate-300 dark:border-slate-600',
      'hover:border-slate-400 dark:hover:border-slate-500',
      'hover:bg-slate-50 dark:hover:bg-slate-800'
    ),
  };

  const handleUndo = () => {
    if (canUndo) {
      performUndo();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      performRedo();
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Undo Button */}
      <motion.button
        onClick={handleUndo}
        disabled={!canUndo}
        className={cn(
          'flex items-center justify-center rounded-lg transition-all duration-150',
          sizeClasses[size],
          variantClasses[variant],
          !canUndo && 'opacity-40 cursor-not-allowed',
          canUndo && 'cursor-pointer'
        )}
        whileHover={canUndo ? { scale: 1.05 } : undefined}
        whileTap={canUndo ? { scale: 0.95 } : undefined}
        aria-label="Undo (Ctrl+Z)"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className={cn(iconSizes[size], 'text-slate-600 dark:text-slate-300')} />
        {showLabels && (
          <span className="ml-1.5 text-slate-600 dark:text-slate-300">Undo</span>
        )}
      </motion.button>

      {/* Redo Button */}
      <motion.button
        onClick={handleRedo}
        disabled={!canRedo}
        className={cn(
          'flex items-center justify-center rounded-lg transition-all duration-150',
          sizeClasses[size],
          variantClasses[variant],
          !canRedo && 'opacity-40 cursor-not-allowed',
          canRedo && 'cursor-pointer'
        )}
        whileHover={canRedo ? { scale: 1.05 } : undefined}
        whileTap={canRedo ? { scale: 0.95 } : undefined}
        aria-label="Redo (Ctrl+Y)"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className={cn(iconSizes[size], 'text-slate-600 dark:text-slate-300')} />
        {showLabels && (
          <span className="ml-1.5 text-slate-600 dark:text-slate-300">Redo</span>
        )}
      </motion.button>
    </div>
  );
}
