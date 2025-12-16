'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { Building2, Calendar, Activity, TrendingUp } from 'lucide-react';
import {
  calculatePortfolioStats,
  getDatePosition,
  getEventTypeBreakdownText,
  getStatusLabel,
  getStatusColor,
} from '@/lib/snapshot-utils';

interface ExecutiveSummaryDashboardProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function ExecutiveSummaryDashboard({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: ExecutiveSummaryDashboardProps) {
  const stats = calculatePortfolioStats(properties, events, absoluteStart, absoluteEnd);

  // Calculate total portfolio value
  const totalInvested = properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
  const totalSold = properties
    .filter((p) => p.salePrice)
    .reduce((sum, p) => sum + (p.salePrice || 0), 0);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
          Executive Summary
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Portfolio overview and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Total Portfolio Value */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Total Invested
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            ${(totalInvested / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Across {stats.propertyCount} {stats.propertyCount === 1 ? 'property' : 'properties'}
          </div>
        </div>

        {/* Active Properties */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Active Properties
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {stats.propertyCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {stats.statusBreakdown.sold || 0} sold
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Total Events
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {stats.totalEvents}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {(stats.totalEvents / (stats.spanYears || 1)).toFixed(1)} per year
          </div>
        </div>

        {/* Timeline Span */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Timeline Span
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {stats.spanYears}
            <span className="text-base font-normal ml-1">years</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {stats.timelineSpan.split('(')[0].trim()}
          </div>
        </div>
      </div>

      {/* Condensed Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Portfolio Timeline
        </h3>
        <div className="relative h-32">
          {properties.map((property, index) => {
            const startPos = getDatePosition(
              property.purchaseDate || absoluteStart,
              absoluteStart,
              absoluteEnd
            );
            const endPos = getDatePosition(
              property.saleDate || absoluteEnd,
              absoluteStart,
              absoluteEnd
            );
            const yPos = (index / Math.max(properties.length - 1, 1)) * 80 + 10;

            return (
              <div key={property.id} className="absolute" style={{ top: `${yPos}px` }}>
                {/* Property bar */}
                <div
                  className="absolute h-3 rounded-full opacity-90 transition-opacity hover:opacity-100"
                  style={{
                    backgroundColor: property.color,
                    left: `${startPos}%`,
                    width: `${endPos - startPos}%`,
                  }}
                  title={property.name}
                />
                {/* Property label - left side */}
                <div
                  className="absolute text-xs font-medium whitespace-nowrap"
                  style={{
                    left: '0',
                    top: '-18px',
                    color: property.color,
                  }}
                >
                  {property.name.length > 20
                    ? property.name.substring(0, 20) + '...'
                    : property.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Event Breakdown + Status Distribution */}
      <div className="grid grid-cols-2 gap-6">
        {/* Event Type Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Event Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.eventBreakdown)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const percentage = (count / stats.totalEvents) * 100;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 dark:text-slate-300 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Status Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.statusBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const percentage = (count / stats.propertyCount) * 100;
                const color = getStatusColor(status);
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-slate-700 dark:text-slate-300">
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
