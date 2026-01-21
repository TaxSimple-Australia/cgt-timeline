'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, DollarSign, FileText, Split, AlertCircle } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import { cn, formatCurrency } from '@/lib/utils';
import { Property } from '@/store/timeline';
import { showWarning } from '@/lib/toast-helpers';

interface SubdivisionModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  clickedDate?: Date;
}

interface Lot {
  id: string;
  name: string;
  address: string;
  lotSize: number;
}

export default function SubdivisionModal({ property, isOpen, onClose, clickedDate }: SubdivisionModalProps) {
  const { subdivideProperty } = useTimelineStore();

  // State
  const [subdivisionDate, setSubdivisionDate] = useState<Date>(clickedDate || new Date());
  const [lots, setLots] = useState<Lot[]>([
    { id: '1', name: 'Lot 1', address: property.address || '', lotSize: 0 },
    { id: '2', name: 'Lot 2', address: property.address || '', lotSize: 0 },
  ]);
  const [surveyorFees, setSurveyorFees] = useState<number>(0);
  const [planningFees, setPlanningFees] = useState<number>(0);
  const [legalFees, setLegalFees] = useState<number>(0);
  const [titleFees, setTitleFees] = useState<number>(0);

  // Calculated values
  const totalLotSize = lots.reduce((sum, lot) => sum + (lot.lotSize || 0), 0);
  const totalFees = surveyorFees + planningFees + legalFees + titleFees;
  const parentCostBase = property.purchasePrice || 0;

  // Handlers
  const handleAddLot = () => {
    const newLotNumber = lots.length + 1;
    setLots([
      ...lots,
      {
        id: Date.now().toString(),
        name: `Lot ${newLotNumber}`,
        address: property.address || '',
        lotSize: 0,
      },
    ]);
  };

  const handleRemoveLot = (id: string) => {
    if (lots.length > 2) {
      setLots(lots.filter((lot) => lot.id !== id));
    }
  };

  const updateLot = (id: string, field: keyof Lot, value: string | number) => {
    setLots(lots.map((lot) => (lot.id === id ? { ...lot, [field]: value } : lot)));
  };

  const handleSubmit = () => {
    // Validation
    if (totalLotSize === 0) {
      showWarning('Missing information', 'Please enter lot sizes for all lots.');
      return;
    }

    if (lots.some((lot) => !lot.name || lot.lotSize <= 0)) {
      showWarning('Missing information', 'Please provide a name and valid lot size for all lots.');
      return;
    }

    // Call store action
    subdivideProperty({
      parentPropertyId: property.id!,
      subdivisionDate,
      lots: lots.map((lot) => ({
        name: lot.name,
        address: lot.address,
        lotSize: lot.lotSize,
      })),
      fees: {
        surveyorFees: surveyorFees || undefined,
        planningFees: planningFees || undefined,
        legalFees: legalFees || undefined,
        titleFees: titleFees || undefined,
      },
    });

    onClose();
  };

  const calculateAllocatedCostBase = (lotSize: number) => {
    if (totalLotSize === 0) return 0;
    const proportion = lotSize / totalLotSize;
    const feePerLot = totalFees / lots.length;
    return parentCostBase * proportion + feePerLot;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop, not on children
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Split className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Subdivide Property
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{property.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Subdivision Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4" />
                  Subdivision Date
                </label>
                <input
                  type="date"
                  value={subdivisionDate.toISOString().split('T')[0]}
                  onChange={(e) => setSubdivisionDate(new Date(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Lots */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Split className="w-4 h-4" />
                    Subdivided Lots ({lots.length})
                  </label>
                  <button
                    onClick={handleAddLot}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Lot
                  </button>
                </div>

                <div className="space-y-3">
                  {lots.map((lot, index) => (
                    <div
                      key={lot.id}
                      className={cn(
                        "p-4 border rounded-lg",
                        index === 0
                          ? "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      )}
                    >
                      {/* Main timeline continuation badge for Lot 1 */}
                      {index === 0 && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-800/30 font-medium">
                            Continues Main Timeline
                          </span>
                          <span className="text-green-600 dark:text-green-500">
                            This lot inherits the parent property's CGT history
                          </span>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Lot Name */}
                          <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                              Lot Name
                            </label>
                            <input
                              type="text"
                              value={lot.name}
                              onChange={(e) => updateLot(lot.id, 'name', e.target.value)}
                              placeholder="e.g., Lot 1"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                            />
                          </div>

                          {/* Lot Address (optional) */}
                          <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                              Address (optional)
                            </label>
                            <input
                              type="text"
                              value={lot.address}
                              onChange={(e) => updateLot(lot.id, 'address', e.target.value)}
                              placeholder="Street address"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                            />
                          </div>

                          {/* Lot Size */}
                          <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                              Lot Size (hectares) *
                            </label>
                            <input
                              type="number"
                              value={lot.lotSize ? (lot.lotSize / 10000).toString() : ''}
                              onChange={(e) => {
                                const hectares = parseFloat(e.target.value) || 0;
                                const sqm = hectares * 10000;
                                updateLot(lot.id, 'lotSize', sqm);
                              }}
                              placeholder="0"
                              min="0"
                              step="0.0001"
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                            />
                          </div>

                          {/* Allocated Cost Base Preview */}
                          {lot.lotSize > 0 && totalLotSize > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Proportion:
                                </span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {((lot.lotSize / totalLotSize) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Allocated Cost Base:
                                </span>
                                <span className="font-semibold text-pink-600 dark:text-pink-400">
                                  {formatCurrency(calculateAllocatedCostBase(lot.lotSize))}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        {lots.length > 2 && (
                          <button
                            onClick={() => handleRemoveLot(lot.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors"
                            title="Remove lot"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Lot Size */}
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      Total Lot Size:
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      {(totalLotSize / 10000).toFixed(4)} ha
                    </span>
                  </div>
                </div>
              </div>

              {/* Subdivision Fees */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <DollarSign className="w-4 h-4" />
                  Subdivision Fees (Optional)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Surveyor Fees */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Surveyor Fees
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={surveyorFees || ''}
                        onChange={(e) => setSurveyorFees(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Planning Fees */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Planning/Council Fees
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={planningFees || ''}
                        onChange={(e) => setPlanningFees(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Legal Fees */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Legal Fees
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={legalFees || ''}
                        onChange={(e) => setLegalFees(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Title Fees */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Title Registration Fees
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={titleFees || ''}
                        onChange={(e) => setTitleFees(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Fees */}
                {totalFees > 0 && (
                  <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Total Fees:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(totalFees)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1 text-slate-600 dark:text-slate-400">
                      <span>Per Lot:</span>
                      <span>{formatCurrency(totalFees / lots.length)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Note */}
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <div>
                      <p className="font-medium">CGT Timeline Continuation</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Lot 1 will inherit all events from the parent property's timeline before subdivision.
                        This preserves the CGT history (purchase date, improvements, etc.) for the main lot.
                        Other lots start fresh from the subdivision date.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Cost Base Allocation</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        The parent property's cost base will be allocated proportionally to each lot
                        based on lot size. Subdivision fees will be distributed equally across all
                        lots.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={totalLotSize === 0 || lots.some((lot) => !lot.name || lot.lotSize <= 0)}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  totalLotSize === 0 || lots.some((lot) => !lot.name || lot.lotSize <= 0)
                    ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                    : 'bg-pink-500 hover:bg-pink-600'
                )}
              >
                Create Subdivision
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
