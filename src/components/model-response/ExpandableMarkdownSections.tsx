'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import MarkdownDisplay from './MarkdownDisplay';

interface ExpandableMarkdownSectionsProps {
  content: string;
}

interface Section {
  title: string;
  level: number;
  content: string;
  startIndex: number;
}

export default function ExpandableMarkdownSections({ content }: ExpandableMarkdownSectionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])); // First section expanded by default

  // Parse markdown into sections based on headings
  const sections = useMemo<Section[]>(() => {
    const lines = content.split('\n');
    const tempSections: Section[] = [];

    let currentTitle = '';
    let currentLevel = 1;
    let currentContent: string[] = [];
    let currentStartIndex = 0;
    let hasSection = false;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (hasSection) {
          tempSections.push({
            title: currentTitle,
            level: currentLevel,
            content: currentContent.join('\n').trim(),
            startIndex: currentStartIndex
          });
        }

        // Start new section
        currentLevel = headingMatch[1].length;
        currentTitle = headingMatch[2];
        currentContent = [line];
        currentStartIndex = index;
        hasSection = true;
      } else if (hasSection) {
        currentContent.push(line);
      }
    }

    // Don't forget the last section
    if (hasSection) {
      tempSections.push({
        title: currentTitle,
        level: currentLevel,
        content: currentContent.join('\n').trim(),
        startIndex: currentStartIndex
      });
    }

    // If no sections found, treat entire content as one section
    if (tempSections.length === 0) {
      tempSections.push({
        title: 'Analysis Report',
        level: 1,
        content: content,
        startIndex: 0
      });
    }

    return tempSections;
  }, [content]);

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((_, index) => index)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      {sections.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {sections.length} Sections
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const isExpanded = expandedSections.has(index);
          const indentLevel = Math.max(0, section.level - 1);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden`}
              style={{ marginLeft: `${indentLevel * 1}rem` }}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(index)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  </motion.div>

                  <h3
                    className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${
                      section.level === 1
                        ? 'text-base'
                        : section.level === 2
                        ? 'text-sm'
                        : 'text-xs'
                    }`}
                  >
                    {section.title}
                  </h3>
                </div>

                {/* Section badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    H{section.level}
                  </span>
                </div>
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <MarkdownDisplay content={section.content} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Table of Contents (for large documents) */}
      {sections.length > 5 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Table of Contents
          </h4>
          <div className="space-y-1">
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => {
                  toggleSection(index);
                  if (!expandedSections.has(index)) {
                    // Scroll to section after expanding
                    setTimeout(() => {
                      document.getElementById(`section-${index}`)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 300);
                  }
                }}
                className="block w-full text-left px-3 py-2 text-sm text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                style={{ paddingLeft: `${section.level * 0.75}rem` }}
              >
                <span className="text-xs text-blue-600 dark:text-blue-400 mr-2">
                  {section.level === 1 ? '▸' : section.level === 2 ? '▹' : '·'}
                </span>
                {section.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
