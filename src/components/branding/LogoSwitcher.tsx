'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoOption {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'image';
  file: string | null;
  darkFile?: string;
}

interface LogoSwitcherProps {
  currentLogo: string;
  onLogoChange: (logoId: string) => void;
  className?: string;
}

export default function LogoSwitcher({ currentLogo, onLogoChange, className }: LogoSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logos, setLogos] = useState<LogoOption[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Load logo options from config
  useEffect(() => {
    fetch('/logos/logos-config.json')
      .then(res => res.json())
      .then(data => setLogos(data.logos))
      .catch(err => console.error('Failed to load logo options:', err));
  }, []);

  // Toggle visibility with Ctrl+L or Cmd+L
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-purple-500/20 hover:bg-purple-500/30',
          'border border-purple-500/50',
          'text-purple-300 hover:text-purple-200',
          'transition-all duration-200',
          'text-sm font-medium'
        )}
        title="Logo Switcher (Ctrl+L to toggle visibility)"
      >
        <Palette className="w-4 h-4" />
        <span>Logo Options</span>
        <span className="text-xs opacity-70">({logos.length})</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className={cn(
            'absolute right-0 mt-2 w-80 max-h-[600px] overflow-y-auto',
            'bg-slate-900 border border-slate-700 rounded-lg shadow-2xl',
            'z-50'
          )}>
            <div className="p-3 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Select Logo Variant</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose a logo to preview in the header
              </p>
            </div>

            <div className="p-2 space-y-1">
              {logos.map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => {
                    onLogoChange(logo.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg',
                    'transition-all duration-200',
                    currentLogo === logo.id
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-2 border-transparent'
                  )}
                >
                  {/* Logo Preview */}
                  <div className="flex-shrink-0 w-16 h-12 bg-white dark:bg-slate-700 rounded flex items-center justify-center overflow-hidden">
                    {logo.type === 'image' && logo.file ? (
                      <Image
                        src={logo.file}
                        alt={logo.name}
                        width={64}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-xs font-bold">
                        <span className="text-cyan-500">CGT</span>
                        <span className="text-slate-900 dark:text-white"> Brain</span>
                      </div>
                    )}
                  </div>

                  {/* Logo Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{logo.name}</p>
                      {currentLogo === logo.id && (
                        <Check className="w-4 h-4 text-cyan-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{logo.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-slate-700 bg-slate-900/50">
              <p className="text-xs text-slate-400">
                💡 Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl+L</kbd> to hide/show this switcher
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
