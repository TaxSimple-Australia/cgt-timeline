'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Users, Brain, CheckCircle2, ArrowRight,
  Calendar, Search, FileCheck,
} from 'lucide-react';

const tile = 'bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-400 dark:border-slate-700 rounded-2xl p-8 hover:border-cyan-500/30 transition-all';

export default function BentoGridVariant() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-200 dark:from-slate-950 via-slate-200 dark:via-slate-900 to-slate-200 dark:to-slate-950">
      <div className="max-w-7xl mx-auto">

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Hero tile (8-col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`${tile} md:col-span-8 flex flex-col justify-center`}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Redefining Property Tax Compliance
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Selling a property is a milestone — navigating Australian Capital Gains Tax shouldn&apos;t take away from that achievement. CGT Brain AI provides homeowners with absolute clarity on their tax exemptions.
            </p>
          </motion.div>

          {/* Mascot tile (4-col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`${tile} md:col-span-4 flex items-center justify-center relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-radial-gradient bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)]" />
            <Image
              src="/robot_new_transparent.webp"
              alt="CGT Brain AI"
              width={220}
              height={220}
              className="relative z-10 drop-shadow-2xl"
            />
          </motion.div>

          {/* 3 Value prop tiles (4-col each) */}
          {[
            { icon: Shield, title: 'Confidence', text: 'We turn complex ATO legislation into actionable insights you can trust. Every calculation is backed by Australian tax law and expert verification.' },
            { icon: Zap, title: 'Speed', text: 'Our AI-first approach drastically reduces the time it takes to reach a tax determination — from weeks to minutes.' },
            { icon: Users, title: 'Trust', text: 'Machine precision meets human accountability, delivering accuracy that traditional methods can\'t match.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className={`${tile} md:col-span-4 group`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.text}</p>
            </motion.div>
          ))}

          {/* AI tile (6-col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`${tile} md:col-span-6`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-5">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">AI-Powered Intelligence</h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300 text-sm">
              {[
                'Process complex property histories in seconds',
                'Cross-reference against thousands of ATO tax rulings',
                'Identify exemption opportunities instantly',
                'Calculate precise cost base adjustments',
                'Provide consistent, data-rich analysis every time',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Human tile (6-col) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`${tile} md:col-span-6`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Expert Human Oversight</h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300 text-sm">
              {[
                'Qualified Australian tax accountants review every analysis',
                'Apply professional judgment to complex scenarios',
                'Validate property valuations and absence claims',
                'Ensure 100% ATO compliance and accuracy',
                'Assume full professional responsibility and indemnity',
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Amplification quote (full-width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`${tile} md:col-span-12 text-center`}
          >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">AI + Human Partnership</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-5xl mx-auto leading-relaxed">
              The conversation around AI often focuses on replacement. However, at CGT Brain AI, we focus on amplification. We have redesigned the workflow of property tax advice to be more agile and data-rich, yet our core remains unchanged; human-led and specialist-verified. We operate under a strict mandate that no AI response is final until it has been vetted by a tax specialist who assumes full responsibility and indemnity.
            </p>
          </motion.div>

          {/* 3 Step tiles (4-col each) */}
          {[
            { icon: Calendar, num: 1, title: 'Build Your Timeline', bullets: ['Provide key property details through our guided interface', 'Track residency periods, rental history, and occupancy', 'Our AI guides you to capture every tax-saving detail'] },
            { icon: Search, num: 2, title: 'AI-Powered Analysis', bullets: ['Cross-reference data against latest ATO legislation', 'Calculate full or partial exemptions automatically', 'Identify the most tax-efficient cost base structure'] },
            { icon: FileCheck, num: 3, title: 'Expert Verification', bullets: ['Qualified Australian tax accountant reviews AI findings', 'Professional judgment applied to complex variables', 'Comprehensive CGT report ready for your tax return'] },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              className={`${tile} md:col-span-4`}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 flex items-center justify-center text-sm font-bold text-cyan-400">
                  {step.num}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{step.title}</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {step.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
