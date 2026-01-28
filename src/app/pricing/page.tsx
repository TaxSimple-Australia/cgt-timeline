'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Users,
  Building,
  Sparkles,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const pricingTiers = [
    {
      icon: Users,
      title: 'Individual Advisers',
      description: 'Perfect for solo practitioners and small practices',
      features: [
        'Single user access',
        'All core features included',
        'Email support',
        'Monthly or annual billing',
      ],
    },
    {
      icon: Building,
      title: 'Enterprise',
      description: 'Tailored solutions for larger firms',
      features: [
        'Multiple user licenses',
        'Custom integrations',
        'Priority support',
        'Dedicated account manager',
        'Volume discounts',
        'Custom training sessions',
      ],
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <LandingHeader />

      {/* Pricing Tiers */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">Pricing</span>
            </div>

            {/* Heading with decorative lines */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500 to-cyan-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Choose Your Plan
              </h1>
              <div className="h-px w-16 bg-gradient-to-l from-transparent via-cyan-500 to-cyan-500" />
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`p-8 rounded-2xl border ${
                    tier.highlighted
                      ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                      : 'bg-slate-800/50 border-slate-700'
                  } hover:border-cyan-500/50 transition-all`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${
                      tier.highlighted
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                        : 'bg-slate-700'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{tier.title}</h3>
                      {tier.highlighted && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400">
                          <Sparkles className="w-3 h-3" />
                          Most Popular
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 mb-6">{tier.description}</p>

                  <div className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/contact" className="block">
                    <Button
                      className={`w-full ${
                        tier.highlighted
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      Contact for Pricing
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
