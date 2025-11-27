'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, DollarSign, FileText, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { CostBaseSummaryPDF } from './CostBaseSummaryPDF';
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
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Generate PDF using @react-pdf/renderer
      const blob = await pdf(
        <CostBaseSummaryPDF
          event={event}
          propertyAddress={propertyAddress}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const eventType = event.type === 'purchase' ? 'Purchase' : event.type === 'sale' ? 'Sale' : 'Improvement';
      link.download = `Cost-Base-${eventType}-${propertyAddress.replace(/[^a-z0-9]/gi, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printContentRef.current) return;

    const content = printContentRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cost Base Summary - ${propertyAddress}</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              padding: 50px;
              line-height: 1.6;
              color: #1f2937;
              background: #fff;
            }

            .header {
              margin-bottom: 40px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 25px;
            }

            .header h1 {
              font-size: 28px;
              margin-bottom: 12px;
              color: #1e40af;
              font-weight: 700;
              letter-spacing: -0.5px;
            }

            .header-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 15px;
            }

            .header p {
              color: #4b5563;
              font-size: 14px;
              margin: 4px 0;
            }

            .header .property {
              font-weight: 600;
              color: #1f2937;
              font-size: 16px;
            }

            .section-header {
              background: #f3f4f6;
              padding: 12px 16px;
              margin: 30px 0 15px 0;
              border-left: 4px solid #2563eb;
              font-weight: 600;
              font-size: 16px;
              color: #1f2937;
            }

            .cost-items-container {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }

            .cost-item {
              display: flex;
              justify-content: space-between;
              padding: 14px 20px;
              border-bottom: 1px solid #e5e7eb;
              transition: background 0.2s;
            }

            .cost-item:nth-child(even) {
              background: #f9fafb;
            }

            .cost-item:last-child {
              border-bottom: none;
            }

            .item-name {
              font-weight: 500;
              color: #374151;
              flex: 1;
            }

            .item-amount {
              font-weight: 600;
              white-space: nowrap;
              color: #1f2937;
              margin-left: 20px;
              text-align: right;
              font-family: 'Courier New', monospace;
            }

            .total-section {
              margin-top: 30px;
              padding: 20px;
              background: #f9fafb;
              border: 2px solid #d1d5db;
              border-radius: 8px;
            }

            .total {
              display: flex;
              justify-content: space-between;
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
            }

            .total-amount {
              font-family: 'Courier New', monospace;
              color: #1e40af;
            }

            .sale-price {
              background: linear-gradient(to right, #dbeafe, #eff6ff);
              padding: 18px 20px;
              margin-bottom: 25px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              border: 1px solid #93c5fd;
              font-size: 16px;
              font-weight: 600;
            }

            .sale-price .amount {
              color: #1e40af;
              font-family: 'Courier New', monospace;
              font-size: 18px;
            }

            .net-proceeds {
              background: linear-gradient(to right, #dcfce7, #f0fdf4);
              padding: 20px;
              margin-top: 30px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              border: 2px solid #86efac;
              font-size: 18px;
            }

            .net-proceeds .amount {
              color: #15803d;
              font-family: 'Courier New', monospace;
              font-size: 20px;
            }

            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }

            .footer p {
              margin: 5px 0;
            }

            @media print {
              body {
                padding: 30px;
              }

              .cost-item:nth-child(even) {
                background: #fafafa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .sale-price, .net-proceeds {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .section-header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
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
    : isSale ? 'Sale Proceeds Summary'
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
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
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
                  <div className="header-info">
                    <p className="property"><strong>Property:</strong> {propertyAddress}</p>
                    <p><strong>Event Date:</strong> {format(event.date, 'dd MMMM yyyy')}</p>
                    <p><strong>Report Generated:</strong> {format(new Date(), 'dd MMMM yyyy')}</p>
                    <p><strong>Time:</strong> {format(new Date(), 'HH:mm')}</p>
                  </div>
                </div>

                {isSale && event.amount && (
                  <>
                    <div className="section-header">Sale Information</div>
                    <div className="sale-price">
                      <span>Gross Sale Proceeds</span>
                      <span className="amount">${event.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}

                <div className="section-header">
                  {isPurchase ? 'Cost Base Items' : isSale ? 'Selling Costs' : 'Improvement Costs'}
                </div>

                <div className="cost-items-container">
                  {costBases.map((item) => (
                    <div key={item.id} className="cost-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-amount">${item.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>

                <div className="total-section">
                  <div className="total">
                    <span>Total {isPurchase ? 'Cost Base' : isSale ? 'Selling Costs' : 'Improvements'}:</span>
                    <span className="total-amount">${total.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {isSale && event.amount && (
                  <div className="net-proceeds">
                    <span>Net Sale Proceeds</span>
                    <span className="amount">${(event.amount - total).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="footer">
                  <p>CGT Timeline Analysis - Cost Base Summary Report</p>
                  <p>{costBases.length} item{costBases.length !== 1 ? 's' : ''} • Generated on {format(new Date(), 'dd MMMM yyyy')} at {format(new Date(), 'HH:mm')}</p>
                </div>
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
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Generating...' : 'Download PDF'}
                  </button>
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
