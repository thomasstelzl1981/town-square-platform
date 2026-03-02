/**
 * BILLING CONSTANTS — Single Source of Truth für alle System-Service-Preise
 * KI-Aktionen kommen aus armstrongManifest.ts, hier nur Infrastruktur-Services.
 * 1 Credit = 0,25 EUR (25 Cent)
 */

export const CREDIT_VALUE_EUR = 0.25;

export type BillingCategory = 'documents' | 'communication' | 'banking' | 'storage' | 'ai';

export interface SystemPrice {
  code: string;
  label: string;
  credits: number | null;
  eur_cents: number | null;
  interval?: 'per_use' | 'monthly';
  category: BillingCategory;
}

export const SYSTEM_PRICES: SystemPrice[] = [
  // Dokumenten-Verarbeitung
  { code: 'pdf_extraction', label: 'PDF-Extraktion (Posteingang)', credits: 1, eur_cents: 25, interval: 'per_use', category: 'documents' },
  { code: 'storage_extraction', label: 'Storage-Extraktion', credits: 1, eur_cents: 25, interval: 'per_use', category: 'documents' },
  { code: 'nk_beleg_parse', label: 'NK-Beleg-Parsing', credits: 1, eur_cents: 25, interval: 'per_use', category: 'documents' },
  { code: 'invoice_parse', label: 'Rechnungs-Parsing', credits: 1, eur_cents: 25, interval: 'per_use', category: 'documents' },
  { code: 'auto_matching', label: 'Auto-Matching (Banktransaktionen)', credits: 2, eur_cents: 50, interval: 'per_use', category: 'documents' },
  { code: 'weg_abrechnung_parse', label: 'WEG-Abrechnung-Parsing', credits: 2, eur_cents: 50, interval: 'per_use', category: 'documents' },

  // KI-Services
  { code: 'mail_ai_assist', label: 'KI-Mail-Assistent', credits: 1, eur_cents: 25, interval: 'per_use', category: 'ai' },
  { code: 'content_engine', label: 'Content-Engine (Artikel)', credits: 2, eur_cents: 50, interval: 'per_use', category: 'ai' },
  { code: 'tlc_summary', label: 'KI-Zusammenfassung (TLC)', credits: 1, eur_cents: 25, interval: 'per_use', category: 'ai' },
  { code: 'finance_prepare', label: 'Finanzierungspaket-Aufbereitung', credits: 2, eur_cents: 50, interval: 'per_use', category: 'ai' },
  { code: 'ki_browser', label: 'KI-Browser / Research', credits: 3, eur_cents: 75, interval: 'per_use', category: 'ai' },
  { code: 'contact_enrichment', label: 'Kontakt-Anreicherung', credits: 1, eur_cents: 25, interval: 'per_use', category: 'ai' },
  { code: 'discovery_scheduler', label: 'Discovery Scheduler', credits: 1, eur_cents: 25, interval: 'per_use', category: 'ai' },

  // Kommunikation
  { code: 'fax_send', label: 'Fax-Versand', credits: 4, eur_cents: 100, interval: 'per_use', category: 'communication' },
  { code: 'letter_send', label: 'Brief-Versand', credits: 4, eur_cents: 100, interval: 'per_use', category: 'communication' },
  { code: 'phone_call', label: 'KI-Telefonat (pro Minute)', credits: 2, eur_cents: 50, interval: 'per_use', category: 'communication' },
  { code: 'phone_number', label: 'Telefonnummer Grundgebühr', credits: 15, eur_cents: 375, interval: 'monthly', category: 'communication' },

  // Konto-Services
  { code: 'bank_sync', label: 'Bank-Synchronisation (finAPI)', credits: 4, eur_cents: 100, interval: 'per_use', category: 'banking' },
  { code: 'email_enrichment', label: 'E-Mail-Anreicherung', credits: 20, eur_cents: 500, interval: 'monthly', category: 'banking' },

  // Speicher
  { code: 'storage_free', label: 'DMS Storage Free (1 GB)', credits: null, eur_cents: 0, interval: 'monthly', category: 'storage' },
  { code: 'storage_pro', label: 'DMS Storage Pro (10 GB)', credits: null, eur_cents: 990, interval: 'monthly', category: 'storage' },
];

export const BILLING_CATEGORIES: Record<BillingCategory, { label: string; icon: string }> = {
  documents: { label: 'Dokumenten-Verarbeitung', icon: '📄' },
  ai: { label: 'KI-Services', icon: '🤖' },
  communication: { label: 'Kommunikation', icon: '📬' },
  banking: { label: 'Konto-Services', icon: '🏦' },
  storage: { label: 'Speicher', icon: '💾' },
};

export function creditsToEur(credits: number): number {
  return credits * CREDIT_VALUE_EUR;
}

export function formatEurCents(cents: number | null): string {
  if (cents === null || cents === 0) return 'Kostenlos';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Lookup a service price by its code. Returns undefined if not found. */
export function getServicePrice(code: string): SystemPrice | undefined {
  return SYSTEM_PRICES.find(p => p.code === code);
}

/** Get human-readable label for a ref_type/action_code. Falls back to the code itself. */
export function getServiceLabel(code: string): string {
  return getServicePrice(code)?.label ?? code;
}

/* ─── Credit Top-Up Packages ─── */
export interface CreditPackage {
  code: string;
  label: string;
  credits: number;
  price_eur_cents: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { code: 'starter',  label: 'Starter',  credits: 50,  price_eur_cents: 1250 },
  { code: 'standard', label: 'Standard', credits: 100, price_eur_cents: 2500, popular: true },
  { code: 'power',    label: 'Power',    credits: 500, price_eur_cents: 12500 },
];

/* ─── Low Balance Threshold ─── */
export const LOW_BALANCE_THRESHOLD = 10;
