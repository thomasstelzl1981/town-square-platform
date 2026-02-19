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
