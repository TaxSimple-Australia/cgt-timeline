'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FAQ_ITEMS } from '@/components/landing/faq-variants/faqData';

export default function NumberedStepsVariant() {
  return (
    <div className="relative">
      {/* Hero */}
      <div className="py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Your top questions, answered one by one.
          </p>
        </motion.div>
      </div>

      {/* Numbered Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-12 relative">
        {/* Connecting vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 hidden md:block" />

        <div className="space-y-12 md:space-y-16">
          {FAQ_ITEMS.map((faq, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isEven ? '35vw' : '-35vw' }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative"
              >
                {/* Connecting dot on the center line (desktop) */}
                <div className="absolute left-1/2 top-8 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 hidden md:block z-10" />

                <div
                  className={cn(
                    'flex flex-col md:flex-row items-start gap-6 md:gap-10',
                    !isEven && 'md:flex-row-reverse'
                  )}
                >
                  {/* Number */}
                  <div
                    className={cn(
                      'flex-shrink-0 md:w-[calc(50%-2rem)]',
                      isEven ? 'md:text-right' : 'md:text-left'
                    )}
                  >
                    <span className="text-7xl md:text-8xl lg:text-9xl font-black bg-gradient-to-br from-cyan-400 to-blue-600 bg-clip-text text-transparent leading-none select-none">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      'flex-1 md:w-[calc(50%-2rem)] bg-slate-200/80 dark:bg-slate-900/80 border border-slate-400/50 dark:border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300',
                      isEven ? 'md:text-left' : 'md:text-left'
                    )}
                  >
                    <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 pb-20"
      >
        <div className="border-t border-slate-400/50 dark:border-slate-700/50 pt-8 space-y-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Still have questions?{' '}
            <Link href="/contact" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 dark:hover:text-cyan-300 underline transition-colors font-medium">
              Contact our support team
            </Link>
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-105"
          >
            Return to CGT Brain AI Timeline
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
