'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, Loader2, Search, Filter, Building2, Trash2, Pencil, Info, ChevronLeft, Percent, FileJson, HelpCircle, Save, Zap } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import { cn } from '@/lib/utils';
import { getAllSavedScenarios, deleteSavedScenario, updateScenario, type SavedScenario } from '@/lib/saved-scenarios';
import { extractMetadataFromReport } from '@/lib/extract-report-metadata';
import SaveScenarioModal from './SaveScenarioModal';

interface MyScenariosSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyScenariosSelectorModal({ isOpen, onClose }: MyScenariosSelectorModalProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [viewingScenario, setViewingScenario] = useState<SavedScenario | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);

  const { importTimelineData, importShareableData, clearAllData, setActiveScenarioId, activeScenarioId, aiResponse } = useTimelineStore();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setViewingScenario(null);
      setSelectedCategory('all');
      setSearchQuery('');
      setDeleteConfirmId(null);
      loadScenarios();
    }
  }, [isOpen]);

  const loadScenarios = () => {
    const saved = getAllSavedScenarios();
    setScenarios(saved);
  };

  // Build dynamic category tabs from saved scenarios
  const categories = useMemo(() => {
    const cats = new Set<string>();
    scenarios.forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [scenarios]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: scenarios.length };
    scenarios.forEach(s => {
      const cat = s.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [scenarios]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [scenarios, selectedCategory, searchQuery]);

  const handleLoadScenario = async (scenario: SavedScenario) => {
    setLoadingScenario(scenario.id);
    try {
      clearAllData();
      await new Promise(resolve => setTimeout(resolve, 100));

      // New format (from exportShareableData) has a version field
      if (scenario.scenarioData?.version) {
        importShareableData(scenario.scenarioData);
      } else {
        // Legacy: old scenarios saved with buildScenarioData()
        importTimelineData(scenario.scenarioData);
      }
      setActiveScenarioId(scenario.id);
      console.log(`✅ Loaded saved scenario: ${scenario.title}`);
      onClose();
    } catch (error) {
      console.error('❌ Failed to load scenario:', error);
      alert('Failed to load scenario. Please try again.');
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleDeleteScenario = (scenarioId: string) => {
    deleteSavedScenario(scenarioId);
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
    setDeleteConfirmId(null);
    if (viewingScenario?.id === scenarioId) {
      setViewingScenario(null);
    }
  };

  // Check if the current AI response has extractable analysis data
  const hasReportData = !!aiResponse && (
    (aiResponse as any)?.data?.data?.properties?.length > 0 ||
    (aiResponse as any)?.data?.properties?.length > 0 ||
    ((aiResponse as any)?.properties?.length > 0 && (aiResponse as any)?.properties?.[0]?.property_address)
  );

  const handleUpdateFromReport = (scenarioId: string) => {
    if (!aiResponse) return;
    const extracted = extractMetadataFromReport(aiResponse);
    if (extracted.expectedResult || extracted.applicableRules || extracted.description) {
      const updated = updateScenario(scenarioId, {
        ...(extracted.expectedResult && { expectedResult: extracted.expectedResult }),
        ...(extracted.applicableRules && { applicableRules: extracted.applicableRules }),
        ...(extracted.description && { description: extracted.description }),
      });
      if (updated) {
        loadScenarios();
        // Refresh detail view if viewing this scenario
        if (viewingScenario?.id === scenarioId) {
          setViewingScenario(updated);
        }
      }
    }
  };

  const handleEditScenarioMeta = (scenarioId: string) => {
    setEditingScenarioId(scenarioId);
    setShowEditModal(true);
  };

  const handleScenarioEdited = () => {
    setShowEditModal(false);
    setEditingScenarioId(null);
    loadScenarios();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Main Residence':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Ownership Changes':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Subdivision':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Multi-Property Portfolios':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Foreign Resident':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Special Rules & Exemptions':
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
              className="w-full max-w-[95vw] xl:max-w-[1200px] max-h-[90vh] flex flex-col"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                      <Save className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        My Scenarios
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Your saved CGT scenarios
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
                {!viewingScenario && scenarios.length > 0 && (
                  <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex flex-col gap-3">
                      {/* Search */}
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search your scenarios..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>

                      {/* Category Tabs */}
                      {categories.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedCategory('all')}
                            className={cn(
                              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                              selectedCategory === 'all'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                            )}
                          >
                            <Filter className="w-4 h-4" />
                            <span className="hidden md:inline">All</span>
                            <span className={cn(
                              'px-1.5 py-0.5 rounded-full text-xs',
                              selectedCategory === 'all'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            )}>
                              {scenarios.length}
                            </span>
                          </button>
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={cn(
                                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                                selectedCategory === cat
                                  ? 'bg-emerald-500 text-white shadow-md'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                              )}
                            >
                              <span className="hidden md:inline">{cat}</span>
                              <span className="md:hidden">{cat.length > 12 ? cat.slice(0, 10) + '...' : cat}</span>
                              <span className={cn(
                                'px-1.5 py-0.5 rounded-full text-xs',
                                selectedCategory === cat
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                              )}>
                                {categoryCounts[cat] || 0}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {viewingScenario ? (
                    /* Detail View */
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="max-w-4xl mx-auto space-y-4"
                    >
                      <button
                        onClick={() => setViewingScenario(null)}
                        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to scenarios
                      </button>

                      {/* Header */}
                      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {viewingScenario.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', getCategoryColor(viewingScenario.category))}>
                              {viewingScenario.category}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              Saved
                            </span>
                          </div>
                        </div>
                        {viewingScenario.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {viewingScenario.description}
                          </p>
                        )}
                        {viewingScenario.tags && viewingScenario.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {viewingScenario.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User Query */}
                      {viewingScenario.userQuery && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                Scenario Question
                              </h4>
                              <p className="text-sm text-amber-700 dark:text-amber-400 italic">
                                &quot;{viewingScenario.userQuery}&quot;
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expected Results */}
                      {viewingScenario.expectedResult && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-purple-500" />
                            Expected CGT Results
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            {viewingScenario.expectedResult.exemption_type && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Exemption</span>
                                <span className={cn(
                                  'font-bold capitalize',
                                  viewingScenario.expectedResult.exemption_type === 'full' && 'text-green-600 dark:text-green-400',
                                  viewingScenario.expectedResult.exemption_type === 'partial' && 'text-amber-600 dark:text-amber-400',
                                  viewingScenario.expectedResult.exemption_type === 'none' && 'text-red-600 dark:text-red-400'
                                )}>
                                  {viewingScenario.expectedResult.exemption_type}
                                </span>
                              </div>
                            )}
                            {viewingScenario.expectedResult.exemption_percentage !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Exemption %</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {viewingScenario.expectedResult.exemption_percentage}%
                                </span>
                              </div>
                            )}
                            {viewingScenario.expectedResult.capital_gain !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Capital Gain</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  ${viewingScenario.expectedResult.capital_gain.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {viewingScenario.expectedResult.taxable_gain !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Taxable Gain</span>
                                <span className={cn(
                                  'font-bold',
                                  viewingScenario.expectedResult.taxable_gain === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}>
                                  ${viewingScenario.expectedResult.taxable_gain.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {viewingScenario.expectedResult.net_capital_gain !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Net Capital Gain</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  ${viewingScenario.expectedResult.net_capital_gain.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {viewingScenario.expectedResult.cgt_payable !== undefined && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">CGT Payable</span>
                                <span className={cn(
                                  'font-bold',
                                  viewingScenario.expectedResult.cgt_payable === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}>
                                  ${viewingScenario.expectedResult.cgt_payable.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          {viewingScenario.expectedResult.notes && (
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
                              {viewingScenario.expectedResult.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Applicable Rules */}
                      {viewingScenario.applicableRules && viewingScenario.applicableRules.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <FileJson className="w-4 h-4 text-indigo-500" />
                            Applicable Tax Rules
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {viewingScenario.applicableRules.map((rule, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium">
                                <span className="text-indigo-400">§</span>
                                {rule}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Properties count */}
                      {viewingScenario.scenarioData?.properties && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            Properties ({viewingScenario.scenarioData.properties.length})
                          </h4>
                          <div className="space-y-2">
                            {viewingScenario.scenarioData.properties.map((prop: any, idx: number) => (
                              <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{prop.address}</p>
                                {prop.property_history && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {prop.property_history.length} events
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleLoadScenario(viewingScenario)}
                          disabled={loadingScenario !== null}
                          className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
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
                        {hasReportData && activeScenarioId === viewingScenario.id && (
                          <button
                            onClick={() => handleUpdateFromReport(viewingScenario.id)}
                            className="py-3 px-4 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium rounded-xl transition-colors flex items-center gap-2"
                            title="Update metadata from current AI report"
                          >
                            <Zap className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditScenarioMeta(viewingScenario.id)}
                          className="py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors flex items-center gap-2"
                          title="Edit metadata"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(viewingScenario.id)}
                          className="py-3 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium rounded-xl transition-colors flex items-center gap-2"
                          title="Delete scenario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : scenarios.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Save className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        No saved scenarios yet
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Save your current timeline as a scenario using the Save button in the toolbar.
                        Your scenarios will appear here for easy access.
                      </p>
                    </div>
                  ) : filteredScenarios.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">
                        {searchQuery ? 'No scenarios match your search' : 'No scenarios in this category'}
                      </p>
                    </div>
                  ) : (
                    /* Scenario Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredScenarios.map((scenario, index) => {
                        const isLoading = loadingScenario === scenario.id;
                        const isDisabled = loadingScenario !== null && !isLoading;
                        const propertyCount = scenario.scenarioData?.properties?.length || 0;

                        return (
                          <motion.div
                            key={scenario.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                              'group relative bg-white dark:bg-slate-700/50 rounded-xl border-2 overflow-hidden transition-all duration-200',
                              isLoading
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg',
                              isDisabled && 'opacity-50 pointer-events-none'
                            )}
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getCategoryColor(scenario.category))}>
                                  {scenario.category || 'Uncategorized'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                  Saved
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {hasReportData && activeScenarioId === scenario.id && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUpdateFromReport(scenario.id); }}
                                    className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                    title="Update from report"
                                  >
                                    <Zap className="w-3 h-3 text-emerald-500 hover:text-emerald-600" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditScenarioMeta(scenario.id); }}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                  title="Edit metadata"
                                >
                                  <Pencil className="w-3 h-3 text-slate-400 hover:text-blue-500" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(scenario.id); }}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                  title="Delete scenario"
                                >
                                  <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                                </button>
                                <Building2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {propertyCount}
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
                              {scenario.expectedResult?.exemption_percentage !== undefined && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 dark:text-slate-500">Exemption</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      {scenario.expectedResult.exemption_percentage}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                              <button
                                onClick={() => handleLoadScenario(scenario)}
                                disabled={loadingScenario !== null}
                                className={cn(
                                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                                  'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white',
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
                                onClick={(e) => { e.stopPropagation(); setViewingScenario(scenario); }}
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
                      {scenarios.length > 0 && !viewingScenario && (
                        <>
                          Showing {filteredScenarios.length} of {scenarios.length} saved scenarios
                          {searchQuery && ` matching "${searchQuery}"`}
                        </>
                      )}
                      {scenarios.length > 0 && !searchQuery && !viewingScenario && ' • Loading a scenario will replace your current timeline'}
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

  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* Delete Confirmation */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Scenario?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">This cannot be undone. The scenario will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                Cancel
              </button>
              <button onClick={() => handleDeleteScenario(deleteConfirmId)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Scenario Modal */}
      <SaveScenarioModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingScenarioId(null); }}
        onSaved={handleScenarioEdited}
        editingScenarioId={editingScenarioId}
      />
    </>
  );
}
