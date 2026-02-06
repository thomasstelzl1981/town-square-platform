# MOD-02 — KI OFFICE (Communication & AI Workspace)

**Version:** 2.0  
**Status:** ACTIVE  
**Datum:** 2026-02-06  
**Zone:** 2 (User Portal)  
**Route-Prefix:** `/portal/office`  
**API-Range:** (Backbone: contacts, communication_events)

---

## 1. Executive Summary

MOD-02 "KI Office" ist der primäre Arbeitsbereich für Kommunikation und KI-gestützte Produktivität. Es kombiniert persönliche Mailboxen (IMAP/Gmail/Exchange), einen KI-gestützten Briefgenerator, Kontaktverwaltung und Kalender. Der Armstrong-Chatbot ist zentral in dieses Modul integriert.

**Kritische Trennung**: 
- **SYSTEMMAILS** (Resend): Transaktionale/Workflow-Mails (Status-Updates, Briefversand)
- **PERSONAL MAILBOXES** (IMAP): Tägliche Benutzerkommunikation

---

## 2. Route-Struktur (4-Tile-Pattern)

| # | Name | Route | Beschreibung |
|---|------|-------|--------------|
| 0 | How It Works | `/portal/office` | Landingpage mit Erklärung |
| 1 | E-Mail | `/portal/office/email` | Persönliche Mailbox (IMAP/Gmail/Exchange) |
| 2 | Brief | `/portal/office/brief` | KI-Briefgenerator (AI-assisted drafts) |
| 3 | Kontakte | `/portal/office/kontakte` | Master-Kontakte des Tenants |
| 4 | Kalender | `/portal/office/kalender` | Termine, Erinnerungen |

---

## 3. Screen Specifications

### 3.1 Dashboard (`/portal/office`)

**Purpose**: Communication Hub, KI-Einstieg

**Layout**: 
- Hauptbereich: Widgets
- Rechte Seite: Armstrong KI-Stripe (global)

**Widgets (MVP)**:
- Ungelesene Mails (Count + Preview)
- Neue Kontakte (letzte 7 Tage)
- Anstehende Termine (heute + morgen)
- Quick Actions: Neuer Brief, Neuer Kontakt, Neuen Termin anlegen
- Armstrong Suggestions (kontextbasierte Vorschläge)

### 3.2 Email (`/portal/office/email`)

**Purpose**: Persönliche Mailbox-Verwaltung

**WICHTIG**: Dies ist NICHT Systemmail. Hier werden persönliche Mailboxen (IMAP/Gmail/Exchange) angebunden.

**Layout**: 3-Panel (Ordner | Liste | Detail)

**Features (MVP)**:
- Ordner-Navigation (Inbox, Sent, Drafts, Archive, Custom)
- Mail-Liste mit Suche und Filtern
- Mail lesen (HTML-Render)
- Mail schreiben (mit Armstrong-Unterstützung)
- Reply / Forward
- "Archivieren zu DMS" → Explizite Aktion, kopiert Mail als Dokument nach MOD-03

**Connector-Setup** (in Settings oder hier):
- IMAP-Konfiguration (Server, Port, User, Password)
- Gmail OAuth
- Microsoft Exchange/Outlook OAuth

**Datenmodell**:
| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `mail_accounts` | NEU | Connector-Instanzen pro User |
| `mail_sync_status` | NEU | Sync-Status, letzte Sync-Zeit |

**Sync-Architektur**:
- Worker (Background) synchronisiert Mails periodisch
- Mails werden NICHT vollständig in DB gespeichert (nur Metadaten für Suche)
- Inhalte werden on-demand vom Provider geladen

### 3.3 Brief (`/portal/office/brief`)

**Purpose**: KI-gestützter Briefgenerator

**Workflow (BINDING - aus Memory)**:
1. **Empfänger auswählen** → Kontakt(e) aus `contacts`
2. **Intent/Prompt** → Benutzer beschreibt Zweck an Armstrong
3. **AI Draft Generation** → Armstrong generiert CI-konformen Entwurf
4. **Benutzer-Edit** → WYSIWYG Editor
5. **PDF Generation** → CI-Template mit Absender-Identität (MOD-01)
6. **Versand** → Systemmail (Resend), Fax (SimpleFax), oder Post (Briefdienst)

**UI-Flow**:
```
[Kontakt wählen] → [Prompt eingeben] → [Draft prüfen/bearbeiten] 
    → [PDF Preview] → [Kanal wählen] → [Senden + Bestätigen]
```

**Features**:
- Kontakt-Picker (Multi-Select für Serienbriefe)
- Prompt-Input mit Whisperflow (Voice-to-Text)
- Draft-Editor (Rich Text)
- PDF-Preview
- Kanal-Auswahl: Email (Resend), Fax, Post
- Versand-Bestätigung (Confirmation-First Policy)
- Optional: "Als Dokument archivieren" → MOD-03

**Datenmodell**:
| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `letter_drafts` | NEU | Entwürfe mit Status |
| `letter_sent` | NEU | Versendete Briefe (Audit) |

**Outbound-Kanäle**:
| Kanal | Integration | Status |
|-------|-------------|--------|
| Email | Resend (Systemmail) | Phase 1 |
| Fax | SimpleFax | Phase 2 |
| Post | Briefdienst | Phase 2 |

### 3.4 Kontakte (`/portal/office/kontakte`)

**Purpose**: Master-Kontaktverwaltung für den Tenant

**WICHTIG**: `contacts` ist ein **Core/Backbone Object**, genutzt von mehreren Modulen (MOD-04, MOD-05, MOD-06, MOD-07, MOD-08).

**Layout**: Liste + Detail-Panel

**Features (MVP)**:
- Kontakt-Liste mit Suche, Filter (company, tags)
- Kontakt anlegen/bearbeiten
- Kontakt-Detail: Stammdaten, verknüpfte Objekte, Kommunikationshistorie
- Import (CSV) - Phase 2
- Merge Duplicates - Phase 2

**Datenquelle**: `contacts` (Core/Backbone)

**Erweiterungen für MOD-02**:
| Spalte | Status | Beschreibung |
|--------|--------|--------------|
| `tags` | NEU | Array für Kategorisierung |
| `source` | NEU | Herkunft (manual, import, lead, ...) |

### 3.5 Kalender (`/portal/office/kalender`)

**Purpose**: Termin- und Aufgabenverwaltung

**Features (MVP)**:
- Monats/Wochen/Tagesansicht
- Termin anlegen (Titel, Datum, Zeit, Beschreibung)
- Termin mit Kontakt verknüpfen
- Erinnerungen (in-app, email)
- Kalender-Sync: Google Calendar, Outlook (Phase 2)

**Datenmodell**:
| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `calendar_events` | NEU | Termine |
| `calendar_reminders` | NEU | Erinnerungen |

---

## 4. Armstrong Integration (BINDING)

### 4.1 Persona

- **Name**: Armstrong
- **Rolle**: KAUFY Advisor (polite, professional, action-oriented)
- **Fähigkeiten**: Internet-Zugang, Dokument-Analyse, Aktionsvorschläge

### 4.2 UI-Integration

- **KI-Stripe**: Globale rechte Seitenleiste (Collapsible)
- **Dropzone**: Drag & Drop für Dokumente (Armstrong analysiert)
- **Whisperflow**: Voice-to-Text in allen Eingabefeldern

### 4.3 Confirmation-First Policy (KRITISCH)

Armstrong darf NIEMALS automatisch:
- Senden (Mail, Brief, Fax)
- Löschen (Dokumente, Kontakte, Termine)
- Speichern mit externem Effekt
- Entities erstellen ohne Bestätigung

**Alle Mutationen erfordern explizite Benutzerbestätigung.**

### 4.4 Kontext-Awareness

Armstrong kennt:
- Aktuellen Tenant + User
- Aktive Route / Screen
- Ausgewählte Entities (Kontakt, Objekt, Dokument)
- Letzte Aktionen

---

### 4.5 Armstrong Document Tools (MOD-03 Integration)

Armstrong hat Zugriff auf DMS-Funktionen für Dokumentensuche und -analyse:

#### Tool: search_documents

| Aspekt | Beschreibung |
|--------|--------------|
| **Input** | `query` (text), `filters` (node_id, doc_type, date_range) |
| **Action** | `SELECT FROM document_chunks WHERE text @@ to_tsquery(?)` |
| **Output** | Liste von Dokumenten mit Snippet |
| **RLS** | Nur tenant-eigene Dokumente |

**Beispiel-Prompt**: "Finde den Mietvertrag für Hauptstr. 15"

#### Tool: get_document_content

| Aspekt | Beschreibung |
|--------|--------------|
| **Input** | `document_id` |
| **Action** | `SELECT text FROM document_chunks WHERE document_id=?` |
| **Output** | Volltext (alle Chunks konkateniert) |
| **Use Case** | Zusammenfassung, Analyse |

**Beispiel-Prompt**: "Was steht in diesem Dokument?"

#### Tool: summarize_document

| Aspekt | Beschreibung |
|--------|--------------|
| **Input** | `document_id` |
| **Action** | Load chunks → LLM Summarization |
| **Output** | Strukturierte Zusammenfassung |

**Beispiel-Prompt**: "Fasse das Dokument zusammen"

#### Tool: link_document (Confirmation-First!)

| Aspekt | Beschreibung |
|--------|--------------|
| **Input** | `document_id`, `target_type`, `target_id` |
| **Action** | User-Bestätigung → UPDATE document_links |
| **Output** | Bestätigungsmeldung |
| **KRITISCH** | Erfordert explizite User-Bestätigung! |

**Beispiel-Prompt**: "Ordne dieses Dokument der Immobilie zu"

#### Voraussetzungen für Document Tools

- Dokument muss `extraction_status = 'done'` haben
- Chunks müssen in `document_chunks` existieren
- Nur Dokumente des aktuellen Tenants

#### UI-Integration

- Armstrong-Stripe zeigt "Dokumentsuche" als Fähigkeit
- Drag & Drop Dokument auf Armstrong → Analyse starten
- Armstrong kann Dokumente vorschlagen für Sortierung

---

### 4.6 Kontext-Awareness (Details)

Armstrong kennt:
- Aktuellen Tenant + User
- Aktive Route / Screen
- Ausgewählte Entities (Kontakt, Objekt, Dokument)
- Letzte Aktionen

---

## 5. Communication Events (Backbone)

### 5.1 Tabelle: `communication_events`

Zentrale Tabelle für alle Kommunikations-Ereignisse (Audit + History).

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| tenant_id | uuid | FK organizations |
| channel | enum | email_personal, email_system, fax, post, sms |
| direction | enum | inbound, outbound |
| contact_id | uuid | FK contacts (nullable) |
| subject | text | Betreff |
| body_preview | text | Erste 500 Zeichen |
| status | enum | sent, delivered, failed, opened |
| metadata | jsonb | Provider-spezifische Daten |
| created_at | timestamptz | |

### 5.2 Owner-Frage

**Q2.5**: Gehört `communication_events` zu MOD-02 oder Backbone?

**Vorschlag**: Backbone (da Cross-Module-Nutzung wahrscheinlich)

---

## 6. API Contract

### Email
- `GET /ki-office/email/accounts` → Konfigurierte Mailboxen
- `POST /ki-office/email/accounts` → Mailbox hinzufügen
- `DELETE /ki-office/email/accounts/:id`
- `GET /ki-office/email/folders/:accountId`
- `GET /ki-office/email/messages` → query: folder, q, page
- `GET /ki-office/email/messages/:id`
- `POST /ki-office/email/messages/send`
- `POST /ki-office/email/messages/:id/archive-to-dms`

### Brief (Briefgenerator)
- `POST /ki-office/brief/draft` → { recipients[], prompt } => draft
- `PATCH /ki-office/brief/draft/:id` → Entwurf bearbeiten
- `POST /ki-office/brief/draft/:id/preview-pdf` → PDF generieren
- `POST /ki-office/brief/draft/:id/send` → { channel } + Confirmation
- `GET /ki-office/brief/sent` → Versendete Briefe

### Kontakte
- `GET /ki-office/contacts` → query: q, tags, page
- `GET /ki-office/contacts/:id`
- `POST /ki-office/contacts`
- `PATCH /ki-office/contacts/:id`
- `DELETE /ki-office/contacts/:id` (soft delete)

### Kalender
- `GET /ki-office/calendar/events` → query: start, end
- `GET /ki-office/calendar/events/:id`
- `POST /ki-office/calendar/events`
- `PATCH /ki-office/calendar/events/:id`
- `DELETE /ki-office/calendar/events/:id`

---

## 7. Berechtigungen (RLS)

| Aktion | Berechtigung |
|--------|--------------|
| Eigene Mailbox | Self (User-scoped) |
| Kontakte CRUD | Tenant Members |
| Briefe erstellen | Tenant Members |
| Kalender | Tenant Members (eigene Events) |

---

## 8. Cross-Module Dependencies

| Modul | Abhängigkeit |
|-------|--------------|
| MOD-01 | Absender-Identität für Briefe (Profil, Firma) |
| MOD-03 | "Archivieren zu DMS" Action |
| MOD-04 Immobilien | `contacts` als Backbone-Object |
| MOD-05 MSV | Kommunikation mit Mietern |
| MOD-06 Verkauf | Korrespondenz mit Interessenten |
| MOD-07 Finanzierung | Dokumente für Finance Packages |
| MOD-08 Investment-Suche | Notizen zu Favoriten |
| MOD-09 Vertriebspartner | Partner-Kommunikation |
| MOD-10 Leadgenerierung | Lead-Ansprache |
| Zone 1 | `integration_registry` für Mail-Connector-Definitionen |

---

## 9. Integration Registry (Zone 1)

Benötigte Einträge in `integration_registry`:

| Code | Type | Beschreibung |
|------|------|--------------|
| `RESEND` | integration | Systemmail-Versand |
| `GMAIL_OAUTH` | connector | Personal Mailbox |
| `OUTLOOK_OAUTH` | connector | Personal Mailbox |
| `IMAP_GENERIC` | connector | Personal Mailbox |
| `SIMPLEFAX` | integration | Fax-Versand (Phase 2) |
| `BRIEFDIENST` | integration | Post-Versand (Phase 2) |

---

## 10. MVP Acceptance Criteria

- [ ] AC1: Dashboard zeigt Mail-Count + Termine
- [ ] AC2: Armstrong-Stripe ist sichtbar und responsive
- [ ] AC3: Kontakte CRUD funktioniert
- [ ] AC4: Briefgenerator: Draft → Edit → PDF Preview
- [ ] AC5: Brief-Versand via Resend (Systemmail)
- [ ] AC6: Kalender: Events anlegen + anzeigen
- [ ] AC7: Personal Mailbox: Mindestens 1 Connector funktioniert
- [ ] AC8: Confirmation-First für alle Send-Aktionen

---

## 11. Open Questions

Siehe `ZONE2_OPEN_QUESTIONS.md` → Q2.x
