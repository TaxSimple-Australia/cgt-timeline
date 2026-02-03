'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ChevronUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function QualityPolicyPage() {
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
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-blue-400 transition-all">
                CGT Brain AI Timeline
              </h1>
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
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
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">Last Updated: January 2026</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                Quality Policy Statement
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Our commitment to providing accurate and reliable CGT calculations
            </p>
          </motion.div>

          {/* Quality Policy Content */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 rounded-2xl" />

              <div className="relative">
                <div className="space-y-6 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Our Commitment</h3>
                    <p className="leading-relaxed">
                      At CGT BRAIN AUSTRALIA, our mission is to provide Australian taxpayers with the most accurate, secure, and user-friendly Capital Gains Tax (CGT) solutions. We are committed to maintaining a Quality Management System (QMS) that ensures our software meets all statutory requirements and exceeds user expectations for financial precision.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Core Quality Principles</h3>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1.5">•</span>
                        <span><strong className="text-white">Regulatory Accuracy:</strong> We ensure our calculation engines are updated in real-time to reflect the latest ATO rulings and legislative changes.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1.5">•</span>
                        <span><strong className="text-white">Integrity of Logic:</strong> We employ rigorous mathematical verification and "shadow testing" to ensure every CGT event is handled correctly.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1.5">•</span>
                        <span><strong className="text-white">Security & Reliability:</strong> We commit to 99.9% uptime and a "security-first" development lifecycle.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1.5">•</span>
                        <span><strong className="text-white">Continuous Improvement:</strong> We actively solicit feedback from Australian tax professionals and end-users.</span>
                      </li>
                    </ul>
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
            className="flex justify-between items-center mt-12 gap-4"
          >
            <Link
              href="/data-retention"
              className="group flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-sm font-medium">Previous: Data Retention</span>
            </Link>
            <Link
              href="/collection-notice"
              className="group flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <span className="text-sm font-medium">Next: Collection Notice</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
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
            className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            aria-label="Back to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/90 backdrop-blur-sm border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} CGT Brain. All rights reserved.</p>
            <p className="mt-2">CGT Brain AI Timeline - Capital Gains Tax Analysis Tool</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
