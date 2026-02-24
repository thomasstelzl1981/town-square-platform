/**
 * contactSchema.ts — Zentrales Kontakt-Schema (Master)
 * Einheitliche Spalten-Definition für Recherche + Kontaktbuch
 * 
 * Kategorien werden aus der Engine importiert und für UI-Zwecke mit Farben angereichert.
 */

import { CATEGORY_REGISTRY, CATEGORY_GROUPS, type CategoryGroupCode } from '@/engines/marketDirectory/spec';

export const SALUTATION_OPTIONS = [
  { value: 'Herr', label: 'Herr' },
  { value: 'Frau', label: 'Frau' },
  { value: 'Divers', label: 'Divers' },
  { value: 'Firma', label: 'Firma' },
] as const;

/** Farb-Mapping je Kategorie-Gruppe */
const GROUP_COLORS: Record<CategoryGroupCode, string> = {
  FINANZ: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  PET: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  IMMOBILIEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ALLGEMEIN: 'bg-muted text-muted-foreground',
};

/** Alle Kategorien mit UI-Farben (abgeleitet aus Engine CATEGORY_REGISTRY) */
export const CATEGORY_OPTIONS = CATEGORY_REGISTRY.map(cat => ({
  value: cat.code,
  label: cat.label,
  group: cat.group,
  className: GROUP_COLORS[cat.group] || GROUP_COLORS.ALLGEMEIN,
}));

/** Re-Export der Gruppen für Filter-Dropdowns */
export { CATEGORY_GROUPS };

export const PERMISSION_OPTIONS = [
  { value: 'unknown', label: 'Unbekannt', className: 'bg-muted text-muted-foreground' },
  { value: 'opt_in', label: 'Opt-In', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'legitimate_interest', label: 'Berecht. Interesse', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'no_contact', label: 'Kein Kontakt', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'unsubscribed', label: 'Abgemeldet', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
] as const;

/** Master-Kontaktfelder — einheitliche Labels */
export const CONTACT_COLUMNS = {
  salutation: 'Anrede',
  first_name: 'Vorname',
  last_name: 'Nachname',
  company: 'Firma',
  category: 'Kategorie',
  email: 'E-Mail',
  phone_mobile: 'Mobil',
  phone: 'Telefon',
  street: 'Straße',
  postal_code: 'PLZ',
  city: 'Ort',
  permission_status: 'Permission',
  legal_basis: 'Rechtsgrundlage',
  do_not_contact: 'DNC',
  last_contacted_at: 'Letzter Kontakt',
} as const;

/** Recherche-Ergebnis-Spalten */
export const RESEARCH_COLUMNS = {
  salutation: 'Anrede',
  first_name: 'Vorname',
  last_name: 'Nachname',
  company_name: 'Firma',
  category: 'Kategorie',
  contact_person_role: 'Position',
  email: 'E-Mail',
  phone: 'Telefon',
  postal_code: 'PLZ',
  city: 'Stadt',
  website_url: 'Website',
  source_refs_json: 'Quelle',
  confidence_score: 'Score',
  validation_state: 'Status',
} as const;
