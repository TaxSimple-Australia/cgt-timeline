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
          // Headings - inherit parent text color for better integration
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mb-3 mt-4 pb-2 border-b border-current opacity-30" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mb-2 mt-4 pb-1 border-b border-current opacity-20" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mb-2 mt-3" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mb-2 mt-3" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mb-1 mt-2" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-semibold mb-1 mt-2" {...props} />
          ),

          // Paragraphs - inherit color from parent
          p: ({ node, ...props }) => (
            <p className="mb-3 leading-relaxed last:mb-0" {...props} />
          ),

          // Lists - inherit parent color
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside space-y-1.5 mb-3 pl-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside space-y-1.5 mb-3 pl-6" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),

          // Links - inherit and underline
          a: ({ node, ...props }) => (
            <a className="underline decoration-2 hover:opacity-70 transition-opacity font-medium" target="_blank" rel="noopener noreferrer" {...props} />
          ),

          // Code blocks - use subtle backgrounds
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded text-sm font-mono font-semibold" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-black/5 dark:bg-white/5 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-3 border border-current opacity-20" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-black/5 dark:bg-white/5 p-3 rounded-lg overflow-x-auto mb-3" {...props} />
          ),

          // Blockquotes - use accent color
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-current pl-4 py-2 mb-3 italic opacity-90 bg-black/5 dark:bg-white/5 rounded-r" {...props} />
          ),

          // Tables - adaptive styling
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4 rounded-lg border border-current opacity-20">
              <table className="min-w-full divide-y divide-current opacity-20" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-black/5 dark:bg-white/5" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-current opacity-10" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm" {...props} />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-current opacity-20" {...props} />
          ),

          // Strong/Bold - enhance emphasis
          strong: ({ node, ...props }) => (
            <strong className="font-bold" {...props} />
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em className="italic" {...props} />
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
