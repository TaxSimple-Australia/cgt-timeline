'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, FileText, Book, Download, Mail, Printer, Code, Copy, Check, AlertTriangle, Scale, FileCheck, Home, PieChart, BarChart3 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CGTReportPDF } from './CGTReportPDF';
import EmailModal from './EmailModal';
import CalculationBreakdownSection from './CalculationBreakdownSection';
import PropertyAnalysisCard from './PropertyAnalysisCard';
import CostBaseItemizedTable from './CostBaseItemizedTable';
import TimelinePeriodBreakdownTable from './TimelinePeriodBreakdownTable';
import GapOverlapDetailsTable from './GapOverlapDetailsTable';
import TimelineBarView from '../timeline-viz/TimelineBarView';
import TwoColumnLayout from '../timeline-viz/TwoColumnLayout';
import RecommendationsSection from './RecommendationsSection';
import { useTimelineStore } from '@/store/timeline';
import { serializeTimeline } from '@/lib/timeline-serialization';

interface DetailedReportSectionProps {
  properties?: any[];
  analysis?: any;
  calculations?: any;
  validation?: any;
  verification?: any;
  response?: any; // Full response for export
  timelineProperties?: any[];
  timelineEvents?: any[];
}

export default function DetailedReportSection({ properties, analysis, calculations, validation, verification, response, timelineProperties, timelineEvents }: DetailedReportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  // Get properties and events from timeline store for PDF flowchart (or use passed-in props)
  const storeData = useTimelineStore();
  const _timelineProperties = timelineProperties || storeData.properties;
  const _events = timelineEvents || storeData.events;

  if (!analysis && !calculations && !validation) return null;

  // Helper function for rainbow property card borders
  const getPropertyCardBorderColor = (index: number) => {
    const colors = [
      'border-l-blue-500 dark:border-l-blue-600',
      'border-l-purple-500 dark:border-l-purple-600',
      'border-l-pink-500 dark:border-l-pink-600',
      'border-l-orange-500 dark:border-l-orange-600',
      'border-l-teal-500 dark:border-l-teal-600',
      'border-l-indigo-500 dark:border-l-indigo-600'
    ];
    return colors[index % colors.length];
  };

  // Helper function to generate share URL for PDF
  const generateShareUrl = async (): Promise<string | undefined> => {
    if (_timelineProperties.length === 0) return undefined;

    try {
      const serialized = serializeTimeline(_timelineProperties, _events);
      const response = await fetch('/api/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serialized),
      });

      const result = await response.json();
      if (!response.ok) {
        console.warn('Failed to generate share URL:', result.error);
        return undefined;
      }

      return `${window.location.origin}?share=${result.shareId}`;
    } catch (error) {
      console.warn('Error generating share URL:', error);
      return undefined;
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Exporting PDF with:', {
        properties: _timelineProperties.length,
        events: _events.length,
        response: response ? 'present' : 'missing'
      });

      // Generate share URL for the timeline
      const shareUrl = await generateShareUrl();
      console.log('📎 Share URL for PDF:', shareUrl || 'not generated');

      // Generate PDF using @react-pdf/renderer with native flowchart components
      const blob = await pdf(
        <CGTReportPDF
          response={response}
          properties={_timelineProperties}
          events={_events}
          shareUrl={shareUrl}
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
      // Generate share URL for the timeline
      const shareUrl = await generateShareUrl();

      // Generate PDF with native flowchart components
      const blob = await pdf(
        <CGTReportPDF
          response={response}
          properties={_timelineProperties}
          events={_events}
          shareUrl={shareUrl}
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
    const wasExpanded = isExpanded;

    // Expand the section if it's collapsed
    if (!isExpanded) {
      setIsExpanded(true);
    }

    // Wait for the animation to complete before printing
    setTimeout(() => {
      window.print();

      // Restore the previous state after print dialog is closed
      if (!wasExpanded) {
        // Wait a bit for print dialog to fully open before potentially collapsing
        setTimeout(() => {
          setIsExpanded(wasExpanded);
        }, 100);
      }
    }, isExpanded ? 0 : 400); // 400ms matches the animation duration
  };

  const handleCopyJson = async () => {
    if (!response) return;
    try {
      const jsonString = JSON.stringify(response, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch (error) {
      console.error('Error copying JSON:', error);
      alert('Failed to copy JSON to clipboard');
    }
  };

  const handleDownloadJSON = () => {
    if (!response) return;
    try {
      const jsonString = JSON.stringify(response, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cgt-analysis-${response.analysis_id || 'report'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading JSON:', error);
      alert('Failed to download JSON file');
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden print:border-none print:shadow-none">
      {/* Header with Actions */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 print:bg-white print:p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:pointer-events-none"
        >
          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 print:hidden" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 print:text-xl print:text-black">
            Detailed Analysis Report
          </h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400 print:hidden" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400 print:hidden" />
          )}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 print:hidden">
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

          <button
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition-colors"
            title="View Full JSON Response"
          >
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">View JSON</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
            title="Download JSON File"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Expandable Content (Screen) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700 print:hidden"
          >
            <div className="p-6 space-y-8 bg-white dark:bg-gray-900 print:bg-white print:p-4">
              {/* === SECTION A: EXECUTIVE OVERVIEW === */}
              <div className="space-y-8 print:break-inside-avoid border-l-4 border-blue-500 dark:border-blue-600 pl-6 print:border-l-0 print:pl-0">
                <div className="border-t-4 border-blue-500 dark:border-blue-600 pt-6 print:border-t-2 print:border-black print:pt-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2 print:text-black print:mb-4">
                    <span className="text-2xl print:hidden">📊</span>
                    SECTION A: Executive Overview
                  </h2>
                </div>

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

              {/* 1. Portfolio Summary Metrics */}
              {(calculations?.portfolio_total || response?.summary) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Portfolio Summary
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {calculations?.portfolio_total?.total_cgt_liability !== undefined && (
                      <div className={`p-4 bg-gradient-to-br border rounded-lg ${
                        calculations.portfolio_total.total_cgt_liability === 0
                          ? 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-950/10 border-green-200 dark:border-green-800'
                          : 'from-red-50 to-orange-100 dark:from-red-950/20 dark:to-orange-950/10 border-red-200 dark:border-red-800'
                      }`}>
                        <div className={`text-xs font-medium mb-1 ${
                          calculations.portfolio_total.total_cgt_liability === 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Total CGT Liability
                        </div>
                        <div className={`text-2xl font-bold ${
                          calculations.portfolio_total.total_cgt_liability === 0
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(calculations.portfolio_total.total_cgt_liability)}
                        </div>
                        <div className={`text-xs mt-1 ${
                          calculations.portfolio_total.total_cgt_liability === 0
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-red-600 dark:text-red-500'
                        }`}>
                          {calculations.portfolio_total.total_cgt_liability === 0 ? 'Fully exempt' : 'Tax return total'}
                        </div>
                      </div>
                    )}
                    {calculations?.portfolio_total?.total_capital_gain !== undefined && (
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-950/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                          Total Capital Gain
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(calculations.portfolio_total.total_capital_gain)}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                          Before exemptions
                        </div>
                      </div>
                    )}
                    {calculations?.portfolio_total?.total_exempt_amount !== undefined && (
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-950/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                          Total Exempt Amount
                        </div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(calculations.portfolio_total.total_exempt_amount)}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                          Main residence
                        </div>
                      </div>
                    )}
                    {response?.summary?.carry_forward_loss !== undefined && response.summary.carry_forward_loss !== null && (
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-950/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                          Carry-Forward Loss
                        </div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                          {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(response.summary.carry_forward_loss)}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          Available
                        </div>
                      </div>
                    )}
                  </div>
                  {(response?.summary?.main_residence_days || response?.summary?.total_ownership_days) && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                        Portfolio-Wide Statistics
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {response.summary.main_residence_days !== undefined && (
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">Main Residence Days</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {response.summary.main_residence_days.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {response.summary.total_ownership_days !== undefined && (
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">Total Ownership Days</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {response.summary.total_ownership_days.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {response.summary.exemption_percentage !== undefined && (
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">Exemption %</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {response.summary.exemption_percentage.toFixed(2)}%
                            </div>
                          </div>
                        )}
                        {calculations.portfolio_total?.properties_with_cgt !== undefined && (
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">Properties with CGT</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {calculations.portfolio_total.properties_with_cgt}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
              {/* End Section A */}

              {/* === SECTION B: TAX RETURN ESSENTIALS === */}
              <div className="space-y-8 print:break-inside-avoid border-l-4 border-emerald-500 dark:border-emerald-600 pl-6 print:border-l-0 print:pl-0">
                <div className="border-t-4 border-emerald-500 dark:border-emerald-600 pt-6 print:border-t-2 print:border-black print:pt-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2 print:text-black print:mb-4">
                    <span className="text-2xl print:hidden">📄</span>
                    SECTION B: Tax Return Essentials
                  </h2>
                </div>

              {/* ITAA Tax Law Sections */}
              {calculations?.method && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ITAA Tax Law Sections Applied
                    </h3>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {calculations.method.split(',').map((section: string, index: number) => {
                        const sectionTrimmed = section.trim();
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-mono font-semibold rounded-full border border-indigo-300 dark:border-indigo-700"
                            title={`Tax law section: ${sectionTrimmed}`}
                          >
                            {sectionTrimmed}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      These sections of the Income Tax Assessment Act 1997 (ITAA 1997) were applied in calculating your CGT. Reference these sections when lodging your tax return.
                    </p>
                  </div>
                </div>
              )}

              {/* Property-by-Property Analysis */}
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
                        className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden border-l-4 ${getPropertyCardBorderColor(index)} print:border-l-0`}
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

              {/* Detailed Calculations */}
              {calculations?.per_property && calculations.per_property.length > 0 && (
                <CalculationBreakdownSection perPropertyCalculations={calculations.per_property} />
              )}

              {/* Cost Base Itemized Tables */}
              {properties && properties.length > 0 && calculations?.per_property && (
                <div className="space-y-6">
                  {properties.map((property: any, index: number) => {
                    const propCalculations = calculations.per_property.find(
                      (calc: any) =>
                        calc.property_id === property.property_id ||
                        calc.property_id === property.address ||
                        calc.property_address === property.address
                    );

                    if (!propCalculations) return null;

                    return (
                      <div key={index} className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">📍</span>
                          {property.address}
                        </h4>
                        <CostBaseItemizedTable
                          property={property}
                          calculations={propCalculations}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
              {/* End Section B */}

              {/* === SECTION C: SPECIAL RULES & EXEMPTIONS === */}
              <div className="space-y-8 print:break-inside-avoid border-l-4 border-amber-500 dark:border-amber-600 pl-6 print:border-l-0 print:pl-0">
                <div className="border-t-4 border-amber-500 dark:border-amber-600 pt-6 print:border-t-2 print:border-black print:pt-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2 print:text-black print:mb-4">
                    <span className="text-2xl print:hidden">🏛️</span>
                    SECTION C: Special Rules & Exemptions
                  </h2>
                </div>

              {/* Six-Year Rule Analysis */}
              {properties && properties.some((p: any) => p.six_year_rule_applied || p.six_year_reason) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Six-Year Rule Analysis
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {properties.filter((p: any) => p.six_year_rule_applied || p.six_year_reason).map((property: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          property.six_year_rule_applied
                            ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            property.six_year_rule_applied
                              ? 'bg-teal-100 dark:bg-teal-900/30'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {property.six_year_rule_applied ? (
                              <span className="text-lg">✓</span>
                            ) : (
                              <span className="text-lg">○</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">
                              {property.address}
                            </h4>
                            <div className="space-y-2">
                              {property.six_year_rule_applied !== undefined && (
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                                    property.six_year_rule_applied
                                      ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {property.six_year_rule_applied ? 'APPLIED' : 'NOT APPLIED'}
                                  </span>
                                </div>
                              )}
                              {property.six_year_reason && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-4 border-l-2 border-teal-300 dark:border-teal-700">
                                  {property.six_year_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      <strong>Six-Year Rule:</strong> Allows you to treat a property as your main residence for up to 6 years after you move out and rent it, provided you don't claim another property as your main residence during that time.
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline Period Breakdown Tables */}
              {properties && properties.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Property Period Breakdowns
                  </h3>
                  {properties.map((property: any, index: number) => {
                    const propCalculations = calculations?.per_property?.find(
                      (calc: any) =>
                        calc.property_id === property.property_id ||
                        calc.property_id === property.address ||
                        calc.property_address === property.address
                    );

                    // Only show if property has period breakdown
                    if (!property.period_breakdown) return null;

                    return (
                      <div key={index} className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">📍</span>
                          {property.address}
                        </h4>
                        <TimelinePeriodBreakdownTable
                          property={property}
                          calculations={propCalculations}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Gap/Overlap Details Table */}
              {properties && verification && (
                <GapOverlapDetailsTable
                  properties={properties}
                  verification={verification}
                />
              )}

              {/* 4. Timeline Quality Assessment */}
              {verification?.timeline_analysis?.statistics && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Timeline Quality Assessment
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {verification.timeline_analysis.statistics.accounted_percentage !== undefined && (
                      <div className={`p-4 rounded-lg border ${
                        verification.timeline_analysis.statistics.accounted_percentage >= 99
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : verification.timeline_analysis.statistics.accounted_percentage >= 95
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className={`text-xs font-medium mb-1 ${
                          verification.timeline_analysis.statistics.accounted_percentage >= 99
                            ? 'text-green-600 dark:text-green-400'
                            : verification.timeline_analysis.statistics.accounted_percentage >= 95
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Timeline Coverage
                        </div>
                        <div className={`text-2xl font-bold ${
                          verification.timeline_analysis.statistics.accounted_percentage >= 99
                            ? 'text-green-700 dark:text-green-300'
                            : verification.timeline_analysis.statistics.accounted_percentage >= 95
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {verification.timeline_analysis.statistics.accounted_percentage.toFixed(2)}%
                        </div>
                        <div className={`text-xs mt-1 ${
                          verification.timeline_analysis.statistics.accounted_percentage >= 99
                            ? 'text-green-600 dark:text-green-500'
                            : verification.timeline_analysis.statistics.accounted_percentage >= 95
                            ? 'text-amber-600 dark:text-amber-500'
                            : 'text-red-600 dark:text-red-500'
                        }`}>
                          {verification.timeline_analysis.statistics.accounted_percentage >= 99 ? 'Excellent' : verification.timeline_analysis.statistics.accounted_percentage >= 95 ? 'Good' : 'Needs Review'}
                        </div>
                      </div>
                    )}
                    {verification.timeline_analysis.statistics.total_days !== undefined && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Total Days
                        </div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {verification.timeline_analysis.statistics.total_days.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                          Ownership period
                        </div>
                      </div>
                    )}
                    {verification.timeline_analysis.statistics.gap_days !== undefined && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                          Gap Days
                        </div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                          {verification.timeline_analysis.statistics.gap_days.toLocaleString()}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          Missing data
                        </div>
                      </div>
                    )}
                    {verification.timeline_analysis.statistics.overlap_days !== undefined && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                          Overlap Days
                        </div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {verification.timeline_analysis.statistics.overlap_days.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                          Conflicts detected
                        </div>
                      </div>
                    )}
                  </div>
                  {(verification.timeline_analysis.statistics.gap_days > 0 || verification.timeline_analysis.statistics.overlap_days > 0) && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        {verification.timeline_analysis.statistics.gap_days > 0 && (
                          <>Timeline gaps may indicate missing events or periods that need clarification. </>
                        )}
                        {verification.timeline_analysis.statistics.overlap_days > 0 && (
                          <>Overlaps occur when multiple properties claim main residence status on the same dates.</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Portfolio Intelligence */}
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
              </div>
              {/* End Section C */}

              {/* === SECTION D: AUDIT TRAIL & DOCUMENTATION === */}
              <div className="space-y-8 print:break-inside-avoid border-l-4 border-purple-500 dark:border-purple-600 pl-6 print:border-l-0 print:pl-0">
                <div className="border-t-4 border-purple-500 dark:border-purple-600 pt-6 print:border-t-2 print:border-black print:pt-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2 print:text-black print:mb-4">
                    <span className="text-2xl print:hidden">📑</span>
                    SECTION D: Audit Trail & Documentation
                  </h2>
                </div>

              {/* ATO Source Citations */}
              {validation?.citation_check?.citation_details && validation.citation_check.citation_details.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ATO Source Citations
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {validation.citation_check.citation_details.map((citation: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-emerald-200 dark:border-emerald-800 rounded-lg overflow-hidden"
                      >
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 border-b border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-600 dark:bg-emerald-700 text-white text-xs font-bold rounded">
                              {citation.rule_number || `CITATION ${index + 1}`}
                            </span>
                            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                              {citation.source}
                            </span>
                            {citation.page && citation.page !== 'N/A' && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                (Page {citation.page})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800/50">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {citation.source_text_preview || citation.source_text?.substring(0, 300) + '...'}
                          </p>
                          {citation.used_in_analysis && (
                            <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900">
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                Applied in analysis: {citation.used_in_analysis}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      <strong>Audit Trail:</strong> These citations reference official ATO documents used in the analysis. Keep this information for your records in case of an ATO audit.
                    </p>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis?.recommendations && analysis.recommendations.length > 0 && (
                <RecommendationsSection recommendations={analysis.recommendations} />
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
              {/* End Section D */}

              {/* === SECTION E: SUPPLEMENTARY VISUALS === */}
              {(_timelineProperties && _timelineProperties.length > 0 && _events && _events.length > 0) && (
                <div className="space-y-8 print:hidden border-l-4 border-gray-400 dark:border-gray-600 pl-6 print:border-l-0 print:pl-0">
                  <div className="border-t-4 border-gray-400 dark:border-gray-600 pt-6 print:border-t-2 print:border-black print:pt-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2 print:text-black print:mb-4">
                      <span className="text-2xl print:hidden">📈</span>
                      SECTION E: Supplementary Visuals
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Optional visual representations of your timeline data (already shown in main display).
                    </p>
                  </div>

                  {/* Property Timeline */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                      <span className="text-2xl">📅</span>
                      Property Timeline
                    </h3>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <TwoColumnLayout properties={_timelineProperties} events={_events} />
                    </div>
                  </div>

                  {/* Timeline Bar Visualization */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                      <span className="text-2xl">📊</span>
                      Timeline Visualization
                    </h3>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <TimelineBarView properties={_timelineProperties} events={_events} />
                    </div>
                  </div>
                </div>
              )}
              {/* End Section E */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
{/* JSON Modal */}      {showJsonModal && (        <div className="fixed inset-0 z-[100]">          {/* Backdrop */}          <div             className="fixed inset-0 bg-black/70 backdrop-blur-sm"            onClick={() => setShowJsonModal(false)}          />                    {/* Modal Content */}          <div className="fixed inset-4 md:inset-10 bg-gray-900 rounded-xl shadow-2xl z-[101] flex flex-col">            {/* Header */}            <div className="flex items-center justify-between p-4 border-b border-gray-700">              <div className="flex items-center gap-3">                <Code className="w-5 h-5 text-purple-400" />                <h3 className="text-lg font-semibold text-white">Full JSON Response</h3>              </div>              <div className="flex items-center gap-2">                <button                  onClick={handleCopyJson}                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"                >                  {jsonCopied ? (                    <>                      <Check className="w-4 h-4" />                      <span>Copied!</span>                    </>                  ) : (                    <>                      <Copy className="w-4 h-4" />                      <span>Copy</span>                    </>                  )}                </button>                <button                  onClick={() => setShowJsonModal(false)}                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"                  title="Close"                >                  ✕                </button>              </div>            </div>                        {/* JSON Content */}            <div className="flex-1 overflow-auto p-4">              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                  fontSize: '0.875rem',
                }}
                showLineNumbers={true}
                wrapLines={true}
              >
                {JSON.stringify(response, null, 2)}
              </SyntaxHighlighter>            </div>          </div>        </div>      )}

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
 
