'use client';

import { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';
import type { TaxAgentSubmission } from '@/types/tax-agent';

interface FeedbackEmailModalProps {
  submission: TaxAgentSubmission;
  token: string;
  onClose: () => void;
  onSent: () => void;
}

const FEEDBACK_TEMPLATES = [
  {
    label: 'Review Complete - No Issues',
    content: `Hello,

Thank you for submitting your CGT Timeline for review.

I have reviewed your timeline and CGT calculation. Everything looks correct, and I don't see any issues with your Capital Gains Tax calculation.

If you have any questions, please don't hesitate to reach out.

Best regards`,
  },
  {
    label: 'Review Complete - Issues Found',
    content: `Hello,

Thank you for submitting your CGT Timeline for review.

After reviewing your timeline, I've identified some areas that may need attention:

[Please describe the issues here]

I recommend reviewing these items before finalizing your tax return. Feel free to contact me if you'd like to discuss further.

Best regards`,
  },
  {
    label: 'Additional Documentation Needed',
    content: `Hello,

Thank you for submitting your CGT Timeline for review.

To complete my review, I'll need some additional documentation:

- [List required documents]

Once you have these documents, please update your timeline or contact me directly.

Best regards`,
  },
  {
    label: 'Questions About Timeline',
    content: `Hello,

Thank you for submitting your CGT Timeline for review.

I have a few questions about your timeline that I'd like to clarify:

1. [Question 1]
2. [Question 2]

Please respond to these questions so I can complete my review.

Best regards`,
  },
];

export default function FeedbackEmailModal({ submission, token, onClose, onSent }: FeedbackEmailModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/${submission.id}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send feedback');
      }

      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template: typeof FEEDBACK_TEMPLATES[0]) => {
    setMessage(template.content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Send Feedback Email</h2>
              <p className="text-xs text-emerald-100">To: {submission.userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Templates */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template)}
                  className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded transition-colors"
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your feedback message..."
              rows={12}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Preview Info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500 dark:text-slate-400">
            <strong>Email will be sent from:</strong> CGT Brain
            <br />
            <strong>Include:</strong> Your feedback message + link to their timeline
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
