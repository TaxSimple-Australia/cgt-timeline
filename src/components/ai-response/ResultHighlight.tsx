'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, AlertCircle, TrendingUp } from 'lucide-react';

interface ResultHighlightProps {
  property: any;
  calculations?: any;
}

export default function ResultHighlight({
  property,
  calculations,
}: ResultHighlightProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const netCapitalGain = calculations?.net_capital_gain || 0;
  const exemptionPercentage = calculations?.main_residence_exemption?.exemption_percentage || 0;
  const isFullyExempt = exemptionPercentage === 100 || netCapitalGain === 0;
  const isPartialExempt = exemptionPercentage > 0 && exemptionPercentage < 100;
  const hasDiscount = calculations?.cgt_discount?.eligible && !isFullyExempt;

  // Determine result type and styling
  let resultType: 'exempt' | 'partial' | 'taxable' = 'taxable';
  let bgColor = 'bg-blue-50 dark:bg-blue-950/20';
  let borderColor = 'border-blue-500 dark:border-blue-600';
  let textColor = 'text-blue-700 dark:text-blue-300';
  let icon = <TrendingUp className="w-10 h-10" />;

  if (isFullyExempt) {
    resultType = 'exempt';
    bgColor = 'bg-green-50 dark:bg-green-950/20';
    borderColor = 'border-green-500 dark:border-green-600';
    textColor = 'text-green-700 dark:text-green-300';
    icon = <Award className="w-10 h-10" />;
  } else if (isPartialExempt) {
    resultType = 'partial';
    bgColor = 'bg-amber-50 dark:bg-amber-950/20';
    borderColor = 'border-amber-500 dark:border-amber-600';
    textColor = 'text-amber-700 dark:text-amber-300';
    icon = <AlertCircle className="w-10 h-10" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`${bgColor} border-2 ${borderColor} rounded-xl p-5 shadow-lg`}
    >
      <div className="text-center space-y-3">
        {/* Icon */}
        <div className={`flex justify-center ${textColor}`}>
          {icon}
        </div>

        {/* Result Label */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            RESULT
          </h3>

          {/* Main Result */}
          {isFullyExempt ? (
            <div className="space-y-0.5">
              <div className="text-3xl font-black text-green-600 dark:text-green-400">
                NO CGT PAYABLE
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                (FULLY EXEMPT)
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className={`text-3xl font-black ${textColor}`}>
                {formatCurrency(netCapitalGain)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                NET CAPITAL GAIN
              </p>
            </div>
          )}
        </div>

        {/* Breakdown (if partial or taxable) */}
        {!isFullyExempt && (
          <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
              Calculation Summary
            </div>
            <div className="space-y-0.5 text-xs text-gray-700 dark:text-gray-300">
              {calculations?.raw_capital_gain && (
                <div className="flex items-center justify-center gap-2">
                  <span>Capital Gain: {formatCurrency(calculations.raw_capital_gain)}</span>
                </div>
              )}
              {calculations?.main_residence_exemption?.exempt_amount > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <span>− Exemption: {formatCurrency(calculations.main_residence_exemption.exempt_amount)}</span>
                </div>
              )}
              {hasDiscount && calculations?.cgt_discount?.gain_before_discount && (
                <div className="flex items-center justify-center gap-2">
                  <span>− Discount ({calculations.cgt_discount.discount_percentage}%): {formatCurrency(calculations.cgt_discount.gain_before_discount - calculations.cgt_discount.discounted_gain)}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 font-bold pt-1.5 border-t border-gray-300 dark:border-gray-600">
                <span>= Net CGT: {formatCurrency(netCapitalGain)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Context */}
        {isPartialExempt && (
          <div className="pt-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {exemptionPercentage.toFixed(1)}% of capital gain is exempt due to partial main residence use
            </p>
          </div>
        )}

        {isFullyExempt && property?.exemption_reason && (
          <div className="pt-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {property.exemption_reason}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
