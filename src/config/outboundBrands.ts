/**
 * Outbound Brand Configuration (FROZEN SYSTEM RULE)
 * 
 * Defines which brand identities are available for outbound emails,
 * mapped to user roles. Every outbound email from Zone 2 uses the
 * user's active outbound identity from their profile.
 */

export interface OutboundBrand {
  brand_key: string;
  label: string;
  domain: string;
  /** Template: replaces {first}.{last} with user's name */
  default_from_template: string;
}

export const OUTBOUND_BRANDS: OutboundBrand[] = [
  {
    brand_key: 'SOT',
    label: 'System of a Town',
    domain: 'systemofatown.com',
    default_from_template: '{first}.{last}@systemofatown.com',
  },
  {
    brand_key: 'KAUFY',
    label: 'Kaufy',
    domain: 'kaufi.de',
    default_from_template: '{first}.{last}@kaufi.de',
  },
  {
    brand_key: 'ACQUIARY',
    label: 'Acquiary',
    domain: 'acquiary.com',
    default_from_template: '{first}.{last}@acquiary.com',
  },
  {
    brand_key: 'FUTUREROOM',
    label: 'FutureRoom',
    domain: 'futureroom.de',
    default_from_template: '{first}.{last}@futureroom.de',
  },
];

/**
 * Maps app_role / org_role to allowed brand_keys.
 * A user with multiple roles sees the union of all allowed brands.
 * 'user' is the fallback role that every authenticated user has.
 */
export const ROLE_TO_ALLOWED_BRANDS: Record<string, string[]> = {
  user: ['SOT'],
  admin: ['SOT', 'KAUFY', 'ACQUIARY', 'FUTUREROOM'],
  sales_partner: ['SOT', 'KAUFY'],
  akquise_manager: ['SOT', 'ACQUIARY'],
  finance_manager: ['SOT', 'FUTUREROOM'],
};

/** Default brand assigned during auto-provisioning */
export const ROLE_TO_DEFAULT_BRAND: Record<string, string> = {
  user: 'SOT',
  admin: 'SOT',
  sales_partner: 'KAUFY',
  akquise_manager: 'ACQUIARY',
  finance_manager: 'FUTUREROOM',
};

/** Get the brand config object by key */
export function getBrandByKey(brandKey: string): OutboundBrand | undefined {
  return OUTBOUND_BRANDS.find(b => b.brand_key === brandKey);
}

/** Compute allowed brands for a set of roles */
export function getAllowedBrands(roles: string[]): OutboundBrand[] {
  const allowedKeys = new Set<string>();
  // Every user gets at least 'user' role brands
  (ROLE_TO_ALLOWED_BRANDS['user'] || []).forEach(k => allowedKeys.add(k));
  for (const role of roles) {
    const keys = ROLE_TO_ALLOWED_BRANDS[role];
    if (keys) keys.forEach(k => allowedKeys.add(k));
  }
  return OUTBOUND_BRANDS.filter(b => allowedKeys.has(b.brand_key));
}

/** Get default brand key for a set of roles (first special role wins) */
export function getDefaultBrandKey(roles: string[]): string {
  // Priority: special roles first, then fallback to 'user'
  for (const role of roles) {
    if (role !== 'user' && ROLE_TO_DEFAULT_BRAND[role]) {
      return ROLE_TO_DEFAULT_BRAND[role];
    }
  }
  return ROLE_TO_DEFAULT_BRAND['user'] || 'SOT';
}

/** Generate default from_email from brand template and user name */
export function generateFromEmail(brandKey: string, firstName: string, lastName: string): string {
  const brand = getBrandByKey(brandKey);
  if (!brand) return `noreply@systemofatown.com`;
  const first = (firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = (lastName || 'portal').toLowerCase().replace(/[^a-z0-9]/g, '');
  return brand.default_from_template
    .replace('{first}', first)
    .replace('{last}', last);
}
