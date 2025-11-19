'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Home, Award } from 'lucide-react';

interface CGTSummaryCardProps {
  summary: {
    cgt_liability?: number;
    total_capital_gain?: number | null;
    total_capital_loss?: number | null;
    net_capital_gain_after_loss?: number | null;
    confidence_score?: number;
    exemption_percentage?: number;
  };
}

export default function CGTSummaryCard({ summary }: CGTSummaryCardProps) {
  const {
    cgt_liability = 0,
    total_capital_gain,
    total_capital_loss,
    net_capital_gain_after_loss,
    confidence_score = 0,
    exemption_percentage = 0
  } = summary;

  const capitalChange = net_capital_gain_after_loss || total_capital_gain || total_capital_loss || 0;
  const isGain = capitalChange > 0;
  const isLoss = capitalChange < 0;

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-blue-500 to-indigo-600';
    if (score >= 50) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg"
    >
      {/* Main CGT Liability */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Total CGT Liability
          </h2>
        </div>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-5xl font-bold text-gray-900 dark:text-gray-100"
        >
          {formatCurrency(cgt_liability)}
        </motion.div>
        {cgt_liability === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            ✨ No CGT payable - properties are exempt or resulted in a loss
          </p>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Capital Gain/Loss */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            {isGain ? (
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : isLoss ? (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : (
              <DollarSign className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              Capital {isGain ? 'Gain' : isLoss ? 'Loss' : 'Change'}
            </span>
          </div>
          <div className={`text-2xl font-bold ${
            isGain ? 'text-green-600 dark:text-green-400' :
            isLoss ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {isLoss && '−'}{formatCurrency(capitalChange)}
          </div>
        </div>

        {/* Exemption Percentage */}
        {exemption_percentage > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Avg Exemption
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {exemption_percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Main residence
            </p>
          </div>
        )}

        {/* Confidence Score */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
              Confidence
            </span>
          </div>
          <div className={`text-2xl font-bold ${getConfidenceColor(confidence_score)}`}>
            {confidence_score}%
          </div>
          <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence_score}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getConfidenceBg(confidence_score)}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
