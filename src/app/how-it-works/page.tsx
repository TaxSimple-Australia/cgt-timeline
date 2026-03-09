'use client';

import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import HowItWorksSection from '@/components/landing/HowItWorksSection';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 dark:from-slate-900 via-slate-300 dark:via-slate-800 to-slate-200 dark:to-slate-900">
      <LandingHeader />

      <HowItWorksSection />

      <LandingFooter />
    </div>
  );
}
