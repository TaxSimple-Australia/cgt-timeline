'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Home, DollarSign, TrendingUp, Calendar, Award } from 'lucide-react';

interface PropertyAnalysisCardProps {
  property: any;
  calculations?: any;
  analysis?: any; // Full analysis object from API response
}

export default function PropertyAnalysisCard({ property, calculations, analysis }: PropertyAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Remove bracketed text from step descriptions
  const cleanStepDescription = (description: string) => {
    // Remove anything in brackets (and the brackets themselves)
    return description.replace(/\s*\([^)]*\)/g, '').trim();
  };

  const getExemptionBadgeColor = (exemptionType: string) => {
    switch (exemptionType) {
      case 'full':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'partial':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'none':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sold':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'owned':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const capitalChange = property.capital_change || 0;
  const isGain = capitalChange > 0;
  const isLoss = capitalChange < 0;
  const netCGT = property.net_after_cgt_discount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Card Header */}
      <div className="p-5">
        {/* Property Address & Badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {property.address}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeColor(property.status)}`}>
                {property.status?.toUpperCase() || 'UNKNOWN'}
              </span>
              {property.exemption_type && (
                <span className={`px-2 py-1 text-xs font-medium rounded border ${getExemptionBadgeColor(property.exemption_type)}`}>
                  {property.exemption_type === 'full' && 'Full Exemption (100%)'}
                  {property.exemption_type === 'partial' && `Partial Exemption (${property.exempt_percentage?.toFixed(1)}%)`}
                  {property.exemption_type === 'none' && 'No Exemption'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Purchase → Sale → Gain */}
        {property.status?.toLowerCase() === 'sold' && property.purchase_price && property.sale_price && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Purchase</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(property.purchase_price)}
                  </div>
                </div>
                <div className="text-gray-400">→</div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Sale</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(property.sale_price)}
                  </div>
                </div>
                <div className="text-gray-400">=</div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Capital {isGain ? 'Gain' : isLoss ? 'Loss' : 'Change'}
                  </div>
                  <div className={`font-bold ${
                    isGain ? 'text-green-600 dark:text-green-400' :
                    isLoss ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {isLoss && '−'}{formatCurrency(capitalChange)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Net CGT */}
        {property.should_calculate_cgt && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Net CGT Liability
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(netCGT)}
              </div>
            </div>
          </div>
        )}

        {/* Exemption Message */}
        {!property.should_calculate_cgt && property.exemption_reason && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-300">
                {property.exemption_reason}
              </p>
            </div>
          </div>
        )}

        {/* Quick Calculation Summary (visible in main view) */}
        {calculations && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Cost Base Summary */}
            {calculations.cost_base_breakdown && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                  Total Cost Base
                </div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(calculations.cost_base_breakdown.total_cost_base)}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                  Acquisition + Improvements + Costs
                </div>
              </div>
            )}

            {/* Exemption Summary */}
            {calculations.main_residence_exemption && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                  Main Residence Days
                </div>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  {calculations.main_residence_exemption.days_as_main_residence} / {calculations.main_residence_exemption.total_ownership_days}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                  {calculations.main_residence_exemption.exemption_percentage}% exempt
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expand/Collapse Button - Only show if calculations exist */}
        {calculations && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Hide Calculation Details</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>View Calculation Details</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && calculations && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          >
            <div className="p-5 space-y-4">
              {/* Cost Base Breakdown */}
              {calculations.cost_base_breakdown && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Cost Base Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Acquisition Cost</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(calculations.cost_base_breakdown.acquisition_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Incidental Costs (Acquire)</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(calculations.cost_base_breakdown.incidental_costs_acquire)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Capital Improvements</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(calculations.cost_base_breakdown.capital_improvements)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Disposal Costs</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(calculations.cost_base_breakdown.disposal_costs)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Total Cost Base</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(calculations.cost_base_breakdown.total_cost_base)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Residence Exemption */}
              {calculations.main_residence_exemption && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Main Residence Exemption
                  </h4>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Days as Main Residence</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {calculations.main_residence_exemption.days_as_main_residence} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Ownership Days</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {calculations.main_residence_exemption.total_ownership_days} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Exemption Percentage</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {calculations.main_residence_exemption.exemption_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Exempt Amount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(calculations.main_residence_exemption.exempt_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Main Residence Exemption Calculation Steps */}
                  <div className="space-y-2 mt-4">
                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Calculation Steps:</h5>

                    {/* Step 1: Calculate Exemption Percentage */}
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-600 dark:bg-green-500 text-white rounded-full text-xs font-bold">
                          1
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          Calculate Exemption Percentage
                        </span>
                      </div>
                      <div className="ml-8 text-xs">
                        <div className="text-gray-600 dark:text-gray-400 mb-1">
                          Formula: (Days as Main Residence ÷ Total Days) × 100
                        </div>
                        <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
                          ({calculations.main_residence_exemption.days_as_main_residence} ÷ {calculations.main_residence_exemption.total_ownership_days}) × 100 = {calculations.main_residence_exemption.exemption_percentage}%
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Calculate Exempt Amount */}
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-600 dark:bg-green-500 text-white rounded-full text-xs font-bold">
                          2
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          Calculate Exempt Amount
                        </span>
                      </div>
                      <div className="ml-8 text-xs">
                        <div className="text-gray-600 dark:text-gray-400 mb-1">
                          Formula: Capital Gain × Exemption %
                        </div>
                        <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
                          {formatCurrency(calculations.raw_capital_gain || 0)} × {calculations.main_residence_exemption.exemption_percentage}% = {formatCurrency(calculations.main_residence_exemption.exempt_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Calculate Taxable Amount */}
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-600 dark:bg-green-500 text-white rounded-full text-xs font-bold">
                          3
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          Calculate Taxable Amount (Before Discount)
                        </span>
                      </div>
                      <div className="ml-8 text-xs">
                        <div className="text-gray-600 dark:text-gray-400 mb-1">
                          Formula: Capital Gain − Exempt Amount
                        </div>
                        <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border border-green-300 dark:border-green-700 text-green-900 dark:text-green-100">
                          {formatCurrency(calculations.raw_capital_gain || 0)} − {formatCurrency(calculations.main_residence_exemption.exempt_amount)} = {formatCurrency(calculations.main_residence_exemption.taxable_amount_before_discount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Calculation Steps */}
              {calculations.calculation_steps && calculations.calculation_steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Calculation Steps
                  </h4>
                  <div className="space-y-3">
                    {calculations.calculation_steps.map((step: any, index: number) => (
                      <div key={index} className="p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                            {step.step}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {cleanStepDescription(step.description)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {step.calculation}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                              {step.section}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CGT Discount Calculation */}
              {calculations.cgt_discount && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    CGT Discount Calculation
                  </h4>

                  {/* Eligibility Status */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        CGT Discount Eligible
                      </span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded ${
                        calculations.cgt_discount.eligible
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {calculations.cgt_discount.eligible ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>

                  {calculations.cgt_discount.eligible && (
                    <>
                      {/* Discount Details */}
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Discount Percentage</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {calculations.cgt_discount.discount_percentage}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Before Discount</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(calculations.cgt_discount.gain_before_discount)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">After Discount</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(calculations.cgt_discount.discounted_gain)}
                          </span>
                        </div>
                      </div>

                      {/* Discount Calculation Step */}
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded mb-3">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-600 dark:bg-purple-500 text-white rounded-full text-xs font-bold">
                            1
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            Apply 50% CGT Discount
                          </span>
                        </div>
                        <div className="ml-8 text-xs">
                          <div className="text-gray-600 dark:text-gray-400 mb-1">
                            Formula: Taxable Amount × {calculations.cgt_discount.discount_percentage}%
                          </div>
                          <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100">
                            {formatCurrency(calculations.cgt_discount.gain_before_discount)} × {calculations.cgt_discount.discount_percentage}% = {formatCurrency(calculations.cgt_discount.discounted_gain)}
                          </div>
                        </div>
                      </div>

                      {/* Savings Display */}
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">You Save</div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(calculations.cgt_discount.gain_before_discount - calculations.cgt_discount.discounted_gain)}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Final Net Capital Gain */}
              {calculations.net_capital_gain !== undefined && (
                <div className="mt-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Final Net Capital Gain
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          (After exemptions and discount)
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(calculations.net_capital_gain)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
