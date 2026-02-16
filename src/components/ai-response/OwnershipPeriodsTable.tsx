'use client';

import React from 'react';
import { PropertyAnalysis, OwnershipPeriod } from '@/types/model-response';

interface OwnershipPeriodsTableProps {
  property: PropertyAnalysis;
}

// Helper function to determine if period is exempt - check multiple indicators
function isExemptPeriod(period: OwnershipPeriod): boolean {
  // Check explicit fields first (API may send these)
  if ((period as any).is_exempt === true || (period as any).exempt === true) return true;
  if ((period as any).is_exempt === false || (period as any).exempt === false) return false;
  // Check cgt_status field
  if ((period as any).cgt_status) {
    const status = (period as any).cgt_status.toLowerCase();
    if (status === 'exempt') return true;
    if (status === 'taxable') return false;
  }
  // Fall back to period_type name matching
  const lowerType = period.period_type.toLowerCase();
  if (lowerType.includes('main residence') || lowerType.includes('ppr') || lowerType.includes('exempt')) return true;
  if (lowerType.includes('rental') || lowerType.includes('taxable') || lowerType.includes('investment') || lowerType.includes('business')) return false;
  // Check note for exemption rules
  if (period.note) {
    const lowerNote = period.note.toLowerCase();
    if (lowerNote.includes('s118.110') || lowerNote.includes('s118-110') || lowerNote.includes('main residence')) return true;
  }
  return false;
}

// Helper function to format number with commas
function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '—';
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '—';
  return numValue.toLocaleString('en-AU');
}

// Helper function to safely format percentage
function formatPercentage(pct: string | number | undefined | null): string {
  if (pct === undefined || pct === null || pct === '') return '—';
  const numValue = typeof pct === 'string' ? parseFloat(pct) : pct;
  if (isNaN(numValue)) return String(pct);
  return `${numValue}%`;
}

// Helper function to format date range
function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '—';
  if (startDate && !endDate) return `${startDate} – Present`;
  if (!startDate && endDate) return `— – ${endDate}`;
  return `${startDate} – ${endDate}`;
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

  // Calculate total days for verification
  const totalDays = ownershipPeriods.reduce((sum, p) => sum + (p.days || 0), 0);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
          Ownership Period Classification
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
              const exempt = isExemptPeriod(period);
              const dateRange = formatDateRange(period.start_date, period.end_date);
              const days = period.days != null && !isNaN(period.days) ? period.days : null;
              const pct = period.percentage;
              const rule = period.note || (period as any).rule_applied || (period as any).legislation || null;
              const years = period.years;

              return (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-750 ${
                    exempt
                      ? 'bg-green-50/40 dark:bg-green-950/10'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Period Type */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {period.period_type || '—'}
                      </span>
                      {years && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {years}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Date Range */}
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono text-xs">
                    {dateRange}
                  </td>

                  {/* Days */}
                  <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                    {days !== null ? formatNumber(days) : '—'}
                  </td>

                  {/* Percentage */}
                  <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatPercentage(pct)}
                  </td>

                  {/* Rule Applied */}
                  <td className="px-4 py-3 text-center">
                    {rule ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded font-mono text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {rule}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Exempt */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exempt
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {exempt ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Footer with totals */}
          {totalDays > 0 && (
            <tfoot>
              <tr className="bg-purple-50 dark:bg-purple-900/20 border-t-2 border-purple-200 dark:border-purple-700">
                <td className="px-4 py-2.5 font-bold text-purple-900 dark:text-purple-200">
                  Total
                </td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-purple-900 dark:text-purple-200">
                  {formatNumber(totalDays)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-purple-900 dark:text-purple-200">
                  100%
                </td>
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Indexation Method Notice */}
      {(() => {
        // Get the earliest start date from periods (purchase date)
        const earliestDate = ownershipPeriods.reduce((earliest, period) => {
          if (!period.start_date) return earliest;
          const periodDate = new Date(period.start_date);
          return !earliest || periodDate < earliest ? periodDate : earliest;
        }, null as Date | null);

        // Check if eligible for indexation method (before 11:45 AM EST on 21 September 1999)
        const indexationCutoff = new Date('1999-09-21T11:45:00+10:00');
        const isEligibleForIndexation = earliestDate && earliestDate <= indexationCutoff;

        return isEligibleForIndexation ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              If an asset was acquired at or before 11.45 am EST on 21 September 1999, you may be eligible to use the indexation method to calculate the cost base for capital gains tax purposes.
            </p>
          </div>
        ) : null;
      })()}
    </div>
  );
}
