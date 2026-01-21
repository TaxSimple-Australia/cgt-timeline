'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProcessStepProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

export default function ProcessStep({ stepNumber, title, description, icon, isLast = false }: ProcessStepProps) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Connecting line to next step */}
      {!isLast && (
        <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" style={{ marginLeft: '50%' }} />
      )}

      {/* Step circle with icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: stepNumber * 0.2 }}
        className="relative z-10 mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
          <div className="text-white">
            {icon}
          </div>
        </div>

        {/* Step number badge */}
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-800 border-2 border-cyan-500 flex items-center justify-center">
          <span className="text-cyan-400 font-bold text-sm">{stepNumber}</span>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: stepNumber * 0.2 + 0.2 }}
      >
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">{description}</p>
      </motion.div>
    </div>
  );
}
