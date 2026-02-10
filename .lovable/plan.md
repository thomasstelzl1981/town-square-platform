
# MOD-14 Serien-E-Mail (Outbound-Light) — Implementierungsplan

## Zusammenfassung

Dieses Feature ersetzt die aktuelle Demo-SerienEmailsPage durch eine funktionale Outbound-Light-Loesung: Kampagnen erstellen, Empfaenger aus dem bestehenden `contacts`-System waehlen, personalisiert versenden via `sot-system-mail-send`, und Versandhistorie einsehen. Kein Inbox-Tracking, kein CRM, kein Follow-up.

---

## Architektur

```text
SerienEmailsPage (Dashboard)
  |
  +-- CampaignList (DB: mail_campaigns)
  |     - Name, Status, Created, Sent, Recipients Count
  |     - CTA: "Neue Serien-E-Mail"
  |
  +-- CampaignWizard (4 Steps)
        |
        Step 1: Empfaenger
        |  - Search/Multi-Select aus contacts (tenant_id + scope=zone2_tenant)
        |  - Kategorie/Tag-Filter (contacts.category + admin_contact_tags)
        |  - Dedupe by email, exclude null-email
        |
        Step 2: Inhalt
        |  - From: readonly (OutboundIdentity)
        |  - Subject + Body (Textarea/Markdown)
        |  - Platzhalter: {{first_name}}, {{last_name}}, {{company}}, {{city}}
        |  - Signatur-Toggle (aus Profil email_signature)
        |
        Step 3: Anhaenge
        |  - Upload via useUniversalUpload -> tenant-documents bucket
        |  - Referenz in mail_campaign_attachments
        |  - Max 5 Dateien, je 10MB
        |
        Step 4: Review & Send
           - Preview (erste 3 Empfaenger personalisiert)
           - Warnhinweis: Replies in persoenliches Postfach
           - "Jetzt senden" Button
           - Ruft Edge Function sot-serien-email-send auf
```

---

## Schritt 1: Datenbank-Migration

### Neue Tabellen

**mail_campaigns**
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| user_id | uuid FK auth.users | Ersteller |
| org_id | uuid | Tenant |
| name | text | Kampagnenname |
| subject_template | text | Betreff mit Platzhaltern |
| body_template | text | Body mit Platzhaltern |
| include_signature | boolean | Signatur anhaengen? |
| status | text | draft / sending / sent / failed |
| recipients_count | int | Anzahl Empfaenger |
| sent_count | int | Erfolgreich gesendet |
| failed_count | int | Fehlgeschlagen |
| created_at | timestamptz | |
| sent_at | timestamptz | Versandzeitpunkt |

**mail_campaign_recipients**
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| campaign_id | uuid FK | |
| contact_id | uuid nullable | Referenz auf contacts |
| email | text | Zieladresse |
| first_name | text | Fuer Personalisierung |
| last_name | text | |
| company | text | |
| city | text | |
| delivery_status | text | queued / sent / bounced / failed |
| sent_at | timestamptz | |
| error | text nullable | Fehlermeldung |

**mail_campaign_attachments**
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| campaign_id | uuid FK | |
| storage_path | text | Pfad in tenant-documents |
| filename | text | Originaldateiname |
| mime_type | text | |
| size_bytes | int | |
| created_at | timestamptz | |

### RLS-Policies

Alle drei Tabellen: User kann nur eigene Datensaetze sehen/erstellen/aendern (via `user_id` auf mail_campaigns, und campaign_id JOIN fuer Recipients/Attachments).

---

## Schritt 2: Edge Function — `sot-serien-email-send`

Dedizierte Edge Function fuer den Massenversand (getrennt von `sot-system-mail-send` um Throttling und Batch-Logik zu kapseln).

**Ablauf:**
1. Auth-Check
2. Lade Campaign + Recipients aus DB (status = draft)
3. Lade Outbound Identity des Users (via `get_active_outbound_identity`)
4. Lade Profil-Signatur (falls `include_signature = true`)
5. Fuer jeden Recipient:
   - Ersetze Platzhalter im Subject + Body
   - Haenge Signatur an (falls aktiviert)
   - Sende via Resend API (From = Outbound Identity)
   - Update recipient delivery_status
6. Update Campaign: status = sent, sent_at, sent_count, failed_count
7. Return Zusammenfassung

**Throttling:** Sequenziell mit kleiner Pause (kein paralleler Burst), ca. 2/Sekunde.

**Attachments:** Phase 1 — Attachments werden als Links im Body eingefuegt (signed URLs), NICHT als echte E-Mail-Attachments (Resend-Limit und Komplexitaet). In einer spaeteren Phase koennen echte Attachments via Resend hinzugefuegt werden.

---

## Schritt 3: Frontend-Implementierung

### 3a. SerienEmailsPage (Refactor)

Die bestehende Demo-Page wird ersetzt durch:
- **Kampagnenliste**: Tabelle aus `mail_campaigns` (Query via Supabase)
- **KPI-Cards**: Live-Daten statt Hardcoded (Anzahl Campaigns, Total Recipients, etc.)
- **CTA**: "Neue Serien-E-Mail" oeffnet den Wizard

### 3b. CampaignWizard (neues Component)

Neues Component `CampaignWizard.tsx` mit 4 Steps und Step-Navigation.

**Step 1 — Empfaenger:**
- Query `contacts` (WHERE tenant_id = user's org, scope = 'zone2_tenant', email IS NOT NULL, deleted_at IS NULL)
- Suchfeld fuer Name/Email/Company
- Kategorie-Filter (contacts.category)
- Tag-Filter (JOIN admin_contact_tags)
- Multi-Select mit Checkbox-Liste
- Badge: "X Empfaenger ausgewaehlt"
- Deduplizierung nach email

**Step 2 — Inhalt:**
- Read-only "Von": Display der Outbound Identity (Query `user_outbound_identities`)
- Subject Textfeld
- Body Textarea (einfacher Editor, kein Richtext in Phase 1)
- Platzhalter-Buttons: Klick fuegt `{{first_name}}` etc. ein
- Toggle "Signatur anhaengen" (laedt email_signature aus profiles)
- Live-Vorschau Panel

**Step 3 — Anhaenge:**
- FileUploader (bestehende Komponente)
- Max 5 Dateien, je 10MB, bevorzugt PDF
- Upload via `useUniversalUpload` in tenant-documents bucket
- Anzeige der hochgeladenen Dateien mit Loeschen-Option

**Step 4 — Review & Send:**
- Zusammenfassung: Empfaengeranzahl, Betreff, Body-Preview
- 3 personalisierte Vorschau-Cards (erste 3 Empfaenger)
- Warnhinweis-Box
- "Jetzt senden" Button: Speichert Campaign + Recipients in DB, ruft Edge Function auf

### 3c. Role-Gating

Die SerienEmailsPage prueft beim Laden, ob der User die Rolle `sales_partner` hat (Query auf `user_roles`). Falls nicht: Zugriff verweigert mit Info-Screen.

---

## Schritt 4: Dateien-Uebersicht

| Aktion | Datei | Beschreibung |
|--------|-------|-------------|
| DB | Migration | 3 Tabellen + RLS + Indizes |
| NEU | `supabase/functions/sot-serien-email-send/index.ts` | Batch-Versand Edge Function |
| REWRITE | `src/pages/portal/communication-pro/SerienEmailsPage.tsx` | Dashboard + Wizard |
| NEU | `src/components/portal/communication-pro/CampaignWizard.tsx` | 4-Step Wizard |
| NEU | `src/components/portal/communication-pro/RecipientSelector.tsx` | Empfaenger-Auswahl |
| NEU | `src/hooks/useMailCampaigns.ts` | CRUD Hooks fuer Campaigns |
| KEINE | `CommunicationProPage.tsx` | Route bleibt `serien-emails` — kein Manifest-Drift |

---

## Nicht enthalten (explizit ausgeschlossen)

- Reply-Tracking / Inbox-Handling
- E-Mail-Sequenzen / Follow-ups
- Scheduling ("Spaeter senden") — nur "Jetzt senden" in Phase 1
- Echte E-Mail-Attachments (Phase 1: Links im Body)
- Bounce-Webhook (dokumentiert als naechster Schritt, nicht implementiert)
- Richtext-Editor (Phase 1: Plaintext/Markdown Textarea)
- Neue Routen oder Manifest-Aenderungen

---

## Abnahmekriterien

1. Serien-E-Mail nur fuer `sales_partner` erreichbar (Role-Gate)
2. Kampagne erstellen mit Empfaenger-Auswahl aus contacts
3. Personalisierung mit Platzhaltern funktioniert
4. Versand ueber `sot-serien-email-send` loggt pro Empfaenger Status
5. Kampagnen-Dashboard zeigt Historie mit Status
6. Absender kommt aus Profil-Outbound (read-only im Wizard)
7. Attachments hochladbar und als Links referenziert
8. Keine neuen Routen, kein Manifest-Drift
