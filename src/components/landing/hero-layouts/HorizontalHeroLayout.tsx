'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function HorizontalHeroLayout() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 120,
      },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 100,
        delay: 0.3,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 120,
      },
    },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
      },
    },
  };

  const glowFadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="relative w-full h-screen flex items-center overflow-hidden pt-20">
      {/* Dark base background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      {/* Dramatic glow blob from right fading to left */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={glowFadeIn}
      >
        {/* Primary large glow blob - right side */}
        <div
          className="absolute top-1/2 right-0 w-[70%] h-[120%] -translate-y-1/2"
          style={{
            background: 'radial-gradient(ellipse at right center, rgba(6, 182, 212, 0.5) 0%, rgba(59, 130, 246, 0.4) 30%, rgba(56, 189, 248, 0.2) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Secondary glow blob */}
        <div
          className="absolute top-1/2 right-0 w-[60%] h-[100%] -translate-y-1/2"
          style={{
            background: 'radial-gradient(ellipse at right center, rgba(147, 197, 253, 0.6) 0%, rgba(96, 165, 250, 0.4) 40%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        {/* Inner bright glow */}
        <div
          className="absolute top-1/2 right-0 w-[50%] h-[80%] -translate-y-1/2"
          style={{
            background: 'radial-gradient(ellipse at right center, rgba(6, 182, 212, 0.6) 0%, rgba(56, 189, 248, 0.3) 40%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </motion.div>

      {/* Main content wrapper - flex row */}
      <div className="relative z-10 w-full flex items-center">
        {/* Left Side Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex-shrink-0 pl-6 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-24 2xl:pl-32 pr-8 md:pr-12 lg:pr-16 w-[52%] md:w-[48%] lg:w-[45%] xl:w-[48%] 2xl:w-[50%]"
        >
          {/* Badge */}
          <motion.div variants={slideInLeft} className="inline-flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Australian AI Property CGT Calc</span>
            </div>
            <motion.div
              className="w-24 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Headline */}
          <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white leading-[1.2] mb-4 md:mb-6">
            <motion.span variants={slideInLeft} className="block">
              Calculate Your
            </motion.span>
            <motion.span variants={slideInLeft} className="block mt-2">
              Capital Gains Tax
            </motion.span>
            <motion.span
              variants={slideInLeft}
              className="block mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
            >
              in Minutes
            </motion.span>
          </h1>

          {/* Subheading */}
          <motion.p
            variants={fadeInUp}
            className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-slate-300 leading-relaxed mb-4 md:mb-6"
          >
            Visualize your property timeline, track every cost,
            <br />
            and get AI-powered CGT analysis—
            <br />
            <span className="whitespace-nowrap">all in one intuitive platform.</span>
          </motion.p>

          {/* CTA */}
          <motion.div variants={scaleIn}>
            <Link href="/">
              <Button size="lg" className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-5 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6 text-xs md:text-sm lg:text-base shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all">
                Start Building Your Timeline
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicator */}
          <motion.p
            variants={fadeInUp}
            className="text-slate-400 text-sm mt-6"
          >
            Trusted by property investors and tax professionals across Australia
          </motion.p>
        </motion.div>

        {/* Right Side - Dashboard Preview */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideInRight}
          className="hidden md:block flex-1 relative pr-0 mt-16 md:mt-20 lg:mt-24 mb-8 lg:mb-10 xl:mb-12"
        >
          {/* Floating welcome badge above dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, type: 'spring', damping: 20 }}
            className="absolute top-[24px] md:top-[28px] lg:top-[32px] -left-[12px] md:-left-[16px] lg:-left-[18px] px-3 py-2 md:px-4 md:py-2.5 bg-slate-800/80 backdrop-blur-sm border border-cyan-500/40 rounded-xl shadow-lg shadow-cyan-500/20 z-20"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-slate-400">Welcome back</p>
                <p className="text-xs md:text-sm text-white font-medium">Property Investor</p>
              </div>
            </div>
          </motion.div>

          {/* Dashboard card with glow - extends to right edge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.7, type: 'spring', damping: 25 }}
            className="relative rounded-2xl overflow-visible border border-cyan-500/50 bg-slate-900/90 backdrop-blur-xl my-auto h-full flex items-center"
            style={{
              boxShadow: '-8px 0 40px rgba(6, 182, 212, 0.5), 0 -8px 40px rgba(6, 182, 212, 0.5), 0 8px 40px rgba(6, 182, 212, 0.5), 8px 0 40px rgba(6, 182, 212, 0.5), 0 0 60px rgba(6, 182, 212, 0.3)'
            }}
          >
            <div className="relative overflow-hidden w-full max-h-[400px] md:max-h-[450px] lg:max-h-[500px] xl:max-h-[550px]">
              <Image
                src="/landing half .png"
                alt="CGT Timeline Interface Preview"
                width={1200}
                height={600}
                className="w-full h-auto object-cover object-top"
                priority
              />
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent" />
            </div>

            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

            {/* Inner glow border effect */}
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/20 pointer-events-none" />
          </motion.div>

          {/* Floating indicator below dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1, duration: 0.5, type: 'spring', damping: 20 }}
            className="absolute -bottom-4 md:-bottom-5 lg:-bottom-6 left-4 md:left-6 lg:left-8 px-3 py-1.5 md:px-4 md:py-2 bg-slate-800/90 backdrop-blur-sm border border-cyan-500/40 rounded-lg shadow-lg shadow-cyan-500/20"
          >
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] md:text-xs text-slate-300 font-medium">Live CGT Calculation</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Subtle ambient lighting at bottom */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />
    </div>
  );
}
