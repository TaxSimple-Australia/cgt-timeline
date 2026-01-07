'use client';

import React from 'react';
import { ChevronDown, Sparkles, Cpu, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LLMSelectorProps {
  selectedProvider: string;
  availableProviders: Record<string, string>;
  onSelect: (provider: string) => void;
  disabled?: boolean;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  deepseek: <Zap className="w-4 h-4 text-blue-500" />,
  claude: <Sparkles className="w-4 h-4 text-purple-500" />,
  gpt4: <Brain className="w-4 h-4 text-green-500" />,
  gemini: <Cpu className="w-4 h-4 text-orange-500" />,
};

const PROVIDER_COLORS: Record<string, string> = {
  deepseek: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  claude: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  gpt4: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  gemini: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
};

export default function LLMSelector({
  selectedProvider,
  availableProviders,
  onSelect,
  disabled = false,
}: LLMSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedName = availableProviders[selectedProvider] || selectedProvider;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
          'border border-gray-200 dark:border-gray-700',
          'hover:bg-gray-50 dark:hover:bg-gray-800',
          disabled && 'opacity-50 cursor-not-allowed',
          PROVIDER_COLORS[selectedProvider] || 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        {PROVIDER_ICONS[selectedProvider] || <Cpu className="w-4 h-4" />}
        <span className="text-sm font-medium">{selectedName}</span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 py-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {Object.entries(availableProviders).map(([id, name]) => (
            <button
              key={id}
              onClick={() => {
                onSelect(id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                selectedProvider === id && 'bg-gray-50 dark:bg-gray-800'
              )}
            >
              {PROVIDER_ICONS[id] || <Cpu className="w-4 h-4 text-gray-400" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {name}
                </p>
              </div>
              {selectedProvider === id && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
