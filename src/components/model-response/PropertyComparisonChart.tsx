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
import { Home, TrendingUp } from 'lucide-react';
import type { Property } from '@/types/model-response';

interface PropertyComparisonChartProps {
  properties: Property[];
  delay?: number;
}

export default function PropertyComparisonChart({
  properties,
  delay = 0,
}: PropertyComparisonChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Extract property data
  const chartData = properties.map((property, index) => {
    const purchaseEvent = property.property_history?.find(
      (e) => e.event.toLowerCase() === 'purchased' || e.event.toLowerCase() === 'purchase'
    );
    const saleEvent = property.property_history?.find(
      (e) => e.event.toLowerCase() === 'sold' || e.event.toLowerCase() === 'sale'
    );

    const purchasePrice = purchaseEvent?.price || 0;
    const salePrice = saleEvent?.price || 0;
    const gain = salePrice - purchasePrice;
    const gainPercentage = purchasePrice > 0 ? ((gain / purchasePrice) * 100).toFixed(1) : '0';

    return {
      address: property.address.split(',')[0], // Short name
      fullAddress: property.address,
      purchase: purchasePrice,
      sale: salePrice,
      gain,
      gainPercentage,
      color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'][index % 5],
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl min-w-[200px]">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {data.fullAddress}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Purchase:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.purchase)}
              </span>
            </div>
            {data.sale > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sale:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(data.sale)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Gain:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(data.gain)} ({data.gainPercentage}%)
                  </span>
                </div>
              </>
            )}
          </div>
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
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
          <Home className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Property Comparison
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="address"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-400 text-xs"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />
          <Bar
            dataKey="purchase"
            name="Purchase Price"
            fill="#3B82F6"
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />
          <Bar
            dataKey="sale"
            name="Sale Price"
            fill="#10B981"
            radius={[8, 8, 0, 0]}
            animationDuration={1200}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Property Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {chartData.map((property, index) => (
          <motion.div
            key={property.address}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 + index * 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: property.color }}
              />
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {property.address}
              </h4>
            </div>
            {property.gain > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Capital Gain</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(property.gain)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-semibold">+{property.gainPercentage}%</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Not yet sold
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
