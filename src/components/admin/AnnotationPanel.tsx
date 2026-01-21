'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Keyboard, ChevronRight } from 'lucide-react';

// Types
interface QueueItem {
  id: string;
  created_at: string;
  status: string;
  query: string;
  llm_used: string;
  num_docs: number;
  annotated_at?: string;
  edited_at?: string;
  duplicate_count?: number;
}

interface PropertyEvent {
  date: string;
  event: string;
  price?: number;
  market_value?: number;
}

interface PropertyData {
  address: string;
  property_history: PropertyEvent[];
  notes?: string;
}

interface RetrievedDoc {
  content: string;
  metadata: {
    title?: string;
    source_document?: string;
    page?: number;
    section?: string;
  };
}

interface AnnotationItem {
  id: string;
  created_at: string;
  status: string;
  query: string;
  properties_data: PropertyData[];
  generated_answer: string;
  retrieved_docs: RetrievedDoc[];
  sources: Record<string, unknown>;
  llm_used: string;
  correctness?: string;
  correct_answer?: string;
  faithfulness_notes?: string;
  general_notes?: string;
  doc_annotations?: DocAnnotation[];
}

interface Stats {
  total: number;
  pending: number;
  annotated: number;
  skipped: number;
  correctness_distribution: {
    correct: number;
    partial: number;
    incorrect: number;
    na: number;
  };
  annotation_rate: number;
}

interface DocAnnotation {
  doc_index: number;
  relevance: string;
  contains_answer: boolean;
  notes?: string;
}

// Common issues templates for quick notes
const QUICK_NOTES = [
  { label: '6-year rule miscalculated', value: 'The 6-year absence rule was incorrectly applied. ' },
  { label: 'Wrong exemption %', value: 'The main residence exemption percentage is incorrect. ' },
  { label: 'Cost base error', value: 'Cost base calculation is incorrect. ' },
  { label: 'Date calculation wrong', value: 'The ownership period dates are calculated incorrectly. ' },
  { label: 'Missing CGT event', value: 'A relevant CGT event was not considered. ' },
  { label: 'Wrong discount method', value: 'Incorrect discount method applied (should use 50% CGT discount / indexation). ' },
  { label: 'Hallucinated rule', value: 'The answer references a rule that doesn\'t exist or is misquoted. ' },
];

interface AnnotationPanelProps {
  apiUrl: string;
}

export default function AnnotationPanel({ apiUrl }: AnnotationPanelProps) {
  // Queue state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // Selected item state
  const [selectedItem, setSelectedItem] = useState<AnnotationItem | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Annotation form state
  const [correctness, setCorrectness] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [docAnnotations, setDocAnnotations] = useState<DocAnnotation[]>([]);
  const [faithfulnessNotes, setFaithfulnessNotes] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load queue on mount
  useEffect(() => {
    loadQueue();
  }, [statusFilter, apiUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when item is selected and not typing in textarea
      if (!selectedItem || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      switch (e.key) {
        case '1':
          setCorrectness('correct');
          break;
        case '2':
          setCorrectness('partial');
          break;
        case '3':
          setCorrectness('incorrect');
          break;
        case '4':
          skipItem();
          break;
        case 'Enter':
          if (e.ctrlKey && correctness) {
            submitAnnotation();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, correctness]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `${apiUrl}/annotation/queue/?status=${statusFilter}`
        : `${apiUrl}/annotation/queue/`;
      const response = await fetch(url);
      const data = await response.json();
      setQueue(data.items || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadItem = async (itemId: string, index: number) => {
    setLoadingItem(true);
    setCurrentIndex(index);
    setIsEditMode(false);
    try {
      const response = await fetch(`${apiUrl}/annotation/item/${itemId}`);
      const data = await response.json();
      setSelectedItem(data);

      // Initialize doc annotations
      if (data.retrieved_docs) {
        if (data.doc_annotations && data.doc_annotations.length > 0) {
          setDocAnnotations(data.doc_annotations);
        } else {
          setDocAnnotations(
            data.retrieved_docs.map((_: unknown, idx: number) => ({
              doc_index: idx,
              relevance: '',
              contains_answer: false,
              notes: '',
            }))
          );
        }
      }

      // Populate form with existing annotation data if reviewed
      if (data.status === 'annotated') {
        setCorrectness(data.correctness || '');
        setCorrectAnswer(data.correct_answer || '');
        setFaithfulnessNotes(data.faithfulness_notes || '');
        setGeneralNotes(data.general_notes || '');
      } else {
        setCorrectness('');
        setCorrectAnswer('');
        setFaithfulnessNotes('');
        setGeneralNotes('');
      }
    } catch (err) {
      console.error('Failed to load item:', err);
    } finally {
      setLoadingItem(false);
    }
  };

  const loadNextItem = useCallback(() => {
    const pendingItems = queue.filter((item) => item.status === 'pending');
    if (pendingItems.length > 0) {
      const nextItem = pendingItems[0];
      const nextIndex = queue.findIndex((q) => q.id === nextItem.id);
      loadItem(nextItem.id, nextIndex);
    } else {
      setSelectedItem(null);
      setCurrentIndex(-1);
    }
  }, [queue, apiUrl]);

  const submitAnnotation = async () => {
    if (!selectedItem || !correctness) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/annotation/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedItem.id,
          correctness,
          correct_answer: correctAnswer || null,
          doc_annotations: docAnnotations.filter((d) => d.relevance),
          faithfulness_notes: faithfulnessNotes || null,
          general_notes: generalNotes || null,
          annotator: 'tax_agent',
        }),
      });

      if (response.ok) {
        await loadQueue();
        loadNextItem();
      }
    } catch (err) {
      console.error('Failed to submit annotation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateAnnotation = async () => {
    if (!selectedItem || !correctness) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/annotation/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedItem.id,
          correctness,
          correct_answer: correctAnswer || null,
          doc_annotations: docAnnotations.filter((d) => d.relevance),
          faithfulness_notes: faithfulnessNotes || null,
          general_notes: generalNotes || null,
          annotator: 'tax_agent',
        }),
      });

      if (response.ok) {
        await loadQueue();
        setIsEditMode(false);
        loadItem(selectedItem.id, currentIndex);
      }
    } catch (err) {
      console.error('Failed to update annotation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const skipItem = async () => {
    if (!selectedItem) return;

    try {
      await fetch(`${apiUrl}/annotation/skip/${selectedItem.id}`, {
        method: 'POST',
      });
      await loadQueue();
      loadNextItem();
    } catch (err) {
      console.error('Failed to skip item:', err);
    }
  };

  const updateDocAnnotation = (
    index: number,
    field: keyof DocAnnotation,
    value: string | boolean
  ) => {
    setDocAnnotations((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const addQuickNote = (note: string) => {
    setGeneralNotes((prev) => prev + note);
  };

  const formatEventType = (event: string): string => {
    const eventMap: Record<string, string> = {
      purchase: 'Purchased',
      sale: 'Sold',
      move_in: 'Moved In',
      move_out: 'Moved Out',
      rent_start: 'Started Renting',
      rent_end: 'Stopped Renting',
    };
    return eventMap[event] || event;
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tax Agent Review</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Review CGT calculations and provide corrections. Your feedback trains the system.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400 hidden lg:block">
          <div className="flex items-center gap-1 font-medium mb-1">
            <Keyboard className="w-3 h-3" />
            Keyboard Shortcuts
          </div>
          <div><kbd className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">1</kbd> Correct</div>
          <div><kbd className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">2</kbd> Partial</div>
          <div><kbd className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">3</kbd> Incorrect</div>
          <div><kbd className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">4</kbd> Skip</div>
          <div><kbd className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">Ctrl+Enter</kbd> Submit</div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats && stats.total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>{stats.annotated} reviewed</span>
            <span>{stats.pending} remaining</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${stats.annotation_rate}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-5 gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Total</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">Pending</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.annotated}</div>
            <div className="text-xs text-green-700 dark:text-green-300">Reviewed</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-slate-600 dark:text-slate-400">{stats.skipped}</div>
            <div className="text-xs text-slate-700 dark:text-slate-300">Skipped</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.annotation_rate}%</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">Complete</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Review Queue</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <option value="pending">Pending</option>
              <option value="annotated">Reviewed</option>
              <option value="skipped">Skipped</option>
              <option value="">All</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-4 text-slate-400 dark:text-slate-500">Loading...</div>
          ) : queue.length === 0 ? (
            <div className="text-center py-4 text-slate-400 dark:text-slate-500">
              No items in queue
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {queue.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => loadItem(item.id, idx)}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        #{idx + 1}
                      </span>
                      {item.duplicate_count && item.duplicate_count > 1 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" title="Same scenario submitted multiple times">
                          x{item.duplicate_count}
                        </span>
                      )}
                      {item.edited_at && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" title={`Edited: ${item.edited_at}`}>
                          edited
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        item.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : item.status === 'annotated'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.status === 'annotated' ? 'reviewed' : item.status}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2 text-slate-700 dark:text-slate-300">{item.query}</p>
                  <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.llm_used}</span>
                    <span>{item.num_docs} docs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Annotation Interface */}
        <div className="lg:col-span-2">
          {loadingItem ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">Loading item...</div>
          ) : !selectedItem ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <p className="mb-2">Select an item from the queue to review</p>
              <p className="text-xs">Or press <kbd className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">1-4</kbd> to rate quickly</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Property Timeline */}
              {selectedItem.properties_data && selectedItem.properties_data.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2">Property Timeline</h4>
                  {selectedItem.properties_data.map((prop, propIdx) => (
                    <div key={propIdx} className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 mb-2">
                      <div className="font-medium text-sm mb-2 text-slate-900 dark:text-slate-100">{prop.address}</div>
                      <div className="flex flex-wrap gap-2">
                        {prop.property_history?.map((event, evtIdx) => (
                          <div
                            key={evtIdx}
                            className={`text-xs px-2 py-1 rounded ${
                              event.event === 'purchase' || event.event === 'sale'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                : event.event.includes('move')
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                            }`}
                          >
                            <span className="font-medium">{event.date}</span>
                            <span className="mx-1">-</span>
                            <span>{formatEventType(event.event)}</span>
                            {(event.price || event.market_value) && (
                              <span className="ml-1 font-medium">
                                {formatCurrency(event.price || event.market_value)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {prop.notes && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic">{prop.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Query */}
              <div>
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-1">Query</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
                  {selectedItem.query}
                </div>
              </div>

              {/* Generated Answer */}
              <div>
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-1">
                  Generated Answer (LLM: {selectedItem.llm_used})
                </h4>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {selectedItem.generated_answer}
                </div>
              </div>

              {/* Retrieved Documents - Collapsible */}
              <details className="border border-slate-200 dark:border-slate-700 rounded-lg">
                <summary className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Retrieved Documents ({selectedItem.retrieved_docs.length})</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </summary>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2 max-h-48 overflow-y-auto">
                  {selectedItem.retrieved_docs.map((doc, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-xs text-slate-700 dark:text-slate-300">
                          {doc.metadata.title || `Document ${idx + 1}`}
                        </span>
                        <select
                          value={docAnnotations[idx]?.relevance || ''}
                          onChange={(e) =>
                            updateDocAnnotation(idx, 'relevance', e.target.value)
                          }
                          className="text-xs border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          <option value="">Rate...</option>
                          <option value="highly_relevant">Highly Relevant</option>
                          <option value="relevant">Relevant</option>
                          <option value="partial">Partial</option>
                          <option value="not_relevant">Not Relevant</option>
                        </select>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {doc.content.substring(0, 200)}...
                      </p>
                    </div>
                  ))}
                </div>
              </details>

              {/* Correctness Rating */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-600">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Is the CGT calculation correct?
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'correct', label: 'Correct', key: '1', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-800 dark:text-green-200' },
                    { value: 'partial', label: 'Partial', key: '2', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200' },
                    { value: 'incorrect', label: 'Incorrect', key: '3', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', text: 'text-red-800 dark:text-red-200' },
                    { value: 'na', label: 'Unsure', key: '-', bg: 'bg-slate-100 dark:bg-slate-700', border: 'border-slate-400', text: 'text-slate-800 dark:text-slate-200' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCorrectness(option.value)}
                      className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        correctness === option.value
                          ? `${option.bg} ${option.border} ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800`
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                      } ${correctness === option.value ? option.text : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      <div>{option.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">({option.key})</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Correct Answer (if incorrect/partial) */}
              {(correctness === 'incorrect' || correctness === 'partial') && (
                <div>
                  <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-1">
                    What is the correct answer/calculation?
                  </h4>
                  <textarea
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm h-32 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    placeholder="Provide the correct CGT calculation or answer..."
                  />
                </div>
              )}

              {/* Quick Notes */}
              <div>
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Quick Notes (click to add)
                </h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {QUICK_NOTES.map((note, idx) => (
                    <button
                      key={idx}
                      onClick={() => addQuickNote(note.value)}
                      className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors text-slate-700 dark:text-slate-300"
                    >
                      {note.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm h-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  placeholder="Additional notes for this review..."
                />
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-800 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                {selectedItem.status === 'annotated' && !isEditMode ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                  >
                    Edit Review
                  </button>
                ) : isEditMode ? (
                  <>
                    <button
                      onClick={updateAnnotation}
                      disabled={!correctness || submitting}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        loadItem(selectedItem.id, currentIndex);
                      }}
                      className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={submitAnnotation}
                      disabled={!correctness || submitting}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit & Next (Ctrl+Enter)'}
                    </button>
                    <button
                      onClick={skipItem}
                      className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Skip (4)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
