'use client';

import React, { useRef } from 'react';
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
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printContentRef.current) return;

    const content = printContentRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cost Base Summary</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { font-size: 24px; margin-bottom: 10px; }
            .header p { color: #666; }
            .cost-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
            .cost-item:last-child { border-bottom: none; }
            .item-name { font-weight: 500; }
            .item-amount { font-weight: 600; white-space: nowrap; }
            .total { margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
            .sale-price { background: #f0f9ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; display: flex; justify-content: space-between; }
            .net-proceeds { background: #f0fdf4; padding: 15px; margin-top: 20px; border-radius: 8px; display: flex; justify-content: space-between; font-weight: bold; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Calculate total
  const costBases = event.costBases || [];
  const total = costBases.reduce((sum, item) => sum + item.amount, 0);

  const isPurchase = event.type === 'purchase';
  const isSale = event.type === 'sale';
  const isImprovement = event.type === 'improvement';

  const title = isPurchase ? 'Purchase Cost Base Summary'
    : isSale ? 'Sale Costs Summary'
    : 'Improvement Costs Summary';

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[20000]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[20001] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <p className="text-sm text-blue-100">{propertyAddress}</p>
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

              {/* Content for Print */}
              <div ref={printContentRef} style={{ display: 'none' }}>
                <div className="header">
                  <h1>{title}</h1>
                  <p>{propertyAddress}</p>
                  <p>Date: {format(event.date, 'dd MMMM yyyy')}</p>
                  <p>Generated: {format(new Date(), 'dd MMMM yyyy HH:mm')}</p>
                </div>

                {isSale && event.amount && (
                  <div className="sale-price">
                    <span>Gross Sale Proceeds:</span>
                    <span>${event.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div>
                  {costBases.map((item) => (
                    <div key={item.id} className="cost-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-amount">${item.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>

                <div className="total">
                  <span>Total:</span>
                  <span>${total.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {isSale && event.amount && (
                  <div className="net-proceeds">
                    <span>Net Sale Proceeds:</span>
                    <span>${(event.amount - total).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* Content for Display */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Sale Price (for sale events) */}
                {isSale && event.amount && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Gross Sale Proceeds:
                      </span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        ${event.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Simple Cost Base List */}
                <div className="space-y-1">
                  {costBases.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap ml-4">
                        ${item.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Total {isPurchase ? 'Cost Base' : isSale ? 'Selling Costs' : 'Improvements'}:
                    </span>
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
                      ${total.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Net Proceeds (for sale events) */}
                {isSale && event.amount && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Net Sale Proceeds:
                      </span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-400">
                        ${(event.amount - total).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {costBases.length} item{costBases.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
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
