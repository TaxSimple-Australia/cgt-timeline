'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TimelinePeriodBreakdownTableProps {
  property: any;
  calculations: any;
}

export default function TimelinePeriodBreakdownTable({ property, calculations }: TimelinePeriodBreakdownTableProps) {
  const periodBreakdown = property?.period_breakdown;

  if (!periodBreakdown) {
    return null;
  }

  const mainResidencePeriods = periodBreakdown.main_residence_periods || [];
  const rentalPeriods = periodBreakdown.rental_periods || [];

  // Combine all periods for chronological display
  const allPeriods: Array<{
    type: 'main_residence' | 'rental';
    start: string;
    end: string;
    days: number;
    status: string;
    bgColor: string;
    badgeColor: string;
    statusLabel: string;
    sixYearExemptDays?: number;
    taxableDays?: number;
  }> = [];

  // Add main residence periods
  mainResidencePeriods.forEach((period: any) => {
    const status = period.status || 'exempt';
    let bgColor = 'bg-green-50 dark:bg-green-950/20';
    let badgeColor = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    let statusLabel = 'Main Residence';

    if (status.includes('s118_192')) {
      bgColor = 'bg-purple-50 dark:bg-purple-950/20';
      badgeColor = 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      statusLabel = 'Main Residence (s118-192)';
    }

    allPeriods.push({
      type: 'main_residence',
      start: period.start,
      end: period.end,
      days: period.days,
      status,
      bgColor,
      badgeColor,
      statusLabel
    });
  });

  // Add rental periods
  rentalPeriods.forEach((period: any) => {
    const status = period.status || 'rental';
    const sixYearExemptDays = period.six_year_exempt_days || 0;
    const taxableDays = period.taxable_days || 0;

    let bgColor = 'bg-orange-50 dark:bg-orange-950/20';
    let badgeColor = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    let statusLabel = 'Rental';

    if (sixYearExemptDays > 0 && taxableDays === 0) {
      // Fully covered by six-year rule
      bgColor = 'bg-blue-50 dark:bg-blue-950/20';
      badgeColor = 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      statusLabel = 'Rental (6-Year Rule Exempt)';
    } else if (sixYearExemptDays > 0 && taxableDays > 0) {
      // Partially covered by six-year rule
      bgColor = 'bg-amber-50 dark:bg-amber-950/20';
      badgeColor = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      statusLabel = 'Rental (Partially Exempt)';
    }

    allPeriods.push({
      type: 'rental',
      start: period.start,
      end: period.end,
      days: period.days,
      status,
      bgColor,
      badgeColor,
      statusLabel,
      sixYearExemptDays,
      taxableDays
    });
  });

  // Sort periods chronologically
  allPeriods.sort((a, b) => {
    const dateA = new Date(a.start).getTime();
    const dateB = new Date(b.start).getTime();
    return dateA - dateB;
  });

  if (allPeriods.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const totalDays = allPeriods.reduce((sum, p) => sum + p.days, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Timeline Period Breakdown
        </h3>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{totalDays} total days</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Period Type
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                Start Date
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                End Date
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                Days
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                CGT Status
              </th>
            </tr>
          </thead>
          <tbody>
            {allPeriods.map((period, index) => (
              <tr key={index} className={period.bgColor}>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${period.badgeColor}`}>
                    {period.statusLabel}
                  </span>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(period.start)}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(period.end)}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {period.days.toLocaleString()}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm">
                  {period.type === 'main_residence' && (
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-green-700 dark:text-green-300 font-medium">Exempt</span>
                    </div>
                  )}
                  {period.type === 'rental' && period.sixYearExemptDays !== undefined && (
                    <div className="space-y-1">
                      {period.sixYearExemptDays > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-blue-700 dark:text-blue-300 text-xs">
                            {period.sixYearExemptDays} days exempt (6-yr rule)
                          </span>
                        </div>
                      )}
                      {period.taxableDays !== undefined && period.taxableDays > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                          <span className="text-orange-700 dark:text-orange-300 text-xs">
                            {period.taxableDays} days taxable
                          </span>
                        </div>
                      )}
                      {period.taxableDays === 0 && period.sixYearExemptDays === period.days && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-blue-700 dark:text-blue-300 font-medium">Fully Exempt (6-yr)</span>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {/* Summary Row */}
            <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-750 font-bold">
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm" colSpan={3}>
                <span className="text-gray-900 dark:text-gray-100">TOTAL OWNERSHIP</span>
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-base text-gray-900 dark:text-gray-100">
                {totalDays.toLocaleString()}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {(totalDays / 365).toFixed(1)} years
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Explanations */}
      {(periodBreakdown.exempt_periods_explanation || periodBreakdown.taxable_periods_explanation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {periodBreakdown.exempt_periods_explanation && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                Exempt Periods
              </h4>
              <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                {periodBreakdown.exempt_periods_explanation}
              </p>
            </div>
          )}
          {periodBreakdown.taxable_periods_explanation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                Six-Year Rule
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                {periodBreakdown.taxable_periods_explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Main Residence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">6-Year Rule</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Partial Exempt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Taxable</span>
        </div>
      </div>
    </div>
  );
}
