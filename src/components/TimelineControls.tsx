'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timeline';
import SettingsModal from './SettingsModal';
import ScenarioSelectorModal from './ScenarioSelectorModal';
import {
  ZoomIn,
  ZoomOut,
  Calendar,
  Download,
  Upload,
  Settings,
  Trash2,
  Moon,
  Sun,
  Circle,
  LayoutGrid,
  FolderOpen,
  Menu,
  X,
  ChevronDown,
  StickyNote
} from 'lucide-react';

export default function TimelineControls() {
  const [showSettings, setShowSettings] = useState(false);
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    clearAllData,
    importTimelineData,
    setZoomByIndex,
    getZoomLevelIndex,
    absoluteStart,
    absoluteEnd,
    panToPosition,
    theme,
    toggleTheme,
    eventDisplayMode,
    toggleEventDisplayMode,
    openNotesModal,
    timelineNotes
  } = useTimelineStore();

  // Shorter zoom level labels for smaller screens
  const zoomLevelLabels: Record<string, { full: string; short: string }> = {
    'decade': { full: '10+ Years', short: '10+Y' },
    'multi-year': { full: '5-10 Years', short: '5-10Y' },
    'years': { full: '2-5 Years', short: '2-5Y' },
    'year': { full: '1-2 Years', short: '1-2Y' },
    'months': { full: '6-12 Months', short: '6-12M' },
    'month': { full: '3-6 Months', short: '3-6M' },
    'weeks': { full: '1-3 Months', short: '1-3M' },
    'days': { full: '< 1 Month', short: '<1M' },
  };

  const canZoomIn = zoomLevel !== 'days';
  const canZoomOut = zoomLevel !== 'decade';

  // Smooth panning slider - uses absolute timeline positions
  const getPanSliderValue = () => {
    const centerTime = (timelineStart.getTime() + timelineEnd.getTime()) / 2;
    const absoluteRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = centerTime - absoluteStart.getTime();
    const percentage = (offset / absoluteRange) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  React.useEffect(() => {
    if (!isPanning) {
      setPanSliderValue(getPanSliderValue());
    }
  }, [timelineStart, timelineEnd, absoluteStart, absoluteEnd, isPanning]);

  const handlePanSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value);
    setPanSliderValue(percentage);
    requestAnimationFrame(() => {
      panToPosition(percentage);
    });
  };

  const handlePanStart = () => setIsPanning(true);
  const handlePanEnd = () => setIsPanning(false);

  const handleExport = () => {
    const exportData = {
      properties: properties.map(property => {
        const propertyEvents = events
          .filter(e => e.propertyId === property.id)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const property_history = propertyEvents.map(event => {
          const historyItem: any = {
            date: format(event.date, 'yyyy-MM-dd'),
            event: event.type,
          };

          if (event.costBases && event.costBases.length > 0) {
            const costBaseToApiFieldMap: Record<string, string> = {
              'purchase_price': 'price',
              'land_price': 'land_price',
              'building_price': 'building_price',
              'stamp_duty': 'stamp_duty',
              'purchase_legal_fees': 'purchase_legal_fees',
              'valuation_fees': 'valuation_fees',
              'building_inspection': 'building_inspection',
              'pest_inspection': 'pest_inspection',
              'purchase_agent_fees': 'purchase_agent_fees',
              'title_legal_fees': 'title_legal_fees',
              'loan_establishment': 'loan_establishment',
              'mortgage_insurance': 'mortgage_insurance',
              'sale_agent_fees': 'agent_fees',
              'sale_legal_fees': 'legal_fees',
              'advertising_costs': 'advertising_costs',
              'staging_costs': 'staging_costs',
              'auction_costs': 'auction_costs',
            };

            event.costBases.forEach(cb => {
              const apiField = costBaseToApiFieldMap[cb.definitionId];
              if (apiField) {
                historyItem[apiField] = cb.amount;
              }
            });

            if (event.type === 'improvement' && !historyItem.price) {
              const totalCost = event.costBases.reduce((sum, cb) => sum + cb.amount, 0);
              if (totalCost > 0) {
                historyItem.price = totalCost;
              }
            }
          } else {
            if (event.amount) {
              historyItem.price = event.amount;
            }
          }

          if (event.landPrice !== undefined) historyItem.land_price = event.landPrice;
          if (event.buildingPrice !== undefined) historyItem.building_price = event.buildingPrice;
          if (event.description) historyItem.description = event.description;
          if (event.isPPR) historyItem.is_ppr = event.isPPR;
          if (event.contractDate) historyItem.contract_date = format(event.contractDate, 'yyyy-MM-dd');
          if (event.settlementDate) historyItem.settlement_date = format(event.settlementDate, 'yyyy-MM-dd');
          if (event.newStatus) historyItem.new_status = event.newStatus;
          if (event.marketValuation !== undefined) historyItem.market_value = event.marketValuation;

          return historyItem;
        });

        return {
          address: `${property.name}${property.address ? ', ' + property.address : ''}`,
          property_history,
          notes: property.currentStatus || 'No notes',
        };
      }),
      user_query: "Please analyze my property portfolio with accurate CGT calculations including all cost base elements.",
      additional_info: {
        australian_resident: true,
        tax_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      }
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
        console.log('📥 Importing timeline data:', data);
        importTimelineData(data);
        console.log('✅ Timeline data imported successfully!');
        alert(`Successfully imported ${data.properties?.length || 0} properties and ${data.events?.length || 0} events!`);
      } catch (error) {
        console.error('❌ Failed to import data:', error);
        alert('Failed to import timeline data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Slider styles (reusable)
  const sliderClasses = `h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer
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
    [&::-moz-range-thumb]:shadow-md`;

  // Icon button component for consistency
  const IconButton = ({
    onClick,
    title,
    children,
    className = "",
    variant = "default"
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "danger" | "gradient";
  }) => {
    const baseClasses = "p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0";
    const variantClasses = {
      default: "hover:bg-slate-100 dark:hover:bg-slate-700",
      danger: "hover:bg-red-50 dark:hover:bg-red-900/20",
      gradient: "hover:scale-105 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 hover:from-purple-500/20 hover:via-blue-500/20 hover:to-teal-500/20 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-teal-500/20 dark:hover:from-purple-500/30 dark:hover:via-blue-500/30 dark:hover:to-teal-500/30 border border-purple-200/50 dark:border-purple-500/30"
    };

    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        title={title}
      >
        {children}
      </button>
    );
  };

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-12 sm:h-14 lg:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-2 sm:px-4 lg:px-6 xl:px-8 flex items-center justify-between z-30">
        {/* Left Section - Logo & Stats */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-shrink-0">
          {/* Title - Responsive */}
          <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
            <span className="hidden sm:inline">CGT Brain AI</span>
            <span className="sm:hidden">CGT</span>
          </h1>

          {/* Stats - Hide on very small screens */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 border-l border-slate-200 dark:border-slate-700 pl-2 lg:pl-4">
            <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {properties.length} <span className="hidden lg:inline">{properties.length === 1 ? 'Property' : 'Properties'}</span><span className="lg:hidden">P</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {events.length} <span className="hidden lg:inline">{events.length === 1 ? 'Event' : 'Events'}</span><span className="lg:hidden">E</span>
            </span>
          </div>
        </div>

        {/* Center Section - Timeline Navigation (Hidden on small screens) */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink min-w-0">
          {/* Date Range */}
          <div className="flex items-center gap-1.5 px-2 xl:px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <span className="text-xs xl:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {format(timelineStart, 'MMM yy')} - {format(timelineEnd, 'MMM yy')}
            </span>
          </div>

          {/* Pan Slider */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Pan</span>
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
              className={`w-16 xl:w-24 ${sliderClasses}`}
              title="Pan timeline"
            />
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Zoom</span>
            <input
              type="range"
              min="0"
              max="8"
              value={getZoomLevelIndex()}
              onChange={(e) => setZoomByIndex(parseInt(e.target.value))}
              className={`w-16 xl:w-24 ${sliderClasses}`}
              title="Zoom level"
            />
          </div>
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-1.5">
          {/* Zoom Controls - Compact on smaller screens */}
          <div className="flex items-center gap-0.5 sm:gap-1 border-r border-slate-200 dark:border-slate-700 pr-1 sm:pr-2">
            <IconButton onClick={zoomOut} title="Zoom Out" className={!canZoomOut ? 'opacity-50 cursor-not-allowed' : ''}>
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
            </IconButton>

            {/* Zoom Label - Responsive width */}
            <div className="px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-center min-w-[3rem] sm:min-w-[4rem] lg:min-w-[5.5rem]">
              <div className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <span className="hidden lg:inline">{zoomLevelLabels[zoomLevel]?.full}</span>
                <span className="lg:hidden">{zoomLevelLabels[zoomLevel]?.short}</span>
              </div>
            </div>

            <IconButton onClick={zoomIn} title="Zoom In" className={!canZoomIn ? 'opacity-50 cursor-not-allowed' : ''}>
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
            </IconButton>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-0.5 sm:gap-1">
            <IconButton onClick={handleExport} title="Export Timeline">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
            </IconButton>

            <label className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex-shrink-0">
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <IconButton onClick={() => setShowScenarioSelector(true)} title="Load Scenario" variant="gradient">
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            </IconButton>

            <IconButton onClick={clearAllData} title="Clear All Data" variant="danger">
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
            </IconButton>

            <IconButton onClick={toggleEventDisplayMode} title={eventDisplayMode === 'circle' ? "Card View" : "Circle View"}>
              {eventDisplayMode === 'circle' ? (
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
              ) : (
                <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
              )}
            </IconButton>

            <IconButton onClick={toggleTheme} title={theme === 'dark' ? "Light Mode" : "Dark Mode"}>
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
              )}
            </IconButton>

            <IconButton
              onClick={openNotesModal}
              title={timelineNotes ? "Notes (has content)" : "Notes"}
              className={timelineNotes ? "relative" : ""}
            >
              <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
              {timelineNotes && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
              )}
            </IconButton>

            <IconButton onClick={() => setShowSettings(true)} title="Settings">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
            </IconButton>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <IconButton onClick={() => setShowMobileMenu(!showMobileMenu)} title="Menu">
              {showMobileMenu ? (
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              ) : (
                <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </IconButton>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="sm:hidden absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-40 shadow-lg">
          {/* Pan & Zoom Controls */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Timeline Range</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {format(timelineStart, 'MMM yyyy')} - {format(timelineEnd, 'MMM yyyy')}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-10">Pan</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={panSliderValue}
                  onChange={handlePanSliderChange}
                  onTouchStart={handlePanStart}
                  onTouchEnd={handlePanEnd}
                  className={`flex-1 ${sliderClasses}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-10">Zoom</span>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={getZoomLevelIndex()}
                  onChange={(e) => setZoomByIndex(parseInt(e.target.value))}
                  className={`flex-1 ${sliderClasses}`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-4 gap-1 p-2">
            <button
              onClick={() => { handleExport(); setShowMobileMenu(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">Export</span>
            </button>

            <label className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <Upload className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">Import</span>
              <input type="file" accept=".json" onChange={(e) => { handleImport(e); setShowMobileMenu(false); }} className="hidden" />
            </label>

            <button
              onClick={() => { setShowScenarioSelector(true); setShowMobileMenu(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">Scenarios</span>
            </button>

            <button
              onClick={() => { clearAllData(); setShowMobileMenu(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
              <span className="text-[10px] text-red-600">Clear</span>
            </button>

            <button
              onClick={() => { toggleEventDisplayMode(); setShowMobileMenu(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {eventDisplayMode === 'circle' ? (
                <LayoutGrid className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {eventDisplayMode === 'circle' ? 'Cards' : 'Circles'}
              </span>
            </button>

            <button
              onClick={() => { toggleTheme(); setShowMobileMenu(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            <button
              onClick={() => { openNotesModal(); setShowMobileMenu(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative"
            >
              <StickyNote className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              {timelineNotes && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
              )}
              <span className="text-[10px] text-slate-600 dark:text-slate-400">Notes</span>
            </button>

            <button
              onClick={() => { setShowSettings(true); setShowMobileMenu(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">Settings</span>
            </button>

            <div className="flex flex-col items-center gap-1 p-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {properties.length}P / {events.length}E
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Data</span>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close mobile menu */}
      {showMobileMenu && (
        <div
          className="sm:hidden fixed inset-0 z-30"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <ScenarioSelectorModal
        isOpen={showScenarioSelector}
        onClose={() => setShowScenarioSelector(false)}
      />
    </>
  );
}
