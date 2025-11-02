'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, XCircle, Home } from 'lucide-react';
import type { Issue } from '@/types/model-response';

interface PropertyIssueCardProps {
  propertyAddress: string;
  issues: Issue[];
  delay?: number;
}

const getIssueIcon = (type: Issue['type']) => {
  switch (type) {
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'missing_data':
      return AlertCircle;
    case 'info':
    default:
      return Info;
  }
};

const getIssueColor = (type: Issue['type']) => {
  switch (type) {
    case 'error':
      return {
        text: 'text-red-700 dark:text-red-300',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
      };
    case 'warning':
      return {
        text: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-600 dark:text-amber-400',
      };
    case 'missing_data':
      return {
        text: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
      };
    case 'info':
    default:
      return {
        text: 'text-gray-700 dark:text-gray-300',
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        icon: 'text-gray-600 dark:text-gray-400',
      };
  }
};

export default function PropertyIssueCard({
  propertyAddress,
  issues,
  delay = 0,
}: PropertyIssueCardProps) {
  if (!issues || issues.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {propertyAddress}
          </h4>
        </div>
      </div>

      {/* Issues List */}
      <div className="p-4 space-y-2">
        {issues.map((issue, index) => {
          const Icon = getIssueIcon(issue.type);
          const colors = getIssueColor(issue.type);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: delay + 0.1 + index * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg ${colors.bg} ${colors.border} border`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.icon}`} />
              <div className="flex-1 min-w-0">
                {issue.field && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${colors.icon}`}>
                      {issue.field}
                    </span>
                    {issue.severity && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {issue.severity}
                      </span>
                    )}
                  </div>
                )}
                <p className={`text-sm ${colors.text} leading-relaxed`}>
                  {issue.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
