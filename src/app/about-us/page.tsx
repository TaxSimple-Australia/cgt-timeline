'use client';

import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import AboutVariantSelector from '@/components/landing/about-variants/AboutVariantSelector';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <LandingHeader />

      {/* AI + Human Expertise Section */}
      <div className="pt-20">
        <AboutVariantSelector />
      </div>

      <LandingFooter />
    </div>
  );
}
