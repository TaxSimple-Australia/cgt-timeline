'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className={`p-2 rounded-lg ${className}`} aria-label="Toggle theme">
        <Sun className="w-5 h-5 text-slate-400" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-slate-700 ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-slate-300 hover:text-white" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 hover:text-gray-900" />
      )}
    </button>
  );
}
