'use client';

import React from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import { PropertyAnalysis } from '@/types/model-response';
import { formatCurrency } from '@/lib/utils';

interface DetailedCalculationSectionProps {
  property: PropertyAnalysis;
}

// Helper function to format currency from string or number
function formatAmount(amount: string | number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0';
  return formatCurrency(numAmount);
}

// Helper function to format number with commas
function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '—';
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '—';
  return numValue.toLocaleString('en-AU');
}

// Render formula with smart splitting
function renderFormula(raw: string, result?: string) {
  // Check for pipe-separated segments (e.g. "Main Residence: ... = 1,460 days (exempt) | Rental: ... = 1,872 days")
  if (raw.includes(' | ')) {
    const segments = raw.split(' | ');
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2.5 space-y-1.5">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500 flex-shrink-0 mt-1.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {seg.trim()}
              </span>
            </div>
          ))}
        </div>
        {result && (
          <div className="bg-purple-50 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800 px-3 py-1.5 flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
            <span className="text-sm font-semibold font-mono text-purple-700 dark:text-purple-300">
              {result}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Check for "expression = result" pattern
  const eqIndex = raw.indexOf(' = ');
  if (eqIndex !== -1) {
    const expression = raw.substring(0, eqIndex);
    const inlineResult = raw.substring(eqIndex + 3);
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {expression}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800 px-3 py-1.5">
          <span className="text-sm font-semibold font-mono text-purple-700 dark:text-purple-300">
            = {inlineResult}
          </span>
        </div>
      </div>
    );
  }

  // Fallback: plain rendering
  return (
    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
      {raw}
    </p>
  );
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
        <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
        <span className="text-lg font-bold text-green-700 dark:text-green-400">
          CGT Calculation
        </span>
      </div>

      {/* Cost Base */}
      {costBaseItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Cost Base
          </h4>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {costBaseItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.description || `Item ${index + 1}`}
                  </span>
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatAmount(item.amount)}
                  </span>
                </div>
              ))}
            </div>
            {/* Total Row */}
            <div className="flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/30 border-t-2 border-green-300 dark:border-green-700">
              <span className="text-sm font-bold text-green-900 dark:text-green-100">
                Total Cost Base
              </span>
              <span className="text-base font-mono font-bold text-green-900 dark:text-green-100 tabular-nums">
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

                    {/* Formula/Calculation */}
                    {(step.formula || step.calculation) && (
                      renderFormula(
                        (step.formula || step.calculation) as string,
                        step.result
                      )
                    )}

                    {/* Result pill - only when no formula (formula rendering includes result) */}
                    {!(step.formula || step.calculation) && step.result && (
                      <div className="inline-flex">
                        <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-full text-sm font-semibold">
                          {step.result}
                        </span>
                      </div>
                    )}
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
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Summary rows as a clean ledger */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Sale Price */}
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sale Price (Capital Proceeds)
                </span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatAmount(summary.sale_price)}
                </span>
              </div>

              {/* Less: Total Cost Base */}
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Less: Total Cost Base
                </span>
                <span className="text-sm font-mono font-semibold text-red-600 dark:text-red-400 tabular-nums">
                  ({formatAmount(summary.total_cost_base)})
                </span>
              </div>

              {/* Gross Capital Gain - Highlighted */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-600">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Gross Capital Gain
                </span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatAmount(summary.gross_capital_gain)}
                </span>
              </div>

              {/* Less: Main Residence Exemption */}
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Less: Main Residence Exemption ({summary.main_residence_exemption_percentage ?? 0}%)
                </span>
                <span className="text-sm font-mono font-semibold text-red-600 dark:text-red-400 tabular-nums">
                  ({formatAmount(summary.main_residence_exemption_amount)})
                </span>
              </div>

              {/* Taxable Capital Gain - Highlighted */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-600">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Taxable Capital Gain
                </span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatAmount(summary.taxable_capital_gain)}
                </span>
              </div>

              {/* Less: CGT Discount (conditional) */}
              {summary.cgt_discount_applicable && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Less: {summary.cgt_discount_percentage ?? 50}% CGT Discount
                  </span>
                  <span className="text-sm font-mono font-semibold text-red-600 dark:text-red-400 tabular-nums">
                    ({formatAmount(summary.cgt_discount_amount)})
                  </span>
                </div>
              )}
            </div>

            {/* NET CAPITAL GAIN - Full width, prominent */}
            <div className="flex items-center justify-between px-4 py-4 bg-green-100 dark:bg-green-900/40 border-t-2 border-green-400 dark:border-green-600">
              <span className="text-base font-bold text-green-900 dark:text-green-100">
                NET CAPITAL GAIN
              </span>
              <span className="text-lg font-mono font-bold text-green-900 dark:text-green-100 tabular-nums">
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
                    <span className="inline-block px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-mono font-semibold text-lg rounded tabular-nums">
                      {bracket.marginal_rate}%
                    </span>
                  </div>

                  {/* Tax amount */}
                  <span className="text-base font-mono font-bold text-gray-900 dark:text-gray-100 tabular-nums">
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
