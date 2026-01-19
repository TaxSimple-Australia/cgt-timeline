'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function HorizontalHeroLayout() {
  return (
    <>
      {/* Minimal gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Content Grid - Horizontal Layout */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Side - Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">Australian Property CGT Calculator</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Calculate Your Capital Gains Tax{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              in Minutes
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
            Visualize your property timeline, track every cost, and get AI-powered CGT analysis—all in one intuitive platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/">
              <Button size="lg" className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all">
                Start Building Your Timeline
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust indicator */}
          <p className="text-slate-400 text-sm">
            Trusted by property investors and tax professionals across Australia
          </p>
        </motion.div>

        {/* Right Side - Preview */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
            {/* Timeline Screenshot */}
            <div className="aspect-video relative bg-slate-900/90">
              <Image
                src="/landing.png"
                alt="CGT Timeline Interface Preview"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Subtle glow effect */}
            <div className="absolute -inset-[8px] bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 rounded-xl blur-2xl -z-10" />
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-full">
            <span className="text-xs text-cyan-400 font-medium">Interactive Timeline Demo</span>
          </div>
        </motion.div>
      </div>

      {/* Minimal decorative element */}
      <div className="absolute top-1/3 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
    </>
  );
}
