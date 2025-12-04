/**
 * Formatting utilities for displaying calculation data
 * These functions only format existing data - they do not generate or calculate anything
 */

/**
 * Format a number as Australian currency
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(
  percent: number | null | undefined,
  decimals: number = 2
): string {
  if (percent === null || percent === undefined) {
    return 'N/A';
  }

  return `${percent.toFixed(decimals)}%`;
}

/**
 * Format day count
 */
export function formatDays(days: number | null | undefined): string {
  if (days === null || days === undefined) {
    return 'N/A';
  }

  return `${days.toLocaleString('en-AU')} day${days === 1 ? '' : 's'}`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return 'N/A';
  }

  return num.toLocaleString('en-AU');
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  if (!startDate || !endDate) {
    return 'N/A';
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
}
