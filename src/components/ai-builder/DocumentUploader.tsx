'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, Table, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProcessedDocument, TimelineAction } from '@/types/ai-builder';

interface DocumentUploaderProps {
  onDocumentProcessed: (document: ProcessedDocument) => void;
  onActionsApproved: (actions: TimelineAction[]) => void;
  isProcessing: boolean;
  processedDocuments: ProcessedDocument[];
}

export default function DocumentUploader({
  onDocumentProcessed,
  onActionsApproved,
  isProcessing,
  processedDocuments,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        // Process file through API
        await processFile(file);
      }
    },
    [onDocumentProcessed]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await processFile(file);
    }
    e.target.value = '';
  };

  const processFile = async (file: File) => {
    // This will call the document processing API
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ai-builder/process-document', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onDocumentProcessed(result.document);
      }
    } catch (error) {
      console.error('Error processing document:', error);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'excel':
      case 'csv':
        return <Table className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const toggleAction = (actionId: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const handleApplySelected = () => {
    if (!selectedDocument) return;

    const actionsToApply = selectedDocument.suggestedActions.filter((a) =>
      selectedActions.has(a.id)
    );

    if (actionsToApply.length > 0) {
      onActionsApproved(actionsToApply);
      setSelectedDocument(null);
      setSelectedActions(new Set());
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.docx,.doc,.txt"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <Upload
          className={cn(
            'w-10 h-10 mx-auto mb-3',
            isDragging ? 'text-blue-500' : 'text-gray-400'
          )}
        />

        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          or click to browse
        </p>
        <p className="mt-3 text-xs text-gray-400">
          Supported: PDF, Images, Excel, CSV, Word
        </p>
      </div>

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Processing document...
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  Extracting property and timeline information
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processed documents list */}
      {processedDocuments.length > 0 && (
        <div className="mt-4 flex-1 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Processed Documents
          </h4>
          <div className="space-y-2">
            {processedDocuments.map((doc, index) => (
              <button
                key={`${doc.filename}-${index}`}
                onClick={() => {
                  setSelectedDocument(doc);
                  // Select all actions by default
                  setSelectedActions(new Set(doc.suggestedActions.map((a) => a.id)));
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  selectedDocument === doc
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {getDocumentIcon(doc.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {doc.suggestedActions.length} suggested action
                    {doc.suggestedActions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    doc.confidence >= 0.7
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : doc.confidence >= 0.4
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}
                >
                  {Math.round(doc.confidence * 100)}% conf
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected document actions */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Suggested Actions
              </h4>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDocument.suggestedActions.map((action) => (
                <label
                  key={action.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedActions.has(action.id)}
                    onChange={() => toggleAction(action.id)}
                    className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {action.description}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleApplySelected}
              disabled={selectedActions.size === 0}
              className={cn(
                'mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors',
                'flex items-center justify-center gap-2',
                selectedActions.size > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
              )}
            >
              <Check className="w-4 h-4" />
              Apply {selectedActions.size} Action{selectedActions.size !== 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
