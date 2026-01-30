'use client';

import { useEffect, useCallback } from 'react';
import { useEnhancedStore } from '@/store/storeEnhancer';

interface UseUndoRedoShortcutsOptions {
  enabled?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * Hook to handle undo/redo keyboard shortcuts
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 */
export function useUndoRedoShortcuts(options: UseUndoRedoShortcutsOptions = {}) {
  const { enabled = true, onUndo, onRedo } = options;

  // Get undo/redo functions from enhanced store
  const {
    undoManager,
    undo,
    redo,
  } = useEnhancedStore();

  const canUndo = undoManager.canUndo;
  const canRedo = undoManager.canRedo;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if we should ignore this event (e.g., when typing in an input)
    const target = event.target as HTMLElement;
    const isInputElement =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Allow undo/redo even in input elements (this is standard behavior)
    // But only for non-text-modifying shortcuts

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    if (!modifierKey) return;

    // Undo: Ctrl+Z / Cmd+Z (without Shift)
    if (event.key === 'z' && !event.shiftKey) {
      // In input elements, let browser handle native undo
      if (isInputElement) return;

      event.preventDefault();
      if (canUndo) {
        undo();
        onUndo?.();
        console.log('⏪ Undo triggered via keyboard');
      }
      return;
    }

    // Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
    if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
      // In input elements, let browser handle native redo
      if (isInputElement) return;

      event.preventDefault();
      if (canRedo) {
        redo();
        onRedo?.();
        console.log('⏩ Redo triggered via keyboard');
      }
      return;
    }
  }, [canUndo, canRedo, undo, redo, onUndo, onRedo]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return { canUndo, canRedo, undo, redo };
}

export default useUndoRedoShortcuts;
