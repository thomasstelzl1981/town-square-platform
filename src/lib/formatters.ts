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
