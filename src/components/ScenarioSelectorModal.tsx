'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, FileJson, Loader2, Info, ChevronLeft, Home, Building2, TrendingUp, Search, Filter } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import { cn } from '@/lib/utils';

interface ScenarioInfo {
  name: string;
  description: string;
  expected_result?: {
    exemption_type?: string;
    exemption_percentage?: number;
    capital_gain?: number;
    taxable_gain?: number;
    cgt_payable?: number;
  };
  applicable_rules?: string[];
}

interface Scenario {
  id: string;
  filename: string;
  title: string;
  description: string;
  category: string;
  scenario_info?: ScenarioInfo;
  properties: any[];
}

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define the scenarios with clear, professional titles
const SCENARIO_CONFIG: { filename: string; displayTitle: string; category: string }[] = [
  // Basic CGT Scenarios (1-5)
  { filename: 'scenario1_full_main_residence_exemption.json', displayTitle: 'Full Main Residence Exemption', category: 'Basic' },
  { filename: 'scenario2_six_year_rule_within.json', displayTitle: '6-Year Absence Rule (Within Limit)', category: 'Basic' },
  { filename: 'scenario3_six_year_rule_exceeded.json', displayTitle: '6-Year Absence Rule (Exceeded)', category: 'Basic' },
  { filename: 'scenario4_rental_first_then_main_residence.json', displayTitle: 'Rental First, Then Main Residence', category: 'Basic' },
  { filename: 'scenario5_moving_between_residences.json', displayTitle: 'Moving Between Residences', category: 'Basic' },
  // Basic CGT Scenarios Variant B (6-10)
  { filename: 'new_scenario_1_full_main_residence.json', displayTitle: 'Full Main Residence (Variant B)', category: 'Basic' },
  { filename: 'new_scenario_2_six_year_within.json', displayTitle: '6-Year Rule Within (Variant B)', category: 'Basic' },
  { filename: 'new_scenario_3_six_year_exceeded.json', displayTitle: '6-Year Rule Exceeded (Variant B)', category: 'Basic' },
  { filename: 'new_scenario_4_rental_first.json', displayTitle: 'Rental First (Variant B)', category: 'Basic' },
  { filename: 'new_scenario_5_moving_between_residences.json', displayTitle: 'Moving Between Residences (Variant B)', category: 'Basic' },
  // Complex CGT Scenarios (11-20)
  { filename: 'scenario6_multiple_absence_periods.json', displayTitle: 'Multiple Absence Periods', category: 'Complex' },
  { filename: 'scenario7_two_properties_strategic_mre.json', displayTitle: 'Two Properties - Strategic MRE Choice', category: 'Complex' },
  { filename: 'scenario8_inherited_property_rental.json', displayTitle: 'Inherited Property with Rental', category: 'Complex' },
  { filename: 'scenario9_investment_then_ppr_then_rental.json', displayTitle: 'Investment → Main Residence → Rental', category: 'Complex' },
  { filename: 'scenario10_six_month_overlap_exceeded.json', displayTitle: '6-Month Overlap Rule Exceeded', category: 'Complex' },
  { filename: 'scenario11_construction_four_year_rule.json', displayTitle: 'Construction & 4-Year Building Rule', category: 'Complex' },
  { filename: 'scenario12_airbnb_room_rental.json', displayTitle: 'Partial Use - Airbnb Room Rental', category: 'Complex' },
  { filename: 'scenario13_couple_separate_properties.json', displayTitle: 'Couple with Separate Properties', category: 'Complex' },
  { filename: 'scenario14_foreign_resident_period.json', displayTitle: 'Foreign Resident Period Impact', category: 'Complex' },
  { filename: 'scenario15_three_property_portfolio.json', displayTitle: 'Three Property Portfolio', category: 'Complex' },
  // Extended CGT Scenarios (21-40) - Advanced edge cases and special rules
  { filename: 'scenario21_aged_care_indefinite_absence.json', displayTitle: 'Aged Care - Indefinite Absence', category: 'Extended' },
  { filename: 'scenario22_delayed_move_in_work.json', displayTitle: 'Delayed Move-In (Work Assignment)', category: 'Extended' },
  { filename: 'scenario23_six_year_periods_reset.json', displayTitle: 'Multiple 6-Year Periods Reset', category: 'Extended' },
  { filename: 'scenario24_deceased_estate_two_years.json', displayTitle: 'Deceased Estate (Within 2 Years)', category: 'Extended' },
  { filename: 'scenario25_beneficiary_moves_in.json', displayTitle: 'Beneficiary Moves Into Inherited Property', category: 'Extended' },
  { filename: 'scenario26_pre_cgt_major_improvements.json', displayTitle: 'Pre-CGT with Major Improvements', category: 'Extended' },
  { filename: 'scenario27_large_rural_property.json', displayTitle: 'Large Rural Property (>2 Hectares)', category: 'Extended' },
  { filename: 'scenario28_granny_flat_arrangement.json', displayTitle: 'Granny Flat Arrangement', category: 'Extended' },
  { filename: 'scenario29_relationship_breakdown.json', displayTitle: 'Relationship Breakdown Rollover', category: 'Extended' },
  { filename: 'scenario30_home_office_business.json', displayTitle: 'Home Office Business Use', category: 'Extended' },
  { filename: 'scenario31_foreign_resident_life_event.json', displayTitle: 'Foreign Resident Life Event', category: 'Extended' },
  { filename: 'scenario32_pre_may_2012_foreign.json', displayTitle: 'Pre-9 May 2012 Foreign Residency', category: 'Extended' },
  { filename: 'scenario33_spouses_different_residences.json', displayTitle: 'Spouses - Different Main Residences', category: 'Extended' },
  { filename: 'scenario34_vacant_periods_extended_rental.json', displayTitle: 'Vacant Periods During Rental', category: 'Extended' },
  { filename: 'scenario35_four_year_construction.json', displayTitle: '4-Year Construction Rule Exceeded', category: 'Extended' },
  { filename: 'scenario36_subdivision_land_sale.json', displayTitle: 'Subdivision - Separate Land Sale', category: 'Extended' },
  { filename: 'scenario37_deceased_estate_covid.json', displayTitle: 'Deceased Estate - COVID Extension', category: 'Extended' },
  { filename: 'scenario38_small_business_15_year.json', displayTitle: 'Small Business 15-Year Exemption', category: 'Extended' },
  { filename: 'scenario39_investment_then_main_residence.json', displayTitle: 'Investment Then Main Residence', category: 'Extended' },
  { filename: 'scenario40_four_property_portfolio.json', displayTitle: 'Four Property Portfolio', category: 'Extended' },
];

// Category configuration
const CATEGORIES = [
  { id: 'all', label: 'All Scenarios', icon: Filter },
  { id: 'Basic', label: 'Basic', icon: Home },
  { id: 'Complex', label: 'Complex', icon: TrendingUp },
  { id: 'Extended', label: 'Extended', icon: Building2 },
];

export default function ScenarioSelectorModal({ isOpen, onClose }: ScenarioSelectorModalProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewingScenario, setViewingScenario] = useState<Scenario | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { importTimelineData, clearAllData } = useTimelineStore();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load scenario metadata and reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      // Always reset to list view when opening the modal
      setViewingScenario(null);
      setSelectedCategory('all');
      setSearchQuery('');
      loadScenarios();
    }
  }, [isOpen]);

  const loadScenarios = async () => {
    setLoading(true);
    const loadedScenarios: Scenario[] = [];

    for (const config of SCENARIO_CONFIG) {
      try {
        const response = await fetch(`/scenariotestjsons/${config.filename}`);
        if (response.ok) {
          const data = await response.json();
          const scenarioInfo = data.scenario_info;

          loadedScenarios.push({
            id: config.filename,
            filename: config.filename,
            title: config.displayTitle,
            description: scenarioInfo?.description || data.user_query || 'No description available',
            category: config.category,
            scenario_info: scenarioInfo,
            properties: data.properties,
          });
        }
      } catch (error) {
        console.error(`Failed to load scenario ${config.filename}:`, error);
      }
    }

    setScenarios(loadedScenarios);
    setLoading(false);
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
      const response = await fetch(`/scenariotestjsons/${scenario.filename}`);
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
      case 'Basic':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Complex':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Extended':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
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
                      <div className="flex items-center gap-2">
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
                  ) : viewingScenario ? (
                    /* Scenario Detail View */
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="max-w-3xl mx-auto space-y-4"
                    >
                      {/* Back button */}
                      <button
                        onClick={handleBackToList}
                        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to scenarios
                      </button>

                      {/* Scenario title and description */}
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {viewingScenario.title}
                          </h3>
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getCategoryColor(viewingScenario.category))}>
                            {viewingScenario.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                          {viewingScenario.description}
                        </p>

                        {/* Expected Results */}
                        {viewingScenario.scenario_info?.expected_result && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              Expected Results
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {viewingScenario.scenario_info.expected_result.exemption_type && (
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                  <span className="text-slate-500 dark:text-slate-400">Exemption:</span>{' '}
                                  <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                                    {viewingScenario.scenario_info.expected_result.exemption_type}
                                  </span>
                                </div>
                              )}
                              {viewingScenario.scenario_info.expected_result.exemption_percentage !== undefined && (
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                  <span className="text-slate-500 dark:text-slate-400">Exemption %:</span>{' '}
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {viewingScenario.scenario_info.expected_result.exemption_percentage}%
                                  </span>
                                </div>
                              )}
                              {viewingScenario.scenario_info.expected_result.capital_gain !== undefined && (
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                  <span className="text-slate-500 dark:text-slate-400">Capital Gain:</span>{' '}
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    ${viewingScenario.scenario_info.expected_result.capital_gain.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {viewingScenario.scenario_info.expected_result.taxable_gain !== undefined && (
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                  <span className="text-slate-500 dark:text-slate-400">Taxable Gain:</span>{' '}
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    ${viewingScenario.scenario_info.expected_result.taxable_gain.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Applicable Rules */}
                        {viewingScenario.scenario_info?.applicable_rules && viewingScenario.scenario_info.applicable_rules.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              Applicable Rules
                            </h4>
                            <ul className="space-y-1">
                              {viewingScenario.scenario_info.applicable_rules.map((rule, idx) => (
                                <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {rule}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Properties */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Properties ({viewingScenario.properties?.length || 0})
                          </h4>
                          <div className="space-y-2">
                            {viewingScenario.properties?.map((prop, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                  {prop.address}
                                </p>
                                {prop.property_history && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {prop.property_history.length} events
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Load button */}
                      <button
                        onClick={() => handleSelectScenario(viewingScenario)}
                        disabled={loadingScenario !== null}
                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                  {scenario.properties?.length || 0}
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
