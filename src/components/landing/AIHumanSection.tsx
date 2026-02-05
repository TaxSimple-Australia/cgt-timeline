'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Shield, Sparkles } from 'lucide-react';

export default function AIHumanSection() {
  return (
    <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative gradient orbs - Purple/Pink theme */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-10 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">About Us</span>
          </div>

          {/* Heading with decorative lines */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500 to-purple-500" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Redefining Property Tax Compliance
            </h2>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-purple-500 to-purple-500" />
          </div>
        </motion.div>

        {/* Main Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <p className="text-slate-300 text-lg leading-relaxed text-center">
            Selling a property is a milestone, navigating the Australian Capital Gains Tax (CGT) landscape shouldn't take away from that achievement. CGT Brain AI is a specialized platform dedicated to providing homeowners with absolute clarity on their tax exemptions.
          </p>
        </motion.div>

        {/* Why CGT Brain AI Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 md:p-12 mb-16"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">
            Why CGT Brain AI?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-400 font-bold text-xl">a</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Confidence</h4>
              <p className="text-slate-400 leading-relaxed">
                We turn complex ATO legislation into actionable insights.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-pink-400 font-bold text-xl">b</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Speed</h4>
              <p className="text-slate-400 leading-relaxed">
                Our AI-first approach drastically reduces the time it takes to reach a tax determination.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-400 font-bold text-xl">c</span>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Trust</h4>
              <p className="text-slate-400 leading-relaxed">
                By combining machine logic with human accountability, we offer a level of precision that traditional methods simply can't match.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Our Focus Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            Our Focus: Your Exemption
          </h3>
          <p className="text-slate-300 text-lg leading-relaxed text-center">
            Whether you are seeking a Full Main Residence Exemption or calculating a Partial Exemption due to a period of income production, we provide the evidence-based roadmap you need. We take the guesswork out of the "6-year rule," "absence rules," and "cost base" adjustments.
          </p>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-20"
        >
          <h3 className="text-4xl font-bold text-white mb-6 text-center">
            How It Works: The Path to Tax Certainty
          </h3>
          <p className="text-slate-300 text-lg leading-relaxed text-center max-w-4xl mx-auto mb-12">
            Getting a definitive answer on your CGT status is a seamless, four-step process designed to provide maximum accuracy with minimum effort.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">Data Input & Discovery</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Start by providing the key details of your property journey through our secure portal. Our AI-guided onboarding asks the right questions about your residency periods, rental history, and the 6-year rule, ensuring no detail that could save you money is overlooked.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">AI-Powered Assessment</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Our Brain AI engine goes to work, cross-referencing your data against the latest ATO legislation and tax frameworks. It calculates potential exemptions (full or partial) and identifies the most tax-efficient "cost base" for your specific scenario.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">Expert Accountant Validation</h4>
                  <p className="text-slate-400 leading-relaxed">
                    This is where we differ from "automated calculators." A qualified Australian tax accountant reviews the AI's findings. They apply professional judgment to complex variables like property valuations or specific "absence" claims, to ensure 100% compliance and precision.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">Your Final Report</h4>
                  <p className="text-slate-400 leading-relaxed">
                    You receive a comprehensive CGT Determination Report. This document clearly outlines whether you are eligible for a full or partial exemption, the reasoning behind the decision, and the exact figures you need for your tax return.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Collaborative Intelligence Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 md:p-12 mb-16"
        >
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            The Power of Collaborative Intelligence
          </h3>
          <p className="text-slate-300 text-lg leading-relaxed mb-8 text-center">
            We don't believe in "black box" algorithms or manual, time-consuming spreadsheets. Instead, we've pioneered a Collaborative Intelligence model:
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-purple-500/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 font-bold">1</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">AI-Driven Analysis</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Our sophisticated AI processes the variables of your property sale dates, usage, and residency status, against the latest Australian tax frameworks.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-6 border border-pink-500/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <span className="text-pink-400 font-bold">2</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">Expert Accountant Oversight</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Technology handles the data, but our tax professionals provide the wisdom. Every assessment is vetted by an expert to ensure it accounts for the unique nuances of your specific case.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhancing, Not Replacing Subsection */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500 to-purple-500" />
              <h4 className="text-2xl md:text-3xl font-bold text-white">
                Enhancing, Not Replacing
              </h4>
              <div className="h-px w-16 bg-gradient-to-l from-transparent via-purple-500 to-purple-500" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AI Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-white" />
              </div>

              <h5 className="text-2xl font-bold text-white mb-4">
                AI-Powered Analysis
              </h5>

              <p className="text-slate-400 leading-relaxed">
                The conversation around AI often focuses on replacement. However, at CGT BRAIN AI, we focus on amplification. We have redesigned the workflow of property tax advice to be more agile and data-rich, yet our core remains unchanged; human-led and specialist-verified.
              </p>
            </motion.div>

            {/* Human Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/40 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>

              <h5 className="text-2xl font-bold text-white mb-4">
                Expert Human Oversight
              </h5>

              <p className="text-slate-400 leading-relaxed">
                We operate under a strict mandate that no AI response is final until it has been vetted by a tax specialist who assumes full responsibility and indemnity. By combining the efficiency of CGT BRAIN AI with our established, specialist-led review process, we provide a level of accuracy and security that technology alone cannot achieve.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
