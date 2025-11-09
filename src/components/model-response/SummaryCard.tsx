'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Lightbulb } from 'lucide-react';

interface SummaryCardProps {
  summary: string;
  recommendation?: string;
  delay?: number;
}

export default function SummaryCard({ summary, recommendation, delay = 0 }: SummaryCardProps) {
  // Extract dollar amount from summary if present
  const extractAmount = (text: string): string | null => {
    const match = text.match(/(?:AUD|AU\$|\$)\s*[\d,]+/i);
    return match ? match[0] : null;
  };

  // Extract brief summary from markdown content
  const extractBriefSummary = (text: string): string => {
    // If it's markdown (starts with #), extract the first meaningful paragraph
    if (text.startsWith('#')) {
      // Find the first section after headings
      const lines = text.split('\n');
      let inContent = false;
      let briefText = '';

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip headings and empty lines at the start
        if (!inContent && (trimmed.startsWith('#') || trimmed === '' || trimmed.startsWith('**'))) {
          continue;
        }

        // Start collecting content
        if (!inContent && trimmed !== '') {
          inContent = true;
        }

        if (inContent) {
          briefText += trimmed + ' ';

          // Stop after collecting a reasonable amount (200 chars or first paragraph)
          if (briefText.length > 200 || trimmed === '') {
            break;
          }
        }
      }

      // Clean up markdown syntax
      briefText = briefText
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '')   // Remove italic
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links but keep text
        .replace(/`/g, '')    // Remove code backticks
        .trim();

      // If we got something, return it
      if (briefText.length > 50) {
        return briefText.substring(0, 300) + (briefText.length > 300 ? '...' : '');
      }
    }

    // Otherwise, return the first 300 characters
    return text.substring(0, 300) + (text.length > 300 ? '...' : '');
  };

  const amount = extractAmount(summary);
  const isPositive = summary.toLowerCase().includes('refund') || summary.toLowerCase().includes('credit');
  const displaySummary = extractBriefSummary(summary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden"
    >
      {/* Gradient background card */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-purple-950/30 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        {/* Decorative glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl -z-10" />

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2, type: 'spring' }}
            className={`p-3 rounded-xl ${
              isPositive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            }`}
          >
            {isPositive ? (
              <TrendingDown className="w-6 h-6" />
            ) : (
              <DollarSign className="w-6 h-6" />
            )}
          </motion.div>

          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Your CGT Summary
            </h3>
            {amount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.3 }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3"
              >
                {amount}
              </motion.div>
            )}
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {displaySummary}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Click "View Detailed Report" below to see the full analysis
            </p>
          </div>
        </div>

        {/* Recommendation section */}
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: delay + 0.4 }}
            className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Recommendation
                </h4>
                <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
                  {recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Animated pulse effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 pointer-events-none"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
}
