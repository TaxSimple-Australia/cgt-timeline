'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileText, Split, AlertCircle, Lock, Unlock, ChevronDown, ChevronRight, Building2, LandPlot } from 'lucide-react';
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
  allocationPercentage: number;      // Allocation percentage
  isPercentageLocked: boolean;       // User manually set percentage?
}

type SizeUnit = 'acres' | 'hectares' | 'sqms';

export default function SubdivisionModal({ property, isOpen, onClose, clickedDate }: SubdivisionModalProps) {
  const { subdivideProperty } = useTimelineStore();

  // State
  const [subdivisionDate, setSubdivisionDate] = useState<Date>(clickedDate || new Date());
  const [lots, setLots] = useState<Lot[]>([
    { id: '1', name: 'Lot 1', address: property.address || '', lotSize: 0, allocationPercentage: 50, isPercentageLocked: false },
    { id: '2', name: 'Lot 2', address: property.address || '', lotSize: 0, allocationPercentage: 50, isPercentageLocked: false },
  ]);
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('hectares');

  // Land/Building value split state
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [landValue, setLandValue] = useState<number | undefined>(undefined);
  const [buildingValue, setBuildingValue] = useState<number | undefined>(undefined);

  // Notes state
  const [notes, setNotes] = useState<string>('');

  // Unit conversion helpers
  const convertToSqm = (value: number, unit: SizeUnit): number => {
    if (unit === 'sqms') return value;
    if (unit === 'hectares') return value * 10000;
    if (unit === 'acres') return value * 4046.86;
    return value;
  };

  const convertFromSqm = (sqm: number, unit: SizeUnit): number => {
    if (unit === 'sqms') return sqm;
    if (unit === 'hectares') return sqm / 10000;
    if (unit === 'acres') return sqm / 4046.86;
    return sqm;
  };

  const getUnitLabel = (unit: SizeUnit): string => {
    if (unit === 'sqms') return 'sqms';
    if (unit === 'hectares') return 'ha';
    return 'acres';
  };

  const getUnitStep = (unit: SizeUnit): string => {
    if (unit === 'sqms') return '1';
    if (unit === 'hectares') return '0.0001';
    return '0.001'; // acres
  };

  // Calculated values
  const totalLotSize = lots.reduce((sum, lot) => sum + (lot.lotSize || 0), 0);
  const parentCostBase = property.purchasePrice || 0;
  const totalPercentage = lots.reduce((sum, lot) => sum + (lot.allocationPercentage || 0), 0);
  const percentageWarning = Math.abs(totalPercentage - 100) > 0.1;
  const costBreakdownWarning = landValue !== undefined && buildingValue !== undefined &&
    Math.abs((landValue + buildingValue) - parentCostBase) > 1;

  // Auto-calculate percentages for unlocked lots when lot sizes change
  useEffect(() => {
    if (totalLotSize === 0) return;

    setLots(prevLots => {
      // Calculate total size of locked lots
      const lockedLots = prevLots.filter(l => l.isPercentageLocked);
      const lockedPercentage = lockedLots.reduce((sum, l) => sum + l.allocationPercentage, 0);
      const remainingPercentage = 100 - lockedPercentage;

      // Calculate total size of unlocked lots
      const unlockedLots = prevLots.filter(l => !l.isPercentageLocked);
      const unlockedTotalSize = unlockedLots.reduce((sum, l) => sum + (l.lotSize || 0), 0);

      return prevLots.map(lot => {
        if (lot.isPercentageLocked) return lot;
        if (unlockedTotalSize === 0) {
          // Distribute equally among unlocked lots
          return {
            ...lot,
            allocationPercentage: remainingPercentage / unlockedLots.length
          };
        }
        return {
          ...lot,
          allocationPercentage: ((lot.lotSize || 0) / unlockedTotalSize) * remainingPercentage
        };
      });
    });
  }, [lots.map(l => `${l.id}:${l.lotSize}:${l.isPercentageLocked}`).join(',')]);

  // Handlers
  const handleAddLot = () => {
    const newLotNumber = lots.length + 1;
    setLots([
      {
        id: Date.now().toString(),
        name: `Lot ${newLotNumber}`,
        address: property.address || '',
        lotSize: 0,
        allocationPercentage: 0,
        isPercentageLocked: false,
      },
      ...lots,
    ]);
  };

  const handleRemoveLot = (id: string) => {
    if (lots.length > 2) {
      setLots(lots.filter((lot) => lot.id !== id));
    }
  };

  const updateLot = (id: string, field: keyof Lot, value: string | number | boolean) => {
    setLots(lots.map((lot) => (lot.id === id ? { ...lot, [field]: value } : lot)));
  };

  // Update percentage and lock it
  const updatePercentage = (id: string, percentage: number) => {
    setLots(lots.map((lot) =>
      lot.id === id
        ? { ...lot, allocationPercentage: percentage, isPercentageLocked: true }
        : lot
    ));
  };

  // Toggle percentage lock (unlock resets to auto-calculated)
  const togglePercentageLock = (id: string) => {
    setLots(lots.map((lot) =>
      lot.id === id
        ? { ...lot, isPercentageLocked: !lot.isPercentageLocked }
        : lot
    ));
  };

  const handleSubmit = () => {
    // Validation - lot names are required
    if (lots.some((lot) => !lot.name)) {
      showWarning('Missing information', 'Please provide a name for all lots.');
      return;
    }

    // Percentages must sum to 100%
    if (percentageWarning) {
      showWarning('Percentage mismatch', 'Allocation percentages must sum to 100%. Please adjust the percentages.');
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
        allocationPercentage: lot.allocationPercentage,
        isPercentageLocked: lot.isPercentageLocked,
      })),
      fees: {},
      costBreakdown: (landValue !== undefined || buildingValue !== undefined) ? {
        landValue,
        buildingValue,
      } : undefined,
      notes,
    });

    onClose();
  };

  const calculateAllocatedCostBase = (lot: Lot, isMainLot: boolean) => {
    // Use land value if specified, otherwise full purchase price
    const apportionableBase = landValue !== undefined
      ? landValue
      : parentCostBase;

    const proportion = lot.allocationPercentage / 100;
    let allocated = apportionableBase * proportion;

    // Add building value to Lot 1 only
    if (isMainLot && buildingValue !== undefined) {
      allocated += buildingValue;
    }

    return allocated;
  };

  if (!isOpen) return null;

  return (
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
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:[color-scheme:dark]"
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
                        lot.id === '1'
                          ? "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      )}
                    >
                      {/* Main timeline continuation badge for Lot 1 */}
                      {lot.id === '1' && (
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

                          {/* Lot Size and Allocation Row */}
                          <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                              Lot Size & Allocation *
                            </label>

                            {/* Segmented Control for Unit Selection */}
                            <div className="flex items-center gap-2 mb-2">
                              {(['acres', 'hectares', 'sqms'] as SizeUnit[]).map((unit) => (
                                <button
                                  key={unit}
                                  type="button"
                                  onClick={() => setSizeUnit(unit)}
                                  className={cn(
                                    'flex-1 px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all',
                                    sizeUnit === unit
                                      ? 'bg-cyan-500 border-cyan-500 text-white shadow-md'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
                                  )}
                                >
                                  {unit === 'acres' ? 'Acres' : unit === 'hectares' ? 'Hectares' : 'sqms'}
                                </button>
                              ))}
                            </div>

                            {/* Lot Size and Allocation Percentage Row */}
                            <div className="flex items-center gap-3">
                              {/* Lot Size Input */}
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={lot.lotSize ? convertFromSqm(lot.lotSize, sizeUnit).toString() : ''}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    const sqm = convertToSqm(value, sizeUnit);
                                    updateLot(lot.id, 'lotSize', sqm);
                                  }}
                                  placeholder="Lot size"
                                  min="0"
                                  step={getUnitStep(sizeUnit)}
                                  className="w-full px-3 py-2 pr-12 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                  {getUnitLabel(sizeUnit)}
                                </span>
                              </div>

                              {/* Allocation Percentage Input with Lock */}
                              <div className="flex items-center gap-1">
                                <div className="relative w-24">
                                  <input
                                    type="number"
                                    value={lot.allocationPercentage.toFixed(1)}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      updatePercentage(lot.id, Math.max(0, Math.min(100, value)));
                                    }}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className={cn(
                                      "w-full px-3 py-2 pr-7 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm text-right",
                                      lot.isPercentageLocked
                                        ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
                                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    )}
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                    %
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => togglePercentageLock(lot.id)}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    lot.isPercentageLocked
                                      ? "bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50"
                                      : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                                  )}
                                  title={lot.isPercentageLocked ? "Unlock to auto-calculate from lot size" : "Percentage auto-calculated from lot size"}
                                >
                                  {lot.isPercentageLocked ? (
                                    <Lock className="w-4 h-4" />
                                  ) : (
                                    <Unlock className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Lock status hint */}
                            {lot.isPercentageLocked && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Percentage manually set. Click unlock to auto-calculate from lot size.
                              </p>
                            )}
                          </div>

                          {/* Allocated Cost Base Preview */}
                          {lot.allocationPercentage > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Allocated Cost Base:
                                </span>
                                <span className="font-semibold text-pink-600 dark:text-pink-400">
                                  {formatCurrency(calculateAllocatedCostBase(lot, index === 0))}
                                </span>
                              </div>
                              {/* Show building value note for Lot 1 */}
                              {index === 0 && buildingValue !== undefined && buildingValue > 0 && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  Includes building value of {formatCurrency(buildingValue)}
                                </p>
                              )}
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

                {/* Total Lot Size & Percentage Summary */}
                <div className={cn(
                  "mt-3 p-3 rounded-lg",
                  percentageWarning
                    ? "bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30"
                    : "bg-blue-50 dark:bg-blue-500/10"
                )}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn(
                      "font-medium",
                      percentageWarning ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
                    )}>
                      Total Lot Size:
                    </span>
                    <span className={cn(
                      "font-semibold",
                      percentageWarning ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
                    )}>
                      {convertFromSqm(totalLotSize, sizeUnit).toFixed(sizeUnit === 'sqms' ? 0 : 4)} {getUnitLabel(sizeUnit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className={cn(
                      "font-medium",
                      percentageWarning ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
                    )}>
                      Total Allocation:
                    </span>
                    <span className={cn(
                      "font-semibold",
                      percentageWarning ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
                    )}>
                      {totalPercentage.toFixed(1)}%
                      {percentageWarning && " (must equal 100%)"}
                    </span>
                  </div>
                  {percentageWarning && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Allocation percentages must sum to 100%. Please adjust the percentages.
                    </p>
                  )}
                </div>
              </div>

              {/* Land/Building Value Breakdown (Collapsible) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {showCostBreakdown ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Cost Base Breakdown (Optional)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Separate land from building value
                  </span>
                </button>

                {showCostBreakdown && (
                  <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      If your property has both land and building value, enter them separately.
                      Only land value will be apportioned across lots. Building value stays with Lot 1.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Land Value */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <LandPlot className="w-3.5 h-3.5" />
                          Land Value
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">$</span>
                          <input
                            type="number"
                            value={landValue ?? ''}
                            onChange={(e) => setLandValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="0"
                            min="0"
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Apportioned across all lots
                        </p>
                      </div>

                      {/* Building Value */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          <Building2 className="w-3.5 h-3.5" />
                          Building Value
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">$</span>
                          <input
                            type="number"
                            value={buildingValue ?? ''}
                            onChange={(e) => setBuildingValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="0"
                            min="0"
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Stays with Lot 1 only
                        </p>
                      </div>
                    </div>

                    {/* Total and validation */}
                    {(landValue !== undefined || buildingValue !== undefined) && (
                      <div className={cn(
                        "p-3 rounded-lg",
                        costBreakdownWarning
                          ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30"
                          : "bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30"
                      )}>
                        <div className="flex items-center justify-between text-sm">
                          <span className={cn(
                            "font-medium",
                            costBreakdownWarning ? "text-amber-700 dark:text-amber-300" : "text-green-700 dark:text-green-300"
                          )}>
                            Total:
                          </span>
                          <span className={cn(
                            "font-semibold",
                            costBreakdownWarning ? "text-amber-700 dark:text-amber-300" : "text-green-700 dark:text-green-300"
                          )}>
                            {formatCurrency((landValue || 0) + (buildingValue || 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className={cn(
                            costBreakdownWarning ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                          )}>
                            Purchase Price:
                          </span>
                          <span className={cn(
                            costBreakdownWarning ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                          )}>
                            {formatCurrency(parentCostBase)}
                            {costBreakdownWarning ? " (mismatch)" : " ✓"}
                          </span>
                        </div>
                        {costBreakdownWarning && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Land + Building doesn't equal purchase price (this is allowed but may indicate an error)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  placeholder="Add any notes about this subdivision..."
                />
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
                disabled={lots.some((lot) => !lot.name) || percentageWarning}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  lots.some((lot) => !lot.name) || percentageWarning
                    ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                    : 'bg-pink-500 hover:bg-pink-600'
                )}
              >
                Create Subdivision
              </button>
            </div>
          </motion.div>
    </div>
  );
}
