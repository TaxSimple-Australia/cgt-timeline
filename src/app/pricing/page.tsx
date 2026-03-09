'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Shield, Zap, ChevronDown } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const reportOptions = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Unlimited timeline planning',
      icon: Zap,
      iconColor: 'text-cyan-400',
      features: [
        'Create unlimited timelines',
        'Visual timeline builder',
        'Property tracking',
        'Event management',
      ],
      cta: 'Get Started',
      ctaLink: '/',
      popular: false,
      gradient: 'from-cyan-500/10 to-blue-500/10',
      borderColor: 'border-cyan-500/20',
      buttonClass: 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10',
    },
    {
      name: 'Standard',
      price: '9.99',
      period: 'report',
      description: 'Professional CGT reports on demand',
      icon: Sparkles,
      iconColor: 'text-purple-400',
      features: [
        'Everything in Free',
        'First 5 reports free',
        'AI-powered CGT calculations',
        'Detailed cost base breakdowns',
        'Main residence exemption analysis',
        'Scenario modeling',
      ],
      cta: 'Get Your First Report',
      ctaLink: '/',
      popular: true,
      gradient: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      buttonClass: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30',
    },
    {
      name: 'Premium',
      price: '19.99',
      period: 'report',
      description: 'Expert-reviewed, ATO-ready reports',
      icon: Shield,
      iconColor: 'text-blue-400',
      features: [
        'Everything in Standard',
        'Tax agent review & certification',
        'Compliance verification',
        'ATO-ready reports',
        'Priority support (24h response)',
        'Dedicated account manager',
        'Custom reporting',
      ],
      cta: 'Contact Sales',
      ctaLink: '/contact',
      popular: false,
      gradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      buttonClass: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 dark:from-slate-900 via-gray-100 dark:via-slate-800 to-gray-50 dark:to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Header */}
      <LandingHeader />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-slate-400 max-w-3xl mx-auto">
              Build unlimited timelines for free. Only pay when you need a professional CGT report.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
            {reportOptions.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div
                    className={`h-full bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm border ${plan.borderColor} rounded-2xl p-8
                              transition-all duration-300 hover:scale-105 hover:shadow-2xl
                              ${plan.popular ? 'scale-105 shadow-2xl shadow-purple-500/20' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-2xl opacity-50`} />

                    <div className="relative">
                      {/* Icon */}
                      <div className="mb-4">
                        <div className={`inline-flex p-3 rounded-xl bg-gray-200/50 dark:bg-slate-700/50 ${plan.iconColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>

                      {/* Plan Name */}
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{plan.description}</p>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline">
                          <span className="text-5xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                          <span className="text-gray-500 dark:text-slate-400 ml-2">/{plan.period}</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Link href={plan.ctaLink}>
                        <button
                          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300
                                    ${plan.popular ? plan.buttonClass : `border ${plan.buttonClass}`}`}
                        >
                          {plan.cta}
                        </button>
                      </Link>

                      {/* Features */}
                      <ul className="mt-8 space-y-4">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 dark:text-slate-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {[
                {
                  question: 'How does pay-per-report work?',
                  answer: "There's no subscription required. Build unlimited timelines for free using our visual timeline builder. When you need a professional CGT calculation, simply choose Standard ($9.99) or Premium ($19.99) for that specific report. Your first 5 Standard reports are completely free."
                },
                {
                  question: 'Can I try it before paying?',
                  answer: 'Absolutely! The visual timeline builder, property tracking, and all planning features are 100% free forever. Plus, you get your first 5 Standard reports at no cost. You only pay when you need additional AI-powered CGT reports.'
                },
                {
                  question: "What's the difference between Standard and Premium reports?",
                  answer: 'Standard ($9.99) includes AI-powered CGT calculations, detailed cost base breakdowns, and scenario modeling. Premium ($19.99) adds professional tax agent review, compliance certification, ATO-ready documentation, and priority support.'
                },
                {
                  question: 'What payment methods do you accept?',
                  answer: 'We accept all major credit cards and PayPal. Payment is processed securely at the time you generate each report.'
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  className="relative group"
                >
                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />

                  <div
                    className={cn(
                      "relative bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300",
                      openFaqIndex === index
                        ? "border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                        : "border border-gray-300/50 dark:border-slate-700/50 hover:border-gray-400/70 dark:hover:border-slate-600/70"
                    )}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className={cn(
                        "relative w-full p-6 text-left flex items-center justify-between transition-all duration-300 ease-out",
                        "hover:bg-gray-200/40 dark:hover:bg-slate-700/40 active:scale-[0.99]",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
                        openFaqIndex === index && "bg-gray-200/20 dark:bg-slate-700/20"
                      )}
                      aria-expanded={openFaqIndex === index}
                      aria-controls={`faq-answer-${index}`}
                      tabIndex={0}
                    >
                      <div className="flex items-center flex-1 pr-4">
                        {/* Number indicator */}
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mr-4 transition-all duration-300 flex-shrink-0",
                          openFaqIndex === index
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                            : "bg-gray-200/50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 group-hover:bg-gray-300/50 dark:group-hover:bg-slate-600/50 group-hover:text-gray-600 dark:group-hover:text-slate-300"
                        )}>
                          {index + 1}
                        </span>

                        <h3 className={cn(
                          "text-lg sm:text-xl font-semibold transition-colors duration-300 leading-tight",
                          openFaqIndex === index
                            ? "text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text"
                            : "text-gray-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-100"
                        )}>
                          {faq.question}
                        </h3>
                      </div>

                      {/* Icon with circular background */}
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        openFaqIndex === index
                          ? "bg-cyan-500/20 text-cyan-400 rotate-180 shadow-inner"
                          : "bg-gray-200/50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 group-hover:bg-gray-300/50 dark:group-hover:bg-slate-600/50 group-hover:text-gray-600 dark:group-hover:text-slate-300"
                      )}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    <AnimatePresence mode="wait">
                      {openFaqIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, y: -10 }}
                          animate={{ height: 'auto', opacity: 1, y: 0 }}
                          exit={{ height: 0, opacity: 0, y: -10 }}
                          transition={{
                            height: { duration: 0.35, ease: [0.4, 0.0, 0.2, 1] },
                            opacity: { duration: 0.25, ease: 'easeOut' },
                            y: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
                          }}
                          className="overflow-hidden border-t border-gray-300/50 dark:border-slate-700/50"
                          id={`faq-answer-${index}`}
                          role="region"
                        >
                          <p className="px-6 py-5 ml-11 text-gray-600 dark:text-slate-300 text-[15px] leading-relaxed">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-20"
          >
            <div className="inline-flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Still have questions?</h3>
              <p className="text-gray-500 dark:text-slate-400">Our team is here to help you choose the right report option.</p>
              <Link href="/contact">
                <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all">
                  Contact Sales
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}
