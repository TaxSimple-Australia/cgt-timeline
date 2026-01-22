'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import SendToTaxAgentModal from './SendToTaxAgentModal';

interface SendToTaxAgentButtonProps {
  className?: string;
  includeAnalysis?: boolean;
}

export default function SendToTaxAgentButton({
  className,
  includeAnalysis = true,
}: SendToTaxAgentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { exportShareableData, saveCurrentAnalysis, aiResponse, properties, events } = useTimelineStore();

  const handleClick = async () => {
    // First, generate a share link to save the timeline
    setIsGeneratingLink(true);
    setError(null);

    try {
      // Save current analysis state if including analysis
      if (includeAnalysis && aiResponse) {
        saveCurrentAnalysis();
      }

      // Get all shareable data
      const data = exportShareableData();

      // Save to API
      const response = await fetch('/api/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save timeline');
      }

      setShareId(result.shareId);
      setIsModalOpen(true);
      console.log('✅ Timeline saved for Tax Agent submission:', result.shareId);
    } catch (err) {
      console.error('❌ Error saving timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to save timeline');
      // Still open the modal to show the error
      setIsModalOpen(true);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Count properties and events
  const propertiesCount = properties.length;
  const eventsCount = events.length;
  const hasAnalysis = !!aiResponse;
  // Access llm_used from metadata (for AISuccessResponse) or use 'AI' as fallback
  const analysisProvider = aiResponse?.status === 'success' ? aiResponse.metadata?.llm_used : undefined;

  return (
    <>
      <motion.button
        onClick={handleClick}
        disabled={isGeneratingLink || propertiesCount === 0}
        whileHover={{ scale: propertiesCount > 0 ? 1.03 : 1 }}
        whileTap={{ scale: propertiesCount > 0 ? 0.97 : 1 }}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md',
          'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50',
          'text-emerald-700 dark:text-emerald-300',
          'border border-emerald-300 dark:border-emerald-700',
          'transition-colors shadow-sm',
          (isGeneratingLink || propertiesCount === 0) && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={propertiesCount === 0 ? 'Add properties first' : 'Send timeline to a Tax Agent for review'}
      >
        {isGeneratingLink ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Briefcase className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-medium hidden sm:inline">Tax Agent</span>
      </motion.button>

      <SendToTaxAgentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setShareId(null);
          setError(null);
        }}
        shareId={shareId}
        propertiesCount={propertiesCount}
        eventsCount={eventsCount}
        hasAnalysis={hasAnalysis}
        analysisProvider={analysisProvider}
      />
    </>
  );
}
