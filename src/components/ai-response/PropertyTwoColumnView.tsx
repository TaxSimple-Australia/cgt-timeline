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
  analysis?: any;
}

export default function PropertyTwoColumnView({
  property,
  calculations,
  propertyAnalysis,
  recommendations = [],
  validation,
  analysis
}: PropertyTwoColumnViewProps) {

  // Extract cost base breakdown (moved earlier for purchasePrice dependency)
  const costBaseBreakdown = calculations?.cost_base_breakdown || {};
  const acquisitionCosts = costBaseBreakdown.acquisition_costs || {};
  const disposalCosts = costBaseBreakdown.disposal_costs || {};
  const s118192Applied = costBaseBreakdown.s118_192_applied || false;

  // Extract key metrics
  // Use cost_base_breakdown for purchase price (s118-192 logic)
  const purchasePrice = s118192Applied
    ? (costBaseBreakdown.deemed_acquisition_cost || 0)
    : (costBaseBreakdown.original_cost || property?.purchase_price || 0);
  const salePrice = property?.sale_price || 0;
  const costBase = calculations?.cost_base || 0;

  // Raw capital gain = Sale Price - Cost Base (before any exemptions or discounts)
  const rawCapitalGain = calculations?.raw_capital_gain ?? (salePrice - costBase);
  // Net capital gain = Final taxable amount after exemptions and CGT discount
  const netCapitalGain = calculations?.net_capital_gain || 0;

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

  // Get line color for vertical timeline connectors
  const getStepLineColor = (stepNumber: number) => {
    const colors = [
      'bg-blue-500 dark:bg-blue-600',
      'bg-purple-500 dark:bg-purple-600',
      'bg-pink-500 dark:bg-pink-600',
      'bg-orange-500 dark:bg-orange-600',
      'bg-teal-500 dark:bg-teal-600',
      'bg-indigo-500 dark:bg-indigo-600'
    ];
    return colors[(stepNumber - 1) % colors.length];
  };

  // Get text color for step labels
  const getStepTextColor = (stepNumber: number) => {
    const colors = [
      'text-blue-600 dark:text-blue-400',
      'text-purple-600 dark:text-purple-400',
      'text-pink-600 dark:text-pink-400',
      'text-orange-600 dark:text-orange-400',
      'text-teal-600 dark:text-teal-400',
      'text-indigo-600 dark:text-indigo-400'
    ];
    return colors[(stepNumber - 1) % colors.length];
  };

  // Remove bracketed text from step descriptions
  const cleanStepDescription = (description: string) => {
    // Remove anything in brackets (and the brackets themselves)
    return description.replace(/\s*\([^)]*\)/g, '').trim();
  };

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

  // Determine purchase date from earliest period start
  const getPurchaseDate = () => {
    const allStartDates = [
      ...mainResidencePeriods.map((p: any) => p.start),
      ...rentalPeriods.map((p: any) => p.start)
    ].filter(Boolean);

    if (allStartDates.length === 0) return '';

    // Find earliest date
    const dates = allStartDates.map((d: string) => new Date(d));
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    return earliestDate.toISOString().split('T')[0];
  };

  const purchaseDate = getPurchaseDate();

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

  // Get capital improvements from calculations.cost_base_breakdown (API response)
  const capitalImprovements = costBaseBreakdown?.capital_improvements || [];
  const improvementsTotal = costBaseBreakdown?.capital_improvements_total || 0;

  return (
    <div className="space-y-0">
      {/* Property Summary Box - Gradient Header */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-t-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-pink-500 dark:from-blue-600 dark:to-pink-600 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {property?.address || 'Property'}
              </h3>
              <p className="text-sm text-white/80">
                {property?.scenario_detected ? `Scenario: ${property.scenario_detected}` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/70">Status</div>
              <div className={`text-sm font-bold ${
                isSold ? 'text-white/90' : 'text-white'
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
                rawCapitalGain > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {formatCurrency(purchasePrice)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {purchaseDate ? formatDate(purchaseDate) : ''}
              </div>
            </div>

            {/* Cost Base */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Cost Base</div>
              <div className={`text-base font-bold ${
                rawCapitalGain > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {formatCurrency(costBase)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            </div>

            {/* Capital Gain */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Capital Gain</div>
              <div className={`text-base font-bold ${
                rawCapitalGain > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {formatCurrency(rawCapitalGain)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {rawCapitalGain === 0 ? 'Exempt' : 'Taxable'}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Content */}
        <div className="flex flex-col md:flex-row-reverse divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
          {/* LEFT COLUMN (visually right): Timeline Bar Visualization */}
          <div className="p-6 bg-slate-900 dark:bg-slate-950 md:w-1/2">
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
            <div className="flex items-center gap-6 text-xs mb-6">
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

            {/* Occupancy Summary */}
            {(mainResidencePeriods.length > 0 || rentalPeriods.length > 0) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Occupancy Summary
                </h4>
                <div className="space-y-2">
                  {mainResidencePeriods.map((period: any, idx: number) => (
                    <div key={`mr-summary-${idx}`} className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 dark:bg-blue-600 rounded-full"></div>
                      <span className="text-sm text-white">
                        Main Residence: {formatDate(period.start)} - {formatDate(period.end)}
                      </span>
                    </div>
                  ))}
                  {rentalPeriods.map((period: any, idx: number) => (
                    <div key={`rental-summary-${idx}`} className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 dark:bg-purple-600 rounded-full"></div>
                      <span className="text-sm text-white">
                        Rental: {formatDate(period.start)} - {period.end ? formatDate(period.end) : 'Present'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Base Breakdown - Moved from right column */}
            <div className="mt-6 bg-slate-800 dark:bg-slate-900 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">
                Cost Base Breakdown
              </h4>

              <div className="space-y-3">
                {/* ELEMENT 1: PURCHASE */}
                <div className="mb-6 bg-slate-950/60 dark:bg-black/40 rounded-lg p-4">
                  <div className="text-xs text-purple-300 font-medium mb-3">
                    ELEMENT 1: PURCHASE
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-base text-white font-medium">
                      Purchase Price
                    </span>
                    <span className="text-base font-bold text-white">
                      {formatCurrency(purchasePrice)}
                    </span>
                  </div>

                  {/* Acquisition Costs */}
                  {Object.entries(acquisitionCosts).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between items-center text-sm mb-1">
                      <span className="text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-white">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))}

                  {/* Subtotal */}
                  {Object.keys(acquisitionCosts).length > 0 && (
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-600">
                      <span className="text-base font-semibold text-white">Subtotal</span>
                      <span className="text-base font-bold text-blue-400">
                        {formatCurrency(purchasePrice + acquisitionCostsTotal)}
                      </span>
                    </div>
                  )}
                </div>

                {/* ELEMENT 2: CAPITAL IMPROVEMENTS */}
                {improvementsTotal > 0 && (
                  <div className="mb-6 bg-slate-950/60 dark:bg-black/40 rounded-lg p-4">
                    <div className="text-xs text-purple-300 font-medium mb-3">
                      ELEMENT 2: CAPITAL IMPROVEMENTS
                    </div>
                    {capitalImprovements.map((imp: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm mb-1">
                        <span className="text-slate-300">{imp.description || 'Improvement'}</span>
                        <span className="font-medium text-white">
                          {formatCurrency(imp.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-3 pt-2">
                      <span className="text-base font-semibold text-white">Subtotal</span>
                      <span className="text-base font-bold text-purple-400">
                        {formatCurrency(improvementsTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* ELEMENT 3: SELLING COSTS */}
                {Object.keys(disposalCosts).length > 0 && (
                  <div className="mb-6 bg-slate-950/60 dark:bg-black/40 rounded-lg p-4">
                    <div className="text-xs text-purple-300 font-medium mb-3">
                      ELEMENT 3: SELLING COSTS
                    </div>
                    {Object.entries(disposalCosts).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center text-sm mb-1">
                        <span className="text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-white">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-3 pt-2">
                      <span className="text-base font-semibold text-white">Subtotal</span>
                      <span className="text-base font-bold text-red-400">
                        {formatCurrency(disposalCostsTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Cost Base & CGT */}
              <div className="mt-6 pt-6 border-t-2 border-slate-600 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-white">Total Cost Base</span>
                  <span className="text-lg font-bold text-white">
                    {formatCurrency(costBase)}
                  </span>
                </div>
                {isSold && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-white">Sale Price</span>
                      <span className="text-lg font-bold text-green-400">
                        {formatCurrency(salePrice)}
                      </span>
                    </div>
                    {/* Raw Capital Gain = Sale Price - Cost Base */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-500">
                      <span className="text-base font-bold text-white">Capital Gain</span>
                      <span className={`text-lg font-bold ${rawCapitalGain >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatCurrency(rawCapitalGain)}
                      </span>
                    </div>
                    {/* Net Capital Gain - after exemptions and discounts */}
                    {rawCapitalGain !== netCapitalGain && (
                      <div className="flex justify-between items-center bg-slate-700/50 rounded-lg p-2 -mx-2">
                        <span className="text-sm text-slate-300">After exemptions & discount</span>
                        <span className={`text-xl font-bold ${netCapitalGain > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {formatCurrency(netCapitalGain)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (visually left): Calculations + Rules */}
          <div className="p-6 bg-slate-800 dark:bg-slate-900 space-y-6 md:w-1/2">
            {/* Calculation Steps */}
            {calculationSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Calculation Steps
                </h4>
                <div className="relative">
                  {calculationSteps.map((step: any, index: number) => {
                    const isLast = index === calculationSteps.length - 1;

                    return (
                      <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* LEFT: Timeline Column (Fixed Width) */}
                        <div className="relative flex flex-col items-center w-12 flex-shrink-0">
                          {/* Circle Indicator */}
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center
                            ${getStepColor(step.step)}
                            text-white text-xs font-bold shadow-lg z-10
                          `}>
                            {step.step}
                          </div>

                          {/* Connecting Line (don't show for last step) */}
                          {!isLast && (
                            <div className={`
                              absolute top-6 left-1/2 -translate-x-1/2
                              w-0.5 h-full ${getStepLineColor(step.step)}
                            `} />
                          )}
                        </div>

                        {/* RIGHT: Content Column */}
                        <div className="flex-1">
                          {/* Step Label Header */}
                          <div className="mb-2">
                            <div className={`
                              text-xs font-bold uppercase tracking-wider
                              ${getStepTextColor(step.step)}
                            `}>
                              STEP {step.step}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                              {cleanStepDescription(step.description)}
                            </div>
                          </div>

                          {/* Content Area - No Boxes */}
                          <div>
                            {/* Calculation Formula */}
                            {step.calculation && (
                              <div className="font-mono text-xs text-gray-800 dark:text-gray-200 mb-2">
                                {step.calculation}
                              </div>
                            )}

                            {/* Result */}
                            {step.result !== null && step.result !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">=</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(step.result)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Rules Applied - Full Width Below */}
      {analysis?.validation?.knowledge_base_rules && analysis.validation.knowledge_base_rules.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-t-0 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Rules Applied
            </h3>
          </div>
          <div className="space-y-3">
            {analysis.validation.knowledge_base_rules.map((rule: any, index: number) => (
              <div key={`rule-${index}`} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Rule ID Badge */}
                  {rule.rule_id && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                        {rule.rule_id}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Rule Title */}
                    <div className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1.5">
                      {rule.rule_title}
                    </div>

                    {/* Summary */}
                    {rule.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {rule.summary}
                      </p>
                    )}
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
