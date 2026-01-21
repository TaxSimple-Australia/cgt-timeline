'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Key, DollarSign } from 'lucide-react';

export default function MiniTimeline() {
  const events = [
    { date: '2018', label: 'Purchase', icon: Home, color: '#10b981', amount: '$650K' },
    { date: '2019', label: 'Move In', icon: Key, color: '#3b82f6', amount: null },
    { date: '2021', label: 'Rent Start', icon: DollarSign, color: '#8b5cf6', amount: null },
    { date: '2024', label: 'Sale', icon: TrendingUp, color: '#06b6d4', amount: '$920K' },
  ];

  return (
    <div className="relative w-full h-full p-8 flex items-center justify-center">
      {/* Property Lane */}
      <div className="relative w-full max-w-2xl">
        {/* Property Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-2"
        >
          <div className="text-xs text-cyan-400 font-semibold">123 Smith St</div>
          <div className="text-[10px] text-slate-400">Melbourne, VIC</div>
        </motion.div>

        {/* Timeline Track */}
        <div className="relative h-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-full mx-12">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 to-blue-500/40 rounded-full blur-sm" />
        </div>

        {/* Events */}
        <div className="relative flex justify-between items-center px-12 -mt-0.5">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                className="relative flex flex-col items-center group"
              >
                {/* Event Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative z-10"
                  style={{
                    backgroundColor: event.color,
                    boxShadow: `0 0 20px ${event.color}40`
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Event Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="absolute -bottom-16 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 min-w-[80px] text-center"
                >
                  <div className="text-[10px] text-slate-400 mb-0.5">{event.date}</div>
                  <div className="text-xs font-semibold text-white mb-0.5">{event.label}</div>
                  {event.amount && (
                    <div className="text-[10px] font-bold" style={{ color: event.color }}>
                      {event.amount}
                    </div>
                  )}
                </motion.div>

                {/* Connector Line */}
                <div className="absolute top-full w-px h-4 bg-gradient-to-b from-white/20 to-transparent" />
              </motion.div>
            );
          })}
        </div>

        {/* Status Period Indicator */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute top-8 left-12 right-12 h-6 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-lg border border-white/10 backdrop-blur-sm"
        >
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <div className="text-[10px] text-emerald-400 font-medium">Main Residence</div>
            <div className="w-px h-3 bg-white/20" />
            <div className="text-[10px] text-purple-400 font-medium">Rental</div>
          </div>
        </motion.div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-5 pointer-events-none" />
      </div>

      {/* Floating Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 right-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2"
      >
        <div className="text-[10px] text-slate-400 mb-0.5">Capital Gain</div>
        <div className="text-sm font-bold text-cyan-400">$270,000</div>
      </motion.div>
    </div>
  );
}
