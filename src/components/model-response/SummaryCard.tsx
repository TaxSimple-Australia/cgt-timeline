'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';

interface Issue {
  type: 'missing_data' | 'warning' | 'info' | 'error';
  field?: string;
  message: string;
  severity?: 'low' | 'medium' | 'high';
}

interface SummaryCardProps {
  summary: string;
  recommendation?: string;
  delay?: number;
  detailedBreakdown?: {
    capital_gain?: number;
    cost_base?: number;
    discount_applied?: number;
    tax_payable?: number;
  };
  issues?: Issue[];
}

export default function SummaryCard({ summary, recommendation, delay = 0, detailedBreakdown, issues = [] }: SummaryCardProps) {
  // Determine if there are critical errors/missing data
  const hasCriticalIssues = issues.some(issue =>
    issue.type === 'error' ||
    issue.type === 'missing_data' ||
    issue.severity === 'high'
  );

  const criticalIssueCount = issues.filter(issue =>
    issue.type === 'error' ||
    issue.type === 'missing_data' ||
    issue.severity === 'high'
  ).length;

  // Create a relevant summary prioritizing errors, then key insights
  const createRelevantSummary = (): string => {
    // PRIORITY 1: If there are critical errors, show that first
    if (hasCriticalIssues) {
      const errorMessages = [];

      if (criticalIssueCount === 1) {
        errorMessages.push(`There is ${criticalIssueCount} critical issue that needs attention before we can provide an accurate CGT calculation`);
      } else if (criticalIssueCount > 1) {
        errorMessages.push(`There are ${criticalIssueCount} critical issues that need attention before we can provide an accurate CGT calculation`);
      }

      // Add context about what's missing
      const missingDataIssues = issues.filter(i => i.type === 'missing_data');
      if (missingDataIssues.length > 0) {
        errorMessages.push(`Please provide the missing information to get a complete analysis`);
      }

      return errorMessages.join('. ') + '.';
    }

    // PRIORITY 2: Extract key insights from summary (what this MEANS for the user)
    if (summary) {
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);

      // Look for insight-oriented sentences (interpretation, not just facts)
      const insightKeywords = [
        'qualify', 'eligible', 'exempt', 'discount', 'reduction',
        'benefit', 'advantage', 'opportunity', 'recommend', 'should',
        'main residence', 'primary residence', '50% discount', 'cgt discount',
        'consider', 'important', 'note', 'aware', 'significant'
      ];

      const insightSentence = sentences.find(s => {
        const lower = s.toLowerCase();
        return insightKeywords.some(keyword => lower.includes(keyword));
      });

      if (insightSentence) {
        return insightSentence.trim() + '.';
      }
    }

    // PRIORITY 3: Show tax outcome with meaningful context
    if (detailedBreakdown) {
      const parts = [];

      // Add discount context if significant
      if (detailedBreakdown.discount_applied !== undefined && detailedBreakdown.discount_applied > 0) {
        const discountFormatted = new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
          minimumFractionDigits: 0,
        }).format(detailedBreakdown.discount_applied);
        parts.push(`You received ${discountFormatted} in CGT discount (50% of your capital gain)`);
      }

      // Tax payable outcome
      if (detailedBreakdown.tax_payable !== undefined) {
        const taxFormatted = new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
          minimumFractionDigits: 0,
        }).format(detailedBreakdown.tax_payable);

        if (detailedBreakdown.tax_payable > 0) {
          if (parts.length === 0) {
            parts.push(`Your estimated CGT liability is ${taxFormatted}`);
          } else {
            parts.push(`resulting in ${taxFormatted} tax payable`);
          }
        } else if (detailedBreakdown.tax_payable === 0) {
          parts.push(`You have no Capital Gains Tax liability`);
        } else {
          parts.push(`You may be eligible for a tax credit`);
        }
      }

      if (parts.length > 0) {
        return parts.join(', ') + '.';
      }
    }

    // PRIORITY 4: Extract any meaningful sentence from summary
    if (summary) {
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 30);

      // Skip purely factual sentences about amounts/dates
      const meaningfulSentence = sentences.find(s => {
        const lower = s.toLowerCase();
        return !lower.match(/^\s*(the\s+)?(total|amount|price|date|property)\s/i);
      });

      if (meaningfulSentence) {
        return meaningfulSentence.trim() + '.';
      }

      if (sentences.length > 0) {
        return sentences[0].trim() + '.';
      }
    }

    return 'Review your detailed CGT analysis below for complete information.';
  };

  // Determine the primary amount to display - ONLY show tax payable
  const getPrimaryAmount = (): string | null => {
    // Only show tax payable amount - the most important figure
    if (detailedBreakdown?.tax_payable !== undefined) {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
      }).format(detailedBreakdown.tax_payable);
    }

    // Fallback: Try to extract tax payable from summary text
    const taxMatch = summary.match(/(?:tax\s+payable|cgt\s+liability)[:\s]+(?:AUD|AU\$|\$)?\s*([\d,]+)/i);
    if (taxMatch) {
      return `$${taxMatch[1]}`;
    }

    // Look for explicit "tax payable" amounts in the summary
    const lines = summary.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('tax payable') || line.toLowerCase().includes('cgt liability')) {
        const amountMatch = line.match(/(?:AUD|AU\$|\$)\s*[\d,]+/);
        if (amountMatch) {
          return amountMatch[0];
        }
      }
    }

    return null;
  };

  const amount = getPrimaryAmount();
  const isPositive = summary.toLowerCase().includes('refund') || summary.toLowerCase().includes('credit') || (detailedBreakdown?.tax_payable !== undefined && detailedBreakdown.tax_payable < 0);
  const displaySummary = createRelevantSummary();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden"
    >
      {/* Gradient background card */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-purple-950/30 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        {/* Decorative glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl -z-10" />

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2, type: 'spring' }}
            className={`p-3 rounded-xl ${
              hasCriticalIssues
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : isPositive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            }`}
          >
            {hasCriticalIssues ? (
              <AlertCircle className="w-6 h-6" />
            ) : isPositive ? (
              <TrendingDown className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
          </motion.div>

          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {hasCriticalIssues ? 'Action Required' : 'Your CGT Summary'}
            </h3>
            {!hasCriticalIssues && amount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.3 }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3"
              >
                {amount}
              </motion.div>
            )}
            <p className={`${hasCriticalIssues ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'} text-lg leading-relaxed`}>
              {displaySummary}
            </p>
            {!hasCriticalIssues && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Click "View Detailed Report" below to see the full analysis
              </p>
            )}
            {hasCriticalIssues && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Review the issues below and provide the missing information
              </p>
            )}
          </div>
        </div>

        {/* Recommendation section */}
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: delay + 0.4 }}
            className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Recommendation
                </h4>
                <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
                  {recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Animated pulse effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 pointer-events-none"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
}
