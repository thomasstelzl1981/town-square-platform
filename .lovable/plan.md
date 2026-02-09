
# MOD-03 DMS — Posteingang (Inbound PDF MVP)

## Zusammenfassung

Provider-agnostischer Inbound-Posteingang fuer PDF-Dokumente via E-Mail. Resend Receiving als MVP-Provider. Tenant-spezifische E-Mail-Adressen, Webhook-Empfang, PDF-Download aus Resend API, Ablage im Storage, Anzeige im DMS-Posteingang.

---

## Bestandsaufnahme

### Was existiert bereits:
- `inbound_items` Tabelle (generisch, fuer Admin-Inbox, RLS nur platform_admin) — wird NICHT wiederverwendet
- `PosteingangTab.tsx` liest aus `inbound_items` — wird komplett ersetzt
- `EinstellungenTab.tsx` hat hardcoded "Caya Post" Connector — muss neutralisiert werden
- `inbound_source` ENUM hat `'caya'` — muss um `'resend_receiving'` erweitert werden
- `RESEND_API_KEY` Secret ist bereits konfiguriert
- `sot-dms-upload-url` Edge Function existiert (Storage-Upload-Pattern)
- Route `/portal/dms/posteingang` existiert bereits in `DMSPage.tsx`

### Was fehlt:
- 3 neue DB-Tabellen: `inbound_mailboxes`, `inbound_emails`, `inbound_attachments`
- 1 neue Edge Function: `sot-inbound-receive` (Webhook-Empfang + Attachment-Processing)
- Komplett neues `PosteingangTab.tsx` UI
- "Deine Upload-E-Mail" Kachel in Stammdaten
- Caya-Referenzen entfernen

---

## Phase 1: Datenbank-Migration

### Neue Tabellen

**A) `inbound_mailboxes`** — Tenant-spezifische E-Mail-Adressen

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| tenant_id | uuid FK organizations | |
| address_local_part | text | z.B. org-slug |
| address_domain | text | inbound.systemofatown.com |
| provider | text | 'resend' |
| is_active | boolean | default true |
| created_at | timestamptz | |

Unique constraint auf `(address_local_part, address_domain)`.
RLS: Tenant-scoped SELECT + UPDATE.

**B) `inbound_emails`** — Metadaten pro empfangener E-Mail (kein Body)

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| tenant_id | uuid FK organizations | |
| mailbox_id | uuid FK inbound_mailboxes | |
| provider | text | 'resend' |
| provider_email_id | text | Resend Email ID |
| from_email | text | Absender |
| to_email | text | Empfaenger |
| subject | text | Betreff |
| received_at | timestamptz | |
| attachment_count | int | Gesamtanzahl Anhaenge |
| pdf_count | int | Nur PDFs |
| status | text | received/processing/ready/error |
| error_message | text nullable | |
| created_at | timestamptz | |

Unique constraint auf `provider_email_id` (Idempotenz).
RLS: Tenant-scoped SELECT.

**C) `inbound_attachments`** — Pro Anhang einer E-Mail

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| inbound_email_id | uuid FK inbound_emails | |
| tenant_id | uuid FK organizations | |
| filename | text | |
| mime_type | text | |
| size_bytes | int nullable | |
| is_pdf | boolean | |
| storage_path | text nullable | nach Upload |
| document_id | uuid nullable FK documents | nach Linking |
| created_at | timestamptz | |

RLS: Tenant-scoped SELECT.

### Auto-Provisioning

Trigger auf `organizations` INSERT: erstellt automatisch eine `inbound_mailboxes` Row mit `address_local_part = slug` und `address_domain = 'inbound.systemofatown.com'`.

Fuer bestehende Tenants: Migration fuehrt einmalig `INSERT ... SELECT` aus.

---

## Phase 2: Edge Function `sot-inbound-receive`

Dual-purpose Edge Function (kein separater Worker noetig fuer MVP):

### Endpoint 1: Webhook Receiver (POST, no auth)

```text
POST /sot-inbound-receive
Header: svix-id, svix-timestamp, svix-signature (Resend webhook signing)
Body: Resend webhook event payload
```

Flow:
1. Verify webhook signature (Resend uses Svix)
2. Parse `email.received` event
3. Extract `to` recipients, match gegen `inbound_mailboxes`
4. INSERT `inbound_emails` (status = 'received')
5. INSERT `inbound_attachments` (metadata only, is_pdf based on mime+extension)
6. Fuer jedes PDF-Attachment:
   - Download via Resend Attachments API (`RESEND_API_KEY`)
   - Upload in Storage: `tenant-documents/inbox/{tenantId}/{YYYY}/{MM}/{emailId}/{filename}`
   - INSERT `documents` record + `document_links` (object_type='inbound_email')
   - UPDATE `inbound_attachments` mit storage_path + document_id
7. Status = 'ready' (oder 'error' bei Fehlern)

### Endpoint 2: Mailbox Info (GET, auth required)

```text
GET /sot-inbound-receive?action=mailbox
Authorization: Bearer <token>
```

Gibt die Mailbox-Adresse des aktuellen Tenants zurueck.

### Sicherheit:
- Webhook: Svix-Signature-Verification oder IP-Allowlist
- GET: Standard Supabase Auth
- Edge Function mit `verify_jwt = false` (Webhook muss ohne Auth ankommen)

---

## Phase 3: UI — PosteingangTab komplett neu

### Header-Bereich:
- "Deine Upload-E-Mail" Card mit der Tenant-Adresse + Copy-Button
- Stats: Gesamt | Ausstehend | Fehler

### Tabelle `inbound_emails`:
- Spalten: Datum, Von, Betreff, PDFs (Anzahl), Status
- Status-Badges: received (gelb), processing (blau animate), ready (gruen), error (rot)
- Klick oeffnet Detail-Dialog

### Detail-Dialog:
- Metadaten: Von, An, Betreff, Empfangsdatum
- Liste der Attachments mit:
  - Dateiname, Groesse, PDF-Badge
  - Download-Button (via `sot-dms-download-url`)
  - Link zum Dokument im Storage

### Empty State:
- Mail-Icon + "Noch keine PDFs eingegangen"
- Zeigt die Upload-E-Mail-Adresse mit Copy-Button
- Hinweis: "Sende PDFs an diese Adresse. Anhaenge landen automatisch hier."

---

## Phase 4: Stammdaten — Upload-E-Mail Kachel

In `ProfilTab.tsx` (oder als eigene Section): Neue Card "Deine Upload-E-Mail":
- Laedt die Mailbox-Adresse via `inbound_mailboxes` Query
- Zeigt: `{local}@{domain}` mit Copy-to-Clipboard Button
- Hinweistext: "Sende PDFs an diese Adresse. Anhaenge landen automatisch im DMS-Posteingang und im Storage."

---

## Phase 5: Caya-Bereinigung

### Dateien die angepasst werden:

1. **`EinstellungenTab.tsx`**: "Caya Post" Connector durch "Posteingang (E-Mail)" ersetzen
2. **`src/pages/admin/Inbox.tsx`**: "Caya" Label durch "Post" oder neutral ersetzen
3. **`src/components/presentation/MermaidDiagram.tsx`**: "Caya" durch "Posteingang" ersetzen
4. **`src/types/document-schemas.ts`**: `DocumentSource` Type — `'caya'` bleibt als Legacy im Enum, aber UI-Labels werden neutral

Hinweis: Das DB-Enum `inbound_source` behaelt `'caya'` als Legacy-Wert, neue Records nutzen `'email'` oder `'resend_receiving'`.

---

## Technische Details

### Dateien (neu):
- `supabase/migrations/XXXX_inbound_pdf_mvp.sql` — 3 Tabellen, RLS, Trigger, Provisioning
- `supabase/functions/sot-inbound-receive/index.ts` — Webhook + Mailbox-Info

### Dateien (geaendert):
- `src/pages/portal/dms/PosteingangTab.tsx` — Komplett neu
- `src/pages/portal/dms/EinstellungenTab.tsx` — Caya entfernen
- `src/pages/portal/stammdaten/ProfilTab.tsx` — Upload-E-Mail Card hinzufuegen (oder eigene Section)
- `src/pages/admin/Inbox.tsx` — Caya-Labels neutralisieren
- `src/components/presentation/MermaidDiagram.tsx` — Caya-Referenz entfernen

### Reihenfolge:
1. DB-Migration (Tabellen + RLS + Auto-Provisioning)
2. Edge Function deployen
3. PosteingangTab UI
4. Stammdaten Upload-E-Mail Card
5. Caya-Bereinigung
6. E2E-Test via Edge Function curl

