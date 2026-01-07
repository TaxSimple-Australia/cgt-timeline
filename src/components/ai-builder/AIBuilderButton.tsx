'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
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
        'fixed bottom-8 right-20 z-40',
        'flex items-center gap-1.5 px-3 py-2',
        'bg-gradient-to-br from-purple-600 to-blue-600',
        'hover:from-purple-700 hover:to-blue-700',
        'text-white text-sm font-medium rounded-full',
        'shadow-lg shadow-purple-500/25',
        'transition-all duration-300'
      )}
      title="AI Timeline Builder"
    >
      <Sparkles className="w-4 h-4" />
      <span>AI Timeline Builder</span>

      {/* Pulse indicator */}
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"
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
