'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Calendar, Activity } from 'lucide-react';
import type { Property } from '@/types/model-response';
import { format } from 'date-fns';

interface PropertyTimelineChartProps {
  properties: Property[];
  delay?: number;
}

export default function PropertyTimelineChart({
  properties,
  delay = 0,
}: PropertyTimelineChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Build timeline data
  const buildTimelineData = () => {
    const allEvents: any[] = [];

    properties.forEach((property, propIndex) => {
      property.property_history?.forEach((event) => {
        allEvents.push({
          date: new Date(event.date),
          property: property.address.split(',')[0],
          event: event.event,
          price: event.price || 0,
          fullAddress: property.address,
        });
      });
    });

    // Sort by date
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate cumulative portfolio value over time
    const timelineData: any[] = [];
    let cumulativeValue = 0;

    allEvents.forEach((event, index) => {
      if (event.event.toLowerCase().includes('purchase')) {
        cumulativeValue += event.price;
      } else if (event.event.toLowerCase().includes('sold') || event.event.toLowerCase().includes('sale')) {
        // Don't subtract, just track the sale value separately
      }

      timelineData.push({
        date: format(event.date, 'MMM yyyy'),
        fullDate: format(event.date, 'dd MMM yyyy'),
        value: event.price,
        cumulativeValue,
        event: `${event.property} - ${event.event}`,
        type: event.event,
      });
    });

    return timelineData;
  };

  const timelineData = buildTimelineData();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {data.fullDate}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{data.event}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Event Value:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Portfolio Value:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.cumulativeValue)}
              </span>
            </div>
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
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Portfolio Value Over Time
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={timelineData}
          margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            tick={{ fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-400 text-xs"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="cumulativeValue"
            name="Portfolio Value"
            stroke="#3B82F6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCumulative)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.2 }}
          className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
        >
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Events</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {timelineData.length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.3 }}
          className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800"
        >
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
            Current Portfolio
          </p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {formatCurrency(
              timelineData.length > 0
                ? timelineData[timelineData.length - 1].cumulativeValue
                : 0
            )}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.4 }}
          className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
        >
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Properties</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {properties.length}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
