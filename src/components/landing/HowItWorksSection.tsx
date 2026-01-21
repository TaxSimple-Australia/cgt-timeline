'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, FileCheck, ArrowRight } from 'lucide-react';
import ProcessStep from './ProcessStep';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowItWorksSection() {
  const steps = [
    {
      stepNumber: 1,
      title: 'Add Your Properties',
      description: 'Create a visual timeline by adding key events—purchases, sales, moves, and improvements.',
      icon: <Plus className="w-10 h-10" />,
    },
    {
      stepNumber: 2,
      title: 'AI Analyzes Your Data',
      description: 'Our AI engine calculates your CGT obligations, verifies timelines, and identifies potential issues.',
      icon: <Sparkles className="w-10 h-10" />,
    },
    {
      stepNumber: 3,
      title: 'Get Your Report',
      description: 'Export detailed PDF reports with complete calculations and cost base breakdowns for your accountant.',
      icon: <FileCheck className="w-10 h-10" />,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-4 bg-slate-900">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            From timeline to tax report in three simple steps
          </p>
        </motion.div>

        {/* Process steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
          {steps.map((step) => (
            <ProcessStep
              key={step.stepNumber}
              stepNumber={step.stepNumber}
              title={step.title}
              description={step.description}
              icon={step.icon}
              isLast={step.stepNumber === steps.length}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <Link href="/">
            <Button size="lg" className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
