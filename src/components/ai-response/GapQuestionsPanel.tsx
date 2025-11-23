'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Calendar, MapPin, Send } from 'lucide-react';
import { format } from 'date-fns';

interface GapQuestion {
  question: string;
  type: string;
  properties_involved: string[];
  period: {
    start: string;
    end: string;
    days: number;
  };
  possible_answers: string[];
}

interface GapQuestionsPanelProps {
  questions: GapQuestion[];
  issues?: any[];
  onSubmit?: (answers: Array<{
    question: string;
    answer: string;
    period: { start: string; end: string; days: number };
    properties_involved: string[];
  }>) => void;
}

export default function GapQuestionsPanel({ questions, issues, onSubmit }: GapQuestionsPanelProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({});

  if (!questions || questions.length === 0) return null;

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCustomTextChange = (questionIndex: number, text: string) => {
    setCustomTexts(prev => ({ ...prev, [questionIndex]: text }));
  };

  const handleSubmit = () => {
    // Format answers for API submission
    const formattedAnswers = questions.map((question, index) => {
      const answer = answers[index];
      const isOtherOption = answer?.toLowerCase().includes('other') || answer?.toLowerCase().includes('specify');
      const finalAnswer = isOtherOption && customTexts[index] ? customTexts[index] : answer;

      return {
        question: question.question,
        answer: finalAnswer,
        period: question.period,
        properties_involved: question.properties_involved,
      };
    });

    console.log('Submitting gap answers:', formattedAnswers);

    // Call parent callback if provided
    if (onSubmit) {
      onSubmit(formattedAnswers);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getDurationText = (days: number) => {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    if (years > 0 && months > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Questions to Answer
        </h2>
      </div>

      {questions.map((question, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
        >
          {/* Question Header */}
          <div className="mb-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Timeline Gap Clarification
                </h3>

                {/* Period Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(question.period.start)} → {formatDate(question.period.end)}</span>
                  </div>
                  <div className="text-amber-600 dark:text-amber-400 font-medium">
                    {question.period.days} days ({getDurationText(question.period.days)})
                  </div>
                </div>

                {/* Properties Involved */}
                {question.properties_involved && question.properties_involved.length > 0 && (
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Affected Property: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {question.properties_involved.join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {question.question}
                </p>
              </div>
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-2">
            {question.possible_answers.map((answer, answerIndex) => {
              const isOtherOption = answer.toLowerCase().includes('other') || answer.toLowerCase().includes('specify');
              const isSelected = answers[index] === answer;

              return (
                <div key={answerIndex}>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }`}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={answer}
                      checked={isSelected}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                      {answer}
                    </span>
                  </label>

                  {/* Custom Text Input for "Other" option */}
                  {isOtherOption && isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 ml-8"
                    >
                      <input
                        type="text"
                        placeholder="Please specify..."
                        value={customTexts[index] || ''}
                        onChange={(e) => handleCustomTextChange(index, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length !== questions.length}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          Submit Answers & Retry Analysis
        </button>
      </div>
    </div>
  );
}
