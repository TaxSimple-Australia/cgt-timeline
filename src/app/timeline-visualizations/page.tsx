'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, FileText, Home } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import Link from 'next/link';
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

export default function TimelineVisualizationsPage() {
  const [selectedViz, setSelectedViz] = useState<VisualizationType>('chronological');
  const { properties, events } = useTimelineStore();

  const renderVisualization = () => {
    switch (selectedViz) {
      case 'chronological':
        return <ChronologicalTable properties={properties} events={events} />;
      case 'timeline-bar':
        return <TimelineBarView properties={properties} events={events} />;
      case 'two-column':
        return <TwoColumnLayout properties={properties} events={events} />;
      case 'card':
        return <CardLayout properties={properties} events={events} />;
      case 'hybrid':
        return <HybridLayout properties={properties} events={events} />;
      case 'gantt':
        return <GanttChart properties={properties} events={events} />;
      case 'vertical':
        return <VerticalTimeline properties={properties} events={events} />;
      case 'flowchart':
        return <FlowchartView properties={properties} events={events} />;
      default:
        return <ChronologicalTable properties={properties} events={events} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Timeline
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Timeline Visualizations
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  PDF-ready formats for accountant verification
                </p>
              </div>
            </div>

            {/* Visualization Selector */}
            <div className="relative">
              <select
                value={selectedViz}
                onChange={(e) => setSelectedViz(e.target.value as VisualizationType)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all hover:border-gray-400 dark:hover:border-gray-500"
              >
                {Object.entries(visualizations).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <motion.p
            key={selectedViz}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 dark:text-gray-400 mt-3"
          >
            {visualizations[selectedViz].description}
          </motion.p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          key={selectedViz}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {renderVisualization()}
        </motion.div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-block bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These visualizations are optimized for portrait PDF printing and accountant verification.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              All cost bases, events, and CGT calculations are displayed. Use <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + P</kbd> to print.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
