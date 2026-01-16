'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SubdivisionConnection } from '@/lib/subdivision-helpers';

interface SubdivisionSplitVisualProps {
  connections: SubdivisionConnection[];
  containerHeight: number;
  containerWidth: number;
}

/**
 * Renders the visual branching lines that show property subdivision
 * Draws SVG paths from parent to child properties at the subdivision date
 */
export default function SubdivisionSplitVisual({
  connections,
  containerHeight,
  containerWidth,
}: SubdivisionSplitVisualProps) {
  if (connections.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: containerWidth,
        height: containerHeight,
        zIndex: 1,
      }}
    >
      <defs>
        {/* Gradient for subdivision lines */}
        <linearGradient id="subdivisionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
        </linearGradient>

        {/* Arrow marker for subdivision direction */}
        <marker
          id="subdivisionArrow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="#EC4899"
            opacity="0.6"
          />
        </marker>
      </defs>

      {connections.map((connection, index) => {
        const { splitPosition, parentY, childY } = connection;

        // Convert splitPosition from percentage (0-100) to pixels
        const splitX = (splitPosition / 100) * containerWidth;

        // Convert yOffset to actual rendered position
        // PropertyBranch uses: branchY = 100 + branchIndex * 120
        // branchIndex = yOffset / 80
        // So: branchY = 100 + (yOffset / 80) * 120
        const parentBranchY = 100 + (parentY / 80) * 120;
        const childBranchY = 100 + (childY / 80) * 120;

        // Calculate control points for smooth curve
        const startX = splitX;
        const startY = parentBranchY + 40; // Offset to center of property lane
        const endX = splitX + 60; // Extend horizontally a bit
        const endY = childBranchY + 40;

        // Create a smooth cubic bezier curve
        const controlX1 = startX + 30;
        const controlY1 = startY;
        const controlX2 = startX + 30;
        const controlY2 = endY;

        const pathD = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

        return (
          <motion.g
            key={`${connection.parentId}-${connection.childId}`}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            {/* Main subdivision path */}
            <motion.path
              d={pathD}
              stroke="url(#subdivisionGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8 4"
              strokeLinecap="round"
              markerEnd="url(#subdivisionArrow)"
            />

            {/* Glow effect */}
            <motion.path
              d={pathD}
              stroke="#EC4899"
              strokeWidth="6"
              fill="none"
              opacity="0.2"
              strokeLinecap="round"
            />

            {/* Split point indicator */}
            <motion.circle
              cx={startX}
              cy={startY}
              r="6"
              fill="#EC4899"
              stroke="#FFF"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
            />

            {/* Optional: Label showing subdivision */}
            {connection.splitDate && (
              <motion.g
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.5 }}
              >
                <rect
                  x={startX - 30}
                  y={startY - 30}
                  width="60"
                  height="20"
                  rx="4"
                  fill="#EC4899"
                  opacity="0.9"
                />
                <text
                  x={startX}
                  y={startY - 16}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-white"
                  style={{ fontSize: '10px' }}
                >
                  SPLIT
                </text>
              </motion.g>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
