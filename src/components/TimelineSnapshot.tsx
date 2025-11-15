'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, MapPin, Home, ShoppingCart, DollarSign,
  LogIn, LogOut, Calendar, CalendarX, Hammer, CheckCircle,
  Plus, Receipt, TrendingUp, Building
} from 'lucide-react';
import { useTimelineStore, Property, TimelineEvent, EventType } from '@/store/timeline';
import { format } from 'date-fns';

// Helper function to get icon for each event type
const getEventIcon = (eventType: EventType) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    purchase: ShoppingCart,
    sale: DollarSign,
    move_in: LogIn,
    move_out: LogOut,
    rent_start: Calendar,
    rent_end: CalendarX,
    improvement: Hammer,
    refinance: DollarSign,
    status_change: CheckCircle,
  };
  return iconMap[eventType] || Calendar;
};

export default function TimelineSnapshot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<{ event: TimelineEvent; property: Property } | null>(null);
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [showMarkerTooltip, setShowMarkerTooltip] = useState(false);
  const snapshotRef = useRef<HTMLDivElement>(null);

  const {
    properties,
    events,
    absoluteStart,
    absoluteEnd,
    timelineStart,
    timelineEnd,
    theme,
  } = useTimelineStore();

  // Debug: Log data when snapshot opens or data changes
  React.useEffect(() => {
    if (isOpen) {
      console.log('=== SNAPSHOT DATA UPDATED ===');
      console.log('Properties:', properties.length, properties);
      console.log('Events:', events.length, events);
      console.log('Date Range:', absoluteStart, 'to', absoluteEnd);
    }
  }, [isOpen, properties, events, absoluteStart, absoluteEnd]);

  // Auto-refresh when data changes while snapshot is open
  React.useEffect(() => {
    if (isOpen) {
      console.log('Data changed - snapshot will auto-refresh');
    }
  }, [properties.length, events.length]);

  // Calculate position as percentage with edge margins (5% on each side)
  const EDGE_MARGIN = 5; // 5% margin on left and right
  const getDatePosition = (date: Date): number => {
    const totalRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = date.getTime() - absoluteStart.getTime();
    const basePosition = (offset / totalRange) * 100;
    // Scale to 90% width (100 - 2*EDGE_MARGIN) and add left margin
    return EDGE_MARGIN + (basePosition * (100 - 2 * EDGE_MARGIN) / 100);
  };

  // Calculate viewport marker position
  const getViewportMarker = () => {
    const startPos = getDatePosition(timelineStart);
    const endPos = getDatePosition(timelineEnd);
    return {
      left: startPos,
      width: endPos - startPos,
    };
  };

  // Calculate event tiers for vertical stacking when events overlap
  const calculateEventTiers = (propertyEvents: TimelineEvent[]) => {
    const sortedEvents = [...propertyEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
    const tiers = new Map<string, number>();
    const overlapThreshold = 3; // Position percentage threshold for overlap

    sortedEvents.forEach((event, index) => {
      const eventPos = getDatePosition(event.date);
      let tier = 0;

      for (let i = 0; i < index; i++) {
        const prevEvent = sortedEvents[i];
        const prevPos = getDatePosition(prevEvent.date);
        const prevTier = tiers.get(prevEvent.id) || 0;

        if (Math.abs(eventPos - prevPos) < overlapThreshold && tier === prevTier) {
          tier = prevTier + 1;
        }
      }
      tiers.set(event.id, tier);
    });

    return tiers;
  };

  const viewportMarker = getViewportMarker();

  // Calculate maximum tiers for each property to determine spacing
  const propertyData = properties.map((property) => {
    const propertyEvents = events.filter((e) => e.propertyId === property.id);
    const tiers = calculateEventTiers(propertyEvents);
    const maxTier = propertyEvents.length > 0 ? Math.max(...Array.from(tiers.values())) : 0;
    return { property, maxTier, eventCount: propertyEvents.length };
  });

  // Calculate dynamic spacing to fit all properties in viewport
  // 30px gap between date markers and first property
  const availableHeight = typeof window !== 'undefined' ? window.innerHeight - 96 - 64 - 30 : 600;

  // Base spacing for property line + label
  const basePropertyHeight = 40;
  // Spacing per tier of events
  const tierSpacing = 35;

  // Calculate total "weight" (space needed) for all properties
  const totalWeight = propertyData.reduce((sum, { maxTier }) => {
    return sum + basePropertyHeight + (maxTier + 1) * tierSpacing;
  }, 0);

  // Calculate spacing scale factor
  const spacingScale = totalWeight > 0 ? availableHeight / totalWeight : 1;

  return (
    <div>
      {/* Floating Camera Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center transition-all duration-300 border-2 border-white/20"
            title="Open Timeline Snapshot"
          >
            <Camera className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="h-full w-full bg-white dark:bg-slate-950 overflow-hidden rounded-[10px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="h-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between rounded-t-[10px]">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      Timeline Snapshot
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(absoluteStart, 'MMM yyyy')} - {format(absoluteEnd, 'MMM yyyy')} •{' '}
                      {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} •{' '}
                      {events.length} {events.length === 1 ? 'Event' : 'Events'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Close Button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Snapshot Content */}
              <div className="h-[calc(100vh-96px)] overflow-hidden rounded-b-[10px]">
                <div
                  ref={snapshotRef}
                  data-snapshot-content="true"
                  className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-8 rounded-b-[10px] h-full"
                >
                  {/* Background Grid */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage:
                          'linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                      }}
                    />
                  </div>

                  {/* Date Markers at Top - 30px gap */}
                  <div className="relative h-12 mb-8">
                    {(() => {
                      const startYear = absoluteStart.getFullYear();
                      const endYear = absoluteEnd.getFullYear();
                      const yearCount = endYear - startYear + 1;
                      const markerInterval = yearCount > 20 ? 5 : yearCount > 10 ? 2 : 1;
                      const years = [];

                      for (let year = startYear; year <= endYear; year += markerInterval) {
                        const yearDate = new Date(year, 0, 1);
                        const position = getDatePosition(yearDate);
                        years.push({ year, position });
                      }

                      return years.map(({ year, position }) => (
                        <div
                          key={year}
                          className="absolute top-0"
                          style={{ left: `${position}%` }}
                        >
                          <div className="absolute -translate-x-1/2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded shadow-sm">
                            {year}
                          </div>
                          <div className="absolute top-10 w-px bg-slate-300 dark:bg-slate-600 -translate-x-1/2 opacity-40" style={{ height: `${availableHeight}px` }} />
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Viewport Position Marker - Excluded from download */}
                  <div
                    className="absolute top-20 bg-blue-500/15 dark:bg-blue-400/15 border-l-4 border-r-4 border-blue-500 dark:border-blue-400 z-20"
                    style={{
                      left: `${viewportMarker.left}%`,
                      width: `${viewportMarker.width}%`,
                      height: `${availableHeight}px`,
                    }}
                    data-html2canvas-ignore="true"
                  >
                    {/* Red Pin Icon */}
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white p-2 rounded-full shadow-lg z-30 cursor-pointer"
                      onMouseEnter={() => setShowMarkerTooltip(true)}
                      onMouseLeave={() => setShowMarkerTooltip(false)}
                    >
                      <MapPin className="w-5 h-5" fill="currentColor" />

                      {/* Tooltip */}
                      <AnimatePresence>
                        {showMarkerTooltip && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-xs font-semibold"
                          >
                            Current viewport position
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Vertical Red Line */}
                    <div
                      className="absolute top-8 bottom-0 w-1 bg-red-500 left-1/2 -translate-x-1/2 opacity-60 z-10 pointer-events-none"
                      style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
                    />
                  </div>

                  {/* Property Branches */}
                  <div className="relative px-20" style={{ height: `${availableHeight}px` }}>
                    {properties.map((property, propertyIndex) => {
                      const propertyEvents = events.filter((e) => e.propertyId === property.id).sort((a, b) => a.date.getTime() - b.date.getTime());
                      const eventTiers = calculateEventTiers(propertyEvents);

                      // Calculate Y position with dynamic spacing based on previous properties
                      const yOffset = propertyData
                        .slice(0, propertyIndex)
                        .reduce((sum, { maxTier }) => {
                          return sum + (basePropertyHeight + (maxTier + 1) * tierSpacing) * spacingScale;
                        }, 0);

                      // Determine property end date
                      const isSold = property.currentStatus === 'sold' || property.saleDate;
                      const saleEvent = propertyEvents.find((e) => e.type === 'sale');
                      const endDate = isSold
                        ? (property.saleDate || saleEvent?.date || absoluteEnd)
                        : absoluteEnd;

                      const startPos = getDatePosition(property.purchaseDate || propertyEvents[0]?.date || absoluteStart);
                      const endPos = getDatePosition(endDate);

                      return (
                        <div
                          key={property.id}
                          className="absolute left-0 right-0"
                          style={{ top: `${yOffset}px` }}
                        >
                          {/* Property Bar */}
                          <div
                            className="absolute h-2.5 rounded-full opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
                            style={{
                              backgroundColor: property.color,
                              left: `${startPos}%`,
                              width: `${endPos - startPos}%`,
                            }}
                            onMouseEnter={() => setHoveredProperty(property)}
                            onMouseLeave={() => setHoveredProperty(null)}
                          />

                          {/* Start Circle with Home Icon - Double size, 10px radius */}
                          <div
                            className="absolute w-8 h-8 border-2 border-white dark:border-slate-900 shadow-md -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                            style={{
                              backgroundColor: property.color,
                              left: `${startPos}%`,
                              top: '5px',
                              borderRadius: '10px',
                            }}
                            onMouseEnter={() => setHoveredProperty(property)}
                            onMouseLeave={() => setHoveredProperty(null)}
                          >
                            <Home className="w-5 h-5 text-white" />
                          </div>

                          {/* End Circle with Home Icon - Double size, 10px radius */}
                          <div
                            className="absolute w-8 h-8 border-2 border-white dark:border-slate-900 shadow-md -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                            style={{
                              backgroundColor: property.color,
                              left: `${endPos}%`,
                              top: '5px',
                              borderRadius: '10px',
                            }}
                            onMouseEnter={() => setHoveredProperty(property)}
                            onMouseLeave={() => setHoveredProperty(null)}
                          >
                            <Home className="w-5 h-5 text-white" />
                          </div>

                          {/* Property Label */}
                          <div
                            className="absolute -top-7 text-xs font-bold truncate max-w-xs cursor-pointer hover:underline"
                            style={{ color: property.color, left: `${startPos}%` }}
                            onMouseEnter={() => setHoveredProperty(property)}
                            onMouseLeave={() => setHoveredProperty(null)}
                          >
                            {property.name}
                          </div>

                          {/* Property Hover Tooltip */}
                          <AnimatePresence>
                            {hoveredProperty?.id === property.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl z-50 pointer-events-none min-w-[220px]"
                              >
                                <div className="text-sm font-bold mb-2" style={{ color: property.color }}>
                                  {property.name}
                                </div>
                                {property.address && (
                                  <div className="text-xs opacity-75 mb-2">
                                    {property.address}
                                  </div>
                                )}
                                <div className="text-xs opacity-90 mb-1">
                                  Status: <span className="font-semibold capitalize">{property.currentStatus || 'Unknown'}</span>
                                </div>
                                {property.purchaseDate && (
                                  <div className="text-xs opacity-90">
                                    Purchased: {format(property.purchaseDate, 'MMM dd, yyyy')}
                                  </div>
                                )}
                                {property.saleDate && (
                                  <div className="text-xs opacity-90">
                                    Sold: {format(property.saleDate, 'MMM dd, yyyy')}
                                  </div>
                                )}
                                {property.purchasePrice && (
                                  <div className="text-xs opacity-90 mt-2">
                                    Purchase Price: ${property.purchasePrice.toLocaleString()}
                                  </div>
                                )}
                                {property.salePrice && (
                                  <div className="text-xs opacity-90">
                                    Sale Price: ${property.salePrice.toLocaleString()}
                                  </div>
                                )}
                                <div className="text-xs opacity-60 mt-2 border-t border-white/20 dark:border-slate-900/20 pt-2">
                                  {propertyEvents.length} {propertyEvents.length === 1 ? 'event' : 'events'}
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Events with Tier Stacking */}
                          {propertyEvents.map((event) => {
                            const eventPos = getDatePosition(event.date);
                            const tier = eventTiers.get(event.id) || 0;
                            const tierOffset = tier * tierSpacing;
                            const baseOffset = 20;

                            return (
                              <div
                                key={event.id}
                                className="absolute -translate-x-1/2"
                                style={{
                                  left: `${eventPos}%`,
                                  top: `${baseOffset + tierOffset}px`,
                                }}
                              >
                                {/* Event Dot */}
                                <div
                                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm -top-3 pointer-events-none z-10"
                                  style={{ backgroundColor: event.color }}
                                />

                                {/* Event Card with Hover */}
                                <div className="relative z-40">
                                  <motion.div
                                    className="px-2.5 py-1.5 rounded-lg shadow-md cursor-pointer border border-white dark:border-slate-900 flex items-center gap-1.5 relative z-40"
                                    style={{ backgroundColor: event.color }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    onMouseEnter={() => {
                                      console.log('Hovering event:', event.title);
                                      setHoveredEvent({ event, property });
                                    }}
                                    onMouseLeave={() => {
                                      console.log('Leaving event:', event.title);
                                      setHoveredEvent(null);
                                    }}
                                  >
                                    {(() => {
                                      const EventIcon = getEventIcon(event.type);
                                      return <EventIcon className="w-3 h-3 text-white flex-shrink-0" />;
                                    })()}
                                    <div className="text-xs font-semibold text-white whitespace-nowrap">
                                      {event.title}
                                    </div>
                                  </motion.div>

                                  {/* Enhanced Hover Card */}
                                  <AnimatePresence>
                                    {hoveredEvent?.event.id === event.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                        className="fixed bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-2xl z-[9999] min-w-[280px] max-w-[360px] pointer-events-none border border-white/10"
                                        style={{
                                          left: '50%',
                                          top: '50%',
                                          transform: 'translate(-50%, -50%)',
                                        }}
                                      >
                                        {/* Title and Type */}
                                        <div className="text-sm font-bold mb-1">
                                          {event.title}
                                        </div>
                                        <div className="text-xs opacity-75 mb-2 capitalize">
                                          {event.type.replace('_', ' ')}
                                        </div>

                                        {/* Date Information */}
                                        <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                                          <div className="text-xs font-semibold">
                                            Date: {format(event.date, 'MMM dd, yyyy')}
                                          </div>
                                          {event.contractDate && (
                                            <div className="text-xs opacity-90">
                                              Contract: {format(event.contractDate, 'MMM dd, yyyy')}
                                            </div>
                                          )}
                                          {event.settlementDate && (
                                            <div className="text-xs opacity-90">
                                              Settlement: {format(event.settlementDate, 'MMM dd, yyyy')}
                                            </div>
                                          )}
                                        </div>

                                        {/* Price Information */}
                                        {(event.amount || event.landPrice || event.buildingPrice) && (
                                          <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                                            {event.amount && (
                                              <div className="text-xs font-semibold">
                                                Amount: ${event.amount.toLocaleString()}
                                              </div>
                                            )}
                                            {event.landPrice && (
                                              <div className="text-xs opacity-90">
                                                Land: ${event.landPrice.toLocaleString()}
                                              </div>
                                            )}
                                            {event.buildingPrice && (
                                              <div className="text-xs opacity-90">
                                                Building: ${event.buildingPrice.toLocaleString()}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Fees and Costs */}
                                        {(event.stampDuty || event.purchaseLegalFees || event.valuationFees || event.purchaseAgentFees) && (
                                          <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                                            <div className="text-xs font-semibold opacity-75">Associated Costs:</div>
                                            {event.stampDuty && (
                                              <div className="text-xs opacity-90">
                                                Stamp Duty: ${event.stampDuty.toLocaleString()}
                                              </div>
                                            )}
                                            {event.purchaseLegalFees && (
                                              <div className="text-xs opacity-90">
                                                Legal Fees: ${event.purchaseLegalFees.toLocaleString()}
                                              </div>
                                            )}
                                            {event.valuationFees && (
                                              <div className="text-xs opacity-90">
                                                Valuation: ${event.valuationFees.toLocaleString()}
                                              </div>
                                            )}
                                            {event.purchaseAgentFees && (
                                              <div className="text-xs opacity-90">
                                                Agent Fees: ${event.purchaseAgentFees.toLocaleString()}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Description */}
                                        {event.description && (
                                          <div className="text-xs opacity-75 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                                            {event.description}
                                          </div>
                                        )}

                                        {/* PPR Status */}
                                        {event.isPPR !== undefined && (
                                          <div className="text-xs opacity-90 mb-2">
                                            {event.isPPR ? '🏠 Primary Residence' : '💼 Investment Property'}
                                          </div>
                                        )}

                                        {/* Property Name */}
                                        <div className="text-xs opacity-60 mt-2 pt-2 border-t border-white/20 dark:border-slate-900/20">
                                          Property: {property.name}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty State */}
                  {properties.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-slate-400 dark:text-slate-600">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-semibold">No timeline data yet</p>
                        <p className="text-sm mt-2">Add properties and events to see your timeline</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
