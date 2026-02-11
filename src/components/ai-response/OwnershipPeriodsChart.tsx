'use client';

import React from 'react';
import { Calendar, Home, Building2, DoorOpen, Clock } from 'lucide-react';
import { OwnershipPeriod } from '@/types/model-response';
import { cn } from '@/lib/utils';

interface OwnershipPeriodsChartProps {
  periods: OwnershipPeriod[];
}

// Professional color scheme with proper contrast
const getPeriodStyle = (periodType: string) => {
  const typeLower = periodType.toLowerCase();

  if (typeLower.includes('main residence') || typeLower.includes('ppr')) {
    return {
      barColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      dotColor: 'bg-emerald-500',
      icon: Home,
      label: 'Main Residence'
    };
  }
  if (typeLower.includes('rental') || typeLower.includes('six-year')) {
    return {
      barColor: 'bg-sky-500',
      badgeBg: 'bg-sky-100 dark:bg-sky-900/40',
      badgeText: 'text-sky-700 dark:text-sky-300',
      badgeBorder: 'border-sky-200 dark:border-sky-800',
      dotColor: 'bg-sky-500',
      icon: Building2,
      label: 'Rental'
    };
  }
  if (typeLower.includes('vacant')) {
    return {
      barColor: 'bg-slate-400',
      badgeBg: 'bg-slate-100 dark:bg-slate-800/60',
      badgeText: 'text-slate-700 dark:text-slate-300',
      badgeBorder: 'border-slate-200 dark:border-slate-700',
      dotColor: 'bg-slate-400',
      icon: DoorOpen,
      label: 'Vacant'
    };
  }

  return {
    barColor: 'bg-gray-400',
    badgeBg: 'bg-gray-100 dark:bg-gray-800/60',
    badgeText: 'text-gray-700 dark:text-gray-300',
    badgeBorder: 'border-gray-200 dark:border-gray-700',
    dotColor: 'bg-gray-400',
    icon: Calendar,
    label: periodType
  };
};

export default function OwnershipPeriodsChart({ periods }: OwnershipPeriodsChartProps) {
  if (!periods || periods.length === 0) {
    return null;
  }

  // Filter out "Total Ownership" for the chart (we'll show it separately)
  const nonTotalPeriods = periods.filter(p => !p.period_type.toLowerCase().includes('total'));
  const totalPeriod = periods.find(p => p.period_type.toLowerCase().includes('total'));

  return (
    <div className="space-y-3">
      {/* Header */}
      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        Ownership Periods
      </h4>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {/* Total Ownership - Compact header */}
        {totalPeriod && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Ownership</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {parseFloat(totalPeriod.years).toFixed(1)} years
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({totalPeriod.days} days)
              </span>
            </div>
          </div>
        )}

        {/* Visual Timeline Bar */}
        {nonTotalPeriods.length > 0 && (
          <div className="mb-4">
            <div className="flex h-6 rounded-md overflow-hidden">
              {nonTotalPeriods.map((period, index) => {
                const percentage = parseFloat(period.percentage) || 0;
                const style = getPeriodStyle(period.period_type);

                return (
                  <div
                    key={index}
                    className={cn(
                      "relative flex items-center justify-center transition-all",
                      style.barColor,
                      index === 0 && "rounded-l-md",
                      index === nonTotalPeriods.length - 1 && "rounded-r-md"
                    )}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                    title={`${period.period_type}: ${percentage.toFixed(1)}%`}
                  >
                    {percentage >= 15 && (
                      <span className="text-white text-xs font-semibold drop-shadow-sm">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Period Legend - Compact inline */}
        <div className="flex flex-wrap gap-3">
          {nonTotalPeriods.map((period, index) => {
            const style = getPeriodStyle(period.period_type);
            const percentage = parseFloat(period.percentage) || 0;
            const IconComponent = style.icon;

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border",
                  style.badgeBg,
                  style.badgeBorder
                )}
              >
                {/* Icon */}
                <IconComponent className={cn("w-4 h-4", style.badgeText)} />

                {/* Info */}
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("font-semibold text-sm", style.badgeText)}>
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {period.period_type}
                  </span>
                </div>

                {/* Days */}
                <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                  ({period.days}d)
                </span>
              </div>
            );
          })}
        </div>

        {/* Period note if applicable */}
        {nonTotalPeriods.some(p => p.note) && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {nonTotalPeriods
                .filter(p => p.note)
                .map((period, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded"
                  >
                    {period.note}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Indexation Method Notice */}
        {(() => {
          // Get the earliest start date from periods (purchase date)
          const earliestDate = nonTotalPeriods.reduce((earliest, period) => {
            const periodDate = new Date(period.start_date);
            return !earliest || periodDate < earliest ? periodDate : earliest;
          }, null as Date | null);

          // Check if eligible for indexation method (before 11:45 AM EST on 21 September 1999)
          const indexationCutoff = new Date('1999-09-21T11:45:00+10:00');
          const isEligibleForIndexation = earliestDate && earliestDate <= indexationCutoff;

          return isEligibleForIndexation ? (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                If an asset was acquired at or before 11.45 am EST on 21 September 1999, you may be eligible to use the indexation method to calculate the cost base for capital gains tax purposes.
              </div>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}
