/**
 * Pure helper functions for Compliance Desk (no DB access).
 */

/** Generate a doc_key slug from type + brand */
export function makeDocKey(docType: string, brand?: string | null): string {
  return brand ? `${docType}_${brand}` : docType;
}

/** Validate version number is sequential */
export function isValidNextVersion(currentVersion: number, newVersion: number): boolean {
  return newVersion === currentVersion + 1;
}

/** Get DSAR due date (30 days from request per GDPR Art. 12) */
export function getDSARDueDate(requestDate: Date): Date {
  const due = new Date(requestDate);
  due.setDate(due.getDate() + 30);
  return due;
}

/** Format compliance status for display */
export function formatComplianceStatus(status: string): string {
  const map: Record<string, string> = {
    draft: 'Entwurf',
    active: 'Aktiv',
    deprecated: 'Veraltet',
    archived: 'Archiviert',
    open: 'Offen',
    verifying: 'Prüfung',
    in_progress: 'In Bearbeitung',
    delivered: 'Zugestellt',
    scheduled: 'Eingeplant',
    executed: 'Ausgeführt',
    closed: 'Geschlossen',
  };
  return map[status] || status;
}

/** Company profile shape for placeholder rendering */
export interface ComplianceCompanyProfile {
  company_name?: string;
  legal_form?: string | null;
  address_line1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  managing_directors?: unknown;
  commercial_register?: unknown;
  vat_id?: string | null;
  supervisory_authority?: string | null;
  website_url?: string | null;
}

/** Replace {placeholder} tokens in Markdown with company profile data */
export function renderComplianceMarkdown(
  contentMd: string,
  profile: ComplianceCompanyProfile | null
): string {
  if (!profile) return contentMd;

  const cr = (profile.commercial_register as Record<string, string>) || {};
  const directors = Array.isArray(profile.managing_directors)
    ? (profile.managing_directors as string[]).join(', ')
    : typeof profile.managing_directors === 'string'
      ? profile.managing_directors
      : '—';

  const replacements: Record<string, string> = {
    '{company_name}': profile.company_name || '—',
    '{legal_form}': profile.legal_form || '—',
    '{address_line1}': profile.address_line1 || '—',
    '{postal_code}': profile.postal_code || '—',
    '{city}': profile.city || '—',
    '{email}': profile.email || '—',
    '{phone}': profile.phone || '—',
    '{managing_directors}': directors,
    '{commercial_register.court}': cr.court || '—',
    '{commercial_register.number}': cr.number || '—',
    '{vat_id}': profile.vat_id || '—',
    '{supervisory_authority}': profile.supervisory_authority || '—',
    '{website_url}': profile.website_url || '—',
  };

  let result = contentMd;
  for (const [token, value] of Object.entries(replacements)) {
    result = result.replaceAll(token, value);
  }
  return result;
}
