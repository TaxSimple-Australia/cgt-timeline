'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
      // Dynamically import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Find the analysis container in the DOM
      const container = document.querySelector('[data-analysis-container]') as HTMLElement;
      if (!container) {
        throw new Error('Analysis container not found. Please ensure the analysis is visible.');
      }

      // Temporarily expand all collapsed sections for full capture
      const collapsedSections: HTMLElement[] = [];
      container.querySelectorAll('[data-state="closed"]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.setAttribute('data-state', 'open');
        htmlEl.style.height = 'auto';
        htmlEl.style.overflow = 'visible';
        collapsedSections.push(htmlEl);
      });

      // Hide buttons/interactive elements that shouldn't be in the PDF
      const hideSelectors = 'button, [data-sticky-notes], [role="dialog"]';
      const hiddenElements: { el: HTMLElement; prev: string }[] = [];
      container.querySelectorAll(hideSelectors).forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Don't hide tab-like elements or structural buttons
        if (htmlEl.closest('[data-analysis-container]') === container) {
          const prev = htmlEl.style.display;
          htmlEl.style.display = 'none';
          hiddenElements.push({ el: htmlEl, prev });
        }
      });

      // Capture with html2canvas at high quality
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
        onclone: (clonedDoc) => {
          // Force light theme in clone for PDF
          const clonedContainer = clonedDoc.querySelector('[data-analysis-container]') as HTMLElement;
          if (clonedContainer) {
            clonedContainer.style.color = '#1e293b';
            // Remove dark mode classes
            clonedContainer.querySelectorAll('*').forEach((el) => {
              const htmlEl = el as HTMLElement;
              htmlEl.classList.forEach((cls) => {
                if (cls.startsWith('dark:')) {
                  htmlEl.classList.remove(cls);
                }
              });
            });
          }
        },
      });

      // Restore hidden elements
      hiddenElements.forEach(({ el, prev }) => {
        el.style.display = prev;
      });

      // Restore collapsed sections
      collapsedSections.forEach((el) => {
        el.setAttribute('data-state', 'closed');
        el.style.height = '';
        el.style.overflow = '';
      });

      // Build multi-page A4 PDF from the canvas
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10;
      const contentWidth = imgWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = margin;
      const imgData = canvas.toDataURL('image/png');

      // First page
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      // Additional pages if content overflows
      while (heightLeft > 0) {
        position = position - (pageHeight - margin * 2);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      // Add footer to each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text('CGT Analysis Report | Tax Simple Australia | CGT Brain', margin, pageHeight - 5);
        pdf.text(`Page ${i} of ${totalPages}`, imgWidth - margin - 25, pageHeight - 5);
      }

      const analysisId = response?.analysis_id || response?.data?.analysis_id || 'report';
      const filename = `CGT-Analysis-${analysisId}.pdf`;
      pdf.save(filename);

      showSuccess('Download started', 'Your CGT report PDF is downloading.');
    } catch (error) {
      console.error('❌ PDF download error:', error);
      showError('Download failed', error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.');
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
