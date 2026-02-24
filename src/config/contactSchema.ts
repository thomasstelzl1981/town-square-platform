/**
 * contactSchema.ts — Zentrales Kontakt-Schema (Master)
 * Einheitliche Spalten-Definition für Recherche + Kontaktbuch
 */

export const SALUTATION_OPTIONS = [
  { value: 'Herr', label: 'Herr' },
  { value: 'Frau', label: 'Frau' },
  { value: 'Divers', label: 'Divers' },
  { value: 'Firma', label: 'Firma' },
] as const;

export const CATEGORY_OPTIONS = [
  { value: 'Offen', label: 'Offen', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'Mieter', label: 'Mieter', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'Eigentümer', label: 'Eigentümer', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'Verwalter', label: 'Verwalter', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'Makler', label: 'Makler', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { value: 'Bank', label: 'Bank', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  { value: 'Handwerker', label: 'Handwerker', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'Partner', label: 'Partner', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  { value: 'Sonstige', label: 'Sonstige', className: 'bg-muted text-muted-foreground' },
] as const;

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
