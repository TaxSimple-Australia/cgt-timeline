'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStandbyPdf } from '@/lib/standby-pdf';
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
      let blob: Blob;
      const { blob: standbyBlob } = getStandbyPdf();

      if (standbyBlob && standbyBlob.size > 0) {
        blob = standbyBlob;
      } else {
        // Generate on the fly if standby not ready
        blob = await pdf(
          <SimplifiedCGTReportPDF response={response} />
        ).toBlob();
      }

      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const filename = `CGT-Analysis-${response?.analysis_id || 'report'}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Download started', 'Your CGT report PDF is downloading.');
    } catch (error) {
      console.error('❌ PDF download error:', error);
      showError('Download failed', 'Failed to generate PDF. Please try again.');
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
