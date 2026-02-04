'use client';

import React from 'react';
import { PropertyAnalysis, OwnershipPeriod } from '@/types/model-response';

interface OwnershipPeriodsTableProps {
  property: PropertyAnalysis;
}

// Helper function to determine if period is exempt
function isExemptPeriod(periodType: string): boolean {
  const lowerType = periodType.toLowerCase();
  return lowerType.includes('main residence') || lowerType.includes('exempt');
}

// Helper function to format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export default function OwnershipPeriodsTable({
  property,
}: OwnershipPeriodsTableProps) {
  const ownershipPeriods = property.ownership_periods || [];

  if (ownershipPeriods.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No ownership periods available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
          📅 O2. Ownership Periods Analysis
        </span>
      </div>

      {/* Ownership Periods Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-100 dark:bg-purple-900/40">
              <th className="px-4 py-3 text-left font-semibold text-purple-900 dark:text-purple-100">
                Period Type
              </th>
              <th className="px-4 py-3 text-left font-semibold text-purple-900 dark:text-purple-100">
                Date Range
              </th>
              <th className="px-4 py-3 text-right font-semibold text-purple-900 dark:text-purple-100">
                Days
              </th>
              <th className="px-4 py-3 text-right font-semibold text-purple-900 dark:text-purple-100">
                Percentage
              </th>
              <th className="px-4 py-3 text-center font-semibold text-purple-900 dark:text-purple-100">
                Rule Applied
              </th>
              <th className="px-4 py-3 text-center font-semibold text-purple-900 dark:text-purple-100">
                Exempt
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {ownershipPeriods.map((period, index) => {
              const isExempt = isExemptPeriod(period.period_type);
              const dateRange = period.start_date && period.end_date
                ? `${period.start_date} – ${period.end_date}`
                : '—';

              return (
                <tr
                  key={index}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  {/* Period Type */}
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {period.period_type}
                  </td>

                  {/* Date Range */}
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {dateRange}
                  </td>

                  {/* Days */}
                  <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatNumber(period.days)}
                  </td>

                  {/* Percentage */}
                  <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                    {period.percentage}%
                  </td>

                  {/* Rule Applied */}
                  <td className="px-4 py-3 text-center">
                    {period.note ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded font-mono text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {period.note}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Exempt */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isExempt
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {isExempt ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
