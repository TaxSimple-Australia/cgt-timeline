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
        const parentBranchY = 100 + (parentY / 80) * 120;
        const childBranchY = 100 + (childY / 80) * 120;

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

            {/* SPLIT badge label */}
            {connection.splitDate && (
              <motion.g
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.5 }}
              >
                {/* Use foreignObject to position badge at percentage coordinate */}
                <foreignObject
                  x={xPercent}
                  y={parentBranchY - 30}
                  width="60"
                  height="20"
                  style={{ overflow: 'visible', transform: 'translateX(-30px)' }}
                >
                  <div className="flex items-center justify-center px-2 py-0.5 rounded bg-pink-500 text-white text-[10px] font-semibold">
                    SPLIT
                  </div>
                </foreignObject>
              </motion.g>
            )}
          </motion.g>
        );
      })}
    </>
  );
}
