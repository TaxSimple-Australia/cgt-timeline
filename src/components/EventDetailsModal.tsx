'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEvent, PropertyStatus, useTimelineStore, CostBaseItem } from '@/store/timeline';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, Home, Tag, FileText, CheckCircle, CheckCircle2, Receipt, Info, Star, Palette, Building2, Key, AlertCircle, Briefcase, TrendingUp, Package, Hammer, Gift, MapPin, ChevronDown, Square, Maximize2, Percent, Plus, Layers, Lock, Unlock, Trash2 } from 'lucide-react';
import CostBaseSelector from './CostBaseSelector';
import { getCostBaseDefinition } from '@/lib/cost-base-definitions';
import CostBaseSummaryModal from './CostBaseSummaryModal';
import { parseDateFlexible, formatDateDisplay, isValidDateRange, DATE_FORMAT_PLACEHOLDER } from '@/lib/date-utils';
import { cn, formatCurrency } from '@/lib/utils';
import { showWarning, showError } from '@/lib/toast-helpers';
import ConfirmDialog from './ConfirmDialog';

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

// Event type options with their default colors and labels
const eventTypeOptions = [
  { type: 'purchase' as const, label: 'Purchase', color: '#3B82F6' },
  { type: 'sale' as const, label: 'Sold', color: '#8B5CF6' },
  { type: 'move_in' as const, label: 'Move In', color: '#10B981' },
  { type: 'move_out' as const, label: 'Move Out', color: '#EF4444' },
  { type: 'rent_start' as const, label: 'Start Rent', color: '#F59E0B' },
  { type: 'rent_end' as const, label: 'End Rent', color: '#F97316' },
  { type: 'improvement' as const, label: 'Improvement', color: '#06B6D4' },
  { type: 'building_start' as const, label: 'Building Start', color: '#F97316' },
  { type: 'building_end' as const, label: 'Building End', color: '#FB923C' },
  { type: 'refinance' as const, label: 'Inherit', color: '#6366F1' },
  { type: 'status_change' as const, label: 'Status Change', color: '#A855F7' },
  { type: 'subdivision' as const, label: 'Subdivision', color: '#EC4899' },
  { type: 'custom' as const, label: 'Custom Event', color: '#6B7280' },
];

interface EventDetailsModalProps {
  event: TimelineEvent;
  onClose: () => void;
  propertyName: string;
}

export default function EventDetailsModal({ event, onClose, propertyName }: EventDetailsModalProps) {
  const { updateEvent, deleteEvent, addEvent, events, properties, updateProperty, removeLotFromSubdivision } = useTimelineStore();

  // Check if this is a synthetic "Not Sold" status marker
  const isSyntheticNotSold = (event as any).isSyntheticStatusMarker === true;

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(format(event.date, 'yyyy-MM-dd'));
  const [dateInput, setDateInput] = useState(format(event.date, 'dd/MM/yyyy')); // User-friendly display format
  const [parsedDate, setParsedDate] = useState<Date | null>(event.date);
  const [dateError, setDateError] = useState('');
  const [amount, setAmount] = useState(event.amount?.toString() || '');
  // Don't prefill description for synthetic "Not Sold" markers
  const [description, setDescription] = useState(() => {
    if (isSyntheticNotSold) {
      return '';
    }
    return event.description || '';
  });
  const [newStatus, setNewStatus] = useState<PropertyStatus | ''>(event.newStatus || '');
  const [eventType, setEventType] = useState(event.type);

  // Refs for date pickers
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const appreciationDateInputRef = React.useRef<HTMLInputElement>(null);
  const mixedUseMoveInDateRef = React.useRef<HTMLInputElement>(null);
  const rentalUseStartDateRef = React.useRef<HTMLInputElement>(null);
  const businessUseStartDateRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [showMarketValuationTooltip, setShowMarketValuationTooltip] = useState(false);
  const [showExcludedForeignResidentTooltip, setShowExcludedForeignResidentTooltip] = useState(false);

  // Custom event specific state
  const [customColor, setCustomColor] = useState(event.color || '#6B7280');
  const [affectsStatus, setAffectsStatus] = useState(event.affectsStatus || false);

  // Move in on same day checkbox (for purchase events)
  // Track original purchase date to handle date changes properly
  const [originalPurchaseDate] = useState(event.date);

  const [moveInOnSameDay, setMoveInOnSameDay] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.moveInOnSameDay !== undefined) {
      return event.checkboxState.moveInOnSameDay;
    }
    // Fallback: Check if a move_in event already exists on the same date as this purchase
    if (event.type === 'purchase') {
      const purchaseDate = event.date.getTime();
      const existingMoveIn = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'move_in' &&
          e.date.getTime() === purchaseDate
      );
      return !!existingMoveIn;
    }
    return false;
  });
  const [purchaseAsVacant, setPurchaseAsVacant] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.purchaseAsVacant !== undefined) {
      return event.checkboxState.purchaseAsVacant;
    }
    // Fallback: Check if a status_change (vacant) event exists on the same date as this purchase
    if (event.type === 'purchase') {
      const purchaseDate = event.date.getTime();
      const existingVacant = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'status_change' &&
          e.newStatus === 'vacant' &&
          e.date.getTime() === purchaseDate
      );
      return !!existingVacant;
    }
    return false;
  });
  const [purchaseAsRent, setPurchaseAsRent] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.purchaseAsRent !== undefined) {
      return event.checkboxState.purchaseAsRent;
    }
    // Fallback: Check if a rent_start event exists on the same date as this purchase
    if (event.type === 'purchase') {
      const purchaseDate = event.date.getTime();
      const existingRent = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'rent_start' &&
          e.date.getTime() === purchaseDate
      );
      return !!existingRent;
    }
    return false;
  });
  const [overTwoHectares, setOverTwoHectares] = useState(event.overTwoHectares || false);
  const [isLandOnly, setIsLandOnly] = useState(event.isLandOnly || false);
  const [hectares, setHectares] = useState<number | ''>(event.hectares || '');

  // Property details section (collapsible) - auto-expand if any options are set
  const [showPropertyDetails, setShowPropertyDetails] = useState(
    event.isLandOnly || event.overTwoHectares || false
  );

  // Delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lot deletion state (for subdivision events)
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);

  // Move out status checkboxes (for move_out events)
  const [moveOutAsVacant, setMoveOutAsVacant] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.moveOutAsVacant !== undefined) {
      return event.checkboxState.moveOutAsVacant;
    }
    // Fallback: Check if a status_change (vacant) event exists on the same date as this move_out
    if (event.type === 'move_out') {
      const moveOutDate = event.date.getTime();
      const existingVacant = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'status_change' &&
          e.newStatus === 'vacant' &&
          e.date.getTime() === moveOutDate
      );
      return !!existingVacant;
    }
    return false;
  });
  const [moveOutAsRent, setMoveOutAsRent] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.moveOutAsRent !== undefined) {
      return event.checkboxState.moveOutAsRent;
    }
    // Fallback: Check if a rent_start event exists on the same date as this move_out
    if (event.type === 'move_out') {
      const moveOutDate = event.date.getTime();
      const existingRent = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'rent_start' &&
          e.date.getTime() === moveOutDate
      );
      return !!existingRent;
    }
    return false;
  });

  // Rent end status checkboxes (for rent_end events)
  const [rentEndAsVacant, setRentEndAsVacant] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.rentEndAsVacant !== undefined) {
      return event.checkboxState.rentEndAsVacant;
    }
    // Fallback: Check if a status_change (vacant) event exists on the same date as this rent_end
    if (event.type === 'rent_end') {
      const rentEndDate = event.date.getTime();
      const existingVacant = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'status_change' &&
          e.newStatus === 'vacant' &&
          e.date.getTime() === rentEndDate
      );
      return !!existingVacant;
    }
    return false;
  });
  const [rentEndAsMoveIn, setRentEndAsMoveIn] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.rentEndAsMoveIn !== undefined) {
      return event.checkboxState.rentEndAsMoveIn;
    }
    // Fallback: Check if a move_in event exists on the same date as this rent_end
    if (event.type === 'rent_end') {
      const rentEndDate = event.date.getTime();
      const existingMoveIn = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'move_in' &&
          e.date.getTime() === rentEndDate
      );
      return !!existingMoveIn;
    }
    return false;
  });

  // Sale event - Non-resident status (unchecked = resident by default)
  const [isNonResident, setIsNonResident] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.isNonResident !== undefined) {
      return event.checkboxState.isNonResident;
    }
    // Fallback: check isResident field
    return event.isResident === false;
  });

  // Sale event - Previous year capital losses
  const [previousYearLosses, setPreviousYearLosses] = useState(event.previousYearLosses?.toString() || '');

  // Sale event - Division 40 (Depreciating Assets)
  const [division40Claimed, setDivision40Claimed] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.division40Claimed !== undefined) {
      return event.checkboxState.division40Claimed;
    }
    // Fallback: check if division40Assets exists
    return !!event.division40Assets;
  });
  const [division40Assets, setDivision40Assets] = useState(event.division40Assets?.toString() || '');

  // Sale event - Division 43 (Capital Works)
  const [division43Claimed, setDivision43Claimed] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.division43Claimed !== undefined) {
      return event.checkboxState.division43Claimed;
    }
    // Fallback: check if division43Deductions exists
    return !!event.division43Deductions;
  });
  const [division43Deductions, setDivision43Deductions] = useState(event.division43Deductions?.toString() || '');

  // NEW: Business use / usage splits (Gilbert's contextual approach)
  const [hasBusinessUse, setHasBusinessUse] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.hasBusinessUse !== undefined) {
      return event.checkboxState.hasBusinessUse;
    }
    // Fallback: check if businessUsePercentage exists
    return !!event.businessUsePercentage;
  });
  const [businessUsePercentage, setBusinessUsePercentage] = useState(event.businessUsePercentage?.toString() || '');

  const [hasPartialRental, setHasPartialRental] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.hasPartialRental !== undefined) {
      return event.checkboxState.hasPartialRental;
    }
    // Fallback: check if floorAreaData exists
    return !!event.floorAreaData;
  });
  const [totalFloorArea, setTotalFloorArea] = useState(event.floorAreaData?.total?.toString() || '');
  const [exclusiveRentalArea, setExclusiveRentalArea] = useState(event.floorAreaData?.exclusive?.toString() || '');
  const [sharedArea, setSharedArea] = useState(event.floorAreaData?.shared?.toString() || '');

  // NEW: Mixed-Use checkbox and percentages
  const [purchaseAsMixedUse, setPurchaseAsMixedUse] = useState(() => {
    // First check if checkbox state is persisted
    if (event.checkboxState?.purchaseAsMixedUse !== undefined) {
      return event.checkboxState.purchaseAsMixedUse;
    }
    // Fallback: Initialize as true if any split-use percentages exist
    return !!(event.rentalUsePercentage || event.livingUsePercentage || (event.businessUsePercentage && event.type === 'purchase'));
  });
  const [livingUsePercentage, setLivingUsePercentage] = useState(event.livingUsePercentage?.toString() || '');
  const [rentalUsePercentage, setRentalUsePercentage] = useState(event.rentalUsePercentage?.toString() || '');
  const [mixedBusinessUsePercentage, setMixedBusinessUsePercentage] = useState(
    event.type === 'purchase' && event.businessUsePercentage ? event.businessUsePercentage.toString() : ''
  );

  // Mixed-use start dates
  const [rentalUseStartDateInput, setRentalUseStartDateInput] = useState(
    event.rentalUseStartDate ? format(event.rentalUseStartDate, 'dd/MM/yyyy') : ''
  );
  const [parsedRentalUseStartDate, setParsedRentalUseStartDate] = useState<Date | null>(
    event.rentalUseStartDate || null
  );
  const [rentalUseDateError, setRentalUseDateError] = useState('');

  const [businessUseStartDateInput, setBusinessUseStartDateInput] = useState(
    event.businessUseStartDate ? format(event.businessUseStartDate, 'dd/MM/yyyy') : ''
  );
  const [parsedBusinessUseStartDate, setParsedBusinessUseStartDate] = useState<Date | null>(
    event.businessUseStartDate || null
  );
  const [businessUseDateError, setBusinessUseDateError] = useState('');

  // Mixed-Use move-in date (for when user has living percentage but doesn't move in on purchase day)
  const [mixedUseMoveInDateInput, setMixedUseMoveInDateInput] = useState(
    event.mixedUseMoveInDate ? format(event.mixedUseMoveInDate, 'dd/MM/yyyy') : ''
  );
  const [parsedMixedUseMoveInDate, setParsedMixedUseMoveInDate] = useState<Date | null>(
    event.mixedUseMoveInDate || null
  );
  const [mixedUseMoveInDateError, setMixedUseMoveInDateError] = useState('');

  // NEW: Ownership change state variables
  const [leavingOwners, setLeavingOwners] = useState<string[]>(event.leavingOwners || []);
  const [newOwners, setNewOwners] = useState<Array<{name: string; percentage: number}>>(
    event.newOwners || []
  );
  const [ownershipChangeReason, setOwnershipChangeReason] = useState(event.ownershipChangeReason || 'sale_transfer');
  const [ownershipChangeReasonOther, setOwnershipChangeReasonOther] = useState(event.ownershipChangeReasonOther || '');

  // Inherit event - Excluded foreign resident status
  const [excludedForeignResident, setExcludedForeignResident] = useState(() => {
    // Check if checkbox state is persisted
    if (event.checkboxState?.excludedForeignResident !== undefined) {
      return event.checkboxState.excludedForeignResident;
    }
    return false;
  });

  // Track original checkbox states to detect changes (fixes duplicate companion event bug)
  // This captures the checkbox state when modal OPENS, not when it re-renders
  const originalCheckboxState = useMemo(() => {
    if (event?.checkboxState) {
      return { ...event.checkboxState };
    }
    // Return the derived initial states for events without persisted checkboxState
    return {
      moveInOnSameDay,
      purchaseAsVacant,
      purchaseAsRent,
      purchaseAsMixedUse,
      moveOutAsVacant,
      moveOutAsRent,
      rentEndAsVacant,
      rentEndAsMoveIn,
      hasBusinessUse,
      hasPartialRental,
      isNonResident,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]); // Only recalculate when event ID changes (new modal)

  // Get current property (used for partial rental floor area)
  const currentProperty = properties.find(p => p.id === event.propertyId);

  // NEW: Check if property has move_in events (for conditional floor area display)
  const propertyHasMoveIn = events.some(
    e => e.propertyId === event.propertyId && e.type === 'move_in'
  );

  // Appreciation / Future Value fields (for Not Sold markers)
  const [appreciationValue, setAppreciationValue] = useState(event.appreciationValue?.toString() || '');
  const [appreciationDate, setAppreciationDate] = useState(
    event.appreciationDate ? format(event.appreciationDate, 'yyyy-MM-dd') : ''
  );
  const [appreciationDateInput, setAppreciationDateInput] = useState(
    event.appreciationDate ? format(event.appreciationDate, 'dd/MM/yyyy') : ''
  );
  const [parsedAppreciationDate, setParsedAppreciationDate] = useState<Date | null>(event.appreciationDate || null);
  const [appreciationDateError, setAppreciationDateError] = useState('');

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

  // Subdivision lot editing state
  type SizeUnit = 'acres' | 'hectares' | 'sqms';
  interface LotEditState {
    lotNumber: string;
    lotSize: number; // stored in sqm
    sizeUnit: SizeUnit;
    address: string;
    allocationPercentage: number; // editable percentage
    isPercentageLocked: boolean; // true when manually edited (prevents auto-recalculation)
  }

  // Get lot properties from subdivision event
  const subdivisionLots = useMemo(() => {
    if (event.type !== 'subdivision' || !event.subdivisionDetails?.parentPropertyId) {
      return [];
    }
    // Find all child properties of this subdivision
    return properties.filter(
      p => p.parentPropertyId === event.subdivisionDetails?.parentPropertyId &&
           p.subdivisionGroup
    ).sort((a, b) => {
      // Sort by lot number, with Lot 1 (main continuation) first
      if (a.isMainLotContinuation) return -1;
      if (b.isMainLotContinuation) return 1;
      return (a.lotNumber || '').localeCompare(b.lotNumber || '');
    });
  }, [event, properties]);

  // Initialize lot edits from existing property data
  const [lotEdits, setLotEdits] = useState<Record<string, LotEditState>>(() => {
    const initial: Record<string, LotEditState> = {};
    subdivisionLots.forEach(lot => {
      initial[lot.id] = {
        lotNumber: lot.lotNumber || '',
        lotSize: lot.lotSize || 0,
        sizeUnit: 'hectares' as SizeUnit, // Default to hectares for display
        address: lot.address || '',
        allocationPercentage: lot.allocationPercentage || 0,
        isPercentageLocked: lot.allocationPercentage !== undefined && lot.allocationPercentage > 0, // Lock if already has a percentage
      };
    });
    return initial;
  });

  // Unit conversion helpers for lot size
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
    if (unit === 'sqms') return 'sqm';
    if (unit === 'hectares') return 'ha';
    return 'acres';
  };

  const getUnitStep = (unit: SizeUnit): string => {
    if (unit === 'sqms') return '1';
    if (unit === 'hectares') return '0.0001';
    return '0.001';
  };

  // Calculate allocated cost base for a lot
  const calculateLotCostBase = (lotId: string): number => {
    const lot = subdivisionLots.find(l => l.id === lotId);
    if (!lot || !lot.parentPropertyId) return 0;

    const parent = properties.find(p => p.id === lot.parentPropertyId);
    if (!parent || !parent.purchasePrice) return 0;

    const edited = lotEdits[lotId];
    let proportion: number;

    // Use manually entered percentage if locked, otherwise calculate from lot sizes
    if (edited?.isPercentageLocked && edited.allocationPercentage > 0) {
      proportion = edited.allocationPercentage / 100;
    } else {
      // Get lot sizes from either edited state or original property
      const getLotSize = (l: typeof lot): number => {
        const ed = lotEdits[l.id];
        return ed?.lotSize || l.lotSize || 0;
      };

      const totalLotSize = subdivisionLots.reduce((sum, l) => sum + getLotSize(l), 0);
      if (totalLotSize === 0) return 0;

      const currentLotSize = getLotSize(lot);
      proportion = currentLotSize / totalLotSize;
    }

    // Include subdivision fees if available
    const fees = event.subdivisionDetails;
    const totalFees = (fees?.surveyorFees || 0) + (fees?.planningFees || 0) +
                     (fees?.legalFees || 0) + (fees?.titleFees || 0);
    const feePerLot = subdivisionLots.length > 0 ? totalFees / subdivisionLots.length : 0;

    return parent.purchasePrice * proportion + feePerLot;
  };

  // Date input handler with flexible parsing
  const handleDateChange = (value: string) => {
    setDateInput(value);

    if (!value.trim()) {
      setDateError('Date is required');
      setParsedDate(null);
      return;
    }

    const parsed = parseDateFlexible(value);

    if (!parsed) {
      setDateError('Invalid date format. Try: 15/01/2023, 15 Jan 2023, or 2023-01-15');
      setParsedDate(null);
      return;
    }

    const validation = isValidDateRange(parsed);
    if (!validation.valid) {
      setDateError(validation.error || 'Invalid date');
      setParsedDate(null);
      return;
    }

    // Success - update all date states
    setDateError('');
    setParsedDate(parsed);
    setDate(format(parsed, 'yyyy-MM-dd')); // Keep old format for backward compatibility
  };

  // Appreciation date handler
  const handleAppreciationDateChange = (value: string) => {
    setAppreciationDateInput(value);

    if (!value.trim()) {
      setAppreciationDateError('');
      setParsedAppreciationDate(null);
      setAppreciationDate('');
      return;
    }

    const parsed = parseDateFlexible(value);

    if (!parsed) {
      setAppreciationDateError('Invalid date format. Try: 15/01/2023, 15 Jan 2023, or 2023-01-15');
      setParsedAppreciationDate(null);
      return;
    }

    const validation = isValidDateRange(parsed);
    if (!validation.valid) {
      setAppreciationDateError(validation.error || 'Invalid date');
      setParsedAppreciationDate(null);
      return;
    }

    // Success
    setAppreciationDateError('');
    setParsedAppreciationDate(parsed);
    setAppreciationDate(format(parsed, 'yyyy-MM-dd'));
  };

  const handleSave = () => {
    try {
      // Validate date before saving
      if (dateError || !parsedDate) {
        showWarning('Invalid Date', 'Please fix the date error before saving');
        return;
      }

      // Cost base is optional - users can add it later if needed
      // Removed validation block that was preventing improvement events without cost base

      setIsSaving(true);

      const updates: Partial<TimelineEvent> = {
        title: title.trim(),
        date: parsedDate, // Use the validated parsed date
      };

      // Handle event type change
      if (eventType !== event.type) {
        updates.type = eventType;
        // Update color to match new event type (unless it's custom and user has chosen a color)
        const defaultColor = eventTypeOptions.find(opt => opt.type === eventType)?.color;
        if (defaultColor) {
          updates.color = defaultColor;
        }
        // Update title to match new event type default if title hasn't been customized
        const eventTypeLabel = eventTypeOptions.find(opt => opt.type === eventType)?.label;
        if (eventTypeLabel && !title.trim()) {
          updates.title = eventTypeLabel;
        }
      }

      // Handle custom color (for custom events or if color was changed)
      if (eventType === 'custom' || event.type === 'custom') {
        updates.color = customColor;
      }

      // Handle price/amount calculation
      if (event.type === 'purchase') {
        // For purchase events, extract purchase price from costBases (not sum of all cost bases)
        // This prevents double-counting of stamp duty, legal fees, etc. which are sent separately
        const purchasePriceItem = costBases.find(cb => cb.definitionId === 'purchase_price');
        updates.amount = purchasePriceItem?.amount || undefined;

        // Clear legacy land/building prices
        updates.landPrice = undefined;
        updates.buildingPrice = undefined;

        // Over 2 hectares flag (for main residence exemption calculation)
        updates.overTwoHectares = overTwoHectares || undefined;

        // Exact hectares value (when over 2 hectares is checked)
        updates.hectares = overTwoHectares && hectares ? hectares : undefined;

        // Land only flag (affects depreciation calculations)
        updates.isLandOnly = isLandOnly || undefined;
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

        // Australian resident status for CGT (isNonResident checked = non-resident)
        updates.isResident = !isNonResident;

        // Previous year capital losses
        if (previousYearLosses && !isNaN(parseFloat(previousYearLosses))) {
          updates.previousYearLosses = parseFloat(previousYearLosses);
        } else {
          updates.previousYearLosses = undefined;
        }

        // Division 40 - Depreciating Assets
        if (division40Assets && !isNaN(parseFloat(division40Assets))) {
          updates.division40Assets = parseFloat(division40Assets);
        } else {
          updates.division40Assets = undefined;
        }

        // Division 43 - Capital Works
        if (division43Deductions && !isNaN(parseFloat(division43Deductions))) {
          updates.division43Deductions = parseFloat(division43Deductions);
        } else {
          updates.division43Deductions = undefined;
        }
      } else if (event.type === 'improvement') {
        // For improvement events, always calculate from cost bases (validation ensures at least one exists)
        const totalCostBases = costBases.reduce((sum, cb) => sum + cb.amount, 0);
        updates.amount = totalCostBases;
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

      // Handle description for sale events
      let finalDescription = description.trim();

      // For sale events, append Division 40 and Division 43 information to notes
      if (event.type === 'sale') {
        // Remove existing Division 40/43 notes first to avoid duplicates
        finalDescription = finalDescription.replace(/\n*Division 40 Depreciating Assets: \$[\d,.]+/g, '');
        finalDescription = finalDescription.replace(/\n*Division 43 Capital Works Deductions: \$[\d,.]+/g, '');

        // Add Division 40 note if claimed and has value
        if (division40Claimed && division40Assets && !isNaN(parseFloat(division40Assets))) {
          const div40Amount = parseFloat(division40Assets);
          const div40Note = `\n\nDivision 40 Depreciating Assets: $${div40Amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          finalDescription = finalDescription.trim() + div40Note;
        }

        // Add Division 43 note if claimed and has value
        if (division43Claimed && division43Deductions && !isNaN(parseFloat(division43Deductions))) {
          const div43Amount = parseFloat(division43Deductions);
          const div43Note = `\n\nDivision 43 Capital Works Deductions: $${div43Amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          finalDescription = finalDescription.trim() + div43Note;
        }
      }

      // Only include description if not empty
      if (finalDescription) {
        updates.description = finalDescription;
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

      // NEW: Business use / usage splits (Gilbert's contextual approach)
      if (hasBusinessUse && businessUsePercentage && !isNaN(parseFloat(businessUsePercentage))) {
        updates.businessUsePercentage = parseFloat(businessUsePercentage);
      } else {
        updates.businessUsePercentage = undefined;
      }

      if (hasPartialRental && totalFloorArea && exclusiveRentalArea && sharedArea) {
        const total = parseFloat(totalFloorArea);
        const exclusive = parseFloat(exclusiveRentalArea);
        const shared = parseFloat(sharedArea);
        if (!isNaN(total) && !isNaN(exclusive) && !isNaN(shared) && total > 0) {
          updates.floorAreaData = { total, exclusive, shared };
        } else {
          updates.floorAreaData = undefined;
        }
      } else {
        updates.floorAreaData = undefined;
      }

      // NEW: Mixed-Use split percentages
      if (purchaseAsMixedUse) {
        const living = parseFloat(livingUsePercentage) || 0;
        const rental = parseFloat(rentalUsePercentage) || 0;
        const business = parseFloat(mixedBusinessUsePercentage) || 0;
        const total = living + rental + business;

        // Validate that total equals 100% before saving
        if (total !== 100) {
          showWarning(
            'Invalid percentages',
            `Mixed-Use percentages must total 100%. Current total: ${total.toFixed(1)}%`
          );
          setIsSaving(false);
          return;
        }

        // Save the percentages
        updates.livingUsePercentage = living > 0 ? living : undefined;
        updates.rentalUsePercentage = rental > 0 ? rental : undefined;
        updates.businessUsePercentage = business > 0 ? business : undefined;

        // Save the start dates
        updates.rentalUseStartDate = rental > 0 ? parsedRentalUseStartDate || undefined : undefined;
        updates.businessUseStartDate = business > 0 ? parsedBusinessUseStartDate || undefined : undefined;

        // Save the mixed-use move-in date (only if living % > 0 and NOT moving in same day)
        if (living > 0 && !moveInOnSameDay && parsedMixedUseMoveInDate) {
          updates.mixedUseMoveInDate = parsedMixedUseMoveInDate;
        } else {
          updates.mixedUseMoveInDate = undefined;
        }
      } else {
        // Clear mixed-use percentages if checkbox is not checked
        // Only clear if not set via the other business use checkbox
        if (!hasBusinessUse) {
          updates.businessUsePercentage = undefined;
        }
        updates.livingUsePercentage = undefined;
        updates.rentalUsePercentage = undefined;
        updates.rentalUseStartDate = undefined;
        updates.businessUseStartDate = undefined;
        updates.mixedUseMoveInDate = undefined;
      }

      // NEW: Ownership Change validation and data (including Inherit events)
      if (eventType === 'ownership_change' || eventType === 'refinance') {
        // Validate that at least one leaving owner is selected
        if (!leavingOwners || leavingOwners.length === 0) {
          showWarning('Missing information', 'Please select at least one leaving owner.');
          setIsSaving(false);
          return;
        }

        // Validate that at least one new owner is added
        if (!newOwners || newOwners.length === 0) {
          showWarning('Missing information', 'Please add at least one new owner.');
          setIsSaving(false);
          return;
        }

        // Validate that all new owners have names
        const hasEmptyNames = newOwners.some(owner => !owner.name.trim());
        if (hasEmptyNames) {
          showWarning('Missing information', 'Please enter names for all new owners.');
          setIsSaving(false);
          return;
        }

        // Calculate total percentage of leaving owners
        const leavingOwnersTotal = currentProperty?.owners
          ?.filter(owner => leavingOwners.includes(owner.name))
          .reduce((sum, owner) => sum + owner.percentage, 0) || 0;

        // Validate that new owners' percentages equal the leaving owners' total
        const totalPercentage = newOwners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
        if (Math.abs(totalPercentage - leavingOwnersTotal) > 0.1) {
          showWarning(
            'Invalid percentages',
            `New owners' percentages must equal ${leavingOwnersTotal}% (the leaving owners' total). Current total: ${totalPercentage.toFixed(1)}%`
          );
          setIsSaving(false);
          return;
        }

        // Validate that if reason is "other", reasonOther is provided (only for ownership_change, not inherit)
        if (eventType === 'ownership_change') {
          if (ownershipChangeReason === 'other' && !ownershipChangeReasonOther.trim()) {
            showWarning('Missing information', 'Please specify the reason for ownership change.');
            setIsSaving(false);
            return;
          }
        }

        // Save ownership change data
        updates.leavingOwners = leavingOwners;
        updates.newOwners = newOwners;
        // Capture previousOwners snapshot ONLY on first save (preserve on re-saves)
        if (!event.previousOwners) {
          updates.previousOwners = currentProperty?.owners
            ? currentProperty.owners.map(o => ({ name: o.name, percentage: o.percentage }))
            : [];
        }
        // Only save reason for ownership_change events, not inherit (refinance)
        if (eventType === 'ownership_change') {
          updates.ownershipChangeReason = ownershipChangeReason;
          updates.ownershipChangeReasonOther = ownershipChangeReason === 'other' ? ownershipChangeReasonOther.trim() : undefined;
        }
      }

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

      // Appreciation / Future Value fields (for Not Sold markers)
      if (isSyntheticNotSold) {
        if (appreciationValue && !isNaN(parseFloat(appreciationValue))) {
          updates.appreciationValue = parseFloat(appreciationValue);
        } else {
          updates.appreciationValue = undefined;
        }
        if (appreciationDate) {
          updates.appreciationDate = new Date(appreciationDate);
        } else {
          updates.appreciationDate = undefined;
        }
      }

      // NEW: Persist checkbox states
      updates.checkboxState = {
        moveInOnSameDay,
        purchaseAsVacant,
        purchaseAsRent,
        purchaseAsMixedUse,
        moveOutAsVacant,
        moveOutAsRent,
        rentEndAsVacant,
        rentEndAsMoveIn,
        hasBusinessUse,
        hasPartialRental,
        isNonResident,
        division40Claimed,
        division43Claimed,
        excludedForeignResident,
      };

      console.log('💾 Saving event with checkbox state:', {
        eventId: event.id,
        eventType: event.type,
        moveInOnSameDay,
        checkboxState: updates.checkboxState,
      });

      updateEvent(event.id, updates);

      // Handle "move in on same day" checkbox logic (for purchase events)
      if (event.type === 'purchase') {
        const newPurchaseDate = parsedDate;
        const originalDateTimestamp = originalPurchaseDate.getTime();
        const newDateTimestamp = newPurchaseDate.getTime();
        const dateChanged = originalDateTimestamp !== newDateTimestamp;

        // Find move_in event on the ORIGINAL purchase date (if it exists)
        const oldMoveIn = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'move_in' &&
            e.date.getTime() === originalDateTimestamp
        );

        // Find move_in event on the NEW purchase date
        const newMoveIn = events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === 'move_in' &&
            e.date.getTime() === newDateTimestamp
        );

        if (moveInOnSameDay) {
          // Checkbox is CHECKED - ensure move_in event exists on new date

          // If date changed and there was an old move_in, delete it
          if (dateChanged && oldMoveIn) {
            deleteEvent(oldMoveIn.id);
          }

          // Create move_in on new date if it doesn't exist
          if (!newMoveIn) {
            addEvent({
              propertyId: event.propertyId,
              type: 'move_in',
              date: newPurchaseDate,
              title: 'Move In',
              position: event.position,
              color: '#10B981',
            });
          }
        } else {
          // Checkbox is UNCHECKED - remove any move_in events
          // Delete old move_in if it exists
          if (oldMoveIn) {
            deleteEvent(oldMoveIn.id);
          }

          // If date changed, also delete move_in on new date (in case it was auto-created)
          if (dateChanged && newMoveIn) {
            deleteEvent(newMoveIn.id);
          }
        }
      }

      // Helper to detect if a checkbox changed from false/undefined to true
      // This prevents creating duplicate companion events on notes-only edits
      const checkboxBecameTrue = (key: keyof typeof originalCheckboxState) => {
        const wasTrue = originalCheckboxState?.[key] === true;
        return !wasTrue;
      };

      // Helper to find companion events using date-only comparison (ignores time precision issues)
      const findCompanion = (type: string, newStatus?: string) => {
        return events.find(
          (e) =>
            e.propertyId === event.propertyId &&
            e.type === type &&
            (newStatus === undefined || e.newStatus === newStatus) &&
            new Date(e.date).toDateString() === parsedDate.toDateString()
        );
      };

      // Handle "purchase as vacant" companion event
      if (event.type === 'purchase') {
        const existingVacant = findCompanion('status_change', 'vacant');

        if (purchaseAsVacant) {
          // Only create if checkbox JUST became true AND no existing companion
          if (checkboxBecameTrue('purchaseAsVacant') && !existingVacant) {
            addEvent({
              propertyId: event.propertyId,
              type: 'status_change',
              date: parsedDate,
              title: 'Status: Vacant',
              newStatus: 'vacant',
              position: event.position,
              color: '#A855F7',
            });
          }
        } else if (originalCheckboxState?.purchaseAsVacant && existingVacant) {
          // Checkbox was unchecked - delete companion
          deleteEvent(existingVacant.id);
        }
      }

      // Handle "purchase as rent" companion event
      if (event.type === 'purchase') {
        const existingRental = findCompanion('rent_start');

        if (purchaseAsRent) {
          if (checkboxBecameTrue('purchaseAsRent') && !existingRental) {
            addEvent({
              propertyId: event.propertyId,
              type: 'rent_start',
              date: parsedDate,
              title: 'Start Rent',
              position: event.position,
              color: '#F59E0B',
            });
          }
        } else if (originalCheckboxState?.purchaseAsRent && existingRental) {
          deleteEvent(existingRental.id);
        }
      }

      // Handle Mixed-Use companion events for purchase
      // This creates appropriate move_in or rent_start events based on living/rental percentages
      if (event.type === 'purchase' && purchaseAsMixedUse) {
        const living = parseFloat(livingUsePercentage) || 0;
        const rental = parseFloat(rentalUsePercentage) || 0;

        // Scenario A: Mixed-Use + Move in on same day - already handled by moveInOnSameDay logic above

        // Scenario B: Mixed-Use + Living % + NOT same day + has move-in date
        // Create move_in event on the specified mixedUseMoveInDate
        if (living > 0 && !moveInOnSameDay && parsedMixedUseMoveInDate) {
          const mixedUseMoveInTimestamp = parsedMixedUseMoveInDate.getTime();

          // Use fresh store state (not stale closure) to check for existing events
          const freshEventsB = useTimelineStore.getState().events;
          const existingMixedUseMoveIn = freshEventsB.find(
            (e) =>
              e.propertyId === event.propertyId &&
              e.type === 'move_in' &&
              e.date.getTime() === mixedUseMoveInTimestamp
          );

          if (!existingMixedUseMoveIn) {
            // Delete any old move_in on a different date that was created by mixed-use
            const oldMoveInDate = event.mixedUseMoveInDate;
            if (oldMoveInDate && oldMoveInDate.getTime() !== mixedUseMoveInTimestamp) {
              const oldMixedUseMoveIn = freshEventsB.find(
                (e) =>
                  e.propertyId === event.propertyId &&
                  e.type === 'move_in' &&
                  e.date.getTime() === oldMoveInDate.getTime()
              );
              if (oldMixedUseMoveIn) {
                deleteEvent(oldMixedUseMoveIn.id);
              }
            }

            addEvent({
              propertyId: event.propertyId,
              type: 'move_in',
              date: parsedMixedUseMoveInDate,
              title: 'Move In',
              position: event.position,
              color: '#10B981',
            });
          }
        }

        // Scenario C: Mixed-Use with only rental % (0% living) and rental % > 0
        // Create rent_start event on purchase date ONLY when no rental start date OR it equals purchase date
        if (living === 0 && rental > 0) {
          const rentalStartOnPurchaseDate = !parsedRentalUseStartDate ||
            parsedRentalUseStartDate.getTime() === parsedDate.getTime();

          if (rentalStartOnPurchaseDate) {
            const existingRentOnPurchase = findCompanion('rent_start');

            // Only create if didn't already exist via purchaseAsRent
            if (!existingRentOnPurchase && checkboxBecameTrue('purchaseAsMixedUse')) {
              addEvent({
                propertyId: event.propertyId,
                type: 'rent_start',
                date: parsedDate,
                title: 'Start Rent',
                position: event.position,
                color: '#F59E0B',
              });
            }
          }
        }

        // Scenario D: Mixed-Use with rental % > 0 AND a specific rental start date different from purchase date
        // Create rent_start event on the specified rentalUseStartDate
        if (rental > 0 && parsedRentalUseStartDate) {
          const rentalUseStartTimestamp = parsedRentalUseStartDate.getTime();
          const purchaseTimestamp = parsedDate.getTime();

          // Only if rental start date is DIFFERENT from purchase date
          if (rentalUseStartTimestamp !== purchaseTimestamp) {
            // Use fresh store state (not stale closure) to check for existing events
            const freshEventsD = useTimelineStore.getState().events;
            const existingRentalUseRentStart = freshEventsD.find(
              (e) =>
                e.propertyId === event.propertyId &&
                e.type === 'rent_start' &&
                e.date.getTime() === rentalUseStartTimestamp
            );

            if (!existingRentalUseRentStart) {
              // Delete any old rent_start on a different date that was created by mixed-use
              const oldRentalStartDate = event.rentalUseStartDate;
              if (oldRentalStartDate && oldRentalStartDate.getTime() !== purchaseTimestamp && oldRentalStartDate.getTime() !== rentalUseStartTimestamp) {
                const oldMixedUseRentStart = freshEventsD.find(
                  (e) =>
                    e.propertyId === event.propertyId &&
                    e.type === 'rent_start' &&
                    e.date.getTime() === oldRentalStartDate.getTime()
                );
                if (oldMixedUseRentStart) {
                  deleteEvent(oldMixedUseRentStart.id);
                }
              }

              addEvent({
                propertyId: event.propertyId,
                type: 'rent_start',
                date: parsedRentalUseStartDate,
                title: 'Start Rent',
                position: event.position,
                color: '#F59E0B',
              });
            }
          }
        }
      }

      // Clean up mixed-use move_in companion if Mixed-Use is unchecked or living % becomes 0
      const previousMixedUseMoveInDate = event.mixedUseMoveInDate;
      if (event.type === 'purchase' && originalCheckboxState?.purchaseAsMixedUse && previousMixedUseMoveInDate) {
        const shouldRemoveMixedUseMoveIn =
          !purchaseAsMixedUse || // Mixed-Use was unchecked
          (parseFloat(livingUsePercentage) || 0) === 0 || // Living % is now 0
          moveInOnSameDay; // User now wants to move in same day (handled elsewhere)

        if (shouldRemoveMixedUseMoveIn) {
          const freshEventsCleanupMoveIn = useTimelineStore.getState().events;
          const oldMixedUseMoveIn = freshEventsCleanupMoveIn.find(
            (e) =>
              e.propertyId === event.propertyId &&
              e.type === 'move_in' &&
              e.date.getTime() === previousMixedUseMoveInDate.getTime()
          );
          if (oldMixedUseMoveIn) {
            deleteEvent(oldMixedUseMoveIn.id);
          }
        }
      }

      // Clean up mixed-use rent_start companion if Mixed-Use is unchecked or rental % becomes 0
      const previousRentalUseStartDate = event.rentalUseStartDate;
      if (event.type === 'purchase' && originalCheckboxState?.purchaseAsMixedUse && previousRentalUseStartDate) {
        const purchaseTimestamp = parsedDate.getTime();

        // Only clean up if the rental start date was different from purchase date
        // (rent_start on purchase date is handled by purchaseAsRent logic)
        if (previousRentalUseStartDate.getTime() !== purchaseTimestamp) {
          const shouldRemoveMixedUseRentStart =
            !purchaseAsMixedUse || // Mixed-Use was unchecked
            (parseFloat(rentalUsePercentage) || 0) === 0; // Rental % is now 0

          if (shouldRemoveMixedUseRentStart) {
            const freshEventsCleanupRent = useTimelineStore.getState().events;
            const oldMixedUseRentStart = freshEventsCleanupRent.find(
              (e) =>
                e.propertyId === event.propertyId &&
                e.type === 'rent_start' &&
                e.date.getTime() === previousRentalUseStartDate.getTime()
            );
            if (oldMixedUseRentStart) {
              deleteEvent(oldMixedUseRentStart.id);
            }
          }
        }
      }

      // Handle "move out as vacant" companion event
      if (event.type === 'move_out') {
        const existingVacant = findCompanion('status_change', 'vacant');

        if (moveOutAsVacant) {
          if (checkboxBecameTrue('moveOutAsVacant') && !existingVacant) {
            addEvent({
              propertyId: event.propertyId,
              type: 'status_change',
              date: parsedDate,
              title: 'Status: Vacant',
              newStatus: 'vacant',
              position: event.position,
              color: '#A855F7',
            });
          }
        } else if (originalCheckboxState?.moveOutAsVacant && existingVacant) {
          deleteEvent(existingVacant.id);
        }
      }

      // Handle "move out as rent" companion event
      if (event.type === 'move_out') {
        const existingRent = findCompanion('rent_start');

        if (moveOutAsRent) {
          if (checkboxBecameTrue('moveOutAsRent') && !existingRent) {
            addEvent({
              propertyId: event.propertyId,
              type: 'rent_start',
              date: parsedDate,
              title: 'Start Rent',
              position: event.position,
              color: '#F59E0B',
            });
          }
        } else if (originalCheckboxState?.moveOutAsRent && existingRent) {
          deleteEvent(existingRent.id);
        }
      }

      // Handle "rent end as vacant" companion event
      if (event.type === 'rent_end') {
        const existingVacant = findCompanion('status_change', 'vacant');

        if (rentEndAsVacant) {
          if (checkboxBecameTrue('rentEndAsVacant') && !existingVacant) {
            addEvent({
              propertyId: event.propertyId,
              type: 'status_change',
              date: parsedDate,
              title: 'Status: Vacant',
              newStatus: 'vacant',
              position: event.position,
              color: '#A855F7',
            });
          }
        } else if (originalCheckboxState?.rentEndAsVacant && existingVacant) {
          deleteEvent(existingVacant.id);
        }
      }

      // Handle "rent end as move in" companion event
      if (event.type === 'rent_end') {
        const existingMoveIn = findCompanion('move_in');

        if (rentEndAsMoveIn) {
          if (checkboxBecameTrue('rentEndAsMoveIn') && !existingMoveIn) {
            addEvent({
              propertyId: event.propertyId,
              type: 'move_in',
              date: parsedDate,
              title: 'Move In',
              position: event.position,
              color: '#10B981',
            });
          }
        } else if (originalCheckboxState?.rentEndAsMoveIn && existingMoveIn) {
          deleteEvent(existingMoveIn.id);
        }
      }

      // Auto-update property owners for ownership_change and refinance (inherit) events
      if ((eventType === 'ownership_change' || eventType === 'refinance') && event.propertyId) {
        const currentProperty = properties.find(p => p.id === event.propertyId);
        if (currentProperty) {
          // Create new owners array by filtering out leaving owners and adding new owners
          const updatedOwners = [
            // Keep existing owners that are not leaving
            ...(currentProperty.owners || []).filter(owner => !leavingOwners.includes(owner.name)),
            // Add new owners
            ...newOwners.map(owner => ({
              name: owner.name,
              percentage: owner.percentage
            }))
          ];

          // Update the property with new owners
          updateProperty(event.propertyId, {
            owners: updatedOwners
          });
        }
      }

      // NOTE: Checkbox states are now persisted in checkboxState field
      // No need to reset them after save

      // Save subdivision lot edits
      if (event.type === 'subdivision' && Object.keys(lotEdits).length > 0) {
        subdivisionLots.forEach(lot => {
          const edited = lotEdits[lot.id];
          if (edited) {
            // Only update if values have changed
            const hasChanged =
              edited.lotNumber !== (lot.lotNumber || '') ||
              edited.lotSize !== (lot.lotSize || 0) ||
              edited.address !== (lot.address || '') ||
              (edited.isPercentageLocked && edited.allocationPercentage !== (lot.allocationPercentage || 0));

            if (hasChanged) {
              updateProperty(lot.id, {
                lotNumber: edited.lotNumber.trim() || undefined,
                lotSize: edited.lotSize || undefined,
                address: edited.address.trim() || undefined,
                // Only save allocationPercentage if manually set (locked)
                allocationPercentage: edited.isPercentageLocked ? edited.allocationPercentage : undefined,
              });
            }
          }
        });

        // Also update the subdivisionDetails.childProperties in the event
        const updatedChildProperties = event.subdivisionDetails?.childProperties?.map(child => {
          const edited = lotEdits[child.id];
          if (edited) {
            return {
              ...child,
              lotNumber: edited.lotNumber.trim() || child.lotNumber,
              lotSize: edited.lotSize || child.lotSize,
              allocationPercentage: edited.isPercentageLocked ? edited.allocationPercentage : undefined,
              allocatedCostBase: calculateLotCostBase(child.id),
            };
          }
          return child;
        });

        if (updatedChildProperties) {
          // Determine allocation method based on whether any percentages are locked
          const hasManualPercentages = Object.values(lotEdits).some(l => l.isPercentageLocked);
          updateEvent(event.id, {
            subdivisionDetails: {
              ...event.subdivisionDetails!,
              childProperties: updatedChildProperties,
              allocationMethod: hasManualPercentages ? 'manual' : 'by_lot_size',
            },
          });
        }
      }

      // === SAFETY NET: Ensure mixed-use companion events exist ===
      if (event.type === 'purchase' && purchaseAsMixedUse) {
        const finalLiving = parseFloat(livingUsePercentage) || 0;
        const finalRental = parseFloat(rentalUsePercentage) || 0;
        const finalEvents = useTimelineStore.getState().events;

        // Safety net for move_in companion
        if (finalLiving > 0 && !moveInOnSameDay && parsedMixedUseMoveInDate) {
          const moveInExists = finalEvents.some(
            (e) =>
              e.propertyId === event.propertyId &&
              e.type === 'move_in' &&
              e.date.getTime() === parsedMixedUseMoveInDate.getTime()
          );
          if (!moveInExists) {
            addEvent({
              propertyId: event.propertyId,
              type: 'move_in',
              date: parsedMixedUseMoveInDate,
              title: 'Move In',
              position: event.position,
              color: '#10B981',
            });
          }
        }

        // Safety net for move_in on same day (via mixed-use + moveInOnSameDay)
        if (finalLiving > 0 && moveInOnSameDay) {
          const moveInExists = finalEvents.some(
            (e) =>
              e.propertyId === event.propertyId &&
              e.type === 'move_in' &&
              e.date.getTime() === parsedDate.getTime()
          );
          if (!moveInExists) {
            addEvent({
              propertyId: event.propertyId,
              type: 'move_in',
              date: parsedDate,
              title: 'Move In',
              position: event.position,
              color: '#10B981',
            });
          }
        }

        // Safety net for rent_start companion
        if (finalRental > 0 && parsedRentalUseStartDate) {
          const rentStartExists = finalEvents.some(
            (e) =>
              e.propertyId === event.propertyId &&
              e.type === 'rent_start' &&
              e.date.getTime() === parsedRentalUseStartDate.getTime()
          );
          if (!rentStartExists) {
            addEvent({
              propertyId: event.propertyId,
              type: 'rent_start',
              date: parsedRentalUseStartDate,
              title: 'Start Rent',
              position: event.position,
              color: '#F59E0B',
            });
          }
        }
      }

      // Small delay for visual feedback
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 200);
    } catch (error) {
      console.error('Error saving event:', error);
      setIsSaving(false);
      showError('Save Failed', 'Failed to save changes. Please try again.');
    }
  };

  const handleDelete = () => {
    deleteEvent(event.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Handle deleting a lot from a subdivision event
  const handleDeleteLot = () => {
    if (!lotToDelete) return;

    // Check if this is the last non-Lot-1 lot (revert case)
    const nonLot1Lots = subdivisionLots.filter((l) => !l.isMainLotContinuation);
    const isRevertCase = nonLot1Lots.length === 1 && nonLot1Lots[0].id === lotToDelete;

    removeLotFromSubdivision(lotToDelete, event.id);

    // Clean up lotEdits state
    setLotEdits((prev) => {
      const next = { ...prev };
      delete next[lotToDelete];
      return next;
    });

    setLotToDelete(null);

    // If revert case, the subdivision event no longer exists — close the modal
    if (isRevertCase) {
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
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
        onClick={(e) => {
          // Only close if clicking directly on backdrop, not on children
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
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
            style={{ backgroundColor: `${customColor}15` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: customColor }}
                >
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {eventType === 'sale' && event.title.toLowerCase() === 'sale' ? 'sold' : event.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{propertyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Cost Base Summary Button - Only show for events with cost bases */}
                {(eventType === 'purchase' || eventType === 'sale' || eventType === 'improvement') &&
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
            {/* Event Type Selector */}
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Event Type</span>
              </div>
              <select
                value={eventType}
                onChange={(e) => {
                  const newType = e.target.value as typeof eventType;
                  const newTypeOption = eventTypeOptions.find(opt => opt.type === newType);

                  setEventType(newType);

                  // Auto-update color to match event type (unless it's custom)
                  if (newType !== 'custom' && newTypeOption) {
                    setCustomColor(newTypeOption.color);
                  }

                  // Auto-update title to match new event type (unless user has customized it)
                  const currentTypeLabel = eventTypeOptions.find(opt => opt.type === event.type)?.label;
                  const isCustomTitle = title.trim() && title.trim() !== currentTypeLabel;

                  if (!isCustomTitle && newTypeOption) {
                    setTitle(newTypeOption.label);
                  }

                  // Reset type-specific checkboxes when changing event types
                  if (newType !== event.type) {
                    setMoveInOnSameDay(false);
                    setPurchaseAsVacant(false);
                    setPurchaseAsRent(false);
                    setMoveOutAsVacant(false);
                    setMoveOutAsRent(false);
                    setRentEndAsVacant(false);
                    setRentEndAsMoveIn(false);
                  }
                }}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Land Options - Compact checkboxes for Purchase events */}
              {eventType === 'purchase' && (
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isLandOnly}
                        onChange={(e) => setIsLandOnly(e.target.checked)}
                        className="w-3 h-3 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      Land only
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overTwoHectares}
                        onChange={(e) => {
                          setOverTwoHectares(e.target.checked);
                          if (!e.target.checked) {
                            setHectares('');
                          }
                        }}
                        className="w-3 h-3 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      Over 2 hectares
                    </label>
                  </div>

                  {/* Hectares input field - shows when "Over 2 hectares" is checked */}
                  {overTwoHectares && (
                    <div className="ml-4 flex items-center gap-2">
                      <label htmlFor="hectares-input" className="text-xs text-slate-600 dark:text-slate-400">
                        Exact hectares:
                      </label>
                      <input
                        id="hectares-input"
                        type="number"
                        min="2.01"
                        step="0.01"
                        value={hectares}
                        onChange={(e) => setHectares(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="e.g., 2.5"
                        className="w-24 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">ha</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Event Color Picker */}
            {eventType === 'custom' && (
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
                  {eventType === 'purchase' ? 'Settlement Date *' :
                   eventType === 'sale' ? 'Contract Date *' : 'Date *'}
                  {(eventType === 'purchase' || eventType === 'sale') && (
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
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl text-sm min-w-[280px] max-w-[360px] z-50 pointer-events-none border-2 border-blue-500/30"
                        >
                          <div className="font-semibold mb-1.5 text-blue-300">
                            {eventType === 'purchase' ? 'Settlement Date' : 'Contract Date'}
                          </div>
                          <p className="text-slate-200 leading-relaxed mb-3">
                            {eventType === 'purchase'
                              ? 'The date when ownership legally transferred to you'
                              : 'The date when the sale contract was signed (not settlement date)'}
                          </p>

                          <div className="border-t border-slate-700 pt-2 mt-2">
                            <div className="font-semibold mb-1.5 text-blue-300 text-xs">
                              Accepted Date Formats:
                            </div>
                            <ul className="text-slate-300 text-xs space-y-0.5">
                              <li>• DD/MM/YYYY (15/01/2023)</li>
                              <li>• DD MMM YYYY (15 Jan 2023)</li>
                              <li>• YYYY-MM-DD (2023-01-15)</li>
                              <li>• DD/MM/YY (15/01/23)</li>
                              <li>• Or use the calendar picker →</li>
                            </ul>
                          </div>

                          {/* Arrow pointing up */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-slate-900 dark:border-b-slate-800" />
                        </motion.div>
                      )}
                    </div>
                  )}
                </label>
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    value={dateInput}
                    onChange={(e) => handleDateChange(e.target.value)}
                    placeholder={DATE_FORMAT_PLACEHOLDER}
                    className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      dateError
                        ? 'border-red-500 dark:border-red-500'
                        : parsedDate
                        ? 'border-green-500 dark:border-green-500'
                        : 'border-slate-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                    required
                  />
                  <div
                    className="inline-block cursor-pointer"
                    onClick={() => dateInputRef.current?.showPicker?.()}
                  >
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        if (newDate) {
                          setDate(newDate);
                          const parsed = new Date(newDate);
                          setParsedDate(parsed);
                          setDateInput(format(parsed, 'dd/MM/yyyy'));
                          setDateError('');
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="px-4 py-3 min-w-[44px] border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors">
                      <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                {dateError && (
                  <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 mt-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{dateError}</span>
                  </div>
                )}
                {parsedDate && !dateError && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-1">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{formatDateDisplay(parsedDate)}</span>
                  </div>
                )}
              </div>

              {/* Purchase status checkboxes (for purchase events only) */}
              {eventType === 'purchase' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set initial property status after purchase:
                  </p>

                  {/* Move in on same day checkbox */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <input
                        type="checkbox"
                        id="moveInOnSameDay"
                        checked={moveInOnSameDay}
                        onChange={(e) => {
                          setMoveInOnSameDay(e.target.checked);
                          if (e.target.checked) {
                            // Only clear mutually exclusive options (not Mixed-Use)
                            setPurchaseAsVacant(false);
                            setPurchaseAsRent(false);
                            // Mixed-Use can be combined with Move-In - don't clear it
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
                          setPurchaseAsMixedUse(false);
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

                  {/* Purchase and rent out checkbox */}
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
                          setPurchaseAsMixedUse(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="purchaseAsRent"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      Purchase and rent out (Investment Property)
                    </label>
                  </div>

                  {/* Mixed-Use checkbox */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <input
                        type="checkbox"
                        id="purchaseAsMixedUse"
                        checked={purchaseAsMixedUse}
                        onChange={(e) => {
                          setPurchaseAsMixedUse(e.target.checked);
                          if (e.target.checked) {
                            // Only clear mutually exclusive options (not Move-In)
                            setPurchaseAsVacant(false);
                            setPurchaseAsRent(false);
                            // Move-In can be combined with Mixed-Use - don't clear it
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="purchaseAsMixedUse"
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <Percent className="w-4 h-4" />
                        Mixed-Use (Specify percentages)
                      </label>
                    </div>

                    {/* Percentage inputs - shown when Mixed-Use is checked */}
                    <AnimatePresence>
                      {purchaseAsMixedUse && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-purple-200 dark:border-purple-800 p-4 space-y-4 bg-white dark:bg-slate-800"
                        >
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Specify the percentage of each use type (must total 100%)
                          </p>

                          {/* Living/Owner-occupied percentage */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Living (Owner-occupied) %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={livingUsePercentage}
                              onChange={(e) => setLivingUsePercentage(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 40"
                            />

                            {/* Move-in date for Mixed-Use - only shown if living % > 0 AND "Move in on same day" is NOT checked */}
                            {parseFloat(livingUsePercentage) > 0 && !moveInOnSameDay && (
                              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <label className="block text-xs font-medium text-green-700 dark:text-green-400 mb-1.5">
                                  When did you move in?
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={mixedUseMoveInDateInput}
                                    onChange={(e) => {
                                      const input = e.target.value;
                                      setMixedUseMoveInDateInput(input);

                                      const parsed = parseDateFlexible(input);
                                      if (parsed) {
                                        setParsedMixedUseMoveInDate(parsed);
                                        setMixedUseMoveInDateError('');
                                      } else if (input.trim()) {
                                        setMixedUseMoveInDateError('Invalid date format');
                                        setParsedMixedUseMoveInDate(null);
                                      } else {
                                        setMixedUseMoveInDateError('');
                                        setParsedMixedUseMoveInDate(null);
                                      }
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100",
                                      mixedUseMoveInDateError
                                        ? "border-red-500 focus:ring-red-500"
                                        : "border-slate-300 dark:border-slate-600 focus:ring-blue-500"
                                    )}
                                    placeholder={DATE_FORMAT_PLACEHOLDER}
                                  />
                                  <div
                                    className="inline-block cursor-pointer"
                                    onClick={() => mixedUseMoveInDateRef.current?.showPicker?.()}
                                  >
                                    <input
                                      ref={mixedUseMoveInDateRef}
                                      type="date"
                                      value={parsedMixedUseMoveInDate ? format(parsedMixedUseMoveInDate, 'yyyy-MM-dd') : ''}
                                      onChange={(e) => {
                                        const newDate = e.target.value;
                                        if (newDate) {
                                          const parsed = new Date(newDate);
                                          setMixedUseMoveInDateInput(format(parsed, 'dd/MM/yyyy'));
                                          setParsedMixedUseMoveInDate(parsed);
                                          setMixedUseMoveInDateError('');
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <div className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors">
                                      <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                                {mixedUseMoveInDateError && (
                                  <p className="mt-1 text-xs text-red-500">{mixedUseMoveInDateError}</p>
                                )}
                                {parsedMixedUseMoveInDate && !mixedUseMoveInDateError && (
                                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-1">
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>{formatDateDisplay(parsedMixedUseMoveInDate)}</span>
                                  </div>
                                )}
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  Enter the date you started living in the property (if different from purchase date)
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Rental percentage */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Rental %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={rentalUsePercentage}
                              onChange={(e) => setRentalUsePercentage(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 50"
                            />

                            {/* Rental use start date - only shown if rental % > 0 */}
                            {parseFloat(rentalUsePercentage) > 0 && (
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                  Date rental use started
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={rentalUseStartDateInput}
                                    onChange={(e) => {
                                      const input = e.target.value;
                                      setRentalUseStartDateInput(input);

                                      const parsed = parseDateFlexible(input);
                                      if (parsed) {
                                        setParsedRentalUseStartDate(parsed);
                                        setRentalUseDateError('');
                                      } else if (input.trim()) {
                                        setRentalUseDateError('Invalid date format');
                                        setParsedRentalUseStartDate(null);
                                      } else {
                                        setRentalUseDateError('');
                                        setParsedRentalUseStartDate(null);
                                      }
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100",
                                      rentalUseDateError
                                        ? "border-red-500 focus:ring-red-500"
                                        : "border-slate-300 dark:border-slate-600 focus:ring-blue-500"
                                    )}
                                    placeholder={DATE_FORMAT_PLACEHOLDER}
                                  />
                                  <div
                                    className="inline-block cursor-pointer"
                                    onClick={() => rentalUseStartDateRef.current?.showPicker?.()}
                                  >
                                    <input
                                      ref={rentalUseStartDateRef}
                                      type="date"
                                      value={parsedRentalUseStartDate ? format(parsedRentalUseStartDate, 'yyyy-MM-dd') : ''}
                                      onChange={(e) => {
                                        const newDate = e.target.value;
                                        if (newDate) {
                                          const parsed = new Date(newDate);
                                          setRentalUseStartDateInput(format(parsed, 'dd/MM/yyyy'));
                                          setParsedRentalUseStartDate(parsed);
                                          setRentalUseDateError('');
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <div className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors">
                                      <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                                {rentalUseDateError && (
                                  <p className="mt-1 text-xs text-red-500">{rentalUseDateError}</p>
                                )}
                                {parsedRentalUseStartDate && !rentalUseDateError && (
                                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-1">
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>{formatDateDisplay(parsedRentalUseStartDate)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Business percentage */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Business %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={mixedBusinessUsePercentage}
                              onChange={(e) => setMixedBusinessUsePercentage(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 10"
                            />

                            {/* Business use start date - only shown if business % > 0 */}
                            {parseFloat(mixedBusinessUsePercentage) > 0 && (
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                  Date business use started
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={businessUseStartDateInput}
                                    onChange={(e) => {
                                      const input = e.target.value;
                                      setBusinessUseStartDateInput(input);

                                      const parsed = parseDateFlexible(input);
                                      if (parsed) {
                                        setParsedBusinessUseStartDate(parsed);
                                        setBusinessUseDateError('');
                                      } else if (input.trim()) {
                                        setBusinessUseDateError('Invalid date format');
                                        setParsedBusinessUseStartDate(null);
                                      } else {
                                        setBusinessUseDateError('');
                                        setParsedBusinessUseStartDate(null);
                                      }
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100",
                                      businessUseDateError
                                        ? "border-red-500 focus:ring-red-500"
                                        : "border-slate-300 dark:border-slate-600 focus:ring-blue-500"
                                    )}
                                    placeholder={DATE_FORMAT_PLACEHOLDER}
                                  />
                                  <div
                                    className="inline-block cursor-pointer"
                                    onClick={() => businessUseStartDateRef.current?.showPicker?.()}
                                  >
                                    <input
                                      ref={businessUseStartDateRef}
                                      type="date"
                                      value={parsedBusinessUseStartDate ? format(parsedBusinessUseStartDate, 'yyyy-MM-dd') : ''}
                                      onChange={(e) => {
                                        const newDate = e.target.value;
                                        if (newDate) {
                                          const parsed = new Date(newDate);
                                          setBusinessUseStartDateInput(format(parsed, 'dd/MM/yyyy'));
                                          setParsedBusinessUseStartDate(parsed);
                                          setBusinessUseDateError('');
                                        }
                                      }}
                                      className="sr-only"
                                    />
                                    <div className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors">
                                      <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                                {businessUseDateError && (
                                  <p className="mt-1 text-xs text-red-500">{businessUseDateError}</p>
                                )}
                                {parsedBusinessUseStartDate && !businessUseDateError && (
                                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-1">
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>{formatDateDisplay(parsedBusinessUseStartDate)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Total validation display */}
                          {(() => {
                            const living = parseFloat(livingUsePercentage) || 0;
                            const rental = parseFloat(rentalUsePercentage) || 0;
                            const business = parseFloat(mixedBusinessUsePercentage) || 0;
                            const total = living + rental + business;
                            const isValid = total === 100;
                            const isEmpty = total === 0;

                            if (isEmpty) {
                              return (
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Enter percentages above</span>
                                </div>
                              );
                            }

                            return (
                              <div className={cn(
                                "flex items-center gap-2 text-xs font-medium",
                                isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {isValid ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Total: {total.toFixed(1)}% ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Total: {total.toFixed(1)}% (must equal 100%)</span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              )}
            </div>

            {/* Financial Details Section - Only for specific event types (not purchase, sale, improvements, building start/end, inherit, subdivision, or Not Sold markers) */}
            {!isSyntheticNotSold &&
             eventType !== 'purchase' &&
             eventType !== 'move_in' &&
             eventType !== 'move_out' &&
             eventType !== 'rent_start' &&
             eventType !== 'rent_end' &&
             eventType !== 'sale' &&
             eventType !== 'ownership_change' &&
             eventType !== 'improvement' &&
             eventType !== 'building_start' &&
             eventType !== 'refinance' &&
             eventType !== 'subdivision' && (
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
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cost Base Section (for CGT calculation) - NEW COMPONENT */}
            {/* Hide for synthetic "Not Sold" markers and inherit events */}
            {!isSyntheticNotSold && (eventType === 'purchase' || eventType === 'sale' || eventType === 'improvement' || eventType === 'status_change' || eventType === 'custom') && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <CostBaseSelector
                  eventType={event.type}
                  costBases={costBases}
                  onChange={setCostBases}
                />
              </div>
            )}

            {/* Sale Event - Non-Resident Status */}
            {eventType === 'sale' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <input
                    type="checkbox"
                    id="isNonResident"
                    checked={isNonResident}
                    onChange={(e) => setIsNonResident(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="isNonResident"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Non-Resident
                      </label>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-blue-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          Since 9 May 2012, non-residents cannot claim the 50% CGT discount, and Australian residents may lose the discount for the time they were not an Australian resident.
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isNonResident ? 'Non-resident for tax purposes' : 'Australian resident for tax purposes'}
                    </span>
                  </div>
                </div>

                {/* Previous Year Losses Input */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Previous Year Losses
                    </label>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-blue-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        Enter any capital losses from previous years that can be offset against this capital gain.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                    <input
                      type="number"
                      value={previousYearLosses}
                      onChange={(e) => setPreviousYearLosses(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Capital losses from previous financial years
                  </p>
                </div>

                {/* Tax Deductions Section - Division 40 & 43 */}
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-4">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-3">
                    Tax Deductions
                  </h4>

                  {/* Division 40 - Depreciating Assets */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="division40Claimed"
                        checked={division40Claimed}
                        onChange={(e) => setDivision40Claimed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-purple-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="division40Claimed"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Division 40 - Depreciating Assets claimed
                          </label>
                          <div className="relative group">
                            <Info className="w-4 h-4 text-purple-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <strong>Division 40:</strong> Plant and equipment (appliances, carpets, air conditioning) that were depreciated over their effective life. These are treated as separate CGT assets and NOT included in the property's cost base. At sale, a balancing adjustment is made between sale value and written-down value.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Plant & equipment depreciation (appliances, carpets, etc.)
                        </p>
                      </div>
                    </div>

                    {/* Conditional Division 40 Input Field */}
                    {division40Claimed && (
                      <div className="ml-7 mt-2">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                          <input
                            type="number"
                            value={division40Assets}
                            onChange={(e) => setDivision40Assets(e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-2.5 border border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Total value of depreciating assets
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Division 43 - Capital Works */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="division43Claimed"
                        checked={division43Claimed}
                        onChange={(e) => setDivision43Claimed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-purple-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="division43Claimed"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Division 43 - Capital Works claimed
                          </label>
                          <div className="relative group">
                            <Info className="w-4 h-4 text-purple-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <strong>Division 43:</strong> Construction expenditure deductions for income-producing buildings. Any Division 43 deductions claimed (or claimable) REDUCE the property's cost base for CGT purposes. This increases your capital gain on sale, ensuring you don't receive double tax benefits.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Construction expenditure deductions (reduces cost base)
                        </p>
                      </div>
                    </div>

                    {/* Conditional Division 43 Input Field */}
                    {division43Claimed && (
                      <div className="ml-7 mt-2">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                          <input
                            type="number"
                            value={division43Deductions}
                            onChange={(e) => setDivision43Deductions(e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-2.5 border border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Total Division 43 deductions claimed
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rent End Event - Status Options */}
            {eventType === 'rent_end' && (
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
                      Owner Move back in
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Move Out Event - Status Options */}
            {eventType === 'move_out' && (
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
              </div>
            )}

            {/* Rent Start Event - Market Valuation */}
            {eventType === 'rent_start' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                {/* Market Valuation Section */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Market Valuation
                    <div
                      className="relative"
                      onMouseEnter={() => setShowMarketValuationTooltip(true)}
                      onMouseLeave={() => setShowMarketValuationTooltip(false)}
                    >
                      <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />

                      {showMarketValuationTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl text-sm min-w-[280px] max-w-[320px] z-50 pointer-events-none border-2 border-blue-500/30"
                        >
                          <p className="text-slate-200 leading-relaxed">
                            Market value applies when the main residence is first used to produce income after 20/08/1996.
                          </p>

                          {/* Arrow pointing up */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-slate-900 dark:border-b-slate-800" />
                        </motion.div>
                      )}
                    </div>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The market value of the property when it first started generating rental income (required for CGT purposes)
                  </p>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <DollarSign className="w-4 h-4" />
                      Market Value at First Income Producing Use
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                      <input
                        type="number"
                        value={marketValuation}
                        onChange={(e) => setMarketValuation(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* NEW: Partial rental (Airbnb) floor area inputs - Only show if user lives in property */}
                {propertyHasMoveIn && (
                <div className="space-y-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 mt-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasPartialRental"
                      checked={hasPartialRental}
                      onChange={(e) => setHasPartialRental(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="hasPartialRental"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Renting part of your home? (e.g., Airbnb room)
                    </label>
                  </div>

                  {hasPartialRental && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter floor areas for accurate income-producing percentage calculation
                      </p>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Total floor area (sqm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={totalFloorArea}
                          onChange={(e) => setTotalFloorArea(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 180"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Exclusive rental area (sqm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={exclusiveRentalArea}
                          onChange={(e) => setExclusiveRentalArea(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 18 (bedroom only)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Shared area (sqm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={sharedArea}
                          onChange={(e) => setSharedArea(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 45 (kitchen, bathroom)"
                        />
                      </div>

                      {totalFloorArea && exclusiveRentalArea && sharedArea && (
                        <div className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Calculated income-producing percentage:
                          </p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {(() => {
                              const total = parseFloat(totalFloorArea);
                              const exclusive = parseFloat(exclusiveRentalArea);
                              const shared = parseFloat(sharedArea);
                              if (!isNaN(total) && !isNaN(exclusive) && !isNaN(shared) && total > 0) {
                                const exclusivePercent = (exclusive / total) * 100;
                                const sharedPercent = (shared / total) * 50;
                                const totalPercent = exclusivePercent + sharedPercent;
                                return `${totalPercent.toFixed(2)}%`;
                              }
                              return '0%';
                            })()}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Formula: (Exclusive / Total) + (Shared / Total × 50%)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}
              </div>
            )}

            {/* Appreciation / Future Value Section (for Not Sold markers only) */}
            {isSyntheticNotSold && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Appreciation / Future Value
                </h3>

                {/* Appreciation Value */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Future Value *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                    <input
                      type="number"
                      value={appreciationValue}
                      onChange={(e) => setAppreciationValue(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Appreciation Date */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar className="w-4 h-4" />
                    Valuation Date *
                  </label>
                  <div className="relative flex gap-2">
                    <input
                      type="text"
                      value={appreciationDateInput}
                      onChange={(e) => handleAppreciationDateChange(e.target.value)}
                      placeholder={DATE_FORMAT_PLACEHOLDER}
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        appreciationDateError
                          ? 'border-red-500 dark:border-red-500'
                          : parsedAppreciationDate
                          ? 'border-green-500 dark:border-green-500'
                          : 'border-slate-300 dark:border-slate-600'
                      } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                      required
                    />
                    <div
                      className="inline-block cursor-pointer"
                      onClick={() => appreciationDateInputRef.current?.showPicker?.()}
                    >
                      <input
                        ref={appreciationDateInputRef}
                        type="date"
                        value={appreciationDate}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (newDate) {
                            setAppreciationDate(newDate);
                            const parsed = new Date(newDate);
                            setParsedAppreciationDate(parsed);
                            setAppreciationDateInput(format(parsed, 'dd/MM/yyyy'));
                            setAppreciationDateError('');
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="px-4 py-3 min-w-[44px] border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  {appreciationDateError && (
                    <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 mt-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{appreciationDateError}</span>
                    </div>
                  )}
                  {parsedAppreciationDate && !appreciationDateError && (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-1">
                      <CheckCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDateDisplay(parsedAppreciationDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information Section */}
            {eventType !== 'ownership_change' && eventType !== 'subdivision' && (
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
            )}

            {/* Status Change Dropdown (for status_change events) */}
            {/* Hide for synthetic "Not Sold" markers */}
            {eventType === 'status_change' && !isSyntheticNotSold && (
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
            {eventType === 'custom' && (
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

            {/* Ownership Change Event (including Inherit events) */}
            {(eventType === 'ownership_change' || eventType === 'refinance') && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Ownership Transfer Details
                </h3>

                {/* Ownership Summary - Shows for existing events */}
                {(leavingOwners.length > 0 || newOwners.length > 0) && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Ownership Transfer Summary
                    </h4>

                    {/* Previous Owners */}
                    {leavingOwners.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Previous Owner(s):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {leavingOwners.map((ownerName, idx) => {
                            const ownerData = currentProperty?.owners?.find(o => o.name === ownerName);
                            return (
                              <span key={idx} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                {ownerName} {ownerData && `(${ownerData.percentage}%)`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* New Owners */}
                    {newOwners.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          New Owner(s):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {newOwners.map((owner, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              {owner.name} ({owner.percentage}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason Dropdown - Only for ownership_change events, not inherit (refinance) */}
                {eventType === 'ownership_change' && (
                  <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Reason for Ownership Change *
                    </label>
                    <select
                      value={ownershipChangeReason}
                      onChange={(e) => setOwnershipChangeReason(e.target.value as any)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="divorce">Divorce</option>
                      <option value="sale_transfer">Sale / Transfer</option>
                      <option value="gift">Gift</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Other Reason Text Input (conditional) */}
                  {ownershipChangeReason === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Please specify reason
                      </label>
                      <input
                        type="text"
                        value={ownershipChangeReasonOther}
                        onChange={(e) => setOwnershipChangeReasonOther(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Estate transfer, Corporate restructure..."
                      />
                    </div>
                  )}
                  </>
                )}

                {/* Excluded Foreign Resident Checkbox - Only for inherit (refinance) events */}
                {eventType === 'refinance' && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input
                      type="checkbox"
                      id="excludedForeignResident"
                      checked={excludedForeignResident}
                      onChange={(e) => setExcludedForeignResident(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="excludedForeignResident"
                      className="flex-1 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Excluded Foreign Resident
                      <div className="relative">
                        <Info
                          className="w-4 h-4 text-blue-500 dark:text-blue-400 cursor-help"
                          onMouseEnter={() => setShowExcludedForeignResidentTooltip(true)}
                          onMouseLeave={() => setShowExcludedForeignResidentTooltip(false)}
                        />
                        <AnimatePresence>
                          {showExcludedForeignResidentTooltip && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl text-sm min-w-[320px] max-w-[400px] z-50 pointer-events-none border-2 border-blue-500/30"
                            >
                              <p className="text-slate-200 leading-relaxed">
                                The deceased must not have been an "excluded foreign resident" (i.e., a foreign resident for a continuous period of more than six years immediately before death)
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </label>
                  </div>
                )}

                {/* Leaving Owners */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Leaving Owner(s) *
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Select the owner(s) who are transferring their ownership
                  </p>
                  {currentProperty?.owners && currentProperty.owners.length > 0 ? (
                    <div className="space-y-2">
                      {currentProperty.owners.map((owner, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                        >
                          <input
                            type="checkbox"
                            id={`leaving-owner-${index}`}
                            checked={leavingOwners.includes(owner.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLeavingOwners([...leavingOwners, owner.name]);
                              } else {
                                setLeavingOwners(leavingOwners.filter(name => name !== owner.name));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <label
                            htmlFor={`leaving-owner-${index}`}
                            className="flex-1 text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            {owner.name} ({owner.percentage}%)
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                      No owners found for this property. Please add owners in the Property Panel first.
                    </div>
                  )}
                </div>

                {/* Percentage Being Transferred Summary */}
                {leavingOwners.length > 0 && (() => {
                  const leavingOwnersTotal = currentProperty?.owners
                    ?.filter(owner => leavingOwners.includes(owner.name))
                    .reduce((sum, owner) => sum + owner.percentage, 0) || 0;
                  return (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Transferring: <strong>{leavingOwnersTotal}%</strong> ownership
                      </span>
                    </div>
                  );
                })()}

                {/* New Owners */}
                <div className="space-y-2">
                  {(() => {
                    const leavingOwnersTotal = currentProperty?.owners
                      ?.filter(owner => leavingOwners.includes(owner.name))
                      .reduce((sum, owner) => sum + owner.percentage, 0) || 0;
                    return (
                      <>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          New Owner(s) Receiving {leavingOwnersTotal > 0 ? `${leavingOwnersTotal}%` : 'Ownership'} *
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          {leavingOwnersTotal > 0
                            ? `New owner percentages must total ${leavingOwnersTotal}%`
                            : 'Select leaving owner(s) above first'}
                        </p>
                      </>
                    );
                  })()}

                  {newOwners.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {newOwners.map((owner, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <input
                            type="text"
                            value={owner.name}
                            onChange={(e) => {
                              const updated = [...newOwners];
                              updated[index].name = e.target.value;
                              setNewOwners(updated);
                            }}
                            className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Owner name"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={owner.percentage}
                            onChange={(e) => {
                              const updated = [...newOwners];
                              updated[index].percentage = parseFloat(e.target.value) || 0;
                              setNewOwners(updated);
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-24 px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="%"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewOwners(newOwners.filter((_, i) => i !== index));
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Remove owner"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setNewOwners([...newOwners, { name: '', percentage: 0 }]);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Owner
                  </button>
                </div>

                {/* Percentage Validation Summary */}
                {newOwners.length > 0 && (() => {
                  const leavingOwnersTotal = currentProperty?.owners
                    ?.filter(owner => leavingOwners.includes(owner.name))
                    .reduce((sum, owner) => sum + owner.percentage, 0) || 0;
                  const total = newOwners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
                  const isValid = Math.abs(total - leavingOwnersTotal) < 0.1 && leavingOwnersTotal > 0;
                  const isEmpty = total === 0;
                  const noLeavingOwners = leavingOwnersTotal === 0;

                  if (noLeavingOwners) {
                    return (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          Select leaving owner(s) above to see required percentage
                        </span>
                      </div>
                    );
                  }

                  if (isEmpty) {
                    return (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Enter ownership percentages totaling {leavingOwnersTotal}%
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border font-medium",
                      isValid
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    )}>
                      {isValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm">Total: {total.toFixed(1)}% ✓</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Total: {total.toFixed(1)}% (must equal {leavingOwnersTotal}%)</span>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Notes Section for Ownership Change */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add notes about this ownership change..."
                  />
                </div>
              </div>
            )}

            {/* Subdivision Event - Lot Editing Section */}
            {eventType === 'subdivision' && subdivisionLots.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-500" />
                  Subdivision Lots ({subdivisionLots.length})
                </h3>

                {/* Lot Cards */}
                <div className="space-y-6">
                  {subdivisionLots.map((lot) => {
                    const edited = lotEdits[lot.id] || {
                      lotNumber: lot.lotNumber || '',
                      lotSize: lot.lotSize || 0,
                      sizeUnit: 'hectares' as SizeUnit,
                      address: lot.address || '',
                      allocationPercentage: lot.allocationPercentage || 0,
                      isPercentageLocked: lot.allocationPercentage !== undefined && lot.allocationPercentage > 0,
                    };
                    const isMainLot = lot.isMainLotContinuation;
                    const allocatedCostBase = calculateLotCostBase(lot.id);

                    return (
                      <div
                        key={lot.id}
                        className={cn(
                          "p-4 rounded-lg border-2 space-y-3",
                          isMainLot
                            ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700"
                            : "bg-pink-50 dark:bg-pink-900/10 border-pink-300 dark:border-pink-700"
                        )}
                      >
                        {/* Lot Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold",
                              isMainLot ? "text-green-700 dark:text-green-400" : "text-pink-700 dark:text-pink-400"
                            )}>
                              {edited.lotNumber || lot.name || `Lot`}
                            </span>
                            {isMainLot && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                                Main Continuation
                              </span>
                            )}
                          </div>
                          {!isMainLot && (
                            <button
                              type="button"
                              onClick={() => setLotToDelete(lot.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Delete this lot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Lot Name Input */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Lot Name
                          </label>
                          <input
                            type="text"
                            value={edited.lotNumber}
                            onChange={(e) => {
                              setLotEdits(prev => ({
                                ...prev,
                                [lot.id]: { ...edited, lotNumber: e.target.value }
                              }));
                            }}
                            placeholder="e.g., Lot 1, Lot 2A"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>

                        {/* Lot Size Input */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Lot Size (sqm)
                          </label>
                          <input
                            type="number"
                            value={edited.lotSize || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setLotEdits(prev => ({
                                ...prev,
                                [lot.id]: { ...edited, lotSize: value }
                              }));
                            }}
                            placeholder="0"
                            min="0"
                            step="1"
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>

                        {/* Address Input */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Address (optional)
                          </label>
                          <input
                            type="text"
                            value={edited.address}
                            onChange={(e) => {
                              setLotEdits(prev => ({
                                ...prev,
                                [lot.id]: { ...edited, address: e.target.value }
                              }));
                            }}
                            placeholder="Street address"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>

                        {/* Allocation Percentage - Editable */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Allocation Percentage
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={edited.allocationPercentage || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setLotEdits(prev => ({
                                  ...prev,
                                  [lot.id]: {
                                    ...edited,
                                    allocationPercentage: Math.min(100, Math.max(0, value)),
                                    isPercentageLocked: true  // Lock when manually edited
                                  }
                                }));
                              }}
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.1"
                              onWheel={(e) => e.currentTarget.blur()}
                              className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <span className="text-sm text-slate-500 dark:text-slate-400">%</span>
                            <button
                              type="button"
                              onClick={() => setLotEdits(prev => ({
                                ...prev,
                                [lot.id]: { ...edited, isPercentageLocked: !edited.isPercentageLocked }
                              }))}
                              className={cn(
                                "p-1.5 rounded transition-colors",
                                edited.isPercentageLocked
                                  ? "text-pink-500 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                              )}
                              title={edited.isPercentageLocked ? "Locked - click to auto-calculate from lot sizes" : "Unlocked - will auto-calculate from lot sizes"}
                            >
                              {edited.isPercentageLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          </div>
                          {!edited.isPercentageLocked && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Auto-calculated from lot sizes
                            </p>
                          )}
                        </div>

                        {/* Allocated Cost Base (Read-only) */}
                        {(edited.lotSize > 0 || edited.allocationPercentage > 0) && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                Allocated Cost Base:
                              </span>
                              <span className="font-semibold text-blue-700 dark:text-blue-300">
                                {formatCurrency(allocatedCostBase)}
                              </span>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {edited.isPercentageLocked && edited.allocationPercentage > 0
                                ? `Based on ${edited.allocationPercentage.toFixed(1)}% allocation (manual)`
                                : 'Based on proportional lot size'}
                              {isMainLot && event.subdivisionDetails?.costBreakdown?.buildingValue
                                ? ` (includes building value)`
                                : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Allocation Total Validation */}
                {(() => {
                  const total = Object.values(lotEdits).reduce((sum, l) => sum + (l.allocationPercentage || 0), 0);
                  const hasAnyLocked = Object.values(lotEdits).some(l => l.isPercentageLocked);
                  if (!hasAnyLocked) return null;
                  const isValid = Math.abs(total - 100) < 0.1;
                  return (
                    <div className={cn(
                      "p-3 rounded-lg border text-sm",
                      isValid
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                    )}>
                      <div className="flex items-center justify-between">
                        <span>Total Allocation:</span>
                        <span className="font-semibold">{total.toFixed(1)}%</span>
                      </div>
                      {!isValid && (
                        <p className="text-xs mt-1">
                          {total < 100
                            ? `${(100 - total).toFixed(1)}% unallocated`
                            : `${(total - 100).toFixed(1)}% over-allocated`}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Cost Base Breakdown (if specified) */}
                {event.subdivisionDetails?.costBreakdown && (
                  (event.subdivisionDetails.costBreakdown.landValue !== undefined ||
                   event.subdivisionDetails.costBreakdown.buildingValue !== undefined) && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 space-y-2">
                      <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        Cost Base Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {event.subdivisionDetails.costBreakdown.landValue !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-purple-600 dark:text-purple-400">Land Value:</span>
                            <span className="font-medium text-purple-900 dark:text-purple-100">
                              {formatCurrency(event.subdivisionDetails.costBreakdown.landValue)}
                            </span>
                          </div>
                        )}
                        {event.subdivisionDetails.costBreakdown.buildingValue !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-purple-600 dark:text-purple-400">Building Value:</span>
                            <span className="font-medium text-purple-900 dark:text-purple-100">
                              {formatCurrency(event.subdivisionDetails.costBreakdown.buildingValue)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        Land value is apportioned across all lots. Building value stays with Lot 1.
                      </p>
                    </div>
                  )
                )}

                {/* Allocation Method Info */}
                {event.subdivisionDetails?.allocationMethod && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Allocation method:</span>
                    <span className="font-medium capitalize">
                      {event.subdivisionDetails.allocationMethod === 'by_lot_size'
                        ? 'By Lot Size'
                        : event.subdivisionDetails.allocationMethod === 'manual'
                        ? 'Manual Percentages'
                        : event.subdivisionDetails.allocationMethod}
                    </span>
                  </div>
                )}

                {/* Notes Section for Subdivision */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add notes about this subdivision..."
                  />
                </div>
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
                onClick={() => setShowDeleteConfirm(true)}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Event?"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Lot Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={lotToDelete !== null}
        onClose={() => setLotToDelete(null)}
        onConfirm={handleDeleteLot}
        title={
          subdivisionLots.filter((l) => !l.isMainLotContinuation).length === 1
            ? "Revert Subdivision?"
            : "Delete Lot?"
        }
        message={
          subdivisionLots.filter((l) => !l.isMainLotContinuation).length === 1
            ? "This is the last additional lot. Deleting it will revert the entire subdivision and restore the original property timeline. All events on this lot will be removed."
            : `This will permanently remove the lot and all its events. The remaining lots' allocation percentages will be recalculated proportionally.`
        }
        confirmLabel={
          subdivisionLots.filter((l) => !l.isMainLotContinuation).length === 1
            ? "Revert Subdivision"
            : "Delete Lot"
        }
        variant="danger"
      />

      {/* Cost Base Summary Modal */}
      <CostBaseSummaryModal
        event={{ ...event, costBases }}
        propertyAddress={propertyName}
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
      />
    </>
  );
}
