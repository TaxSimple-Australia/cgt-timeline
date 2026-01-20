import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import FinalCTA from '@/components/landing/FinalCTA';
import MinimalHero from '@/components/landing/variants/minimal/MinimalHero';

export default function LandingPageMinimal() {
  return (
    <main className="min-h-screen bg-slate-900">
      <LandingHeader />
      <MinimalHero />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
