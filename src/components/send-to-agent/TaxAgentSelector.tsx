'use client';

import { useState, useEffect } from 'react';
import { Loader2, UserCircle, Award, Briefcase, Star } from 'lucide-react';
import type { TaxAgentPublic } from '@/types/tax-agent';

interface TaxAgentSelectorProps {
  onSelect: (agent: TaxAgentPublic) => void;
}

export default function TaxAgentSelector({ onSelect }: TaxAgentSelectorProps) {
  const [agents, setAgents] = useState<TaxAgentPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tax-agents/public');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load Tax Agents');
      }

      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Tax Agents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-600" />
        <p className="mt-2 text-slate-500 dark:text-slate-400">Loading Tax Agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchAgents}
          className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
        <p className="mt-2 text-slate-500 dark:text-slate-400">No Tax Agents available at the moment.</p>
        <p className="text-sm text-slate-400 dark:text-slate-500">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Select a Tax Agent to send your CGT Timeline for professional review:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent)}
            className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {agent.photoBase64 ? (
                <img
                  src={agent.photoBase64}
                  alt={agent.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 group-hover:border-emerald-500"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-white">
                    {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{agent.name}</h3>
                  {agent.role === 'senior_tax_agent' && (
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {agent.role === 'senior_tax_agent' ? (
                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      Senior
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      Tax Agent
                    </span>
                  )}
                  {agent.experienceYears && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {agent.experienceYears}y
                    </span>
                  )}
                </div>

                {/* Certifications */}
                {agent.certifications && agent.certifications.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Award className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {agent.certifications.slice(0, 2).join(', ')}
                      {agent.certifications.length > 2 && ` +${agent.certifications.length - 2}`}
                    </span>
                  </div>
                )}

                {/* Bio */}
                {agent.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {agent.bio}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
