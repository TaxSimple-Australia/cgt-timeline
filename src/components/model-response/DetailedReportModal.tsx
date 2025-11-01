'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Home,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Download,
  Printer,
} from 'lucide-react';
import type { CGTModelResponse } from '@/types/model-response';
import { format } from 'date-fns';

interface DetailedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CGTModelResponse;
}

export default function DetailedReportModal({
  isOpen,
  onClose,
  data,
}: DetailedReportModalProps) {
  const { properties, response, additional_info } = data;
  const breakdown = response.detailed_breakdown;

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-2xl">Detailed CGT Report</DialogTitle>
          </div>
          <DialogDescription>
            Comprehensive breakdown of your capital gains tax calculation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Summary Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Summary
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {response.summary}
            </p>
            {response.recommendation && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Recommendation:</span>{' '}
                  {response.recommendation}
                </p>
              </div>
            )}
          </motion.div>

          {/* Financial Breakdown */}
          {breakdown && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Financial Breakdown
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Capital Gain
                    </span>
                  </div>
                  <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {formatCurrency(breakdown.capital_gain)}
                  </span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Cost Base
                    </span>
                  </div>
                  <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                    {formatCurrency(breakdown.cost_base)}
                  </span>
                </div>
                {breakdown.discount_applied !== undefined && (
                  <div className="px-6 py-4 flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        CGT Discount (50%)
                      </span>
                    </div>
                    <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                      -{formatCurrency(breakdown.discount_applied)}
                    </span>
                  </div>
                )}
                <div className="px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Total Tax Payable
                  </span>
                  <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">
                    {formatCurrency(breakdown.tax_payable)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Properties Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Property Details
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {properties.map((property, index) => (
                <div key={index} className="p-6">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    {property.address}
                  </h4>

                  {/* Property History */}
                  <div className="space-y-3">
                    {property.property_history.map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                              {event.event}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(event.date)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            {event.price !== undefined && (
                              <span className="text-gray-700 dark:text-gray-300">
                                Price: {formatCurrency(event.price)}
                              </span>
                            )}
                            {event.price_per_week !== undefined && (
                              <span className="text-gray-700 dark:text-gray-300">
                                Rent: ${event.price_per_week}/week
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Property Notes */}
                  {property.notes && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-900 dark:text-amber-200">
                        <span className="font-medium">Note:</span> {property.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Additional Information */}
          {additional_info && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Additional Information
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additional_info.australian_resident !== undefined && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">
                      Australian Resident
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {additional_info.australian_resident ? 'Yes' : 'No'}
                    </dd>
                  </div>
                )}
                {additional_info.other_property_owned !== undefined && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">
                      Other Property Owned
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {additional_info.other_property_owned ? 'Yes' : 'No'}
                    </dd>
                  </div>
                )}
                {additional_info.land_size_hectares !== undefined && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">
                      Land Size
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {additional_info.land_size_hectares} hectares
                    </dd>
                  </div>
                )}
                {additional_info.marginal_tax_rate !== undefined && (
                  <div>
                    <dt className="text-sm text-gray-600 dark:text-gray-400">
                      Marginal Tax Rate
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {additional_info.marginal_tax_rate}%
                    </dd>
                  </div>
                )}
              </dl>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const dataStr = JSON.stringify(data, null, 2);
                const dataUri =
                  'data:application/json;charset=utf-8,' +
                  encodeURIComponent(dataStr);
                const exportFileDefaultName = 'cgt-report.json';
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
            <Button onClick={onClose}>Close</Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
