'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />

      <div className="relative z-10 max-w-4xl mx-auto">
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

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div
                className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl transition-all duration-300 ${
                  openIndex === index
                    ? 'border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                >
                  <span className={`text-lg font-semibold transition-colors ${
                    openIndex === index ? 'text-cyan-400' : 'text-white'
                  }`}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0">
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4" />
                        <p className="text-slate-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
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
