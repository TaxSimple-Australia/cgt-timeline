'use client';

import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { WhatIfScenario } from '@/types/model-response';
import { cn } from '@/lib/utils';

interface WhatIfScenariosSectionProps {
  scenarios: WhatIfScenario[];
}

export default function WhatIfScenariosSection({ scenarios }: WhatIfScenariosSectionProps) {
  const [expandedScenarios, setExpandedScenarios] = useState<Set<number>>(new Set());

  if (!scenarios || scenarios.length === 0) {
    return null;
  }

  const toggleScenario = (index: number) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedScenarios(newExpanded);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            What-If Scenarios
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Alternative scenarios and their CGT implications
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {scenarios.map((scenario, index) => {
          const isExpanded = expandedScenarios.has(index);
          const netGain = typeof scenario.net_capital_gain === 'string'
            ? parseFloat(scenario.net_capital_gain)
            : scenario.net_capital_gain;
          const hasGain = netGain > 0;

          return (
            <div key={index}>
              {/* Scenario Header */}
              <button
                onClick={() => toggleScenario(index)}
                className="w-full p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {scenario.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {scenario.description}
                    </p>
                    {(scenario.example_date || scenario.example_details) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {scenario.example_date && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            {scenario.example_date}
                          </span>
                        )}
                        {scenario.example_details && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {scenario.example_details}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasGain ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {/* Scenario Details */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4">
                  {/* Calculation Steps */}
                  {scenario.calculation_steps && scenario.calculation_steps.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Calculation Steps
                      </h5>
                      <div className="space-y-3">
                        {scenario.calculation_steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="relative pl-8">
                            <div className="absolute left-0 top-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-semibold">
                              {step.step_number}
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                {step.title}
                              </h6>
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                {step.details}
                              </p>
                              {step.result && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
                                  {step.result}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Result Comparison */}
                  <div className={cn(
                    "rounded-lg p-4 border",
                    hasGain
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  )}>
                    <div className="flex items-start gap-3">
                      {hasGain ? (
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h5 className={cn(
                          "text-sm font-semibold mb-1",
                          hasGain ? "text-red-900 dark:text-red-100" : "text-green-900 dark:text-green-100"
                        )}>
                          Scenario Result
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {scenario.result}
                        </p>
                        {netGain !== undefined && (
                          <div className="mt-2 pt-2 border-t border-current opacity-30">
                            <p className={cn(
                              "text-lg font-bold",
                              hasGain ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"
                            )}>
                              Net Capital Gain: ${typeof netGain === 'number' ? netGain.toLocaleString() : netGain}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
