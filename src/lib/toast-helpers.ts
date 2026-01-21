import { toast } from 'sonner';

/**
 * Toast Helper Utilities
 * Consistent notification styling across the application
 */

export function showSuccess(message: string, description?: string) {
  return toast.success(message, {
    description,
  });
}

export function showError(message: string, description?: string) {
  return toast.error(message, {
    description,
  });
}

export function showWarning(message: string, description?: string) {
  return toast.warning(message, {
    description,
  });
}

export function showInfo(message: string, description?: string) {
  return toast.info(message, {
    description,
  });
}

/**
 * Show validation error with optional suggestion action
 */
export function showValidationError(
  message: string,
  options?: {
    suggestion?: {
      label: string;
      action: () => void;
    };
    description?: string;
  }
) {
  if (options?.suggestion) {
    return toast.error(message, {
      description: options.description,
      action: {
        label: options.suggestion.label,
        onClick: options.suggestion.action,
      },
    });
  }

  return toast.error(message, {
    description: options?.description,
  });
}

/**
 * Show a loading toast that can be updated
 * Returns the toast ID for updating
 */
export function showLoading(message: string) {
  return toast.loading(message);
}

/**
 * Update an existing toast (useful for loading states)
 */
export function updateToast(
  toastId: string | number,
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  description?: string
) {
  toast[type](message, {
    id: toastId,
    description,
  });
}

/**
 * Show promise-based toast (automatically handles loading/success/error states)
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) {
  return toast.promise(promise, messages);
}
