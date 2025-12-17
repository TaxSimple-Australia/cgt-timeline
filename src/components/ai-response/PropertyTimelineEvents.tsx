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
      <h4 className="font-bold text-lg text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        Timeline of Events
      </h4>

      <div className="overflow-hidden rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 border-b-2 border-indigo-300 dark:border-indigo-700">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider w-36 border-r border-indigo-200 dark:border-indigo-700">
                Date
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider w-40 border-r border-indigo-200 dark:border-indigo-700">
                Event
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {timeline.map((event, index) => (
              <tr
                key={index}
                className={cn("transition-all", getEventRowColor(event.event))}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-slate-200 dark:border-slate-700">
                  {event.date}
                </td>
                <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">
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
