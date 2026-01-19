'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

interface LandingPageButtonProps {
  onOpenLanding: () => void;
}

export default function LandingPageButton({ onOpenLanding }: LandingPageButtonProps) {
  return (
    <motion.button
      onClick={onOpenLanding}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 left-[120px] z-40 w-10 h-10 rounded-full shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center transition-all duration-300"
      title="Open Landing Page"
    >
      <Home className="w-5 h-5 text-white" />
    </motion.button>
  );
}
