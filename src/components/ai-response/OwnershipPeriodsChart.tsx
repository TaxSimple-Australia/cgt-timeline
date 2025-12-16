'use client';

import React from 'react';
import { Calendar, Home, Building2, DoorOpen } from 'lucide-react';
import { OwnershipPeriod } from '@/types/model-response';
import { cn } from '@/lib/utils';

interface OwnershipPeriodsChartProps {
  periods: OwnershipPeriod[];
}

const getPeriodColor = (periodType: string): { bg: string; text: string; icon: React.ReactNode } => {
  const typeLower = periodType.toLowerCase();

  if (typeLower.includes('main residence') || typeLower.includes('ppr')) {
    return {
      bg: 'bg-green-500',
      text: 'text-green-700 dark:text-green-300',
      icon: <Home className="w-4 h-4" />
    };
  }
  if (typeLower.includes('rental')) {
    return {
      bg: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
      icon: <Building2 className="w-4 h-4" />
    };
  }
  if (typeLower.includes('vacant')) {
    return {
      bg: 'bg-gray-400',
      text: 'text-gray-700 dark:text-gray-300',
      icon: <DoorOpen className="w-4 h-4" />
    };
  }
  if (typeLower.includes('total')) {
    return {
      bg: 'bg-purple-500',
      text: 'text-purple-700 dark:text-purple-300',
      icon: <Calendar className="w-4 h-4" />
    };
  }

  return {
    bg: 'bg-gray-500',
    text: 'text-gray-700 dark:text-gray-300',
    icon: <Calendar className="w-4 h-4" />
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ownership Periods
        </h3>
      </div>

      {/* Total Ownership */}
      {totalPeriod && (
        <div className="mb-5 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalPeriod.period_type}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {totalPeriod.years} years
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalPeriod.days} days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Bar */}
      {nonTotalPeriods.length > 0 && (
        <div className="mb-5">
          <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {nonTotalPeriods.map((period, index) => {
              const percentage = parseFloat(period.percentage) || 0;
              const colors = getPeriodColor(period.period_type);

              return (
                <div
                  key={index}
                  className={cn("relative group", colors.bg)}
                  style={{ width: `${percentage}%` }}
                  title={`${period.period_type}: ${percentage}%`}
                >
                  {percentage > 10 && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                      {percentage.toFixed(0)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Period Details */}
      <div className="space-y-3">
        {nonTotalPeriods.map((period, index) => {
          const colors = getPeriodColor(period.period_type);
          const percentage = parseFloat(period.percentage) || 0;

          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg.replace('500', '100').replace('400', '100'))}>
                  <div className={colors.text}>
                    {colors.icon}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {period.period_type}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {period.days} days ({period.years} years)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", colors.bg)} />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
