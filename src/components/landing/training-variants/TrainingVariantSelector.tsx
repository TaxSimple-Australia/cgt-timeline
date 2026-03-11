'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

import NetflixCarouselVariant from './NetflixCarouselVariant';
import SpotlightHeroVariant from './SpotlightHeroVariant';
import LearningPathVariant from './LearningPathVariant';

const VARIANTS = [
  { id: 'netflix', label: 'Netflix Carousel', component: NetflixCarouselVariant },
  { id: 'spotlight', label: 'Spotlight Hero', component: SpotlightHeroVariant },
  { id: 'learning-path', label: 'Learning Path', component: LearningPathVariant },
];

export default function TrainingVariantSelector() {
  const [activeVariant, setActiveVariant] = useState('netflix');

  const ActiveComponent = VARIANTS.find((v) => v.id === activeVariant)?.component ?? NetflixCarouselVariant;

  return (
    <>
      {/* Desktop pill selector */}
      <div className="sticky top-16 z-30 bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 justify-center">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2 uppercase tracking-wider">
            Variant:
          </span>
          {VARIANTS.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setActiveVariant(variant.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                activeVariant === variant.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
              )}
            >
              {variant.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile dropdown */}
      <div className="sticky top-16 z-30 bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 md:hidden">
        <div className="px-4 py-2">
          <select
            value={activeVariant}
            onChange={(e) => setActiveVariant(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
          >
            {VARIANTS.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ActiveComponent />
    </>
  );
}
