'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Palette } from 'lucide-react';
import VerticalHeroLayout from './hero-layouts/VerticalHeroLayout';
import HorizontalHeroLayout from './hero-layouts/HorizontalHeroLayout';

type HeroLayout = 'vertical' | 'horizontal';

const layouts: Record<HeroLayout, { label: string; description: string }> = {
  vertical: { label: 'Vertical Layout', description: 'Centered, full-height design' },
  horizontal: { label: 'Horizontal Layout', description: 'Side-by-side minimal design' },
};

interface LandingHeroProps {
  isInModal?: boolean;
}

export default function LandingHero({ isInModal = false }: LandingHeroProps) {
  const [layout, setLayout] = useState<HeroLayout>('vertical');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-32 pb-40">
      {/* Landing Page Visualizations Header - Top Right (hidden in modal) */}
      {!isInModal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute top-8 right-8 z-20"
        >
          <div className="relative bg-white/15 backdrop-blur-md border border-white/30 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:border-white/40 transition-all duration-300">
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Icon */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
                <Palette className="w-4 h-4 text-white" />
              </div>

              {/* Title */}
              <span className="text-white font-medium text-sm whitespace-nowrap">
                Landing Page Visualizations
              </span>

              {/* Dropdown Selector */}
              <div className="relative ml-2">
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as HeroLayout)}
                  className="appearance-none bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-2 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer hover:bg-white/25 transition-all duration-200"
                  title={layouts[layout].description}
                >
                  {Object.entries(layouts).map(([key, { label }]) => (
                    <option key={key} value={key} className="text-gray-900 bg-white">
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Render Selected Layout with Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={layout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {layout === 'vertical' ? <VerticalHeroLayout /> : <HorizontalHeroLayout />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
