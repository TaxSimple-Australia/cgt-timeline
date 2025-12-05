'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GapOverlapDetailsTableProps {
  properties: any[];
  verification?: any;
}

export default function GapOverlapDetailsTable({ properties, verification }: GapOverlapDetailsTableProps) {
  const statistics = verification?.timeline_analysis?.statistics;

  if (!statistics) {
    return null;
  }

  const gapDays = statistics.gap_days || 0;
  const overlapDays = statistics.overlap_days || 0;
  const totalDays = statistics.total_days || 0;

  // Collect properties with cross-property conflicts or issues
  const propertiesWithIssues = properties.filter((p: any) =>
    p.cross_property_conflicts && p.cross_property_conflicts.length > 0
  );

  // If no gaps, overlaps, or issues, don't render
  if (gapDays === 0 && overlapDays === 0 && propertiesWithIssues.length === 0) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              No Timeline Issues Detected
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your timeline has no gaps or overlaps. All periods are accounted for correctly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Timeline Gap & Overlap Analysis
        </h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${
          gapDays === 0
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className={`text-xs font-medium mb-1 ${
            gapDays === 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}>
            Total Gap Days
          </div>
          <div className={`text-2xl font-bold ${
            gapDays === 0
              ? 'text-green-700 dark:text-green-300'
              : 'text-amber-700 dark:text-amber-300'
          }`}>
            {gapDays.toLocaleString()}
          </div>
          <div className={`text-xs mt-1 ${
            gapDays === 0
              ? 'text-green-600 dark:text-green-500'
              : 'text-amber-600 dark:text-amber-500'
          }`}>
            {gapDays === 0 ? 'No gaps found' : `${((gapDays / totalDays) * 100).toFixed(1)}% of total`}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          overlapDays === 0
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
        }`}>
          <div className={`text-xs font-medium mb-1 ${
            overlapDays === 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-purple-600 dark:text-purple-400'
          }`}>
            Total Overlap Days
          </div>
          <div className={`text-2xl font-bold ${
            overlapDays === 0
              ? 'text-green-700 dark:text-green-300'
              : 'text-purple-700 dark:text-purple-300'
          }`}>
            {overlapDays.toLocaleString()}
          </div>
          <div className={`text-xs mt-1 ${
            overlapDays === 0
              ? 'text-green-600 dark:text-green-500'
              : 'text-purple-600 dark:text-purple-500'
          }`}>
            {overlapDays === 0 ? 'No overlaps found' : `${((overlapDays / totalDays) * 100).toFixed(1)}% of total`}
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            Total Timeline Days
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {totalDays.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
            {(totalDays / 365).toFixed(1)} years
          </div>
        </div>
      </div>

      {/* Property-Level Issue Details */}
      {propertiesWithIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
            Cross-Property Conflicts
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Property Address
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Conflict Details
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody>
                {propertiesWithIssues.map((property: any, index: number) => (
                  <tr key={index} className="bg-amber-50 dark:bg-amber-950/20">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {property.address}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <ul className="list-disc list-inside space-y-1">
                        {property.cross_property_conflicts.map((conflict: string, cidx: number) => (
                          <li key={cidx}>{conflict}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-center">
                      <span className="inline-block px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded">
                        REQUIRES REVIEW
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gapDays > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
              What are Timeline Gaps?
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              Timeline gaps occur when there are periods during property ownership where no occupancy status is recorded (neither main residence, rental, nor vacant). These gaps may indicate missing events or periods that need clarification for accurate CGT calculation.
            </p>
          </div>
        )}

        {overlapDays > 0 && (
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
              What are Timeline Overlaps?
            </h4>
            <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
              Timeline overlaps occur when multiple properties claim main residence status on the same dates. Australian tax law only allows one property to be designated as your main residence at any given time (with limited exceptions). Overlaps must be resolved to ensure accurate exemption calculations.
            </p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {(gapDays > 0 || overlapDays > 0) && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Recommendations
          </h4>
          <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
            {gapDays > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Review your timeline for missing events during gap periods. Add move-in, move-out, or rental events as needed.</span>
              </li>
            )}
            {overlapDays > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Resolve main residence overlaps by designating which property was your actual main residence during overlapping periods.</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Consult with a tax professional to ensure your timeline accurately reflects your property history.</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
