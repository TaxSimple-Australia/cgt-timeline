'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileSearch,
  Calculator,
  BookOpen,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const analysisSteps = [
  {
    icon: FileSearch,
    title: 'Loading Property Data',
    description: 'Gathering property information and transaction history',
    duration: 8000,
  },
  {
    icon: BookOpen,
    title: 'Checking CGT Regulations',
    description: 'Reviewing Australian tax law and eligibility criteria',
    duration: 10000,
  },
  {
    icon: Calculator,
    title: 'Retrieving Applicable Laws',
    description: 'Searching relevant tax legislation and precedents',
    duration: 10000,
  },
  {
    icon: Lightbulb,
    title: 'Generating Recommendations',
    description: 'Creating personalized tax optimization insights',
    duration: 8000,
  },
];

export default function LoadingSpinner({
  message = 'CGT Brain is Analyzing your timeline... Please Wait',
}: LoadingSpinnerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // Update progress within each step
  useEffect(() => {
    const stepDuration = analysisSteps[currentStep].duration;
    const updateInterval = 50; // Update every 50ms for smooth animation
    const incrementPerUpdate = (100 / stepDuration) * updateInterval;

    setStepProgress(0); // Reset progress for new step

    const progressTimer = setInterval(() => {
      setStepProgress((prev) => {
        const newProgress = prev + incrementPerUpdate;
        if (newProgress >= 100) {
          return 100;
        }
        return newProgress;
      });
    }, updateInterval);

    // Move to next step when duration is complete
    const stepTimer = setTimeout(() => {
      if (currentStep < analysisSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
      // Stay on last step when we reach the end (don't loop)
    }, stepDuration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(stepTimer);
    };
  }, [currentStep]);

  // Calculate overall progress (caps at 95% to show activity until completion)
  useEffect(() => {
    const baseProgress = (currentStep / analysisSteps.length) * 100;
    const stepContribution = (stepProgress / 100) * (100 / analysisSteps.length);
    const calculated = Math.min(baseProgress + stepContribution, 95);
    setOverallProgress(calculated);
  }, [currentStep, stepProgress]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto">
      {/* Main spinner with icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative mb-8"
      >
        {/* Outer spinning circle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 dark:border-t-purple-400"
        />

        {/* Inner sparkle icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Main message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {message}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Our AI is working on your comprehensive analysis
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="w-full space-y-3">
        {analysisSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700'
                  : isCompleted
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-900/50'
                    : isCompleted
                    ? 'bg-green-100 dark:bg-green-900/50'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-semibold mb-1 ${
                    isActive || isCompleted
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-500'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-xs ${
                    isActive || isCompleted
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {/* Loading spinner for active step */}
              {isActive && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="flex-shrink-0"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full mt-6">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            style={{
              width: `${overallProgress}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </div>
  );
}
