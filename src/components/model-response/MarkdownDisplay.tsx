'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

/**
 * Component to render markdown content with proper styling
 * Supports GitHub-flavored markdown including tables, lists, code blocks, etc.
 * Adapts to parent container colors for seamless integration
 */
export default function MarkdownDisplay({ content, className = '' }: MarkdownDisplayProps) {
  if (!content) return null;

  // Clean up content: remove extra whitespace and normalize line breaks
  const cleanContent = content.trim();

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings - white in dark mode
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mb-3 mt-4 pb-2 border-b border-current opacity-30 text-gray-900 dark:text-white" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mb-2 mt-4 pb-1 border-b border-current opacity-20 text-gray-900 dark:text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mb-2 mt-3 text-gray-900 dark:text-white" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 text-gray-900 dark:text-white" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mb-1 mt-2 text-gray-900 dark:text-white" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-semibold mb-1 mt-2 text-gray-900 dark:text-white" {...props} />
          ),

          // Paragraphs - white in dark mode
          p: ({ node, ...props }) => (
            <p className="mb-3 leading-relaxed last:mb-0 text-gray-800 dark:text-white" {...props} />
          ),

          // Lists - white in dark mode
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside space-y-1.5 mb-3 pl-6 text-gray-800 dark:text-white" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside space-y-1.5 mb-3 pl-6 text-gray-800 dark:text-white" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed text-gray-800 dark:text-white" {...props} />
          ),

          // Links - white in dark mode
          a: ({ node, ...props }) => (
            <a className="underline decoration-2 hover:opacity-70 transition-opacity font-medium text-gray-900 dark:text-white" target="_blank" rel="noopener noreferrer" {...props} />
          ),

          // Code blocks - white in dark mode
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded text-sm font-mono font-semibold text-gray-900 dark:text-white" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-black/5 dark:bg-white/5 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-3 border border-current opacity-20 text-gray-800 dark:text-white" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-black/5 dark:bg-white/5 p-3 rounded-lg overflow-x-auto mb-3 text-gray-800 dark:text-white" {...props} />
          ),

          // Blockquotes - white in dark mode
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-current pl-4 py-2 mb-3 italic opacity-90 bg-black/5 dark:bg-white/5 rounded-r text-gray-800 dark:text-white" {...props} />
          ),

          // Tables - white in dark mode
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4 rounded-lg border border-current opacity-20">
              <table className="min-w-full divide-y divide-current opacity-20 text-gray-800 dark:text-white" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-black/5 dark:bg-white/5" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-current opacity-10" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="text-gray-800 dark:text-white" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-gray-800 dark:text-white" {...props} />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-current opacity-20" {...props} />
          ),

          // Strong/Bold - white in dark mode
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900 dark:text-white" {...props} />
          ),

          // Emphasis/Italic - white in dark mode
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800 dark:text-white" {...props} />
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
