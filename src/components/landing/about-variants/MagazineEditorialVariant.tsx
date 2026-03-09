'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Users, Brain, CheckCircle2, ArrowRight,
  Calendar, Search, FileCheck,
} from 'lucide-react';

export default function MagazineEditorialVariant() {
  return (
    <section className="relative py-24 px-4 bg-slate-950">
      <div className="max-w-6xl mx-auto">

        {/* Hero: Extra-large heading with watermark mascot */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mb-32"
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.07] pointer-events-none hidden lg:block">
            <Image
              src="/robot_new_transparent.webp"
              alt=""
              width={500}
              height={500}
            />
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight max-w-4xl">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Redefining Property Tax Compliance
            </span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl mt-8 max-w-2xl leading-relaxed">
            Selling a property is a milestone — navigating Australian Capital Gains Tax shouldn&apos;t take away from that achievement.
          </p>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-24" />

        {/* Why Choose Us - Giant background numbers */}
        {[
          { num: '01', icon: Shield, title: 'Confidence', text: 'We turn complex ATO legislation into actionable insights you can trust. Every calculation is backed by Australian tax law and expert verification.' },
          { num: '02', icon: Zap, title: 'Speed', text: 'Our AI-first approach drastically reduces the time it takes to reach a tax determination — from weeks to minutes.' },
          { num: '03', icon: Users, title: 'Trust', text: 'Machine precision meets human accountability, delivering accuracy that traditional methods can\'t match.' },
        ].map((item, i) => (
          <motion.div
            key={item.num}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mb-20"
          >
            <span className="absolute -top-8 left-0 text-[120px] font-thin text-slate-800/60 leading-none select-none pointer-events-none">
              {item.num}
            </span>
            <div className="relative z-10 pl-4 md:pl-20 pt-12">
              <div className="flex items-center gap-3 mb-4">
                <item.icon className="w-6 h-6 text-cyan-400" />
                <h3 className="text-3xl font-bold text-white">{item.title}</h3>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">{item.text}</p>
            </div>
          </motion.div>
        ))}

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-24" />

        {/* AI + Human Partnership — asymmetric 60/40 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
            AI + Human Partnership
          </h2>

          {/* Amplification with drop cap */}
          <div className="mb-16">
            <p className="text-slate-400 text-lg leading-relaxed max-w-4xl">
              <span className="float-left text-6xl font-bold text-cyan-400 leading-none mr-3 mt-1">T</span>
              he conversation around AI often focuses on replacement. However, at CGT Brain AI, we focus on amplification. We have redesigned the workflow of property tax advice to be more agile and data-rich, yet our core remains unchanged; human-led and specialist-verified. We operate under a strict mandate that no AI response is final until it has been vetted by a tax specialist who assumes full responsibility and indemnity. By combining the efficiency of CGT Brain AI with our established, specialist-led review process, we provide a level of accuracy and security that technology alone cannot achieve.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* AI - 3 cols */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold text-white">AI-Powered Intelligence</h3>
              </div>
              <ul className="space-y-3 text-slate-300">
                {[
                  'Process complex property histories in seconds',
                  'Cross-reference against thousands of ATO tax rulings',
                  'Identify exemption opportunities instantly',
                  'Calculate precise cost base adjustments',
                  'Provide consistent, data-rich analysis every time',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-1" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Human - 2 cols */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold text-white">Expert Human Oversight</h3>
              </div>
              <ul className="space-y-3 text-slate-300">
                {[
                  'Qualified Australian tax accountants review every analysis',
                  'Apply professional judgment to complex scenarios',
                  'Validate property valuations and absence claims',
                  'Ensure 100% ATO compliance and accuracy',
                  'Assume full professional responsibility and indemnity',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-1" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-24" />

        {/* How It Works - Large typographic blocks */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-slate-500 text-lg mb-16">Three simple steps to tax certainty</p>

          <div className="space-y-20">
            {[
              { icon: Calendar, num: '01', title: 'Build Your Timeline', bullets: ['Provide key property details through our guided interface', 'Track residency periods, rental history, and occupancy', 'Our AI guides you to capture every tax-saving detail'] },
              { icon: Search, num: '02', title: 'AI-Powered Analysis', bullets: ['Cross-reference data against latest ATO legislation', 'Calculate full or partial exemptions automatically', 'Identify the most tax-efficient cost base structure'] },
              { icon: FileCheck, num: '03', title: 'Expert Verification', bullets: ['Qualified Australian tax accountant reviews AI findings', 'Professional judgment applied to complex variables', 'Comprehensive CGT report ready for your tax return'] },
            ].map((step) => (
              <div key={step.num} className="relative">
                <span className="absolute -top-6 right-0 text-[100px] font-thin text-slate-800/50 leading-none select-none pointer-events-none hidden md:block">
                  {step.num}
                </span>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <step.icon className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  </div>
                  <ul className="space-y-2 text-slate-400 max-w-2xl">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
