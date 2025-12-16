'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { TimelineEvent } from '@/types/model-response';

interface PropertyTimelineEventsProps {
  timeline: TimelineEvent[];
}

const getEventBadgeColor = (event: string): string => {
  const eventLower = event.toLowerCase();
  if (eventLower.includes('purchase')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
  if (eventLower.includes('sale')) return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
  if (eventLower.includes('move in')) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
  if (eventLower.includes('move out')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
  if (eventLower.includes('rent')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
  if (eventLower.includes('improvement')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

export default function PropertyTimelineEvents({ timeline }: PropertyTimelineEventsProps) {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-500" />
        Timeline
      </h4>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                Date
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Event
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {timeline.map((event, index) => (
              <tr
                key={index}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {event.date}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getEventBadgeColor(event.event)}`}>
                    {event.event}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {event.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
