'use client';

import React, { useState, useRef, useEffect, MouseEvent, useMemo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimelineStore, EventType, TimelineEvent } from '@/store/timeline';
import { cn, dateToPosition, positionToDate, generateTimelineMarkers, TimelineMarker } from '@/lib/utils';
import EventCard from './EventCard';
import TimelineControls from './TimelineControls';
import PropertyBranch from './PropertyBranch';
import QuickAddMenu from './QuickAddMenu';
import EventDetailsModal from './EventDetailsModal';
import TimelineSnapshot from './TimelineSnapshot';
import TimelineVisualizationsModal from './TimelineVisualizationsModal';
import LandingPageButton from './LandingPageButton';
import LandingPageModal from './LandingPageModal';
import LotDetailsModal from './LotDetailsModal';
import { StickyNotesLayer, ShareLinkButton, AddStickyNoteButton } from './sticky-notes';
import SubdivisionSplitVisual from './SubdivisionSplitVisual';
import { calculateBranchPositions, calculateSubdivisionConnections } from '@/lib/subdivision-helpers';
// import ResidenceGapOverlay from './ResidenceGapOverlay'; // REMOVED: Duplicate of GilbertBranch VerificationAlertBar

// Extend Window interface for global sticky note drag flag
declare global {
  interface Window {
    __stickyNoteDragging?: boolean;
  }
}

interface TimelineProps {
  className?: string;
  onAlertClick?: (alertId: string) => void;
  onOpenAIBuilder?: () => void;
}

export default function Timeline({ className, onAlertClick, onOpenAIBuilder }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddPosition, setQuickAddPosition] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState(0);
  const [preselectedPropertyId, setPreselectedPropertyId] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [editingEventPropertyName, setEditingEventPropertyName] = useState<string>('');
  const [isDraggingTimebar, setIsDraggingTimebar] = useState(false);
  const [grabbedDateTimestamp, setGrabbedDateTimestamp] = useState<number>(0);
  const [grabbedViewDuration, setGrabbedViewDuration] = useState<number>(0);
  const [showVisualizationsModal, setShowVisualizationsModal] = useState(false);
  const [showLandingModal, setShowLandingModal] = useState(false);
  const [editingLotId, setEditingLotId] = useState<string | null>(null);

  const {
    properties,
    events,
    selectedProperty,
    selectedEvent,
    timelineStart: rawTimelineStart,
    timelineEnd: rawTimelineEnd,
    absoluteEnd: rawAbsoluteEnd,
    zoom,
    addEvent,
    moveEvent,
    selectEvent,
    theme,
    lockFutureDates,
    selectIssue,
    timelineIssues,
    collapsedSubdivisions,
    // residenceGapIssues, // REMOVED: Not needed - using GilbertBranch VerificationAlertBar instead
  } = useTimelineStore();

  // Validate dates to prevent crashes from invalid Date objects
  // Default to sensible values if dates are corrupted
  const timelineStart = useMemo(() => {
    if (rawTimelineStart instanceof Date && !isNaN(rawTimelineStart.getTime())) {
      return rawTimelineStart;
    }
    console.warn('⚠️ Invalid timelineStart, using fallback');
    return new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000); // 30 years ago
  }, [rawTimelineStart]);

  const timelineEnd = useMemo(() => {
    if (rawTimelineEnd instanceof Date && !isNaN(rawTimelineEnd.getTime())) {
      return rawTimelineEnd;
    }
    console.warn('⚠️ Invalid timelineEnd, using fallback');
    return new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 years from now
  }, [rawTimelineEnd]);

  const absoluteEnd = useMemo(() => {
    if (rawAbsoluteEnd instanceof Date && !isNaN(rawAbsoluteEnd.getTime())) {
      return rawAbsoluteEnd;
    }
    console.warn('⚠️ Invalid absoluteEnd, using fallback');
    return new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 years from now
  }, [rawAbsoluteEnd]);

  // Filter properties for rendering FIRST:
  // - Show parent properties (even if subdivided - they keep their original name)
  // - Show child lots EXCEPT Lot 1 (main continuation) since Lot 1 continues on the parent line
  // - Lot 2, Lot 3, etc. render as separate child branches below the parent
  // - Hide child lots when their parent subdivision is collapsed
  const visibleProperties = useMemo(() => {
    return properties.filter(property => {
      // Always hide Lot 1 (main continuation)
      if (property.isMainLotContinuation) return false;

      // If this is a child lot (has parentPropertyId), check if its subdivision is collapsed
      if (property.parentPropertyId && property.subdivisionGroup) {
        const isCollapsed = collapsedSubdivisions.includes(property.subdivisionGroup);
        if (isCollapsed) return false; // Hide this child lot
      }

      return true; // Show this property
    });
  }, [properties, collapsedSubdivisions]);

  // Calculate branch positions based on VISIBLE properties only
  // This ensures properties move up to fill space when lots are collapsed
  const branchPositions = useMemo(() => {
    return calculateBranchPositions(visibleProperties);
  }, [visibleProperties]);

  // Calculate subdivision connections and filter out connections to collapsed child lots
  const subdivisionConnections = useMemo(() => {
    const dateToPos = (date: Date) => dateToPosition(date, timelineStart, timelineEnd);
    const allConnections = calculateSubdivisionConnections(properties, branchPositions, events, dateToPos);

    // Filter out connections to collapsed child lots (removes pink lines)
    return allConnections.filter(connection => {
      const childProperty = properties.find(p => p.id === connection.childId);
      if (!childProperty) return false;

      // If child has subdivisionGroup and it's collapsed, hide the connection
      if (childProperty.subdivisionGroup && collapsedSubdivisions.includes(childProperty.subdivisionGroup)) {
        return false;
      }

      return true;
    });
  }, [properties, branchPositions, events, timelineStart, timelineEnd, collapsedSubdivisions]);

  // Handle timeline click to add events
  const handleTimelineClick = (e: MouseEvent<HTMLDivElement>) => {
    // Check if a sticky note is being dragged
    if (isDragging || isDraggingTimebar || window.__stickyNoteDragging) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const position = (x / rect.width) * 100;

    setClickPosition(position);
    setQuickAddPosition({ x: e.clientX, y: e.clientY });
    setPreselectedPropertyId(null); // No property preselected for general timeline clicks
    setShowQuickAdd(true);
  };

  // Handle branch line click to add events for a specific property
  const handleBranchClick = (propertyId: string, position: number, clientX: number, clientY: number) => {
    // Check if a sticky note is being dragged
    if (window.__stickyNoteDragging) return;

    setClickPosition(position);
    setQuickAddPosition({ x: clientX, y: clientY });
    setPreselectedPropertyId(propertyId); // Preselect the property
    setShowQuickAdd(true);
  };

  // Handle mouse move for hover effects
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const position = (x / rect.width) * 100;
    const date = positionToDate(position, timelineStart, timelineEnd);
    setHoveredDate(date);
  };

  // Handle event click - opens edit modal
  const handleEventClick = (event: TimelineEvent, propertyName: string) => {
    setEditingEvent(event);
    setEditingEventPropertyName(propertyName);
  };

  // Handle timebar drag to pan
  const handleTimebarMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate which date/time is at the cursor position
    const mouseX = e.clientX - rect.left;
    const mousePercentage = (mouseX / rect.width) * 100;

    // Calculate the timestamp at this position in the current view
    const viewDuration = timelineEnd.getTime() - timelineStart.getTime();
    const grabbedTimestamp = timelineStart.getTime() + (viewDuration * mousePercentage / 100);

    // Store the grabbed timestamp and view duration (both stay constant during drag)
    setGrabbedDateTimestamp(grabbedTimestamp);
    setGrabbedViewDuration(viewDuration);
    setIsDraggingTimebar(true);
  };

  const handleTimebarMouseMove = (e: React.MouseEvent) => {
    // Don't process if not dragging or missing required state
    if (!isDraggingTimebar || !grabbedDateTimestamp || !grabbedViewDuration) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate current mouse position as percentage of timeline width
    const mouseX = e.clientX - rect.left;
    const mousePercentage = (mouseX / rect.width) * 100;

    // Calculate what timelineStart should be so that grabbedDateTimestamp appears at mousePercentage
    // Formula: timelineStart = grabbedTimestamp - (viewDuration * mousePercentage / 100)
    let newStartTime = grabbedDateTimestamp - (grabbedViewDuration * mousePercentage / 100);
    let newEndTime = newStartTime + grabbedViewDuration;

    // Apply future date lock if enabled
    if (lockFutureDates) {
      const maxAllowed = absoluteEnd.getTime();
      if (newEndTime > maxAllowed) {
        newEndTime = maxAllowed;
        newStartTime = newEndTime - grabbedViewDuration;
      }
    }

    useTimelineStore.setState({
      timelineStart: new Date(newStartTime),
      timelineEnd: new Date(newEndTime),
      centerDate: new Date(newStartTime + grabbedViewDuration / 2),
    });
  };

  const handleTimebarMouseUp = () => {
    if (isDraggingTimebar) {
      // Small delay to prevent click event from firing
      setTimeout(() => {
        setIsDraggingTimebar(false);
        setGrabbedDateTimestamp(0);
        setGrabbedViewDuration(0);
      }, 50);
    }
  };

  // Generate intelligent markers based on zoom level
  const timelineMarkers = generateTimelineMarkers(timelineStart, timelineEnd);

  // Calculate minimum height needed for all properties and their events
  // Account for cards that may be positioned far down due to tier stacking
  const calculateMinHeight = () => {
    if (properties.length === 0) return 400;

    // Base calculation for branches
    const branchesHeight = 100 + properties.length * 120;

    // Account for card positioning
    // Cards in card view can be in tiers 0-3
    // Tier spacing: 160px per tier, base offset: -50px, max card height: ~145px
    // Maximum card extension: -50 + (3 * 160) + 145 = 575px below branch
    const maxCardExtension = 575;

    // Calculate total height: last branch Y + max card extension + bottom padding
    const totalHeight = branchesHeight + maxCardExtension + 100;

    return Math.max(400, totalHeight);
  };

  const minContentHeight = calculateMinHeight();

  // Handle drag start
  const handleDragStart = (eventId: string) => {
    setIsDragging(true);
    setDraggedEventId(eventId);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedEventId(null);
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !draggedEventId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      moveEvent(draggedEventId, position);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedEventId, moveEvent]);

  // Handle timebar drag move - global event handlers
  useEffect(() => {
    if (!isDraggingTimebar || !grabbedDateTimestamp || !grabbedViewDuration) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate current mouse position as percentage of timeline width
      const mouseX = e.clientX - rect.left;
      const mousePercentage = (mouseX / rect.width) * 100;

      // Calculate what timelineStart should be so that grabbedDateTimestamp appears at mousePercentage
      // Formula: timelineStart = grabbedTimestamp - (viewDuration * mousePercentage / 100)
      let newStartTime = grabbedDateTimestamp - (grabbedViewDuration * mousePercentage / 100);
      let newEndTime = newStartTime + grabbedViewDuration;

      // Apply future date lock if enabled
      if (lockFutureDates) {
        const maxAllowed = absoluteEnd.getTime();
        if (newEndTime > maxAllowed) {
          newEndTime = maxAllowed;
          newStartTime = newEndTime - grabbedViewDuration;
        }
      }

      useTimelineStore.setState({
        timelineStart: new Date(newStartTime),
        timelineEnd: new Date(newEndTime),
        centerDate: new Date(newStartTime + grabbedViewDuration / 2),
      });
    };

    const handleMouseUp = () => {
      setTimeout(() => {
        setIsDraggingTimebar(false);
        setGrabbedDateTimestamp(0);
        setGrabbedViewDuration(0);
      }, 50);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTimebar, grabbedDateTimestamp, grabbedViewDuration, lockFutureDates]);

  return (
    <div className={cn('relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800', className)}>
      {/* Controls */}
      <TimelineControls timelineContainerRef={timelineRef} />

      {/* Main Timeline Container */}
      <div className="relative h-full pt-20 pb-4 px-8">
        <div
          ref={timelineRef}
          data-timeline-container
          className="timeline-scroll relative h-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-y-auto overflow-x-hidden transition-all duration-300"
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredDate(null)}
        >
          {/* Scrollable Content Wrapper */}
          <div className="relative" style={{ minHeight: `${minContentHeight}px` }}>
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-5">
              <div className="h-full w-full" style={{
                backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px), linear-gradient(#000 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }} />
            </div>

            {/* Timeline Markers - Sticky */}
            <div
              className={cn(
                "sticky top-0 left-0 right-0 h-12 border-b border-slate-200 dark:border-slate-700 z-20 select-none transition-all duration-150",
                isDraggingTimebar
                  ? "bg-slate-100 dark:bg-slate-700 shadow-md"
                  : "bg-slate-50 dark:bg-slate-800"
              )}
              style={{ cursor: isDraggingTimebar ? 'grabbing' : 'grab' }}
              onMouseDown={handleTimebarMouseDown}
              onMouseMove={handleTimebarMouseMove}
              onMouseUp={handleTimebarMouseUp}
            >
            {timelineMarkers.map((marker, index) => {
              const isYear = marker.type === 'year';
              const isMinor = marker.isMinor;

              return (
                <div
                  key={`${marker.type}-${marker.date.getTime()}-${index}`}
                  className="absolute top-0 h-full flex items-center"
                  style={{ left: `${marker.position}%` }}
                >
                  <div
                    className={cn(
                      'px-2 whitespace-nowrap',
                      isYear ? 'font-bold text-slate-800 dark:text-slate-200 text-sm' : 'font-medium text-slate-600 dark:text-slate-400 text-xs',
                      isMinor && 'text-slate-400 dark:text-slate-600'
                    )}
                  >
                    {marker.label}
                  </div>
                  <div
                    className={cn(
                      'absolute top-full h-full',
                      isYear ? 'w-0.5 bg-slate-300 dark:bg-slate-600' : isMinor ? 'w-px bg-slate-100 dark:bg-slate-800' : 'w-px bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                </div>
              );
            })}
            </div>

            {/* Hover Date Indicator */}
            {hoveredDate && (
              <div
                className="absolute top-14 px-2 py-1 bg-slate-800 text-white text-xs rounded pointer-events-none z-50"
                style={{
                  left: `${dateToPosition(hoveredDate, timelineStart, timelineEnd)}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {format(hoveredDate, 'dd MMM yyyy')}
              </div>
            )}

            {/* Property Branches */}
            <svg
              className="absolute top-12 left-0 w-full"
              style={{ height: `${minContentHeight - 48}px` }}
            >
              {/* SVG Definitions */}
              <defs>
                {/* Gradient for subdivision lines */}
                <linearGradient id="subdivisionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* REMOVED: ResidenceGapOverlay - Duplicate of GilbertBranch VerificationAlertBar */}
              {/* Gap questions now handled exclusively by VerificationAlertBar → PropertyIssueOverlay */}

              {/* Subdivision Visual Connections - Render FIRST (behind property branches) */}
              {subdivisionConnections.length > 0 && (
                <SubdivisionSplitVisual connections={subdivisionConnections} />
              )}

              {visibleProperties.map((property, index) => {
                // Use calculated branch position if property is part of subdivision hierarchy
                const branchPos = branchPositions.get(property.id!);
                const effectiveBranchIndex = branchPos ? branchPos.yOffset / 80 : index;

                // For subdivided parent properties, also include Lot 1's events (main continuation)
                // This allows the parent line to show events that happened after subdivision on Lot 1
                const lot1 = properties.find(p => p.parentPropertyId === property.id && p.isMainLotContinuation);
                // Get subdivision date from Lot 1 to filter events properly and avoid duplicates
                const subdivisionDate = lot1?.subdivisionDate;
                const eventsToShow = lot1 && subdivisionDate
                  ? [
                      // Parent's events BEFORE subdivision
                      ...events.filter(e => e.propertyId === property.id && e.date < subdivisionDate),
                      // Lot 1's events ON or AFTER subdivision
                      ...events.filter(e => e.propertyId === lot1.id && e.date >= subdivisionDate)
                    ]
                  : events.filter(e => e.propertyId === property.id);

                return (
                  <PropertyBranch
                    key={`${property.id}-${properties.length}`}
                    property={property}
                    events={eventsToShow}
                    branchIndex={effectiveBranchIndex}
                    onDragStart={handleDragStart}
                    isSelected={selectedProperty === property.id}
                    isHovered={hoveredPropertyId === property.id}
                    timelineStart={timelineStart}
                    timelineEnd={timelineEnd}
                    onEventClick={(event) => handleEventClick(event, property.name)}
                    onBranchClick={handleBranchClick}
                    onHoverChange={(isHovered) => setHoveredPropertyId(isHovered ? property.id : null)}
                    onAlertClick={onAlertClick}
                    onLotBadgeClick={setEditingLotId}
                  />
                );
              })}
            </svg>

            {/* Sticky Notes Layer */}
            <StickyNotesLayer containerRef={timelineRef} />

            {/* No Properties Message - Centered Welcome Display */}
            {properties.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ top: '48px' }}>
                <div className="flex flex-col items-center justify-center text-center max-w-md px-4">
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Welcome to CGT Brain
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Click anywhere on the timeline to add your first property
                  </p>
                  <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                    </svg>
                    <span className="text-sm">Click on the timeline to begin</span>
                  </div>

                  {/* AI Timeline Builder Button */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 w-full flex flex-col items-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm mb-2">
                      Or try the
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onOpenAIBuilder?.();
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:from-purple-500/20 hover:to-blue-500/20 dark:hover:from-purple-500/30 dark:hover:to-blue-500/30 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer hover:scale-105 hover:shadow-lg"
                    >
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        AI Timeline Builder
                      </span>
                    </button>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
                      Build your timeline by simply describing your property history
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Menu */}
      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddMenu
            position={quickAddPosition}
            timelinePosition={clickPosition}
            onClose={() => setShowQuickAdd(false)}
            preselectedPropertyId={preselectedPropertyId}
            timelineContainerRef={timelineRef}
          />
        )}
      </AnimatePresence>

      {/* Event Details Modal - Rendered at top level */}
      {editingEvent && (
        <EventDetailsModal
          event={editingEvent}
          onClose={() => {
            setEditingEvent(null);
            setEditingEventPropertyName('');
          }}
          propertyName={editingEventPropertyName}
        />
      )}

      {/* Timeline Snapshot Widget */}
      <TimelineSnapshot />

      {/* Landing Page Button */}
      <LandingPageButton />

      {/* Landing Page Modal */}
      <LandingPageModal isOpen={showLandingModal} onClose={() => setShowLandingModal(false)} />

      {/* Timeline Visualizations Button */}
      <button
        onClick={() => setShowVisualizationsModal(true)}
        className="fixed bottom-8 left-6 z-50 group"
        title="Open Timeline Visualizations (PDF-ready formats)"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </motion.div>
      </button>

      {/* Timeline Visualizations Modal */}
      <TimelineVisualizationsModal
        isOpen={showVisualizationsModal}
        onClose={() => setShowVisualizationsModal(false)}
      />

      {/* Lot Details Modal - Global */}
      {editingLotId && (() => {
        console.log('🎨 Timeline: Rendering LotDetailsModal for:', editingLotId);
        const editingProperty = properties.find(p => p.id === editingLotId);
        if (!editingProperty) {
          console.log('⚠️ Timeline: Property not found for editingLotId:', editingLotId);
          return null;
        }
        return (
          <LotDetailsModal
            property={editingProperty}
            isOpen={true}
            onClose={() => {
              console.log('🚪 Closing LotDetailsModal');
              setEditingLotId(null);
            }}
          />
        );
      })()}
    </div>
  );
}
