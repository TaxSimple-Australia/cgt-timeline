'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEvent, PropertyStatus, useTimelineStore, CostBaseItem } from '@/store/timeline';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, Home, Tag, FileText, CheckCircle, CheckCircle2, Receipt, Info, Star, Palette, Building2, Key, AlertCircle, Briefcase, TrendingUp, Package, Hammer, Gift, MapPin, ChevronDown, Square, Maximize2, Percent, Plus } from 'lucide-react';
import CostBaseSelector from './CostBaseSelector';
import { getCostBaseDefinition } from '@/lib/cost-base-definitions';
import CostBaseSummaryModal from './CostBaseSummaryModal';
import { parseDateFlexible, formatDateDisplay, isValidDateRange, DATE_FORMAT_PLACEHOLDER } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

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
  { type: 'vacant_start' as const, label: 'Vacant (Start)', color: '#9CA3AF' },
  { type: 'vacant_end' as const, label: 'Vacant (End)', color: '#6B7280' },
  { type: 'improvement' as const, label: 'Improvement', color: '#06B6D4' },
  { type: 'refinance' as const, label: 'Inherit', color: '#6366F1' },
  { type: 'status_change' as const, label: 'Status Change', color: '#A855F7' },
  { type: 'custom' as const, label: 'Custom Event', color: '#6B7280' },
];

interface EventDetailsModalProps {
  event: TimelineEvent;
  onClose: () => void;
  propertyName: string;
}

export default function EventDetailsModal({ event, onClose, propertyName }: EventDetailsModalProps) {
  const { updateEvent, deleteEvent, addEvent, events, properties, updateProperty } = useTimelineStore();

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
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [showMarketValuationTooltip, setShowMarketValuationTooltip] = useState(false);

  // Custom event specific state
  const [customColor, setCustomColor] = useState(event.color || '#6B7280');
  const [affectsStatus, setAffectsStatus] = useState(event.affectsStatus || false);

  // Move in on same day checkbox (for purchase events)
  const [moveInOnSameDay, setMoveInOnSameDay] = useState(() => {
    // Check if a move_in event already exists on the same date as this purchase
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
    // Check if a vacant_start event exists on the same date as this purchase
    if (event.type === 'purchase') {
      const purchaseDate = event.date.getTime();
      const existingVacant = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'vacant_start' &&
          e.date.getTime() === purchaseDate
      );
      return !!existingVacant;
    }
    return false;
  });
  const [purchaseAsRent, setPurchaseAsRent] = useState(() => {
    // Check if a rent_start event exists on the same date as this purchase
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

  // Property details section (collapsible) - auto-expand if any options are set
  const [showPropertyDetails, setShowPropertyDetails] = useState(
    event.isLandOnly || event.overTwoHectares || false
  );

  // Move out status checkboxes (for move_out events)
  const [moveOutAsVacant, setMoveOutAsVacant] = useState(() => {
    // Check if a vacant_start event exists on the same date as this move_out
    if (event.type === 'move_out') {
      const moveOutDate = event.date.getTime();
      const existingVacant = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'vacant_start' &&
          e.date.getTime() === moveOutDate
      );
      return !!existingVacant;
    }
    return false;
  });
  const [moveOutAsRent, setMoveOutAsRent] = useState(() => {
    // Check if a rent_start event exists on the same date as this move_out
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
    // Check if a vacant_start event exists on the same date as this rent_end
    if (event.type === 'rent_end') {
      const rentEndDate = event.date.getTime();
      const existingVacant = events.find(
        (e) =>
          e.propertyId === event.propertyId &&
          e.type === 'vacant_start' &&
          e.date.getTime() === rentEndDate
      );
      return !!existingVacant;
    }
    return false;
  });
  const [rentEndAsMoveIn, setRentEndAsMoveIn] = useState(() => {
    // Check if a move_in event exists on the same date as this rent_end
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

  // Vacant end status checkboxes (for vacant_end events - extract from notes if present)
  const [vacantEndAsMoveIn, setVacantEndAsMoveIn] = useState(() => {
    if (event.type === 'vacant_end' && event.description) {
      return event.description.includes('Next status: Owner Move back in');
    }
    return false;
  });
  const [vacantEndAsRent, setVacantEndAsRent] = useState(() => {
    if (event.type === 'vacant_end' && event.description) {
      return event.description.includes('Next status: Rental');
    }
    return false;
  });

  // Sale event - Non-resident status (unchecked = resident by default)
  const [isNonResident, setIsNonResident] = useState(event.isResident === false);

  // Sale event - Previous year capital losses
  const [previousYearLosses, setPreviousYearLosses] = useState(event.previousYearLosses?.toString() || '');

  // Sale event - Marginal tax rate (extract from notes if present)
  const [marginalTaxRate, setMarginalTaxRate] = useState(() => {
    if (event.type === 'sale' && event.description) {
      const match = event.description.match(/Marginal tax rate: ([\d.]+)%/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return '37'; // Default to 37%
  });

  // NEW: Business use / usage splits (Gilbert's contextual approach)
  const [hasBusinessUse, setHasBusinessUse] = useState(!!event.businessUsePercentage);
  const [businessUsePercentage, setBusinessUsePercentage] = useState(event.businessUsePercentage?.toString() || '');

  const [hasPartialRental, setHasPartialRental] = useState(!!event.floorAreaData);
  const [totalFloorArea, setTotalFloorArea] = useState(event.floorAreaData?.total?.toString() || '');
  const [exclusiveRentalArea, setExclusiveRentalArea] = useState(event.floorAreaData?.exclusive?.toString() || '');
  const [sharedArea, setSharedArea] = useState(event.floorAreaData?.shared?.toString() || '');

  // NEW: Mixed-Use checkbox and percentages
  const [purchaseAsMixedUse, setPurchaseAsMixedUse] = useState(() => {
    // Initialize as true if any split-use percentages exist
    return !!(event.rentalUsePercentage || event.livingUsePercentage || (event.businessUsePercentage && event.type === 'purchase'));
  });
  const [livingUsePercentage, setLivingUsePercentage] = useState(event.livingUsePercentage?.toString() || '');
  const [rentalUsePercentage, setRentalUsePercentage] = useState(event.rentalUsePercentage?.toString() || '');
  const [mixedBusinessUsePercentage, setMixedBusinessUsePercentage] = useState(
    event.type === 'purchase' && event.businessUsePercentage ? event.businessUsePercentage.toString() : ''
  );

  // NEW: Ownership change state variables
  const [leavingOwners, setLeavingOwners] = useState<string[]>(event.leavingOwners || []);
  const [newOwners, setNewOwners] = useState<Array<{name: string; percentage: number}>>(
    event.newOwners || []
  );
  const [ownershipChangeReason, setOwnershipChangeReason] = useState(event.ownershipChangeReason || 'sale_transfer');
  const [ownershipChangeReasonOther, setOwnershipChangeReasonOther] = useState(event.ownershipChangeReasonOther || '');

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
        alert('Please fix the date error before saving');
        return;
      }

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
        // For purchase events, calculate amount from cost bases
        const totalCostBases = costBases.reduce((sum, cb) => sum + cb.amount, 0);
        updates.amount = totalCostBases > 0 ? totalCostBases : undefined;

        // Clear legacy land/building prices
        updates.landPrice = undefined;
        updates.buildingPrice = undefined;

        // Over 2 hectares flag (for main residence exemption calculation)
        updates.overTwoHectares = overTwoHectares || undefined;

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
      } else if (event.type === 'improvement') {
        // For improvement events, use cost bases if available, otherwise fall back to amount field
        const totalCostBases = costBases.reduce((sum, cb) => sum + cb.amount, 0);
        if (totalCostBases > 0) {
          updates.amount = totalCostBases;
        } else if (amount && !isNaN(parseFloat(amount))) {
          updates.amount = parseFloat(amount);
        } else {
          updates.amount = undefined;
        }
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

      // Handle description with marginal tax rate for sale events
      let finalDescription = description.trim();

      // For sale events, append marginal tax rate to notes
      if (event.type === 'sale' && marginalTaxRate && !isNaN(parseFloat(marginalTaxRate))) {
        const taxRateNote = `\n\nMarginal tax rate: ${parseFloat(marginalTaxRate)}%`;

        // Check if tax rate already in description to avoid duplicates
        if (!finalDescription.includes('Marginal tax rate:')) {
          finalDescription += taxRateNote;
        } else {
          // Update existing tax rate in notes
          finalDescription = finalDescription.replace(
            /Marginal tax rate: [\d.]+%/g,
            `Marginal tax rate: ${parseFloat(marginalTaxRate)}%`
          );
        }
      }

      // For vacant_end events, append next status to notes
      if (event.type === 'vacant_end') {
        // Remove any existing "Next status:" text first
        finalDescription = finalDescription.replace(/\n*Next status: (Owner Move back in|Rental)/g, '');

        // Add the selected status
        if (vacantEndAsMoveIn) {
          finalDescription = finalDescription.trim() + '\n\nNext status: Owner Move back in';
        } else if (vacantEndAsRent) {
          finalDescription = finalDescription.trim() + '\n\nNext status: Rental';
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
          alert(`Mixed-Use percentages must total 100%. Current total: ${total.toFixed(1)}%`);
          setIsSaving(false);
          return;
        }

        // Save the percentages
        updates.livingUsePercentage = living > 0 ? living : undefined;
        updates.rentalUsePercentage = rental > 0 ? rental : undefined;
        updates.businessUsePercentage = business > 0 ? business : undefined;
      } else {
        // Clear mixed-use percentages if checkbox is not checked
        // Only clear if not set via the other business use checkbox
        if (!hasBusinessUse) {
          updates.businessUsePercentage = undefined;
        }
        updates.livingUsePercentage = undefined;
        updates.rentalUsePercentage = undefined;
      }

      // NEW: Ownership Change validation and data
      if (eventType === 'ownership_change') {
        // Validate that at least one leaving owner is selected
        if (!leavingOwners || leavingOwners.length === 0) {
          alert('Please select at least one leaving owner.');
          setIsSaving(false);
          return;
        }

        // Validate that at least one new owner is added
        if (!newOwners || newOwners.length === 0) {
          alert('Please add at least one new owner.');
          setIsSaving(false);
          return;
        }

        // Validate that all new owners have names
        const hasEmptyNames = newOwners.some(owner => !owner.name.trim());
        if (hasEmptyNames) {
          alert('Please enter names for all new owners.');
          setIsSaving(false);
          return;
        }

        // Validate that new owners' percentages total 100%
        const totalPercentage = newOwners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
        if (totalPercentage !== 100) {
          alert(`New owners' percentages must total 100%. Current total: ${totalPercentage.toFixed(1)}%`);
          setIsSaving(false);
          return;
        }

        // Validate that if reason is "other", reasonOther is provided
        if (ownershipChangeReason === 'other' && !ownershipChangeReasonOther.trim()) {
          alert('Please specify the reason for ownership change.');
          setIsSaving(false);
          return;
        }

        // Save ownership change data
        updates.leavingOwners = leavingOwners;
        updates.newOwners = newOwners;
        updates.ownershipChangeReason = ownershipChangeReason;
        updates.ownershipChangeReasonOther = ownershipChangeReason === 'other' ? ownershipChangeReasonOther.trim() : undefined;
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

      // Create move_in event for "vacant end as move in"
      if (event.type === 'vacant_end' && vacantEndAsMoveIn) {
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

      // Auto-update property owners for ownership_change events
      if (eventType === 'ownership_change' && event.propertyId) {
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

      // Reset checkbox states to prevent duplicate creation on next save
      setMoveInOnSameDay(false);
      setPurchaseAsVacant(false);
      setPurchaseAsRent(false);
      setMoveOutAsVacant(false);
      setMoveOutAsRent(false);
      setRentEndAsVacant(false);
      setRentEndAsMoveIn(false);
      setVacantEndAsMoveIn(false);
      setVacantEndAsRent(false);

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
                    setVacantEndAsMoveIn(false);
                    setVacantEndAsRent(false);
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
                  <div className="relative">
                    <input
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
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                    >
                      <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
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
                            setPurchaseAsVacant(false);
                            setPurchaseAsRent(false);
                            setPurchaseAsMixedUse(false);
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

                  {/* Business use section - separate indented box */}
                  <AnimatePresence>
                    {moveInOnSameDay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-8">
                          <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="hasBusinessUse"
                                checked={hasBusinessUse}
                                onChange={(e) => setHasBusinessUse(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                              <label
                                htmlFor="hasBusinessUse"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                Using part for business or rental?
                              </label>
                            </div>

                            {hasBusinessUse && (
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Business use percentage (0-100%)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={businessUsePercentage}
                                  onChange={(e) => setBusinessUsePercentage(e.target.value)}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="e.g., 25"
                                />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  Enter the percentage of the property used for business or rental purposes
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                      Purchase as rental/investment
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
                            setMoveInOnSameDay(false);
                            setPurchaseAsVacant(false);
                            setPurchaseAsRent(false);
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

                  {/* Property Characteristics - Collapsible Section */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowPropertyDetails(!showPropertyDetails)}
                      className="flex items-center gap-2 w-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                    >
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        showPropertyDetails && "rotate-180"
                      )} />
                      Additional Property Details
                      {(isLandOnly || overTwoHectares) && (
                        <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full font-semibold">
                          {[isLandOnly, overTwoHectares].filter(Boolean).length}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showPropertyDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-3 mt-3"
                        >
                          {/* Land Only checkbox */}
                          <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                            <input
                              type="checkbox"
                              id="isLandOnly"
                              checked={isLandOnly}
                              onChange={(e) => setIsLandOnly(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <label
                              htmlFor="isLandOnly"
                              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <Square className="w-4 h-4" />
                              Land Only (no building)
                            </label>
                            <div className="ml-auto">
                              <div className="group relative">
                                <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" />
                                <div className="invisible group-hover:visible absolute right-0 top-6 w-72 p-3 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10">
                                  <p className="font-semibold mb-1">Land Only Property</p>
                                  <p>Property is land only (no building). Building depreciation will not be available for CGT calculations. This affects capital works deductions under Division 43.</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Over 2 Hectares checkbox */}
                          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <input
                              type="checkbox"
                              id="overTwoHectares"
                              checked={overTwoHectares}
                              onChange={(e) => setOverTwoHectares(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <label
                              htmlFor="overTwoHectares"
                              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <Maximize2 className="w-4 h-4" />
                              Land exceeds 2 hectares
                            </label>
                            <div className="ml-auto">
                              <div className="group relative">
                                <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" />
                                <div className="invisible group-hover:visible absolute right-0 top-6 w-72 p-3 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10">
                                  <p className="font-semibold mb-1">Main Residence Exemption Limitation</p>
                                  <p>The main residence CGT exemption only covers the dwelling plus up to 2 hectares of adjacent land. If your property exceeds 2 hectares, the excess land may be subject to CGT (ATO Section 118-120).</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Details Section - Only for specific event types (not purchase, sale, or Not Sold markers) */}
            {!isSyntheticNotSold &&
             eventType !== 'purchase' &&
             eventType !== 'move_in' &&
             eventType !== 'move_out' &&
             eventType !== 'rent_start' &&
             eventType !== 'rent_end' &&
             eventType !== 'sale' &&
             eventType !== 'vacant_start' &&
             eventType !== 'vacant_end' &&
             eventType !== 'ownership_change' && (
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
            {/* Hide for synthetic "Not Sold" markers */}
            {!isSyntheticNotSold && (eventType === 'purchase' || eventType === 'sale' || eventType === 'improvement' || eventType === 'status_change' || eventType === 'refinance' || eventType === 'custom') && (
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

                {/* Marginal Tax Rate Input */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Marginal Tax Rate (%)
                    </label>
                    <div className="relative group">
                      <Info className="w-4 h-4 text-blue-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        Your marginal tax rate (personal tax bracket). Common rates: 32.5%, 37%, 45% (incl. Medicare levy). This will be included in the notes for AI analysis.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={marginalTaxRate}
                      onChange={(e) => setMarginalTaxRate(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="37.00"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full pl-4 pr-8 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">%</span>
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

            {/* Vacant End Event - Status Options */}
            {eventType === 'vacant_end' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set property status after vacancy ends:
                  </p>

                  {/* Vacant end as move in checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <input
                      type="checkbox"
                      id="vacantEndAsMoveIn"
                      checked={vacantEndAsMoveIn}
                      onChange={(e) => {
                        setVacantEndAsMoveIn(e.target.checked);
                        if (e.target.checked) {
                          setVacantEndAsRent(false); // Mutual exclusivity
                        }
                      }}
                      className="w-4 h-4 text-green-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <label
                      htmlFor="vacantEndAsMoveIn"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Home className="w-4 h-4" />
                      Owner Move back in
                    </label>
                  </div>

                  {/* Vacant end as rental checkbox */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input
                      type="checkbox"
                      id="vacantEndAsRent"
                      checked={vacantEndAsRent}
                      onChange={(e) => {
                        setVacantEndAsRent(e.target.checked);
                        if (e.target.checked) {
                          setVacantEndAsMoveIn(false); // Mutual exclusivity
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="vacantEndAsRent"
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4" />
                      Rental
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
                    <div className="relative">
                      <input
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
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          input?.showPicker?.();
                        }}
                      >
                        <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </button>
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
            {eventType !== 'ownership_change' && (
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

            {/* Ownership Change Event */}
            {eventType === 'ownership_change' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Ownership Transfer Details
                </h3>

                {/* Reason Dropdown */}
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

                {/* New Owners */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Owner(s) *
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Add the new owner(s) receiving the transferred ownership
                  </p>

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
                  const total = newOwners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
                  const isValid = total === 100;
                  const isEmpty = total === 0;

                  if (isEmpty) {
                    return (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Enter ownership percentages above
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
                          <span className="text-sm">Total: {total.toFixed(1)}% (must equal 100%)</span>
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
