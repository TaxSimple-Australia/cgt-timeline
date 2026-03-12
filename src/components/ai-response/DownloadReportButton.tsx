'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pdf } from '@react-pdf/renderer';
import { SimplifiedCGTReportPDF } from './SimplifiedCGTReportPDF';
import { showSuccess, showError } from '@/lib/toast-helpers';

interface DownloadReportButtonProps {
  response: any;
  className?: string;
}

export default function DownloadReportButton({ response, className }: DownloadReportButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const blob = await pdf(
        <SimplifiedCGTReportPDF response={response} />
      ).toBlob();

      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const analysisId = response?.analysis_id || response?.data?.analysis_id || 'report';
      const filename = `CGT-Analysis-${analysisId}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Download started', `PDF downloaded (${(blob.size / 1024).toFixed(0)} KB)`);
    } catch (error) {
      console.error('❌ PDF download error:', error);
      showError('Download failed', error instanceof Error ? error.message : 'Failed to generate PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.button
      onClick={handleDownload}
      disabled={isDownloading}
      whileHover={!isDownloading ? { scale: 1.03 } : undefined}
      whileTap={!isDownloading ? { scale: 0.97 } : undefined}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        isDownloading
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 text-white',
        className
      )}
      title="Download CGT Report PDF"
    >
      {isDownloading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{isDownloading ? 'Generating...' : 'Download PDF'}</span>
    </motion.button>
  );
}
