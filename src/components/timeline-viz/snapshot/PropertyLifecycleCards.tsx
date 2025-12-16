'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { Calendar, Activity, DollarSign } from 'lucide-react';
import {
  calculatePortfolioStats,
  getDatePosition,
  getPropertyDuration,
  formatEventDate,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
  getEventIcon,
  getShortEventName,
} from '@/lib/snapshot-utils';

interface PropertyLifecycleCardsProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function PropertyLifecycleCards({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: PropertyLifecycleCardsProps) {
  const stats = calculatePortfolioStats(properties, events, absoluteStart, absoluteEnd);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-300 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Property Lifecycle Overview
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {stats.propertyCount} {stats.propertyCount === 1 ? 'property' : 'properties'} | {stats.timelineSpan}
        </p>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {properties.map((property) => {
          const propertyEvents = events
            .filter((e) => e.propertyId === property.id)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
          const duration = getPropertyDuration(property, absoluteEnd);

          return (
            <div
              key={property.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div
                className="px-6 py-4 border-b-4"
                style={{ borderColor: property.color }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1">
                    {property.name}
                  </h3>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
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
                {property.address && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{property.address}</p>
                )}
              </div>

              {/* Card Body */}
              <div className="px-6 py-4">
                {/* Mini Timeline */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                    Timeline
                  </div>
                  <div className="relative h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Duration
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {duration.formatted}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Activity className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Events
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {propertyEvents.length}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Value
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {property.purchasePrice ? `${(property.purchasePrice / 1000).toFixed(0)}k` : '-'}
                    </div>
                  </div>
                </div>

                {/* Event List */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                    Key Events ({propertyEvents.length})
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {propertyEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-900/50 rounded px-2 py-1.5"
                      >
                        <span className="text-base">{getEventIcon(event.type)}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 flex-1">
                          {getShortEventName(event.type)}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatEventDate(event.date).split(',')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                {property.purchaseDate && (
                  <span>Purchased: {formatEventDate(property.purchaseDate)}</span>
                )}
                {property.saleDate && (
                  <span className="ml-4">Sold: {formatEventDate(property.saleDate)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
