'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '@/store/timeline';
import {
  Home,
  DollarSign,
  TrendingUp,
  LogIn,
  LogOut,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface EventCardViewProps {
  event: TimelineEvent;
  cx: string; // X position as percentage
  cy: number; // Y position
  color: string;
  onClick: () => void;
  tier?: number; // Vertical tier for positioning (0 = default, 1-3 = higher tiers)
}

export default function EventCardView({
  event,
  cx,
  cy,
  color,
  onClick,
  tier = 0
}: EventCardViewProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate card Y position based on tier
  const TIER_SPACING = 130; // Pixels between tiers (cards are taller than circles)
  const BASE_CARD_OFFSET = -50; // Base offset from branch center (place above branch)
  const cardY = cy + BASE_CARD_OFFSET + (tier * TIER_SPACING);

  // Determine icon based on event type
  const getEventIcon = () => {
    const iconClass = "w-5 h-5";
    switch (event.type) {
      case 'purchase':
        return <Home className={iconClass} />;
      case 'sale':
        return <TrendingUp className={iconClass} />;
      case 'move_in':
        return <LogIn className={iconClass} />;
      case 'move_out':
        return <LogOut className={iconClass} />;
      case 'rent_start':
      case 'rent_end':
        return <DollarSign className={iconClass} />;
      case 'improvement':
        return <Wrench className={iconClass} />;
      case 'refinance':
        return <RefreshCw className={iconClass} />;
      default:
        return <DollarSign className={iconClass} />;
    }
  };

  // Get event type label
  const getEventTypeLabel = () => {
    switch (event.type) {
      case 'purchase': return 'Purchase';
      case 'sale': return 'Sale';
      case 'move_in': return 'Move In';
      case 'move_out': return 'Move Out';
      case 'rent_start': return 'Rent Start';
      case 'rent_end': return 'Rent End';
      case 'improvement': return 'Improvement';
      case 'refinance': return 'Refinance';
      case 'status_change': return 'Status Change';
      default: return event.type;
    }
  };

  const hasAmount = event.amount !== undefined && event.amount > 0;
  const isPPR = event.isPPR === true;

  // Card dimensions - slightly taller to accommodate all content
  const cardWidth = 180;
  const cardHeight = 115;

  return (
    <g
      className="event-card-group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Connecting line from card to branch */}
      <line
        x1={cx}
        x2={cx}
        y1={cardY + cardHeight}
        y2={cy}
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4,4"
        opacity={0.6}
        className="pointer-events-none"
      />

      {/* Small circle marker on branch line */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="6"
        fill={color}
        stroke="white"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1.3 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      />

      {/* Card Container */}
      <foreignObject
        x={cx}
        y={cardY}
        width={cardWidth}
        height={cardHeight}
        style={{
          overflow: 'visible',
          transform: `translateX(-${cardWidth / 2}px)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{
            opacity: 1,
            scale: isHovered ? 1.05 : 1,
            y: 0
          }}
          transition={{
            duration: 0.3,
            scale: { type: 'spring', stiffness: 300, damping: 20 }
          }}
          className="relative w-full h-full"
        >
          {/* Glow effect on hover */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="absolute inset-0 rounded-xl blur-md"
              style={{ backgroundColor: color }}
            />
          )}

          {/* Main Card */}
          <div
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 overflow-hidden h-full flex flex-col"
            style={{ borderColor: color }}
          >
            {/* Header with colored bar and icon */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5"
              style={{ backgroundColor: `${color}20` }}
            >
              <div
                className="p-1 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color }}
              >
                <div className="text-white">
                  {getEventIcon()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                  {getEventTypeLabel()}
                </div>
              </div>
              {isPPR && (
                <div
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: '#10B98120',
                    color: '#10B981'
                  }}
                >
                  PPR
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 px-2.5 py-1.5 flex flex-col min-h-0">
              {/* Title */}
              <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 truncate mb-1">
                {event.title}
              </div>

              {/* Date */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-auto">
                {format(new Date(event.date), 'MMM dd, yyyy')}
              </div>

              {/* Amount */}
              {hasAmount && (
                <div className="text-[13px] font-bold mt-1 truncate" style={{ color: color }}>
                  ${event.amount?.toLocaleString()}
                </div>
              )}

              {/* Description snippet (if exists and no amount) */}
              {!hasAmount && event.description && (
                <div className="text-[10px] text-slate-500 dark:text-slate-500 line-clamp-2 mt-1">
                  {event.description}
                </div>
              )}

              {/* Hover indicator */}
              {isHovered && (
                <div className="text-[8px] text-slate-400 dark:text-slate-500 text-right mt-0.5">
                  Click to edit
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </foreignObject>
    </g>
  );
}
