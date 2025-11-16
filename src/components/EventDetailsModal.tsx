'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEvent, PropertyStatus, useTimelineStore, CostBaseItem } from '@/store/timeline';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, Home, Tag, FileText, CheckCircle } from 'lucide-react';
import CostBaseSelector from './CostBaseSelector';
import { getCostBaseDefinition } from '@/lib/cost-base-definitions';

interface EventDetailsModalProps {
  event: TimelineEvent;
  onClose: () => void;
  propertyName: string;
}

export default function EventDetailsModal({ event, onClose, propertyName }: EventDetailsModalProps) {
  const { updateEvent, deleteEvent } = useTimelineStore();

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(format(event.date, 'yyyy-MM-dd'));
  const [amount, setAmount] = useState(event.amount?.toString() || '');
  const [description, setDescription] = useState(event.description || '');
  const [isPPR, setIsPPR] = useState(event.isPPR || false);
  const [newStatus, setNewStatus] = useState<PropertyStatus | ''>(event.newStatus || '');
  const [isSaving, setIsSaving] = useState(false);

  // Land and building price split for purchases
  const [usePriceSplit, setUsePriceSplit] = useState(
    (event.landPrice !== undefined || event.buildingPrice !== undefined) && event.type === 'purchase'
  );
  const [landPrice, setLandPrice] = useState(event.landPrice?.toString() || '');
  const [buildingPrice, setBuildingPrice] = useState(event.buildingPrice?.toString() || '');

  // NEW: Dynamic Cost Bases
  const [costBases, setCostBases] = useState<CostBaseItem[]>(() => {
    // Migrate legacy fields to new cost base structure on initial load
    if (event.costBases && event.costBases.length > 0) {
      return event.costBases;
    }

    // Migrate from legacy fields
    const migrated: CostBaseItem[] = [];
    const legacyMappings: Array<{
      value: number | undefined;
      definitionId: string;
    }> = [
      { value: event.purchaseLegalFees, definitionId: 'purchase_legal_fees' },
      { value: event.valuationFees, definitionId: 'valuation_fees' },
      { value: event.stampDuty, definitionId: 'stamp_duty' },
      { value: event.purchaseAgentFees, definitionId: 'purchase_agent_fees' },
      { value: event.landTax, definitionId: 'land_tax' },
      { value: event.insurance, definitionId: 'insurance' },
      { value: event.improvementCost, definitionId: 'renovation_whole_house' },
      { value: event.titleLegalFees, definitionId: 'title_legal_fees' },
      { value: event.saleLegalFees, definitionId: 'sale_legal_fees' },
      { value: event.saleAgentFees, definitionId: 'sale_agent_fees' },
    ];

    legacyMappings.forEach(({ value, definitionId }) => {
      if (value && value > 0) {
        const definition = getCostBaseDefinition(definitionId);
        if (definition) {
          migrated.push({
            id: `cb-migrated-${definitionId}-${Date.now()}`,
            definitionId: definition.id,
            name: definition.name,
            amount: value,
            category: definition.category,
            isCustom: false,
            description: definition.description,
          });
        }
      }
    });

    // Market valuation is special - it's not a cost base item
    return migrated;
  });

  const [marketValuation, setMarketValuation] = useState(event.marketValuation?.toString() || '');

  const handleSave = () => {
    try {
      setIsSaving(true);

      const updates: Partial<TimelineEvent> = {
        title: title.trim(),
        date: new Date(date),
      };

      // Handle price/amount based on split mode
      if (event.type === 'purchase' && usePriceSplit) {
        // Using land + building split
        if (landPrice && !isNaN(parseFloat(landPrice))) {
          updates.landPrice = parseFloat(landPrice);
        } else {
          updates.landPrice = undefined;
        }

        if (buildingPrice && !isNaN(parseFloat(buildingPrice))) {
          updates.buildingPrice = parseFloat(buildingPrice);
        } else {
          updates.buildingPrice = undefined;
        }

        // Calculate total amount from land + building
        const landVal = updates.landPrice || 0;
        const buildingVal = updates.buildingPrice || 0;
        if (landVal > 0 || buildingVal > 0) {
          updates.amount = landVal + buildingVal;
        } else {
          updates.amount = undefined;
        }
      } else {
        // Using single amount
        if (amount && !isNaN(parseFloat(amount))) {
          updates.amount = parseFloat(amount);
        } else {
          updates.amount = undefined;
        }
        // Clear land/building prices when not using split
        updates.landPrice = undefined;
        updates.buildingPrice = undefined;
      }

      // Only include description if not empty
      if (description.trim()) {
        updates.description = description.trim();
      } else {
        updates.description = undefined;
      }

      // Include PPR status
      updates.isPPR = isPPR ? true : undefined;

      // Include new status if applicable
      if (newStatus) {
        updates.newStatus = newStatus as PropertyStatus;
      }

      // NEW: Dynamic Cost Bases
      updates.costBases = costBases.length > 0 ? costBases : undefined;

      // DEPRECATED: Clear legacy cost base fields (they're now in costBases array)
      updates.purchaseLegalFees = undefined;
      updates.valuationFees = undefined;
      updates.stampDuty = undefined;
      updates.purchaseAgentFees = undefined;
      updates.landTax = undefined;
      updates.insurance = undefined;
      updates.improvementCost = undefined;
      updates.titleLegalFees = undefined;
      updates.saleLegalFees = undefined;
      updates.saleAgentFees = undefined;

      // Market valuation is separate (not a cost base)
      updates.marketValuation = marketValuation && !isNaN(parseFloat(marketValuation)) ? parseFloat(marketValuation) : undefined;

      updateEvent(event.id, updates);

      // Small delay for visual feedback
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 200);
    } catch (error) {
      console.error('Error saving event:', error);
      setIsSaving(false);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        // Cmd+Enter or Ctrl+Enter to save
        if (!isSaving && title.trim() && date) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, title, date, onClose]);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: `${event.color}15` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: event.color }}
                >
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{event.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{propertyName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Event Type Badge */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
              <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Event Type:</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: event.color }}
              >
                {event.type.replace('_', ' ').toUpperCase()}
              </span>
              {isPPR && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  PPR
                </span>
              )}
            </div>

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Basic Information</h3>

              {/* Title Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4" />
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event title"
                  required
                />
              </div>

              {/* Date Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Financial Details Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Financial Details</h3>

              {/* Price Split Toggle for Purchase Events */}
              {event.type === 'purchase' && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <input
                    type="checkbox"
                    id="usePriceSplit"
                    checked={usePriceSplit}
                    onChange={(e) => setUsePriceSplit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="usePriceSplit" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                    Split price into Land + Building
                  </label>
                </div>
              )}

              {/* Single Amount Input (when not using split or not a purchase) */}
              {!(event.type === 'purchase' && usePriceSplit) && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {/* Land and Building Price Inputs (for purchase with split) */}
              {event.type === 'purchase' && usePriceSplit && (
                <div className="space-y-3">
                  {/* Land Price */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <DollarSign className="w-4 h-4" />
                      Land Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                      <input
                        type="number"
                        value={landPrice}
                        onChange={(e) => setLandPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Building Price */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Home className="w-4 h-4" />
                      Building Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                      <input
                        type="number"
                        value={buildingPrice}
                        onChange={(e) => setBuildingPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Total Display */}
                  {(landPrice || buildingPrice) && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Total Purchase Price:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ${((parseFloat(landPrice) || 0) + (parseFloat(buildingPrice) || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cost Base Section (for CGT calculation) - NEW COMPONENT */}
            {(event.type === 'purchase' || event.type === 'sale' || event.type === 'improvement' || event.type === 'move_in' || event.type === 'move_out' || event.type === 'rent_start' || event.type === 'rent_end' || event.type === 'status_change' || event.type === 'refinance') && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <CostBaseSelector
                  eventType={event.type}
                  costBases={costBases}
                  onChange={setCostBases}
                />
              </div>
            )}

            {/* Move Out Event - Market Valuation (separate from cost bases) */}
            {event.type === 'move_out' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Market Valuation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The market value of the property at the time of moving out (required for CGT purposes)
                  </p>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <DollarSign className="w-4 h-4" />
                      Market Value at Move Out
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                      <input
                        type="number"
                        value={marketValuation}
                        onChange={(e) => setMarketValuation(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Additional Information</h3>

              {/* Description Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add notes about this event..."
                />
              </div>
            </div>

            {/* Status Change Dropdown (if applicable) */}
            {event.type === 'status_change' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Home className="w-4 h-4" />
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PropertyStatus)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status...</option>
                  <option value="ppr">Principal Place of Residence</option>
                  <option value="rental">Rental/Investment</option>
                  <option value="vacant">Vacant</option>
                  <option value="construction">Under Construction</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            {/* Keyboard shortcuts hint */}
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-4">
              <span>💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 font-mono">Esc</kbd> to cancel</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 font-mono">Ctrl+Enter</kbd> to save</span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Event
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !date}
                  className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
