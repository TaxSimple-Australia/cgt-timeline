'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronUp, Clock, ChevronLeft } from 'lucide-react';

export default function CollectionNoticePage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white dark:from-slate-900 via-slate-50 dark:via-slate-800 to-white dark:to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white dark:bg-slate-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-blue-400 transition-all">
                CGT Brain AI Timeline
              </h1>
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

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
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Last Updated: January 2026</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Privacy Collection Notice
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Understanding what personal information we collect and how we handle it
            </p>
          </motion.div>

          {/* Collection Notice Content */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 rounded-2xl" />

              <div className="relative">
                <div className="space-y-6 text-slate-600 dark:text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Who is collecting your information?</h3>
                    <p className="leading-relaxed">
                      Your personal and financial information is collected by CGT BRAIN. You can contact our Privacy Officer at{' '}
                      <a href="mailto:info@cgtbrain.com.au" className="text-cyan-400 hover:text-cyan-300 underline">
                        info@cgtbrain.com.au
                      </a>{' '}
                      or{' '}
                      <a href="tel:+61430334344" className="text-cyan-400 hover:text-cyan-300 underline">
                        0430 334 344
                      </a>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Why are we collecting this information?</h3>
                    <p className="mb-3 leading-relaxed">We collect your data primarily to:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Calculate your estimated Capital Gains Tax (CGT) liability based on the assets you report.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Generate compliance reports and tax summaries for your personal records.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Comply with our obligations under the Income Tax Assessment Act 1997 to provide accurate financial tools.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-slate-900 dark:text-white">Automated Processing:</strong> We use automated algorithms to categorize your assets and calculate discounts. You can review or manually override these results at any time.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. What happens if you don't provide it?</h3>
                    <p className="leading-relaxed">
                      If you choose not to provide the requested financial information (such as purchase dates, cost bases, or disposal prices), our software will be unable to generate an accurate CGT estimate, and you may not be able to utilize our reporting or ATO-linked features.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Disclosure to Third Parties</h3>
                    <p className="mb-3 leading-relaxed">We do not sell your personal data. We may disclose your information to:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-slate-900 dark:text-white">The ATO:</strong> Only if you explicitly choose to use our "Direct Lodgement" or "Data Matching" features.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-slate-900 dark:text-white">Authorized Professionals:</strong> Your nominated accountant or tax agent (only with your specific permission).</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-slate-900 dark:text-white">Service Providers:</strong> We use secure cloud hosting services located in Australia / USA / Europe. Where data is stored overseas, we take steps to ensure it is handled in accordance with Australian privacy standards.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Access, Correction, and Complaints</h3>
                    <p className="mb-3 leading-relaxed">
                      Our full{' '}
                      <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">
                        Privacy Policy
                      </Link>{' '}
                      contains detailed information on how you can:
                    </p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Access the personal information we hold about you.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Request a correction to inaccurate data.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Lodge a complaint if you believe we have breached the Australian Privacy Principles.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/30 p-6 rounded-lg mt-6">
                    <h4 className="text-lg font-semibold text-cyan-300 mb-3">Consent</h4>
                    <p className="text-cyan-100 leading-relaxed">
                      By proceeding and entering your data, you acknowledge you have read this notice and consent to the collection and use of your information as described.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Page Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-start mt-12"
          >
            <Link
              href="/quality"
              className="group flex items-center gap-2 px-6 py-3 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-sm font-medium">Previous: Quality Policy</span>
            </Link>
          </motion.div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
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
      <footer className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} CGT Brain. All rights reserved.</p>
            <p className="mt-2">CGT Brain AI Timeline - Capital Gains Tax Analysis Tool</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
