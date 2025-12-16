'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  calculatePortfolioStats,
  getDatePosition,
  formatCurrency,
  generateYearMarkers,
} from '@/lib/snapshot-utils';

interface FinancialTimelineViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function FinancialTimelineView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: FinancialTimelineViewProps) {
  const stats = calculatePortfolioStats(properties, events, absoluteStart, absoluteEnd);
  const yearMarkers = generateYearMarkers(absoluteStart, absoluteEnd);

  // Calculate financial metrics
  const totalInvested = properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
  const totalSold = properties
    .filter((p) => p.salePrice)
    .reduce((sum, p) => sum + (p.salePrice || 0), 0);
  const totalImprovements = events
    .filter((e) => e.type === 'improvement')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netGainLoss = totalSold - totalInvested;
  const avgROI = totalInvested > 0 ? ((totalSold - totalInvested) / totalInvested) * 100 : 0;

  // Get financial events (purchase, sale, improvement)
  const financialEvents = events.filter(
    (e) => (e.type === 'purchase' || e.type === 'sale' || e.type === 'improvement') && e.amount
  );

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
          Financial Timeline
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dollar-focused portfolio analysis
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Total Invested
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalInvested)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Total Sold
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalSold)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Net Gain/Loss
            </div>
          </div>
          <div
            className={`text-2xl font-bold ${
              netGainLoss >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(Math.abs(netGainLoss))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Avg ROI
            </div>
          </div>
          <div
            className={`text-2xl font-bold ${
              avgROI >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {avgROI.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Financial Event Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
          Transaction Timeline
        </h3>

        {/* Year Markers */}
        <div className="relative h-12 mb-8">
          {yearMarkers.map(({ year, position }) => (
            <div key={year} className="absolute top-0" style={{ left: `${position}%` }}>
              <div className="absolute -translate-x-1/2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {year}
              </div>
              <div
                className="absolute top-6 w-px bg-slate-300 dark:bg-slate-600 -translate-x-1/2"
                style={{ height: '300px' }}
              />
            </div>
          ))}
        </div>

        {/* Financial Events as Circles Sized by Amount */}
        <div className="relative h-64">
          {/* Horizontal baseline */}
          <div className="absolute w-full h-px bg-slate-300 dark:bg-slate-600" style={{ top: '50%' }} />

          {financialEvents.map((event) => {
            const position = getDatePosition(event.date, absoluteStart, absoluteEnd);
            const amount = event.amount || 0;

            // Size circle based on amount (min 20px, max 60px)
            const maxAmount = Math.max(...financialEvents.map((e) => e.amount || 0));
            const size = Math.max(20, Math.min(60, (amount / maxAmount) * 60));

            // Position above baseline for purchases/improvements, below for sales
            const yOffset = event.type === 'sale' ? 50 : event.type === 'purchase' ? -100 : -50;

            const color =
              event.type === 'purchase'
                ? '#3b82f6'
                : event.type === 'sale'
                ? '#10b981'
                : '#f59e0b';

            return (
              <div
                key={event.id}
                className="absolute group"
                style={{
                  left: `${position}%`,
                  top: `calc(50% + ${yOffset}px)`,
                }}
              >
                {/* Circle */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-slate-900 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                  }}
                />

                {/* Connecting line to baseline */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-px opacity-30"
                  style={{
                    height: `${Math.abs(yOffset)}px`,
                    top: yOffset > 0 ? `-${Math.abs(yOffset)}px` : '0',
                    backgroundColor: color,
                  }}
                />

                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-3 py-2 rounded shadow-xl whitespace-nowrap">
                    <div className="font-semibold capitalize">{event.type}</div>
                    <div className="font-bold">{formatCurrency(amount)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span className="text-slate-700 dark:text-slate-300">Purchase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-slate-700 dark:text-slate-300">Sale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-slate-700 dark:text-slate-300">Improvement</span>
            </div>
            <div className="ml-auto text-slate-600 dark:text-slate-400 italic">
              Circle size represents transaction amount
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
