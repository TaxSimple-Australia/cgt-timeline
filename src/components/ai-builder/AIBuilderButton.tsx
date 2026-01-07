'use client';

import React from 'react';
import { MessageSquarePlus, Mic, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AIBuilderButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function AIBuilderButton({ onClick, isOpen }: AIBuilderButtonProps) {
  if (isOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'flex items-center gap-3 px-5 py-3.5',
        'bg-gradient-to-r from-purple-600 to-blue-600',
        'hover:from-purple-700 hover:to-blue-700',
        'text-white font-medium rounded-full',
        'shadow-lg shadow-purple-500/25',
        'transition-all duration-200'
      )}
    >
      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-0"
        animate={{
          opacity: [0, 0.3, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icons */}
      <div className="relative flex items-center gap-1">
        <Sparkles className="w-5 h-5" />
        <Mic className="w-4 h-4 opacity-70" />
      </div>

      {/* Text */}
      <span className="relative">AI Timeline Builder</span>

      {/* Pulse indicator */}
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.button>
  );
}
