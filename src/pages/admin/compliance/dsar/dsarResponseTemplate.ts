/**
 * Art. 15 DSGVO Antwortvorlage — Platzhalter werden zur Laufzeit ersetzt.
 */

export const DSAR_RESPONSE_SUBJECT = 'Auskunft nach Art. 15 DSGVO — Ihre Anfrage vom [REQUEST_DATE]';

export const DSAR_RESPONSE_TEMPLATE = `Sehr geehrte/r [NAME],

vielen Dank für Ihre Anfrage auf Auskunft nach Art. 15 DSGVO vom [REQUEST_DATE].

**1) Bestätigung der Verarbeitung**

Wir bestätigen, dass wir personenbezogene Daten zu Ihrer Person verarbeiten, soweit dies für die Bereitstellung unserer Leistungen, die Kommunikation sowie zur Erfüllung gesetzlicher Pflichten erforderlich ist.

**2) Zwecke der Verarbeitung**

Wir verarbeiten Ihre Daten insbesondere zu folgenden Zwecken:
- Bereitstellung und Betrieb unserer Website/Plattform
- Kommunikation und Support
- Durchführung vorvertraglicher Maßnahmen und/oder Vertragsabwicklung (sofern einschlägig)
- Sicherheit, Missbrauchsprävention und Fehleranalyse
- Erfüllung rechtlicher Verpflichtungen (z.B. handels-/steuerrechtliche Aufbewahrung), soweit anwendbar

**3) Kategorien verarbeiteter Daten**

Je nach Nutzung können dies u.a. sein:
- Stammdaten/Kontaktdaten (z.B. Name, E-Mail-Adresse)
- Nutzungs-/Protokolldaten (z.B. Login-Zeitpunkte, technische Logdaten)
- Vertrags-/Einwilligungsdaten (z.B. AGB-/Datenschutzbestätigungen, Consent-Einstellungen)
- Kommunikationsdaten (z.B. Support-Anfragen)
- Inhalts-/Dokumentmetadaten (sofern Sie Inhalte/Dokumente bereitgestellt haben)
- Weitere modulspezifische Daten, sofern Sie diese in der Plattform erfasst haben

**4) Empfänger / Kategorien von Empfängern**

Ihre Daten können an Dienstleister (Auftragsverarbeiter) übermittelt werden, die uns beim Betrieb unterstützen (z.B. Hosting, IT, E-Mail). Eine aktuelle Übersicht: [PROCESSOR_LIST_URL].

**5) Speicherdauer**

Wir speichern personenbezogene Daten nur solange, wie es für die Zwecke erforderlich ist und löschen sie anschließend, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

**6) Herkunft der Daten**

Soweit Daten nicht direkt von Ihnen bereitgestellt wurden, stammen sie aus Ihrem Nutzerkonto/organisatorischen Zuordnungen oder wurden technisch beim Betrieb erzeugt (Logdaten).

**7) Automatisierte Entscheidungen/Profiling**

Es findet keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne des Art. 22 DSGVO statt.

**8) Ihre Rechte**

Sie haben das Recht auf Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch nach Maßgabe der gesetzlichen Voraussetzungen. Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.

**9) Beschwerderecht**

Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren: [SUPERVISORY_AUTHORITY].

**10) Datenkopie**

Eine Kopie Ihrer personenbezogenen Daten wurde Ihnen [DELIVERY_METHOD] zur Verfügung gestellt.

Bitte beachten Sie: Aus Gründen des Schutzes Dritter können einzelne Inhalte geschwärzt oder ausgeschlossen sein, soweit Rechte und Freiheiten anderer Personen betroffen sind.

Für Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen

[COMPANY_LEGAL_NAME]
[ADDRESS]
E-Mail: [CONTACT_EMAIL]
Telefon: [PHONE]`;

export interface DSARTemplatePlaceholders {
  name: string;
  requestDate: string;
  processorListUrl: string;
  supervisoryAuthority: string;
  deliveryMethod: string;
  companyLegalName: string;
  address: string;
  contactEmail: string;
  phone: string;
}

export function renderDSARResponse(placeholders: DSARTemplatePlaceholders): { subject: string; body: string } {
  const replacements: Record<string, string> = {
    '[NAME]': placeholders.name || 'Frau/Herr [Name]',
    '[REQUEST_DATE]': placeholders.requestDate || '—',
    '[PROCESSOR_LIST_URL]': placeholders.processorListUrl || 'auf Anfrage verfügbar',
    '[SUPERVISORY_AUTHORITY]': placeholders.supervisoryAuthority || 'Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)',
    '[DELIVERY_METHOD]': placeholders.deliveryMethod || 'per E-Mail',
    '[COMPANY_LEGAL_NAME]': placeholders.companyLegalName || '—',
    '[ADDRESS]': placeholders.address || '—',
    '[CONTACT_EMAIL]': placeholders.contactEmail || '—',
    '[PHONE]': placeholders.phone || '—',
  };

  let subject = DSAR_RESPONSE_SUBJECT;
  let body = DSAR_RESPONSE_TEMPLATE;

  for (const [token, value] of Object.entries(replacements)) {
    subject = subject.replaceAll(token, value);
    body = body.replaceAll(token, value);
  }

  return { subject, body };
}
