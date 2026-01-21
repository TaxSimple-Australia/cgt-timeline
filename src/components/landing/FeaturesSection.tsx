'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Brain, DollarSign, AlertCircle } from 'lucide-react';
import FeatureCard from './FeatureCard';

export default function FeaturesSection() {
  const features = [
    {
      icon: <GitBranch className="w-7 h-7" />,
      title: 'Visual Timeline',
      description: 'See your entire property journey at a glance with an interactive, GitHub-style timeline that maps every purchase, sale, and life event.',
    },
    {
      icon: <Brain className="w-7 h-7" />,
      title: 'AI-Powered Analysis',
      description: 'Get instant CGT calculations with detailed breakdowns powered by advanced AI. Understand exactly where every dollar comes from.',
    },
    {
      icon: <DollarSign className="w-7 h-7" />,
      title: 'Cost Base Tracking',
      description: 'Track every dollar that affects your tax obligation—from stamp duty to renovations—across all 5 CGT cost base elements.',
    },
    {
      icon: <AlertCircle className="w-7 h-7" />,
      title: 'Smart Verification',
      description: 'Catch gaps and errors before they cost you. Our verification system alerts you to missing dates, overlapping statuses, and calculation issues.',
    },
  ];

  return (
    <section id="features" className="relative pt-40 pb-24 px-4 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to Calculate CGT
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            No more spreadsheets, no more guesswork. Just accurate, AI-verified calculations.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
