'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, FileJson, CheckCircle, Loader2, Info, ChevronLeft } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';

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
  scenario_info?: ScenarioInfo;
  properties: any[];
}

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define the scenarios to load
const SCENARIO_FILES = [
  // Original scenarios (1-5)
  'scenario1_full_main_residence_exemption.json',
  'scenario2_six_year_rule_within.json',
  'scenario3_six_year_rule_exceeded.json',
  'scenario4_rental_first_then_main_residence.json',
  'scenario5_moving_between_residences.json',
  // Complex scenarios (6-15)
  'scenario6_multiple_absence_periods.json',
  'scenario7_two_properties_strategic_mre.json',
  'scenario8_inherited_property_rental.json',
  'scenario9_investment_then_ppr_then_rental.json',
  'scenario10_six_month_overlap_exceeded.json',
  'scenario11_construction_four_year_rule.json',
  'scenario12_airbnb_room_rental.json',
  'scenario13_couple_separate_properties.json',
  'scenario14_foreign_resident_period.json',
  'scenario15_three_property_portfolio.json',
  // Additional scenarios
  'new_scenario_1_full_main_residence.json',
  'new_scenario_2_six_year_within.json',
  'new_scenario_3_six_year_exceeded.json',
  'new_scenario_4_rental_first.json',
  'new_scenario_5_moving_between_residences.json',
];

export default function ScenarioSelectorModal({ isOpen, onClose }: ScenarioSelectorModalProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewingScenario, setViewingScenario] = useState<Scenario | null>(null);

  const { importTimelineData, clearAllData } = useTimelineStore();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load scenario metadata when modal opens
  useEffect(() => {
    if (isOpen) {
      loadScenarios();
    }
  }, [isOpen]);

  const loadScenarios = async () => {
    setLoading(true);
    const loadedScenarios: Scenario[] = [];

    for (const filename of SCENARIO_FILES) {
      try {
        const response = await fetch(`/scenariotestjsons/${filename}`);
        if (response.ok) {
          const data = await response.json();
          const scenarioInfo = data.scenario_info;

          loadedScenarios.push({
            id: filename,
            filename,
            title: data.title || scenarioInfo?.name || formatFilenameAsTitle(filename),
            description: scenarioInfo?.description || data.user_query || 'No description available',
            scenario_info: scenarioInfo,
            properties: data.properties,
          });
        }
      } catch (error) {
        console.error(`Failed to load scenario ${filename}:`, error);
      }
    }

    setScenarios(loadedScenarios);
    setLoading(false);
  };

  const formatFilenameAsTitle = (filename: string): string => {
    // Remove .json extension and scenario prefix, then format
    return filename
      .replace('.json', '')
      .replace(/^scenario\d+_/, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleSelectScenario = async (scenario: Scenario) => {
    setLoadingScenario(scenario.id);

    try {
      // Fetch the full scenario data
      const response = await fetch(`/scenariotestjsons/${scenario.filename}`);
      if (!response.ok) {
        throw new Error('Failed to load scenario');
      }

      const data = await response.json();

      // Clear existing data first
      clearAllData();

      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      // Import the scenario data
      importTimelineData(data);

      console.log(`✅ Loaded scenario: ${scenario.title}`);

      // Close the modal
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
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-2xl max-h-[80vh] flex flex-col"
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

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
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
                      className="space-y-4"
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
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {viewingScenario.title}
                        </h3>
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
                  ) : scenarios.length === 0 ? (
                    <div className="text-center py-12">
                      <FileJson className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">No scenarios found</p>
                    </div>
                  ) : (
                    /* Scenario List View */
                    <div className="space-y-3">
                      {scenarios.map((scenario, index) => (
                        <motion.div
                          key={scenario.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            loadingScenario === scenario.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          } ${loadingScenario && loadingScenario !== scenario.id ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => !loadingScenario && handleSelectScenario(scenario)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                  Scenario {index + 1}
                                </span>
                              </div>
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                {scenario.title}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                {scenario.description}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              {loadingScenario === scenario.id ? (
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                              ) : (
                                <button
                                  onClick={(e) => handleViewInfo(e, scenario)}
                                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center transition-colors"
                                  title="View more info"
                                >
                                  <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-blue-500" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Properties count indicator */}
                          <div
                            className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 cursor-pointer"
                            onClick={() => !loadingScenario && handleSelectScenario(scenario)}
                          >
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {scenario.properties?.length || 0} {scenario.properties?.length === 1 ? 'property' : 'properties'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Loading a scenario will replace your current timeline
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
