'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTimelineStore, EventType } from '@/store/timeline';
import { positionToDate } from '@/lib/utils';
import {
  Home,
  DollarSign,
  Key,
  Package,
  TrendingUp,
  Hammer,
  Plus,
  Building,
  X,
  Star,
  ChevronLeft,
  Gift
} from 'lucide-react';
import { PropertyStatus } from '@/store/timeline';

interface QuickAddMenuProps {
  position: { x: number; y: number };
  timelinePosition: number;
  onClose: () => void;
  preselectedPropertyId?: string | null;
  timelineContainerRef?: React.RefObject<HTMLDivElement>; // Optional reference to timeline container for bounds
}

const eventTypes: { type: EventType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'purchase', label: 'Purchase', icon: <Home className="w-4 h-4" />, color: '#3B82F6' },
  { type: 'sale', label: 'Sold', icon: <TrendingUp className="w-4 h-4" />, color: '#8B5CF6' },
  { type: 'move_in', label: 'Move In', icon: <Key className="w-4 h-4" />, color: '#10B981' },
  { type: 'move_out', label: 'Move Out', icon: <Package className="w-4 h-4" />, color: '#EF4444' },
  { type: 'rent_start', label: 'Start Rent', icon: <DollarSign className="w-4 h-4" />, color: '#F59E0B' },
  { type: 'rent_end', label: 'End Rent', icon: <DollarSign className="w-4 h-4" />, color: '#F97316' },
  { type: 'vacant_start', label: 'Vacant (Start)', icon: <Building className="w-4 h-4" />, color: '#9CA3AF' },
  { type: 'vacant_end', label: 'Vacant (End)', icon: <Building className="w-4 h-4" />, color: '#6B7280' },
  { type: 'improvement', label: 'Improvement', icon: <Hammer className="w-4 h-4" />, color: '#06B6D4' },
  { type: 'refinance', label: 'Inherit', icon: <Gift className="w-4 h-4" />, color: '#6366F1' },
  { type: 'custom', label: 'Custom Event', icon: <Star className="w-4 h-4" />, color: '#6B7280' },
];

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

export default function QuickAddMenu({ position, timelinePosition, onClose, preselectedPropertyId, timelineContainerRef }: QuickAddMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>(preselectedPropertyId || '');
  const [eventAmount, setEventAmount] = useState<string>('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [isRentalProperty, setIsRentalProperty] = useState(false);
  // Start with position off-screen or at a safe default, will be calculated properly in useLayoutEffect
  const [adjustedPosition, setAdjustedPosition] = useState(() => {
    // Initial safe position - will be recalculated immediately
    // Use click position but clamp to reasonable bounds as a starting point
    const safeX = Math.min(position.x, window.innerWidth - 300);
    const safeY = Math.min(position.y, window.innerHeight - 400);
    return { x: Math.max(16, safeX), y: Math.max(16, safeY) };
  });
  const [isPositioned, setIsPositioned] = useState(false);

  // Custom event state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customColor, setCustomColor] = useState('#6B7280');
  const [customAffectsStatus, setCustomAffectsStatus] = useState(false);
  const [customNewStatus, setCustomNewStatus] = useState<PropertyStatus | ''>('');
  const [customAmount, setCustomAmount] = useState<string>('');

  const { properties, addProperty, addEvent, timelineStart, timelineEnd } = useTimelineStore();
  const clickDate = positionToDate(timelinePosition, timelineStart, timelineEnd);

  // Get the preselected property details if available
  const preselectedProperty = preselectedPropertyId
    ? properties.find(p => p.id === preselectedPropertyId)
    : null;

  // Calculate the available bounds for the menu
  const getBounds = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;

    // Get container bounds if available, otherwise use viewport
    let boundsTop = margin;
    let boundsBottom = viewportHeight - margin;
    let boundsLeft = margin;
    let boundsRight = viewportWidth - margin;

    if (timelineContainerRef?.current) {
      const containerRect = timelineContainerRef.current.getBoundingClientRect();
      boundsTop = Math.max(margin, containerRect.top);
      boundsBottom = Math.min(viewportHeight - margin, containerRect.bottom);
      boundsLeft = Math.max(margin, containerRect.left);
      boundsRight = Math.min(viewportWidth - margin, containerRect.right);
    }

    return { boundsTop, boundsBottom, boundsLeft, boundsRight, margin };
  }, [timelineContainerRef]);

  // BULLETPROOF positioning: Calculate position AND max-height together
  // This ensures the menu NEVER overflows regardless of content size
  // PRIORITY: MAXIMIZE vertical space - always start from top to get maximum height
  const calculatePositionAndMaxHeight = useCallback((menuWidth: number) => {
    const offset = 12;
    const { boundsTop, boundsBottom, boundsLeft, boundsRight } = getBounds();
    const headerHeight = 60; // Header + padding

    const availableHeight = boundsBottom - boundsTop;
    const availableWidth = boundsRight - boundsLeft;

    // STRATEGY: ALWAYS start from the top of bounds to maximize vertical space
    // This gives the menu the maximum possible height to display all content
    const finalY = boundsTop;
    const maxMenuHeight = availableHeight; // Use ALL available vertical space

    // Calculate X position - place to the right of click, or left if no room
    const effectiveMenuWidth = Math.min(menuWidth || 300, availableWidth);
    let finalX = position.x + offset;
    if (finalX + effectiveMenuWidth > boundsRight) {
      finalX = position.x - effectiveMenuWidth - offset;
    }
    finalX = Math.max(boundsLeft, Math.min(finalX, boundsRight - effectiveMenuWidth));

    // Content max height = menu max height - header
    const contentMaxHeight = Math.max(100, maxMenuHeight - headerHeight);

    return {
      position: { x: finalX, y: finalY },
      maxMenuHeight,
      contentMaxHeight
    };
  }, [position.x, position.y, getBounds]);

  // State for calculated values
  const [menuMaxHeight, setMenuMaxHeight] = useState<number>(600);
  const [contentMaxHeight, setContentMaxHeight] = useState<number>(500);

  // Reposition whenever menu opens or content changes
  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const updatePositionAndConstraints = () => {
      if (!menuRef.current) return;

      const menuRect = menuRef.current.getBoundingClientRect();
      const { position: newPosition, maxMenuHeight, contentMaxHeight } =
        calculatePositionAndMaxHeight(menuRect.width || 300);

      setAdjustedPosition(newPosition);
      setMenuMaxHeight(maxMenuHeight);
      setContentMaxHeight(contentMaxHeight);
      setIsPositioned(true);
    };

    // Initial calculation with double RAF for reliability
    requestAnimationFrame(() => {
      requestAnimationFrame(updatePositionAndConstraints);
    });

    // ResizeObserver for content changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updatePositionAndConstraints);
    });
    resizeObserver.observe(menuRef.current);

    // Window resize handler
    const handleWindowResize = () => {
      requestAnimationFrame(updatePositionAndConstraints);
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [calculatePositionAndMaxHeight, showPropertyForm, selectedProperty, properties.length, showCustomForm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleAddProperty = () => {
    if (!propertyName) return;

    addProperty({
      name: propertyName,
      address: '', // Address is now included in the name field
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      isRental: isRentalProperty || undefined,
    });

    setPropertyName('');
    setIsRentalProperty(false);
    setShowPropertyForm(false);
    onClose();
  };

  const handleAddEvent = (type: EventType) => {
    if (!selectedProperty && properties.length > 0) {
      setSelectedProperty(properties[0].id);
      return;
    }

    const property = properties.find(p => p.id === selectedProperty) || properties[0];
    if (!property) return;

    // If custom event, show the custom form instead
    if (type === 'custom') {
      setShowCustomForm(true);
      return;
    }

    // Events that don't have amounts
    const noAmountEvents = ['move_in', 'move_out', 'vacant_start', 'vacant_end'];

    addEvent({
      propertyId: property.id,
      type,
      date: clickDate,
      title: eventTypes.find(e => e.type === type)?.label || type,
      position: timelinePosition,
      color: eventTypes.find(e => e.type === type)?.color || '#3B82F6',
      amount: !noAmountEvents.includes(type) && eventAmount ? parseFloat(eventAmount) : undefined,
    });

    onClose();
  };

  const handleAddCustomEvent = () => {
    if (!customTitle.trim()) return;

    const property = properties.find(p => p.id === selectedProperty) || properties[0];
    if (!property) return;

    addEvent({
      propertyId: property.id,
      type: 'custom',
      date: clickDate,
      title: customTitle.trim(),
      position: timelinePosition,
      color: customColor,
      amount: customAmount ? parseFloat(customAmount) : undefined,
      affectsStatus: customAffectsStatus || undefined,
      newStatus: customAffectsStatus && customNewStatus ? customNewStatus as PropertyStatus : undefined,
    });

    onClose();
  };

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-[280px] flex flex-col overflow-hidden"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        maxHeight: menuMaxHeight, // Dynamic max-height based on position - PREVENTS OVERFLOW
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isPositioned ? 1 : 0.9,
        opacity: isPositioned ? 1 : 0
      }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Fixed header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Add to Timeline</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Scrollable content area with dynamic max height */}
      <div
        className="overflow-y-auto flex-1 min-h-0"
        style={{ maxHeight: contentMaxHeight }}
      >

      {/* Property Selection or Add New */}
      {properties.length === 0 || showPropertyForm ? (
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Property Name & Address (optional)</label>
            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddProperty();
                }
              }}
              placeholder="e.g., Main Residence, 123 Main St"
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRentalProperty"
              checked={isRentalProperty}
              onChange={(e) => setIsRentalProperty(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isRentalProperty" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
              This is a rental property (I don't own it)
            </label>
          </div>
          <button
            onClick={handleAddProperty}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Building className="w-4 h-4" />
            Add Property
          </button>
        </div>
      ) : preselectedProperty ? (
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Adding event to</label>
          <div className="mt-1 px-3 py-2 border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: preselectedProperty.color }}
            />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {preselectedProperty.name}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedProperty('');
              setShowPropertyForm(false);
            }}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600"
          >
            Change property or add new
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Select Property</label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Choose property...</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowPropertyForm(true)}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600"
          >
            + Add new property
          </button>
        </div>
      )}

      {/* Event Type Grid */}
      {selectedProperty && !showCustomForm && (
        <>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Event Type</div>
          <div className="grid grid-cols-2 gap-2">
            {eventTypes.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => handleAddEvent(type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all ${
                  type === 'custom' ? 'col-span-2 bg-slate-50 dark:bg-slate-700/50' : ''
                }`}
              >
                <div
                  className="p-1 rounded"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {icon}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                {type === 'custom' && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">Any situation</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom Event Form */}
      {selectedProperty && showCustomForm && (
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => setShowCustomForm(false)}
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to event types
          </button>

          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Create Custom Event</div>

          {/* Custom Title */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Event Name *</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Flood Damage, Granny Flat Added"
              className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Event Color</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {customEventColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCustomColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    customColor === color
                      ? 'border-slate-900 dark:border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Amount (Optional) */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Amount (Optional)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Add amount for cost base tracking
            </p>
          </div>

          {/* Affects Status Checkbox */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customAffectsStatus"
                checked={customAffectsStatus}
                onChange={(e) => {
                  setCustomAffectsStatus(e.target.checked);
                  if (!e.target.checked) setCustomNewStatus('');
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="customAffectsStatus" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                This event changes property status
              </label>
            </div>

            {/* Status Dropdown */}
            {customAffectsStatus && (
              <select
                value={customNewStatus}
                onChange={(e) => setCustomNewStatus(e.target.value as PropertyStatus)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select new status...</option>
                <option value="ppr">Main Residence (PPR)</option>
                <option value="rental">Rental/Investment</option>
                <option value="vacant">Vacant</option>
                <option value="construction">Under Construction</option>
              </select>
            )}
          </div>

          {/* Add Custom Event Button */}
          <button
            onClick={handleAddCustomEvent}
            disabled={!customTitle.trim()}
            className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star className="w-4 h-4" />
            Add Custom Event
          </button>
        </div>
      )}
      </div>{/* End scrollable content area */}
    </motion.div>
  );
}
