'use client';

import React, { useState } from 'react';
import { BookOpen, ExternalLink, ChevronDown, ChevronRight, Scale, Tag, FileText } from 'lucide-react';
import { Citations } from '@/types/model-response';
import { cn } from '@/lib/utils';

interface CitationsSectionProps {
  citations: Citations;
}

export default function CitationsSection({ citations }: CitationsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const toggleRule = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  if (!citations || !citations.rules_applied || citations.rules_applied.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Citations & Legislation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {citations.rules_applied.length} rule{citations.rules_applied.length !== 1 ? 's' : ''} applied
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-5 pt-0 space-y-6">
          {/* Categories */}
          {citations.categories && citations.categories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categories
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {citations.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Legislation References */}
          {citations.legislation_references && citations.legislation_references.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Legislation References
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {citations.legislation_references.map((ref, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-mono rounded border border-purple-200 dark:border-purple-800"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rules Applied */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rules Applied
              </span>
            </div>
            <div className="space-y-3">
              {citations.rules_applied.map((rule) => (
                <div
                  key={rule.rule_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Rule Header */}
                  <button
                    onClick={() => toggleRule(rule.rule_id)}
                    className="w-full flex items-start justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono rounded">
                          {rule.legislation}
                        </span>
                        {rule.confidence && (
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all",
                                  rule.confidence >= 0.9 ? "bg-green-500" :
                                  rule.confidence >= 0.7 ? "bg-yellow-500" :
                                  "bg-orange-500"
                                )}
                                style={{ width: `${rule.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {Math.round(rule.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {rule.title}
                      </h4>
                    </div>
                    {expandedRules.has(rule.rule_id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </button>

                  {/* Rule Details */}
                  {expandedRules.has(rule.rule_id) && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-3">
                        {rule.summary}
                      </p>
                      {rule.ato_url && (
                        <a
                          href={rule.ato_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on ATO website
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          {citations.sources && citations.sources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reference Sources
                </span>
              </div>
              <div className="space-y-2">
                {citations.sources.map((source, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {source.title}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono rounded">
                            {source.legislation}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {source.description}
                        </p>
                      </div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
