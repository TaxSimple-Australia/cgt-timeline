'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, DollarSign, FileText } from 'lucide-react';
import type { TimelineEvent, CostBaseItem } from '@/store/timeline';
import { format } from 'date-fns';

interface CostBaseSummaryModalProps {
  event: TimelineEvent;
  propertyAddress: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CostBaseSummaryModal({
  event,
  propertyAddress,
  isOpen,
  onClose,
}: CostBaseSummaryModalProps) {
  const handlePrint = () => {
    window.print();
  };

  // Group cost bases by category
  const groupedCostBases = (event.costBases || []).reduce((acc, cb) => {
    if (!acc[cb.category]) {
      acc[cb.category] = [];
    }
    acc[cb.category].push(cb);
    return acc;
  }, {} as Record<string, CostBaseItem[]>);

  // Category labels
  const categoryLabels: Record<string, string> = {
    element1: 'Element 1: Acquisition Costs',
    element2: 'Element 2: Incidental Costs',
    element3: 'Element 3: Holding Costs',
    element4: 'Element 4: Capital Improvements',
    element5: 'Element 5: Title Costs',
  };

  // Calculate totals
  const categoryTotals = Object.entries(groupedCostBases).reduce((acc, [category, items]) => {
    acc[category] = items.reduce((sum, item) => sum + item.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  const isPurchase = event.type === 'purchase';
  const isSale = event.type === 'sale';
  const isImprovement = event.type === 'improvement';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[20000] print:hidden"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[20001] p-4 print:p-0 print:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col print:max-h-none print:h-auto print:shadow-none print:border-0 print:rounded-none"
            >
              {/* Header - Hidden on print */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-6 py-4 flex items-center justify-between print:hidden flex-shrink-0">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isPurchase && 'Purchase Cost Base Summary'}
                      {isSale && 'Sale Proceeds & Costs Summary'}
                      {isImprovement && 'Improvement Costs Summary'}
                    </h2>
                    <p className="text-sm text-blue-100">
                      {propertyAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Print Summary"
                  >
                    <Printer className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Print-only Header */}
              <div className="hidden print:block px-8 py-6 border-b-2 border-gray-300">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isPurchase && 'Purchase Cost Base Summary'}
                  {isSale && 'Sale Proceeds & Costs Summary'}
                  {isImprovement && 'Improvement Costs Summary'}
                </h1>
                <p className="text-lg text-gray-700 mb-1">{propertyAddress}</p>
                <p className="text-sm text-gray-600">
                  Date: {format(event.date, 'dd MMMM yyyy')}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Generated: {format(new Date(), 'dd MMMM yyyy HH:mm')}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 print:p-8">
                {/* Sale Price (for sale events) */}
                {isSale && event.amount && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg print:bg-gray-50 print:border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900">
                        Gross Sale Proceeds:
                      </span>
                      <span className="text-2xl font-bold text-green-700 dark:text-green-400 print:text-gray-900">
                        ${event.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cost Bases by Category */}
                <div className="space-y-6">
                  {Object.entries(groupedCostBases)
                    .sort(([catA], [catB]) => catA.localeCompare(catB))
                    .map(([category, items]) => (
                      <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden print:border-gray-400 print:break-inside-avoid">
                        {/* Category Header */}
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 print:bg-gray-200 print:border-gray-400">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900">
                            {categoryLabels[category] || category}
                          </h3>
                        </div>

                        {/* Category Items */}
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 print:hover:bg-white"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100 print:text-gray-900">
                                    {item.name}
                                  </div>
                                  {item.description && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 print:text-gray-700">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap print:text-gray-900">
                                  ${item.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Category Subtotal */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t-2 border-gray-300 dark:border-gray-600 print:bg-gray-100 print:border-gray-400">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-gray-900">
                              {categoryLabels[category]} Subtotal:
                            </span>
                            <span className="font-bold text-gray-900 dark:text-gray-100 print:text-gray-900">
                              ${categoryTotals[category].toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Grand Total */}
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg print:bg-gray-100 print:border-gray-400 print:break-inside-avoid">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 print:text-gray-700">
                        {isPurchase && 'Total Acquisition Cost Base'}
                        {isSale && 'Total Selling Costs'}
                        {isImprovement && 'Total Improvement Costs'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 print:text-gray-600">
                        {isPurchase && 'Purchase price + all acquisition costs'}
                        {isSale && 'Deductible costs from sale proceeds'}
                        {isImprovement && 'Capital improvements to cost base'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 print:text-gray-900">
                        ${grandTotal.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Proceeds (for sale events) */}
                {isSale && event.amount && (
                  <div className="mt-4 p-5 bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-lg print:bg-gray-100 print:border-gray-400 print:break-inside-avoid">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 print:text-gray-700">
                          Net Sale Proceeds
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 print:text-gray-600">
                          Gross proceeds minus selling costs
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-700 dark:text-green-400 print:text-gray-900">
                          ${(event.amount - grandTotal).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer note */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg print:bg-white print:border-gray-300 print:break-inside-avoid">
                  <p className="text-xs text-gray-600 dark:text-gray-400 print:text-gray-700">
                    <strong>Note:</strong> This summary shows all cost base elements that may be deductible for CGT purposes.
                    Consult with a tax professional for specific advice on your situation.
                  </p>
                </div>
              </div>

              {/* Footer - Hidden on print */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between print:hidden flex-shrink-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {event.costBases?.length || 0} cost base item{(event.costBases?.length || 0) !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Summary
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
