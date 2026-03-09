'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Users, Brain, CheckCircle2, ArrowRight,
  Calendar, Search, FileCheck, Sparkles, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineNode {
  id: string;
  side: 'left' | 'right' | 'full';
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function StoryTimelineVariant() {
  const nodes: TimelineNode[] = [
    {
      id: 'hero',
      side: 'right',
      icon: Sparkles,
      content: (
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Redefining Property Tax Compliance
            </span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Selling a property is a milestone — navigating Australian Capital Gains Tax shouldn&apos;t take away from that achievement. CGT Brain AI provides homeowners with absolute clarity on their tax exemptions.
          </p>
        </div>
      ),
    },
    {
      id: 'mascot',
      side: 'left',
      icon: Brain,
      content: (
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl" />
            <Image
              src="/robot_new_transparent.webp"
              alt="CGT Brain AI"
              width={200}
              height={200}
              className="relative z-10 drop-shadow-2xl"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'confidence',
      side: 'right',
      icon: Shield,
      content: (
        <div>
          <h3 className="text-2xl font-bold text-white mb-3">Confidence</h3>
          <p className="text-slate-300 leading-relaxed">
            We turn complex ATO legislation into actionable insights you can trust. Every calculation is backed by Australian tax law and expert verification.
          </p>
        </div>
      ),
    },
    {
      id: 'speed',
      side: 'left',
      icon: Zap,
      content: (
        <div>
          <h3 className="text-2xl font-bold text-white mb-3">Speed</h3>
          <p className="text-slate-300 leading-relaxed">
            Our AI-first approach drastically reduces the time it takes to reach a tax determination — from weeks to minutes.
          </p>
        </div>
      ),
    },
    {
      id: 'trust',
      side: 'right',
      icon: Users,
      content: (
        <div>
          <h3 className="text-2xl font-bold text-white mb-3">Trust</h3>
          <p className="text-slate-300 leading-relaxed">
            Machine precision meets human accountability, delivering accuracy that traditional methods can&apos;t match.
          </p>
        </div>
      ),
    },
    {
      id: 'ai',
      side: 'left',
      icon: Brain,
      content: (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Intelligence</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            {[
              'Process complex property histories in seconds',
              'Cross-reference against thousands of ATO tax rulings',
              'Identify exemption opportunities instantly',
              'Calculate precise cost base adjustments',
              'Provide consistent, data-rich analysis every time',
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'human',
      side: 'right',
      icon: Shield,
      content: (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">Expert Human Oversight</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            {[
              'Qualified Australian tax accountants review every analysis',
              'Apply professional judgment to complex scenarios',
              'Validate property valuations and absence claims',
              'Ensure 100% ATO compliance and accuracy',
              'Assume full professional responsibility and indemnity',
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'amplification',
      side: 'full',
      icon: Target,
      content: (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">AI + Human Partnership</h2>
          <p className="text-slate-400 max-w-4xl mx-auto leading-relaxed">
            The conversation around AI often focuses on replacement. However, at CGT Brain AI, we focus on amplification. We have redesigned the workflow of property tax advice to be more agile and data-rich, yet our core remains unchanged; human-led and specialist-verified. We operate under a strict mandate that no AI response is final until it has been vetted by a tax specialist who assumes full responsibility and indemnity. By combining the efficiency of CGT Brain AI with our established, specialist-led review process, we provide a level of accuracy and security that technology alone cannot achieve.
          </p>
        </div>
      ),
    },
    {
      id: 'step1',
      side: 'left',
      icon: Calendar,
      content: (
        <div>
          <span className="text-cyan-400 font-bold text-sm">Step 1</span>
          <h3 className="text-xl font-bold text-white mb-3 mt-1">Build Your Timeline</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {['Provide key property details through our guided interface', 'Track residency periods, rental history, and occupancy', 'Our AI guides you to capture every tax-saving detail'].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'step2',
      side: 'right',
      icon: Search,
      content: (
        <div>
          <span className="text-cyan-400 font-bold text-sm">Step 2</span>
          <h3 className="text-xl font-bold text-white mb-3 mt-1">AI-Powered Analysis</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {['Cross-reference data against latest ATO legislation', 'Calculate full or partial exemptions automatically', 'Identify the most tax-efficient cost base structure'].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'step3',
      side: 'left',
      icon: FileCheck,
      content: (
        <div>
          <span className="text-cyan-400 font-bold text-sm">Step 3</span>
          <h3 className="text-xl font-bold text-white mb-3 mt-1">Expert Verification</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {['Qualified Australian tax accountant reviews AI findings', 'Professional judgment applied to complex variables', 'Comprehensive CGT report ready for your tax return'].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto relative">

        {/* Center vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/80 via-blue-500/50 to-cyan-500/80 md:-translate-x-px" />

        {/* Nodes */}
        <div className="space-y-16">
          {nodes.map((node, i) => {
            const Icon = node.icon;

            if (node.side === 'full') {
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative pl-14 md:pl-0"
                >
                  {/* Circle on line */}
                  <div className="absolute left-1 md:left-1/2 top-0 md:-translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center z-10">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:mt-12">
                    {node.content}
                  </div>
                </motion.div>
              );
            }

            const isLeft = node.side === 'left';

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn(
                  'relative pl-14 md:pl-0',
                  'md:grid md:grid-cols-2 md:gap-8'
                )}
              >
                {/* Circle on line */}
                <div className="absolute left-1 md:left-1/2 top-0 md:-translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center z-10">
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Connector line (desktop) */}
                <div className={cn(
                  'hidden md:block absolute top-3.5 h-px w-8 bg-cyan-500/50',
                  isLeft ? 'right-1/2 mr-4' : 'left-1/2 ml-4'
                )} />

                {/* Content card */}
                {isLeft ? (
                  <>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 md:text-right">
                      {node.content}
                    </div>
                    <div className="hidden md:block" />
                  </>
                ) : (
                  <>
                    <div className="hidden md:block" />
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                      {node.content}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Final CTA with mascot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-2xl" />
            <Image
              src="/robot_new_transparent.webp"
              alt="CGT Brain AI"
              width={120}
              height={120}
              className="relative z-10 drop-shadow-xl"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
