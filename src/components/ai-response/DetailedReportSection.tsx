'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText, Book, Download, Mail, Printer } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { CGTReportPDF } from './CGTReportPDF';
import EmailModal from './EmailModal';
import { useTimelineStore } from '@/store/timeline';

interface DetailedReportSectionProps {
  analysis?: any;
  calculations?: any;
  validation?: any;
  response?: any; // Full response for export
}

export default function DetailedReportSection({ analysis, calculations, validation, response }: DetailedReportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Get properties and events from timeline store for PDF flowchart
  const { properties, events } = useTimelineStore();

  if (!analysis && !calculations && !validation) return null;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exporting PDF with:', {
        properties: properties.length,
        events: events.length,
        response: response ? 'present' : 'missing'
      });

      // Generate PDF using @react-pdf/renderer with native flowchart components
      const blob = await pdf(
        <CGTReportPDF
          response={response}
          properties={properties}
          events={events}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CGT-Analysis-${response?.analysis_id || 'report'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ PDF exported successfully');
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Failed to export PDF. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailButtonClick = async () => {
    // Show email modal
    setShowEmailModal(true);
  };

  const handleSendEmail = async (email: string) => {
    setIsSendingEmail(true);
    try {
      // Generate PDF with native flowchart components
      const blob = await pdf(
        <CGTReportPDF
          response={response}
          properties={properties}
          events={events}
        />
      ).toBlob();

      // Create FormData to send email with PDF attachment
      const formData = new FormData();
      formData.append('email', email);
      formData.append('pdf', blob, `CGT-Analysis-${response?.analysis_id || 'report'}.pdf`);
      formData.append('filename', `CGT-Analysis-${response?.analysis_id || 'report'}.pdf`);

      const res = await fetch('/api/send-email', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to send email');
      }

      const result = await res.json();
      if (result.success) {
        alert('✅ Report sent to your email successfully!');
        setShowEmailModal(false);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Failed to send email. Please try again or download the PDF instead.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header with Actions */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Detailed Analysis Report
          </h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors disabled:opacity-50"
            title="Download as PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'PDF'}</span>
          </button>

          <button
            onClick={handleEmailButtonClick}
            disabled={isSendingEmail}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg transition-colors disabled:opacity-50"
            title="Send to Email"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">{isSendingEmail ? 'Sending...' : 'Email'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 space-y-8 bg-white dark:bg-gray-900">
              {/* Executive Summary */}
              {analysis?.summary && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Executive Summary
                    </h3>
                  </div>
                  <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Per-Property Analysis */}
              {analysis?.per_property_analysis && analysis.per_property_analysis.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Property-by-Property Analysis
                  </h3>
                  <div className="space-y-4">
                    {analysis.per_property_analysis.map((property: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Property Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 p-4 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-2">
                            {property.property_address}
                          </h4>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              property.status === 'sold'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            }`}>
                              {property.status?.toUpperCase()}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">•</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              property.exemption === 'full'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : property.exemption === 'partial'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {property.exemption === 'full' && 'Full Exemption'}
                              {property.exemption === 'partial' && 'Partial Exemption'}
                              {property.exemption === 'none' && 'No Exemption'}
                            </span>
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="p-5 space-y-4">
                          {/* Reasoning */}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              📝 Reasoning
                            </h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-4 border-l-2 border-blue-300 dark:border-blue-700">
                              {property.reasoning}
                            </p>
                          </div>

                          {/* Cross-Property Impact */}
                          {property.cross_property_impact && (
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                🔗 Cross-Property Impact
                              </h5>
                              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed pl-4 border-l-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
                                {property.cross_property_impact}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-Property Intelligence */}
              {analysis?.cross_property_intelligence && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Portfolio Intelligence
                  </h3>
                  <div className="p-5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {analysis.cross_property_intelligence}
                    </p>
                  </div>
                </div>
              )}

              {/* Validation Information */}
              {validation && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Analysis Validation
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {validation.citation_check && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                          ATO Citations
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {validation.citation_check.valid_citations || 0}/{validation.citation_check.total_citations || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                          Valid references
                        </div>
                      </div>
                    )}
                    {validation.calculation_check && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Calculations
                        </div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {validation.calculation_check.calculations_verified || 0}/{validation.calculation_check.calculations_found || 0}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                          Verified
                        </div>
                      </div>
                    )}
                    {validation.logic_check && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                          Completeness
                        </div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {validation.logic_check.completeness_score || 0}%
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                          Data quality
                        </div>
                      </div>
                    )}
                    {validation.overall_confidence !== undefined && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                          Confidence
                        </div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                          {validation.overall_confidence}%
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          Overall
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logic Checks Details */}
                  {validation.logic_check?.checks_passed && validation.logic_check.checks_passed.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        ✅ Validation Checks Passed
                      </h4>
                      <ul className="space-y-1">
                        {validation.logic_check.checks_passed.map((check: string, index: number) => (
                          <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            {check}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Analysis ID & Timestamp */}
              {response && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Analysis ID:</span> {response.analysis_id}
                    </div>
                    <div>
                      <span className="font-medium">Generated:</span>{' '}
                      {new Date(response.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleSendEmail}
        isSending={isSendingEmail}
      />
    </div>
  );
}
