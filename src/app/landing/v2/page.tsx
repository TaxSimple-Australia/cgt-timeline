import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import V2Hero from '@/components/landing/variants/v2/V2Hero';
import V2FAQSection from '@/components/landing/variants/v2/V2FAQSection';

export default function LandingPageV2() {
  return (
    <main className="min-h-screen bg-slate-900">
      <LandingHeader />
      <V2Hero />
      <HowItWorksSection />
      <V2FAQSection />
      <LandingFooter />
    </main>
  );
}
