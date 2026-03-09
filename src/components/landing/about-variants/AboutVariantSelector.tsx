'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ClassicStackVariant from './ClassicStackVariant';
import BentoGridVariant from './BentoGridVariant';
import SplitScreenVariant from './SplitScreenVariant';
import StoryTimelineVariant from './StoryTimelineVariant';
import MagazineEditorialVariant from './MagazineEditorialVariant';

const VARIANTS = [
  { key: 'split-screen', label: 'Split Screen' },
  { key: 'classic-stack', label: 'Classic Stack' },
  { key: 'bento-grid', label: 'Bento Grid' },
  { key: 'story-timeline', label: 'Story Timeline' },
  { key: 'magazine-editorial', label: 'Magazine Editorial' },
] as const;

type VariantKey = (typeof VARIANTS)[number]['key'];

const VARIANT_COMPONENTS: Record<VariantKey, React.ComponentType> = {
  'classic-stack': ClassicStackVariant,
  'bento-grid': BentoGridVariant,
  'split-screen': SplitScreenVariant,
  'story-timeline': StoryTimelineVariant,
  'magazine-editorial': MagazineEditorialVariant,
};

export default function AboutVariantSelector() {
  const [activeVariant, setActiveVariant] = useState<VariantKey>('split-screen');
  const [isOpen, setIsOpen] = useState(false);

  const ActiveComponent = VARIANT_COMPONENTS[activeVariant];
  const activeLabel = VARIANTS.find((v) => v.key === activeVariant)?.label;

  return (
    <>
      {/* Sticky variant selector bar */}
      <div className="sticky top-16 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Layout Variant</span>

          {/* Desktop: Pill buttons */}
          <div className="hidden md:flex items-center gap-2">
            {VARIANTS.map((v) => (
              <button
                key={v.key}
                onClick={() => setActiveVariant(v.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeVariant === v.key
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Mobile: Dropdown */}
          <div className="relative md:hidden flex-1 ml-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            >
              {activeLabel}
              <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-xl z-50">
                {VARIANTS.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => {
                      setActiveVariant(v.key);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      activeVariant === v.key
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active variant */}
      <ActiveComponent />
    </>
  );
}
