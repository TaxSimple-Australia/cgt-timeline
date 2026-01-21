'use client';

import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Download, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// Types
interface FewShotStats {
  corrected_examples: number;
  correct_examples: number;
  total_examples: number;
  index_exists: boolean;
  index_path?: string;
}

interface ScenarioStats {
  total: number;
  correct: number;
  partial: number;
  incorrect: number;
  na: number;
  accuracy_rate: number;
  partial_rate: number;
  incorrect_rate: number;
  examples_incorrect: Array<{ id: string; query: string; correct_answer?: string; notes?: string }>;
  examples_partial: Array<{ id: string; query: string; correct_answer?: string; notes?: string }>;
}

interface DashboardData {
  overall: {
    total_annotated: number;
    correct: number;
    partial: number;
    incorrect: number;
    accuracy_rate: number;
    partial_rate: number;
    incorrect_rate: number;
  };
  by_scenario: Record<string, ScenarioStats>;
  by_llm: Record<string, { total: number; correct: number; accuracy_rate: number }>;
  failure_patterns: Array<{
    scenario: string;
    failure_rate: number;
    priority: string;
    recommendation: string;
  }>;
  needs_attention: Array<{ scenario: string; incorrect_rate: number; recommendation: string }>;
}

interface RetrievedDoc {
  content: string;
  metadata: {
    source?: string;
    title?: string;
    page?: number;
    [key: string]: unknown;
  };
}

interface FewShotExample {
  id: string;
  query: string;
  correct_answer: string;
  correctness: string;
  similarity_score?: number;
  scenarios?: string[];
}

interface ReviewItem {
  id: string;
  query: string;
  generated_answer: string;
  correctness: string;
  correct_answer?: string;
  general_notes?: string;
  llm_used: string;
  scenarios: string[];
  properties_count: number;
  retrieved_docs_count: number;
  retrieved_docs?: RetrievedDoc[];
  enhanced_query?: string;
  fewshot_examples?: FewShotExample[];
  retrieval_query?: string;
  properties_data?: Array<Record<string, unknown>>;
}

interface ExpertFeedback {
  total_notes: number;
  notes_by_correctness: { incorrect: number; partial: number; correct: number };
  common_themes: Array<{ theme: string; count: number }>;
  recent_notes: Array<{ id: string; note: string; correctness: string; scenarios: string[]; query_preview: string }>;
  critical_feedback: Array<{ id: string; note: string; correctness: string; query_preview: string }>;
}

interface SystemHealth {
  data_quality: {
    total_annotated: number;
    with_corrections: number;
    with_notes: number;
    correction_rate: number;
    notes_rate: number;
  };
  coverage: {
    scenarios: Record<string, number>;
    llms: Record<string, number>;
    missing_scenarios: string[];
  };
  fewshot_index: FewShotStats | { status: string; message: string };
  recommendations: Array<{
    type: string;
    action: string;
    message: string;
    impact: string;
    scenario?: string;
  }>;
  action_summary: {
    needs_index_rebuild: boolean;
    needs_prompt_updates: boolean;
    needs_retrieval_improvement: boolean;
    needs_more_data: boolean;
  };
}

interface RetrievalAnalysis {
  total_documents_analyzed: number;
  documents: Array<{
    document: string;
    times_retrieved: number;
    times_relevant: number;
    times_has_answer: number;
    relevance_rate: number;
    answer_rate: number;
  }>;
  low_quality_docs: Array<{ document: string; relevance_rate: number }>;
  high_quality_docs: Array<{ document: string; answer_rate: number }>;
}

interface TrainingReadiness {
  readiness: {
    level: string;
    message: string;
    dpo_pairs: number;
    sft_examples: number;
    total_reviewed: number;
    thresholds: {
      minimum: number;
      recommended: number;
      production: number;
    };
  };
  quality_metrics: {
    with_detailed_notes: number;
    with_doc_annotations: number;
    notes_rate: number;
    avg_correction_length: number;
  };
  category_balance: {
    by_scenario: Record<string, number>;
    dpo_by_scenario: Record<string, number>;
    underrepresented: string[];
    is_balanced: boolean;
  };
  llm_distribution: Record<string, number>;
  recommendations: Array<{
    priority: string;
    action: string;
    message: string;
    target?: number;
    scenarios?: string[];
  }>;
}

interface CategoryBalance {
  balance_score: number;
  total_samples: number;
  scenarios_covered: number;
  scenarios: Array<{
    scenario: string;
    total: number;
    percentage: number;
    correct: number;
    incorrect: number;
    partial: number;
    with_correction: number;
    correction_rate: number;
    status: string;
    status_message: string;
  }>;
  critical_gaps: string[];
  recommendations: string[];
}

type TabType = 'overview' | 'reviews' | 'feedback' | 'health' | 'retrieval' | 'training';

interface AccuracyDashboardProps {
  apiUrl: string;
}

export default function AccuracyDashboard({ apiUrl }: AccuracyDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [feedback, setFeedback] = useState<ExpertFeedback | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [retrieval, setRetrieval] = useState<RetrievalAnalysis | null>(null);
  const [trainingReadiness, setTrainingReadiness] = useState<TrainingReadiness | null>(null);
  const [categoryBalance, setCategoryBalance] = useState<CategoryBalance | null>(null);

  // UI states
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [rebuildingIndex, setRebuildingIndex] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [exportingDpo, setExportingDpo] = useState(false);
  const [exportingSft, setExportingSft] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, Set<string>>>({});

  const toggleSection = (reviewId: string, section: string) => {
    setExpandedSections(prev => {
      const reviewSections = prev[reviewId] || new Set();
      const newSections = new Set(reviewSections);
      if (newSections.has(section)) {
        newSections.delete(section);
      } else {
        newSections.add(section);
      }
      return { ...prev, [reviewId]: newSections };
    });
  };

  const isSectionExpanded = (reviewId: string, section: string) => {
    return expandedSections[reviewId]?.has(section) || false;
  };

  useEffect(() => {
    loadAllData();
  }, [apiUrl]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, reviewsRes, feedbackRes, healthRes, retrievalRes, trainingRes, balanceRes] = await Promise.all([
        fetch(`${apiUrl}/accuracy/dashboard/`),
        fetch(`${apiUrl}/accuracy/recent-reviews/?limit=20`),
        fetch(`${apiUrl}/accuracy/expert-feedback/`),
        fetch(`${apiUrl}/accuracy/system-health/`),
        fetch(`${apiUrl}/accuracy/retrieval-analysis/`),
        fetch(`${apiUrl}/accuracy/training-readiness/`),
        fetch(`${apiUrl}/accuracy/category-balance/`),
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }
      if (feedbackRes.ok) setFeedback(await feedbackRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
      if (retrievalRes.ok) setRetrieval(await retrievalRes.json());
      if (trainingRes.ok) setTrainingReadiness(await trainingRes.json());
      if (balanceRes.ok) setCategoryBalance(await balanceRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const rebuildIndex = async () => {
    setRebuildingIndex(true);
    try {
      const res = await fetch(`${apiUrl}/fewshot/rebuild/`, { method: 'POST' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to rebuild index:', err);
    } finally {
      setRebuildingIndex(false);
    }
  };

  const exportDpoData = async (format: 'json' | 'jsonl') => {
    setExportingDpo(true);
    try {
      const res = await fetch(`${apiUrl}/accuracy/export-dpo/?format=${format}`);
      if (res.ok) {
        if (format === 'jsonl') {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'cgt_dpo_training.jsonl';
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'cgt_dpo_training.json';
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('Failed to export DPO data:', err);
    } finally {
      setExportingDpo(false);
    }
  };

  const exportSftData = async (format: 'json' | 'jsonl') => {
    setExportingSft(true);
    try {
      const res = await fetch(`${apiUrl}/accuracy/export-sft/?format=${format}`);
      if (res.ok) {
        if (format === 'jsonl') {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'cgt_sft_training.jsonl';
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'cgt_sft_training.json';
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('Failed to export SFT data:', err);
    } finally {
      setExportingSft(false);
    }
  };

  const formatScenario = (s: string) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default: return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    }
  };

  const getCorrectnessColor = (c: string) => {
    switch (c) {
      case 'correct': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'partial': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'incorrect': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
    }
  };

  const getAccuracyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Loading AI Engineer Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span>Error: {error}</span>
        </div>
        <button onClick={loadAllData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Recent Reviews', badge: reviews.length },
    { id: 'feedback', label: 'Expert Feedback', badge: feedback?.total_notes },
    { id: 'health', label: 'System Health', badge: health?.recommendations.length },
    { id: 'retrieval', label: 'Retrieval Quality' },
    { id: 'training', label: 'Training Data', badge: trainingReadiness?.readiness.dpo_pairs },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Engineer Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {dashboardData?.overall.total_annotated || 0} reviews analyzed
            </p>
          </div>
        </div>
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh All
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 px-4 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{dashboardData.overall.total_annotated}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Reviews</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className={`text-3xl font-bold ${getAccuracyColor(dashboardData.overall.accuracy_rate)}`}>
                  {dashboardData.overall.accuracy_rate}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Accuracy</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{dashboardData.overall.correct}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Correct</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{dashboardData.overall.partial}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Partial</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{dashboardData.overall.incorrect}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Incorrect</div>
              </div>
            </div>

            {/* Quick Actions */}
            {health && health.action_summary && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Quick Actions Needed</h3>
                <div className="flex flex-wrap gap-3">
                  {health.action_summary.needs_index_rebuild && (
                    <button
                      onClick={rebuildIndex}
                      disabled={rebuildingIndex}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
                    >
                      {rebuildingIndex ? 'Rebuilding...' : 'Rebuild Few-Shot Index'}
                    </button>
                  )}
                  {health.action_summary.needs_prompt_updates && (
                    <span className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg">
                      Prompt Updates Needed
                    </span>
                  )}
                  {health.action_summary.needs_retrieval_improvement && (
                    <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-lg">
                      Retrieval Improvement Needed
                    </span>
                  )}
                  {health.action_summary.needs_more_data && (
                    <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg">
                      More Test Data Needed
                    </span>
                  )}
                  {!health.action_summary.needs_index_rebuild &&
                   !health.action_summary.needs_prompt_updates &&
                   !health.action_summary.needs_retrieval_improvement &&
                   !health.action_summary.needs_more_data && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      All Systems Healthy
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Accuracy by Scenario */}
            <div>
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Accuracy by CGT Scenario</h3>
              <div className="space-y-2">
                {Object.entries(dashboardData.by_scenario)
                  .sort(([, a], [, b]) => b.incorrect_rate - a.incorrect_rate)
                  .map(([scenario, stats]) => (
                    <div key={scenario} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                        onClick={() => setExpandedScenario(expandedScenario === scenario ? null : scenario)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedScenario === scenario ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          <span className="font-medium text-slate-900 dark:text-slate-100">{formatScenario(scenario)}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">({stats.total} samples)</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2 text-sm">
                            <span className="text-green-600 dark:text-green-400">{stats.correct}</span>
                            <span className="text-yellow-600 dark:text-yellow-400">{stats.partial}</span>
                            <span className="text-red-600 dark:text-red-400">{stats.incorrect}</span>
                          </div>
                          <span className={`font-bold ${getAccuracyColor(stats.accuracy_rate)}`}>
                            {stats.accuracy_rate}%
                          </span>
                        </div>
                      </div>
                      {expandedScenario === scenario && (stats.examples_incorrect.length > 0 || stats.examples_partial.length > 0) && (
                        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                          {stats.examples_incorrect.map((ex, i) => (
                            <div key={i} className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              <div className="text-slate-700 dark:text-slate-300">{ex.query}</div>
                              {ex.correct_answer && (
                                <div className="mt-1 text-green-700 dark:text-green-300">Correct: {ex.correct_answer}</div>
                              )}
                            </div>
                          ))}
                          {stats.examples_partial.map((ex, i) => (
                            <div key={i} className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                              <div className="text-slate-700 dark:text-slate-300">{ex.query}</div>
                              {ex.notes && <div className="mt-1 text-slate-500 dark:text-slate-400">Notes: {ex.notes}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Accuracy by LLM */}
            {Object.keys(dashboardData.by_llm).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Accuracy by LLM Provider</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(dashboardData.by_llm).map(([llm, stats]) => (
                    <div key={llm} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{llm}</div>
                      <div className={`text-2xl font-bold ${getAccuracyColor(stats.accuracy_rate)}`}>
                        {stats.accuracy_rate}%
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{stats.correct}/{stats.total} correct</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Showing {reviews.length} most recent reviews with full details
            </div>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">No reviews yet</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs rounded ${getCorrectnessColor(review.correctness)}`}>
                            {review.correctness}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{review.llm_used}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">ID: {review.id}</span>
                        </div>
                        <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{review.query}</div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {review.scenarios.map((s) => (
                            <span key={s} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                              {formatScenario(s)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 ml-2">
                        {expandedReview === review.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>

                  {expandedReview === review.id && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Original Query</h4>
                        <div className="text-sm bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">{review.query}</div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Generated Answer</h4>
                        <div className="text-sm bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                          {review.generated_answer}
                        </div>
                      </div>

                      {review.correct_answer && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Expert Correction</h4>
                          <div className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                            {review.correct_answer}
                          </div>
                        </div>
                      )}

                      {review.general_notes && (
                        <div>
                          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Expert Notes</h4>
                          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300">
                            {review.general_notes}
                          </div>
                        </div>
                      )}

                      {/* RAG Context */}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-3">RAG Context (AI Engineer View)</h4>

                        {review.enhanced_query && (
                          <div className="mb-2">
                            <button
                              onClick={() => toggleSection(review.id, 'enhanced_query')}
                              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                            >
                              <span>{isSectionExpanded(review.id, 'enhanced_query') ? '[-]' : '[+]'}</span>
                              Enhanced Query (sent to LLM)
                            </button>
                            {isSectionExpanded(review.id, 'enhanced_query') && (
                              <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300">
                                {review.enhanced_query}
                              </div>
                            )}
                          </div>
                        )}

                        {review.retrieved_docs && review.retrieved_docs.length > 0 && (
                          <div className="mb-2">
                            <button
                              onClick={() => toggleSection(review.id, 'chunks')}
                              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                            >
                              <span>{isSectionExpanded(review.id, 'chunks') ? '[-]' : '[+]'}</span>
                              Retrieved Chunks ({review.retrieved_docs.length})
                            </button>
                            {isSectionExpanded(review.id, 'chunks') && (
                              <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                                {review.retrieved_docs.map((doc, idx) => (
                                  <div key={idx} className="text-xs bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                                      <span className="font-semibold">Chunk {idx + 1}</span>
                                      {doc.metadata?.title && <span>| {doc.metadata.title}</span>}
                                      {doc.metadata?.page && <span>| Page {doc.metadata.page}</span>}
                                    </div>
                                    <div className="whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                      {doc.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {review.fewshot_examples && review.fewshot_examples.length > 0 && (
                          <div className="mb-2">
                            <button
                              onClick={() => toggleSection(review.id, 'fewshot')}
                              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                            >
                              <span>{isSectionExpanded(review.id, 'fewshot') ? '[-]' : '[+]'}</span>
                              Few-Shot Examples Injected ({review.fewshot_examples.length})
                            </button>
                            {isSectionExpanded(review.id, 'fewshot') && (
                              <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                                {review.fewshot_examples.map((ex, idx) => (
                                  <div key={idx} className="text-xs bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <span className="font-semibold text-purple-700 dark:text-purple-300">Example {idx + 1}</span>
                                      <span className={`px-2 py-0.5 rounded ${getCorrectnessColor(ex.correctness)}`}>
                                        {ex.correctness}
                                      </span>
                                      {ex.similarity_score !== undefined && (
                                        <span className="text-slate-500 dark:text-slate-400">Score: {ex.similarity_score.toFixed(3)}</span>
                                      )}
                                    </div>
                                    <div className="mb-2 text-slate-700 dark:text-slate-300">
                                      <span className="font-medium">Query:</span> {ex.query}
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded">
                                      <span className="font-medium text-green-700 dark:text-green-300">Correct Answer:</span>
                                      <div className="whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">{ex.correct_answer}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>Properties: {review.properties_count}</span>
                        <span>Retrieved Docs: {review.retrieved_docs_count}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && feedback && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{feedback.total_notes}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Notes</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{feedback.notes_by_correctness.incorrect}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">On Incorrect</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{feedback.notes_by_correctness.partial}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">On Partial</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{feedback.notes_by_correctness.correct}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">On Correct</div>
              </div>
            </div>

            {feedback.common_themes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Common Themes in Feedback</h3>
                <div className="flex flex-wrap gap-2">
                  {feedback.common_themes.map((theme) => (
                    <span
                      key={theme.theme}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300"
                    >
                      {theme.theme} <span className="text-slate-500 dark:text-slate-400">({theme.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {feedback.critical_feedback.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-red-700 dark:text-red-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Critical Feedback (Incorrect Answers)
                </h3>
                <div className="space-y-2">
                  {feedback.critical_feedback.map((item) => (
                    <div key={item.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{item.query_preview}...</div>
                      <div className="text-sm font-medium text-red-800 dark:text-red-200">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Recent Expert Notes</h3>
              {feedback.recent_notes.length === 0 ? (
                <div className="text-slate-400 dark:text-slate-500 text-center py-4">No notes yet</div>
              ) : (
                <div className="space-y-2">
                  {feedback.recent_notes.map((item) => (
                    <div key={item.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs rounded ${getCorrectnessColor(item.correctness)}`}>
                          {item.correctness}
                        </span>
                        {item.scenarios.map((s) => (
                          <span key={s} className="text-xs text-slate-500 dark:text-slate-400">{formatScenario(s)}</span>
                        ))}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{item.query_preview}...</div>
                      <div className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded text-slate-700 dark:text-slate-300">{item.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && health && (
          <div className="space-y-6">
            {health.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Actionable Recommendations</h3>
                <div className="space-y-2">
                  {health.recommendations.map((rec, i) => (
                    <div key={i} className={`p-4 border rounded-lg ${getTypeColor(rec.type)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold uppercase text-xs">{rec.type}</span>
                            <span className="text-xs opacity-75">Impact: {rec.impact}</span>
                          </div>
                          <div className="text-sm">{rec.message}</div>
                        </div>
                        {rec.action === 'rebuild_index' && (
                          <button
                            onClick={rebuildIndex}
                            disabled={rebuildingIndex}
                            className="ml-4 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
                          >
                            {rebuildingIndex ? '...' : 'Rebuild'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Data Quality Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{health.data_quality.total_annotated}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Annotated</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{health.data_quality.with_corrections}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">With Corrections ({health.data_quality.correction_rate}%)</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{health.data_quality.with_notes}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">With Notes ({health.data_quality.notes_rate}%)</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {'index_exists' in health.fewshot_index && health.fewshot_index.index_exists ? 'Active' : 'None'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Few-Shot Index</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Scenario Coverage</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(health.coverage.scenarios).map(([scenario, count]) => (
                  <div
                    key={scenario}
                    className={`p-3 rounded border ${count < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
                  >
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatScenario(scenario)}</div>
                    <div className={`text-lg font-bold ${count < 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {count} samples
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RETRIEVAL TAB */}
        {activeTab === 'retrieval' && retrieval && (
          <div className="space-y-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Analysis of {retrieval.total_documents_analyzed} unique documents retrieved across all reviews
            </div>

            {retrieval.high_quality_docs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-green-700 dark:text-green-300">High Quality Documents</h3>
                <div className="space-y-2">
                  {retrieval.high_quality_docs.map((doc, i) => (
                    <div key={i} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{doc.document}</span>
                      <span className="text-green-700 dark:text-green-300 font-medium">{doc.answer_rate}% contain answer</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {retrieval.low_quality_docs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-red-700 dark:text-red-300">Low Quality Documents (Consider Removing/Reindexing)</h3>
                <div className="space-y-2">
                  {retrieval.low_quality_docs.map((doc, i) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{doc.document}</span>
                      <span className="text-red-700 dark:text-red-300 font-medium">{doc.relevance_rate}% relevant</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Document Retrieval Stats</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="text-left p-2 text-slate-700 dark:text-slate-300">Document</th>
                      <th className="text-right p-2 text-slate-700 dark:text-slate-300">Retrieved</th>
                      <th className="text-right p-2 text-slate-700 dark:text-slate-300">Relevant</th>
                      <th className="text-right p-2 text-slate-700 dark:text-slate-300">Has Answer</th>
                      <th className="text-right p-2 text-slate-700 dark:text-slate-300">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retrieval.documents.map((doc, i) => (
                      <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="p-2 max-w-xs truncate text-slate-700 dark:text-slate-300">{doc.document}</td>
                        <td className="p-2 text-right text-slate-700 dark:text-slate-300">{doc.times_retrieved}</td>
                        <td className="p-2 text-right text-slate-700 dark:text-slate-300">{doc.times_relevant} ({doc.relevance_rate}%)</td>
                        <td className="p-2 text-right text-slate-700 dark:text-slate-300">{doc.times_has_answer} ({doc.answer_rate}%)</td>
                        <td className="p-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            doc.answer_rate >= 50 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                            doc.relevance_rate >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          }`}>
                            {doc.answer_rate >= 50 ? 'Good' : doc.relevance_rate >= 50 ? 'Fair' : 'Poor'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TRAINING TAB */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            {trainingReadiness && (
              <>
                <div className={`p-4 rounded-lg border ${
                  trainingReadiness.readiness.level === 'production' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                  trainingReadiness.readiness.level === 'recommended' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                  trainingReadiness.readiness.level === 'minimum' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                  'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Training Readiness</h3>
                      <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">{trainingReadiness.readiness.message}</p>
                    </div>
                    <div className={`text-2xl sm:text-3xl font-bold ${
                      trainingReadiness.readiness.level === 'production' ? 'text-green-600 dark:text-green-400' :
                      trainingReadiness.readiness.level === 'recommended' ? 'text-blue-600 dark:text-blue-400' :
                      trainingReadiness.readiness.level === 'minimum' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {trainingReadiness.readiness.level.toUpperCase()}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>0</span>
                      <span>{trainingReadiness.readiness.thresholds.minimum} (Min)</span>
                      <span>{trainingReadiness.readiness.thresholds.recommended} (Rec)</span>
                      <span>{trainingReadiness.readiness.thresholds.production}+ (Prod)</span>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          trainingReadiness.readiness.level === 'production' ? 'bg-green-500' :
                          trainingReadiness.readiness.level === 'recommended' ? 'bg-blue-500' :
                          trainingReadiness.readiness.level === 'minimum' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (trainingReadiness.readiness.dpo_pairs / trainingReadiness.readiness.thresholds.production) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{trainingReadiness.readiness.dpo_pairs}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">DPO Pairs Ready</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{trainingReadiness.readiness.sft_examples}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">SFT Examples</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center border border-slate-200 dark:border-slate-700">
                    <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">{trainingReadiness.readiness.total_reviewed}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Reviewed</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{trainingReadiness.quality_metrics.notes_rate}%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">With Detailed Notes</div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Export Training Data</h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">DPO Format (prompt/chosen/rejected)</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportDpoData('json')}
                          disabled={exportingDpo || trainingReadiness.readiness.dpo_pairs === 0}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {exportingDpo ? '...' : 'JSON'}
                        </button>
                        <button
                          onClick={() => exportDpoData('jsonl')}
                          disabled={exportingDpo || trainingReadiness.readiness.dpo_pairs === 0}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
                        >
                          JSONL
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">SFT Format (instruction/input/output)</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportSftData('json')}
                          disabled={exportingSft || trainingReadiness.readiness.sft_examples === 0}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {exportingSft ? '...' : 'JSON'}
                        </button>
                        <button
                          onClick={() => exportSftData('jsonl')}
                          disabled={exportingSft || trainingReadiness.readiness.sft_examples === 0}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
                        >
                          JSONL
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    DPO: For preference learning (requires incorrect/partial answers with corrections).
                    SFT: For supervised fine-tuning (all correct examples).
                  </p>
                </div>
              </>
            )}

            {categoryBalance && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Category Balance</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Balance Score:</span>
                    <span className={`text-lg font-bold ${
                      categoryBalance.balance_score >= 80 ? 'text-green-600 dark:text-green-400' :
                      categoryBalance.balance_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {categoryBalance.balance_score}/100
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {categoryBalance.scenarios.map((scenario) => (
                    <div key={scenario.scenario} className="flex items-center gap-3">
                      <div className="w-32 text-sm truncate text-slate-700 dark:text-slate-300">{formatScenario(scenario.scenario)}</div>
                      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full ${
                            scenario.status === 'critical' ? 'bg-red-300 dark:bg-red-700' :
                            scenario.status === 'low' ? 'bg-yellow-300 dark:bg-yellow-700' :
                            'bg-green-300 dark:bg-green-700'
                          }`}
                          style={{ width: `${Math.min(100, scenario.percentage * 2)}%` }}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className={`text-sm font-medium ${
                          scenario.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                          scenario.status === 'low' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {scenario.total}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({scenario.with_correction} corr)</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        scenario.status === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        scenario.status === 'low' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        scenario.status === 'good' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {scenario.status}
                      </span>
                    </div>
                  ))}
                </div>

                {categoryBalance.recommendations.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Balance Recommendations:</div>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      {categoryBalance.recommendations.map((rec, i) => (
                        <li key={i}>- {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!trainingReadiness && !categoryBalance && (
              <div className="text-center py-12">
                <div className="text-slate-400 dark:text-slate-500 text-lg mb-2">No training data available</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Complete some reviews with corrections to generate training data.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (!dashboardData || dashboardData.overall.total_annotated === 0) && (
          <div className="text-center py-12">
            <div className="text-slate-400 dark:text-slate-500 text-lg mb-2">No reviews yet</div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Complete some reviews in the Tax Agent Review tab to see accuracy metrics and insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
