'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICING_PLANS, FEATURE_CATEGORIES } from '@/components/landing/pricing-variants/pricingData';

export default function ComparisonTableVariant() {
  return (
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
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Build unlimited timelines for free. Only pay when you need a professional CGT report.
          </p>
        </motion.div>

        {/* Plan Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20">
          {PRICING_PLANS.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    'text-center p-6 rounded-2xl border transition-all duration-300',
                    'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
                    plan.popular && 'shadow-xl shadow-purple-500/20 ring-2 ring-purple-500/30 border-purple-500/30'
                  )}
                >
                  <div className={cn('inline-flex p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 mb-3', plan.iconColor)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">{plan.description}</p>
                  <div className="flex items-baseline justify-center mb-5">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-1 text-sm">/{plan.period}</span>
                  </div>
                  <Link href={plan.ctaLink}>
                    <button
                      className={cn(
                        'w-full py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-300',
                        plan.popular ? plan.buttonClass : `border ${plan.buttonClass}`
                      )}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-5xl mx-auto mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Feature Comparison
          </h2>

          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg">
            {/* Table Header */}
            <div className="sticky top-16 z-20 bg-slate-200 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
              <div className="grid grid-cols-4 gap-4 px-6 py-4">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Feature</div>
                {PRICING_PLANS.map((plan) => (
                  <div key={plan.name} className="text-center">
                    <span
                      className={cn(
                        'text-sm font-bold',
                        plan.popular ? 'text-purple-600 dark:text-purple-400' : 'text-slate-800 dark:text-white'
                      )}
                    >
                      {plan.name}
                    </span>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      ${plan.price}/{plan.period}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Body */}
            {FEATURE_CATEGORIES.map((category, catIndex) => (
              <div key={category.category}>
                {/* Category Header */}
                <div className="bg-slate-200/80 dark:bg-slate-900/80 px-6 py-3 border-y border-slate-300/70 dark:border-slate-700/70">
                  <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    {category.category}
                  </span>
                </div>

                {/* Feature Rows */}
                {category.features.map((feature, featureIndex) => {
                  const isEvenRow = featureIndex % 2 === 0;
                  return (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: catIndex * 0.1 + featureIndex * 0.03 }}
                      className={cn(
                        'grid grid-cols-4 gap-4 px-6 py-3.5 border-b border-slate-200 dark:border-slate-700/50 transition-colors hover:bg-cyan-500/5',
                        isEvenRow
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : 'bg-slate-200/50 dark:bg-slate-800/60'
                      )}
                    >
                      <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature.name}</div>
                      {[feature.free, feature.standard, feature.premium].map((included, i) => (
                        <div key={i} className="flex justify-center">
                          {included ? (
                            <div className="w-7 h-7 rounded-full bg-green-500/15 dark:bg-green-500/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <Minus className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center gap-4 p-8 bg-slate-100 dark:bg-slate-800/80 border border-cyan-500/20 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Still have questions?</h3>
            <p className="text-slate-600 dark:text-slate-400">Our team is here to help you choose the right report option.</p>
            <Link href="/contact">
              <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all">
                Contact Sales
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
