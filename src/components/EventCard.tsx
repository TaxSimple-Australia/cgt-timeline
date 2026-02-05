'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TimelineEvent, useTimelineStore } from '@/store/timeline';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Home,
  DollarSign,
  Key,
  Package,
  TrendingUp,
  Hammer,
  Calendar,
  X,
  Edit2,
  Star,
  Gift,
  Users,
  Split,
  Building2
} from 'lucide-react';

interface EventCardProps {
  event: TimelineEvent;
  onDragStart: () => void;
  isConnected?: boolean;
  branchColor: string;
}

const eventIcons: Record<string, React.ReactNode> = {
  purchase: <Home className="w-4 h-4" />,
  move_in: <Key className="w-4 h-4" />,
  move_out: <Package className="w-4 h-4" />,
  rent_start: <DollarSign className="w-4 h-4" />,
  rent_end: <DollarSign className="w-4 h-4" />,
  sale: <TrendingUp className="w-4 h-4" />,
  improvement: <Hammer className="w-4 h-4" />,
  building_start: <Building2 className="w-4 h-4" />,
  building_end: <Building2 className="w-4 h-4" />,
  refinance: <Gift className="w-4 h-4" />,
  ownership_change: <Users className="w-4 h-4" />,
  subdivision: <Split className="w-4 h-4" />,
  custom: <Star className="w-4 h-4" />,
};

export default function EventCard({ 
  event, 
  onDragStart,
  isConnected,
  branchColor 
}: EventCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { updateEvent, deleteEvent, selectEvent, selectedEvent } = useTimelineStore();
  const isSelected = selectedEvent === event.id;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectEvent(event.id);
    onDragStart();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEvent(event.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (updates: Partial<TimelineEvent>) => {
    updateEvent(event.id, updates);
    setIsEditing(false);
  };

  return (
    <motion.div
      className={cn(
        "absolute cursor-move bg-white dark:bg-slate-800 rounded-lg shadow-lg border-2 p-3 min-w-[180px] transition-all",
        isSelected && "ring-2 ring-offset-2 ring-blue-400 z-20",
        isHovered && "shadow-xl scale-105 z-10"
      )}
      style={{
        borderColor: branchColor,
        backgroundColor: isSelected ? `${branchColor}10` : 'white'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-md text-white"
            style={{ backgroundColor: event.color }}
          >
            {eventIcons[event.type]}
          </div>
          {!isEditing ? (
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{event.title}</h4>
          ) : (
            <input
              className="font-semibold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-300 outline-none bg-transparent"
              value={event.title}
              onChange={(e) => handleSave({ title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          )}
        </div>
        {isHovered && (
          <div className="flex gap-1">
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <Edit2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            >
              <X className="w-3 h-3 text-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-2">
        <Calendar className="w-3 h-3" />
        <span>{format(event.date, 'dd MMM yyyy')}</span>
      </div>

      {/* Amount */}
      {event.amount && (
        <div className="font-bold text-sm" style={{ color: branchColor }}>
          {formatCurrency(event.amount)}
        </div>
      )}

      {/* Description */}
      {event.description && !isEditing && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Detailed Hover Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-full ml-2 top-0 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-2xl z-[100] min-w-[240px] max-w-[320px] pointer-events-none"
        >
          <div className="text-sm font-bold mb-1">{event.title}</div>
          <div className="text-xs opacity-75 mb-2 capitalize">{event.type === 'refinance' ? 'Inherit' : event.type.replace('_', ' ')}</div>

          {/* Date Information */}
          <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
            <div className="text-xs font-semibold">Date: {format(event.date, 'MMM dd, yyyy')}</div>
            {event.contractDate && (
              <div className="text-xs opacity-90">Contract: {format(event.contractDate, 'MMM dd, yyyy')}</div>
            )}
            {event.settlementDate && (
              <div className="text-xs opacity-90">Settlement: {format(event.settlementDate, 'MMM dd, yyyy')}</div>
            )}
          </div>

          {/* Price Information */}
          {(event.amount || event.landPrice || event.buildingPrice) && (
            <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
              {event.amount && (
                <div className="text-xs font-semibold">Amount: {formatCurrency(event.amount)}</div>
              )}
              {event.landPrice && (
                <div className="text-xs opacity-90">Land: {formatCurrency(event.landPrice)}</div>
              )}
              {event.buildingPrice && (
                <div className="text-xs opacity-90">Building: {formatCurrency(event.buildingPrice)}</div>
              )}
            </div>
          )}

          {/* Fees and Costs */}
          {(event.stampDuty || event.purchaseLegalFees || event.valuationFees || event.purchaseAgentFees) && (
            <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
              <div className="text-xs font-semibold opacity-75">Associated Costs:</div>
              {event.stampDuty && (
                <div className="text-xs opacity-90">Stamp Duty: {formatCurrency(event.stampDuty)}</div>
              )}
              {event.purchaseLegalFees && (
                <div className="text-xs opacity-90">Legal Fees: {formatCurrency(event.purchaseLegalFees)}</div>
              )}
              {event.valuationFees && (
                <div className="text-xs opacity-90">Valuation: {formatCurrency(event.valuationFees)}</div>
              )}
              {event.purchaseAgentFees && (
                <div className="text-xs opacity-90">Agent Fees: {formatCurrency(event.purchaseAgentFees)}</div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="text-xs opacity-75 mb-2">{event.description}</div>
          )}

          {/* Ownership Change Details */}
          {event.type === 'ownership_change' && (event.leavingOwners || event.newOwners) && (
            <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
              <div className="text-xs font-semibold opacity-75">Ownership Transfer:</div>
              {event.leavingOwners && event.leavingOwners.length > 0 && (
                <div className="text-xs opacity-90">
                  <span className="font-semibold">Leaving: </span>
                  {event.leavingOwners.join(', ')}
                </div>
              )}
              {event.newOwners && event.newOwners.length > 0 && (
                <div className="text-xs opacity-90">
                  <span className="font-semibold">New Owners: </span>
                  {event.newOwners.map((owner, idx) => (
                    <span key={idx}>
                      {owner.name} ({owner.percentage}%)
                      {idx < event.newOwners!.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
              {event.ownershipChangeReason && (
                <div className="text-xs opacity-75">
                  <span className="font-semibold">Reason: </span>
                  {event.ownershipChangeReason === 'divorce' && 'Divorce'}
                  {event.ownershipChangeReason === 'sale_transfer' && 'Sale / Transfer'}
                  {event.ownershipChangeReason === 'gift' && 'Gift'}
                  {event.ownershipChangeReason === 'other' && (event.ownershipChangeReasonOther || 'Other')}
                </div>
              )}
            </div>
          )}

          {/* Subdivision Details */}
          {event.type === 'subdivision' && event.subdivisionDetails && (
            <div className="space-y-1 mb-2 border-b border-white/20 dark:border-slate-900/20 pb-2">
              <div className="text-xs font-semibold opacity-75">Subdivided into {event.subdivisionDetails.totalLots} lots:</div>
              {event.subdivisionDetails.childProperties.map((child, idx) => (
                <div key={child.id} className="text-xs opacity-90">
                  <span className="font-semibold">{child.name}:</span>{' '}
                  {child.lotSize ? `${(child.lotSize / 10000).toFixed(4)} ha` : 'Size N/A'}
                  {child.allocatedCostBase && (
                    <span className="opacity-75"> • {formatCurrency(child.allocatedCostBase)}</span>
                  )}
                </div>
              ))}
              {(event.subdivisionDetails.surveyorFees || event.subdivisionDetails.planningFees ||
                event.subdivisionDetails.legalFees || event.subdivisionDetails.titleFees) && (
                <div className="text-xs opacity-75 mt-1 pt-1 border-t border-white/10">
                  <span className="font-semibold">Fees:</span>
                  {event.subdivisionDetails.surveyorFees && ` Surveyor: ${formatCurrency(event.subdivisionDetails.surveyorFees)}`}
                  {event.subdivisionDetails.planningFees && ` • Planning: ${formatCurrency(event.subdivisionDetails.planningFees)}`}
                  {event.subdivisionDetails.legalFees && ` • Legal: ${formatCurrency(event.subdivisionDetails.legalFees)}`}
                  {event.subdivisionDetails.titleFees && ` • Title: ${formatCurrency(event.subdivisionDetails.titleFees)}`}
                </div>
              )}
            </div>
          )}

          {/* Main Residence Status */}
          {event.isPPR !== undefined && (
            <div className="text-xs opacity-90">
              {event.isPPR ? '🏠 Main Residence' : 'Investment Property'}
            </div>
          )}

          {/* Arrow pointing to card */}
          <div className="absolute right-full mr-[-4px] top-4 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45" />
        </motion.div>
      )}

      {/* Drag Handle Indicator */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
      </div>
    </motion.div>
  );
}
