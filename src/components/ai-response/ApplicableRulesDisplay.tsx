'use client';

import React from 'react';
import { Scale } from 'lucide-react';
import { ApplicableRule } from '@/types/model-response';

interface ApplicableRulesDisplayProps {
  rules: ApplicableRule[];
}

export default function ApplicableRulesDisplay({ rules }: ApplicableRulesDisplayProps) {
  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <div className="bg-green-950 border-2 border-green-500 dark:border-green-500/30 rounded-xl p-6 shadow-lg">
      <h4 className="font-bold text-xl text-green-400 mb-5 flex items-center gap-2">
        <Scale className="w-5 h-5 text-green-400" />
        Applicable Tax Rules
      </h4>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="rounded-lg p-4 bg-green-900/30 border border-green-700/50"
          >
            <h5 className="font-semibold text-gray-100 mb-2">
              {rule.name}
            </h5>
            <p className="text-sm text-gray-300 leading-relaxed">
              {rule.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
