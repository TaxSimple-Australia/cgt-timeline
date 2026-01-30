'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

export default function FinalCTA() {
  const { showModal, handleNavigateToTimeline, handleAccept, handleClose } = useTermsAcceptance();
  const benefits = [
    'No credit card required',
    'Free forever for core features',
    'Export anytime',
    'Australian data hosting',
  ];

  return (
    <section className="relative py-24 px-4 bg-slate-900 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent_50%)]" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Stop Guessing
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              About Your CGT?
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Get your personalized property timeline and AI-verified tax calculations
            in the next 10 minutes—<span className="font-semibold text-white">completely free.</span>
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleNavigateToTimeline}
            size="lg"
            className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-8 text-xl font-semibold shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all duration-300 hover:scale-105"
          >
            Calculate My CGT (Free Forever)
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
          </Button>

          {/* Benefits list */}
          <div className="flex flex-wrap justify-center items-center gap-6 mt-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <div className="flex items-center justify-center w-5 h-5 bg-green-500/20 rounded-full">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Trust reinforcement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-12"
          >
            <div className="inline-block bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-8 py-4">
              <p className="text-slate-400 text-sm">
                Join <span className="font-semibold text-cyan-400">8,700+ Australian property owners</span> who've already simplified their CGT calculations
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Visual element - Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { value: '5 min', label: 'Average setup time' },
            { value: '$0', label: 'To get started' },
            { value: '10,000+', label: 'Properties analyzed' },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showModal}
        onAccept={handleAccept}
        onClose={handleClose}
      />
    </section>
  );
}
