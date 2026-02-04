'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { PropertyAnalysis } from '@/types/model-response';

interface PropertyTimelineTableProps {
  property: PropertyAnalysis;
}

// Helper function to get event badge color
function getEventColor(eventType: string): string {
  const type = eventType.toLowerCase();
  if (type.includes('purchase')) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700';
  if (type.includes('move in')) return 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700';
  if (type.includes('improvement')) return 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700';
  if (type.includes('sale')) return 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 border-red-300 dark:border-red-700';
  if (type.includes('move out')) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700';
  if (type.includes('rent')) return 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700';
  if (type.includes('subdivision')) return 'bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-700';
  return 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600';
}

export default function PropertyTimelineTable({
  property,
}: PropertyTimelineTableProps) {
  const timelineEvents = property.timeline || property.timeline_of_events || [];

  if (timelineEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
          Timeline of Events
        </span>
      </div>

      {/* Vertical timeline table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-orange-100 dark:bg-orange-900/40">
              <th className="px-4 py-2 text-left font-semibold text-orange-900 dark:text-orange-100">
                Date
              </th>
              <th className="px-4 py-2 text-left font-semibold text-orange-900 dark:text-orange-100">
                Event
              </th>
              <th className="px-4 py-2 text-left font-semibold text-orange-900 dark:text-orange-100">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {timelineEvents.map((event, index) => (
              <tr
                key={index}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                {/* Date */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold whitespace-nowrap">
                  {event.date}
                </td>

                {/* Event badge */}
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${getEventColor(event.event)}`}>
                    {event.event}
                  </span>
                </td>

                {/* Details */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {event.details || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
