'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEvent, PropertyStatus, useTimelineStore, CostBaseItem } from '@/store/timeline';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, Home, Tag, FileText, CheckCircle, Receipt, Info, Star, Palette, Building2, Key } from 'lucide-react';
import CostBaseSelector from './CostBaseSelector';
import { getCostBaseDefinition } from '@/lib/cost-base-definitions';
import CostBaseSummaryModal from './CostBaseSummaryModal';

// Color palette for custom events
const customEventColors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#1F2937', // Dark
];

interface EventDetailsModalProps {
  event: TimelineEvent;
  onClose: () => void;
  propertyName: string;
}

export default function EventDetailsModal({ event, onClose, propertyName }: EventDetailsModalProps) {
  const { updateEvent, deleteEvent, addEvent, events } = useTimelineStore();

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(format(event.date, 'yyyy-MM-dd'));
  const [amount, setAmount] = useState(event.amount?.toString() || '');
  const [description, setDescription] = useState(event.description || '');
  const [newStatus, setNewStatus] = useState<PropertyStatus | ''>(event.newStatus || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showDateTooltip, setShowDateTooltip] = useState(false);

  // Custom event specific state
  const [customColor, setCustomColor] = useState(event.color || '#6B7280');
  const [affectsStatus, setAffectsStatus] = useState(event.affectsStatus || false);

  // Move in on same day checkbox (for purchase events)
  const [moveInOnSameDay, setMoveInOnSameDay] = useState(false);
  const [purchaseAsVacant, setPurchaseAsVacant] = useState(false);
  const [purchaseAsRent, setPurchaseAsRent] = useState(false);

  // Move out status checkboxes (for move_out events)
  const [moveOutAsVacant, setMoveOutAsVacant] = useState(false);
  const [moveOutAsRent, setMoveOutAsRent] = useState(false);

  // Rent end status checkboxes (for rent_end events)
  const [rentEndAsVacant, setRentEndAsVacant] = useState(false);
  const [rentEndAsMoveIn, setRentEndAsMoveIn] = useState(false);

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

      // Handle price/amount calculation
      if (event.type === 'purchase') {
        // For purchase events, calculate amount from cost bases
        const totalCostBases = costBases.reduce((sum, cb) => sum + cb.amount, 0);
        updates.amount = totalCostBases > 0 ? totalCostBases : undefined;

        // Clear legacy land/building prices
        updates.landPrice = undefined;
        updates.buildingPrice = undefined;
      } else if (event.type === 'sale') {
        // For sale events, extract sale price from costBases if available
        const salePriceItem = costBases.find(cb => cb.definitionId === 'sale_price');
        if (salePriceItem && salePriceItem.amount > 0) {
          updates.amount = salePriceItem.amount;
        } else if (amount && !isNaN(parseFloat(amount))) {
          // Fallback to manual amount field if no sale_price in costBases
          updates.amount = parseFloat(amount);
        } else {
          updates.amount = undefined;
        }

        // Clear legacy land/building prices
        updates.landPrice = undefined;
        updates.buildingPrice = undefined;
      } else {
        // For other events, use the single amount field
        if (amount && !isNaN(parseFloat(amount))) {
          updates.amount = parseFloat(amount);
        } else {
          updates.amount = undefined;
        }
        // Clear land/building prices for non-purchase events
        updates.landPrice = undefined;
        updates.buildingPrice = undefined;
      }

      // Only include description if not empty
      if (description.trim()) {
        updates.description = description.trim();
      } else {
        updates.description = undefined;
      }

      // Include new status if applicable (for status_change and custom events)
      if (event.type === 'status_change' || (event.type === 'custom' && affectsStatus)) {
        if (newStatus) {
          updates.newStatus = newStatus as PropertyStatus;
        } else {
          updates.newStatus = undefined;
        }
      }

      // Custom event specific fields
      if (event.type === 'custom') {
        updates.color = customColor;
        updates.affectsStatus = affectsStatus || undefined;
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

      // Create move_in event if checkbox is checked (for purchase events)
      if (event.type === 'purchase' && moveInOnSameDay) {
        // Check if a move_in event already exists for this property on the same date
        const moveInDate = new Date(date);
        const existingMoveIn = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'move_in' &&
            e.date.getTime() === moveInDate.getTime()
        );

        // Only create if no duplicate exists
        if (!existingMoveIn) {
          addEvent({
            propertyId: event.propertyId,
            type: 'move_in',
            date: moveInDate,
            title: 'Move In',
            position: event.position, // Use same position as purchase event
            color: '#10B981', // Green color for move_in events
          });
        }
      }

      // Create status_change event for "purchase as vacant"
      if (event.type === 'purchase' && purchaseAsVacant) {
        const statusDate = new Date(date);
        const existingStatusChange = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'status_change' &&
            e.newStatus === 'vacant' &&
            e.date.getTime() === statusDate.getTime()
        );

        if (!existingStatusChange) {
          addEvent({
            propertyId: event.propertyId,
            type: 'status_change',
            date: statusDate,
            title: 'Status: Vacant',
            newStatus: 'vacant',
            position: event.position,
            color: '#A855F7', // Purple color for status_change events
          });
        }
      }

      // Create status_change event for "purchase as rent"
      if (event.type === 'purchase' && purchaseAsRent) {
        const statusDate = new Date(date);
        const existingStatusChange = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'status_change' &&
            e.newStatus === 'rental' &&
            e.date.getTime() === statusDate.getTime()
        );

        if (!existingStatusChange) {
          addEvent({
            propertyId: event.propertyId,
            type: 'status_change',
            date: statusDate,
            title: 'Status: Rental',
            newStatus: 'rental',
            position: event.position,
            color: '#A855F7', // Purple color for status_change events
          });
        }
      }

      // Create status_change event for "move out as vacant"
      if (event.type === 'move_out' && moveOutAsVacant) {
        const statusDate = new Date(date);
        const existingStatusChange = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'status_change' &&
            e.newStatus === 'vacant' &&
            e.date.getTime() === statusDate.getTime()
        );

        if (!existingStatusChange) {
          addEvent({
            propertyId: event.propertyId,
            type: 'status_change',
            date: statusDate,
            title: 'Status: Vacant',
            newStatus: 'vacant',
            position: event.position,
            color: '#A855F7', // Purple color for status_change events
          });
        }
      }

      // Create rent_start event for "move out as rent"
      if (event.type === 'move_out' && moveOutAsRent) {
        const rentDate = new Date(date);
        const existingRentStart = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'rent_start' &&
            e.date.getTime() === rentDate.getTime()
        );

        if (!existingRentStart) {
          addEvent({
            propertyId: event.propertyId,
            type: 'rent_start',
            date: rentDate,
            title: 'Start Rent',
            position: event.position,
            color: '#F59E0B', // Amber color for rent_start events
          });
        }
      }

      // Create status_change event for "rent end as vacant"
      if (event.type === 'rent_end' && rentEndAsVacant) {
        const statusDate = new Date(date);
        const existingStatusChange = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'status_change' &&
            e.newStatus === 'vacant' &&
            e.date.getTime() === statusDate.getTime()
        );

        if (!existingStatusChange) {
          addEvent({
            propertyId: event.propertyId,
            type: 'status_change',
            date: statusDate,
            title: 'Status: Vacant',
            newStatus: 'vacant',
            position: event.position,
            color: '#A855F7', // Purple color for status_change events
          });
        }
      }

      // Create move_in event for "rent end as move in"
      if (event.type === 'rent_end' && rentEndAsMoveIn) {
        const moveInDate = new Date(date);
        const existingMoveIn = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'move_in' &&
            e.date.getTime() === moveInDate.getTime()
        );

        if (!existingMoveIn) {
          addEvent({
            propertyId: event.propertyId,
            type: 'move_in',
            date: moveInDate,
            title: 'Move In',
            position: event.position,
            color: '#10B981', // Green color for move_in events
          });
        }
      }

      // Reset checkbox states to prevent duplicate creation on next save
      setMoveInOnSameDay(false);
      setPurchaseAsVacant(false);
      setPurchaseAsRent(false);
      setMoveOutAsVacant(false);
      setMoveOutAsRent(false);
      setRentEndAsVacant(false);
      setRentEndAsMoveIn(false);

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
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {event.type === 'sale' && event.title.toLowerCase() === 'sale' ? 'sold' : event.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{propertyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Cost Base Summary Button - Only show for events with cost bases */}
                {(event.type === 'purchase' || event.type === 'sale' || event.type === 'improvement') &&
                 costBases && costBases.length > 0 && (
                  <button
                    onClick={() => setShowSummary(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                    title="View Cost Summary"
                  >
                    <Receipt className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Event Type Badge */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
              <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Event Type:</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                style={{ backgroundColor: event.type === 'custom' ? customColor : event.color }}
              >
                {event.type === 'custom' && <Star className="w-3 h-3" />}
                {event.type === 'custom' ? 'CUSTOM' : event.type === 'refinance' ? 'INHERIT' : event.type === 'sale' ? 'SOLD' : event.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Custom Event Color Picker */}
            {event.type === 'custom' && (
              <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Event Color</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customEventColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCustomColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        customColor === color
                          ? 'border-slate-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-blue-500'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

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
                  {event.type === 'purchase' ? 'Settlement Date *' :
                   event.type === 'sale' ? 'Contract Date *' : 'Date *'}
                  {(event.type === 'purchase' || event.type === 'sale') && (
                    <div
                      className="relative"
                      onMouseEnter={() => setShowDateTooltip(true)}
                      onMouseLeave={() => setShowDateTooltip(false)}
                    >
                      <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />

                      {showDateTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl text-sm min-w-[280px] max-w-[320px] z-50 pointer-events-none border-2 border-blue-500/30"
                        >
                          <div className="font-semibold mb-1.5 text-blue-300">
                            {event.type === 'purchase' ? 'Settlement Date' : 'Contract Date'}
                          </div>
                          <p className="text-slate-200 leading-relaxed">
                            {event.type === 'purchase'
                              ? 'The date when ownership legally transferred to you'
                              : 'The date when the sale contract was signed (not settlement date)'}
                          </p>

                          {/* Arrow pointing up */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-slate-900 dark:border-b-slate-800" />
                        </motion.div>
                      )}
                    </div>
                  )}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Purchase status checkboxes (for purchase events only) */}
              {event.type === 'purchase' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set initial property status after purchase:
                  </p>

                  {/* Move in on same day checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <input
                      type="checkbox"
                      id="moveInOnSameDay"
                      checked={moveInOnSameDay}
                      onChange={(e) => {
                        setMoveInOnSameDay(e.target.checked);
                        if (e.target.checked) {
                          setPurchaseAsVacant(false);
                          setPurchaseAsRent(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="moveInOnSameDay"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Home className="w-4 h-4" />
                      Move in on same day (Main Residence)
                    </label>
                  </div>

                  {/* Purchase as vacant checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <input
                      type="checkbox"
                      id="purchaseAsVacant"
                      checked={purchaseAsVacant}
                      onChange={(e) => {
                        setPurchaseAsVacant(e.target.checked);
                        if (e.target.checked) {
                          setMoveInOnSameDay(false);
                          setPurchaseAsRent(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="purchaseAsVacant"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      Purchase as vacant
                    </label>
                  </div>

                  {/* Purchase as rent checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input
                      type="checkbox"
                      id="purchaseAsRent"
                      checked={purchaseAsRent}
                      onChange={(e) => {
                        setPurchaseAsRent(e.target.checked);
                        if (e.target.checked) {
                          setMoveInOnSameDay(false);
                          setPurchaseAsVacant(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="purchaseAsRent"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      Purchase as rental/investment
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Details Section - Only for specific event types (not purchase or sale) */}
            {event.type !== 'purchase' &&
             event.type !== 'move_in' &&
             event.type !== 'move_out' &&
             event.type !== 'rent_start' &&
             event.type !== 'rent_end' &&
             event.type !== 'sale' &&
             event.type !== 'living_in_rental_start' &&
             event.type !== 'living_in_rental_end' && (
              <div className="space-y-4 pt-2">
                {/* Single Amount Input */}
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
              </div>
            )}

            {/* Cost Base Section (for CGT calculation) - NEW COMPONENT */}
            {(event.type === 'purchase' || event.type === 'sale' || event.type === 'improvement' || event.type === 'status_change' || event.type === 'refinance' || event.type === 'custom') && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <CostBaseSelector
                  eventType={event.type}
                  costBases={costBases}
                  onChange={setCostBases}
                />
              </div>
            )}

            {/* Rent End Event - Status Options */}
            {event.type === 'rent_end' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set property status after rent ends:
                  </p>

                  {/* Rent end as vacant checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <input
                      type="checkbox"
                      id="rentEndAsVacant"
                      checked={rentEndAsVacant}
                      onChange={(e) => {
                        setRentEndAsVacant(e.target.checked);
                        if (e.target.checked) {
                          setRentEndAsMoveIn(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="rentEndAsVacant"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      Rent end as vacant
                    </label>
                  </div>

                  {/* Rent end as move in checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <input
                      type="checkbox"
                      id="rentEndAsMoveIn"
                      checked={rentEndAsMoveIn}
                      onChange={(e) => {
                        setRentEndAsMoveIn(e.target.checked);
                        if (e.target.checked) {
                          setRentEndAsVacant(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="rentEndAsMoveIn"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Home className="w-4 h-4" />
                      Rent end as move in (owner returns)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Move Out Event - Status Options & Market Valuation */}
            {event.type === 'move_out' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                {/* Move out status checkboxes */}
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set property status after move-out:
                  </p>

                  {/* Move out as vacant checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <input
                      type="checkbox"
                      id="moveOutAsVacant"
                      checked={moveOutAsVacant}
                      onChange={(e) => {
                        setMoveOutAsVacant(e.target.checked);
                        if (e.target.checked) {
                          setMoveOutAsRent(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="moveOutAsVacant"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      Move out as vacant
                    </label>
                  </div>

                  {/* Move out as rent start checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input
                      type="checkbox"
                      id="moveOutAsRent"
                      checked={moveOutAsRent}
                      onChange={(e) => {
                        setMoveOutAsRent(e.target.checked);
                        if (e.target.checked) {
                          setMoveOutAsVacant(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="moveOutAsRent"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      Move out as rental/investment
                    </label>
                  </div>
                </div>

                {/* Market Valuation Section */}
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

            {/* Status Change Dropdown (for status_change events) */}
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

            {/* Custom Event Status Change Option */}
            {event.type === 'custom' && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Status Change</h3>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="affectsStatus"
                    checked={affectsStatus}
                    onChange={(e) => {
                      setAffectsStatus(e.target.checked);
                      if (!e.target.checked) setNewStatus('');
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="affectsStatus" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    This event changes property status
                  </label>
                </div>

                {affectsStatus && (
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
                      <option value="">Select new status...</option>
                      <option value="ppr">Main Residence (PPR)</option>
                      <option value="rental">Rental/Investment</option>
                      <option value="vacant">Vacant</option>
                      <option value="construction">Under Construction</option>
                    </select>
                  </div>
                )}
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

      {/* Cost Base Summary Modal */}
      <CostBaseSummaryModal
        event={{ ...event, costBases }}
        propertyAddress={propertyName}
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
      />
    </AnimatePresence>
  );
}
