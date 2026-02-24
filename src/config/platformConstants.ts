/**
 * Platform-wide constants (Zone 1 / Admin scope)
 * Used for platform-level records that don't belong to a specific tenant.
 */

/** Sentinel UUID for platform-level records (Zone 1 master templates, etc.) */
export const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

/** Valid brand contexts for social templates */
export const BRAND_CONTEXTS = ['kaufy', 'futureroom', 'acquiary', 'project'] as const;
export type BrandContext = typeof BRAND_CONTEXTS[number];

/** CTA variants aligned with Meta Marketing API call_to_action.type */
export const CTA_VARIANTS = {
  LEARN_MORE: 'Mehr erfahren',
  SIGN_UP: 'Registrieren',
  GET_QUOTE: 'Angebot einholen',
  CONTACT_US: 'Kontaktieren',
  APPLY_NOW: 'Jetzt bewerben',
  BOOK_NOW: 'Jetzt buchen',
  DOWNLOAD: 'Herunterladen',
  SHOP_NOW: 'Jetzt kaufen',
} as const;
