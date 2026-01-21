'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, X, ArrowRight } from 'lucide-react';

export default function SolutionSection() {
  const oldWay = [
    'Spend 20+ hours in spreadsheets',
    'Hunt for receipts from years ago',
    'Second-guess every calculation',
    'Pay $800+ for accountant help',
    'Still worry about ATO audits',
  ];

  const newWay = [
    'Build your timeline in 5 minutes',
    'Upload documents once, access forever',
    'AI verifies every calculation',
    'Free to start, export anytime',
    'Sleep easy with ATO-compliant reports',
  ];

  const benefits = [
    {
      title: 'Automatic Timeline Generation',
      description: 'AI organizes your property history from uploaded documents',
    },
    {
      title: 'Smart Cost Base Tracking',
      description: 'Never miss a deductible expense across all 5 CGT elements',
    },
    {
      title: 'Verification Alerts',
      description: 'Catch errors before the ATO does—overlaps, gaps, and inconsistencies',
    },
    {
      title: 'Export-Ready Reports',
      description: 'Professional PDFs your accountant can use immediately',
    },
  ];

  return (
    <section className="relative py-24 px-4 bg-slate-900">
      {/* Decorative gradients */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">The Solution</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            We Built CGT Brain to Solve
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Exactly These Problems
            </span>
          </h2>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            AI-powered automation meets Australian tax compliance. Here's how we're different:
          </p>
        </motion.div>

        {/* Before/After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
        >
          {/* Old Way */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-xl">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">The Old Way</h3>
            </div>

            <ul className="space-y-4">
              {oldWay.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* New Way */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  The CGT Brain Way
                </h3>
              </div>

              <ul className="space-y-4">
                {newWay.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-full px-6 py-3">
            <span className="text-slate-300">
              <span className="font-semibold text-white">Ready to try it?</span> It's free to start
            </span>
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
