'use client';

import React, { useState } from 'react';
import { Search, Home, Building, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function V4FilterBox() {
  const [activeTab, setActiveTab] = useState<'single' | 'portfolio'>('single');

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-black/20">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'single'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Single Property
          </span>
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'portfolio'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Building className="w-4 h-4" />
            Full Portfolio
          </span>
        </button>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Property Type */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Property Type
          </label>
          <select className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all">
            <option>Residential</option>
            <option>Commercial</option>
            <option>Land</option>
            <option>Mixed Use</option>
          </select>
        </div>

        {/* Purchase Year */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Purchase Year
          </label>
          <select className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all">
            <option>2024</option>
            <option>2023</option>
            <option>2022</option>
            <option>2021</option>
            <option>2020</option>
            <option>Before 2020</option>
          </select>
        </div>

        {/* Current Status */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Current Status
          </label>
          <select className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all">
            <option>Main Residence (PPR)</option>
            <option>Rental Property</option>
            <option>Vacant</option>
            <option>Under Construction</option>
            <option>Sold</option>
          </select>
        </div>
      </div>

      {/* Calculate Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-6 text-base font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 transition-all rounded-xl group"
      >
        <Search className="w-5 h-5 mr-2" />
        Calculate CGT Now
        <TrendingUp className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Quick stat */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-400 text-center">
          <span className="text-cyan-400 font-semibold">Average savings</span> of $12,450 discovered per property
        </p>
      </div>
    </div>
  );
}
