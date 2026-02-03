'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MinimalHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-3xl mx-auto"
      >
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          CGT{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Made Simple
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-xl mx-auto">
          Calculate your Australian property capital gains tax with visual timelines and AI analysis.
        </p>

        {/* Single CTA */}
        <Link href="/app">
          <Button
            size="lg"
            className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-7 text-xl shadow-lg shadow-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
          >
            Get Started
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </motion.div>

      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
    </section>
  );
}
