'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTimelineStore } from '@/store/timeline';

/**
 * Syncs next-themes theme state into the Zustand store
 * so components reading from Zustand stay in sync.
 */
export function useThemeSync() {
  const { theme } = useTheme();
  const setTheme = useTimelineStore((s) => s.setTheme);

  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      setTheme(theme);
    }
  }, [theme, setTheme]);
}
