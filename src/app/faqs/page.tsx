'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

export default function FAQsPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <LandingHeader />

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 flex flex-col items-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-2xl opacity-30" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full">
                <HelpCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Everything you need to know about CGT Brain—from accuracy and security to pricing and professional use
            </p>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 mb-12"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div
                  className={`bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border rounded-2xl transition-all duration-300 ${
                    openIndex === index
                      ? 'border-cyan-500/50 shadow-2xl shadow-cyan-500/20'
                      : 'border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10'
                  }`}
                >
                  {/* Question */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                  >
                    <span className={`text-base md:text-lg font-semibold transition-colors ${
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
                          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-4" />
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
          </motion.section>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12 p-8 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl"
          >
            <p className="text-lg text-slate-300 mb-4">
              Still have questions?
            </p>
            <p className="text-slate-400">
              Contact our support team at{' '}
              <a href="mailto:support@cgtbrain.com.au" className="text-cyan-400 hover:text-cyan-300 underline transition-colors font-medium">
                support@cgtbrain.com.au
              </a>
            </p>
          </motion.div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
            >
              Return to CGT Brain AI Timeline
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
            aria-label="Back to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
