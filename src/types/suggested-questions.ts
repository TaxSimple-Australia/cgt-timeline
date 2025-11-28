export interface SuggestedQuestion {
  question: string;
  category: 'calculation' | 'exemption' | 'profit' | 'deductions' | 'general' | string;
  relevance_reason: string;
  priority: number;
}

export interface SuggestQuestionsAPIResponse {
  success: boolean;
  data?: {
    suggested_questions: SuggestedQuestion[];
    context_summary: string;
  };
  error?: string;
}

// Category display info for UI
export const questionCategoryInfo: Record<string, { label: string; color: string; icon: string }> = {
  calculation: {
    label: 'Calculation',
    color: 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white',
    icon: '🧮',
  },
  exemption: {
    label: 'Exemption',
    color: 'bg-green-600 text-white dark:bg-green-600 dark:text-white',
    icon: '🏠',
  },
  profit: {
    label: 'Profit',
    color: 'bg-amber-500 text-white dark:bg-amber-500 dark:text-white',
    icon: '📈',
  },
  deductions: {
    label: 'Deductions',
    color: 'bg-purple-600 text-white dark:bg-purple-600 dark:text-white',
    icon: '💰',
  },
  general: {
    label: 'General',
    color: 'bg-slate-600 text-white dark:bg-slate-600 dark:text-white',
    icon: '❓',
  },
};
