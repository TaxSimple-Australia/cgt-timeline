import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import SplitScreenVariant from '@/components/landing/about-variants/SplitScreenVariant';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 dark:from-slate-900 via-slate-300 dark:via-slate-800 to-slate-200 dark:to-slate-900">
      <LandingHeader />

      <div className="pt-20">
        <SplitScreenVariant />
      </div>

      <LandingFooter />
    </div>
  );
}
