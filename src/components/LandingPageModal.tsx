'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Palette } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SolutionSection from '@/components/landing/SolutionSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTA from '@/components/landing/FinalCTA';
import LandingFooter from '@/components/landing/LandingFooter';

type HeroLayout = 'vertical' | 'horizontal';

const layouts: Record<HeroLayout, { label: string; description: string }> = {
  vertical: { label: 'Vertical Layout', description: 'Centered, full-height design' },
  horizontal: { label: 'Horizontal Layout', description: 'Side-by-side minimal design' },
};

interface LandingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LandingPageModal({ isOpen, onClose }: LandingPageModalProps) {
  const [layout, setLayout] = useState<HeroLayout>('vertical');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-slate-900 rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Landing Page Visualizations</h2>
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-3">
                  {/* Layout Selector */}
                  <div className="relative">
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value as HeroLayout)}
                      className="appearance-none bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-1.5 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/25 transition-colors"
                      title={layouts[layout].description}
                    >
                      {Object.entries(layouts).map(([key, { label }]) => (
                        <option key={key} value={key} className="text-gray-900 bg-white">
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content - Full Landing Page */}
            <div className="flex-1 overflow-y-auto bg-slate-900">
              <motion.div
                key={layout}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-full"
              >
                <LandingHeader />
                <LandingHero isInModal={true} />
                <FeaturesSection />
                <SolutionSection />
                <HowItWorksSection />
                <FAQSection />
                <FinalCTA />
                <LandingFooter />
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
