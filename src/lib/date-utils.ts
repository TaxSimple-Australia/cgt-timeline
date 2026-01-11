import { parse, isValid, parseISO, format } from 'date-fns';

/**
 * Flexible date parsing that accepts multiple common formats
 * Prioritizes Australian date format (DD/MM/YYYY)
 */
export function parseDateFlexible(input: string): Date | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }

  // Check for compact formats (no separators) first
  // Only process if the input contains only digits
  if (/^\d+$/.test(trimmed)) {
    const digits = trimmed.length;

    // 8 digits: DDMMYYYY (e.g., 14032008 = 14/03/2008)
    if (digits === 8) {
      const day = parseInt(trimmed.substring(0, 2), 10);
      const month = parseInt(trimmed.substring(2, 4), 10);
      const year = parseInt(trimmed.substring(4, 8), 10);

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, day);
        if (isValid(date) && date.getDate() === day && date.getMonth() === month - 1) {
          return date;
        }
      }
    }

    // 6 digits: DDMMYY (e.g., 140308 = 14/03/2008)
    if (digits === 6) {
      const day = parseInt(trimmed.substring(0, 2), 10);
      const month = parseInt(trimmed.substring(2, 4), 10);
      const yearShort = parseInt(trimmed.substring(4, 6), 10);

      // Assume 20XX for 00-50, 19XX for 51-99
      const year = yearShort <= 50 ? 2000 + yearShort : 1900 + yearShort;

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, day);
        if (isValid(date) && date.getDate() === day && date.getMonth() === month - 1) {
          return date;
        }
      }
    }

    // 5 digits: DDMYY (e.g., 14308 = 14/3/08, single-digit month only)
    if (digits === 5) {
      const day = parseInt(trimmed.substring(0, 2), 10);
      const month = parseInt(trimmed.substring(2, 3), 10);
      const yearShort = parseInt(trimmed.substring(3, 5), 10);

      // Assume 20XX for 00-50, 19XX for 51-99
      const year = yearShort <= 50 ? 2000 + yearShort : 1900 + yearShort;

      if (day >= 1 && day <= 31 && month >= 1 && month <= 9) {
        const date = new Date(year, month - 1, day);
        if (isValid(date) && date.getDate() === day && date.getMonth() === month - 1) {
          return date;
        }
      }
    }
  }

  // Try common formats in order of preference (Australian formats first)
  const formats = [
    'dd/MM/yyyy',        // 15/01/2023 - Australian standard
    'd/M/yyyy',          // 15/1/2023 - Australian short
    'dd-MM-yyyy',        // 15-01-2023 - Alternative separator
    'd-M-yyyy',          // 15-1-2023 - Alternative short
    'd MMM yyyy',        // 15 Jan 2023 - Natural language
    'dd MMM yyyy',       // 15 Jan 2023 - Natural with padding
    'MMMM d, yyyy',      // January 15, 2023 - Formal
    'd MMMM yyyy',       // 15 January 2023 - Formal AU
    'yyyy-MM-dd',        // 2023-01-15 - ISO standard
    'dd/MM/yy',          // 15/01/23 - Two digit year
    'd/M/yy',            // 15/1/23 - Two digit year short
  ];

  for (const formatString of formats) {
    try {
      const parsed = parse(trimmed, formatString, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Continue to next format
      continue;
    }
  }

  // Try ISO string parsing as final fallback
  try {
    const parsed = parseISO(trimmed);
    if (isValid(parsed)) {
      return parsed;
    }
  } catch (e) {
    // No valid format found
  }

  return null;
}

/**
 * Validates a date and checks if it's within a reasonable range
 */
export function isValidDateRange(date: Date): { valid: boolean; error?: string } {
  if (!isValid(date)) {
    return { valid: false, error: 'Invalid date' };
  }

  const year = date.getFullYear();

  if (year < 1900) {
    return { valid: false, error: 'Year must be 1900 or later' };
  }

  if (year > 2100) {
    return { valid: false, error: 'Year must be 2100 or earlier' };
  }

  return { valid: true };
}

/**
 * Sanitizes and validates a date before sending to API
 * Returns YYYY-MM-DD format string or undefined if invalid
 */
export function sanitizeDateForAPI(date: Date | string | undefined): string | undefined {
  if (!date) {
    return undefined;
  }

  try {
    // Convert to Date object if string
    let dateObj: Date;

    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Try parsing if it's a string
      const parsed = parseDateFlexible(date);
      if (!parsed) {
        console.error('📍 Date sanitization: Unable to parse date string:', date);
        return undefined;
      }
      dateObj = parsed;
    } else {
      console.error('📍 Date sanitization: Invalid date type:', typeof date);
      return undefined;
    }

    // Validate the date
    if (!isValid(dateObj)) {
      console.error('📍 Date sanitization: Invalid date object:', date);
      return undefined;
    }

    // Check year range
    const validation = isValidDateRange(dateObj);
    if (!validation.valid) {
      console.warn('📍 Date sanitization: Date out of valid range:', validation.error, date);
      return undefined;
    }

    // Format as YYYY-MM-DD (API requirement)
    // Using toISOString and splitting to avoid timezone issues
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('📍 Date sanitization failed:', error, 'Input:', date);
    return undefined;
  }
}

/**
 * Formats a date for display in a user-friendly format
 */
export function formatDateDisplay(date: Date | string | undefined): string {
  if (!date) {
    return '';
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isValid(dateObj)) {
      return '';
    }
    return format(dateObj, 'EEEE, d MMMM yyyy'); // e.g., "Monday, 15 January 2023"
  } catch (e) {
    return '';
  }
}

/**
 * Check if two dates represent the same day (ignoring time)
 */
export function isSameDay(date1: Date | undefined, date2: Date | undefined): boolean {
  if (!date1 || !date2) {
    return false;
  }

  try {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (e) {
    return false;
  }
}

/**
 * Common date format examples for user guidance
 */
export const DATE_FORMAT_EXAMPLES = [
  '15/01/2023',
  '15012023',
  '15 Jan 2023',
  '2023-01-15',
];

export const DATE_FORMAT_PLACEHOLDER = 'e.g., 15/01/2023, 15012023, 15 Jan 2023, or 2023-01-15';
