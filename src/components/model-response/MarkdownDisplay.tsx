'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Calculator,
  Calendar,
  DollarSign,
  Percent,
  Quote,
  List,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
  showTableOfContents?: boolean;
  enableCodeCopy?: boolean;
  highlightCurrency?: boolean;
  highlightDates?: boolean;
  compactMode?: boolean;
}

// Currency formatter for Australian dollars
const formatCurrencyInText = (text: string): React.ReactNode[] => {
  // Match Australian currency patterns like $1,234,567 or $1234.56
  const currencyPattern = /\$[\d,]+(?:\.\d{2})?/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  const textStr = String(text);
  while ((match = currencyPattern.exec(textStr)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(textStr.slice(lastIndex, match.index));
    }
    // Add the formatted currency
    parts.push(
      <span
        key={match.index}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-sm"
      >
        <DollarSign className="w-3 h-3" />
        {match[0].replace('$', '')}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < textStr.length) {
    parts.push(textStr.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

// Detect callout/alert type from content
const detectCalloutType = (content: string): 'warning' | 'info' | 'success' | 'error' | 'tip' | null => {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('warning') || lowerContent.includes('caution') || lowerContent.includes('⚠️')) {
    return 'warning';
  }
  if (lowerContent.includes('error') || lowerContent.includes('critical') || lowerContent.includes('❌')) {
    return 'error';
  }
  if (lowerContent.includes('success') || lowerContent.includes('✅') || lowerContent.includes('completed')) {
    return 'success';
  }
  if (lowerContent.includes('tip') || lowerContent.includes('💡') || lowerContent.includes('hint')) {
    return 'tip';
  }
  if (lowerContent.includes('note') || lowerContent.includes('info') || lowerContent.includes('ℹ️')) {
    return 'info';
  }
  return null;
};

// Simple clean code block - no complex syntax highlighting
const CodeBlock = ({
  children,
  enableCopy = true,
}: {
  language?: string;
  children: string;
  enableCopy?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [children]);

  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Copy button - top right */}
      {enableCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-all bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 opacity-70 hover:opacity-100"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      )}

      {/* Code content - simple pre/code */}
      <pre className="p-4 pr-20 overflow-x-auto text-sm leading-relaxed">
        <code className="text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap break-words">
          {children}
        </code>
      </pre>
    </div>
  );
};

// Enhanced blockquote with callout detection
const EnhancedBlockquote = ({ children }: { children: React.ReactNode }) => {
  const textContent = React.Children.toArray(children)
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('');

  const calloutType = detectCalloutType(textContent);

  const calloutStyles = {
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-400 dark:border-amber-600',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      title: 'Warning',
      titleColor: 'text-amber-800 dark:text-amber-300',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-400 dark:border-red-600',
      icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      title: 'Important',
      titleColor: 'text-red-800 dark:text-red-300',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-400 dark:border-green-600',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />,
      title: 'Success',
      titleColor: 'text-green-800 dark:text-green-300',
    },
    tip: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-400 dark:border-purple-600',
      icon: <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      title: 'Tip',
      titleColor: 'text-purple-800 dark:text-purple-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-400 dark:border-blue-600',
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: 'Note',
      titleColor: 'text-blue-800 dark:text-blue-300',
    },
  };

  if (calloutType) {
    const style = calloutStyles[calloutType];
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`my-4 p-4 rounded-xl border-l-4 ${style.bg} ${style.border}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold mb-1 ${style.titleColor}`}>{style.title}</div>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{children}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default blockquote styling
  return (
    <blockquote className="my-4 pl-4 py-3 pr-4 border-l-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg italic text-gray-700 dark:text-gray-300">
      <div className="flex items-start gap-2">
        <Quote className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" />
        <div>{children}</div>
      </div>
    </blockquote>
  );
};

// Enhanced table component
const EnhancedTable = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </table>
      </div>
    </div>
  );
};

/**
 * Professional Markdown Display Component
 *
 * Features:
 * - Syntax highlighting for code blocks with copy functionality
 * - Smart callout detection (warnings, tips, info, success, error)
 * - Currency highlighting for Australian dollar amounts
 * - Enhanced tables with professional styling
 * - Responsive design with dark mode support
 * - Smooth animations and transitions
 * - Accessibility support
 */
export default function MarkdownDisplay({
  content,
  className = '',
  showTableOfContents = false,
  enableCodeCopy = true,
  highlightCurrency = true,
  compactMode = false,
}: MarkdownDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Extract headings for table of contents
  const headings = useMemo(() => {
    if (!showTableOfContents) return [];
    const headingPattern = /^(#{1,6})\s+(.+)$/gm;
    const matches: { level: number; text: string; id: string }[] = [];
    let match;
    while ((match = headingPattern.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      matches.push({ level, text, id });
    }
    return matches;
  }, [content, showTableOfContents]);

  if (!content) return null;

  const cleanContent = content.trim();
  const spacing = compactMode ? 'space-y-2' : 'space-y-4';

  return (
    <div className={`markdown-professional ${spacing} ${className}`}>
      {/* CSS to enforce vertical list layout globally */}
      <style jsx global>{`
        .markdown-professional ul,
        .markdown-professional ol {
          display: flex !important;
          flex-direction: column !important;
          list-style: none !important;
        }
        .markdown-professional li {
          display: flex !important;
          width: 100% !important;
        }
        .markdown-professional ul ul,
        .markdown-professional ol ol,
        .markdown-professional ul ol,
        .markdown-professional ol ul {
          margin-top: 0.75rem !important;
          margin-left: 1.5rem !important;
          padding-left: 0 !important;
        }
      `}</style>
      {/* Table of Contents */}
      {showTableOfContents && headings.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <List className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Table of Contents</h4>
          </div>
          <nav className="space-y-1">
            {headings.map((heading, index) => (
              <a
                key={index}
                href={`#${heading.id}`}
                className="block text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded px-2 py-1 transition-colors"
                style={{ paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem` }}
              >
                {heading.level === 1 ? '▸' : heading.level === 2 ? '▹' : '·'} {heading.text}
              </a>
            ))}
          </nav>
        </motion.div>
      )}

      {/* Markdown Content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings - clean styling without hash icons
          h1: ({ node, children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
              <h1
                id={id}
                className="text-3xl font-bold mb-4 mt-8 pb-3 border-b-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                {children}
              </h1>
            );
          },
          h2: ({ node, children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
              <h2
                id={id}
                className="text-2xl font-bold mb-3 mt-6 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                {children}
              </h2>
            );
          },
          h3: ({ node, children, ...props }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return (
              <h3
                id={id}
                className="text-xl font-semibold mb-2 mt-5 text-gray-900 dark:text-white"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4: ({ node, children, ...props }) => (
            <h4 className="text-lg font-semibold mb-2 mt-4 text-gray-900 dark:text-white" {...props}>
              {children}
            </h4>
          ),
          h5: ({ node, children, ...props }) => (
            <h5 className="text-base font-semibold mb-2 mt-3 text-gray-800 dark:text-gray-100" {...props}>
              {children}
            </h5>
          ),
          h6: ({ node, children, ...props }) => (
            <h6 className="text-sm font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-200 uppercase tracking-wide" {...props}>
              {children}
            </h6>
          ),

          // Paragraphs with currency highlighting
          p: ({ node, children, ...props }) => {
            const processChildren = (kids: React.ReactNode): React.ReactNode => {
              if (!highlightCurrency) return kids;

              return React.Children.map(kids, (child) => {
                if (typeof child === 'string') {
                  return formatCurrencyInText(child);
                }
                return child;
              });
            };

            return (
              <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200 text-base" {...props}>
                {processChildren(children)}
              </p>
            );
          },

          // Lists - ENFORCED VERTICAL POINT FORM LAYOUT
          // Using flex-col and block display to guarantee vertical stacking
          ul: ({ node, ...props }) => (
            <ul
              className="flex flex-col space-y-3 mb-5 pl-0 list-none"
              style={{ display: 'flex', flexDirection: 'column' }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="flex flex-col space-y-3 mb-5 pl-0 list-none"
              style={{ display: 'flex', flexDirection: 'column' }}
              {...props}
            />
          ),
          li: ({ node, children, ordered, index, ...props }: any) => (
            <li
              className="flex items-start gap-3 text-gray-800 dark:text-gray-200 leading-relaxed w-full"
              style={{ display: 'flex', width: '100%' }}
              {...props}
            >
              {ordered ? (
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center mt-0.5 shadow-sm">
                  {(index ?? 0) + 1}
                </span>
              ) : (
                <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 mt-2 shadow-sm" />
              )}
              <div className="flex-1 min-w-0">
                {children}
              </div>
            </li>
          ),

          // Links with external indicator
          a: ({ node, href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-300 dark:decoration-blue-600 hover:decoration-blue-500 dark:hover:decoration-blue-400 underline-offset-2 transition-colors inline-flex items-center gap-1 font-medium"
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
                {isExternal && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
              </a>
            );
          },

          // Code blocks with syntax highlighting
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : undefined;
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (language || codeString.includes('\n'))) {
              return (
                <CodeBlock language={language} enableCopy={enableCodeCopy}>
                  {codeString}
                </CodeBlock>
              );
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded font-mono text-sm border border-gray-200 dark:border-gray-700"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ node, children }) => (
            <div>{children}</div>
          ),

          // Blockquotes with callout detection
          blockquote: ({ node, children, ...props }) => (
            <EnhancedBlockquote {...props}>{children}</EnhancedBlockquote>
          ),

          // Enhanced tables
          table: ({ node, children, ...props }) => (
            <EnhancedTable {...props}>{children}</EnhancedTable>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-700"
              {...props}
            />
          ),
          td: ({ node, children, ...props }) => {
            // Check if content looks like currency
            const text = String(children);
            const isCurrency = /^\$[\d,]+(?:\.\d{2})?$/.test(text.trim());
            const isPercentage = /^\d+(?:\.\d+)?%$/.test(text.trim());

            return (
              <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200" {...props}>
                {isCurrency ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    {children}
                  </span>
                ) : isPercentage ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                    <Percent className="w-3 h-3" />
                    {children}
                  </span>
                ) : (
                  children
                )}
              </td>
            );
          },

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-none h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" {...props} />
          ),

          // Strong/Bold
          strong: ({ node, children, ...props }) => (
            <strong className="font-bold text-gray-900 dark:text-white" {...props}>
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em className="italic text-gray-700 dark:text-gray-300" {...props} />
          ),

          // Images with loading state
          img: ({ node, src, alt, ...props }) => (
            <motion.figure
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="my-6"
            >
              <img
                src={src}
                alt={alt}
                className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-full h-auto"
                loading="lazy"
                {...props}
              />
              {alt && (
                <figcaption className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 italic">
                  {alt}
                </figcaption>
              )}
            </motion.figure>
          ),

          // Delete/strikethrough
          del: ({ node, ...props }) => (
            <del className="line-through text-gray-500 dark:text-gray-500" {...props} />
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>

      {/* Professional footer for reports */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5" />
          Generated by CGT Brain AI Analysis
          <span className="mx-2">•</span>
          <Calendar className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
