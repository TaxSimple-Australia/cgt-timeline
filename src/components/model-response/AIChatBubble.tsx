'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Sparkles,
} from 'lucide-react';
import type { Issue } from '@/types/model-response';

interface AIChatBubbleProps {
  issues: Issue[];
  delay?: number;
}

const getIssueConfig = (type: Issue['type']) => {
  switch (type) {
    case 'error':
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      };
    case 'missing_data':
      return {
        icon: AlertCircle,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      };
    case 'info':
    default:
      return {
        icon: Info,
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-900/30',
        border: 'border-gray-200 dark:border-gray-800',
        iconBg: 'bg-gray-100 dark:bg-gray-900/40',
      };
  }
};

export default function AIChatBubble({ issues, delay = 0 }: AIChatBubbleProps) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* AI Assistant Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay }}
        className="flex items-center gap-2"
      >
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          AI Assistant
        </span>
      </motion.div>

      {/* Issues List */}
      <div className="space-y-3">
        {issues.map((issue, index) => {
          const config = getIssueConfig(issue.type);
          const Icon = config.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: delay + 0.1 + index * 0.1,
                type: 'spring',
                stiffness: 100,
              }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="group cursor-default"
            >
              <div
                className={`relative p-4 rounded-xl ${config.bg} ${config.border} border transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                {/* Chat bubble tail */}
                <div
                  className={`absolute left-0 top-4 w-3 h-3 ${config.bg} ${config.border} border-r-0 border-t-0 transform -translate-x-1.5 rotate-45`}
                />

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: delay + 0.2 + index * 0.1,
                      type: 'spring',
                    }}
                    className={`p-2 rounded-lg ${config.iconBg} flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {issue.field && (
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.iconBg} ${config.color}`}
                        >
                          {issue.field}
                        </span>
                        {issue.severity && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {issue.severity} priority
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {issue.message}
                    </p>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${config.bg} -z-10 blur-sm`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary count */}
      {issues.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.5 }}
          className="text-xs text-gray-500 dark:text-gray-400 pl-12"
        >
          {issues.length} {issues.length === 1 ? 'item' : 'items'} need attention
        </motion.div>
      )}
    </div>
  );
}
