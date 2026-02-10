/**
 * Formatting utilities for currency, numbers, dates, etc.
 */

/**
 * Format a number as German currency (EUR)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as German currency with cents
 */
export function formatCurrencyWithCents(value: number | null | undefined): string {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with German locale
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '–';
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Format a date in German locale
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '–';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a date with time in German locale
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '–';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format square meters
 */
export function formatArea(value: number | null | undefined): string {
  if (value == null) return '–';
  return `${formatNumber(value, 1)} m²`;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Format a date in long German format for formal letters
 * e.g. "Hamburg, 10. Februar 2026"
 */
export function formatDateLong(value: string | Date | null | undefined, city?: string): string {
  if (!value) return '–';
  const date = typeof value === 'string' ? new Date(value) : value;
  const formatted = new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return city ? `${city}, ${formatted}` : formatted;
}
