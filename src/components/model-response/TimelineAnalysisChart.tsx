'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Calendar } from 'lucide-react';

interface TimelineAnalysis {
  status: string;
  analysis_period?: {
    start: string;
    end: string;
    total_days: number;
  };
  gaps?: Array<{
    start_date: string;
    end_date: string;
    duration_days: number;
    owned_properties: string[];
  }>;
  overlaps?: Array<{
    start_date: string;
    end_date: string;
    duration_days: number;
    properties: string[];
  }>;
  statistics?: {
    total_days: number;
    gap_days: number;
    overlap_days: number;
    accounted_days: number;
    accounted_percentage: number;
    total_gaps: number;
    total_overlaps: number;
  };
  has_issues?: boolean;
}

interface TimelineAnalysisChartProps {
  timelineAnalysis: TimelineAnalysis;
}

export default function TimelineAnalysisChart({ timelineAnalysis }: TimelineAnalysisChartProps) {
  const stats = timelineAnalysis.statistics;
  const period = timelineAnalysis.analysis_period;

  if (!stats || !period) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (days: number) => {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;

    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}m`);
    if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays}d`);

    return parts.join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Timeline Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(period.start)} - {formatDate(period.end)} ({formatDuration(period.total_days)})
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            timelineAnalysis.has_issues
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}>
            {timelineAnalysis.has_issues ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {timelineAnalysis.has_issues ? 'Issues Found' : 'No Issues'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Timeline Coverage
            </span>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {stats.accounted_percentage.toFixed(1)}% Accounted
            </span>
          </div>

          {/* Progress bar showing coverage */}
          <div className="relative h-8 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
            {/* Accounted days */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.accounted_percentage}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700"
            />

            {/* Gap indicator */}
            {stats.gap_days > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute right-0 top-0 h-full bg-gradient-to-r from-amber-400 to-amber-500"
                style={{ width: `${(stats.gap_days / stats.total_days) * 100}%` }}
              />
            )}

            {/* Overlap indicator */}
            {stats.overlap_days > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute left-1/2 top-0 h-full bg-gradient-to-r from-red-400 to-red-500"
                style={{
                  width: `${(stats.overlap_days / stats.total_days) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            )}

            {/* Percentage label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {stats.accounted_percentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Accounted ({formatDuration(stats.accounted_days)})
              </span>
            </div>
            {stats.gap_days > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Gaps ({formatDuration(stats.gap_days)})
                </span>
              </div>
            )}
            {stats.overlap_days > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Overlaps ({formatDuration(stats.overlap_days)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Days"
            value={stats.total_days.toLocaleString()}
            icon={<Calendar className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            label="Gaps Found"
            value={stats.total_gaps.toString()}
            icon={<AlertTriangle className="w-4 h-4" />}
            color={stats.total_gaps > 0 ? "amber" : "green"}
          />
          <StatCard
            label="Overlaps Found"
            value={stats.total_overlaps.toString()}
            icon={<AlertTriangle className="w-4 h-4" />}
            color={stats.total_overlaps > 0 ? "red" : "green"}
          />
          <StatCard
            label="Coverage"
            value={`${stats.accounted_percentage.toFixed(1)}%`}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color={stats.accounted_percentage >= 90 ? "green" : stats.accounted_percentage >= 50 ? "amber" : "red"}
          />
        </div>

        {/* Gaps Details */}
        {timelineAnalysis.gaps && timelineAnalysis.gaps.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Timeline Gaps
            </h4>
            <div className="space-y-2">
              {timelineAnalysis.gaps.map((gap, index) => (
                <div
                  key={index}
                  className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Gap #{index + 1}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(gap.start_date)} - {formatDate(gap.end_date)}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-medium rounded">
                      {formatDuration(gap.duration_days)}
                    </span>
                  </div>
                  {gap.owned_properties && gap.owned_properties.length > 0 ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Properties during gap: {gap.owned_properties.join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      No property ownership recorded during this period
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overlaps Details */}
        {timelineAnalysis.overlaps && timelineAnalysis.overlaps.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              Timeline Overlaps
            </h4>
            <div className="space-y-2">
              {timelineAnalysis.overlaps.map((overlap, index) => (
                <div
                  key={index}
                  className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Overlap #{index + 1}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatDate(overlap.start_date)} - {formatDate(overlap.end_date)}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200 text-xs font-medium rounded">
                      {formatDuration(overlap.duration_days)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Overlapping properties: {overlap.properties.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg border ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </motion.div>
  );
}
