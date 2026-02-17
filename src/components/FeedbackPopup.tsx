'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackPopup({ isOpen, onClose }: FeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 15000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  const handleFeedback = (helpful: boolean) => {
    // Log feedback (can be replaced with API call)
    console.log('📊 Feedback:', {
      helpful,
      rating,
      timestamp: new Date().toISOString(),
    });

    // Mark as shown in localStorage
    localStorage.setItem('cgtBrain_feedbackShown', 'true');

    // Close popup
    onClose();
  };

  const handleStarClick = (star: number) => {
    setRating(star);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50, x: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[9999] w-80"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close feedback"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
            </button>

            {/* Heading */}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pr-6">
              Was CGT Brain helpful?
            </h3>

            {/* Star rating */}
            <div className="flex gap-2 mb-6 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredStar || rating)
                        ? 'fill-cyan-500 text-cyan-500'
                        : 'text-slate-300 dark:text-slate-600'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            {/* Yes/No buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleFeedback(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
              >
                No
              </button>
              <button
                onClick={() => handleFeedback(true)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/30 transition-all"
              >
                Yes
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
