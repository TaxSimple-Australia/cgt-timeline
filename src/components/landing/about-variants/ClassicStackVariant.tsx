'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Users, Brain, CheckCircle2, ArrowRight,
  Calendar, Search, FileCheck, ChevronRight, ChevronDown,
} from 'lucide-react';

export default function ClassicStackVariant() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-200 dark:from-slate-950 via-slate-200 dark:via-slate-900 to-slate-200 dark:to-slate-950">
      <div className="max-w-7xl mx-auto">

        {/* Hero with mascot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row items-center gap-12 mb-24"
        >
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Redefining Property Tax Compliance
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xl max-w-3xl leading-relaxed">
              Selling a property is a milestone — navigating Australian Capital Gains Tax shouldn&apos;t take away from that achievement. CGT Brain AI provides homeowners with absolute clarity on their tax exemptions.
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl" />
            <Image
              src="/robot_new_transparent.webp"
              alt="CGT Brain AI"
              width={280}
              height={280}
              className="relative z-10 drop-shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Gradient separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-24" />

        {/* Why Choose Us - 3 columns with vertical dividers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Why Choose CGT Brain AI?
          </h2>
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-400/50 dark:divide-slate-700/50">
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
                className="flex-1 text-center px-8 py-8 md:py-0 group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Gradient separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-24" />

        {/* AI + Human Partnership */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-12">
            AI + Human Partnership
          </h2>

          {/* Amplification blockquote */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <blockquote className="border-l-4 border-cyan-500 pl-6 py-2 max-w-6xl mx-auto">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify italic">
                The conversation around AI often focuses on replacement. However, at CGT Brain AI, we focus on amplification. We have redesigned the workflow of property tax advice to be more agile and data-rich, yet our core remains unchanged; human-led and specialist-verified. We operate under a strict mandate that no AI response is final until it has been vetted by a tax specialist who assumes full responsibility and indemnity. By combining the efficiency of CGT Brain AI with our established, specialist-led review process, we provide a level of accuracy and security that technology alone cannot achieve.
              </p>
            </blockquote>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AI Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-400 dark:border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">AI-Powered Intelligence</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                {[
                  'Process complex property histories in seconds',
                  'Cross-reference against thousands of ATO tax rulings',
                  'Identify exemption opportunities instantly',
                  'Calculate precise cost base adjustments',
                  'Provide consistent, data-rich analysis every time',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Human Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-400 dark:border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Expert Human Oversight</h3>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                {[
                  'Qualified Australian tax accountants review every analysis',
                  'Apply professional judgment to complex scenarios',
                  'Validate property valuations and absence claims',
                  'Ensure 100% ATO compliance and accuracy',
                  'Assume full professional responsibility and indemnity',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Gradient separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-24" />

        {/* How It Works Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Three simple steps to tax certainty
          </p>

          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-0">
            {[
              { icon: Calendar, title: 'Build Your Timeline', num: 1, bullets: ['Provide key property details through our guided interface', 'Track residency periods, rental history, and occupancy', 'Our AI guides you to capture every tax-saving detail'] },
              { icon: Search, title: 'AI-Powered Analysis', num: 2, bullets: ['Cross-reference data against latest ATO legislation', 'Calculate full or partial exemptions automatically', 'Identify the most tax-efficient cost base structure'] },
              { icon: FileCheck, title: 'Expert Verification', num: 3, bullets: ['Qualified Australian tax accountant reviews AI findings', 'Professional judgment applied to complex variables', 'Comprehensive CGT report ready for your tax return'] },
            ].map((step, i) => (
              <React.Fragment key={step.num}>
                {i > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                    className="flex items-center md:mt-10 my-4 md:my-0 mx-2"
                  >
                    <div className="hidden md:flex items-center">
                      <div className="w-10 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
                      <ChevronRight className="w-5 h-5 text-cyan-400 -ml-1" />
                    </div>
                    <div className="flex md:hidden flex-col items-center">
                      <div className="h-8 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-600" />
                      <ChevronDown className="w-5 h-5 text-cyan-400 -mt-1" />
                    </div>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex flex-col items-center text-center max-w-xs"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <step.icon className="w-9 h-9 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-sm font-bold text-cyan-400">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </React.Fragment>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
