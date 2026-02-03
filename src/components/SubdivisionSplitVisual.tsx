'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SubdivisionConnection } from '@/lib/subdivision-helpers';

interface SubdivisionSplitVisualProps {
  connections: SubdivisionConnection[];
}

/**
 * Renders the visual branching lines that show property subdivision
 * Draws SVG paths from parent to child properties at the subdivision date
 * NOTE: This component returns <g> elements to be rendered inside the main timeline SVG
 */
export default function SubdivisionSplitVisual({
  connections,
}: SubdivisionSplitVisualProps) {
  if (connections.length === 0) return null;

  return (
    <>
      {connections.map((connection, index) => {
        const { splitPosition, parentY, childY } = connection;

        // Use percentage-based X coordinates to match PropertyBranch coordinate system
        const xPercent = `${splitPosition}%`;

        // Convert yOffset to actual rendered position
        // PropertyBranch uses: branchY = 100 + branchIndex * 120
        // subdivision-helpers uses BRANCH_VERTICAL_SPACING = 100, so yOffset/100 gives branchIndex
        const parentBranchY = 100 + (parentY / 100) * 120;
        const childBranchY = 100 + (childY / 100) * 120;

        return (
          <motion.g
            key={`${connection.parentId}-${connection.childId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            {/* Main subdivision line - using <line> to support percentage coordinates */}
            <motion.line
              x1={xPercent}
              y1={parentBranchY}
              x2={xPercent}
              y2={childBranchY}
              stroke="url(#subdivisionGradient)"
              strokeWidth="3"
              strokeDasharray="8 4"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            />

            {/* Glow effect */}
            <motion.line
              x1={xPercent}
              y1={parentBranchY}
              x2={xPercent}
              y2={childBranchY}
              stroke="#EC4899"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="8 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            />

            {/* SPLIT badge removed - subdivision event circle is now interactive and clickable */}
            {/* The subdivision event is rendered via EventCircle in PropertyBranch */}
          </motion.g>
        );
      })}
    </>
  );
}
