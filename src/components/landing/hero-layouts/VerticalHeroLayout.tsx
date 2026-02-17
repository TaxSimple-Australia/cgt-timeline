'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Sparkles, Calculator, FileText, ShieldCheck, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

export default function VerticalHeroLayout() {
  const { showModal, handleNavigateToTimeline, handleAccept, handleClose } = useTermsAcceptance();
  return (
    <>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Enhanced grid pattern with glow */}
      <div className="absolute inset-0">
        {/* Main grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Grid glow intersections */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(6,182,212,0.3)_0.5px,transparent_1px),radial-gradient(circle_at_4rem_0%,rgba(6,182,212,0.3)_0.5px,transparent_1px),radial-gradient(circle_at_0%_4rem,rgba(6,182,212,0.3)_0.5px,transparent_1px),radial-gradient(circle_at_4rem_4rem,rgba(6,182,212,0.3)_0.5px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] animate-grid-glow" />

        {/* Center radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_40%,rgba(6,182,212,0.15),transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Brand bar above headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-600" />
          <span className="text-[10px] tracking-[0.3em] text-slate-400 font-light uppercase">CGT Brain AI Timeline</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-600" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
        >
          Calculate Your Residential Capital Gains Tax
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            in Minutes
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg lg:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Visualize your property timeline, track every cost, and get AI-powered CGT analysis—all in one intuitive platform.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={handleNavigateToTimeline}
            size="lg"
            className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all"
          >
            Start Building Your Timeline
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg">
              See How It Works
            </Button>
          </Link>
        </motion.div>

        {/* Trust indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-slate-400 text-xs italic"
        >
          <p>Trusted by property investors and tax professionals across Australia</p>
        </motion.div>

        {/* Demo Preview Box */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 relative z-30 mb-[-120px]"
        >
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-cyan-500/70 shadow-2xl shadow-cyan-500/80 p-2">
            {/* Glowing border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-2xl opacity-0 blur-sm group-hover:opacity-100 transition-opacity duration-500" />

            {/* Inner container */}
            <div className="relative bg-slate-900/90 rounded-xl overflow-hidden">
              {/* Timeline Screenshot */}
              <div className="aspect-video relative">
                <Image
                  src="/landing.png"
                  alt="CGT Timeline Interface Preview"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Animated glow effect */}
            <div className="absolute -inset-[12px] bg-gradient-to-r from-cyan-500/70 via-blue-500/70 to-cyan-500/70 rounded-2xl blur-3xl -z-10 animate-pulse" />
          </div>

          {/* Floating label */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-full">
            <span className="text-xs text-cyan-400 font-medium">Interactive Timeline Demo</span>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Floating Feature Cards */}
      {/* Card 1 - AI-Powered Analysis (Top Right) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute right-8 md:right-16 lg:right-24 hidden lg:block animate-gentle-float z-40"
        style={{ top: 'calc(16rem + 240px)' }}
      >
        <div className="bg-slate-800/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI-Powered Analysis</p>
              <p className="text-cyan-400 text-xs">Smart CGT calculations</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card 2 - PDF Export (Bottom Left) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="absolute bottom-40 left-8 md:left-16 lg:left-24 hidden md:block animate-gentle-float-alt z-40"
        style={{ animationDelay: '2s' }}
      >
        <div className="bg-slate-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">PDF Export</p>
              <p className="text-purple-400 text-xs">Professional reports</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showModal}
        onAccept={handleAccept}
        onClose={handleClose}
      />
    </>
  );
}
