'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Home, DollarSign, Calculator, BookOpen, Wrench, ChevronDown, ChevronRight, Sparkles, Scale } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { type ReportDisplayData } from '@/types/report-display';

interface SimplifiedPropertyViewProps {
  reportData: ReportDisplayData;
}

export default function SimplifiedPropertyView({
  reportData
}: SimplifiedPropertyViewProps) {
  const [expandedCalc, setExpandedCalc] = useState(false);

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
    <div className="space-y-8 px-6 py-8 relative">
      {/* Decorative gradient divider before first section */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent mb-4"></div>

      {/* SECTION 1: TIMELINE OF EVENTS - Modern Table Design */}
      <section>
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 shadow-md backdrop-blur-sm transition-all hover:shadow-lg hover:scale-105">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
            Timeline of Events
          </h2>
        </div>

        {/* Modern Table */}
        {timelineEvents.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header with Enhanced Glow */}
                <thead className="bg-gradient-to-r from-blue-500/15 via-pink-500/15 to-purple-500/15 border-b-2 border-pink-500/30 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-pink-500/10 to-purple-500/10 blur-xl pointer-events-none"></div>
                  <tr className="relative z-10">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap tracking-wide">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wide">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap tracking-wide">
                      Impact
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {timelineEvents.map((event, index) => {
                    const eventStyle = getEventStyle(event.event);
                    const EventIcon = eventStyle.icon;

                    // Get border color based on event type
                    const getBorderColor = () => {
                      const type = event.event.toLowerCase();
                      if (type.includes('purchase')) return 'border-l-blue-500';
                      if (type.includes('move in')) return 'border-l-green-500';
                      if (type.includes('move out')) return 'border-l-amber-500';
                      if (type.includes('improvement')) return 'border-l-purple-500';
                      if (type.includes('sale')) return 'border-l-red-500';
                      if (type.includes('rent')) return 'border-l-blue-400';
                      return 'border-l-gray-400';
                    };

                    // Get icon color based on event type
                    const getIconColor = () => {
                      const type = event.event.toLowerCase();
                      if (type.includes('purchase')) return 'text-blue-500 dark:text-blue-400';
                      if (type.includes('move in')) return 'text-green-500 dark:text-green-400';
                      if (type.includes('move out')) return 'text-amber-500 dark:text-amber-400';
                      if (type.includes('improvement')) return 'text-purple-500 dark:text-purple-400';
                      if (type.includes('sale')) return 'text-red-500 dark:text-red-400';
                      if (type.includes('rent')) return 'text-blue-400 dark:text-blue-300';
                      return 'text-gray-500 dark:text-gray-400';
                    };

                    // Determine impact/status badge based on event type
                    const getImpactBadge = () => {
                      const type = event.event.toLowerCase();
                      if (type.includes('move in')) {
                        return { text: '✓ PPR Active', color: 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/50 shadow-sm' };
                      } else if (type.includes('move out')) {
                        return { text: '⚠️ PPR Ends', color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 shadow-sm' };
                      } else if (type.includes('rent start')) {
                        return { text: 'Rental', color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50 shadow-sm' };
                      } else if (type.includes('rent end')) {
                        return { text: 'Vacant', color: 'bg-gray-500/10 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/50 shadow-sm' };
                      } else if (type.includes('purchase')) {
                        return { text: 'Owned', color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50 shadow-sm' };
                      } else if (type.includes('improvement')) {
                        return { text: 'Cost Base +', color: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50 shadow-sm' };
                      } else if (type.includes('sale')) {
                        return { text: 'Disposed', color: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50 shadow-sm' };
                      }
                      return { text: 'Status Change', color: 'bg-gray-500/10 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/50 shadow-sm' };
                    };

                    const impactBadge = getImpactBadge();
                    const borderColor = getBorderColor();
                    const iconColor = getIconColor();

                    return (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3, ease: "easeOut" }}
                        className={`
                          border-l-4 ${borderColor}
                          hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent dark:hover:from-blue-950/30 dark:hover:to-transparent
                          transition-all duration-300 ease-out
                          ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/80 dark:bg-gray-800/50'}
                          hover:shadow-lg cursor-pointer group
                        `}
                      >
                        {/* Date Column with separator */}
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap relative">
                          {formatDate(event.date)}
                          <div className="absolute right-0 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700"></div>
                        </td>

                        {/* Event Type Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${eventStyle.bgColor} flex-shrink-0 ring-2 ring-offset-1 ring-${borderColor.replace('border-l-', '')}/30 shadow-sm`}>
                              <EventIcon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {event.event}
                            </span>
                          </div>
                        </td>

                        {/* Details Column */}
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {event.details}
                        </td>

                        {/* Impact Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full border-2 ${impactBadge.color} transition-all duration-200 hover:scale-110 hover:shadow-lg`}>
                            {impactBadge.text}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No timeline events available
            </p>
          </div>
        )}
      </section>

      {/* Decorative gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent"></div>

      {/* SECTION 2: CGT CALCULATION - Compact Colorful Timeline */}
      <section>
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shadow-sm backdrop-blur-sm">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            CGT Calculation
          </h2>
        </div>

        <div className="relative">
          {/* Connecting Line - Animated Gradient */}
          {calculationSteps.length > 1 && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400 origin-top"
              style={{
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
              }}
            />
          )}

          {/* Calculation Steps */}
          <div className="space-y-2">
            {calculationSteps.map((step: any, index: number) => {
              const cleanDescription = step.description?.replace(/\s*\([^)]*\)/g, '').trim() || '';
              const isLastStep = index === calculationSteps.length - 1;

              // Color themes for steps
              const colors = [
                { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-l-blue-400', circle: 'bg-gradient-to-br from-blue-500 to-cyan-500', formula: 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800', badge: 'bg-blue-500 text-white' },
                { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-l-purple-400', circle: 'bg-gradient-to-br from-purple-500 to-pink-500', formula: 'bg-purple-100/50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800', badge: 'bg-purple-500 text-white' },
                { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-l-cyan-400', circle: 'bg-gradient-to-br from-cyan-500 to-blue-500', formula: 'bg-cyan-100/50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800', badge: 'bg-cyan-500 text-white' },
                { bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-l-indigo-400', circle: 'bg-gradient-to-br from-indigo-500 to-purple-500', formula: 'bg-indigo-100/50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800', badge: 'bg-indigo-500 text-white' },
                { bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-l-teal-400', circle: 'bg-gradient-to-br from-teal-500 to-cyan-500', formula: 'bg-teal-100/50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800', badge: 'bg-teal-500 text-white' },
              ];

              const stepColor = isLastStep
                ? { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-l-green-500', circle: 'bg-gradient-to-br from-green-500 to-emerald-500', formula: 'bg-green-100/50 dark:bg-green-900/30 border-green-200 dark:border-green-800', badge: 'bg-green-600 text-white' }
                : colors[index % colors.length];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                  className="relative pl-10"
                >
                  {/* Step Circle - Smaller with Gradient */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                    className={`absolute left-0 top-1.5 w-6 h-6 rounded-full ${stepColor.circle} flex items-center justify-center shadow-lg z-10`}
                  >
                    <span className="text-xs font-bold text-white">{step.step}</span>
                  </motion.div>

                  {/* Step Card - Colorful with Left Border and Glow for Last Step */}
                  <div className={`${stepColor.bg} rounded-lg border border-gray-200 dark:border-gray-700 ${stepColor.border} border-l-4 p-3 hover:shadow-lg transition-all duration-300 ${isLastStep ? 'ring-2 ring-green-400/50 shadow-xl' : ''}`}>
                    {/* Step Title */}
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-2">
                      {cleanDescription}
                      {isLastStep && <Sparkles className="w-3 h-3 text-green-500" />}
                    </div>

                    {/* Formula Box with Inline Result */}
                    {step.calculation && (
                      <div className={`${stepColor.formula} rounded px-2 py-1.5 border`}>
                        <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                          {step.calculation}
                          {step.result !== null && step.result !== undefined && (
                            <span className="font-bold text-gray-900 dark:text-white">
                              {' = '}
                              {typeof step.result === 'number' ? formatCurrency(step.result) : step.result}
                            </span>
                          )}
                        </code>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

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

      {/* Decorative gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"></div>

      {/* SECTION 3: APPLICABLE RULES - Dark Green Cards */}
      <section>
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 shadow-sm backdrop-blur-sm">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Applicable Rules
          </h2>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {applicableRules.length > 0 ? applicableRules.map((rule, index) => (
            <motion.div
              key={`rule-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
              className="relative bg-gradient-to-br from-emerald-800/95 to-teal-900/95 dark:from-emerald-900 dark:to-teal-950 rounded-lg border-2 border-emerald-500/50 dark:border-emerald-600/40 p-4 hover:shadow-2xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:scale-[1.02] group overflow-hidden"
            >
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
              }}></div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Legal Scale Icon */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600/30 backdrop-blur-sm flex-shrink-0">
                    <Scale className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div className="flex-1">
                    {/* Rule ID badge */}
                    {rule.section && (
                      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-emerald-600/40 dark:bg-emerald-700/50 text-emerald-100 dark:text-emerald-200 border border-emerald-500/30 mb-2">
                        {rule.section}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rule title */}
                <h4 className="font-bold text-sm text-white dark:text-gray-100 mb-2">
                  {rule.name}
                </h4>

                {/* Rule description */}
                <p className="text-xs text-gray-200 dark:text-gray-300 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-2 text-center py-6">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
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
