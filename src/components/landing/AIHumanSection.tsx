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
            <span className="text-purple-300 text-sm font-medium">AI + Human Expertise</span>
          </div>

          {/* Heading with decorative lines */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500 to-purple-500" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Enhancing, Not Replacing
            </h2>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-purple-500 to-purple-500" />
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* AI Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
              <Brain className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              AI-Powered Analysis
            </h3>

            <p className="text-slate-400 leading-relaxed">
              There is widespread discussion about AI and its potential impact on professional services, with many assuming it will replace traditional roles such as accountants. At CGT BRAIN, we see it very differently. We believe CGT BRAIN AI will enhance, not replace the way accountants conduct property research and prepare advice, making the process faster, more comprehensive, and more accessible, while still relying on expert human judgment at its core.
            </p>
          </motion.div>

          {/* Human Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/40 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Expert Human Oversight
            </h3>

            <p className="text-slate-400 leading-relaxed">
              Every AI-generated response used in a professional setting must be reviewed, verified, and validated by a specialist tax expert who carries the responsibility, indemnities, and liabilities associated with client advice. This is where CGT BRAIN truly excels. Our established review process, supported by specialist tax advisers, is designed to validate CGT BRAIN AI generated outputs as well as traditional case work, ensuring accuracy, compliance, and confidence in every outcome.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
