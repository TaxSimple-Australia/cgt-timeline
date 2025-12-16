'use client';

import React from 'react';
import { Calculator, TrendingUp, Home, Percent } from 'lucide-react';

interface CalculationBreakdownSectionProps {
  perPropertyCalculations: any[];
}

export default function CalculationBreakdownSection({ perPropertyCalculations }: CalculationBreakdownSectionProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Remove bracketed text from step descriptions
  const cleanStepDescription = (description: string) => {
    // Remove anything in brackets (and the brackets themselves)
    return description.replace(/\s*\([^)]*\)/g, '').trim();
  };

  if (!perPropertyCalculations || perPropertyCalculations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Detailed Calculations
        </h3>
      </div>

      {perPropertyCalculations.map((propCalc, index) => (
        <div key={index} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Property Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {propCalc.property_address}
            </h4>
          </div>

          {/* Step-by-Step Calculation */}
          {propCalc.calculation_steps && propCalc.calculation_steps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h5 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                  Step-by-Step Capital Gain Calculation
                </h5>
              </div>
              <div className="space-y-3">
                {propCalc.calculation_steps.map((step: any, stepIndex: number) => (
                  <div key={stepIndex} className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white rounded-full text-sm font-bold">
                        {step.step}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {cleanStepDescription(step.description)}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <span className="font-medium">Formula:</span> {step.formula}
                        </div>
                        <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100">
                          {step.calculation}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            {step.section}
                          </span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            = {formatCurrency(step.result)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Residence Exemption Calculation */}
          {propCalc.main_residence_exemption && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h5 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                  Main Residence Exemption Calculation
                </h5>
              </div>
              <div className="space-y-3">
                {/* Step 1: Calculate Exemption Percentage */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-600 dark:bg-green-500 text-white rounded-full text-sm font-bold">
                      1
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Calculate Exemption Percentage
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span className="font-medium">Formula:</span> (Days as Main Residence ÷ Total Ownership Days) × 100
                      </div>
                      <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
                        ({formatNumber(propCalc.main_residence_exemption.days_as_main_residence)} days ÷ {formatNumber(propCalc.main_residence_exemption.total_ownership_days)} days) × 100
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          = {formatNumber(propCalc.main_residence_exemption.exemption_percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Calculate Exempt Amount */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-600 dark:bg-green-500 text-white rounded-full text-sm font-bold">
                      2
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Calculate Exempt Amount
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span className="font-medium">Formula:</span> Raw Capital Gain × Exemption Percentage
                      </div>
                      <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
                        {formatCurrency(propCalc.raw_capital_gain)} × {formatNumber(propCalc.main_residence_exemption.exemption_percentage)}%
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          = {formatCurrency(propCalc.main_residence_exemption.exempt_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Calculate Taxable Amount */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-600 dark:bg-green-500 text-white rounded-full text-sm font-bold">
                      3
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Calculate Taxable Amount (Before Discount)
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span className="font-medium">Formula:</span> Raw Capital Gain − Exempt Amount
                      </div>
                      <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
                        {formatCurrency(propCalc.raw_capital_gain)} − {formatCurrency(propCalc.main_residence_exemption.exempt_amount)}
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          = {formatCurrency(propCalc.main_residence_exemption.taxable_amount_before_discount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CGT Discount Calculation */}
          {propCalc.cgt_discount && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h5 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                  CGT Discount Calculation
                </h5>
              </div>
              <div className="space-y-3">
                {/* Eligibility Status */}
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      CGT Discount Eligible
                    </span>
                    <span className={`px-3 py-1 text-sm font-semibold rounded ${
                      propCalc.cgt_discount.eligible
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {propCalc.cgt_discount.eligible ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Discount Calculation */}
                {propCalc.cgt_discount.eligible && (
                  <>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-600 dark:bg-purple-500 text-white rounded-full text-sm font-bold">
                          1
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            Apply 50% CGT Discount
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            <span className="font-medium">Formula:</span> Taxable Amount × {propCalc.cgt_discount.discount_percentage}%
                          </div>
                          <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100">
                            {formatCurrency(propCalc.cgt_discount.gain_before_discount)} × {propCalc.cgt_discount.discount_percentage}%
                          </div>
                          <div className="mt-2 flex items-center justify-end">
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              = {formatCurrency(propCalc.cgt_discount.discounted_gain)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Before/After Comparison */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Before Discount</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(propCalc.cgt_discount.gain_before_discount)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">After Discount</div>
                          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(propCalc.cgt_discount.discounted_gain)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">You Save</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(propCalc.cgt_discount.gain_before_discount - propCalc.cgt_discount.discounted_gain)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Final Net Capital Gain Summary */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Final Net Capital Gain
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  (After exemptions and discount)
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(propCalc.net_capital_gain)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
