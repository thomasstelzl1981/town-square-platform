/**
 * R-8: Portfolio helpers — formatting and aggregation
 */
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
