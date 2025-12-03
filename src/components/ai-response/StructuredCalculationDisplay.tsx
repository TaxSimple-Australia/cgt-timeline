'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ChevronDown, ChevronUp, DollarSign, Package, TrendingUp, Home, Percent, ChevronsDown, ChevronsUp } from 'lucide-react';

interface StructuredCalculationDisplayProps {
  property: any;
  calculations?: any;
}

export default function StructuredCalculationDisplay({
  property,
  calculations,
}: StructuredCalculationDisplayProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const expandAll = () => {
    setExpandedSteps(new Set([1, 2, 3, 4, 5]));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };
  if (!calculations) {
    return null;
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0%';
    return `${value.toFixed(1)}%`;
  };

  // Extract calculation data
  const capitalProceeds = property?.sale_price || calculations?.capital_proceeds || 0;
  const costBase = calculations?.cost_base_breakdown?.total_cost_base || 0;
  const rawCapitalGain = calculations?.raw_capital_gain || (capitalProceeds - costBase);

  // Cost base breakdown
  const acquisitionCost = calculations?.cost_base_breakdown?.acquisition_cost || 0;
  const incidentalCostsAcquire = calculations?.cost_base_breakdown?.incidental_costs_acquire || 0;
  const capitalImprovements = calculations?.cost_base_breakdown?.capital_improvements || 0;
  const incidentalCostsOwnership = calculations?.cost_base_breakdown?.incidental_costs_ownership || 0;
  const disposalCosts = calculations?.cost_base_breakdown?.disposal_costs || 0;

  // Main residence exemption
  const exemptionData = calculations?.main_residence_exemption;
  const daysAsMainResidence = exemptionData?.days_as_main_residence || 0;
  const totalOwnershipDays = exemptionData?.total_ownership_days || 0;
  const exemptionPercentage = exemptionData?.exemption_percentage || 0;
  const exemptAmount = exemptionData?.exempt_amount || 0;
  const taxableBeforeDiscount = exemptionData?.taxable_amount_before_discount || rawCapitalGain;

  // CGT Discount
  const discountData = calculations?.cgt_discount;
  const discountEligible = discountData?.eligible || false;
  const discountPercentage = discountData?.discount_percentage || 50;
  const gainBeforeDiscount = discountData?.gain_before_discount || taxableBeforeDiscount;
  const discountedGain = discountData?.discounted_gain || 0;

  // Net capital gain
  const netCapitalGain = calculations?.net_capital_gain || 0;

  // Check if fully exempt
  const isFullyExempt = exemptionPercentage === 100 || netCapitalGain === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-sm">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            CGT CALCULATION
          </h3>
        </div>
        <button
          onClick={expandedSteps.size > 0 ? collapseAll : expandAll}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
        >
          {expandedSteps.size > 0 ? (
            <>
              <ChevronsUp className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronsDown className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </>
          )}
        </button>
      </div>

      {/* Text-Based Calculation Display */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="font-mono text-xs space-y-3 text-gray-800 dark:text-gray-200">

          {/* Step 1: Calculate Capital Proceeds */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => toggleStep(1)}
              className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-950/10 hover:from-blue-100 hover:to-blue-100 dark:hover:from-blue-950/30 dark:hover:to-blue-950/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <div className="font-bold text-xs text-gray-900 dark:text-gray-100 font-sans">
                    Step 1: Calculate Capital Proceeds <span className="text-blue-600 dark:text-blue-400">[{formatCurrency(capitalProceeds)}]</span>
                  </div>
                </div>
              </div>
              {expandedSteps.has(1) ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            <AnimatePresence>
              {expandedSteps.has(1) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                        <span className="text-xs leading-relaxed">Sale Price: {formatCurrency(capitalProceeds)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 2: Calculate Cost Base */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => toggleStep(2)}
              className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-950/10 hover:from-emerald-100 hover:to-emerald-100 dark:hover:from-emerald-950/30 dark:hover:to-emerald-950/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <div className="font-bold text-xs text-gray-900 dark:text-gray-100 font-sans">
                    Step 2: Calculate Cost Base <span className="text-emerald-600 dark:text-emerald-400">[{formatCurrency(costBase)}]</span>
                  </div>
                </div>
              </div>
              {expandedSteps.has(2) ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            <AnimatePresence>
              {expandedSteps.has(2) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-0.5">
                      {acquisitionCost > 0 && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                          <span className="text-xs leading-relaxed">Purchase Price: {formatCurrency(acquisitionCost)}</span>
                        </div>
                      )}
                      {incidentalCostsAcquire > 0 && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                          <span className="text-xs leading-relaxed">Stamp Duty & Purchase Costs: {formatCurrency(incidentalCostsAcquire)}</span>
                        </div>
                      )}
                      {capitalImprovements > 0 && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                          <span className="text-xs leading-relaxed">Capital Improvements: {formatCurrency(capitalImprovements)}</span>
                        </div>
                      )}
                      {incidentalCostsOwnership > 0 && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                          <span className="text-xs leading-relaxed">Ownership Costs: {formatCurrency(incidentalCostsOwnership)}</span>
                        </div>
                      )}
                      {disposalCosts > 0 && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                          <span className="text-xs leading-relaxed">Sale Costs: {formatCurrency(disposalCosts)}</span>
                        </div>
                      )}
                      <div className="my-1.5 border-t border-gray-300 dark:border-gray-600"></div>
                      <div className="flex items-start gap-1.5 font-semibold">
                        <span>─</span>
                        <span className="text-xs leading-relaxed">Total Cost Base: {formatCurrency(costBase)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 3: Calculate Capital Gain */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => toggleStep(3)}
              className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-950/10 hover:from-violet-100 hover:to-violet-100 dark:hover:from-violet-950/30 dark:hover:to-violet-950/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <div className="font-bold text-xs text-gray-900 dark:text-gray-100 font-sans">
                    Step 3: Calculate Capital Gain <span className="text-violet-600 dark:text-violet-400">[{formatCurrency(rawCapitalGain)}]</span>
                  </div>
                </div>
              </div>
              {expandedSteps.has(3) ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            <AnimatePresence>
              {expandedSteps.has(3) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                        <span className="text-xs leading-relaxed">Capital Gain = {formatCurrency(capitalProceeds)} - {formatCurrency(costBase)} = {formatCurrency(rawCapitalGain)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 4: Apply Main Residence Exemption */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => toggleStep(4)}
              className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-950/10 hover:from-amber-100 hover:to-amber-100 dark:hover:from-amber-950/30 dark:hover:to-amber-950/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <div className="font-bold text-xs text-gray-900 dark:text-gray-100 font-sans">
                    Step 4: Apply Main Residence Exemption <span className="text-amber-600 dark:text-amber-400">[{formatPercentage(exemptionPercentage)} exempt]</span>
                  </div>
                </div>
              </div>
              {expandedSteps.has(4) ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            <AnimatePresence>
              {expandedSteps.has(4) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-0.5">
                      <div className="flex items-start gap-1.5">
                        <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                        <span className="text-xs leading-relaxed">Main Residence Days: {daysAsMainResidence} / {totalOwnershipDays} = {formatPercentage(exemptionPercentage)}</span>
                      </div>
                      {exemptionPercentage === 100 ? (
                        <div className="flex items-start gap-1.5 text-green-600 dark:text-green-400 font-semibold">
                          <span>✓</span>
                          <span className="text-xs leading-relaxed">Exemption: FULL (100%) - Property is FULLY EXEMPT</span>
                        </div>
                      ) : exemptionPercentage > 0 ? (
                        <>
                          <div className="flex items-start gap-1.5">
                            <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                            <span className="text-xs leading-relaxed">Exempt Amount = {formatCurrency(rawCapitalGain)} × {formatPercentage(exemptionPercentage)} = {formatCurrency(exemptAmount)}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                            <span className="text-xs leading-relaxed">Taxable Capital Gain = {formatCurrency(rawCapitalGain)} × {formatPercentage(100 - exemptionPercentage)} = {formatCurrency(taxableBeforeDiscount)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-1.5 text-red-600 dark:text-red-400 font-semibold">
                          <span>✗</span>
                          <span className="text-xs leading-relaxed">Exemption: NONE (0%) - No main residence exemption applies</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 5: Apply CGT Discount (if applicable) */}
          {discountEligible && !isFullyExempt && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleStep(5)}
                className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-950/10 hover:from-indigo-100 hover:to-indigo-100 dark:hover:from-indigo-950/30 dark:hover:to-indigo-950/20 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <div className="font-bold text-xs text-gray-900 dark:text-gray-100 font-sans">
                      Step 5: Apply {discountPercentage}% CGT Discount <span className="text-indigo-600 dark:text-indigo-400">[{formatCurrency(discountedGain)}]</span>
                    </div>
                  </div>
                </div>
                {expandedSteps.has(5) ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
              </button>
              <AnimatePresence>
                {expandedSteps.has(5) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2.5 bg-white dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-0.5">
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                          <span className="text-xs leading-relaxed">Held &gt; 12 months: YES</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                          <span className="text-xs leading-relaxed">Discounted Gain = {formatCurrency(gainBeforeDiscount)} × {discountPercentage}% = {formatCurrency(discountedGain)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Final Result */}
          <div className="mt-3">
            {isFullyExempt ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-3 text-center shadow-sm">
                <div className="text-sm font-bold font-sans text-green-700 dark:text-green-300">
                  RESULT: NET CAPITAL GAIN = $0
                </div>
                <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                  (FULLY EXEMPT - No CGT payable)
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-3 text-center shadow-sm">
                <div className="text-sm font-bold font-sans text-blue-700 dark:text-blue-300">
                  RESULT: NET CAPITAL GAIN = {formatCurrency(netCapitalGain)}
                </div>
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                  (This amount is added to your taxable income)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
