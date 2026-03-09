'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ChevronUp, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataRetentionPage() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 dark:from-slate-900 via-gray-100 dark:via-slate-800 to-gray-50 dark:to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-800 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-blue-400 transition-all">
                CGT Brain AI Timeline
              </h1>
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
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
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-30" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                <Database className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Last Updated: January 2026</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Data Retention and Deletion
              </span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
              How we handle and retain your data in compliance with Australian regulations
            </p>
          </motion.div>

          {/* Data Retention Content */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 rounded-2xl" />

              <div className="relative">
                <div className="space-y-6 text-gray-600 dark:text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Retention Overview</h3>
                    <p className="leading-relaxed">
                      We retain your data only for as long as is necessary to provide our services, comply with Australian legal obligations, resolve disputes, and enforce our agreements. Because CGT BRAIN handles tax-related information, our retention periods are primarily driven by the requirements of the Australian Taxation Office (ATO).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Statutory Retention Periods</h3>
                    <p className="mb-4 leading-relaxed">In accordance with Australian tax and corporate law, the following retention schedules apply:</p>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gray-200/50 dark:bg-slate-700/50">
                            <th className="border border-gray-300 dark:border-slate-700 px-4 py-3 text-left text-gray-900 dark:text-white font-semibold">Data Type</th>
                            <th className="border border-gray-300 dark:border-slate-700 px-4 py-3 text-left text-gray-900 dark:text-white font-semibold">Retention Period</th>
                            <th className="border border-gray-300 dark:border-slate-700 px-4 py-3 text-left text-gray-900 dark:text-white font-semibold">Legal Basis</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-200/30 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Active Asset Records</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Duration of ownership + 5 years</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Income Tax Assessment Act 1997</td>
                          </tr>
                          <tr className="bg-gray-200/20 dark:bg-slate-700/20 hover:bg-gray-200/30 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Disposed Asset Records</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">5 years from date of tax lodgement</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">ATO Record Keeping Rules</td>
                          </tr>
                          <tr className="hover:bg-gray-200/30 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Capital Loss Records</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">5 years after the loss is fully applied</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">ATO Review Period Rules</td>
                          </tr>
                          <tr className="bg-gray-200/20 dark:bg-slate-700/20 hover:bg-gray-200/30 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Identification (KYC) Data</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">7 years after account closure</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Anti-Money Laundering (AML/CTF) Act</td>
                          </tr>
                          <tr className="hover:bg-gray-200/30 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Technical/Analytics Logs</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">12 to 24 months</td>
                            <td className="border border-gray-300 dark:border-slate-700 px-4 py-3">Internal Security & Fraud Prevention</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Account Closure and "Soft Deletion"</h3>
                    <p className="mb-3 leading-relaxed">When you choose to close your account:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-green-400 mt-1.5">•</span>
                        <span><strong className="text-gray-900 dark:text-white">Immediate Access Cessation:</strong> Your ability to log in and view data will be revoked immediately.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-400 mt-1.5">•</span>
                        <span><strong className="text-gray-900 dark:text-white">De-identification:</strong> We will remove your personal identifiers (e.g., name, phone number) from our active marketing and customer service databases within 30 days.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-400 mt-1.5">•</span>
                        <span><strong className="text-gray-900 dark:text-white">Secure Archival:</strong> Your financial transaction data will be moved to an encrypted "Cold Storage" archive. This data is not used for any commercial purpose and is held solely to fulfill statutory tax record-keeping requirements or to assist you in the event of an ATO audit.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Right to Erasure (Deletion Requests)</h3>
                    <p className="mb-3 leading-relaxed">You may request the deletion of your data at any time. However, please note:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-green-400 mt-1.5">•</span>
                        <span><strong className="text-gray-900 dark:text-white">Legal Overrides:</strong> Under Australian Privacy Principle 11.2, we are not required to destroy or de-identify information if we are "required by or under an Australian law" to retain it.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-400 mt-1.5">•</span>
                        <span><strong className="text-gray-900 dark:text-white">Refusal of Deletion:</strong> If you request deletion of records related to an asset sold within the last 5 years, we may refuse the request to ensure you remain compliant with the ATO. In such cases, we will provide you with a written explanation for the refusal.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Secure Disposal Methods</h3>
                    <p className="mb-3 leading-relaxed">Once the statutory retention period has expired:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-green-400 mt-1.5">•</span>
                        <span><strong className="text-gray-900 dark:text-white">Digital Deletion:</strong> Data is purged using secure software deletion methods that ensure the information cannot be reconstructed.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-400 mt-1.5">•</span>
                        <span><strong className="text-gray-900 dark:text-white">Third-Party Providers:</strong> We ensure our cloud service providers (e.g., AWS/Azure Australia) adhere to the same permanent disposal standards.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-lg mt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-300 mb-2">Important Note for Users</h4>
                        <p className="text-red-200 leading-relaxed">
                          Deleting your data from CGT BRAIN does not absolve you of your personal legal obligation to maintain tax records. We strongly recommend downloading all CGT Summary Reports and Transaction Histories before requesting account deletion.
                        </p>
                      </div>
                    </div>
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
              href="/terms"
              className="group flex items-center gap-2 px-6 py-3 bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-green-500/30 hover:border-green-500/50 rounded-full text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-sm font-medium">Previous: Terms & Conditions</span>
            </Link>
            <Link
              href="/quality"
              className="group flex items-center gap-2 px-6 py-3 bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-green-500/30 hover:border-green-500/50 rounded-full text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-105"
            >
              <span className="text-sm font-medium">Next: Quality Policy</span>
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
            className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
            aria-label="Back to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} CGT Brain. All rights reserved.</p>
            <p className="mt-2">CGT Brain AI Timeline - Capital Gains Tax Analysis Tool</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
