'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
}

export default function FeatureCard({ icon, title, description, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group"
    >
      {/* Glass card with gradient border */}
      <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-xl">
        {/* Inner glass layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />

        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300" />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300">
            <div className="text-white">
              {icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
            {title}
          </h3>

          {/* Description */}
          <p className="text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
