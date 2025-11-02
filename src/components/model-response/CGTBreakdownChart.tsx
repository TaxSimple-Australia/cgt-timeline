'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface CGTBreakdownChartProps {
  data: {
    capital_gain?: number;
    cost_base?: number;
    discount_applied?: number;
    tax_payable?: number;
  };
  delay?: number;
}

export default function CGTBreakdownChart({ data, delay = 0 }: CGTBreakdownChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = [
    {
      name: 'Capital Gain',
      value: data.capital_gain || 0,
      color: '#10B981',
    },
    {
      name: 'Cost Base',
      value: data.cost_base || 0,
      color: '#6366F1',
    },
    {
      name: 'CGT Discount',
      value: data.discount_applied || 0,
      color: '#3B82F6',
    },
    {
      name: 'Tax Payable',
      value: data.tax_payable || 0,
      color: '#8B5CF6',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {payload[0].payload.name}
          </p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          CGT Financial Breakdown
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-400 text-xs"
          />
          <YAxis
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-400 text-xs"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1000}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats Below Chart */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {chartData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.1 + index * 0.05 }}
            className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {item.name}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(item.value)}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
