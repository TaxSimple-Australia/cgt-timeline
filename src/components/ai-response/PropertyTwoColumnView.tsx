'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertyTwoColumnViewProps {
  property: any;
  calculations?: any;
  propertyAnalysis?: any;
  recommendations?: string[];
  validation?: any;
}

export default function PropertyTwoColumnView({
  property,
  calculations,
  propertyAnalysis,
  recommendations = [],
  validation
}: PropertyTwoColumnViewProps) {
  // Extract key metrics
  const purchasePrice = property?.purchase_price || 0;
  const salePrice = property?.sale_price || 0;
  const costBase = calculations?.cost_base || 0;
  const capitalGain = calculations?.net_capital_gain || 0;
  const isSold = property?.status === 'sold';

  // Extract calculation steps
  const calculationSteps = calculations?.calculation_steps || [];

  // Get step color based on step number (rainbow progression)
  const getStepColor = (stepNumber: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
      'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
      'bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700',
      'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
      'bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700',
      'bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700'
    ];
    return colors[(stepNumber - 1) % colors.length];
  };

  // Get colorful border for rules (cycling through vibrant colors)
  const getRuleBorderColor = (index: number) => {
    const colors = [
      'border-green-500 dark:border-green-600',
      'border-blue-500 dark:border-blue-600',
      'border-purple-500 dark:border-purple-600',
      'border-pink-500 dark:border-pink-600',
      'border-orange-500 dark:border-orange-600',
      'border-teal-500 dark:border-teal-600'
    ];
    return colors[index % colors.length];
  };

  // Get colorful left border for calculation steps (matching step badge colors)
  const getStepBorderColor = (stepNumber: number) => {
    const colors = [
      'border-l-blue-500 dark:border-l-blue-600',
      'border-l-purple-500 dark:border-l-purple-600',
      'border-l-pink-500 dark:border-l-pink-600',
      'border-l-orange-500 dark:border-l-orange-600',
      'border-l-teal-500 dark:border-l-teal-600',
      'border-l-indigo-500 dark:border-l-indigo-600'
    ];
    return colors[(stepNumber - 1) % colors.length];
  };

  // Extract cost base breakdown
  const costBaseBreakdown = calculations?.cost_base_breakdown || {};
  const acquisitionCosts = costBaseBreakdown.acquisition_costs || {};
  const disposalCosts = costBaseBreakdown.disposal_costs || {};
  const s118192Applied = costBaseBreakdown.s118_192_applied || false;

  // Extract applicable rules - use citation_details for actual text
  const applicableSections = calculations?.applicable_sections || [];
  const citationDetails = validation?.citation_check?.citation_details || [];

  // CGT Section descriptions mapping
  const cgtSectionDescriptions: Record<string, { title: string; description: string }> = {
    's104-10': {
      title: 'CGT Event A1: Disposal of CGT Asset',
      description: 'A CGT event happens when you dispose of a CGT asset, such as when you sell, give away, or otherwise dispose of property.'
    },
    's110-25': {
      title: 'Cost Base Elements',
      description: 'The cost base includes the purchase price plus incidental costs of acquisition (stamp duty, legal fees), capital improvements, and selling costs.'
    },
    's118-110': {
      title: 'Main Residence Exemption',
      description: 'You may be entitled to a full or partial exemption from CGT if the property was your main residence during the ownership period.'
    },
    's118-145': {
      title: 'Six-Year Absence Rule',
      description: 'If you move out of your main residence and rent it out, you can treat it as your main residence for up to 6 years while absent, provided you don\'t claim another property as your main residence.'
    },
    's115-25': {
      title: '50% CGT Discount',
      description: 'If you held the asset for at least 12 months, you may be entitled to reduce your capital gain by 50% (for individuals and trusts) before calculating tax.'
    },
    's118-192': {
      title: 'Deemed Acquisition (First Use to Produce Income)',
      description: 'When a property that was your main residence is first used to produce income (e.g., rented out), it\'s deemed to have been acquired at its market value at that time for CGT purposes.'
    },
    's118-195': {
      title: 'Partial Main Residence Exemption',
      description: 'If your property was only used as your main residence for part of the ownership period, you may be entitled to a partial exemption based on the proportion of time it was your main residence.'
    },
    's102-5': {
      title: 'Capital Losses',
      description: 'Capital losses from CGT events can be used to reduce capital gains in the same year or carried forward to offset future capital gains.'
    }
  };

  // Fallback: Parse portfolio-wide rules from applicable_sections if citation_details not available
  const portfolioRules: Array<{ section: string; title: string; description: string }> = [];

  if (citationDetails.length === 0 && applicableSections.length > 0) {
    // Use applicable_sections array (e.g., ["s118-192", "s118-145", "s118-110"])
    applicableSections.forEach((section: string) => {
      const ruleInfo = cgtSectionDescriptions[section];
      if (ruleInfo) {
        portfolioRules.push({
          section,
          title: ruleInfo.title,
          description: ruleInfo.description
        });
      } else {
        // Unknown section - show citation only
        portfolioRules.push({
          section,
          title: `ITAA 1997 ${section}`,
          description: 'Tax law provision applicable to this calculation.'
        });
      }
    });
  }

  // Extract period breakdown for timeline
  const periodBreakdown = property?.period_breakdown || {};
  const mainResidencePeriods = periodBreakdown.main_residence_periods || [];
  const rentalPeriods = periodBreakdown.rental_periods || [];

  // Calculate total days for timeline proportions
  const totalDays = property?.total_ownership_days || 1;

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short' });
  };

  // Calculate percentage width for timeline bars
  const getDaysPercentage = (days: number) => {
    return (days / totalDays) * 100;
  };

  // Get first and last date for timeline range
  const getTimelineRange = () => {
    const allDates = [
      ...mainResidencePeriods.map((p: any) => [p.start, p.end]).flat(),
      ...rentalPeriods.map((p: any) => [p.start, p.end]).flat()
    ].filter(Boolean);

    if (allDates.length === 0) return { start: '', end: '' };

    const dates = allDates.map((d: string) => new Date(d));
    return {
      start: formatDate(new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0]),
      end: formatDate(new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0])
    };
  };

  const timelineRange = getTimelineRange();

  // Calculate totals for summary boxes
  const acquisitionCostsTotal = Object.values(acquisitionCosts).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
  const disposalCostsTotal = Object.values(disposalCosts).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);

  // Get capital improvements from cost_base_details
  const capitalImprovements = property?.cost_base_details?.capital_improvements || [];
  const improvementsTotal = capitalImprovements.reduce((sum: number, imp: any) => sum + (imp.amount || 0), 0);

  return (
    <div className="space-y-0">
      {/* Property Summary Box - Gradient Header */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-t-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {property?.address || 'Property'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {property?.scenario_detected ? `Scenario: ${property.scenario_detected}` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
              <div className={`text-sm font-bold ${
                isSold ? 'text-gray-500 dark:text-gray-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {isSold ? 'SOLD' : 'CURRENT'}
              </div>
            </div>
          </div>

          {/* Summary Boxes Grid */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {/* Purchase */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Purchase</div>
              <div className={`text-base font-bold ${
                capitalGain > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {formatCurrency(purchasePrice)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {mainResidencePeriods[0]?.start ? formatDate(mainResidencePeriods[0].start) :
                 rentalPeriods[0]?.start ? formatDate(rentalPeriods[0].start) : ''}
              </div>
            </div>

            {/* Cost Base */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Cost Base</div>
              <div className={`text-base font-bold ${
                capitalGain > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {formatCurrency(costBase)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            </div>

            {/* Capital Gain */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Capital Gain</div>
              <div className={`text-base font-bold ${
                capitalGain > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {formatCurrency(capitalGain)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {capitalGain === 0 ? 'Exempt' : 'Taxable'}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Content */}
        <div className="grid md:grid-cols-[60%_40%] divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
          {/* LEFT COLUMN: Timeline Bar Visualization */}
          <div className="p-6 bg-white dark:bg-gray-900">
            {/* Timeline Scale */}
            {timelineRange.start && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>{timelineRange.start}</span>
                  <span>{timelineRange.end}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            )}

            {/* Timeline Bar */}
            <div className="relative h-20 mb-6">
              {/* Ownership Bar (full width for simplicity) */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gray-200 dark:bg-gray-700 rounded">
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Owned
                </div>
              </div>

              {/* Main Residence Periods */}
              {mainResidencePeriods.map((period: any, idx: number) => {
                const days = period.days || 0;
                const widthPercent = getDaysPercentage(days);
                // For simplicity, stack them - in real calc would need to position based on dates
                const leftPos = idx === 0 ? 0 : idx * 30; // Simplified positioning

                return (
                  <div
                    key={`mr-${idx}`}
                    className="absolute top-10 h-6 bg-blue-500 dark:bg-blue-600 rounded shadow-sm"
                    style={{ left: `${leftPos}%`, width: `${Math.min(widthPercent, 100 - leftPos)}%` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      Main Residence
                    </div>
                  </div>
                );
              })}

              {/* Rental Periods */}
              {rentalPeriods.map((period: any, idx: number) => {
                const days = period.days || 0;
                const widthPercent = getDaysPercentage(days);
                // Position after main residence periods
                const leftPos = mainResidencePeriods.length > 0 ? 50 : 0;

                return (
                  <div
                    key={`rent-${idx}`}
                    className="absolute top-10 h-6 bg-purple-500 dark:bg-purple-600 rounded shadow-sm"
                    style={{ left: `${leftPos}%`, width: `${Math.min(widthPercent, 100 - leftPos)}%` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      Rental
                    </div>
                  </div>
                );
              })}

              {/* Purchase Marker */}
              <div className="absolute top-0 left-0 w-0.5 h-20 bg-green-500">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                  ↓ Purchase
                </div>
              </div>

              {/* Sale Marker */}
              {isSold && (
                <div className="absolute top-0 right-0 w-0.5 h-20 bg-red-500">
                  <div className="absolute -top-6 right-0 text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                    ↓ Sale
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Owned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Main Residence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 dark:bg-purple-600 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Rental</span>
              </div>
            </div>

            {/* Cost Base Breakdown - Moved from right column */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Cost Base Breakdown
              </h4>

              <div className="space-y-3">
                {/* s118-192 Notice */}
                {s118192Applied && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-lg p-2 text-xs">
                    <div className="font-semibold text-amber-900 dark:text-amber-200">s118-192 Deemed Acquisition Applied</div>
                    <div className="text-amber-800 dark:text-amber-300">
                      Property deemed acquired at market value on first rental date.
                    </div>
                  </div>
                )}

                {/* ELEMENT 1: PURCHASE */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                    ELEMENT 1: PURCHASE
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Purchase Price</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(purchasePrice)}
                    </span>
                  </div>
                  {Object.entries(acquisitionCosts).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(acquisitionCosts).length > 0 && (
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(purchasePrice + acquisitionCostsTotal)}
                      </span>
                    </div>
                  )}
                </div>

                {/* ELEMENT 2: CAPITAL IMPROVEMENTS */}
                {improvementsTotal > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                      ELEMENT 2: CAPITAL IMPROVEMENTS
                    </div>
                    {capitalImprovements.map((imp: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{imp.description || 'Improvement'}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(imp.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(improvementsTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* ELEMENT 5: SELLING COSTS */}
                {Object.keys(disposalCosts).length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                      ELEMENT 5: SELLING COSTS
                    </div>
                    {Object.entries(disposalCosts).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(disposalCostsTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Cost Base & CGT */}
              <div className="mt-6 pt-6 border-t-2 border-gray-300 dark:border-gray-600 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Total Cost Base</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(costBase)}
                  </span>
                </div>
                {isSold && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sale Price</span>
                      <span className="text-base font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(salePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">Capital Gain</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(capitalGain)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Calculations + Rules */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 space-y-6">
            {/* Calculation Steps */}
            {calculationSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                  Calculation Steps
                </h4>
                <div className="space-y-4">
                  {calculationSteps.map((step: any, index: number) => (
                    <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 border-l-4 ${getStepBorderColor(step.step)}`}>
                      <div className="flex gap-3 items-start">
                        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${getStepColor(step.step)} text-white rounded-full text-sm font-bold shadow-md`}>
                          {step.step}
                        </div>
                        <div className="flex-1 space-y-2">
                          {/* Description */}
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {step.description}
                          </div>

                          {/* Calculation Formula */}
                          {step.calculation && (
                            <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded p-2">
                              <div className="font-mono text-xs text-gray-800 dark:text-gray-200">
                                {step.calculation}
                              </div>
                            </div>
                          )}

                          {/* Result */}
                          {step.result !== null && step.result !== undefined && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">=</span>
                              <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(step.result)}
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
          </div>
        </div>
      </div>

      {/* Portfolio-Wide Rules - Full Width Below */}
      {(citationDetails.length > 0 || portfolioRules.length > 0) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-t-0 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Portfolio-Wide Rules Applied
            </h3>
          </div>
          <div className="space-y-4">
            {/* Show citation details if available (with full ATO text) */}
            {citationDetails.length > 0 && citationDetails.map((citation: any, index: number) => (
              <div key={`citation-${index}`} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
                {/* Rule Header */}
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-mono font-bold text-base text-gray-900 dark:text-gray-100">
                      {citation.source || 'ITAA 1997'} {citation.rule_number}
                    </div>
                    {citation.page && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {citation.page}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rule Text - Colorful Border */}
                {(citation.source_text_preview || citation.source_text) && (
                  <div className={`mt-3 p-4 bg-white dark:bg-gray-900/50 rounded-lg border-l-4 ${getRuleBorderColor(index)}`}>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {citation.source_text_preview ||
                       (citation.source_text?.substring(0, 200) + (citation.source_text?.length > 200 ? '...' : ''))}
                    </p>
                  </div>
                )}

                {/* Used in Analysis */}
                {citation.used_in_analysis && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
                    <span className="font-semibold">Applied:</span> {citation.used_in_analysis}
                  </div>
                )}
              </div>
            ))}

            {/* Fallback: Show parsed rules from applicable_sections */}
            {citationDetails.length === 0 && portfolioRules.map((rule, index: number) => (
              <div key={`rule-${index}`} className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-sm p-5 border-l-4 ${getRuleBorderColor(index)}`}>
                {/* Rule Title Only */}
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-base text-gray-900 dark:text-gray-100">
                      {rule.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
                      ITAA 1997 {rule.section}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations - Full Width Below */}
      {recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Recommendations
            </h3>
          </div>
          <ul className="space-y-2">
            {recommendations.map((recommendation: string, index: number) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
