'use client';

import React, { useState } from 'react';
import { Plus, X, DollarSign, AlertCircle, HelpCircle } from 'lucide-react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<CostBaseCategory>('element2');

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
    setShowDropdown(false);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Cost Base Elements (for CGT)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track costs that form part of the CGT cost base calculation
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
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg shadow-xl z-10">
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
                  Total Cost Base:
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

      {/* Add Buttons */}
      <div className="flex gap-2">
        {/* Add from predefined list */}
        {unselectedDefinitions.length > 0 && (
          <div className="relative flex-1">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
            >
              <Plus className="w-4 h-4" />
              Add Cost Base
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                {/* Dropdown */}
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto z-20">
                  {Object.entries(groupedDefinitions).map(([category, defs]) => (
                    <div key={category} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {CATEGORY_NAMES[category as CostBaseCategory]}
                      </div>
                      {defs.map(def => (
                        <button
                          key={def.id}
                          onClick={() => handleAddPredefinedCostBase(def.id)}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-start gap-2 group/item"
                        >
                          <DollarSign className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium flex items-center gap-1.5">
                              <span>{def.name}</span>
                              <div className="relative">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 opacity-60 group-hover/item:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {def.description}
                            </div>
                            {def.requiresWarning && def.warningText && (
                              <div className="flex items-start gap-1 mt-1 text-xs text-amber-700 dark:text-amber-300">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{def.warningText}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Add custom cost base */}
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2 border border-slate-300 dark:border-slate-600"
          title="Add custom cost base"
        >
          <Plus className="w-4 h-4" />
          Custom
        </button>
      </div>

      {/* Custom Input Form */}
      {showCustomInput && (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Add Custom Cost Base
          </h4>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="e.g., Special Legal Fees"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAddCustomCostBase();
                }
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value as CostBaseCategory)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="element1">Element 1: Acquisition Costs</option>
              <option value="element2">Element 2: Incidental Costs</option>
              <option value="element3">Element 3: Holding Costs</option>
              <option value="element4">Element 4: Capital Improvements</option>
              <option value="element5">Element 5: Title Costs</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddCustomCostBase}
              disabled={!customName.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowCustomInput(false);
                setCustomName('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {costBases.length === 0 && (
        <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
          <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No cost bases added yet.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Click "Add Cost Base" to track CGT-related costs for this event.
          </p>
        </div>
      )}
    </div>
  );
}
