'use client';

import React, { useState } from 'react';
import { X, Edit } from 'lucide-react';
import { useTimelineStore, Property } from '@/store/timeline';
import { cn, formatCurrency } from '@/lib/utils';
import { showWarning, showSuccess } from '@/lib/toast-helpers';

interface LotDetailsModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

type SizeUnit = 'acres' | 'hectares' | 'sqms';

export default function LotDetailsModal({ property, isOpen, onClose }: LotDetailsModalProps) {
  console.log('🎨 LotDetailsModal rendered with:', { property: property?.lotNumber || property?.name, isOpen });
  const { updateProperty, deleteProperty, properties, events } = useTimelineStore();

  // State
  const [lotNumber, setLotNumber] = useState(property?.lotNumber || '');
  const [address, setAddress] = useState(property?.address || '');
  const [lotSize, setLotSize] = useState(property?.lotSize || 0);
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('hectares');

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

  // Calculate allocated cost base (if part of subdivision)
  const calculateAllocatedCostBase = (): number => {
    if (!property.parentPropertyId || !property.subdivisionGroup) return 0;

    // Find parent property
    const parent = properties.find(p => p.id === property.parentPropertyId);
    if (!parent || !parent.purchasePrice) return 0;

    // Find all sibling lots in this subdivision
    const siblings = properties.filter(
      p => p.subdivisionGroup === property.subdivisionGroup && p.lotSize
    );

    const totalLotSize = siblings.reduce((sum, lot) => sum + (lot.lotSize || 0), 0);
    if (totalLotSize === 0) return 0;

    const proportion = lotSize / totalLotSize;
    return parent.purchasePrice * proportion;
  };

  const handleSave = () => {
    // Validation
    if (!lotNumber.trim()) {
      showWarning('Missing information', 'Please provide a lot number.');
      return;
    }

    if (lotSize <= 0) {
      showWarning('Invalid lot size', 'Lot size must be greater than zero.');
      return;
    }

    // Update property
    updateProperty(property.id!, {
      lotNumber: lotNumber.trim(),
      address: address.trim(),
      lotSize,
    });

    showSuccess('Lot updated', `${lotNumber} details have been saved.`);
    onClose();
  };

  const handleDelete = () => {
    // Safeguard 1: Cannot delete Lot 1 (main continuation)
    // Instead, show message about undoing the subdivision
    if (property.isMainLotContinuation) {
      // Check if this is the only lot
      const siblingLots = properties.filter(
        p => p.subdivisionGroup === property.subdivisionGroup && p.parentPropertyId
      );

      if (siblingLots.length === 1) {
        // Only Lot 1 exists, can delete (undo subdivision)
        if (!confirm(`This will undo the entire subdivision and return to the original property. Continue?`)) {
          return;
        }
      } else {
        showWarning('Cannot delete Lot 1', 'Lot 1 continues the main timeline. Delete other lots first to undo the subdivision.');
        return;
      }
    }

    // Safeguard 2: Warn about events
    const lotEvents = events.filter(e => e.propertyId === property.id);
    if (lotEvents.length > 0) {
      if (!confirm(`This lot has ${lotEvents.length} event(s). Delete anyway? All events will be removed.`)) {
        return;
      }
    }

    // Check if this is the last non-Lot-1 lot (will trigger subdivision undo)
    const parent = properties.find(p => p.id === property.parentPropertyId);
    if (parent) {
      const nonLot1Siblings = properties.filter(
        p => p.parentPropertyId === parent.id &&
             p.subdivisionGroup === property.subdivisionGroup &&
             !p.isMainLotContinuation
      );

      if (nonLot1Siblings.length === 1 && nonLot1Siblings[0].id === property.id) {
        // This is the last non-Lot-1 lot - will undo subdivision
        if (!confirm(`This is the last lot. Deleting it will undo the subdivision and return to the original property. Continue?`)) {
          return;
        }
        deleteProperty(property.id!);
        showSuccess('Subdivision undone', 'Returned to original property timeline.');
        onClose();
        return;
      }
    }

    // Regular lot deletion
    deleteProperty(property.id!);
    showSuccess('Lot deleted', `${lotNumber} has been removed.`);
    onClose();
  };

  if (!isOpen || !property) return null;

  const isLot1 = property.isMainLotContinuation;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isLot1
                  ? "bg-green-500/10"
                  : "bg-pink-500/10"
              )}
            >
              <Edit
                className={cn(
                  "w-5 h-5",
                  isLot1 ? "text-green-500" : "text-pink-500"
                )}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Edit Lot Details
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isLot1 ? 'Continues Main Timeline' : 'Subdivision Lot'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Lot Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Lot Number *
            </label>
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="e.g., Lot 1, Lot 2A"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Lot Size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Lot Size *
            </label>

            {/* Unit Selector */}
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

            {/* Size Input */}
            <div className="relative">
              <input
                type="number"
                value={lotSize ? convertFromSqm(lotSize, sizeUnit).toString() : ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const sqm = convertToSqm(value, sizeUnit);
                  setLotSize(sqm);
                }}
                placeholder="0"
                min="0"
                step={getUnitStep(sizeUnit)}
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                {getUnitLabel(sizeUnit)}
              </span>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Address (optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Allocated Cost Base (Read-only) */}
          {property.parentPropertyId && lotSize > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Allocated Cost Base:
                </span>
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {formatCurrency(calculateAllocatedCostBase())}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Based on proportional lot size
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          {/* Delete button - left side */}
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-300 dark:border-red-500/30"
          >
            {isLot1 ? 'Undo Subdivision' : 'Delete Lot'}
          </button>

          {/* Cancel and Save buttons - right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!lotNumber.trim() || lotSize <= 0}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                !lotNumber.trim() || lotSize <= 0
                  ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed'
                  : isLot1
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-pink-500 hover:bg-pink-600'
              )}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
