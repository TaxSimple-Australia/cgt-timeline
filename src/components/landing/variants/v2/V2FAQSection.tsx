'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

export default function V2FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const faqs = [
    {
      question: 'Can I trust AI with my taxes?',
      answer: 'Absolutely. Our AI is trained on thousands of ATO guidelines and CGT scenarios. Every calculation is transparent and verifiable—you can see exactly how we arrived at each number. Plus, you can export everything for your accountant to review. Think of CGT Brain as your first draft that professionals can validate.',
    },
    {
      question: 'What if I have complex property history?',
      answer: 'Perfect! CGT Brain excels at complex scenarios. We handle subdivisions, renovations, mixed-use properties (living + renting), multiple ownership periods, and even partial main residence exemptions. The more complex your situation, the more value you get from our automated tracking.',
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Yes. Your data is encrypted both in transit (SSL/TLS) and at rest. We host on Australian servers to ensure compliance with the Privacy Act 1988. We never sell your data, and you can delete your account anytime. You own your data—export it, share it with your accountant, or delete it whenever you want.',
    },
    {
      question: 'How accurate are the calculations?',
      answer: 'Our AI is trained on ATO tax rulings and verified against thousands of real property scenarios. While we can\'t provide tax advice (we\'re not registered tax agents), our calculations follow ATO guidelines precisely. That\'s why accountants use CGT Brain to reduce their billable hours—it does the heavy lifting accurately.',
    },
    {
      question: 'Can my accountant use this?',
      answer: 'Yes! Many tax professionals use CGT Brain to streamline client work. You can export detailed PDF reports with complete audit trails, calculation breakdowns, and cost base summaries. Your accountant gets a professional report instead of messy spreadsheets, saving them (and you) time.',
    },
    {
      question: 'What does it cost?',
      answer: 'CGT Brain is free to start. You can build your timeline, get AI analysis, and explore all features at no cost. We\'re building paid premium features for power users (bulk exports, advanced integrations), but the core CGT calculator will always remain free. No credit card required to start.',
    },
    {
      question: 'What if I made a mistake years ago?',
      answer: 'That\'s the beauty of a visual timeline. CGT Brain helps you identify gaps, overlaps, and inconsistencies. If you realize you missed a renovation or forgot to log a period of vacancy, you can add it retroactively. The AI recalculates everything instantly.',
    },
    {
      question: 'Do I need to be a tax expert to use this?',
      answer: 'Not at all. CGT Brain is designed for everyday property owners. We use plain English, not tax jargon. Our verification system alerts you to potential issues before they become problems. That said, we always recommend getting professional advice for final lodgement—CGT Brain makes that conversation much more productive.',
    },
  ];

  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Frequently Asked Questions</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Got Questions?
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              We've Got Answers
            </span>
          </h2>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about CGT Brain
          </p>
        </motion.div>

        {/* Horizontal FAQ Layout - Questions Left, Answers Right */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Side - Questions List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:w-[40%] space-y-2"
          >
            {faqs.map((faq, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 ${
                  activeIndex === index
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                }`}
              >
                <span
                  className={`text-base font-medium transition-colors ${
                    activeIndex === index ? 'text-cyan-400' : 'text-slate-300'
                  }`}
                >
                  {faq.question}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Right Side - Active Answer */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:w-[60%]"
          >
            <div
              className="sticky top-24 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 min-h-[300px]"
              style={{
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.15), 0 0 40px rgba(6, 182, 212, 0.1), inset 0 1px 0 rgba(6, 182, 212, 0.1)'
              }}
            >
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-semibold text-white mb-6">
                  {faqs[activeIndex].question}
                </h3>
                <div className="h-px bg-gradient-to-r from-cyan-500/50 via-blue-500/30 to-transparent mb-6" />
                <p className="text-lg text-slate-300 leading-relaxed">
                  {faqs[activeIndex].answer}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400">
            Still have questions?{' '}
            <a href="/contact" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
