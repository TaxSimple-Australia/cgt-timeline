'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
  Cell,
} from 'recharts';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import type { VisualMetrics } from '@/types/model-response';

interface VisualSummaryProps {
  metrics: VisualMetrics;
  delay?: number;
}

export default function VisualSummary({ metrics, delay = 0 }: VisualSummaryProps) {
  const { data_completeness = 0, confidence_score = 0 } = metrics;

  // Convert confidence score (0-1) to percentage
  const confidencePercentage = Math.round(confidence_score * 100);

  // Determine status colors
  const getCompletenessStatus = (value: number) => {
    if (value >= 90) return { color: '#10B981', label: 'Excellent', icon: CheckCircle };
    if (value >= 70) return { color: '#3B82F6', label: 'Good', icon: TrendingUp };
    if (value >= 50) return { color: '#F59E0B', label: 'Fair', icon: AlertCircle };
    return { color: '#EF4444', label: 'Needs Improvement', icon: AlertCircle };
  };

  const getConfidenceStatus = (value: number) => {
    if (value >= 90) return { color: '#10B981', label: 'Very High' };
    if (value >= 70) return { color: '#3B82F6', label: 'High' };
    if (value >= 50) return { color: '#F59E0B', label: 'Moderate' };
    return { color: '#EF4444', label: 'Low' };
  };

  const completenessStatus = getCompletenessStatus(data_completeness);
  const confidenceStatus = getConfidenceStatus(confidencePercentage);

  // Data for radial charts
  const completenessData = [
    {
      name: 'Completeness',
      value: data_completeness,
      fill: completenessStatus.color,
    },
  ];

  const confidenceData = [
    {
      name: 'Confidence',
      value: confidencePercentage,
      fill: confidenceStatus.color,
    },
  ];

  const CompletenessIcon = completenessStatus.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Analysis Metrics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Completeness */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="relative"
        >
          <div className="text-center">
            <div className="relative w-40 h-40 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  data={completenessData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background={{ fill: '#E5E7EB' }}
                    dataKey="value"
                    cornerRadius={10}
                    animationDuration={1000}
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: delay + 0.5, type: 'spring' }}
                >
                  <CompletenessIcon
                    className="w-6 h-6 mb-1"
                    style={{ color: completenessStatus.color }}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: delay + 0.7 }}
                  className="text-2xl font-bold text-gray-800 dark:text-gray-200"
                >
                  {data_completeness}%
                </motion.div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Completeness
              </h4>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${completenessStatus.color}20`,
                  color: completenessStatus.color,
                }}
              >
                {completenessStatus.label}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Confidence Score */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          className="relative"
        >
          <div className="text-center">
            <div className="relative w-40 h-40 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  data={confidenceData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background={{ fill: '#E5E7EB' }}
                    dataKey="value"
                    cornerRadius={10}
                    animationDuration={1200}
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: delay + 0.7 }}
                  className="text-2xl font-bold text-gray-800 dark:text-gray-200"
                >
                  {confidencePercentage}%
                </motion.div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(confidence_score * 100).toFixed(1)}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confidence Score
              </h4>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${confidenceStatus.color}20`,
                  color: confidenceStatus.color,
                }}
              >
                {confidenceStatus.label}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.8 }}
        className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Based on the information provided, our AI model has analyzed your CGT situation
          with {confidenceStatus.label.toLowerCase()} confidence.
        </p>
      </motion.div>
    </motion.div>
  );
}
