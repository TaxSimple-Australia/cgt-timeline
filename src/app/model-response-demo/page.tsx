'use client';

import React, { useState } from 'react';
import { ModelResponseDisplay } from '@/components/model-response';
import {
  sampleCGTResponse,
  minimalCGTResponse,
  multiPropertyResponse,
} from '@/lib/sample-data';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { CGTModelResponse } from '@/types/model-response';

export default function ModelResponseDemoPage() {
  const [selectedExample, setSelectedExample] = useState<'sample' | 'minimal' | 'multi'>(
    'sample'
  );

  const examples: Record<string, { label: string; data: CGTModelResponse }> = {
    sample: {
      label: 'Standard Investment Property',
      data: sampleCGTResponse,
    },
    minimal: {
      label: 'Primary Residence (Minimal Data)',
      data: minimalCGTResponse,
    },
    multi: {
      label: 'Multiple Properties',
      data: multiPropertyResponse,
    },
  };

  const currentData = examples[selectedExample].data;

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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                CGT Model Response Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Interactive display of AI-powered capital gains tax analysis
              </p>
            </div>

            {/* Example Selector */}
            <div className="relative">
              <select
                value={selectedExample}
                onChange={(e) => setSelectedExample(e.target.value as any)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all hover:border-gray-400 dark:hover:border-gray-500"
              >
                {Object.entries(examples).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          key={selectedExample}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ModelResponseDisplay responseData={currentData} />
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
              This is a demo page showcasing the ModelResponseDisplay component.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Switch between examples using the dropdown above to see different scenarios.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
