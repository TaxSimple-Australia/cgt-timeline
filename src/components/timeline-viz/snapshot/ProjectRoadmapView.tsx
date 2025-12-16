'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import {
  calculatePortfolioStats,
  getDatePosition,
  getPropertyDuration,
  formatEventDate,
  generateYearMarkers,
} from '@/lib/snapshot-utils';

interface ProjectRoadmapViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function ProjectRoadmapView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: ProjectRoadmapViewProps) {
  const stats = calculatePortfolioStats(properties, events, absoluteStart, absoluteEnd);
  const yearMarkers = generateYearMarkers(absoluteStart, absoluteEnd);

  // Filter for milestone events only
  const getMilestones = (propertyId: string) => {
    return events.filter(
      (e) =>
        e.propertyId === propertyId &&
        (e.type === 'purchase' || e.type === 'sale' || (e.type === 'improvement' && (e.amount || 0) > 50000))
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-300 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Project Roadmap
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {stats.propertyCount} {stats.propertyCount === 1 ? 'property' : 'properties'} | {stats.timelineSpan} |{' '}
          {events.filter((e) => e.type === 'purchase' || e.type === 'sale' || (e.type === 'improvement' && (e.amount || 0) > 50000)).length} milestones
        </p>
      </div>

      <div className="relative h-[calc(100%-100px)]">
        {/* Header Row */}
        <div className="flex gap-6 mb-6">
          <div className="flex-shrink-0" style={{ width: '280px' }}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Properties
            </h3>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Timeline
            </h3>
          </div>
        </div>

        <div className="flex gap-6 h-[calc(100%-40px)]">
          {/* Left Sidebar - Property List aligned to bars */}
          <div className="flex-shrink-0 relative" style={{ width: '280px', minHeight: `${properties.length * 80}px` }}>
            {properties.map((property, index) => {
              const duration = getPropertyDuration(property, absoluteEnd);
              const yPos = index * 80 + 116; // 24 (padding) + 48 (year markers height) + 24 (margin-bottom) + 20 (bar offset)
              return (
                <div
                  key={property.id}
                  className="absolute rounded-lg shadow-sm border-2"
                  style={{
                    backgroundColor: property.color,
                    borderColor: property.color,
                    top: `${yPos}px`,
                    left: 0,
                    width: '280px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                  }}
                >
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.3',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    {property.name || 'Property Name'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center - Gantt Timeline */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700 overflow-x-auto">
            {/* Year Markers */}
            <div className="relative h-12 mb-6">
              {yearMarkers.map(({ year, position }) => (
                <div
                  key={year}
                  className="absolute top-0"
                  style={{ left: `${position}%` }}
                >
                  <div className="absolute -translate-x-1/2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {year}
                  </div>
                  <div
                    className="absolute top-8 w-px bg-slate-300 dark:bg-slate-600 -translate-x-1/2"
                    style={{ height: `${properties.length * 80 + 40}px` }}
                  />
                </div>
              ))}
            </div>

            {/* Property Gantt Bars */}
            <div className="relative" style={{ minHeight: `${properties.length * 80}px` }}>
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
                const yPos = index * 80 + 20;
                const milestones = getMilestones(property.id);
                const duration = getPropertyDuration(property, absoluteEnd);

                return (
                  <div key={property.id} className="absolute left-0 right-0" style={{ top: `${yPos}px` }}>
                    {/* Ownership Bar with Gradient */}
                    <div
                      className="absolute h-8 rounded shadow-sm flex items-center justify-between px-3"
                      style={{
                        background: `linear-gradient(to right, ${property.color}ee, ${property.color}99)`,
                        left: `${startPos}%`,
                        width: `${endPos - startPos}%`,
                        border: `1px solid ${property.color}`,
                      }}
                    >
                      {/* Duration in center */}
                      <div className="flex-1 text-center">
                        <span className="text-xs font-semibold text-white">
                          Duration: {duration.formatted}
                        </span>
                      </div>
                      {/* Status label on right */}
                      {property.currentStatus && (
                        <span className="text-xs font-semibold text-white uppercase tracking-wide">
                          {property.currentStatus === 'ppr' ? 'PPR' : property.currentStatus}
                        </span>
                      )}
                    </div>

                    {/* Milestone Diamonds */}
                    {milestones.map((milestone) => {
                      const milestonePos = getDatePosition(milestone.date, absoluteStart, absoluteEnd);
                      return (
                        <div
                          key={milestone.id}
                          className="absolute group"
                          style={{
                            left: `${milestonePos}%`,
                            top: '4px',
                          }}
                        >
                          {/* Diamond Shape - Inside the bar */}
                          <div
                            className="absolute -translate-x-1/2 w-5 h-5 transform rotate-45 shadow-md cursor-pointer hover:scale-125 transition-transform z-10"
                            style={{
                              backgroundColor:
                                milestone.type === 'purchase'
                                  ? '#10b981'
                                  : milestone.type === 'sale'
                                  ? '#8b5cf6'
                                  : '#f59e0b',
                              border: '2px solid white',
                            }}
                          />

                          {/* Tooltip on Hover */}
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-3 py-2 rounded shadow-xl whitespace-nowrap">
                              <div className="font-semibold">{milestone.title}</div>
                              <div className="text-xs opacity-80">{formatEventDate(milestone.date)}</div>
                              {milestone.amount && (
                                <div className="text-xs opacity-80">
                                  ${milestone.amount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 transform rotate-45 bg-green-500 border-2 border-white" />
                  <span className="text-slate-700 dark:text-slate-300">Purchase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 transform rotate-45 bg-purple-500 border-2 border-white" />
                  <span className="text-slate-700 dark:text-slate-300">Sale</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 transform rotate-45 bg-orange-500 border-2 border-white" />
                  <span className="text-slate-700 dark:text-slate-300">Major Improvement (&gt;$50k)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
