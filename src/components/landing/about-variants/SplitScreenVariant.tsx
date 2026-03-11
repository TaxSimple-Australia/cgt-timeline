'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Calendar, Search, FileCheck,
} from 'lucide-react';

export default function SplitScreenVariant() {
  return (
    <section className="relative">

      {/* Section 1: Hero left, Mascot right */}
      <div className="bg-slate-200 dark:bg-slate-950 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Redefining Property Tax Compliance
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xl leading-relaxed">
              Selling a property is a milestone — navigating Australian Capital Gains Tax shouldn&apos;t take away from that achievement. CGT Brain AI provides homeowners with absolute clarity on their tax exemptions.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl" />
              <Image
                src="/robot_new_transparent.webp"
                alt="CGT Brain AI"
                width={320}
                height={320}
                className="relative z-10 drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Section 2: Icon composition left, Why Choose Us right */}
      <div className="bg-slate-100 dark:bg-slate-900 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <Image
              src="/about_section_image.webp"
              alt="Confidence, Speed, and Trust — Why Choose CGT Brain AI"
              width={650}
              height={520}
              className="rounded-2xl shadow-2xl object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">
              Why Choose CGT Brain AI?
            </h2>
            <div className="space-y-6">
              {[
                { title: 'Confidence', text: 'We turn complex ATO legislation into actionable insights you can trust. Every calculation is backed by Australian tax law and expert verification.' },
                { title: 'Speed', text: 'Our AI-first approach drastically reduces the time it takes to reach a tax determination — from weeks to minutes.' },
                { title: 'Trust', text: 'Machine precision meets human accountability, delivering accuracy that traditional methods can\'t match.' },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Section 3: AI/Human cards left, Amplification right */}
      <div className="bg-slate-200 dark:bg-slate-950 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">
              AI + Human Partnership
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
              The conversation around AI often focuses on replacement. However, at CGT Brain AI, we focus on amplification. We have redesigned the workflow of property tax advice to be more agile and data-rich, yet our core remains unchanged; human-led and specialist-verified. We operate under a strict mandate that no AI response is final until it has been vetted by a tax specialist who assumes full responsibility and indemnity. By combining the efficiency of CGT Brain AI with our established, specialist-led review process, we provide a level of accuracy and security that technology alone cannot achieve.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <Image
              src="/ai_and_human.webp"
              alt="AI-Powered Intelligence and Expert Human Oversight infographic"
              width={910}
              height={728}
              className="rounded-2xl shadow-2xl object-contain w-full h-auto"
            />
          </motion.div>
        </div>
      </div>

      {/* Section 4: Vertical stepper left, Mascot right */}
      <div className="bg-slate-100 dark:bg-slate-900 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-10">Three simple steps to tax certainty</p>

            <div className="space-y-8">
              {[
                { icon: Calendar, num: 1, title: 'Build Your Timeline', bullets: ['Provide key property details through our guided interface', 'Track residency periods, rental history, and occupancy', 'Our AI guides you to capture every tax-saving detail'] },
                { icon: Search, num: 2, title: 'AI-Powered Analysis', bullets: ['Cross-reference data against latest ATO legislation', 'Calculate full or partial exemptions automatically', 'Identify the most tax-efficient cost base structure'] },
                { icon: FileCheck, num: 3, title: 'Expert Verification', bullets: ['Qualified Australian tax accountant reviews AI findings', 'Professional judgment applied to complex variables', 'Comprehensive CGT report ready for your tax return'] },
              ].map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    {step.num < 3 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-cyan-500/50 to-transparent mt-2" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-cyan-400 font-bold text-sm">Step {step.num}</span>
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
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl" />
              <Image
                src="/robot_new_transparent.webp"
                alt="CGT Brain AI"
                width={350}
                height={350}
                className="relative z-10 drop-shadow-2xl opacity-80"
              />
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
