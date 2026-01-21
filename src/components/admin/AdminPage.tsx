'use client';

import { useState } from 'react';
import { ArrowLeft, BarChart3, ClipboardList, Calculator, LogOut, Shield } from 'lucide-react';
import ChatPanel from './ChatPanel';
import AnnotationPanel from './AnnotationPanel';
import AccuracyDashboard from './AccuracyDashboard';

// LLM Providers for CGT Analysis
const LLM_PROVIDERS = [
  { value: 'claude', label: 'Claude Sonnet 4' },
  { value: 'deepseek', label: 'DeepSeek Chat' },
  { value: 'olmo', label: 'Olmo 3.1 32B (Free)' },
  { value: 'openai', label: 'GPT-4o' },
  { value: 'gemini', label: 'Gemini 2.0 Flash' },
];

// Types
interface SourceReference {
  page: number;
  title: string;
  source_document: string;
}

interface Sources {
  references: SourceReference[];
  rules_summary: string;
}

interface ClarificationQuestion {
  gap_id: string;
  property_address: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  question: string;
  options: string[];
  severity: string;
}

interface VerificationResponse {
  property_address: string;
  issue_period: {
    start_date: string;
    end_date: string;
  };
  resolution_question: string;
  user_response: string;
}

interface CGTResponse {
  query: string;
  answer: string | null;
  sources: Sources | null;
  properties_analyzed: number;
  llm_used: string;
  needs_clarification: boolean;
  clarification_questions: ClarificationQuestion[] | null;
  session_id: string | null;
  trace_id: string | null;
}

const SAMPLE_PAYLOAD = {
  properties: [
    {
      address: '123 Example St, Sydney NSW 2000',
      property_history: [
        { date: '2015-03-15', event: 'purchase', price: 800000, stamp_duty: 32000, purchase_legal_fees: 2500 },
        { date: '2015-04-01', event: 'move_in' },
        { date: '2018-06-01', event: 'move_out', market_value: 950000 },
        { date: '2018-07-01', event: 'rent_start' },
        { date: '2024-06-30', event: 'rent_end' },
        { date: '2024-12-15', event: 'sale', price: 1400000, legal_fees: 1500, agent_fees: 28000 }
      ],
      notes: 'Family home, rented after moving interstate for work'
    }
  ],
  user_query: 'Calculate my CGT liability for this property sale',
  additional_info: {
    australian_resident: true,
    other_property_owned: false
  },
  llm_provider: 'claude'
};

type TabType = 'analysis' | 'annotation' | 'dashboard';

interface AdminPageProps {
  apiUrl: string;
  onLogout: () => void;
  onBack: () => void;
}

export default function AdminPage({ apiUrl, onLogout, onBack }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('analysis');

  // CGT Analysis state
  const [jsonInput, setJsonInput] = useState(JSON.stringify(SAMPLE_PAYLOAD, null, 2));
  const [llmProvider, setLlmProvider] = useState('claude');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<Sources | null>(null);
  const [llmUsed, setLlmUsed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(true);

  // Session state for follow-up questions
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Clarification state
  const [needsClarification, setNeedsClarification] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [verificationResponses, setVerificationResponses] = useState<VerificationResponse[]>([]);

  const submitAnalysis = async () => {
    setLoading(true);
    setError(null);
    setNeedsClarification(false);

    try {
      const payload = JSON.parse(jsonInput);
      payload.llm_provider = llmProvider;

      if (verificationResponses.length > 0) {
        payload.verification_responses = verificationResponses;
      }

      const response = await fetch(`${apiUrl}/calculate-cgt/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to get analysis');
      }

      const data: CGTResponse = await response.json();

      if (data.needs_clarification && data.clarification_questions) {
        setNeedsClarification(true);
        setClarificationQuestions(data.clarification_questions);
        setAnalysis(null);
        setSources(null);
      } else {
        setNeedsClarification(false);
        setClarificationQuestions([]);
        setAnalysis(data.answer);
        setSources(data.sources);
        setLlmUsed(data.llm_used);
        setSessionId(data.session_id);
        setVerificationResponses([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClarificationAnswer = (question: ClarificationQuestion, answer: string) => {
    setClarificationAnswers(prev => ({
      ...prev,
      [question.gap_id]: answer
    }));
  };

  const submitClarifications = () => {
    const responses: VerificationResponse[] = clarificationQuestions.map(q => ({
      property_address: q.property_address,
      issue_period: {
        start_date: q.period.start_date,
        end_date: q.period.end_date,
      },
      resolution_question: q.question,
      user_response: clarificationAnswers[q.gap_id] || q.options[0],
    }));

    setVerificationResponses(responses);
    setClarificationAnswers({});
    setTimeout(() => submitAnalysis(), 100);
  };

  const resetSession = () => {
    setAnalysis(null);
    setSources(null);
    setLlmUsed(null);
    setError(null);
    setSessionId(null);
    setNeedsClarification(false);
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setVerificationResponses([]);
  };

  const adminUser = typeof window !== 'undefined' ? sessionStorage.getItem('cgt_admin_user') : null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Back to Timeline"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">CGT Brain Admin</h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Australian Capital Gains Tax Analysis with RAG</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {adminUser && (
                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Logged in as <span className="font-medium text-slate-700 dark:text-slate-300">{adminUser}</span>
                </span>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'analysis'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <Calculator className="w-4 h-4" />
              CGT Analysis
            </button>
            <button
              onClick={() => setActiveTab('annotation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'annotation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Tax Agent Review
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Accuracy Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* CGT Analysis Tab */}
        {activeTab === 'analysis' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Input Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Property Data (JSON)</h2>
                  {analysis && (
                    <button
                      onClick={resetSession}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      New Analysis
                    </button>
                  )}
                </div>

                {/* LLM Provider Select */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    LLM Provider
                  </label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    disabled={loading}
                  >
                    {LLM_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  className="w-full h-72 p-3 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your property JSON here..."
                  disabled={loading}
                />

                <button
                  onClick={submitAnalysis}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Property'
                  )}
                </button>

                {llmUsed && (
                  <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">LLM Used:</span> {llmUsed}
                  </div>
                )}
              </div>

              {/* Right: Analysis Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col">
                <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">CGT Analysis</h2>

                <div className="flex-1 overflow-y-auto max-h-[600px]">
                  {/* Clarification Questions */}
                  {needsClarification && clarificationQuestions.length > 0 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          Timeline Clarification Needed
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                          Please answer the following questions about gaps in your property timeline:
                        </p>

                        {clarificationQuestions.map((q) => (
                          <div key={q.gap_id} className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-2 mb-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded ${
                                q.severity === 'critical'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                              }`}>
                                {q.severity}
                              </span>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {q.period.start_date} to {q.period.end_date} ({q.period.days} days)
                              </span>
                            </div>
                            <p className="font-medium mb-3 text-slate-900 dark:text-slate-100">{q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((option, optIdx) => (
                                <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`clarification-${q.gap_id}`}
                                    value={option}
                                    checked={clarificationAnswers[q.gap_id] === option}
                                    onChange={() => handleClarificationAnswer(q, option)}
                                    className="text-blue-600"
                                  />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={submitClarifications}
                          disabled={loading || Object.keys(clarificationAnswers).length < clarificationQuestions.length}
                          className="w-full bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
                        >
                          Submit Answers & Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Analysis Result */}
                  {analysis && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {analysis}
                      </div>
                    </div>
                  )}

                  {!analysis && !needsClarification && !loading && (
                    <div className="text-slate-400 dark:text-slate-500 text-center py-8">
                      Submit property data to get your CGT analysis
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                      <p className="mt-2 text-slate-500 dark:text-slate-400">Analyzing with {llmProvider}...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sources Panel */}
            {sources && (
              <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-2 text-lg font-semibold w-full text-left text-slate-900 dark:text-slate-100"
                >
                  <span>{showSources ? '[-]' : '[+]'}</span>
                  Sources ({sources.references.length} references)
                </button>

                {showSources && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">References Used:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {sources.references.map((ref, idx) => (
                          <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                            <div className="font-medium text-sm text-slate-700 dark:text-slate-300">{ref.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {ref.source_document} - Page {ref.page}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {sources.rules_summary && (
                      <div>
                        <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Rules Applied:</h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                            {sources.rules_summary}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Chat Panel */}
            {sessionId && analysis && (
              <div className="mt-6">
                <ChatPanel sessionId={sessionId} llmProvider={llmProvider} apiUrl={apiUrl} />
              </div>
            )}
          </>
        )}

        {/* Annotation Tab */}
        {activeTab === 'annotation' && (
          <AnnotationPanel apiUrl={apiUrl} />
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <AccuracyDashboard apiUrl={apiUrl} />
        )}
      </main>
    </div>
  );
}
