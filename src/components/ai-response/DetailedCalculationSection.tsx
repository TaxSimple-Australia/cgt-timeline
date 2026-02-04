'use client';

import React from 'react';
import { Calculator } from 'lucide-react';
import { PropertyAnalysis } from '@/types/model-response';
import { formatCurrency } from '@/lib/utils';

interface DetailedCalculationSectionProps {
  property: PropertyAnalysis;
}

// Helper function to format currency from string or number
function formatAmount(amount: string | number | undefined): string {
  if (amount === undefined || amount === null) return '$0';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return formatCurrency(numAmount);
}

// Helper function to format number with commas
function formatNumber(num: number | string): string {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  return numValue.toLocaleString('en-US');
}

export default function DetailedCalculationSection({
  property,
}: DetailedCalculationSectionProps) {
  const costBaseItems = property.cost_base_items || [];
  const calculationSteps = property.calculation_steps || [];
  const summary = property.calculation_summary;
  const taxBrackets = summary?.tax_on_cgt?.all_brackets || [];

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-green-700 dark:text-green-400">
          💰 O3. CGT Calculation
        </span>
      </div>

      {/* Cost Base */}
      {costBaseItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Cost Base
          </h4>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-4 bg-white dark:bg-gray-800">
            {/* Grid of cost items */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {costBaseItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col"
                >
                  <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {item.description}
                  </span>
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {formatAmount(item.amount)}
                  </span>
                </div>
              ))}
            </div>
            {/* Total Row */}
            <div className="flex items-center justify-between pt-4 border-t border-green-200 dark:border-green-700">
              <span className="text-sm font-bold text-green-900 dark:text-green-100">
                Total Cost Base
              </span>
              <span className="text-base font-mono font-bold text-green-900 dark:text-green-100">
                {formatAmount(property.total_cost_base)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Steps */}
      {calculationSteps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Calculation Steps
          </h4>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {calculationSteps.map((step, index) => (
              <div key={index} className="py-5 first:pt-0">
                <div className="flex items-start gap-6">
                  {/* Step label - fixed width, colored */}
                  <span className="font-bold text-purple-600 dark:text-purple-400 w-16 flex-shrink-0">
                    Step {step.step_number}
                  </span>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    {/* Title with underline */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                      <h5 className="font-bold text-gray-900 dark:text-white">
                        {step.title}
                      </h5>
                    </div>

                    {/* Description */}
                    {step.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                        {step.description}
                      </p>
                    )}

                    {/* Calculation */}
                    {step.calculation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded">
                        {step.calculation}
                      </p>
                    )}

                    {/* Result pill */}
                    <div className="inline-flex">
                      <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-full text-sm font-semibold">
                        {step.result}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CGT Calculation Summary */}
      {summary && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            CGT Calculation Summary
          </h4>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-4 bg-white dark:bg-gray-800">
            {/* Grid of calculation steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sale Price */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Sale Price (Capital Proceeds)
                </span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                  {formatAmount(summary.sale_price)}
                </span>
              </div>

              {/* Less: Total Cost Base */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Less: Total Cost Base
                </span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                  ({formatAmount(summary.total_cost_base)})
                </span>
              </div>

              {/* Gross Capital Gain - Highlighted */}
              <div className="flex flex-col bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded">
                <span className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold italic">
                  Gross Capital Gain
                </span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 italic">
                  {formatAmount(summary.gross_capital_gain)}
                </span>
              </div>

              {/* Less: Main Residence Exemption */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Less: Main Residence Exemption ({summary.main_residence_exemption_percentage}%)
                </span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                  ({formatAmount(summary.main_residence_exemption_amount)})
                </span>
              </div>

              {/* Taxable Capital Gain - Highlighted */}
              <div className="flex flex-col bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded">
                <span className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold italic">
                  Taxable Capital Gain
                </span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 italic">
                  {formatAmount(summary.taxable_capital_gain)}
                </span>
              </div>

              {/* Less: CGT Discount (conditional) */}
              {summary.cgt_discount_applicable && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Less: {summary.cgt_discount_percentage}% CGT Discount
                  </span>
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                    ({formatAmount(summary.cgt_discount_amount)})
                  </span>
                </div>
              )}
            </div>

            {/* NET CAPITAL GAIN - Full width, prominent */}
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700 bg-green-100 dark:bg-green-900/40 px-4 py-3 rounded flex items-center justify-between">
              <span className="text-base font-bold text-green-900 dark:text-green-100 italic">
                NET CAPITAL GAIN
              </span>
              <span className="text-lg font-mono font-bold text-green-900 dark:text-green-100 italic">
                {formatAmount(summary.net_capital_gain)}
              </span>
            </div>
          </div>
          <div className="text-center py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-sm font-bold text-green-900 dark:text-green-100">
              RESULT: {property.result}
            </p>
          </div>
        </div>
      )}

      {/* Estimated Tax on CGT */}
      {taxBrackets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Estimated Tax on CGT (2024-25 Rates)
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Tax on your net capital gain of <span className="font-semibold">{formatAmount(summary?.net_capital_gain)}</span> at each marginal rate:
          </p>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden p-4 bg-white dark:bg-gray-800">
            {/* Grid of tax bracket cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {taxBrackets.map((bracket, index) => (
                <div
                  key={index}
                  className="flex flex-col p-3 border border-amber-200 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  {/* Income range */}
                  <span className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {bracket.income_to
                      ? `$${formatNumber(bracket.income_from)} – $${formatNumber(bracket.income_to)}`
                      : `$${formatNumber(bracket.income_from)}+`}
                  </span>

                  {/* Rate badge */}
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-mono font-semibold text-lg rounded">
                      {bracket.marginal_rate}%
                    </span>
                  </div>

                  {/* Tax amount */}
                  <span className="text-base font-mono font-bold text-gray-900 dark:text-gray-100">
                    {formatAmount(bracket.tax_amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              Your marginal rate depends on your total taxable income (including this capital gain).
              The rates above do not include the 2% Medicare levy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
