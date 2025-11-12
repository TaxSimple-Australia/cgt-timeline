'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import {
  X,
  Edit2,
  Trash2,
  Home,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Calculator,
  FileText
} from 'lucide-react';
import DeletePropertyModal from './DeletePropertyModal';

export default function PropertyPanel() {
  const {
    selectedProperty,
    properties,
    events,
    selectProperty,
    updateProperty,
    deleteProperty
  } = useTimelineStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const property = properties.find(p => p.id === selectedProperty);
  if (!property) return null;
  
  const propertyEvents = events
    .filter(e => e.propertyId === property.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate key metrics
  const purchaseEvent = propertyEvents.find(e => e.type === 'purchase');
  const saleEvent = propertyEvents.find(e => e.type === 'sale');
  const improvements = propertyEvents
    .filter(e => e.type === 'improvement')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalInvestment = (purchaseEvent?.amount || 0) + improvements;
  const capitalGain = saleEvent ? (saleEvent.amount || 0) - totalInvestment : null;

  // Calculate total cost base for CGT
  const calculateCostBase = () => {
    let costBase = 0;

    // Element 1: Purchase price
    if (purchaseEvent?.amount) {
      costBase += purchaseEvent.amount;
    }

    // Element 2: Acquisition costs
    if (purchaseEvent?.purchaseLegalFees) costBase += purchaseEvent.purchaseLegalFees;
    if (purchaseEvent?.valuationFees) costBase += purchaseEvent.valuationFees;
    if (purchaseEvent?.stampDuty) costBase += purchaseEvent.stampDuty;
    if (purchaseEvent?.purchaseAgentFees) costBase += purchaseEvent.purchaseAgentFees;

    // Element 3: Holding costs
    if (purchaseEvent?.landTax) costBase += purchaseEvent.landTax;
    if (purchaseEvent?.insurance) costBase += purchaseEvent.insurance;

    // Element 4: Capital improvements
    propertyEvents.filter(e => e.type === 'improvement').forEach(e => {
      if (e.improvementCost) costBase += e.improvementCost;
      if (e.amount && !e.improvementCost) costBase += e.amount; // fallback to amount
    });

    // Element 5: Title legal fees
    if (purchaseEvent?.titleLegalFees) costBase += purchaseEvent.titleLegalFees;

    // Element 6: Disposal costs (if sold)
    if (saleEvent?.saleLegalFees) costBase += saleEvent.saleLegalFees;
    if (saleEvent?.saleAgentFees) costBase += saleEvent.saleAgentFees;

    return costBase;
  };

  const totalCostBase = calculateCostBase();
  
  // Calculate ownership period
  const ownershipDays = purchaseEvent && saleEvent
    ? Math.floor((saleEvent.date.getTime() - purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24))
    : purchaseEvent
    ? Math.floor((new Date().getTime() - purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const ownershipYears = Math.floor(ownershipDays / 365);
  const ownershipMonths = Math.floor((ownershipDays % 365) / 30);
  
  const handleSave = (field: string, value: string) => {
    updateProperty(property.id, { [field]: value });
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteProperty(property.id);
    selectProperty(null);
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <AnimatePresence>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4"
        onClick={() => selectProperty(null)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: property.color }}
              />
              {isEditing ? (
                <input
                  type="text"
                  value={property.name}
                  onChange={(e) => handleSave('name', e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  className="text-lg font-bold border-b border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{property.name}</h2>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <Edit2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteClick}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                title="Delete Property"
              >
                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => selectProperty(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>


          {property.address && (
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="w-3 h-3" />
              <span>{property.address}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Key Metrics */}
          <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Purchase Price</span>
              </div>
              {purchaseEvent ? (
                <>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(purchaseEvent.amount || 0)}
                  </div>
                  {(purchaseEvent.landPrice !== undefined || purchaseEvent.buildingPrice !== undefined) && (
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Land:</span>
                        <span className="font-semibold">{formatCurrency(purchaseEvent.landPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Building:</span>
                        <span className="font-semibold">{formatCurrency(purchaseEvent.buildingPrice || 0)}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">-</div>
              )}
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Current Value</span>
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {property.currentValue ? formatCurrency(property.currentValue) : '-'}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Calculator className="w-4 h-4" />
                <span className="text-xs font-medium">Total Investment</span>
              </div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(totalInvestment)}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${capitalGain && capitalGain > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
              <div className={`flex items-center gap-2 mb-1 ${capitalGain && capitalGain > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Capital Gain</span>
              </div>
              <div className={`text-lg font-bold ${capitalGain && capitalGain > 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                {capitalGain ? formatCurrency(capitalGain) : '-'}
              </div>
            </div>
          </div>

          {/* Cost Base Breakdown for CGT */}
          {purchaseEvent && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 dark:border-indigo-800">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-200 dark:text-indigo-300 mb-3">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-semibold">Cost Base for CGT</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Element 1: Purchase Price */}
                {purchaseEvent.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-600 dark:text-indigo-300">Purchase Price</span>
                    <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.amount)}</span>
                  </div>
                )}

                {/* Element 2: Acquisition Costs */}
                {(purchaseEvent.purchaseLegalFees || purchaseEvent.valuationFees || purchaseEvent.stampDuty || purchaseEvent.purchaseAgentFees) && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Acquisition Costs</div>
                    {purchaseEvent.purchaseLegalFees && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Professional Fees</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.purchaseLegalFees)}</span>
                      </div>
                    )}
                    {purchaseEvent.valuationFees && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Valuation Fees</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.valuationFees)}</span>
                      </div>
                    )}
                    {purchaseEvent.stampDuty && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Stamp Duty</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.stampDuty)}</span>
                      </div>
                    )}
                    {purchaseEvent.purchaseAgentFees && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Agent Fees</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.purchaseAgentFees)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Element 3: Holding Costs */}
                {(purchaseEvent.landTax || purchaseEvent.insurance) && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Holding Costs</div>
                    {purchaseEvent.landTax && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Land Tax</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.landTax)}</span>
                      </div>
                    )}
                    {purchaseEvent.insurance && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Insurance</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.insurance)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Element 4: Capital Improvements */}
                {propertyEvents.filter(e => e.type === 'improvement' && (e.improvementCost || e.amount)).length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Capital Improvements</div>
                    {propertyEvents.filter(e => e.type === 'improvement').map(impEvent => (
                      <div key={impEvent.id} className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 truncate">{impEvent.title}</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                          {formatCurrency(impEvent.improvementCost || impEvent.amount || 0)}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {/* Element 5: Title Legal Fees */}
                {purchaseEvent.titleLegalFees && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Title Defense</div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-indigo-600 dark:text-indigo-300">Legal Fees (Title)</span>
                      <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.titleLegalFees)}</span>
                    </div>
                  </>
                )}

                {/* Element 6: Disposal Costs */}
                {saleEvent && (saleEvent.saleLegalFees || saleEvent.saleAgentFees) && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Disposal Costs</div>
                    {saleEvent.saleLegalFees && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Legal Fees (Sale)</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(saleEvent.saleLegalFees)}</span>
                      </div>
                    )}
                    {saleEvent.saleAgentFees && (
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300">Agent Fees (Sale)</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(saleEvent.saleAgentFees)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Total Cost Base */}
                <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-indigo-300">
                  <span className="font-bold text-indigo-700">Total Cost Base</span>
                  <span className="font-bold text-lg text-indigo-900 dark:text-indigo-100">{formatCurrency(totalCostBase)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Ownership Period */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Ownership Period</span>
            </div>
            <div className="text-slate-800 dark:text-slate-200">
              {ownershipYears > 0 && <span className="font-bold">{ownershipYears} years </span>}
              {ownershipMonths > 0 && <span className="font-bold">{ownershipMonths} months</span>}
              {ownershipDays > 0 && ownershipYears === 0 && ownershipMonths === 0 && (
                <span className="font-bold">{ownershipDays} days</span>
              )}
              {ownershipDays === 0 && <span className="text-slate-500 dark:text-slate-400">Not yet purchased</span>}
            </div>
            {ownershipDays > 365 && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ Eligible for 50% CGT discount
              </div>
            )}
          </div>
          
          {/* Events Timeline */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Event History
            </h3>
            <div className="space-y-2">
              {propertyEvents.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No events yet. Click on the timeline to add events.
                </p>
              ) : (
                propertyEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-8 pb-4"
                  >
                    {/* Connection line */}
                    {index < propertyEvents.length - 1 && (
                      <div className="absolute left-3 top-6 w-0.5 h-full bg-slate-200 dark:bg-slate-700" />
                    )}

                    {/* Event dot */}
                    <div
                      className="absolute left-2 top-2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />

                    {/* Event content */}
                    <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-100">
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {format(event.date, 'dd MMM yyyy')}
                        </span>
                      </div>
                      {event.amount && (
                        <>
                          <div className="text-sm font-bold" style={{ color: event.color }}>
                            {formatCurrency(event.amount)}
                          </div>
                          {/* Show land/building breakdown for purchases if available */}
                          {event.type === 'purchase' && (event.landPrice !== undefined || event.buildingPrice !== undefined) && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 space-y-0.5 border-t border-slate-100 dark:border-slate-600 pt-1">
                              <div className="flex justify-between">
                                <span>Land:</span>
                                <span className="font-semibold">{formatCurrency(event.landPrice || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Building:</span>
                                <span className="font-semibold">{formatCurrency(event.buildingPrice || 0)}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {event.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
        </div>
      </motion.div>
      </div>

      {/* Delete Property Modal */}
      {showDeleteModal && (
        <DeletePropertyModal
          property={property}
          events={propertyEvents}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </AnimatePresence>
  );
}
