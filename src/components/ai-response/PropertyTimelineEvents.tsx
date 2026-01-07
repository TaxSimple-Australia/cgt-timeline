'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { TimelineEvent } from '@/types/model-response';
import { cn } from '@/lib/utils';

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

const getEventRowColor = (event: string): string => {
  const eventLower = event.toLowerCase();
  if (eventLower.includes('purchase')) return 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/30';
  if (eventLower.includes('sale')) return 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/30';
  if (eventLower.includes('move in')) return 'bg-green-50/40 dark:bg-green-950/20 hover:bg-green-50/60 dark:hover:bg-green-950/30';
  if (eventLower.includes('move out')) return 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/30';
  if (eventLower.includes('rent')) return 'bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/60 dark:hover:bg-purple-950/30';
  if (eventLower.includes('improvement')) return 'bg-cyan-50/40 dark:bg-cyan-950/20 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30';
  return 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750';
};

export default function PropertyTimelineEvents({ timeline }: PropertyTimelineEventsProps) {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        Timeline of Events
      </h4>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Event
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {timeline.map((event, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {event.date}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getEventBadgeColor(event.event)}`}>
                    {event.event}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
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
