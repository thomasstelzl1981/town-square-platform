/**
 * Art. 17 DSGVO Antwortvorlagen — 3 Varianten: COMPLETED, PARTIAL, REJECTED
 */

export interface DeletionTemplatePlaceholders {
  name: string;
  requestDate: string;
  erasureScopeSummary?: string;
  executionDate?: string;
  erasedItemsSummary?: string;
  retainedItemsSummary?: string;
  legalHoldReason?: string;
  rejectionReason?: string;
  companyLegalName: string;
  address: string;
  contactEmail: string;
  phone: string;
}

// ─── Template 1: COMPLETED ───────────────────────────────────────────

const COMPLETED_SUBJECT = 'Bestätigung Ihres Löschantrags (Art. 17 DSGVO) — Anfrage vom [REQUEST_DATE]';

const COMPLETED_BODY = `Sehr geehrte/r [NAME],

wir bestätigen den Eingang Ihres Löschantrags nach Art. 17 DSGVO vom [REQUEST_DATE].

Nach erfolgreicher Identitätsprüfung haben wir die Löschung/Anonymisierung der zu Ihrer Person gespeicherten Daten im Rahmen der gesetzlichen Vorgaben durchgeführt.

**Umfang:**
- Gelöscht/Anonymisiert: [ERASURE_SCOPE_SUMMARY]
- Datum der Umsetzung: [EXECUTION_DATE]

Bitte beachten Sie: Sofern gesetzliche Aufbewahrungspflichten oder die Geltendmachung/Verteidigung von Rechtsansprüchen eine Aufbewahrung einzelner Daten erfordern, speichern wir diese Daten ausschließlich in dem hierfür erforderlichen Umfang und mit Zugriffsbeschränkungen.

Für Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen

[COMPANY_LEGAL_NAME]
[ADDRESS]
E-Mail: [CONTACT_EMAIL]
Telefon: [PHONE]`;

// ─── Template 2: PARTIAL ─────────────────────────────────────────────

const PARTIAL_SUBJECT = 'Teilweise Umsetzung Ihres Löschantrags (Art. 17 DSGVO) — Anfrage vom [REQUEST_DATE]';

const PARTIAL_BODY = `Sehr geehrte/r [NAME],

wir bestätigen den Eingang Ihres Löschantrags nach Art. 17 DSGVO vom [REQUEST_DATE].

Wir haben die Löschung/Anonymisierung Ihrer Daten soweit möglich umgesetzt. Einzelne Daten müssen wir jedoch aufgrund gesetzlicher Pflichten bzw. zur Wahrung/Verteidigung von Rechtsansprüchen weiterhin in eingeschränkter Form aufbewahren.

**Gelöscht/Anonymisiert:**
[ERASED_ITEMS_SUMMARY]

**Weiterhin aufbewahrt (eingeschränkt, minimiert):**
[RETAINED_ITEMS_SUMMARY]

**Begründung:**
[LEGAL_HOLD_REASON]

Wir löschen diese Daten, sobald die Aufbewahrungspflichten entfallen bzw. die Speicherung nicht mehr erforderlich ist.

Für Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen

[COMPANY_LEGAL_NAME]
[ADDRESS]
E-Mail: [CONTACT_EMAIL]
Telefon: [PHONE]`;

// ─── Template 3: REJECTED ────────────────────────────────────────────

const REJECTED_SUBJECT = 'Ihr Löschantrag (Art. 17 DSGVO) — Entscheidung';

const REJECTED_BODY = `Sehr geehrte/r [NAME],

wir haben Ihren Löschantrag nach Art. 17 DSGVO vom [REQUEST_DATE] geprüft.

Eine Umsetzung ist derzeit nicht möglich aus folgendem Grund:

[REJECTION_REASON]

Sofern Sie weitere Informationen zur Identitätsprüfung oder zur Einschränkung Ihres Antrags bereitstellen möchten, können Sie uns gerne kontaktieren.

Mit freundlichen Grüßen

[COMPANY_LEGAL_NAME]
[ADDRESS]
E-Mail: [CONTACT_EMAIL]
Telefon: [PHONE]`;

// ─── Render Function ─────────────────────────────────────────────────

export type DeletionResponseType = 'COMPLETED' | 'PARTIAL' | 'REJECTED';

export function renderDeletionResponse(
  type: DeletionResponseType,
  placeholders: DeletionTemplatePlaceholders
): { subject: string; body: string } {
  const templates: Record<DeletionResponseType, { subject: string; body: string }> = {
    COMPLETED: { subject: COMPLETED_SUBJECT, body: COMPLETED_BODY },
    PARTIAL: { subject: PARTIAL_SUBJECT, body: PARTIAL_BODY },
    REJECTED: { subject: REJECTED_SUBJECT, body: REJECTED_BODY },
  };

  const { subject: tplSubject, body: tplBody } = templates[type];

  const replacements: Record<string, string> = {
    '[NAME]': placeholders.name || 'Frau/Herr [Name]',
    '[REQUEST_DATE]': placeholders.requestDate || '—',
    '[ERASURE_SCOPE_SUMMARY]': placeholders.erasureScopeSummary || 'Alle zu Ihrer Person gespeicherten Daten',
    '[EXECUTION_DATE]': placeholders.executionDate || new Date().toLocaleDateString('de-DE'),
    '[ERASED_ITEMS_SUMMARY]': placeholders.erasedItemsSummary || '—',
    '[RETAINED_ITEMS_SUMMARY]': placeholders.retainedItemsSummary || '—',
    '[LEGAL_HOLD_REASON]': placeholders.legalHoldReason || '—',
    '[REJECTION_REASON]': placeholders.rejectionReason || 'Identität konnte nicht verifiziert werden.',
    '[COMPANY_LEGAL_NAME]': placeholders.companyLegalName || '—',
    '[ADDRESS]': placeholders.address || '—',
    '[CONTACT_EMAIL]': placeholders.contactEmail || '—',
    '[PHONE]': placeholders.phone || '—',
  };

  let subject = tplSubject;
  let body = tplBody;
  for (const [token, value] of Object.entries(replacements)) {
    subject = subject.replaceAll(token, value);
    body = body.replaceAll(token, value);
  }

  return { subject, body };
}
