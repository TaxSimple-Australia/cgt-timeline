'use client';

import React from 'react';
import { PropertyAnalysis, TimelineEvent, OwnershipPeriod } from '@/types/model-response';

interface TimelineOwnershipMergedTableProps {
  property: PropertyAnalysis;
}

interface MergedRow {
  date: string;
  event: string;
  details: string;
  periodType?: string;
  dateRange?: string;
  legislation?: string;
}

// Helper function to parse date string (handles formats like "15 Mar 2015")
function parseAPIDate(dateStr: string): Date {
  // Try parsing the date - API returns dates in format like "15 Mar 2015"
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  // Fallback: return invalid date
  return new Date(NaN);
}

// Helper function to match timeline events with ownership periods by date range
function mergeTimelineWithOwnership(
  timelineEvents: TimelineEvent[],
  ownershipPeriods: OwnershipPeriod[],
  property: PropertyAnalysis
): MergedRow[] {
  const merged: MergedRow[] = [];

  // Sort timeline events by date
  const sortedEvents = [...timelineEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedEvents.forEach((event) => {
    const eventDate = parseAPIDate(event.date);

    // Find the ownership period that contains this event date
    let matchingPeriod: OwnershipPeriod | undefined;

    for (const period of ownershipPeriods) {
      if (period.start_date && period.end_date) {
        const periodStart = parseAPIDate(period.start_date);
        const periodEnd = parseAPIDate(period.end_date);

        // Check if event date falls within this period
        if (eventDate >= periodStart && eventDate <= periodEnd) {
          matchingPeriod = period;
          break;
        }
      }
    }

    // If no matching period found by date, try to find by matching first/last event
    if (!matchingPeriod && ownershipPeriods.length > 0) {
      // Use the period that best matches based on event type
      if (event.event.toLowerCase().includes('main residence') ||
          event.event.toLowerCase().includes('move in')) {
        matchingPeriod = ownershipPeriods.find(p =>
          p.period_type.toLowerCase().includes('main residence')
        );
      }
    }

    // Build formatted date range string (e.g., "15 Mar 2015 – 20 Nov 2024")
    let dateRange = '';
    if (matchingPeriod && matchingPeriod.start_date && matchingPeriod.end_date) {
      dateRange = `${matchingPeriod.start_date} – ${matchingPeriod.end_date}`;
    }

    merged.push({
      date: event.date,
      event: event.event,
      details: event.details,
      periodType: matchingPeriod?.period_type,
      dateRange: dateRange,
      legislation: matchingPeriod?.note,
    });
  });

  return merged;
}

export default function TimelineOwnershipMergedTable({
  property,
}: TimelineOwnershipMergedTableProps) {
  // Support both field names: timeline (new API) and timeline_of_events (legacy)
  const timelineEvents = property.timeline || property.timeline_of_events || [];

  const mergedData = mergeTimelineWithOwnership(
    timelineEvents,
    property.ownership_periods || [],
    property
  );

  if (mergedData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No timeline events available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
          📅 Section 2: Timeline & Ownership Analysis
        </span>
      </div>

      {/* Merged Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-100 dark:bg-purple-900/40">
              <th className="px-3 py-3 text-left font-semibold text-purple-900 dark:text-purple-100 whitespace-nowrap">
                Date
              </th>
              <th className="px-3 py-3 text-left font-semibold text-purple-900 dark:text-purple-100">
                Event
              </th>
              <th className="px-3 py-3 text-left font-semibold text-purple-900 dark:text-purple-100">
                Details
              </th>
              <th className="px-3 py-3 text-left font-semibold text-purple-900 dark:text-purple-100">
                Period Type
              </th>
              <th className="px-3 py-3 text-left font-semibold text-purple-900 dark:text-purple-100">
                Date Range
              </th>
              <th className="px-3 py-3 text-left font-semibold text-purple-900 dark:text-purple-100">
                Legislation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mergedData.map((row, index) => (
              <tr
                key={index}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <td className="px-3 py-3 font-mono text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {new Date(row.date).toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-3 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {row.event}
                </td>
                <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                  {row.details}
                </td>
                <td className="px-3 py-3">
                  {row.periodType ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      {row.periodType}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                  {row.dateRange || '—'}
                </td>
                <td className="px-3 py-3">
                  {row.legislation ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {row.legislation}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
