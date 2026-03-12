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

// A4 dimensions in mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 10;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const USABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

// Capture settings — JPEG at moderate scale for small file size
const CAPTURE_SCALE = 1.5;
const JPEG_QUALITY = 0.75;

export default function DownloadReportButton({ response, className }: DownloadReportButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const container = document.querySelector('[data-analysis-container]') as HTMLElement;
      if (!container) {
        throw new Error('Analysis container not found. Please ensure the analysis is visible.');
      }

      // Collect all direct child sections (each is a logical block)
      const sections = Array.from(container.children) as HTMLElement[];
      if (sections.length === 0) {
        throw new Error('No analysis sections found.');
      }

      // Capture each section as a JPEG image
      const sectionImages: { imgData: string; heightMm: number }[] = [];

      for (const section of sections) {
        // Skip hidden elements, sticky note overlays, dialogs, and toolbar rows with only buttons
        if (
          section.style.display === 'none' ||
          section.getAttribute('data-sticky-notes') !== null ||
          section.getAttribute('role') === 'dialog' ||
          section.offsetHeight === 0
        ) {
          continue;
        }

        // Skip sections that are purely button toolbars (the top toolbar row)
        const isToolbar = section.querySelectorAll('button').length > 0 &&
          section.querySelectorAll('button').length === section.querySelectorAll('*').length -
          section.querySelectorAll('div, span, svg, path, line, polyline, circle, rect').length;
        // More reliable: skip if the section only contains buttons and no text content
        const textContent = section.textContent?.trim() || '';
        const hasOnlyButtons = section.children.length > 0 &&
          Array.from(section.children).every(child => {
            const tag = child.tagName.toLowerCase();
            return tag === 'button' || (child as HTMLElement).querySelector('button') !== null;
          }) && textContent.length < 50;

        if (hasOnlyButtons) continue;

        try {
          const canvas = await html2canvas(section, {
            backgroundColor: '#ffffff',
            scale: CAPTURE_SCALE,
            logging: false,
            useCORS: true,
            allowTaint: true,
            onclone: (_clonedDoc, clonedEl) => {
              // Hide buttons inside the cloned section
              clonedEl.querySelectorAll('button').forEach((btn) => {
                (btn as HTMLElement).style.display = 'none';
              });
              // Force light background
              clonedEl.style.backgroundColor = '#ffffff';
            },
          });

          // Convert to JPEG for dramatically smaller file size
          const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          const heightMm = (canvas.height * CONTENT_WIDTH) / canvas.width;

          sectionImages.push({ imgData, heightMm });
        } catch (e) {
          console.warn('⚠️ Skipping section capture error:', e);
        }
      }

      if (sectionImages.length === 0) {
        throw new Error('No sections could be captured.');
      }

      // Build the PDF, placing each section image with intelligent page breaks
      const pdf = new jsPDF('p', 'mm', 'a4');
      let cursorY = MARGIN_TOP;

      for (let i = 0; i < sectionImages.length; i++) {
        const { imgData, heightMm } = sectionImages[i];
        const spaceLeft = USABLE_HEIGHT - (cursorY - MARGIN_TOP);

        if (i > 0 && heightMm > spaceLeft) {
          // Section doesn't fit — start a new page
          pdf.addPage();
          cursorY = MARGIN_TOP;
        }

        // If section is taller than one full page, split it across pages
        if (heightMm > USABLE_HEIGHT) {
          // Place as much as fits, then continue on next pages
          let remainingHeight = heightMm;
          let srcY = 0;

          while (remainingHeight > 0) {
            const spaceOnPage = USABLE_HEIGHT - (cursorY - MARGIN_TOP);
            const sliceHeight = Math.min(remainingHeight, spaceOnPage);

            // Calculate the source crop ratio
            const cropRatio = sliceHeight / heightMm;
            const srcHeight = cropRatio;
            const srcYRatio = srcY / heightMm;

            // Use the full image but clip via positioning
            // jsPDF addImage with clipping isn't directly supported,
            // so we place the full image offset and rely on page boundaries
            pdf.addImage(
              imgData, 'JPEG',
              MARGIN_X,
              cursorY - (srcYRatio * heightMm),
              CONTENT_WIDTH,
              heightMm
            );

            remainingHeight -= sliceHeight;
            srcY += sliceHeight;

            if (remainingHeight > 0) {
              pdf.addPage();
              cursorY = MARGIN_TOP;
            } else {
              cursorY += sliceHeight + 4; // 4mm gap between sections
            }
          }
        } else {
          // Section fits on current page
          pdf.addImage(imgData, 'JPEG', MARGIN_X, cursorY, CONTENT_WIDTH, heightMm);
          cursorY += heightMm + 4; // 4mm gap between sections
        }
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
