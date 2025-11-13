'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, MapPin, Calendar, DollarSign, Home, TrendingUp } from 'lucide-react';
import { useTimelineStore, Property, TimelineEvent } from '@/store/timeline';
import { cn, dateToPosition, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface TimelineSnapshotProps {
  className?: string;
}

export default function TimelineSnapshot({ className }: TimelineSnapshotProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const miniTimelineRef = useRef<HTMLDivElement>(null);

  const {
    properties,
    events,
    absoluteStart,
    absoluteEnd,
    theme,
  } = useTimelineStore();

  const handleOpen = () => {
    setIsFullscreen(true);
  };

  const handleClose = () => {
    setIsFullscreen(false);
    setSelectedProperty(null);
  };

  const handlePropertyClick = (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    setSelectedProperty(property);
  };

  const getPropertyEvents = (propertyId: string) => {
    return events
      .filter((e) => e.propertyId === propertyId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getPropertyStats = (property: Property) => {
    const propertyEvents = getPropertyEvents(property.id);
    const purchaseEvent = propertyEvents.find(e => e.type === 'purchase');
    const saleEvent = propertyEvents.find(e => e.type === 'sale');

    const totalEvents = propertyEvents.length;
    const purchasePrice = property.purchasePrice || purchaseEvent?.amount;
    const salePrice = property.salePrice || saleEvent?.amount;
    const gain = salePrice && purchasePrice ? salePrice - purchasePrice : null;
    const gainPercent = gain && purchasePrice ? (gain / purchasePrice) * 100 : null;

    return {
      totalEvents,
      purchasePrice,
      salePrice,
      gain,
      gainPercent,
      purchaseDate: property.purchaseDate || purchaseEvent?.date,
      saleDate: property.saleDate || saleEvent?.date,
    };
  };

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedProperty) {
          setSelectedProperty(null);
        } else {
          handleClose();
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isFullscreen, selectedProperty]);

  return (
    <>
      {/* Floating Camera Button */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className={cn(
              'fixed bottom-6 right-6 z-40',
              'w-14 h-14 rounded-full shadow-lg',
              'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
              'flex items-center justify-center',
              'transition-all duration-300',
              'border-2 border-white/20',
              className
            )}
            title="Open Timeline Overview"
          >
            <Camera className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 3/4 Screen Overlay - 75vh height, centered vertically */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8"
            style={{ isolation: 'isolate' }}
            onClick={handleClose}
          >
            {/* 3/4 height container (75vh) */}
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-7xl"
              style={{ height: '75vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="h-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      Timeline Overview
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(absoluteStart, 'MMM yyyy')} - {format(absoluteEnd, 'MMM yyyy')} •
                      {' '}{properties.length} {properties.length === 1 ? 'Property' : 'Properties'} •
                      {' '}{events.length} {events.length === 1 ? 'Event' : 'Events'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Close Timeline Overview"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Timeline Content - Takes remaining height */}
              <div className="relative h-[calc(75vh-64px)] overflow-hidden">
                {/* UPDATED: 40px margin on left and right */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 mx-10">

                  {/* Background Grid */}
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage:
                          'linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                      }}
                    />
                  </div>

                  {/* UPDATED: Year markers at TOP - moved 60px higher to not touch events */}
                  {properties.length > 0 && (() => {
                    const startYear = absoluteStart.getFullYear();
                    const endYear = absoluteEnd.getFullYear();
                    const yearCount = endYear - startYear + 1;
                    const markerInterval = yearCount > 20 ? 5 : yearCount > 10 ? 2 : 1;
                    const years = [];

                    for (let year = startYear; year <= endYear; year += markerInterval) {
                      const yearDate = new Date(year, 0, 1);
                      const position = dateToPosition(yearDate, absoluteStart, absoluteEnd);
                      years.push({ year, position });
                    }

                    return (
                      <div className="absolute top-2 left-0 right-0 h-20 px-16">
                        {years.map(({ year, position }) => (
                          <div
                            key={year}
                            className="absolute"
                            style={{ left: `${position}%` }}
                          >
                            {/* Year label at top - positioned higher */}
                            <div className="absolute top-0 -translate-x-1/2 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded shadow-sm">
                              {year}
                            </div>
                            {/* Year marker line extending down - starts lower to accommodate higher dates */}
                            <div className="absolute top-12 w-px h-full bg-slate-300 dark:bg-slate-600 -translate-x-1/2 opacity-30" />
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* UPDATED: Property Branches - dynamic spacing based on event count */}
                  {properties.length > 0 && (() => {
                    // Calculate spacing between properties based on max events per property
                    const propertyEvents = properties.map(p =>
                      events.filter(e => e.propertyId === p.id)
                    );
                    const maxEventsPerProperty = Math.max(...propertyEvents.map(events => events.length), 1);

                    // Adjust vertical spacing: more events = more space between properties
                    const baseSpacing = 60; // 60% of container for properties
                    const startPos = 25; // Start at 25% from top
                    const spacingPerProperty = baseSpacing / Math.max(properties.length - 1, 1);

                    return (
                      <div className="absolute inset-0 px-20">
                        {properties.map((property, index) => {
                          const yPos = startPos + (index * spacingPerProperty);
                          const propertyEventList = events.filter(e => e.propertyId === property.id);

                          return (
                            <div
                              key={property.id}
                              className="absolute left-0 right-0"
                              style={{ top: `${yPos}%` }}
                            >
                            {/* UPDATED: Property Line - SOLID like main timeline */}
                            <motion.div
                              className="absolute h-2 rounded-full opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                backgroundColor: property.color,
                                left: '0%',
                                right: '0%',
                              }}
                              onClick={(e) => handlePropertyClick(e, property)}
                              whileHover={{ scaleY: 1.2 }}
                              title="Click for property details"
                            />

                            {/* UPDATED: Property start circle (bigger - 20px) */}
                            <div
                              className="absolute left-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-lg -translate-y-1/2"
                              style={{
                                backgroundColor: property.color,
                                top: '4px',
                              }}
                            />

                            {/* UPDATED: Property end circle (bigger - 20px) */}
                            <div
                              className="absolute right-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-lg -translate-y-1/2"
                              style={{
                                backgroundColor: property.color,
                                top: '4px',
                              }}
                            />

                            {/* Property Label - CLICKABLE */}
                            <motion.div
                              className="absolute -top-8 left-2 text-sm font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[300px] cursor-pointer hover:underline"
                              style={{ color: property.color }}
                              onClick={(e) => handlePropertyClick(e, property)}
                              whileHover={{ scale: 1.05 }}
                              title="Click for property details"
                            >
                              {property.name}
                            </motion.div>

                            {/* UPDATED: Events as boxes with dots, proper z-index for overlaps */}
                            {events
                              .filter((e) => e.propertyId === property.id)
                              .map((event, eventIndex) => {
                                const eventPos = dateToPosition(
                                  event.date,
                                  absoluteStart,
                                  absoluteEnd
                                );
                                const isHovered = hoveredEventId === event.id;
                                // Position tooltip above for last 2 properties to prevent cutoff
                                const isBottomProperty = index >= properties.length - 2;

                                return (
                                  <div
                                    key={event.id}
                                    className="absolute -translate-x-1/2"
                                    style={{
                                      left: `${eventPos}%`,
                                      top: '-4px', // UPDATED: Align with property line center
                                      // UPDATED: Hovered events come to front
                                      zIndex: isHovered ? 100 : 10 + eventIndex,
                                    }}
                                    onMouseEnter={() => setHoveredEventId(event.id)}
                                    onMouseLeave={() => setHoveredEventId(null)}
                                  >
                                    {/* UPDATED: Circle on the timeline */}
                                    <div
                                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md"
                                      style={{
                                        backgroundColor: event.color,
                                        top: '0', // Centered on the line
                                      }}
                                    />

                                    {/* UPDATED: Event Box with 10px border radius */}
                                    <motion.div
                                      className={cn(
                                        "px-3 py-2 shadow-md cursor-pointer mt-3",
                                        "border-2 border-white dark:border-slate-900",
                                        "text-xs font-semibold text-white whitespace-nowrap"
                                      )}
                                      style={{
                                        backgroundColor: event.color,
                                        borderRadius: '10px', // UPDATED: 10px border radius
                                      }}
                                      whileHover={{ scale: 1.1, y: -4 }}
                                      animate={{
                                        scale: isHovered ? 1.05 : 1,
                                        y: isHovered ? -2 : 0
                                      }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      {/* Event name (title) */}
                                      {event.title}
                                    </motion.div>

                                    {/* UPDATED: Tooltip positioned based on property location */}
                                    <AnimatePresence>
                                      {isHovered && (
                                        <motion.div
                                          initial={{ opacity: 0, y: isBottomProperty ? -5 : 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: isBottomProperty ? -5 : 5 }}
                                          className={cn(
                                            "absolute left-1/2 -translate-x-1/2 pointer-events-none",
                                            isBottomProperty ? "bottom-full mb-2" : "top-full mt-2"
                                          )}
                                          style={{ zIndex: 200 }}
                                        >
                                          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                                            <div className="text-xs font-bold">
                                              {format(event.date, 'MMM dd, yyyy')}
                                            </div>
                                            {event.amount && (
                                              <div className="text-xs opacity-90 mt-0.5">
                                                {formatCurrency(event.amount)}
                                              </div>
                                            )}
                                            <div className="text-xs opacity-75 mt-0.5">
                                              {property.name}
                                            </div>
                                            {/* Tooltip arrow - points down for bottom properties, up for others */}
                                            <div
                                              className={cn(
                                                "absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45",
                                                isBottomProperty ? "-bottom-1" : "-top-1"
                                              )}
                                            />
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty State */}
                  {properties.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-slate-400 dark:text-slate-600">
                        <Camera className="w-16 h-16 mx-auto mb-2 opacity-30" />
                        <p className="text-base">No timeline data yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Details Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setSelectedProperty(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-700"
                style={{ backgroundColor: `${selectedProperty.color}20` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Home
                      className="w-8 h-8 mt-1"
                      style={{ color: selectedProperty.color }}
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {selectedProperty.name}
                      </h3>
                      {selectedProperty.address && (
                        <div className="flex items-center gap-2 mt-1 text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{selectedProperty.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProperty(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                {/* Property Statistics */}
                {(() => {
                  const stats = getPropertyStats(selectedProperty);
                  return (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Status */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-200 capitalize">
                          {selectedProperty.currentStatus || 'Unknown'}
                        </div>
                      </div>

                      {/* Total Events */}
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Events</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          {stats.totalEvents}
                        </div>
                      </div>

                      {/* Purchase Price */}
                      {stats.purchasePrice && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <div className="text-xs text-green-600 dark:text-green-400">Purchase Price</div>
                          </div>
                          <div className="text-lg font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(stats.purchasePrice)}
                          </div>
                          {stats.purchaseDate && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {format(stats.purchaseDate, 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sale Price */}
                      {stats.salePrice && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <div className="text-xs text-blue-600 dark:text-blue-400">Sale Price</div>
                          </div>
                          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                            {formatCurrency(stats.salePrice)}
                          </div>
                          {stats.saleDate && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {format(stats.saleDate, 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Capital Gain */}
                      {stats.gain !== null && (
                        <div className={cn(
                          "p-4 rounded-lg border col-span-2",
                          stats.gain >= 0
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                        )}>
                          <div className="text-xs mb-1"
                            style={{ color: stats.gain >= 0 ? '#059669' : '#dc2626' }}
                          >
                            Capital Gain
                          </div>
                          <div className="flex items-baseline gap-3">
                            <div className="text-2xl font-bold"
                              style={{ color: stats.gain >= 0 ? '#047857' : '#b91c1c' }}
                            >
                              {formatCurrency(Math.abs(stats.gain))}
                            </div>
                            {stats.gainPercent !== null && (
                              <div className="text-sm font-semibold"
                                style={{ color: stats.gain >= 0 ? '#059669' : '#dc2626' }}
                              >
                                ({stats.gainPercent >= 0 ? '+' : ''}{stats.gainPercent.toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Events Timeline */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event History
                  </h4>
                  <div className="space-y-2">
                    {getPropertyEvents(selectedProperty.id).map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {event.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {format(event.date, 'MMM dd, yyyy')}
                            </div>
                          </div>
                          {event.amount && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {formatCurrency(event.amount)}
                            </div>
                          )}
                          {event.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
