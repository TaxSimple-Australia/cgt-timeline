'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Users, Brain, CheckCircle2, ArrowRight, Calendar, Search, FileCheck } from 'lucide-react';

export default function AIHumanSection() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">

        {/* Section 1: Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-24"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Redefining Property Tax Compliance
            </span>
          </h1>
          <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Selling a property is a milestone — navigating Australian Capital Gains Tax shouldn't take away from that achievement. CGT Brain AI provides homeowners with absolute clarity on their tax exemptions.
          </p>
        </motion.div>

        {/* Section 2: Why Choose Us (3-column) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Choose CGT Brain AI?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Confidence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Confidence</h3>
              <p className="text-slate-300 leading-relaxed">
                We turn complex ATO legislation into actionable insights you can trust. Every calculation is backed by Australian tax law and expert verification.
              </p>
            </motion.div>

            {/* Speed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Speed</h3>
              <p className="text-slate-300 leading-relaxed">
                Our AI-first approach drastically reduces the time it takes to reach a tax determination — from weeks to minutes.
              </p>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Trust</h3>
              <p className="text-slate-300 leading-relaxed">
                By combining machine precision with human accountability, we offer a level of accuracy that traditional methods can't match. Whether you're seeking a full main residence exemption or calculating a partial exemption, we take the guesswork out of the 6-year rule, absence rules, and cost base adjustments.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Section 3: How It Works (Simplified, 3 steps) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Three simple steps to tax certainty
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1: Build Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Build Your Timeline</h3>
                </div>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Provide key property details through our guided interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Track residency periods, rental history, and occupancy</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Our AI guides you to capture every tax-saving detail</span>
                </li>
              </ul>
            </motion.div>

            {/* Step 2: AI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">AI-Powered Analysis</h3>
                </div>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Cross-reference data against latest ATO legislation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Calculate full or partial exemptions automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Identify the most tax-efficient cost base structure</span>
                </li>
              </ul>
            </motion.div>

            {/* Step 3: Expert Review */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Expert Verification</h3>
                </div>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Qualified Australian tax accountant reviews AI findings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Professional judgment applied to complex variables</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>Comprehensive CGT report ready for your tax return</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Section 4: AI + Human Partnership (Consolidated) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            AI + Human Partnership
          </h2>
          <p className="text-slate-400 text-center max-w-3xl mx-auto mb-12">
            We don't believe in "black box" algorithms or slow manual spreadsheets. Our collaborative intelligence model combines the best of both worlds — machine precision with human expertise.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AI Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-6">
                AI-Powered Intelligence
              </h3>

              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Process complex property histories in seconds</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Cross-reference against thousands of ATO tax rulings</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Identify exemption opportunities instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Calculate precise cost base adjustments</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Provide consistent, data-rich analysis every time</span>
                </li>
              </ul>
            </motion.div>

            {/* Human Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-6">
                Expert Human Oversight
              </h3>

              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Qualified Australian tax accountants review every analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Apply professional judgment to complex scenarios</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Validate property valuations and absence claims</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Ensure 100% ATO compliance and accuracy</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-1" />
                  <span>Assume full professional responsibility and indemnity</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Bottom Note */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
              We focus on amplification, not replacement. Our workflow is more agile and data-rich, yet our core remains unchanged: human-led and specialist-verified.
            </p>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
