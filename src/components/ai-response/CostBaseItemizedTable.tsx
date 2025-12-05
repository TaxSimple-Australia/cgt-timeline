'use client';

import React from 'react';
import { DollarSign } from 'lucide-react';

interface CostBaseItemizedTableProps {
  property: any;
  calculations: any;
}

export default function CostBaseItemizedTable({ property, calculations }: CostBaseItemizedTableProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || amount === 0) return null;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Extract cost base breakdown
  const costBaseBreakdown = calculations?.cost_base_breakdown || {};
  const acquisitionCosts = costBaseBreakdown.acquisition_costs || {};
  const disposalCosts = costBaseBreakdown.disposal_costs || {};
  const purchasePrice = property?.purchase_price || 0;
  const salePrice = property?.sale_price || 0;
  const totalCostBase = calculations?.cost_base || 0;

  // Get capital improvements from property
  const capitalImprovements = property?.cost_base_details?.capital_improvements || [];
  const improvementsTotal = capitalImprovements.reduce((sum: number, imp: any) => sum + (imp.amount || 0), 0);

  // Build itemized rows
  const items: Array<{ category: string; description: string; amount: number; bgColor: string }> = [];

  // 1. First Element - Purchase Price
  if (purchasePrice > 0) {
    items.push({
      category: 'First Element',
      description: 'Purchase Price',
      amount: purchasePrice,
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    });
  }

  // 2. Incidental Costs of Acquisition
  const acquisitionCostEntries = Object.entries(acquisitionCosts).filter(([key, value]) =>
    typeof value === 'number' && value > 0
  );

  acquisitionCostEntries.forEach(([key, value]) => {
    const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    items.push({
      category: 'Second Element',
      description: label,
      amount: value as number,
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    });
  });

  // 3. Capital Improvements (Third Element)
  capitalImprovements.forEach((improvement: any, index: number) => {
    if (improvement.amount > 0) {
      items.push({
        category: 'Third Element',
        description: improvement.description || `Capital Improvement ${index + 1}`,
        amount: improvement.amount,
        bgColor: 'bg-pink-50 dark:bg-pink-950/20'
      });
    }
  });

  // 4. Incidental Costs of Disposal/Ownership (Fourth Element) - typically none unless specified
  // This would include interest, rates if not claimed as deductions
  // For now, we'll skip this unless there's data

  // 5. Selling Costs (Fifth Element)
  const disposalCostEntries = Object.entries(disposalCosts).filter(([key, value]) =>
    typeof value === 'number' && value > 0
  );

  disposalCostEntries.forEach(([key, value]) => {
    const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    items.push({
      category: 'Fifth Element',
      description: label,
      amount: value as number,
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    });
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Cost Base Itemized Breakdown
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                CGT Element
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Description
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={item.bgColor}>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.category}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">
                  {item.description}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-950/30 dark:to-teal-950/30 font-bold">
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm" colSpan={2}>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-gray-100">TOTAL COST BASE</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">(Sum of all elements)</span>
                </div>
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-base text-green-700 dark:text-green-300">
                {formatCurrency(totalCostBase)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">1st: Purchase</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">2nd: Acquisition</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">3rd: Improvements</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">4th: Ownership</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">5th: Selling</span>
        </div>
      </div>
    </div>
  );
}
