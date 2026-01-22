'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, FileJson, Loader2, Info, ChevronLeft, Home, Building2, TrendingUp, Search, Filter, FlaskConical, DollarSign, Calendar, MapPin, Clock, HelpCircle, ArrowRight, User, Percent } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import { cn } from '@/lib/utils';

interface ScenarioInfo {
  name?: string;
  expected_result?: {
    exemption_type?: string;
    exemption_percentage?: number;
    capital_gain?: number;
    taxable_gain?: number;
    cgt_payable?: number;
  };
  applicable_rules?: string[];
}

interface PropertyEvent {
  date: string;
  displayDate?: string;
  event: string;
  property?: string;
  price?: string | null;
}

interface PropertySummary {
  address: string;
  shortAddress: string;
  purchasePrice?: string | null;
  purchaseDate?: string | null;
  salePrice?: string | null;
  saleDate?: string | null;
  holdingYears?: number | null;
  keyEvents?: PropertyEvent[];
  notes?: string | null;
}

interface PropertyDetails {
  properties: PropertySummary[];
  financialSummary: {
    totalPurchaseValue?: string | null;
    totalSaleValue?: string | null;
    totalGain?: string | null;
    holdingPeriodYears?: number | null;
  };
  timeline: PropertyEvent[];
}

interface Scenario {
  id: string;
  filename: string;
  title: string;
  description: string;
  category: string;
  scenario_info?: ScenarioInfo;
  propertyCount?: number;
  path?: string;
  // Enhanced fields
  propertyDetails?: PropertyDetails | null;
  userQuery?: string | null;
  australianResident?: boolean;
  marginalTaxRate?: number;
}

interface ScenarioManifest {
  version: string;
  generatedAt: string;
  totalScenarios: number;
  categories: Record<string, number>;
  scenarios: Scenario[];
}

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Category configuration
const CATEGORIES = [
  { id: 'all', label: 'All Scenarios', icon: Filter },
  { id: 'Core Concepts', label: 'Core Concepts', icon: Home },
  { id: 'Multi-Factor', label: 'Multi-Factor', icon: TrendingUp },
  { id: 'Special Rules', label: 'Special Rules', icon: Building2 },
  { id: 'Real-World', label: 'Real-World', icon: FlaskConical },
];

// Global cache for manifest - persists across modal opens/closes
let manifestCache: ScenarioManifest | null = null;

export default function ScenarioSelectorModal({ isOpen, onClose }: ScenarioSelectorModalProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewingScenario, setViewingScenario] = useState<Scenario | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { importTimelineData, clearAllData } = useTimelineStore();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load scenario manifest when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset view state when opening
      setViewingScenario(null);
      setSelectedCategory('all');
      setSearchQuery('');
      setError(null);
      loadManifest();
    }
  }, [isOpen]);

  const loadManifest = async () => {
    // Use cached manifest if available
    if (manifestCache) {
      setScenarios(manifestCache.scenarios);
      setLoading(false);
      console.log('📦 Using cached scenarios manifest');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/scenarios-manifest.json');
      if (!response.ok) {
        throw new Error('Failed to load scenarios manifest');
      }

      const manifest: ScenarioManifest = await response.json();
      manifestCache = manifest; // Cache for future use
      setScenarios(manifest.scenarios);
      console.log(`✅ Loaded ${manifest.totalScenarios} scenarios from manifest (v${manifest.version})`);
    } catch (err) {
      console.error('❌ Failed to load manifest:', err);
      setError('Failed to load scenarios. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter scenarios based on category and search
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      const matchesCategory = selectedCategory === 'all' || scenario.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [scenarios, selectedCategory, searchQuery]);

  // Get counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: scenarios.length };
    scenarios.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [scenarios]);

  const handleSelectScenario = async (scenario: Scenario) => {
    setLoadingScenario(scenario.id);

    try {
      const basePath = scenario.path || 'scenariotestjsons';
      const response = await fetch(`/${basePath}/${scenario.filename}`);
      if (!response.ok) {
        throw new Error('Failed to load scenario');
      }

      const data = await response.json();
      clearAllData();
      await new Promise(resolve => setTimeout(resolve, 100));
      importTimelineData(data);

      console.log(`✅ Loaded scenario: ${scenario.title}`);
      onClose();
    } catch (error) {
      console.error('❌ Failed to load scenario:', error);
      alert('Failed to load scenario. Please try again.');
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleViewInfo = (e: React.MouseEvent, scenario: Scenario) => {
    e.stopPropagation();
    setViewingScenario(scenario);
  };

  const handleBackToList = () => {
    setViewingScenario(null);
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core Concepts':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Multi-Factor':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Special Rules':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Real-World':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-[95vw] xl:max-w-[1400px] max-h-[90vh] flex flex-col"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-teal-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Load Scenario
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Select a CGT scenario to load onto the timeline
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Category Tabs and Search */}
                {!viewingScenario && !loading && (
                  <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {/* Category Tabs */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const isActive = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategory(cat.id)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                isActive
                                  ? 'bg-blue-500 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{cat.label}</span>
                              <span className={cn(
                                'px-1.5 py-0.5 rounded-full text-xs',
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                              )}>
                                {categoryCounts[cat.id] || 0}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Search */}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search scenarios..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="ml-3 text-slate-600 dark:text-slate-400">Loading scenarios...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <FileJson className="w-12 h-12 text-red-300 dark:text-red-600 mx-auto mb-3" />
                      <p className="text-red-500 dark:text-red-400">{error}</p>
                      <button
                        onClick={loadManifest}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Retry
                      </button>
                    </div>
                  ) : viewingScenario ? (
                    /* Scenario Detail View - Enhanced */
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="max-w-4xl mx-auto space-y-4"
                    >
                      {/* Back button */}
                      <button
                        onClick={handleBackToList}
                        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to scenarios
                      </button>

                      {/* Header with title and category */}
                      <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-teal-500/20 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {viewingScenario.title}
                          </h3>
                          <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getCategoryColor(viewingScenario.category))}>
                            {viewingScenario.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {viewingScenario.description}
                        </p>
                      </div>

                      {/* User Query / Scenario Question */}
                      {viewingScenario.userQuery && viewingScenario.userQuery !== viewingScenario.description && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                Scenario Question
                              </h4>
                              <p className="text-sm text-amber-700 dark:text-amber-400 italic">
                                "{viewingScenario.userQuery}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Financial Summary */}
                      {viewingScenario.propertyDetails?.financialSummary && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            Financial Summary
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {viewingScenario.propertyDetails.financialSummary.totalPurchaseValue && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Purchase</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {viewingScenario.propertyDetails.financialSummary.totalPurchaseValue}
                                </p>
                              </div>
                            )}
                            {viewingScenario.propertyDetails.financialSummary.totalSaleValue && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Sale</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {viewingScenario.propertyDetails.financialSummary.totalSaleValue}
                                </p>
                              </div>
                            )}
                            {viewingScenario.propertyDetails.financialSummary.totalGain && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Gain</p>
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {viewingScenario.propertyDetails.financialSummary.totalGain}
                                </p>
                              </div>
                            )}
                            {viewingScenario.propertyDetails.financialSummary.holdingPeriodYears && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Held</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {viewingScenario.propertyDetails.financialSummary.holdingPeriodYears} years
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Properties Detail */}
                      {viewingScenario.propertyDetails?.properties && viewingScenario.propertyDetails.properties.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            Properties ({viewingScenario.propertyDetails.properties.length})
                          </h4>
                          <div className="space-y-3">
                            {viewingScenario.propertyDetails.properties.map((property, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {property.address}
                                      </p>
                                      {property.holdingYears && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          Held for {property.holdingYears} years
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Purchase/Sale Info */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  {property.purchasePrice && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 dark:text-slate-400">Purchased:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {property.purchasePrice}
                                      </span>
                                      {property.purchaseDate && (
                                        <span className="text-slate-400 dark:text-slate-500">({property.purchaseDate})</span>
                                      )}
                                    </div>
                                  )}
                                  {property.salePrice && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 dark:text-slate-400">Sold:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {property.salePrice}
                                      </span>
                                      {property.saleDate && (
                                        <span className="text-slate-400 dark:text-slate-500">({property.saleDate})</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Key Events Timeline */}
                                {property.keyEvents && property.keyEvents.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Key Events:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {property.keyEvents.map((event, eventIdx) => (
                                        <span
                                          key={eventIdx}
                                          className={cn(
                                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                                            event.event === 'Purchased' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                                            event.event === 'Sold' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                                            event.event === 'Moved In' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                                            event.event === 'Moved Out' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
                                            event.event === 'Started Renting' && 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
                                            event.event === 'Stopped Renting' && 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
                                            event.event === 'Improvement' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                                            event.event === 'Moved to Aged Care' && 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
                                            !['Purchased', 'Sold', 'Moved In', 'Moved Out', 'Started Renting', 'Stopped Renting', 'Improvement', 'Moved to Aged Care'].includes(event.event) && 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                          )}
                                        >
                                          {event.event}
                                          {event.price && <span className="font-medium">{event.price}</span>}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expected Results */}
                      {viewingScenario.scenario_info?.expected_result && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-purple-500" />
                            Expected CGT Results
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            {viewingScenario.scenario_info.expected_result.exemption_type && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Exemption</span>
                                <span className={cn(
                                  'font-bold capitalize',
                                  viewingScenario.scenario_info.expected_result.exemption_type === 'full' && 'text-green-600 dark:text-green-400',
                                  viewingScenario.scenario_info.expected_result.exemption_type === 'partial' && 'text-amber-600 dark:text-amber-400',
                                  viewingScenario.scenario_info.expected_result.exemption_type === 'none' && 'text-red-600 dark:text-red-400'
                                )}>
                                  {viewingScenario.scenario_info.expected_result.exemption_type}
                                </span>
                              </div>
                            )}
                            {viewingScenario.scenario_info.expected_result.exemption_percentage !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Exemption %</span>
                                <span className={cn(
                                  'font-bold',
                                  viewingScenario.scenario_info.expected_result.exemption_percentage === 100 && 'text-green-600 dark:text-green-400',
                                  viewingScenario.scenario_info.expected_result.exemption_percentage > 0 && viewingScenario.scenario_info.expected_result.exemption_percentage < 100 && 'text-amber-600 dark:text-amber-400',
                                  viewingScenario.scenario_info.expected_result.exemption_percentage === 0 && 'text-red-600 dark:text-red-400'
                                )}>
                                  {viewingScenario.scenario_info.expected_result.exemption_percentage}%
                                </span>
                              </div>
                            )}
                            {viewingScenario.scenario_info.expected_result.capital_gain !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Capital Gain</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  ${viewingScenario.scenario_info.expected_result.capital_gain.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {viewingScenario.scenario_info.expected_result.taxable_gain !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Taxable Gain</span>
                                <span className={cn(
                                  'font-bold',
                                  viewingScenario.scenario_info.expected_result.taxable_gain === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}>
                                  ${viewingScenario.scenario_info.expected_result.taxable_gain.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {viewingScenario.scenario_info.expected_result.cgt_payable !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">CGT Payable</span>
                                <span className={cn(
                                  'font-bold',
                                  viewingScenario.scenario_info.expected_result.cgt_payable === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}>
                                  ${viewingScenario.scenario_info.expected_result.cgt_payable.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Applicable Rules */}
                      {viewingScenario.scenario_info?.applicable_rules && viewingScenario.scenario_info.applicable_rules.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <FileJson className="w-4 h-4 text-indigo-500" />
                            Applicable Tax Rules
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {viewingScenario.scenario_info.applicable_rules.map((rule, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium">
                                <span className="text-indigo-400">§</span>
                                {rule}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      {(viewingScenario.australianResident !== undefined || viewingScenario.marginalTaxRate !== undefined) && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            Taxpayer Profile
                          </h4>
                          <div className="flex gap-4 text-xs">
                            {viewingScenario.australianResident !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 dark:text-slate-400">Residency:</span>
                                <span className={cn(
                                  'font-medium',
                                  viewingScenario.australianResident ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                                )}>
                                  {viewingScenario.australianResident ? 'Australian Resident' : 'Non-Resident'}
                                </span>
                              </div>
                            )}
                            {viewingScenario.marginalTaxRate !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 dark:text-slate-400">Tax Rate:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {(viewingScenario.marginalTaxRate * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Load button */}
                      <button
                        onClick={() => handleSelectScenario(viewingScenario)}
                        disabled={loadingScenario !== null}
                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                      >
                        {loadingScenario === viewingScenario.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FolderOpen className="w-5 h-5" />
                            Load This Scenario
                          </>
                        )}
                      </button>
                    </motion.div>
                  ) : filteredScenarios.length === 0 ? (
                    <div className="text-center py-12">
                      <FileJson className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">
                        {searchQuery ? 'No scenarios match your search' : 'No scenarios found'}
                      </p>
                    </div>
                  ) : (
                    /* Scenario Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredScenarios.map((scenario, index) => {
                        const globalIndex = scenarios.findIndex(s => s.id === scenario.id) + 1;
                        const isLoading = loadingScenario === scenario.id;
                        const isDisabled = loadingScenario !== null && !isLoading;

                        return (
                          <motion.div
                            key={scenario.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                              'group relative bg-white dark:bg-slate-700/50 rounded-xl border-2 overflow-hidden transition-all duration-200',
                              isLoading
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg',
                              isDisabled && 'opacity-50 pointer-events-none'
                            )}
                          >
                            {/* Card Header with Number and Category */}
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                                  {globalIndex}
                                </span>
                                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getCategoryColor(scenario.category))}>
                                  {scenario.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {scenario.propertyCount || 0}
                                </span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4">
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2 line-clamp-2 min-h-[40px]">
                                {scenario.title}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                                {scenario.description}
                              </p>

                              {/* Quick Stats */}
                              {scenario.scenario_info?.expected_result?.exemption_percentage !== undefined && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 dark:text-slate-500">Exemption</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      {scenario.scenario_info.expected_result.exemption_percentage}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                              <button
                                onClick={() => handleSelectScenario(scenario)}
                                disabled={loadingScenario !== null}
                                className={cn(
                                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                                  'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white',
                                  'disabled:opacity-50 disabled:cursor-not-allowed'
                                )}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <FolderOpen className="w-4 h-4" />
                                    <span>Load</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={(e) => handleViewInfo(e, scenario)}
                                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                                title="View details"
                              >
                                <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {!loading && !viewingScenario && (
                        <>
                          Showing {filteredScenarios.length} of {scenarios.length} scenarios
                          {searchQuery && ` matching "${searchQuery}"`}
                        </>
                      )}
                      {!searchQuery && !viewingScenario && ' • Loading a scenario will replace your current timeline'}
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
