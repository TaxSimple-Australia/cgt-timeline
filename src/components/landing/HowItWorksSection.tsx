'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 px-4 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500 to-cyan-500" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              How It Works
            </h2>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-cyan-500 to-cyan-500" />
          </div>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            From timeline to tax report in three simple steps
          </p>
        </motion.div>

        {/* Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16 flex flex-col items-center"
        >
          <div className="relative w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl border border-cyan-500/50 shadow-cyan-500/50">
            <Image
              src="/landing.png"
              alt="CGT Timeline Application Screenshot"
              width={960}
              height={540}
              className="w-full h-auto"
              priority
            />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <Link href="/app">
            <Button size="lg" className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all">
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
