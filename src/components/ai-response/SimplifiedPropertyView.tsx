'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Home, DollarSign, Calculator, BookOpen, Wrench } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ReportDisplayData } from '@/types/report-display';

interface SimplifiedPropertyViewProps {
  reportData: ReportDisplayData;
}

export default function SimplifiedPropertyView({
  reportData
}: SimplifiedPropertyViewProps) {

  // Extract transformed data
  const { timelineEvents, calculationSteps, applicableRules } = reportData;

  // Format date consistently (DD MMM YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Get icon and color for event type
  const getEventStyle = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('purchase')) {
      return { icon: Home, color: 'from-blue-500 to-pink-400', bgColor: 'from-blue-500/20 to-pink-400/20' };
    } else if (type.includes('move in')) {
      return { icon: Home, color: 'from-green-500 to-emerald-500', bgColor: 'from-green-500/20 to-emerald-500/20' };
    } else if (type.includes('move out')) {
      return { icon: Home, color: 'from-amber-500 to-orange-500', bgColor: 'from-amber-500/20 to-orange-500/20' };
    } else if (type.includes('improvement')) {
      return { icon: Wrench, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-500/20 to-pink-500/20' };
    } else if (type.includes('sale')) {
      return { icon: DollarSign, color: 'from-red-500 to-pink-500', bgColor: 'from-red-500/20 to-pink-500/20' };
    } else if (type.includes('rent')) {
      return { icon: Calendar, color: 'from-blue-500 to-pink-400', bgColor: 'from-blue-500/20 to-pink-400/20' };
    }
    return { icon: Calendar, color: 'from-gray-500 to-slate-500', bgColor: 'from-gray-500/20 to-slate-500/20' };
  };

  return (
    <div className="space-y-8 px-6 py-8">
      {/* SECTION 1: TIMELINE OF EVENTS - Vertical Timeline Design */}
      <section>
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-pink-500/20">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
            Timeline of Events
          </h2>
        </div>

        {/* Vertical Timeline */}
        <div className="relative pl-8">
          {/* Gradient timeline line */}
          <div className="absolute left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-pink-500 to-purple-500 rounded-full" />

          {/* Event cards */}
          {timelineEvents.length > 0 ? timelineEvents.map((event, index) => {
            const eventStyle = getEventStyle(event.event);
            const EventIcon = eventStyle.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="relative mb-6 group"
              >
                {/* Event dot on timeline */}
                <div className={`absolute left-[-1.75rem] top-4 w-6 h-6 rounded-full bg-gradient-to-br ${eventStyle.color} border-4 border-white dark:border-gray-900 shadow-lg z-10`} />

                {/* Event card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-xl transition-all border-l-4 border-pink-500 group-hover:scale-[1.02] duration-300">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${eventStyle.bgColor} flex-shrink-0`}>
                      <EventIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          {event.event}
                        </h4>
                        <span className="text-sm font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 px-3 py-1 rounded-full">
                          {formatDate(event.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {event.details}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic">
              No timeline events available
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: CGT CALCULATION - Connected Step Flow */}
      <section>
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <Calculator className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            CGT Calculation
          </h2>
        </div>

        <div className="space-y-6 relative">
          {/* Progress connector line */}
          {calculationSteps.length > 1 && (
            <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gradient-to-b from-cyan-500/50 to-blue-500/50" />
          )}

          {calculationSteps.map((step: any, index: number) => {
            // Clean step description (remove bracketed text)
            const cleanDescription = step.description?.replace(/\s*\([^)]*\)/g, '').trim() || '';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                className="relative"
              >
                {/* Large gradient step number */}
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border-4 border-white dark:border-gray-900 z-10">
                  <span className="text-lg font-bold text-white">{step.step}</span>
                </div>

                {/* Step card with gradient border */}
                <div className="ml-16 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-l-4 border-cyan-500">
                  <div className="flex items-start gap-3 mb-4">
                    <Calculator className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-1 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {cleanDescription}
                    </h3>
                  </div>

                  {/* Glassmorphism formula box */}
                  {step.calculation && (
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur rounded-lg p-4 border border-cyan-500/20 mb-4">
                      <code className="font-mono text-sm text-gray-800 dark:text-gray-200">
                        {step.calculation}
                      </code>
                    </div>
                  )}

                  {/* Result badge with gradient */}
                  {step.result !== null && step.result !== undefined && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full font-bold shadow-lg mb-3">
                      <TrendingUp className="w-4 h-4" />
                      <span>Result: {typeof step.result === 'number' ? formatCurrency(step.result) : step.result}</span>
                    </div>
                  )}

                  {/* Additional details */}
                  {step.details && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-950/20 p-3 rounded">
                      {step.details}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* If no calculation steps, show a basic calculation from summary metrics */}
          {calculationSteps.length === 0 && reportData && (
            <div className="space-y-4 text-sm">
              {reportData.salePrice !== undefined && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">Sale Price:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(reportData.salePrice)}
                  </span>
                </div>
              )}
              {reportData.costBase !== undefined && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">Cost Base:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(reportData.costBase)}
                  </span>
                </div>
              )}
              {reportData.capitalGain !== undefined && (
                <div className="flex justify-between py-2 border-b-2 border-gray-400 dark:border-gray-600">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Capital Gain:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(reportData.capitalGain)}
                  </span>
                </div>
              )}
              {reportData.netCapitalGain !== undefined && (
                <div className="flex justify-between py-2 bg-blue-50 dark:bg-blue-900/20 px-4 rounded">
                  <span className="font-bold text-gray-900 dark:text-gray-100">Taxable Capital Gain:</span>
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    {formatCurrency(reportData.netCapitalGain)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: APPLICABLE RULES - Icon-Enhanced Card Grid */}
      <section>
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Applicable Rules
          </h2>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applicableRules.length > 0 ? applicableRules.map((rule, index) => (
            <motion.div
              key={`rule-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-xl transition-all border-l-4 border-purple-500 hover:scale-[1.02] duration-300"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Rule ID badge */}
                  {rule.section && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full mb-2">
                      {rule.section}
                    </span>
                  )}

                  {/* Rule title */}
                  <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">
                    {rule.name}
                  </h4>

                  {/* Rule description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-2 text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No specific tax law sections identified in this analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
