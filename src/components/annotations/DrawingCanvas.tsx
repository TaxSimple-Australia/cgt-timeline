'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DrawingPoint,
  DrawingStrokeStyle,
  pathToSvgD,
  calculatePathCenter,
  DEFAULT_DRAWING_STROKE,
} from '@/types/drawing-annotation';

interface DrawingCanvasProps {
  /** Whether drawing mode is active */
  isActive: boolean;
  /** Current stroke style */
  stroke?: DrawingStrokeStyle;
  /** Callback when a drawing is completed */
  onDrawingComplete: (
    path: DrawingPoint[],
    anchorX: number,
    anchorY: number,
    startClientX: number,
    startClientY: number
  ) => void;
  /** The container element for position calculations */
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

/**
 * DrawingCanvas - SVG canvas overlay for freehand drawing
 *
 * When active, captures mouse events to create freehand paths.
 * The path is stored relative to the starting point (anchor).
 * When drawing completes, calls onDrawingComplete with the path and anchor position.
 */
export default function DrawingCanvas({
  isActive,
  stroke = DEFAULT_DRAWING_STROKE,
  onDrawingComplete,
  containerRef,
  className,
}: DrawingCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const anchorRef = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);

  // Convert client coordinates to SVG coordinates relative to anchor
  const clientToSvgPoint = useCallback(
    (clientX: number, clientY: number): DrawingPoint | null => {
      if (!svgRef.current || !anchorRef.current) return null;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();

      // Get point in SVG coordinate space
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Make relative to anchor
      return {
        x: x - anchorRef.current.x,
        y: y - anchorRef.current.y,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isActive) return;

      e.preventDefault();
      e.stopPropagation();

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();

      // Set anchor point (where drawing starts)
      const anchorX = e.clientX - rect.left;
      const anchorY = e.clientY - rect.top;
      anchorRef.current = { x: anchorX, y: anchorY, clientX: e.clientX, clientY: e.clientY };

      // Start with first point at (0, 0) relative to anchor
      setCurrentPath([{ x: 0, y: 0 }]);
      setIsDrawing(true);
    },
    [isActive]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing || !isActive) return;

      const point = clientToSvgPoint(e.clientX, e.clientY);
      if (point) {
        setCurrentPath((prev) => [...prev, point]);
      }
    },
    [isDrawing, isActive, clientToSvgPoint]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing || !anchorRef.current) {
        setIsDrawing(false);
        return;
      }

      // Add final point
      const finalPoint = clientToSvgPoint(e.clientX, e.clientY);
      const finalPath = finalPoint ? [...currentPath, finalPoint] : currentPath;

      // Only create annotation if path has enough points
      if (finalPath.length >= 2) {
        onDrawingComplete(
          finalPath,
          anchorRef.current.x,
          anchorRef.current.y,
          anchorRef.current.clientX,
          anchorRef.current.clientY
        );
      }

      // Reset state
      setIsDrawing(false);
      setCurrentPath([]);
      anchorRef.current = null;
    },
    [isDrawing, currentPath, clientToSvgPoint, onDrawingComplete]
  );

  // Handle mouse leaving the canvas while drawing
  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isDrawing && anchorRef.current && currentPath.length >= 2) {
        onDrawingComplete(
          currentPath,
          anchorRef.current.x,
          anchorRef.current.y,
          anchorRef.current.clientX,
          anchorRef.current.clientY
        );
      }

      setIsDrawing(false);
      setCurrentPath([]);
      anchorRef.current = null;
    },
    [isDrawing, currentPath, onDrawingComplete]
  );

  // Global mouse up handler (in case mouse is released outside canvas)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing && anchorRef.current && currentPath.length >= 2) {
        onDrawingComplete(
          currentPath,
          anchorRef.current.x,
          anchorRef.current.y,
          anchorRef.current.clientX,
          anchorRef.current.clientY
        );
      }

      setIsDrawing(false);
      setCurrentPath([]);
      anchorRef.current = null;
    };

    if (isDrawing) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDrawing, currentPath, onDrawingComplete]);

  // Calculate path for display (translate relative points to SVG space)
  const displayPath = currentPath.map((p) => ({
    x: (anchorRef.current?.x || 0) + p.x,
    y: (anchorRef.current?.y || 0) + p.y,
  }));

  const pathD = pathToSvgD(displayPath);

  if (!isActive) return null;

  return (
    <svg
      ref={svgRef}
      className={cn(
        'absolute inset-0 w-full h-full',
        isActive && 'cursor-crosshair',
        className
      )}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: 100, // Above everything while drawing
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drawing-in-progress path */}
      {isDrawing && currentPath.length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={stroke.opacity ?? 1}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
        />
      )}

      {/* Visual indicator at starting point */}
      {isDrawing && anchorRef.current && (
        <circle
          cx={anchorRef.current.x}
          cy={anchorRef.current.y}
          r={stroke.width}
          fill={stroke.color}
          opacity={0.5}
        />
      )}
    </svg>
  );
}
