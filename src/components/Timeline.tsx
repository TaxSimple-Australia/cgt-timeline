'use client';

import React, { useState, useRef, useEffect, MouseEvent } from 'react';
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
import ResidenceGapOverlay from './ResidenceGapOverlay';

interface TimelineProps {
  className?: string;
  onAlertClick?: (alertId: string) => void;
}

export default function Timeline({ className, onAlertClick }: TimelineProps) {
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
  
  const {
    properties,
    events,
    selectedProperty,
    selectedEvent,
    timelineStart,
    timelineEnd,
    zoom,
    addEvent,
    moveEvent,
    selectEvent,
    theme,
    lockFutureDates,
    selectIssue,
    timelineIssues,
    residenceGapIssues,
  } = useTimelineStore();

  // Handle timeline click to add events
  const handleTimelineClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging || isDraggingTimebar) return;

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
      const now = new Date().getTime();
      if (newEndTime > now) {
        newEndTime = now;
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
        const now = new Date().getTime();
        if (newEndTime > now) {
          newEndTime = now;
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
      <TimelineControls />

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
              {/* Residence Gap Overlays - Render behind property branches */}
              {residenceGapIssues.map((gapIssue, index) => (
                <ResidenceGapOverlay
                  key={`gap-${index}-${gapIssue.affected_period?.start}`}
                  issue={gapIssue}
                  timelineStart={timelineStart}
                  timelineEnd={timelineEnd}
                  timelineHeight={minContentHeight - 48}
                  onClick={() => {
                    const relatedIssue = timelineIssues.find(issue =>
                      issue.category === 'timeline_gap' &&
                      issue.startDate?.toISOString().split('T')[0] === gapIssue.affected_period?.start
                    );
                    if (relatedIssue) {
                      selectIssue(relatedIssue.id);
                    }
                  }}
                />
              ))}

              {properties.map((property, index) => (
                <PropertyBranch
                  key={property.id}
                  property={property}
                  events={events.filter(e => e.propertyId === property.id)}
                  branchIndex={index}
                  onDragStart={handleDragStart}
                  isSelected={selectedProperty === property.id}
                  isHovered={hoveredPropertyId === property.id}
                  timelineStart={timelineStart}
                  timelineEnd={timelineEnd}
                  onEventClick={(event) => handleEventClick(event, property.name)}
                  onBranchClick={handleBranchClick}
                  onHoverChange={(isHovered) => setHoveredPropertyId(isHovered ? property.id : null)}
                  onAlertClick={onAlertClick}
                />
              ))}
            </svg>

            {/* No Properties Message */}
            {properties.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Welcome to CGT Timeline
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Click anywhere on the timeline to add your first property
                  </p>
                  <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                    </svg>
                    <span className="text-sm">Click on the timeline to begin</span>
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
    </div>
  );
}
