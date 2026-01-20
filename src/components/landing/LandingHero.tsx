'use client';

import React from 'react';
import VerticalHeroLayout from './hero-layouts/VerticalHeroLayout';

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-32 pb-40">
      <VerticalHeroLayout />
    </section>
  );
}
