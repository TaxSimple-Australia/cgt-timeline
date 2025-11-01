'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DollarSign } from 'lucide-react';

interface TaxBreakdownPieChartProps {
  data: {
    capital_gain?: number;
    discount_applied?: number;
    tax_payable?: number;
  };
  delay?: number;
}

export default function TaxBreakdownPieChart({
  data,
  delay = 0,
}: TaxBreakdownPieChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const capital_gain = data.capital_gain || 0;
  const discount_applied = data.discount_applied || 0;
  const tax_payable = data.tax_payable || 0;

  // Calculate what you keep after tax
  const amountKept = capital_gain - tax_payable;

  const chartData = [
    {
      name: 'Amount You Keep',
      value: amountKept,
      color: '#10B981',
      percentage: ((amountKept / capital_gain) * 100).toFixed(1),
    },
    {
      name: 'Tax Payable',
      value: tax_payable,
      color: '#EF4444',
      percentage: ((tax_payable / capital_gain) * 100).toFixed(1),
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {payload[0].name}
          </p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {payload[0].payload.percentage}% of capital gain
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          After-Tax Breakdown
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with amounts */}
      <div className="mt-4 space-y-3">
        {chartData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + 0.2 + index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.percentage}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Discount Info */}
      {discount_applied > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.5 }}
          className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl"
        >
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
            <span>50% CGT Discount Applied</span>
            <span className="font-semibold">{formatCurrency(discount_applied)}</span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
