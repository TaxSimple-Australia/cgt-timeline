'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, AlertTriangle, Clock, DollarSign } from 'lucide-react';

export default function ProblemSection() {
  const problems = [
    {
      icon: <FileQuestion className="w-8 h-8" />,
      title: 'Lost Receipts & Records',
      description: 'Digging through years of paperwork to find that one renovation invoice from 2015. Hoping you didn\'t throw it away.',
      color: 'red',
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: 'Confusing ATO Rules',
      description: 'Main residence exemption, 6-year rule, proportional calculations... The tax office speaks a different language.',
      color: 'amber',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Tracking Every Change',
      description: 'Remembering when you moved in, moved out, started renting, renovated the kitchen, replaced the roof... it never ends.',
      color: 'orange',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'The Fear of Getting It Wrong',
      description: 'One mistake = ATO penalties, interest charges, and sleepless nights. Plus your accountant charging $2,000 to fix it.',
      color: 'red',
    },
  ];

  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />

      {/* Decorative gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">The Problem</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Calculating CGT Shouldn't Feel
            <br />
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Like Solving a Puzzle
            </span>
          </h2>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            But for most Australian property owners, it does. Here's what you're probably dealing with:
          </p>
        </motion.div>

        {/* Problems grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`bg-slate-800/50 backdrop-blur-sm border border-${problem.color}-500/20 rounded-2xl p-6 hover:border-${problem.color}-500/40 transition-all duration-300`}>
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${problem.color}-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-${problem.color}-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <span className={`text-${problem.color}-400`}>{problem.icon}</span>
                  </div>

                  {/* Content */}
                  <h3 className={`text-xl font-bold text-white mb-3 group-hover:text-${problem.color}-400 transition-colors duration-300`}>
                    {problem.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${problem.color}-500/10 to-transparent rounded-bl-full opacity-50`} />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
