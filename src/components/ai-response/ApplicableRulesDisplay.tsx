'use client';

import React from 'react';
import { Scale, Check, X } from 'lucide-react';
import { ApplicableRule } from '@/types/model-response';
import { cn } from '@/lib/utils';

interface ApplicableRulesDisplayProps {
  rules: ApplicableRule[];
}

export default function ApplicableRulesDisplay({ rules }: ApplicableRulesDisplayProps) {
  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-indigo-600"></div>
        Applicable Tax Rules
      </h4>

      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div
            key={index}
            className={cn(
              "rounded-xl p-5 border-l-4 shadow-sm",
              rule.applies
                ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-500 dark:border-green-600"
                : "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-gray-400 dark:border-gray-600"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className={cn(
                "p-1.5 rounded-full flex-shrink-0 mt-0.5",
                rule.applies
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-200 dark:bg-gray-700"
              )}>
                {rule.applies ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </div>

              {/* Rule Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold mb-1",
                      rule.applies
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    )}>
                      {rule.section}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-full",
                    rule.applies
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}>
                    {rule.applies ? 'Applies' : 'Does Not Apply'}
                  </span>
                </div>

                <h4 className={cn(
                  "font-semibold mb-1",
                  rule.applies
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                )}>
                  {rule.name}
                </h4>

                <p className={cn(
                  "text-sm leading-relaxed",
                  rule.applies
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  {rule.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
