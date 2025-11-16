'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, DollarSign, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CostBaseItem } from '@/store/timeline';
import {
  getCostBasesForEventType,
  getCostBaseDefinition,
  CATEGORY_NAMES,
  type CostBaseCategory,
} from '@/lib/cost-base-definitions';

interface CostBaseSelectorProps {
  eventType: string;
  costBases: CostBaseItem[];
  onChange: (costBases: CostBaseItem[]) => void;
}

export default function CostBaseSelector({
  eventType,
  costBases,
  onChange,
}: CostBaseSelectorProps) {
  const [showSelectorPopup, setShowSelectorPopup] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<CostBaseCategory>('element2');
  const costBaseSectionRef = useRef<HTMLDivElement>(null);

  // Determine if this is a sale event
  const isSaleEvent = eventType === 'sale';
  const terminology = isSaleEvent ? 'Sale Proceed' : 'Cost Base';
  const terminologyPlural = isSaleEvent ? 'Sale Proceeds' : 'Cost Bases';

  // Get available cost bases for this event type
  const availableDefinitions = getCostBasesForEventType(eventType);

  // Filter out already selected non-custom cost bases
  const alreadySelectedIds = costBases
    .filter(cb => !cb.isCustom)
    .map(cb => cb.definitionId);
  const unselectedDefinitions = availableDefinitions.filter(
    def => !alreadySelectedIds.includes(def.id)
  );

  // Group by category
  const groupedDefinitions: Record<string, typeof availableDefinitions> = {};
  unselectedDefinitions.forEach(def => {
    if (!groupedDefinitions[def.category]) {
      groupedDefinitions[def.category] = [];
    }
    groupedDefinitions[def.category].push(def);
  });

  const handleAddPredefinedCostBase = (definitionId: string) => {
    const definition = getCostBaseDefinition(definitionId);
    if (!definition) return;

    const newCostBase: CostBaseItem = {
      id: `cb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      definitionId: definition.id,
      name: definition.name,
      amount: 0,
      category: definition.category,
      isCustom: false,
      description: definition.description,
    };

    onChange([...costBases, newCostBase]);
    setShowSelectorPopup(false);
  };

  const handleAddCustomCostBase = () => {
    if (!customName.trim()) return;

    const newCostBase: CostBaseItem = {
      id: `cb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      definitionId: 'custom',
      name: customName.trim(),
      amount: 0,
      category: customCategory,
      isCustom: true,
    };

    onChange([...costBases, newCostBase]);
    setCustomName('');
    setShowCustomInput(false);
    setShowSelectorPopup(false);
  };

  const handleRemoveCostBase = (id: string) => {
    onChange(costBases.filter(cb => cb.id !== id));
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    onChange(
      costBases.map(cb =>
        cb.id === id ? { ...cb, amount } : cb
      )
    );
  };

  const totalCostBase = costBases.reduce((sum, cb) => sum + cb.amount, 0);

  return (
    <div ref={costBaseSectionRef} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            {terminologyPlural} {isSaleEvent ? '' : '(for CGT)'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSaleEvent
              ? 'Track sale proceeds and related costs for this disposal event'
              : 'Track costs that form part of the CGT cost base calculation'
            }
          </p>
        </div>
      </div>

      {/* Existing Cost Bases */}
      {costBases.length > 0 && (
        <div className="space-y-2">
          {costBases.map(costBase => {
            const definition = !costBase.isCustom
              ? getCostBaseDefinition(costBase.definitionId)
              : null;

            return (
              <div
                key={costBase.id}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {costBase.name}
                      {costBase.isCustom && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                          Custom
                        </span>
                      )}
                    </label>

                    {/* Tooltip with description - shown for all cost bases */}
                    {(definition?.description || costBase.isCustom) && (
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 cursor-help hover:text-blue-600 dark:hover:text-blue-300 transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-xl z-[9999]">
                          <div className="text-xs space-y-2">
                            <div className="font-semibold text-blue-900 dark:text-blue-100 border-b border-blue-200 dark:border-blue-700 pb-1">
                              {costBase.name}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">
                              {definition?.description || 'Custom cost base item'}
                            </p>
                            {definition?.requiresWarning && definition.warningText && (
                              <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                                <div className="flex items-start gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-amber-900 dark:text-amber-200 font-medium">
                                    {definition.warningText}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-600">
                              {CATEGORY_NAMES[costBase.category]}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      value={costBase.amount || ''}
                      onChange={e =>
                        handleUpdateAmount(
                          costBase.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {CATEGORY_NAMES[costBase.category]}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveCostBase(costBase.id)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors mt-1"
                  title="Remove cost base"
                >
                  <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            );
          })}

          {/* Total */}
          {totalCostBase > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Total {isSaleEvent ? 'Sale Proceeds' : 'Cost Base'}:
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ${totalCostBase.toLocaleString('en-AU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Button */}
      <div>
        <button
          onClick={() => setShowSelectorPopup(true)}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
        >
          <Plus className="w-4 h-4" />
          Add {terminology}
        </button>
      </div>

      {/* Empty State */}
      {costBases.length === 0 && (
        <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
          <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No {terminologyPlural.toLowerCase()} added yet.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Click "Add {terminology}" to track {isSaleEvent ? 'sale proceeds and related costs' : 'CGT-related costs'} for this event.
          </p>
        </div>
      )}

      {/* Cost Base Selector Popup Modal */}
      <AnimatePresence>
        {showSelectorPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => {
                setShowSelectorPopup(false);
                setShowCustomInput(false);
                setCustomName('');
              }}
            />

            {/* Popup Content */}
            <div
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-blue-500 dark:border-blue-400"
                style={{
                  maxHeight: 'calc(100vh - 32px)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 px-5 py-4 border-b-2 border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      Add {terminology}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {isSaleEvent
                        ? 'Select a predefined sale proceed or create a custom one'
                        : 'Select a predefined cost base or create a custom one'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSelectorPopup(false);
                      setShowCustomInput(false);
                      setCustomName('');
                    }}
                    className="flex-shrink-0 p-1.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-blue-900 dark:text-blue-100" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowCustomInput(false)}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                    !showCustomInput
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Predefined {terminologyPlural}
                </button>
                <button
                  onClick={() => setShowCustomInput(true)}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                    showCustomInput
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Custom {terminology}
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {!showCustomInput ? (
                  /* Predefined Cost Bases List */
                  unselectedDefinitions.length > 0 ? (
                    <div>
                      {Object.entries(groupedDefinitions).map(([category, defs]) => (
                        <div key={category} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                              {CATEGORY_NAMES[category as CostBaseCategory]}
                            </h4>
                          </div>
                          {defs.map(def => (
                            <button
                              key={def.id}
                              onClick={() => handleAddPredefinedCostBase(def.id)}
                              className="w-full px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                            >
                              <DollarSign className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                  {def.name}
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {def.description}
                                </div>
                                {def.requiresWarning && def.warningText && (
                                  <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{def.warningText}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">All available {terminologyPlural.toLowerCase()} have been added.</p>
                      <p className="text-xs mt-1">You can create a custom {terminology.toLowerCase()} instead.</p>
                    </div>
                  )
                ) : (
                  /* Custom Cost Base Form */
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {terminology} Name
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder={isSaleEvent ? 'e.g., Agent Commission' : 'e.g., Special Legal Fees'}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddCustomCostBase();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Category
                      </label>
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value as CostBaseCategory)}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="element1">Element 1: Acquisition Costs</option>
                        <option value="element2">Element 2: Incidental Costs</option>
                        <option value="element3">Element 3: Holding Costs</option>
                        <option value="element4">Element 4: Capital Improvements</option>
                        <option value="element5">Element 5: Title Costs</option>
                      </select>
                    </div>
                    <button
                      onClick={handleAddCustomCostBase}
                      disabled={!customName.trim()}
                      className="w-full px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom {terminology}
                    </button>
                  </div>
                )}
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
