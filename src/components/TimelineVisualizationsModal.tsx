'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, FileText } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import ChronologicalTable from '@/components/timeline-viz/ChronologicalTable';
import TimelineBarView from '@/components/timeline-viz/TimelineBarView';
import TwoColumnLayout from '@/components/timeline-viz/TwoColumnLayout';
import CardLayout from '@/components/timeline-viz/CardLayout';
import HybridLayout from '@/components/timeline-viz/HybridLayout';
import GanttChart from '@/components/timeline-viz/GanttChart';
import VerticalTimeline from '@/components/timeline-viz/VerticalTimeline';
import FlowchartView from '@/components/timeline-viz/FlowchartView';

type VisualizationType =
  | 'chronological'
  | 'timeline-bar'
  | 'two-column'
  | 'card'
  | 'hybrid'
  | 'gantt'
  | 'vertical'
  | 'flowchart';

const visualizations: Record<VisualizationType, { label: string; description: string }> = {
  chronological: {
    label: 'Chronological Event Table',
    description: 'Detailed table format showing all events in chronological order with complete cost bases',
  },
  'timeline-bar': {
    label: 'Timeline Bar with Summary Boxes',
    description: 'Visual timeline bar with property summary boxes showing occupancy periods',
  },
  'two-column': {
    label: 'Two-Column Summary',
    description: 'Space-efficient layout with property details and cost breakdowns side by side',
  },
  card: {
    label: 'Card-Style Layout',
    description: 'Professional card-based layout with property cards and event timelines',
  },
  hybrid: {
    label: 'Hybrid Table + Visual',
    description: 'Combined approach with both tabular data and visual timeline representation',
  },
  gantt: {
    label: 'Gantt Chart View',
    description: 'Project-style Gantt chart showing property ownership and occupancy periods',
  },
  vertical: {
    label: 'Vertical Timeline',
    description: 'Vertical flow timeline with property events flowing from top to bottom',
  },
  flowchart: {
    label: 'Flowchart Visualization',
    description: 'Flowchart-style diagram showing property lifecycle and transitions',
  },
};

interface TimelineVisualizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimelineVisualizationsModal({
  isOpen,
  onClose,
}: TimelineVisualizationsModalProps) {
  const [selectedViz, setSelectedViz] = useState<VisualizationType>('chronological');
  const { properties, events } = useTimelineStore();

  const renderVisualization = () => {
    const props = { properties, events };

    switch (selectedViz) {
      case 'chronological':
        return <ChronologicalTable {...props} />;
      case 'timeline-bar':
        return <TimelineBarView {...props} />;
      case 'two-column':
        return <TwoColumnLayout {...props} />;
      case 'card':
        return <CardLayout {...props} />;
      case 'hybrid':
        return <HybridLayout {...props} />;
      case 'gantt':
        return <GanttChart {...props} />;
      case 'vertical':
        return <VerticalTimeline {...props} />;
      case 'flowchart':
        return <FlowchartView {...props} />;
      default:
        return <ChronologicalTable {...props} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Timeline Visualizations</h2>
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-3">
                  {/* Visualization Selector */}
                  <div className="relative">
                    <select
                      value={selectedViz}
                      onChange={(e) => setSelectedViz(e.target.value as VisualizationType)}
                      className="appearance-none bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-1.5 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                    >
                    {Object.entries(visualizations).map(([key, { label }]) => (
                      <option key={key} value={key} className="text-gray-900">
                        {label}
                      </option>
                    ))}
                  </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
                  </div>

                  {/* Print Button */}
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Print</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950">
              <motion.div
                key={selectedViz}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-full"
              >
                {properties.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                        No Timeline Data
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Add properties and events to your timeline to see visualizations.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 m-4 md:m-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                    {renderVisualization()}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'}, {events.length} {events.length === 1 ? 'event' : 'events'}
                </span>
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + P</kbd> to print
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
