'use client';

import React, { useState } from 'react';
import { Calculator, TrendingUp, Home, Percent, ChevronDown, ChevronRight } from 'lucide-react';

interface CalculationBreakdownSectionProps {
  perPropertyCalculations: any[];
}

export default function CalculationBreakdownSection({ perPropertyCalculations }: CalculationBreakdownSectionProps) {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const cleanStepDescription = (description: string) => {
    return description.replace(/\s*\([^)]*\)/g, '').trim();
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!perPropertyCalculations || perPropertyCalculations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Detailed Calculations
        </h3>
      </div>

      {perPropertyCalculations.map((propCalc, index) => (
        <div key={index} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Property Header */}
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {propCalc.property_address}
            </h4>
          </div>

          <div className="p-4 space-y-3">
            {/* Capital Gain Calculation Steps - Compact Table */}
            {propCalc.calculation_steps && propCalc.calculation_steps.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection(`calc-${index}`)}
                  className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {expandedSections[`calc-${index}`] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <TrendingUp className="w-4 h-4" />
                  <span>Capital Gain Calculation</span>
                </button>

                {expandedSections[`calc-${index}`] && (
                  <div className="ml-6 border-l-2 border-blue-200 dark:border-blue-800 pl-3 space-y-1">
                    {propCalc.calculation_steps.map((step: any, stepIndex: number) => (
                      <div key={stepIndex} className="text-sm">
                        <div className="flex items-start justify-between py-1">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                              {step.step}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {cleanStepDescription(step.description)}
                              </div>
                              {step.calculation && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                  {step.calculation}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(step.result)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Main Residence Exemption - Compact Summary */}
            {propCalc.main_residence_exemption && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex items-start gap-2 mb-2">
                  <Home className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Main Residence Exemption
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          PPR Period:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatNumber(propCalc.main_residence_exemption.days_as_main_residence)} days ({formatNumber(propCalc.main_residence_exemption.exemption_percentage)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Exempt Amount:
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(propCalc.main_residence_exemption.exempt_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          Taxable (before discount):
                        </span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(propCalc.main_residence_exemption.taxable_amount_before_discount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CGT Discount - Compact Summary */}
            {propCalc.cgt_discount && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex items-start gap-2">
                  <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      CGT Discount ({propCalc.cgt_discount.discount_percentage}%)
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          Eligible:
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          propCalc.cgt_discount.eligible
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {propCalc.cgt_discount.eligible ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {propCalc.cgt_discount.eligible && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Before Discount:
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {formatCurrency(propCalc.cgt_discount.gain_before_discount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              After Discount:
                            </span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              {formatCurrency(propCalc.cgt_discount.discounted_gain)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs bg-green-50 dark:bg-green-950/20 -mx-2 px-2 py-1 rounded">
                            <span className="text-green-700 dark:text-green-400 font-medium">
                              Savings:
                            </span>
                            <span className="font-bold text-green-700 dark:text-green-400">
                              {formatCurrency(propCalc.cgt_discount.gain_before_discount - propCalc.cgt_discount.discounted_gain)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Final Net Capital Gain - Prominent but Compact */}
            <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 mt-3">
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Net Capital Gain
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    (After exemptions & discount)
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(propCalc.net_capital_gain)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
