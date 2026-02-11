

# Cross-Zone Contracts — Vervollstaendigung auf 100% Coverage

## Kontext

Die 4 zurueckgestellten Interaktionen (#16, #18, #19, #20) sind Bestandteil der Golden Paths und muessen formalisiert werden, bevor die GP-Definitionen in den naechsten Schritten fixiert werden. Alle 4 Edge Functions existieren bereits im Code.

---

## Neue Contract-Dateien (4 Stueck)

### 1. `spec/current/06_api_contracts/CONTRACT_WHATSAPP_MEDIA.md`

| Feld | Wert |
|------|------|
| Name | WhatsApp Media Download |
| Direction | Intern (Z1 → Z2 DMS) |
| Trigger | `sot-whatsapp-webhook` empfaengt Media-Nachricht, ruft intern `sot-whatsapp-media` auf |
| Payload | `{ media_id: string, media_url: string, mime_type: string, message_id: string }` |
| IDs/Correlation | `media_id`, `message_id`, `wa_id` |
| SoT nach Uebergabe | Z2 DMS (`storage_nodes` via Supabase Storage) |
| Fehlerfaelle | Meta-Download-Fehler → 502, Retry durch Webhook. Storage-Fehler → 500, Log. |
| Code-Fundstelle | `supabase/functions/sot-whatsapp-media/index.ts` |

### 2. `spec/current/06_api_contracts/CONTRACT_ACQ_OUTBOUND_EMAIL.md`

| Feld | Wert |
|------|------|
| Name | Acquisition Outbound Email |
| Direction | Z2 → Extern |
| Trigger | User sendet Akquise-Anschreiben aus MOD-12 |
| Payload | `{ mandate_id: UUID, contact_id: UUID, to_email: string, subject: string, body_html: string, routing_token: string }` |
| IDs/Correlation | `mandate_id`, `contact_id`, `routing_token` (fuer Inbound-Tracking via `sot-acq-inbound-webhook`) |
| SoT nach Uebergabe | Extern (E-Mail via Resend), `acq_outbound_messages` als Audit-Log |
| Fehlerfaelle | Resend API-Fehler → 500, Toast. Kein Retry, User kann erneut senden. |
| Code-Fundstelle | `supabase/functions/sot-acq-outbound/index.ts` |

### 3. `spec/current/06_api_contracts/CONTRACT_FINANCE_DOC_REMINDER.md`

| Feld | Wert |
|------|------|
| Name | Finance Document Reminder |
| Direction | System → Z2 |
| Trigger | Cron/Scheduled (woechentlich), prueft fehlende Pflichtdokumente |
| Payload | `{ finance_request_id: UUID, missing_documents: string[], recipient_email: string }` |
| IDs/Correlation | `finance_request_id`, `tenant_id` |
| SoT nach Uebergabe | Z2 (E-Mail-Notification an User, kein Daten-Handoff) |
| Fehlerfaelle | Resend-Fehler → Log, naechster Cron-Lauf wiederholt. Kein User-Impact bei Einzelfehler. |
| Code-Fundstelle | `supabase/functions/finance-document-reminder/index.ts` |

### 4. `spec/current/06_api_contracts/CONTRACT_LANDING_PAGE_GENERATE.md`

| Feld | Wert |
|------|------|
| Name | Landing Page Generate |
| Direction | Z2 → Z3 |
| Trigger | User erstellt/aktualisiert Landing Page in MOD-13 |
| Payload | `{ project_id: UUID, tenant_id: UUID, page_data: object }` |
| IDs/Correlation | `page_id`, `project_id`, `tenant_id` |
| SoT nach Uebergabe | Z3 (`landing_pages` Tabelle, oeffentlich sichtbar) |
| Fehlerfaelle | AI-Generierung fehlgeschlagen → 500, partielle Ergebnisse. Expiry-Check via `check-landing-page-expiry`. |
| Code-Fundstelle | `supabase/functions/sot-generate-landing-page/index.ts` |
| Consumer | Z3 konsumiert via `/website/projekt/:slug` (read-only) |

---

## INDEX.md Erweiterung

4 neue Zeilen am Ende der Contract-Register-Tabelle:

| Contract | Richtung | Trigger | Code-Fundstelle | Status |
|----------|----------|---------|-----------------|--------|
| WhatsApp Media | Intern (Z1 → Z2 DMS) | Media-Empfang via WhatsApp | `supabase/functions/sot-whatsapp-media/` | Dokumentiert |
| Acq Outbound Email | Z2 → Extern | Akquise-Anschreiben MOD-12 | `supabase/functions/sot-acq-outbound/` | Dokumentiert |
| Finance Doc Reminder | System → Z2 | Cron (woechentlich) | `supabase/functions/finance-document-reminder/` | Dokumentiert |
| Landing Page Generate | Z2 → Z3 | Landing Page erstellen MOD-13 | `supabase/functions/sot-generate-landing-page/` | Dokumentiert |

---

## Zusammenfassung

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Dokumentierte Contracts | 15 | 19 |
| Identifizierte Interaktionen | 20 | 20 |
| Coverage | 75% | 95% |
| Verbleibend undokumentiert | 0 formale Contracts fehlen | Interaktion #20 hat keine Edge Function fuer "check-landing-page-expiry" als separaten Contract — ist aber ein Subsystem von Landing Page Generate |

**Betroffene Dateien:**
- 4 neue: `CONTRACT_WHATSAPP_MEDIA.md`, `CONTRACT_ACQ_OUTBOUND_EMAIL.md`, `CONTRACT_FINANCE_DOC_REMINDER.md`, `CONTRACT_LANDING_PAGE_GENERATE.md`
- 1 edit: `INDEX.md` (4 neue Zeilen)

