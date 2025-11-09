'use client';

import React, { useState } from 'react';
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
  Layout,
  BarChart3,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  Mail,
  X,
  Eye,
} from 'lucide-react';
import type { CGTModelResponse } from '@/types/model-response';
import { format } from 'date-fns';
import ExpandableMarkdownSections from './ExpandableMarkdownSections';
import TimelineAnalysisChart from './TimelineAnalysisChart';
import PropertyGanttChart from './PropertyGanttChart';
import MarkdownDisplay from './MarkdownDisplay';
import ModelResponseDisplay from './ModelResponseDisplay';

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

  // State for tab navigation
  const [activeTab, setActiveTab] = useState<'summary' | 'properties' | 'timeline' | 'classic' | 'report' | 'raw'>('summary');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // State for email functionality
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Get verification and timeline data from response (new API format)
  const apiData = (data as any);
  const verification = apiData.verification || apiData.pre_verification;
  const timelineAnalysis = verification?.timeline_analysis;
  const validationMetrics = response.validation;
  const metadata = response.metadata;

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

  // Generate enhanced markdown with citations and reasoning
  const getEnhancedMarkdown = () => {
    let enhanced = response.summary || 'No content available';

    // Add metadata section
    if (metadata) {
      enhanced += '\n\n---\n\n# Analysis Metadata\n\n';

      if (metadata.confidence !== undefined) {
        enhanced += `**Confidence Score:** ${metadata.confidence}%\n\n`;
      }

      if (metadata.llm_used) {
        enhanced += `**Model Used:** ${metadata.llm_used}\n\n`;
      }

      if (metadata.chunks_retrieved !== undefined) {
        enhanced += `**Documents Retrieved:** ${metadata.chunks_retrieved}\n\n`;
      }
    }

    // Add validation checks section
    if (validationMetrics) {
      enhanced += '\n---\n\n# Validation & Reasoning\n\n';

      // Citation validation
      if (validationMetrics.citation_check) {
        const citationCheck = validationMetrics.citation_check;
        enhanced += '## Citation Validation\n\n';
        enhanced += `- Total Citations: ${citationCheck.total_citations || 0}\n`;
        enhanced += `- Valid Citations: ${citationCheck.valid_citations || 0}\n`;

        if (citationCheck.invalid_citations && citationCheck.invalid_citations.length > 0) {
          enhanced += `- Invalid Citations: ${citationCheck.invalid_citations.join(', ')}\n`;
        }

        enhanced += '\n';
      }

      // Logic checks and reasoning
      if (validationMetrics.logic_check) {
        const logicCheck = validationMetrics.logic_check;
        enhanced += '## Logic Validation\n\n';

        if (logicCheck.completeness_score !== undefined) {
          enhanced += `**Completeness Score:** ${logicCheck.completeness_score}%\n\n`;
        }

        if (logicCheck.logic_checks && logicCheck.logic_checks.length > 0) {
          enhanced += '**Checks Performed:**\n\n';
          logicCheck.logic_checks.forEach((check: any) => {
            const statusIcon = check.status === 'pass' ? '✅' : '❌';
            enhanced += `${statusIcon} **${check.check.replace(/_/g, ' ').toUpperCase()}**\n`;
            if (check.note) {
              enhanced += `   - ${check.note}\n`;
            }
          });
          enhanced += '\n';
        }

        if (logicCheck.consistency_issues && logicCheck.consistency_issues.length > 0) {
          enhanced += '**Consistency Issues:**\n\n';
          logicCheck.consistency_issues.forEach((issue: any) => {
            enhanced += `- ${issue}\n`;
          });
          enhanced += '\n';
        }
      }

      // Calculation checks
      if (validationMetrics.calculation_check) {
        const calcCheck = validationMetrics.calculation_check;
        if (calcCheck.calculations_found > 0) {
          enhanced += '## Calculation Verification\n\n';
          enhanced += `- Calculations Found: ${calcCheck.calculations_found}\n`;
          enhanced += `- Calculations Verified: ${calcCheck.calculations_verified}\n`;

          if (calcCheck.calculation_errors && calcCheck.calculation_errors.length > 0) {
            enhanced += '\n**Calculation Errors:**\n\n';
            calcCheck.calculation_errors.forEach((error: any) => {
              enhanced += `- ${error}\n`;
            });
          }

          enhanced += '\n';
        }
      }
    }

    // Add reference citations section
    if (metadata?.retrieved_documents && metadata.retrieved_documents.length > 0) {
      enhanced += '\n---\n\n# Reference Citations\n\n';
      enhanced += 'The following source documents were used in this analysis:\n\n';

      metadata.retrieved_documents.forEach((doc: any, index: number) => {
        enhanced += `## Reference ${index + 1}\n\n`;

        if (doc.metadata?.source_file) {
          enhanced += `**Source:** ${doc.metadata.source_file}\n\n`;
        }

        if (doc.metadata?.page_num !== undefined) {
          enhanced += `**Page:** ${doc.metadata.page_num}\n\n`;
        }

        if (doc.metadata?.category) {
          enhanced += `**Category:** ${doc.metadata.category.replace(/_/g, ' ')}\n\n`;
        }

        if (doc.score !== undefined) {
          enhanced += `**Relevance Score:** ${(doc.score * 100).toFixed(2)}%\n\n`;
        }

        if (doc.retrieval_strategy) {
          enhanced += `**Retrieval Method:** ${doc.retrieval_strategy.replace(/_/g, ' ')}\n\n`;
        }

        if (doc.content) {
          enhanced += '**Excerpt:**\n\n';
          enhanced += '> ' + doc.content.split('\n').join('\n> ') + '\n\n';
        }

        enhanced += '---\n\n';
      });
    }

    return enhanced;
  };

  const tabs = [
    { id: 'summary' as const, label: 'Summary', icon: <Layout className="w-4 h-4" /> },
    { id: 'properties' as const, label: 'Properties', icon: <Home className="w-4 h-4" /> },
    { id: 'timeline' as const, label: 'Timeline', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'classic' as const, label: 'Classic View', icon: <Eye className="w-4 h-4" /> },
    { id: 'report' as const, label: 'Full Analysis', icon: <FileText className="w-4 h-4" /> },
    { id: 'raw' as const, label: 'Full Document', icon: <FileText className="w-4 h-4" /> },
  ];

  // Handle copying markdown to clipboard
  const handleCopyMarkdown = async () => {
    try {
      const enhancedContent = getEnhancedMarkdown();
      await navigator.clipboard.writeText(enhancedContent);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      console.log('PDF download initiated');

      // Import the PDF generation utility
      const { generatePDFFromMarkdown } = await import('@/lib/markdown-to-pdf');

      console.log('PDF library imported');

      // Generate filename with timestamp
      const fileName = `CGT-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;

      const markdownContent = getEnhancedMarkdown();

      if (!markdownContent) {
        alert('No content available to generate PDF.');
        return;
      }

      console.log('Starting PDF generation with content length:', markdownContent.length);

      // Generate and download the PDF
      await generatePDFFromMarkdown(markdownContent, fileName);

      console.log('PDF generation completed successfully');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      console.error('Error details:', {
        message: (err as Error).message,
        stack: (err as Error).stack,
      });
      alert(`Failed to generate PDF: ${(err as Error).message}\n\nCheck browser console for details.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle email sending
  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsSendingEmail(true);

    try {
      console.log('Email sending initiated');

      // Import the PDF generation utility
      const { generatePDFBlob } = await import('@/lib/markdown-to-pdf');

      console.log('PDF library imported');

      // Generate filename with timestamp
      const fileName = `CGT-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;

      const markdownContent = getEnhancedMarkdown();

      if (!markdownContent) {
        alert('No content available to generate PDF.');
        return;
      }

      console.log('Starting PDF generation for email with content length:', markdownContent.length);

      // Generate PDF as blob
      const pdfBlob = await generatePDFBlob(markdownContent);

      console.log('PDF blob generated, size:', pdfBlob.size);

      // Create form data for API request
      const formData = new FormData();
      formData.append('email', email);
      formData.append('pdf', pdfBlob, fileName);
      formData.append('filename', fileName);

      console.log('Sending email to:', email);

      // Send email via API
      const apiResponse = await fetch('/api/send-email', {
        method: 'POST',
        body: formData,
      });

      const result = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      console.log('Email sent successfully:', result);
      setEmailSent(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setShowEmailDialog(false);
        setEmail('');
        setEmailSent(false);
      }, 3000);

    } catch (err) {
      console.error('Failed to send email:', err);
      alert(`Failed to send email: ${(err as Error).message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Comprehensive CGT Analysis Report</DialogTitle>
                <DialogDescription className="mt-1">
                  Interactive visual breakdown of your capital gains tax calculation
                </DialogDescription>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const dataStr = JSON.stringify(data, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', `cgt-report-${new Date().toISOString().split('T')[0]}.json`);
                  linkElement.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6 mt-6">
            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Show verification issues if critical */}
                {verification && verification.summary && verification.summary.critical_issues > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                          Data Issues Found
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-300">
                          {verification.summary.critical_issues} critical issue(s) need attention. Review the issues below.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Show key issues from verification */}
                {verification && verification.issues && verification.issues.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Data Review
                    </h3>
                    <div className="space-y-3">
                      {verification.issues.slice(0, 3).map((issue: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            {issue.message || issue.question}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Financial Breakdown */}
                {breakdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Financial Summary
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Capital Gain</span>
                        </div>
                        <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                          {formatCurrency(breakdown.capital_gain)}
                        </span>
                      </div>
                      <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Cost Base</span>
                        </div>
                        <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">
                          {formatCurrency(breakdown.cost_base)}
                        </span>
                      </div>
                      {breakdown.discount_applied !== undefined && (
                        <div className="px-6 py-4 flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/20">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-gray-700 dark:text-gray-300">CGT Discount (50%)</span>
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

                {/* Properties Quick View */}
                {properties.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Properties Analyzed ({properties.length})
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {properties.map((property, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 truncate">
                            {property.address}
                          </h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {property.property_history.length} events
                            </span>
                            <span className="text-gray-500 dark:text-gray-500 text-xs">
                              {property.notes ? '📝 Has notes' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Additional Info */}
                {additional_info && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Additional Information
                    </h3>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {additional_info.australian_resident !== undefined && (
                        <div>
                          <dt className="text-sm text-gray-600 dark:text-gray-400">Australian Resident</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                            {additional_info.australian_resident ? 'Yes' : 'No'}
                          </dd>
                        </div>
                      )}
                      {additional_info.other_property_owned !== undefined && (
                        <div>
                          <dt className="text-sm text-gray-600 dark:text-gray-400">Other Property Owned</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                            {additional_info.other_property_owned ? 'Yes' : 'No'}
                          </dd>
                        </div>
                      )}
                      {additional_info.land_size_hectares !== undefined && (
                        <div>
                          <dt className="text-sm text-gray-600 dark:text-gray-400">Land Size</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                            {additional_info.land_size_hectares} hectares
                          </dd>
                        </div>
                      )}
                      {additional_info.marginal_tax_rate !== undefined && (
                        <div>
                          <dt className="text-sm text-gray-600 dark:text-gray-400">Marginal Tax Rate</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                            {additional_info.marginal_tax_rate}%
                          </dd>
                        </div>
                      )}
                    </dl>
                  </motion.div>
                )}
              </div>
            )}

            {/* PROPERTIES TAB */}
            {activeTab === 'properties' && properties.length > 0 && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Your Properties
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {properties.map((property, index) => (
                      <div key={index} className="p-6">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                          {property.address}
                        </h4>
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
                                    {event.event.replace('_', ' ')}
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
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                {/* Property Gantt Chart */}
                {properties.length > 0 && (
                  <PropertyGanttChart properties={properties} />
                )}

                {/* Timeline Analysis */}
                {timelineAnalysis && (
                  <TimelineAnalysisChart timelineAnalysis={timelineAnalysis} />
                )}
              </div>
            )}

            {/* CLASSIC VIEW TAB - Full ModelResponseDisplay */}
            {activeTab === 'classic' && (
              <ModelResponseDisplay responseData={data} />
            )}

            {/* FULL ANALYSIS TAB */}
            {activeTab === 'report' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Complete Analysis Report
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Detailed breakdown with all calculations and recommendations
                    </p>
                  </div>
                  <div className="p-6">
                    <ExpandableMarkdownSections content={response.summary} />
                  </div>
                </motion.div>

                {/* Property Details */}
                {properties.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Property Event History
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {properties.map((property, index) => (
                        <div key={index} className="p-6">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                            {property.address}
                          </h4>
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
                                      {event.event.replace('_', ' ')}
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
                )}
              </div>
            )}

            {/* RAW MARKDOWN TAB */}
            {activeTab === 'raw' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          Complete Analysis Document
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Full AI-generated CGT analysis in a clean, readable format
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadPDF}
                          disabled={isGeneratingPDF}
                          className="flex items-center gap-2"
                        >
                          {isGeneratingPDF ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download PDF
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEmailDialog(true)}
                          disabled={isGeneratingPDF || isSendingEmail}
                          className="flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyMarkdown}
                          className="flex items-center gap-2"
                        >
                          {copiedMarkdown ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy All
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 max-w-none">
                    <MarkdownDisplay content={getEnhancedMarkdown()} />
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Email Dialog - Outside main dialog for proper z-index */}
    {showEmailDialog && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowEmailDialog(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Email PDF Report
              </h3>
              <button
                onClick={() => setShowEmailDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailSent ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Email Sent Successfully!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Check your inbox for the CGT analysis report.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enter the email address where you'd like to receive the PDF report.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isSendingEmail}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSendingEmail) {
                        handleSendEmail();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailDialog(false)}
                    disabled={isSendingEmail}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !email}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSendingEmail ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
