'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timeline';
import SettingsModal from './SettingsModal';
import {
  ZoomIn,
  ZoomOut,
  Calendar,
  Download,
  Upload,
  Settings,
  Database,
  Trash2,
  Moon,
  Sun,
  Circle,
  LayoutGrid
} from 'lucide-react';

export default function TimelineControls() {
  const [showSettings, setShowSettings] = useState(false);
  const [panSliderValue, setPanSliderValue] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    timelineStart,
    timelineEnd,
    setTimelineRange,
    properties,
    events,
    loadDemoData,
    clearAllData,
    setZoomByIndex,
    getZoomLevelIndex,
    absoluteStart,
    absoluteEnd,
    panToPosition,
    theme,
    toggleTheme,
    eventDisplayMode,
    toggleEventDisplayMode
  } = useTimelineStore();

  // Get zoom level label for display
  const zoomLevelLabels: Record<string, string> = {
    'decade': '10+ Years',
    'multi-year': '5-10 Years',
    'years': '2-5 Years',
    'year': '1-2 Years',
    'months': '6-12 Months',
    'month': '3-6 Months',
    'weeks': '1-3 Months',
    'days': '< 1 Month',
  };

  const canZoomIn = zoomLevel !== 'days';
  const canZoomOut = zoomLevel !== 'decade';

  // Smooth panning slider - uses absolute timeline positions
  const getPanSliderValue = () => {
    // Calculate center of current view as percentage of absolute timeline
    const centerTime = (timelineStart.getTime() + timelineEnd.getTime()) / 2;
    const absoluteRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = centerTime - absoluteStart.getTime();
    const percentage = (offset / absoluteRange) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  // Update local state when not actively panning
  React.useEffect(() => {
    if (!isPanning) {
      setPanSliderValue(getPanSliderValue());
    }
  }, [timelineStart, timelineEnd, absoluteStart, absoluteEnd, isPanning]);

  const handlePanSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    setPanSliderValue(percentage);

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      panToPosition(percentage);
    });
  };

  const handlePanStart = () => {
    setIsPanning(true);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleExport = () => {
    // Transform data to custom format
    const exportData = {
      properties: properties.map(property => {
        // Get all events for this property, sorted by date
        const propertyEvents = events
          .filter(e => e.propertyId === property.id)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        // Map events to the custom format
        const property_history = propertyEvents.map(event => {
          const historyItem: any = {
            date: format(event.date, 'yyyy-MM-dd'),
            event: event.type,
          };

          // Add price if amount exists
          if (event.amount) {
            historyItem.price = event.amount;
          }

          // Add land and building price breakdown if exists
          if (event.landPrice !== undefined) {
            historyItem.land_price = event.landPrice;
          }
          if (event.buildingPrice !== undefined) {
            historyItem.building_price = event.buildingPrice;
          }

          // Add other relevant fields
          if (event.description) {
            historyItem.description = event.description;
          }
          if (event.isPPR) {
            historyItem.is_ppr = event.isPPR;
          }
          if (event.contractDate) {
            historyItem.contract_date = format(event.contractDate, 'yyyy-MM-dd');
          }
          if (event.settlementDate) {
            historyItem.settlement_date = format(event.settlementDate, 'yyyy-MM-dd');
          }
          if (event.newStatus) {
            historyItem.new_status = event.newStatus;
          }

          return historyItem;
        });

        return {
          address: `${property.name}${property.address ? ', ' + property.address : ''}`,
          property_history,
          notes: property.currentStatus || 'No notes',
        };
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgt-brain-timeline-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // In a real app, you'd validate and import this data
        console.log('Imported data:', data);
        // You would call store methods to import the data here
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between z-30">
      {/* Left Controls */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">CGT Brain AI Timeline</h1>
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {events.length} {events.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>
      </div>

      {/* Center Controls - Timeline Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {format(timelineStart, 'MMM yyyy')} - {format(timelineEnd, 'MMM yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">Pan</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={panSliderValue}
            onChange={handlePanSliderChange}
            onMouseDown={handlePanStart}
            onMouseUp={handlePanEnd}
            onTouchStart={handlePanStart}
            onTouchEnd={handlePanEnd}
            className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-600
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-blue-700
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:shadow-md
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-blue-600
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-blue-700
              [&::-moz-range-thumb]:shadow-md"
            title="Smooth timeline navigation"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Zoom Slider */}
        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-2">
          <input
            type="range"
            min="0"
            max="7"
            value={getZoomLevelIndex()}
            onChange={(e) => setZoomByIndex(parseInt(e.target.value))}
            className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-slate-600
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-slate-700
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:shadow-md
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-slate-600
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-slate-700
              [&::-moz-range-thumb]:shadow-md"
            title="Zoom Level Slider"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg min-w-[120px] text-center">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {zoomLevelLabels[zoomLevel]}
            </div>
          </div>
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleExport}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Export Timeline"
        >
          <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        <label className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
          <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={loadDemoData}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Load Demo Data"
        >
          <Database className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        <button
          onClick={clearAllData}
          className="p-2 hover:bg-red-50 hover:bg-opacity-50 rounded-lg transition-colors"
          title="Clear All Data"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>

        <button
          onClick={toggleEventDisplayMode}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title={eventDisplayMode === 'circle' ? "Switch to Card View" : "Switch to Circle View"}
        >
          {eventDisplayMode === 'circle' ? (
            <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <Circle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
