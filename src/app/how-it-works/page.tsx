'use client';

import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import HowItWorksSection from '@/components/landing/HowItWorksSection';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white dark:from-slate-900 via-slate-50 dark:via-slate-800 to-white dark:to-slate-900">
      <LandingHeader />

      <HowItWorksSection />

      <LandingFooter />
    </div>
  );
}
