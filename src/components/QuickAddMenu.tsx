'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  UserPlus,
  UserMinus
} from 'lucide-react';

interface QuickAddMenuProps {
  position: { x: number; y: number };
  timelinePosition: number;
  onClose: () => void;
  preselectedPropertyId?: string | null;
}

const eventTypes: { type: EventType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'purchase', label: 'Purchase', icon: <Home className="w-4 h-4" />, color: '#3B82F6' },
  { type: 'sale', label: 'Sale', icon: <TrendingUp className="w-4 h-4" />, color: '#8B5CF6' },
  { type: 'move_in', label: 'Move In', icon: <Key className="w-4 h-4" />, color: '#10B981' },
  { type: 'move_out', label: 'Move Out', icon: <Package className="w-4 h-4" />, color: '#EF4444' },
  { type: 'rent_start', label: 'Start Rent', icon: <DollarSign className="w-4 h-4" />, color: '#F59E0B' },
  { type: 'rent_end', label: 'End Rent', icon: <DollarSign className="w-4 h-4" />, color: '#F97316' },
  { type: 'living_in_rental_start', label: 'Living in Rental (Start)', icon: <UserPlus className="w-4 h-4" />, color: '#F472B6' },
  { type: 'living_in_rental_end', label: 'Living in Rental (End)', icon: <UserMinus className="w-4 h-4" />, color: '#FB923C' },
  { type: 'improvement', label: 'Improvement', icon: <Hammer className="w-4 h-4" />, color: '#06B6D4' },
  { type: 'refinance', label: 'Refinance', icon: <DollarSign className="w-4 h-4" />, color: '#6366F1' },
];

export default function QuickAddMenu({ position, timelinePosition, onClose, preselectedPropertyId }: QuickAddMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>(preselectedPropertyId || '');
  const [eventAmount, setEventAmount] = useState<string>('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [isPPR, setIsPPR] = useState(false);
  const [isRentalProperty, setIsRentalProperty] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: position.x, y: position.y });
  const [isPositioned, setIsPositioned] = useState(false);

  const { properties, addProperty, addEvent, timelineStart, timelineEnd } = useTimelineStore();
  const clickDate = positionToDate(timelinePosition, timelineStart, timelineEnd);

  // Get the preselected property details if available
  const preselectedProperty = preselectedPropertyId
    ? properties.find(p => p.id === preselectedPropertyId)
    : null;

  // Calculate smart position based on viewport and menu size
  const calculatePosition = (menuWidth: number, menuHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;
    const offset = 12;

    // Try different placements and score them
    const placements = [
      { name: 'right', x: position.x + offset, y: position.y },
      { name: 'left', x: position.x - menuWidth - offset, y: position.y },
      { name: 'bottom', x: position.x - menuWidth / 2, y: position.y + offset },
      { name: 'top', x: position.x - menuWidth / 2, y: position.y - menuHeight - offset },
      { name: 'bottom-right', x: position.x + offset, y: position.y + offset },
      { name: 'bottom-left', x: position.x - menuWidth - offset, y: position.y + offset },
      { name: 'top-right', x: position.x + offset, y: position.y - menuHeight - offset },
      { name: 'top-left', x: position.x - menuWidth - offset, y: position.y - menuHeight - offset },
    ];

    // Score each placement by how well it fits in viewport
    const scorePlacement = (x: number, y: number) => {
      const rightOverflow = Math.max(0, (x + menuWidth) - (viewportWidth - margin));
      const leftOverflow = Math.max(0, margin - x);
      const bottomOverflow = Math.max(0, (y + menuHeight) - (viewportHeight - margin));
      const topOverflow = Math.max(0, margin - y);

      return -(rightOverflow + leftOverflow + bottomOverflow + topOverflow);
    };

    // Find the best placement
    let bestPlacement = placements[0];
    let bestScore = scorePlacement(placements[0].x, placements[0].y);

    for (const placement of placements) {
      const score = scorePlacement(placement.x, placement.y);
      if (score > bestScore) {
        bestScore = score;
        bestPlacement = placement;
      }
    }

    // Apply the best placement with final bounds checking
    let x = bestPlacement.x;
    let y = bestPlacement.y;

    // Ensure menu stays within viewport
    x = Math.max(margin, Math.min(x, viewportWidth - menuWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - menuHeight - margin));

    return { x, y };
  };

  // Reposition whenever menu size or content changes
  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const newPosition = calculatePosition(menuRect.width, menuRect.height);

    setAdjustedPosition(newPosition);
    setIsPositioned(true);
  }, [position.x, position.y, showPropertyForm, selectedProperty, properties.length]);

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

    // Events that don't have amounts
    const noAmountEvents = ['move_in', 'move_out', 'living_in_rental_start', 'living_in_rental_end'];

    addEvent({
      propertyId: property.id,
      type,
      date: clickDate,
      title: eventTypes.find(e => e.type === type)?.label || type,
      position: timelinePosition,
      color: eventTypes.find(e => e.type === type)?.color || '#3B82F6',
      amount: !noAmountEvents.includes(type) && eventAmount ? parseFloat(eventAmount) : undefined,
      isPPR: isPPR || undefined, // Only include if true
    });

    onClose();
  };

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-[280px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isPositioned ? 1 : 0.9,
        opacity: isPositioned ? 1 : 0
      }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Add to Timeline</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Property Selection or Add New */}
      {properties.length === 0 || showPropertyForm ? (
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Property Name & Address (optional)</label>
            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
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

      {/* Main Residence Checkbox */}
      {selectedProperty && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="isPPR"
            checked={isPPR}
            onChange={(e) => setIsPPR(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPPR" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
            Main Residence
          </label>
        </div>
      )}

      {/* Event Type Grid */}
      {selectedProperty && (
        <>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Event Type</div>
          <div className="grid grid-cols-2 gap-2">
            {eventTypes.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => handleAddEvent(type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <div 
                  className="p-1 rounded"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {icon}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
