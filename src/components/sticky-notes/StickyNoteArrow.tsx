'use client';

import React, { useRef, useCallback } from 'react';

interface StickyNoteArrowProps {
  noteId: string;
  /** Note position in pixels (center of note) */
  noteX: number;
  noteY: number;
  /** Arrow target position in pixels */
  targetX: number;
  targetY: number;
  /** Note border color (for arrow styling) */
  color: string;
  /** Whether the note is minimized */
  isMinimized: boolean;
  /** Whether read-only */
  isReadOnly: boolean;
  /** Callback when arrowhead is dragged to new position */
  onArrowDragEnd: (noteId: string, clientX: number, clientY: number) => void;
}

export default function StickyNoteArrow({
  noteId,
  noteX,
  noteY,
  targetX,
  targetY,
  color,
  isMinimized,
  isReadOnly,
  onArrowDragEnd,
}: StickyNoteArrowProps) {
  const handleRef = useRef<SVGCircleElement>(null);
  const isDraggingRef = useRef(false);

  // Calculate a curved path from note to target
  const dx = targetX - noteX;
  const dy = targetY - noteY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Control point for quadratic bezier - perpendicular offset for curve
  const midX = (noteX + targetX) / 2;
  const midY = (noteY + targetY) / 2;
  // Add perpendicular offset proportional to distance (max 60px) for a natural curve
  const perpScale = Math.min(dist * 0.15, 60);
  // Perpendicular direction (rotate 90 degrees)
  const nx = dist > 0 ? -dy / dist : 0;
  const ny = dist > 0 ? dx / dist : 0;
  const cpX = midX + nx * perpScale;
  const cpY = midY + ny * perpScale;

  // Arrowhead rotation: angle at the target end of the curve
  // For a quadratic bezier, the tangent at t=1 is from control point to end point
  const arrowAngle = Math.atan2(targetY - cpY, targetX - cpX);
  const arrowSize = 10;
  // Triangle points for the arrowhead
  const tipX = targetX;
  const tipY = targetY;
  const leftX = tipX - arrowSize * Math.cos(arrowAngle - Math.PI / 6);
  const leftY = tipY - arrowSize * Math.sin(arrowAngle - Math.PI / 6);
  const rightX = tipX - arrowSize * Math.cos(arrowAngle + Math.PI / 6);
  const rightY = tipY - arrowSize * Math.sin(arrowAngle + Math.PI / 6);

  const pathD = `M ${noteX} ${noteY} Q ${cpX} ${cpY} ${targetX} ${targetY}`;
  const arrowheadD = `M ${tipX} ${tipY} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`;

  const opacity = isMinimized ? 0.4 : 0.7;
  const strokeDasharray = isMinimized ? '6 4' : 'none';

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isReadOnly) return;
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      window.__stickyNoteDragging = true;
      document.body.style.cursor = 'crosshair';
      document.body.style.userSelect = 'none';

      const handle = handleRef.current;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current || !handle) return;
        // Get the SVG element and compute position in SVG coordinates
        const svg = handle.ownerSVGElement;
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = moveEvent.clientX;
        pt.y = moveEvent.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        handle.setAttribute('cx', String(svgPt.x));
        handle.setAttribute('cy', String(svgPt.y));
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        onArrowDragEnd(noteId, upEvent.clientX, upEvent.clientY);
        setTimeout(() => {
          window.__stickyNoteDragging = false;
        }, 100);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [isReadOnly, noteId, onArrowDragEnd]
  );

  return (
    <g opacity={opacity}>
      {/* Curved line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
      />
      {/* Arrowhead triangle */}
      <path d={arrowheadD} fill={color} />
      {/* Draggable handle at target */}
      {!isReadOnly && (
        <circle
          ref={handleRef}
          cx={targetX}
          cy={targetY}
          r={7}
          fill={color}
          stroke="white"
          strokeWidth={2}
          style={{
            pointerEvents: 'auto',
            cursor: 'crosshair',
          }}
          onMouseDown={handleMouseDown}
        >
          <title>Drag to reposition arrow target</title>
        </circle>
      )}
    </g>
  );
}
