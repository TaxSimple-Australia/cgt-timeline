'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Building2, Calendar, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function V4Hero() {
  return (
    <section className="relative h-screen bg-slate-950 flex items-center justify-center overflow-hidden pt-28">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-[50px] font-bold text-white leading-[1.2] tracking-tight"
            >
              <span className="block whitespace-nowrap">Calculate Your Residential</span>
              <span className="block mt-2">Capital Gains Tax</span>
              <span className="block mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                in Minutes
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-[16px] text-slate-400 leading-relaxed max-w-xl"
            >
              Visualize your property timeline, track every cost,
              <br />
              and get AI-powered CGT analysis—
              <br />
              <span className="whitespace-nowrap">all in one intuitive platform.</span>
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/app">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-600 hover:via-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 transition-all rounded-full"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                className="group border-2 border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/50 px-8 py-6 text-base font-semibold transition-all rounded-full"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Side - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            {/* Main dashboard preview with floating effect */}
            <div className="relative">
              <motion.div
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                {/* Very subtle glow underneath */}
                <div className="absolute -inset-8 bg-gradient-to-r from-cyan-500/3 via-blue-500/3 to-cyan-500/3 rounded-3xl blur-3xl" />

                {/* Miniature Property Showcase - Seamless with background */}
                <div className="relative p-8">
                  <div className="aspect-[4/3] relative flex items-center justify-center">
                    <Image
                      src="/miniature.png"
                      alt="3D Property Visualization"
                      width={800}
                      height={600}
                      className="object-contain w-full h-full drop-shadow-2xl"
                      priority
                    />
                  </div>

                  {/* Floating stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/40 rounded-3xl px-4 py-3 shadow-[0_0_20px_rgba(100,116,139,0.15)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800/50 rounded-xl">
                        <Building2 className="w-4 h-4 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Properties Analyzed</p>
                        <p className="text-lg font-bold text-white">1,247</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    className="absolute bottom-6 left-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/40 rounded-3xl px-4 py-3 shadow-[0_0_20px_rgba(100,116,139,0.15)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800/50 rounded-xl">
                        <Calendar className="w-4 h-4 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Average Calculation Time</p>
                        <p className="text-lg font-bold text-white">2.4 min</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
