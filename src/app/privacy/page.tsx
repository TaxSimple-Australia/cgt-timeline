'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronUp, Clock, ChevronRight } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
      <header className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/landing" className="flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-blue-400 transition-all">
                CGT Brain AI Timeline
              </h1>
            </Link>
            <Link
              href="/landing"
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
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-2xl opacity-30" />
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Last Updated: January 2026</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              How we protect your privacy and handle your personal information
            </p>
          </motion.div>

          {/* Privacy Policy Content */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 rounded-2xl" />

              <div className="relative">
                <div className="space-y-6 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">1. Introduction</h3>
                    <p className="leading-relaxed">
                      TAX SIMPLE AUSTRALIA is committed to protecting your privacy. This policy explains how we handle your personal and financial data when you use CGT BRAIN to assess Capital Gains Tax (CGT) exemptions in Australia.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">2. The Types of Data We Collect</h3>
                    <p className="mb-3 leading-relaxed">To provide accurate CGT assessments, we may collect the following:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Identity Data:</strong> Name, email address, and contact details when you create an account.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Financial & Asset Data:</strong> Purchase/sale dates, cost base amounts, asset types (e.g., type of real estate property/dwelling), and residency status.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Usage Data:</strong> IP addresses, device type, and how you interact with the tool.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Sensitive Information:</strong> We generally do not require your Tax File Number (TFN). <span className="font-semibold text-orange-400">Users are advised not to enter TFNs or bank account numbers into the App.</span></span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h3>
                    <p className="mb-3 leading-relaxed">We use your information strictly for the following purposes:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">CGT Assessment:</strong> To process your inputs and determine potential tax exemptions.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">App Improvement:</strong> To analyze de-identified, aggregated data to improve our calculation logic.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Compliance:</strong> To meet our legal and regulatory obligations within Australia.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Support:</strong> To respond to your inquiries or technical issues.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">4. Data Storage and Sovereignty</h3>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Local vs. Cloud Storage:</strong> CGT BRAIN data is uploaded to a local host and cloud server for record storage purposes.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Australian Hosting:</strong> Where possible, we strive to host data on servers located within Australia to ensure it remains subject to Australian privacy protections.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Retention:</strong> We retain your data only as long as necessary to provide the service or as required by law.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">5. Disclosure of Information</h3>
                    <p className="mb-3 leading-relaxed">We do not sell your personal or financial data to third parties. We may only disclose your information:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>With your explicit consent (e.g., if you choose to "Export to my Accountant").</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>To third-party service providers (e.g., cloud hosting) who are contractually bound to protect your data.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>If required by law, such as a valid request from a law enforcement agency or a court order.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">6. Data Security Measures</h3>
                    <p className="mb-3 leading-relaxed">We implement industry-standard security to protect your financial inputs, including:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Encryption:</strong> Data is encrypted both in transit (SSL/TLS) and at rest.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Access Control:</strong> Strict internal policies to ensure only authorized personnel can access system back-ends.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span><strong className="text-white">Anonymization:</strong> Financial data used for analytics is stripped of all personally identifiable information.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">7. Your Rights (Access and Correction)</h3>
                    <p className="mb-3 leading-relaxed">Under the Privacy Act, you have the right to:</p>
                    <ul className="space-y-3 pl-6">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Access the personal information we hold about you.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Request that we correct any inaccurate information.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1.5">•</span>
                        <span>Request the deletion of your account and associated data (the "Right to be Forgotten").</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">8. Changes to this Policy</h3>
                    <p className="leading-relaxed">
                      We may update this policy to reflect changes in Australian law or our data practices. We will notify you of significant changes via the App or email.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">9. Contact Us / Complaints</h3>
                    <p className="leading-relaxed">
                      If you have questions or wish to lodge a complaint about a privacy breach, please contact our Privacy Officer at Tax Simple Australia.
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
            className="flex justify-end mt-12"
          >
            <Link
              href="/terms"
              className="group flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <span className="text-sm font-medium">Next: Terms & Conditions</span>
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
              href="/landing"
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
      <footer className="relative z-10 bg-slate-900/90 backdrop-blur-sm border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} Tax Simple Australia. All rights reserved.</p>
            <p className="mt-2">CGT Brain AI Timeline - Capital Gains Tax Analysis Tool</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
