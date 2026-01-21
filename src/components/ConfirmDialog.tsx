'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      bgGradient: 'from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-100',
      confirmButton:
        'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white',
    },
    warning: {
      bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-100',
      confirmButton:
        'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white',
    },
    info: {
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-900 dark:text-blue-100',
      confirmButton:
        'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white',
    },
  };

  const styles = variantStyles[variant];
  const Icon = variant === 'danger' || variant === 'warning' ? AlertTriangle : CheckCircle;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className={`bg-gradient-to-r ${styles.bgGradient} px-6 py-4 border-b border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 ${styles.iconBg} rounded-lg`}>
                          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                        </div>
                        <div>
                          <Dialog.Title
                            className={`text-lg font-semibold ${styles.titleColor}`}
                          >
                            {title}
                          </Dialog.Title>
                        </div>
                      </div>
                      <Dialog.Close asChild>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="p-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      {cancelLabel}
                    </button>
                    <button
                      onClick={handleConfirm}
                      className={`flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium ${styles.confirmButton}`}
                    >
                      {confirmLabel}
                    </button>
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
