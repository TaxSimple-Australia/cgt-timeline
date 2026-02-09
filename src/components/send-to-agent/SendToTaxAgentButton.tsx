'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Loader2, Send } from 'lucide-react';
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
        whileHover={{ scale: propertiesCount > 0 ? 1.05 : 1 }}
        whileTap={{ scale: propertiesCount > 0 ? 0.95 : 1 }}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg ml-3',
          'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
          'text-white font-semibold',
          'shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50',
          'border-0',
          'transition-all duration-200',
          (isGeneratingLink || propertiesCount === 0) && 'opacity-50 cursor-not-allowed shadow-none',
          className
        )}
        title={propertiesCount === 0 ? 'Add properties first' : 'Send timeline to a Tax Agent for professional review'}
      >
        {isGeneratingLink ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
        <span className="text-sm whitespace-nowrap">
          Tax Agent Review
        </span>
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
