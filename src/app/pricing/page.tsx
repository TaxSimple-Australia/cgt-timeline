'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, Zap } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Perfect for getting started',
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
      period: 'month',
      description: 'AI-powered CGT analysis',
      icon: Sparkles,
      iconColor: 'text-purple-400',
      features: [
        'Everything in Free',
        'AI-powered CGT calculations',
        'Detailed cost base breakdowns',
        'Main residence exemption analysis',
        'Scenario modeling',
      ],
      cta: 'Start Free Trial',
      ctaLink: '/',
      popular: true,
      gradient: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/30',
      buttonClass: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30',
    },
    {
      name: 'Premium',
      price: '19.99',
      period: 'month',
      description: 'Professional tax agent review',
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
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Choose the perfect plan for your property portfolio. Start free, upgrade as you grow.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
            {plans.map((plan, index) => {
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
                    className={`h-full bg-slate-800/50 backdrop-blur-sm border ${plan.borderColor} rounded-2xl p-8
                              transition-all duration-300 hover:scale-105 hover:shadow-2xl
                              ${plan.popular ? 'scale-105 shadow-2xl shadow-purple-500/20' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-2xl opacity-50`} />

                    <div className="relative">
                      {/* Icon */}
                      <div className="mb-4">
                        <div className={`inline-flex p-3 rounded-xl bg-slate-700/50 ${plan.iconColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>

                      {/* Plan Name */}
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline">
                          <span className="text-5xl font-bold text-white">${plan.price}</span>
                          <span className="text-slate-400 ml-2">/{plan.period}</span>
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
                            <span className="text-slate-300 text-sm">{feature}</span>
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

            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Can I switch plans later?</h3>
                <p className="text-slate-400">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Is there a free trial?</h3>
                <p className="text-slate-400">Yes! Standard and Premium plans come with a 14-day free trial. No credit card required.</p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
                <p className="text-slate-400">We accept all major credit cards, PayPal, and bank transfers for annual subscriptions.</p>
              </div>
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
              <h3 className="text-2xl font-bold text-white">Still have questions?</h3>
              <p className="text-slate-400">Our team is here to help you choose the right plan.</p>
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
