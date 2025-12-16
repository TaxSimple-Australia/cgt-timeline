'use client';

import React, { useState } from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { ArrowUpDown } from 'lucide-react';
import {
  calculatePortfolioStats,
  getDatePosition,
  getPropertyDuration,
  formatEventDate,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
} from '@/lib/snapshot-utils';

interface PortfolioPerformanceMatrixProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

type SortColumn = 'name' | 'purchaseDate' | 'saleDate' | 'duration' | 'events' | 'status' | 'roi';
type SortDirection = 'asc' | 'desc';

export default function PortfolioPerformanceMatrix({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: PortfolioPerformanceMatrixProps) {
  const stats = calculatePortfolioStats(properties, events, absoluteStart, absoluteEnd);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Calculate data for each property
  const propertyData = properties.map((property) => {
    const propertyEvents = events.filter((e) => e.propertyId === property.id);
    const duration = getPropertyDuration(property, absoluteEnd);
    const roi =
      property.purchasePrice && property.salePrice
        ? ((property.salePrice - property.purchasePrice) / property.purchasePrice) * 100
        : 0;

    return {
      property,
      eventCount: propertyEvents.length,
      duration,
      roi,
    };
  });

  // Sort data
  const sortedData = [...propertyData].sort((a, b) => {
    let comparison = 0;

    switch (sortColumn) {
      case 'name':
        comparison = a.property.name.localeCompare(b.property.name);
        break;
      case 'purchaseDate':
        comparison =
          (a.property.purchaseDate?.getTime() || 0) - (b.property.purchaseDate?.getTime() || 0);
        break;
      case 'saleDate':
        comparison =
          (a.property.saleDate?.getTime() || 0) - (b.property.saleDate?.getTime() || 0);
        break;
      case 'duration':
        comparison = a.duration.days - b.duration.days;
        break;
      case 'events':
        comparison = a.eventCount - b.eventCount;
        break;
      case 'status':
        comparison = (a.property.currentStatus || '').localeCompare(b.property.currentStatus || '');
        break;
      case 'roi':
        comparison = a.roi - b.roi;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortButton = ({ column, label }: { column: SortColumn; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortColumn === column ? 'text-blue-600' : 'opacity-40'}`} />
    </button>
  );

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-300 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Portfolio Performance Matrix
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{stats.timelineSpan}</p>
      </div>

      {/* Summary Stats Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-slate-200 dark:border-slate-700 mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.propertyCount}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">Properties</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalEvents}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">Total Events</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.spanYears}y
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">Timeline Span</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {(stats.totalEvents / Math.max(stats.propertyCount, 1)).toFixed(1)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">
              Avg Events/Property
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 px-6 py-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <div>
            <SortButton column="name" label="Property" />
          </div>
          <div>
            <SortButton column="purchaseDate" label="Purchase" />
          </div>
          <div>
            <SortButton column="saleDate" label="Sale" />
          </div>
          <div>
            <SortButton column="duration" label="Duration" />
          </div>
          <div>
            <SortButton column="events" label="Events" />
          </div>
          <div>
            <SortButton column="status" label="Status" />
          </div>
          <div>
            <SortButton column="roi" label="ROI" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {sortedData.map(({ property, eventCount, duration, roi }) => {
            const propertyEvents = events.filter((e) => e.propertyId === property.id);

            return (
              <div
                key={property.id}
                className="grid grid-cols-7 gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                {/* Property Name + Inline Timeline */}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {property.name}
                  </div>
                  {/* Mini Sparkline Timeline */}
                  <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        backgroundColor: property.color,
                        left: `${getDatePosition(property.purchaseDate || absoluteStart, absoluteStart, absoluteEnd, 0)}%`,
                        width: `${getDatePosition(property.saleDate || absoluteEnd, absoluteStart, absoluteEnd, 0) - getDatePosition(property.purchaseDate || absoluteStart, absoluteStart, absoluteEnd, 0)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {property.purchaseDate ? formatEventDate(property.purchaseDate) : '-'}
                </div>

                {/* Sale Date */}
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {property.saleDate ? formatEventDate(property.saleDate) : '-'}
                </div>

                {/* Duration */}
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {duration.formatted}
                </div>

                {/* Events */}
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {eventCount}
                </div>

                {/* Status */}
                <div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getStatusColor(property.currentStatus || '')}20`,
                      color: getStatusColor(property.currentStatus || ''),
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(property.currentStatus || '') }}
                    />
                    {getStatusLabel(property.currentStatus || 'unknown')}
                  </div>
                </div>

                {/* ROI */}
                <div
                  className={`text-sm font-bold ${
                    roi > 0
                      ? 'text-green-600 dark:text-green-400'
                      : roi < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {roi !== 0 ? `${roi > 0 ? '+' : ''}${roi.toFixed(1)}%` : '-'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Table Footer - Totals */}
        <div className="grid grid-cols-7 gap-4 px-6 py-4 bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-600 font-semibold text-slate-900 dark:text-slate-100">
          <div>Total / Average</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">-</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">-</div>
          <div className="text-sm">
            {(propertyData.reduce((sum, d) => sum + d.duration.days, 0) / Math.max(propertyData.length, 1) / 365).toFixed(1)}y avg
          </div>
          <div>{stats.totalEvents}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">-</div>
          <div className="text-sm">
            {(propertyData.reduce((sum, d) => sum + d.roi, 0) / Math.max(propertyData.length, 1)).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
