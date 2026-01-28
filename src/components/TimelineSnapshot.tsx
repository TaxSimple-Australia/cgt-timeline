'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import {
  Camera, X, Download, ZoomIn, ZoomOut, LayoutGrid
} from 'lucide-react';
import { useTimelineStore, Property, TimelineEvent, EventType } from '@/store/timeline';
import { format } from 'date-fns';
import ProjectRoadmapView from './timeline-viz/snapshot/ProjectRoadmapView';
import GanttChartView from './timeline-viz/snapshot/GanttChartView';
import HorizontalTimelineBarView from './timeline-viz/snapshot/HorizontalTimelineBarView';
import PhaseTimelineView from './timeline-viz/snapshot/PhaseTimelineView';

type SnapshotView = 'timeline' | 'roadmap' | 'gantt' | 'horizontal' | 'phase';

export default function TimelineSnapshot() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<SnapshotView>('gantt');
  const [clickedEvent, setClickedEvent] = useState<{ event: TimelineEvent; property: Property; clientX: number; clientY: number } | null>(null);
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [hoveredPropertyElement, setHoveredPropertyElement] = useState<{ property: Property; rect: DOMRect } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<{ event: TimelineEvent; property: Property; rect: DOMRect } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom percentage: 50%, 75%, 100%
  const [isDownloading, setIsDownloading] = useState(false);
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

  // Calculate event tiers for vertical stacking when events overlap
  const calculateEventTiers = (propertyEvents: TimelineEvent[]) => {
    const sortedEvents = [...propertyEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
    const tiers = new Map<string, number>();
    const overlapThreshold = 8; // Position percentage threshold for overlap (increased for better spacing)

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

  // Calculate popup position near cursor while keeping it on screen
  const calculatePopupPosition = (clientX: number, clientY: number) => {
    const POPUP_WIDTH = 400; // max-w-[400px]
    const POPUP_MAX_HEIGHT = window.innerHeight * 0.9; // max-h-[90vh]
    const MARGIN = 16; // margin from edges
    const OFFSET = 12; // offset from cursor

    let left = clientX + OFFSET;
    let top = clientY + OFFSET;

    // Check right edge
    if (left + POPUP_WIDTH + MARGIN > window.innerWidth) {
      // Try positioning to the left of cursor
      left = clientX - POPUP_WIDTH - OFFSET;

      // If still off screen, align to right edge
      if (left < MARGIN) {
        left = window.innerWidth - POPUP_WIDTH - MARGIN;
      }
    }

    // Check left edge
    if (left < MARGIN) {
      left = MARGIN;
    }

    // Check bottom edge
    if (top + POPUP_MAX_HEIGHT + MARGIN > window.innerHeight) {
      // Try positioning above cursor
      top = clientY - POPUP_MAX_HEIGHT - OFFSET;

      // If still off screen, align to bottom edge
      if (top < MARGIN) {
        top = window.innerHeight - POPUP_MAX_HEIGHT - MARGIN;
      }
    }

    // Check top edge
    if (top < MARGIN) {
      top = MARGIN;
    }

    return { left, top };
  };

  // Handle download snapshot as PNG
  const handleDownload = async () => {
    if (!snapshotRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      console.log('Starting fresh PNG generation...');

      // Small delay to ensure all React state updates are flushed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force a fresh capture with current DOM state
      const timestamp = new Date().getTime();
      console.log(`Capturing snapshot at ${timestamp}`);

      // Find the actual content boundaries by measuring rendered elements
      const contentElement = snapshotRef.current.querySelector('[data-snapshot-content="true"]');
      if (!contentElement) {
        throw new Error('Snapshot content element not found');
      }

      // Get the bounding box of the content area
      const contentRect = contentElement.getBoundingClientRect();
      const containerRect = snapshotRef.current.getBoundingClientRect();

      // Calculate header height (everything before content)
      const headerHeight = contentRect.top - containerRect.top;

      // Find the last property element to determine actual content height
      const propertyElements = contentElement.querySelectorAll('.absolute.left-0.right-0');
      let maxBottom = 0;
      propertyElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const relativeBottom = rect.bottom - contentRect.top;
        maxBottom = Math.max(maxBottom, relativeBottom);
      });

      // Add padding for labels and markers
      const bottomPadding = 100;
      const actualContentHeight = headerHeight + maxBottom + bottomPadding;

      console.log(`Capturing height: ${actualContentHeight}px (measured from actual content)`);

      const canvas = await html2canvas(snapshotRef.current, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher quality for better text rendering
        logging: false,
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        foreignObjectRendering: false, // Better compatibility
        windowWidth: snapshotRef.current.scrollWidth,
        windowHeight: actualContentHeight,
        scrollX: 0,
        scrollY: 0,
        // Capture only actual content, not excess white space
        width: snapshotRef.current.scrollWidth,
        height: actualContentHeight,
        ignoreElements: (element) => {
          // Skip elements marked as html2canvas-ignore
          return element.hasAttribute('data-html2canvas-ignore');
        },
      });

      // Generate unique filename with precise timestamp
      const filename = `timeline-snapshot-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.png`;
      console.log(`Generating PNG: ${filename}`);

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();

      console.log('PNG download complete');
    } catch (error) {
      console.error('Failed to download snapshot:', error);
      alert('Failed to download snapshot. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate maximum tiers for each property to determine spacing
  const propertyData = properties.map((property) => {
    const propertyEvents = events.filter((e) => e.propertyId === property.id);
    const tiers = calculateEventTiers(propertyEvents);
    const maxTier = propertyEvents.length > 0 ? Math.max(...Array.from(tiers.values())) : 0;
    return { property, maxTier, eventCount: propertyEvents.length };
  });

  // Calculate dynamic spacing to fit all properties
  // Responsive spacing based on number of properties
  const propertyCount = properties.length;
  const hasManyProperties = propertyCount >= 6;

  // Base spacing for property line + label (reduced when many properties)
  const basePropertyHeight = hasManyProperties ? 60 : 80;
  // Spacing per tier of events (reduced when many properties)
  const tierSpacing = hasManyProperties ? 45 : 55;

  // Calculate total "weight" (space needed) for all properties
  const totalWeight = propertyData.reduce((sum, { maxTier }) => {
    return sum + basePropertyHeight + (maxTier + 1) * tierSpacing;
  }, 0);

  // Calculate available height - constrained to viewport
  const availableHeight = typeof window !== 'undefined' ? Math.max(window.innerHeight - 96 - 64 - 30, 700) : 700;

  // Calculate compression scale to fit all properties in available space
  const spacingScale = totalWeight > 0 ? Math.min(availableHeight / totalWeight, 1) : 1;

  return (
    <div>
      {/* Floating Camera Button - positioned bottom left next to Timeline Visualizations */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 left-[72px] z-40 w-10 h-10 rounded-full shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center transition-all duration-300"
            title="Open Timeline Snapshot"
          >
            <Camera className="w-5 h-5 text-white" />
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
              {/* Wrapper for Export - Includes Header + Content */}
              <div
                ref={snapshotRef}
                className="h-full w-full flex flex-col overflow-hidden rounded-[10px]"
              >
                {/* Header */}
                <div className="h-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between rounded-t-[10px] flex-shrink-0">
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
                  <div className="flex items-center gap-2" data-html2canvas-ignore="true">
                    {/* View Selector - Hidden from export */}
                    <div className="flex items-center gap-2 border-r border-slate-300 dark:border-slate-600 pr-2">
                      <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <select
                        value={selectedView}
                        onChange={(e) => setSelectedView(e.target.value as SnapshotView)}
                        className="text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="timeline">Timeline</option>
                        <option value="gantt">Gantt Chart</option>
                        <option value="roadmap">Project Roadmap</option>
                        <option value="horizontal">Horizontal Timeline</option>
                        <option value="phase">Phase Timeline</option>
                      </select>
                    </div>
                    {/* Zoom Controls - Hidden from export (only for timeline view) */}
                    {selectedView === 'timeline' && (
                      <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-600 pr-2">
                        <button
                          onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                          disabled={zoomLevel <= 50}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 min-w-[40px] text-center">
                          {zoomLevel}%
                        </span>
                        <button
                          onClick={() => setZoomLevel(Math.min(100, zoomLevel + 25))}
                          disabled={zoomLevel >= 100}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                      </div>
                    )}
                    {/* Download Button - Hidden from export */}
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className={`p-2.5 rounded-lg transition-colors ${
                        isDownloading
                          ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                          : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      }`}
                      title={isDownloading ? "Generating PNG..." : "Download as PNG"}
                    >
                      {isDownloading ? (
                        <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                    {/* Close Button - Hidden from export */}
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
                <div className="flex-1 overflow-auto rounded-b-[10px]">
                  <div
                    data-snapshot-content="true"
                    className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8 min-h-full"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top left',
                      width: `${100 / (zoomLevel / 100)}%`,
                    }}
                    onClick={() => {
                      // Close popup when clicking background
                      if (clickedEvent) {
                        setClickedEvent(null);
                      }
                    }}
                  >
                  {/* Timeline View */}
                  {selectedView === 'timeline' && (
                    <>
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
                              <div className="absolute -translate-x-1/2 text-sm font-bold text-slate-800 dark:text-slate-200 bg-white/95 dark:bg-slate-800/95 px-3 py-1 rounded shadow-md">
                                {year}
                              </div>
                              <div className="absolute top-10 w-px bg-slate-300 dark:bg-slate-600 -translate-x-1/2 opacity-30" style={{ height: `${availableHeight}px` }} />
                            </div>
                          ));
                        })()}
                      </div>


                      {/* Property Branches */}
                      <div className="relative px-12" style={{ height: `${availableHeight}px` }}>
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
                              zIndex: hoveredProperty?.id === property.id ? 8 : 2,
                            }}
                            onMouseEnter={(e) => {
                              setHoveredProperty(property);
                              setHoveredPropertyElement({ property, rect: e.currentTarget.getBoundingClientRect() });
                            }}
                            onMouseLeave={() => {
                              setHoveredProperty(null);
                              setHoveredPropertyElement(null);
                            }}
                          />

                          {/* Start Circle - Solid with inner dot */}
                          <div
                            className="absolute w-7 h-7 rounded-full border-3 border-white dark:border-slate-900 shadow-md -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                            style={{
                              backgroundColor: property.color,
                              left: `${startPos}%`,
                              top: '5px',
                              zIndex: hoveredProperty?.id === property.id ? 8 : 3,
                            }}
                            onMouseEnter={(e) => {
                              setHoveredProperty(property);
                              setHoveredPropertyElement({ property, rect: e.currentTarget.getBoundingClientRect() });
                            }}
                            onMouseLeave={() => {
                              setHoveredProperty(null);
                              setHoveredPropertyElement(null);
                            }}
                          >
                            {/* Inner white dot to differentiate start */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                          </div>

                          {/* End Circle - Hollow/ring style */}
                          <div
                            className="absolute w-7 h-7 rounded-full border-3 shadow-md -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                            style={{
                              backgroundColor: 'white',
                              borderColor: property.color,
                              left: `${endPos}%`,
                              top: '5px',
                              zIndex: hoveredProperty?.id === property.id ? 8 : 3,
                            }}
                            onMouseEnter={(e) => {
                              setHoveredProperty(property);
                              setHoveredPropertyElement({ property, rect: e.currentTarget.getBoundingClientRect() });
                            }}
                            onMouseLeave={() => {
                              setHoveredProperty(null);
                              setHoveredPropertyElement(null);
                            }}
                          />

                          {/* Property Label - Inside left padding */}
                          <div
                            className="absolute font-bold cursor-pointer hover:underline whitespace-nowrap px-2 py-1 rounded"
                            style={{
                              color: property.color,
                              left: '4px',
                              top: '-4px',
                              fontSize: hasManyProperties ? '10px' : '12px',
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              zIndex: hoveredProperty?.id === property.id ? 8 : 4,
                              maxWidth: hasManyProperties ? '200px' : '240px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            onMouseEnter={(e) => {
                              setHoveredProperty(property);
                              setHoveredPropertyElement({ property, rect: e.currentTarget.getBoundingClientRect() });
                            }}
                            onMouseLeave={() => {
                              setHoveredProperty(null);
                              setHoveredPropertyElement(null);
                            }}
                            title={property.name}
                          >
                            {property.name}
                          </div>


                          {/* Events with Tier Stacking - Circle View */}
                          {propertyEvents.map((event) => {
                            const eventPos = getDatePosition(event.date);
                            const tier = eventTiers.get(event.id) || 0;
                            const tierOffset = tier * tierSpacing;
                            const baseOffset = 20;
                            const isPropertyHovered = hoveredProperty?.id === property.id;
                            const isEventHovered = hoveredEvent?.event.id === event.id;
                            const LABEL_GAP = 10; // Circle radius (8px) + 2px gap below circle

                            // Check if label is long (more than 3 words)
                            const wordCount = event.title.trim().split(/\s+/).length;
                            const isLongLabel = wordCount > 3;

                            return (
                              <div
                                key={event.id}
                                className="absolute -translate-x-1/2"
                                style={{
                                  left: `${eventPos}%`,
                                  top: `${baseOffset + tierOffset}px`,
                                  zIndex: isPropertyHovered || isEventHovered ? 9 : 5,
                                }}
                              >
                                {/* Dashed connector line from property bar to event circle */}
                                <div
                                  className="absolute left-1/2 -translate-x-1/2"
                                  style={{
                                    width: '2px',
                                    height: `${baseOffset + tierOffset}px`,
                                    bottom: '0',
                                    backgroundImage: `linear-gradient(to bottom, ${event.color} 50%, transparent 50%)`,
                                    backgroundSize: '2px 8px',
                                    backgroundRepeat: 'repeat-y',
                                    opacity: 0.6,
                                    zIndex: 1,
                                  }}
                                />

                                {/* Main Event Circle - Like timeline circle view */}
                                <div
                                  className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md cursor-pointer hover:scale-110 transition-transform"
                                  style={{
                                    backgroundColor: event.color,
                                    zIndex: isPropertyHovered || isEventHovered ? 10 : 7,
                                  }}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredEvent({ event, property, rect });
                                    setHoveredProperty(property);
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredEvent(null);
                                  }}
                                />

                                {/* Label below circle - always 2px gap */}
                                <div
                                  className={`absolute font-semibold text-slate-900 rounded pointer-events-none ${isLongLabel ? '' : 'text-xs'}`}
                                  style={{
                                    left: '50%',
                                    top: `${LABEL_GAP}px`,
                                    transform: 'translateX(-50%)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    minHeight: isLongLabel ? '32px' : '24px',
                                    ...(isLongLabel ? {
                                      fontSize: '10px',
                                      width: '150px',
                                      wordWrap: 'break-word',
                                      lineHeight: '13px',
                                      paddingTop: '6px',
                                      paddingBottom: '6px',
                                      paddingLeft: '8px',
                                      paddingRight: '8px',
                                    } : {
                                      whiteSpace: 'nowrap',
                                      lineHeight: '12px',
                                      paddingTop: '6px',
                                      paddingBottom: '6px',
                                      paddingLeft: '8px',
                                      paddingRight: '8px',
                                    }),
                                  }}
                                  title={event.title}
                                >
                                  {event.title}
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
                    </>
                  )}

                  {/* Gantt Chart View */}
                  {selectedView === 'gantt' && (
                    <GanttChartView
                      properties={properties}
                      events={events}
                      absoluteStart={absoluteStart}
                      absoluteEnd={absoluteEnd}
                    />
                  )}

                  {/* Project Roadmap View */}
                  {selectedView === 'roadmap' && (
                    <ProjectRoadmapView
                      properties={properties}
                      events={events}
                      absoluteStart={absoluteStart}
                      absoluteEnd={absoluteEnd}
                    />
                  )}

                  {/* Horizontal Timeline Bar View */}
                  {selectedView === 'horizontal' && (
                    <HorizontalTimelineBarView
                      properties={properties}
                      events={events}
                      absoluteStart={absoluteStart}
                      absoluteEnd={absoluteEnd}
                    />
                  )}

                  {/* Phase Timeline View */}
                  {selectedView === 'phase' && (
                    <PhaseTimelineView
                      properties={properties}
                      events={events}
                      absoluteStart={absoluteStart}
                      absoluteEnd={absoluteEnd}
                    />
                  )}
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Popup - Rendered via Portal at Document Body Level */}
      {typeof document !== 'undefined' && clickedEvent && createPortal(
        <AnimatePresence>
          {(() => {
            const popupPosition = calculatePopupPosition(clickedEvent.clientX, clickedEvent.clientY);
            console.log('Popup position:', popupPosition, 'Cursor:', clickedEvent.clientX, clickedEvent.clientY);
            return (
              <motion.div
                key="event-popup"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="fixed bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-2xl min-w-[320px] max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-blue-500"
                style={{
                  top: `${popupPosition.top}px`,
                  left: `${popupPosition.left}px`,
                  maxWidth: 'calc(100vw - 32px)',
                  maxHeight: 'calc(100vh - 32px)',
                  zIndex: 99999,
                  transform: 'none',
                  position: 'fixed',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setClickedEvent(null);
                      }}
                      className="absolute top-2 right-2 p-1 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded transition-colors"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* Title and Type */}
                    <div className="text-sm font-bold mb-1">
                      {clickedEvent.event.title}
                    </div>
                    <div className="text-xs opacity-75 mb-2 capitalize">
                      {clickedEvent.event.type === 'refinance' ? 'Inherit' : clickedEvent.event.type.replace('_', ' ')}
                    </div>

                    {/* Date Information */}
                    <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                      <div className="text-xs font-semibold">
                        Date: {format(clickedEvent.event.date, 'MMM dd, yyyy')}
                      </div>
                      {clickedEvent.event.contractDate && (
                        <div className="text-xs opacity-90">
                          Contract: {format(clickedEvent.event.contractDate, 'MMM dd, yyyy')}
                        </div>
                      )}
                      {clickedEvent.event.settlementDate && (
                        <div className="text-xs opacity-90">
                          Settlement: {format(clickedEvent.event.settlementDate, 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>

                    {/* Price Information */}
                    {(clickedEvent.event.amount || clickedEvent.event.landPrice || clickedEvent.event.buildingPrice) && (
                      <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                        {clickedEvent.event.amount && (
                          <div className="text-xs font-semibold">
                            Amount: ${clickedEvent.event.amount.toLocaleString()}
                          </div>
                        )}
                        {clickedEvent.event.landPrice && (
                          <div className="text-xs opacity-90">
                            Land: ${clickedEvent.event.landPrice.toLocaleString()}
                          </div>
                        )}
                        {clickedEvent.event.buildingPrice && (
                          <div className="text-xs opacity-90">
                            Building: ${clickedEvent.event.buildingPrice.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fees and Costs */}
                    {(clickedEvent.event.stampDuty || clickedEvent.event.purchaseLegalFees || clickedEvent.event.valuationFees || clickedEvent.event.purchaseAgentFees) && (
                      <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                        <div className="text-xs font-semibold opacity-75">Associated Costs:</div>
                        {clickedEvent.event.stampDuty && (
                          <div className="text-xs opacity-90">
                            Stamp Duty: ${clickedEvent.event.stampDuty.toLocaleString()}
                          </div>
                        )}
                        {clickedEvent.event.purchaseLegalFees && (
                          <div className="text-xs opacity-90">
                            Legal Fees: ${clickedEvent.event.purchaseLegalFees.toLocaleString()}
                          </div>
                        )}
                        {clickedEvent.event.valuationFees && (
                          <div className="text-xs opacity-90">
                            Valuation: ${clickedEvent.event.valuationFees.toLocaleString()}
                          </div>
                        )}
                        {clickedEvent.event.purchaseAgentFees && (
                          <div className="text-xs opacity-90">
                            Agent Fees: ${clickedEvent.event.purchaseAgentFees.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {clickedEvent.event.description && (
                      <div className="text-xs opacity-75 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
                        {clickedEvent.event.description}
                      </div>
                    )}

                    {/* Main Residence Status */}
                    {clickedEvent.event.isPPR !== undefined && (
                      <div className="text-xs opacity-90 mb-2">
                        {clickedEvent.event.isPPR ? '🏠 Main Residence' : '💼 Investment Property'}
                      </div>
                    )}

                {/* Property Name */}
                <div className="text-xs opacity-60 mt-2 pt-2 border-t border-white/20 dark:border-slate-900/20">
                  Property: {clickedEvent.property.name}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

      {/* Property Hover Card - Rendered via Portal */}
      {typeof document !== 'undefined' && hoveredProperty && hoveredPropertyElement && createPortal(
        <AnimatePresence>
          {(() => {
            const rect = hoveredPropertyElement.rect;
            const CARD_WIDTH = 220;
            const OFFSET = 16;

            // Determine if card should appear on left or right
            const spaceOnRight = window.innerWidth - rect.right;
            const spaceOnLeft = rect.left;
            const showOnRight = spaceOnRight >= CARD_WIDTH + OFFSET || spaceOnRight > spaceOnLeft;

            // Find the property data
            const property = properties.find(p => p.id === hoveredProperty.id);
            if (!property) return null;

            const propertyEvents = events.filter(e => e.propertyId === property.id);

            return (
              <motion.div
                key={`property-card-${property.id}`}
                initial={{ opacity: 0, x: showOnRight ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: showOnRight ? -10 : 10 }}
                transition={{ duration: 0.2 }}
                className="fixed bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl pointer-events-none"
                style={{
                  top: `${rect.top + rect.height / 2}px`,
                  [showOnRight ? 'left' : 'right']: showOnRight
                    ? `${rect.right + OFFSET}px`
                    : `${window.innerWidth - rect.left + OFFSET}px`,
                  transform: 'translateY(-50%)',
                  minWidth: `${CARD_WIDTH}px`,
                  zIndex: 999999,
                }}
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
                {/* Arrow pointing to property */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45"
                  style={{
                    [showOnRight ? 'left' : 'right']: '-4px',
                  }}
                />
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

      {/* Hovered Event Clone - Rendered via Portal for Maximum Z-Index */}
      {typeof document !== 'undefined' && hoveredEvent && createPortal(
        <AnimatePresence>
          <div key={`hover-container-${hoveredEvent.event.id}`}>
            {/* Event Circle Clone - Scaled up on hover */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.15 }}
              exit={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="fixed w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-xl pointer-events-none"
              style={{
                backgroundColor: hoveredEvent.event.color,
                left: `${hoveredEvent.rect.left}px`,
                top: `${hoveredEvent.rect.top}px`,
                zIndex: 1000000,
              }}
            />
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
