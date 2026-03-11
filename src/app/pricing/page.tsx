'use client';

import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import ComparisonTableVariant from '@/components/landing/pricing-variants/ComparisonTableVariant';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 dark:from-slate-900 via-slate-300 dark:via-slate-800 to-slate-200 dark:to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-0 dark:opacity-20" />

      {/* Header */}
      <LandingHeader />

      <ComparisonTableVariant />

      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}
