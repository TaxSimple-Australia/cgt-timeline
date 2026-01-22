'use client';

import { useState, useEffect } from 'react';
import { Plus, UserCircle, Mail, Phone, Calendar, Edit2, UserX, UserCheck, Award, Briefcase, RefreshCw } from 'lucide-react';
import TaxAgentCreateModal from './TaxAgentCreateModal';
import TaxAgentEditModal from './TaxAgentEditModal';
import type { TaxAgent, TAX_AGENT_ROLE_INFO } from '@/types/tax-agent';

interface TaxAgentManagementProps {
  adminCredentials: string; // Base64 encoded credentials
}

export default function TaxAgentManagement({ adminCredentials }: TaxAgentManagementProps) {
  const [agents, setAgents] = useState<Omit<TaxAgent, 'passwordHash'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Omit<TaxAgent, 'passwordHash'> | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tax-agents/list', {
        headers: {
          'Authorization': `Basic ${adminCredentials}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch Tax Agents');
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Tax Agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = async (agent: Omit<TaxAgent, 'passwordHash'>) => {
    if (!confirm(`Are you sure you want to ${agent.isActive ? 'deactivate' : 'activate'} ${agent.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tax-agents/${agent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${adminCredentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update Tax Agent');
      }

      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Tax Agent');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleInfo = (role: TaxAgent['role']) => {
    const info: typeof TAX_AGENT_ROLE_INFO = {
      tax_agent: { label: 'Tax Agent', description: 'Standard Tax Agent' },
      senior_tax_agent: { label: 'Senior Tax Agent', description: 'Senior Tax Agent with additional privileges' },
    };
    return info[role];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tax Agent Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create and manage Tax Agent accounts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tax Agent</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{agents.length}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Agents</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {agents.filter(a => a.isActive).length}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {agents.filter(a => a.role === 'senior_tax_agent').length}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Senior Agents</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-2xl font-bold text-slate-400 dark:text-slate-500">
            {agents.filter(a => !a.isActive).length}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Inactive</div>
        </div>
      </div>

      {/* Agent List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        {loading && agents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Loading Tax Agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="p-8 text-center">
            <UserCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-slate-500 dark:text-slate-400">No Tax Agents created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Tax Agent
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`p-4 sm:p-6 ${!agent.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {agent.photoBase64 ? (
                      <img
                        src={agent.photoBase64}
                        alt={agent.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{agent.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        agent.role === 'senior_tax_agent'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {getRoleInfo(agent.role).label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        agent.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {agent.email}
                      </span>
                      {agent.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {agent.contactPhone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {formatDate(agent.createdAt)}
                      </span>
                    </div>

                    {/* Additional info */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {agent.experienceYears && (
                        <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                          <Briefcase className="w-3 h-3" />
                          {agent.experienceYears} years experience
                        </span>
                      )}
                      {agent.certifications && agent.certifications.length > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                          <Award className="w-3 h-3" />
                          {agent.certifications.length} certifications
                        </span>
                      )}
                    </div>

                    {agent.bio && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {agent.bio}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(agent)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                        agent.isActive
                          ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300'
                          : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {agent.isActive ? (
                        <>
                          <UserX className="w-4 h-4" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <TaxAgentCreateModal
          adminCredentials={adminCredentials}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchAgents();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingAgent && (
        <TaxAgentEditModal
          agent={editingAgent}
          adminCredentials={adminCredentials}
          onClose={() => setEditingAgent(null)}
          onUpdated={() => {
            setEditingAgent(null);
            fetchAgents();
          }}
        />
      )}
    </div>
  );
}
