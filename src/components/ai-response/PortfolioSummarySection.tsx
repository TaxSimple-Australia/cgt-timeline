'use client';

import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Home, DollarSign, FileText } from 'lucide-react';
import { AnalysisData } from '@/types/model-response';
import { cn } from '@/lib/utils';

interface PortfolioSummarySectionProps {
  data: AnalysisData;
}

export default function PortfolioSummarySection({ data }: PortfolioSummarySectionProps) {
  const totalNetGain = typeof data.total_net_capital_gain === 'string'
    ? parseFloat(data.total_net_capital_gain)
    : data.total_net_capital_gain;

  const totalExemptGains = typeof data.total_exempt_gains === 'string'
    ? parseFloat(data.total_exempt_gains)
    : data.total_exempt_gains;

  const hasNetGain = totalNetGain > 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Header with Analysis Date */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Portfolio CGT Analysis
          </h2>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Analysis Date: {data.analysis_date}</span>
          </div>
        </div>
      </div>

      {/* Portfolio Description */}
      {data.description && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {data.description}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.total_properties}
              </p>
            </div>
          </div>
        </div>

        {/* Properties with CGT */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              data.properties_with_cgt > 0
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-green-100 dark:bg-green-900/30"
            )}>
              <TrendingDown className={cn(
                "w-5 h-5",
                data.properties_with_cgt > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              )} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">CGT Payable</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.properties_with_cgt}
              </p>
            </div>
          </div>
        </div>

        {/* Fully Exempt Properties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fully Exempt</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.properties_fully_exempt}
              </p>
            </div>
          </div>
        </div>

        {/* Total Net Capital Gain */}
        <div className={cn(
          "rounded-lg shadow-md p-5 border",
          hasNetGain
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              hasNetGain
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-green-100 dark:bg-green-900/30"
            )}>
              <DollarSign className={cn(
                "w-5 h-5",
                hasNetGain
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Capital Gain</p>
              <p className={cn(
                "text-2xl font-bold truncate",
                hasNetGain
                  ? "text-red-700 dark:text-red-400"
                  : "text-green-700 dark:text-green-400"
              )}>
                ${totalNetGain.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Exempt Gains */}
      {totalExemptGains > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Total Exempt Gains
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Capital gains fully exempted from CGT
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              ${totalExemptGains.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* General Notes */}
      {data.general_notes && data.general_notes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Key Points
          </h3>
          <ul className="space-y-2">
            {data.general_notes.map((note, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
