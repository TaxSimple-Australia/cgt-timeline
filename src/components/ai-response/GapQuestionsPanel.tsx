'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Calendar, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timeline';

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
  question_id?: string; // ID from API for matching answers
  severity?: string;
}

interface GapQuestionsPanelProps {
  questions: GapQuestion[];
  issues?: any[];
  onSubmit?: (answers: Array<{
    question: string;
    answer: string;
    period: { start: string; end: string; days: number };
    properties_involved: string[];
    question_id?: string; // Include question_id for API matching
  }>) => void;
}

export default function GapQuestionsPanel({ questions, issues, onSubmit }: GapQuestionsPanelProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({});
  const [marketValues, setMarketValues] = useState<Record<number, string>>({});

  const { events, properties } = useTimelineStore();

  if (!questions || questions.length === 0) return null;

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCustomTextChange = (questionIndex: number, text: string) => {
    setCustomTexts(prev => ({ ...prev, [questionIndex]: text }));
  };

  const handleMarketValueChange = (questionIndex: number, value: string) => {
    // Only allow digits and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    setMarketValues(prev => ({ ...prev, [questionIndex]: sanitized }));
  };

  const isVacantForRent = (answer: string) => {
    const lower = answer.toLowerCase();
    return lower.includes('vacant') && lower.includes('available for rent') && !lower.includes('not available for rent');
  };

  // Check if a property already has market value on a rent_start event
  const propertyHasMarketValue = (propertyAddresses: string[]): boolean => {
    if (!propertyAddresses || propertyAddresses.length === 0) return false;

    // Find property IDs that match the addresses in the question
    const matchingPropertyIds = properties
      .filter(p => propertyAddresses.some(addr =>
        p.address?.toLowerCase() === addr.toLowerCase() ||
        addr.toLowerCase().includes(p.address?.toLowerCase() || '___')
      ))
      .map(p => p.id);

    return events.some(event =>
      event.type === 'rent_start' &&
      event.marketValuation &&
      event.marketValuation > 0 &&
      matchingPropertyIds.includes(event.propertyId)
    );
  };

  // For each question, determine if market value is required, optional, or not needed
  // Market value is required ONLY for the FIRST "vacant for rent" answer per property
  // (and only if the property doesn't already have a market value on a rent_start event)
  const getMarketValueRequirement = (questionIndex: number): 'required' | 'optional' | 'not_needed' => {
    const answer = answers[questionIndex];
    if (!answer || !isVacantForRent(answer)) return 'not_needed';

    const propertyAddresses = questions[questionIndex].properties_involved;

    // If property already has market value on a rent_start event, it's not needed
    if (propertyHasMarketValue(propertyAddresses)) return 'not_needed';

    // Check if any earlier question for the same property already selected "vacant for rent"
    for (let i = 0; i < questionIndex; i++) {
      const prevAnswer = answers[i];
      if (prevAnswer && isVacantForRent(prevAnswer)) {
        const prevProperties = questions[i].properties_involved;
        // Check if they share a property
        const sharesProperty = propertyAddresses.some(addr =>
          prevProperties.some(prevAddr =>
            addr.toLowerCase() === prevAddr.toLowerCase()
          )
        );
        if (sharesProperty) {
          return 'optional'; // A previous question already captured market value for this property
        }
      }
    }

    return 'required';
  };

  const handleSubmit = () => {
    // Format answers for API submission
    const formattedAnswers = questions.map((question, index) => {
      const answer = answers[index];
      const isOtherOption = answer?.toLowerCase().includes('other') || answer?.toLowerCase().includes('specify');
      let finalAnswer = isOtherOption && customTexts[index] ? customTexts[index] : answer;

      if (finalAnswer && isVacantForRent(finalAnswer) && marketValues[index]) {
        finalAnswer = `${finalAnswer}. Market value: $${marketValues[index]}`;
      }

      return {
        question: question.question,
        answer: finalAnswer,
        period: question.period,
        properties_involved: question.properties_involved,
        question_id: question.question_id, // Preserve the original question_id from API
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

  // Submit is disabled only if:
  // - Not all questions are answered
  // - Any question with "required" market value doesn't have one
  const isSubmitDisabled =
    Object.keys(answers).length !== questions.length ||
    questions.some((_, index) => getMarketValueRequirement(index) === 'required' && !marketValues[index]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Questions to Answer
        </h2>
      </div>

      {questions.map((question, index) => {
        const marketValueReq = answers[index] && isVacantForRent(answers[index])
          ? getMarketValueRequirement(index)
          : 'not_needed';

        return (
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

                    {/* Market Value Input for "Vacant - available for rent" option */}
                    {isSelected && isVacantForRent(answer) && marketValueReq !== 'not_needed' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 ml-8"
                      >
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Market value at first income-producing use
                          {marketValueReq === 'optional' && (
                            <span className="text-gray-400 dark:text-gray-500 ml-1">(optional — already provided for earlier period)</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="e.g. 650000"
                            value={marketValues[index] || ''}
                            onChange={(e) => handleMarketValueChange(index, e.target.value)}
                            className={`w-full pl-7 pr-3 py-2 text-sm border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              marketValueReq === 'required' && !marketValues[index]
                                ? 'border-amber-400 dark:border-amber-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          />
                        </div>
                        {marketValueReq === 'required' && !marketValues[index] && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Required for accurate CGT calculation
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Show "already provided" notice when market value exists on rent_start event */}
                    {isSelected && isVacantForRent(answer) && marketValueReq === 'not_needed' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 ml-8"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Market value already recorded on this property's rental start event</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          Submit Answers & Retry Analysis
        </button>
      </div>
    </div>
  );
}
