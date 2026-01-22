'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, User, LogOut, Briefcase, RefreshCw, Clock, CheckCircle, AlertCircle, Inbox } from 'lucide-react';
import SubmissionList from './SubmissionList';
import ProfileEditor from './ProfileEditor';
import type { TaxAgentPublic, TaxAgentSubmission, SubmissionStatus, SUBMISSION_STATUS_INFO } from '@/types/tax-agent';

type TabType = 'submissions' | 'profile';

interface TaxAgentDashboardProps {
  agent: TaxAgentPublic;
  token: string;
  onLogout: () => void;
  onBack: () => void;
}

export default function TaxAgentDashboard({ agent, token, onLogout, onBack }: TaxAgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('submissions');
  const [submissions, setSubmissions] = useState<TaxAgentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<TaxAgentPublic>(agent);

  const statusInfo: typeof SUBMISSION_STATUS_INFO = {
    pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
    in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    reviewed: { label: 'Reviewed', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/submissions/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/tax-agents/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentAgent(data.agent);
        localStorage.setItem('tax_agent_data', JSON.stringify(data.agent));
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/tax-agents/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    localStorage.removeItem('tax_agent_token');
    localStorage.removeItem('tax_agent_data');
    onLogout();
  };

  // Calculate stats
  const stats = {
    pending: submissions.filter(s => s.status === 'pending').length,
    inProgress: submissions.filter(s => s.status === 'in_progress').length,
    reviewed: submissions.filter(s => s.status === 'reviewed').length,
    completed: submissions.filter(s => s.status === 'completed').length,
    total: submissions.length,
  };

  return (
    <div className="fixed inset-0 z-[100000] overflow-auto bg-slate-100 dark:bg-slate-950">
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
                <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Tax Agent Dashboard</h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Manage client submissions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Agent info */}
              <div className="flex items-center gap-2">
                {currentAgent.photoBase64 ? (
                  <img
                    src={currentAgent.photoBase64}
                    alt={currentAgent.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {currentAgent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">
                  {currentAgent.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
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
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'submissions'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              Submissions
              {stats.pending > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === 'submissions'
                    ? 'bg-white/20 text-white'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <User className="w-4 h-4" />
              My Profile
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

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Inbox className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">In Progress</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hidden sm:block">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Reviewed</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.reviewed}</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hidden sm:block">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
              </div>
            </div>

            {/* Submission List */}
            <SubmissionList
              submissions={submissions}
              loading={loading}
              token={token}
              statusInfo={statusInfo}
              onRefresh={fetchSubmissions}
              onStatusUpdate={fetchSubmissions}
            />
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileEditor
            agent={currentAgent}
            token={token}
            onUpdate={(updatedAgent) => {
              setCurrentAgent(updatedAgent);
              refreshProfile();
            }}
          />
        )}
      </main>
    </div>
  );
}
