
# Konsolidierung Zone 1 KI-Office: 3-Menuepunkte-Architektur

## Problem

Aktuell existieren **7 separate Menuepunkte** unter "KI Office" in Zone 1:
1. KI-Office (Dashboard)
2. E-Mail (3-Panel Thread-Client)
3. Sequenzen (Drip-Kampagnen)
4. Templates (E-Mail-Vorlagen)
5. Kontakte (CRM)
6. Recherche (Apollo/Firecrawl Lead-Suche)
7. Communication (Hub)

Diese sind funktional fragmentiert und teilweise redundant. Der Nutzer sieht 7 Menuepunkte fuer im Kern 2 Prozesse: **Kontakte finden** und **E-Mails senden**.

## Neue Architektur: 3 Menuepunkte

```text
KI Office (Zone 1)
├── 1. Recherche      → Kontakte finden + validieren
├── 2. Kontaktbuch    → Zentrale Kontaktdatenbank (CRM)
└── 3. E-Mail Agent   → Kampagnen erstellen, Templates, Versand, Outbox
```

### Was passiert mit den bisherigen 7 Seiten?

| Bisherige Seite | Neues Zuhause | Aenderung |
|---|---|---|
| Dashboard | **Entfaellt** | KPIs werden in die 3 Seiten integriert (je Seite eigene Metriken) |
| Recherche | **Recherche** (bleibt, wird aufgewertet) | SOAT-Engine mit Phasen-Tracking, Live-Fortschritt |
| Kontakte | **Kontaktbuch** (bleibt, wird erweitert) | Compliance-Felder (permission, legal_basis, unsubscribe) hinzufuegen |
| E-Mail | **E-Mail Agent** (wird Kern) | Thread-Ansicht bleibt als "Posteingang"-Tab |
| Sequenzen | **E-Mail Agent** | Wird Tab "Kampagnen" innerhalb E-Mail Agent |
| Templates | **E-Mail Agent** | Wird Tab "Templates" innerhalb E-Mail Agent |
| Communication | **Entfaellt** | War Redirect/Platzhalter, nicht mehr noetig |

---

## Detailplan

### Schritt 1: Routing konsolidieren

**routesManifest.ts** — 7 Routes werden zu 3:

```text
Vorher:
  ki-office           → Dashboard
  ki-office-email     → E-Mail
  ki-office-sequenzen → Sequenzen
  ki-office-templates → Templates
  ki-office-kontakte  → Kontakte
  ki-office-recherche → Recherche
  communication       → Hub

Nachher:
  ki-office/recherche  → Recherche (SOAT Search Engine)
  ki-office/kontakte   → Kontaktbuch
  ki-office/email      → E-Mail Agent (3 Tabs: Posteingang, Kampagnen, Templates)
```

Default-Route `/admin/ki-office` redirected auf `/admin/ki-office/recherche`.

### Schritt 2: E-Mail Agent — 3-Tab-Konsolidierung

Die neue Seite `AdminEmailAgent.tsx` vereint drei bisherige Seiten als Tabs:

**Tab 1: Posteingang** (bisheriges AdminKiOfficeEmail)
- 3-Panel Layout (Threads | Konversation | Kontakt-Panel)
- KI-Antwort-Assistent bleibt

**Tab 2: Kampagnen** (bisheriges AdminKiOfficeSequenzen)
- Sequenz-Builder mit Steps
- Enrollment-Verwaltung
- Versandplanung + Kalender
- Compliance-Guards (nur Versand an Kontakte mit permission)

**Tab 3: Templates** (bisheriges AdminKiOfficeTemplates)
- Template-CRUD
- Platzhalter-System
- Compliance-Footer (Pflichtfeld)
- Vorschau

### Schritt 3: Kontaktbuch erweitern

Die bestehende `AdminKiOfficeKontakte.tsx` wird zu `AdminKontaktbuch.tsx`:

- Bestehende CRUD-Funktionen bleiben
- **Neue Compliance-Spalten** auf `contacts` Tabelle:
  - `permission_status` (unknown / opt_in / legitimate_interest / no_contact / unsubscribed)
  - `legal_basis` (Text)
  - `unsubscribe_token` (Text)
  - `do_not_contact` (Boolean)
  - `last_contacted_at` (Timestamp)
- Filter nach Permission-Status
- Bulk-Import CTA (aus Recherche)
- Tags + Segmente bleiben

### Schritt 4: Recherche aufwerten (SOAT Engine)

Die bestehende `AdminKiOfficeRecherche.tsx` wird zu `AdminRecherche.tsx`:

- **Widget-Grid** oben (Auftraege als Kacheln)
- **Inline-Case** darunter (ausgewaehlter Auftrag)
- Live-Fortschrittsbalken mit Phasen (Strategy → Discovery → Crawl → Extract → Validate)
- Ergebnis-Tabelle mit Inline-Actions (validieren, suppress, importieren)
- Bulk-Import ins Kontaktbuch
- **Neue DB-Tabellen**: `soat_search_orders`, `soat_search_results`

### Schritt 5: Sidebar + Navigation

**AdminSidebar.tsx** — Gruppe "KI Office" zeigt nur 3 Items:
- Recherche
- Kontaktbuch
- E-Mail Agent

### Schritt 6: DB-Migration

**Neue Tabellen:**
- `soat_search_orders` (Auftraege mit Phasen-Tracking)
- `soat_search_results` (Treffer/Kandidaten)

**Erweiterte Tabellen:**
- `contacts` + Compliance-Spalten (permission_status, legal_basis, unsubscribe_token, do_not_contact, last_contacted_at)

**Bestehende Tabellen bleiben:**
- `admin_email_sequences`, `admin_email_sequence_steps`, `admin_email_templates` (werden vom E-Mail Agent Tab genutzt)
- `admin_email_threads`, `admin_inbound_emails`, `admin_outbound_emails` (werden vom Posteingang Tab genutzt)
- `admin_research_jobs` (Legacy, wird durch soat_search_orders ersetzt)
- `contacts` (bleibt Kern-Tabelle)

### Schritt 7: Dateien loeschen / umbenennen

| Aktion | Datei |
|---|---|
| LOESCHEN | `AdminKiOfficeDashboard.tsx` (Dashboard entfaellt) |
| UMBENENNEN | `AdminKiOfficeRecherche.tsx` → `AdminRecherche.tsx` (aufgewertet) |
| UMBENENNEN | `AdminKiOfficeKontakte.tsx` → `AdminKontaktbuch.tsx` (erweitert) |
| NEU | `AdminEmailAgent.tsx` (vereint Email + Sequenzen + Templates als Tabs) |
| LOESCHEN | `AdminKiOfficeEmail.tsx` (Code wandert in EmailAgent Tab 1) |
| LOESCHEN | `AdminKiOfficeSequenzen.tsx` (Code wandert in EmailAgent Tab 2) |
| LOESCHEN | `AdminKiOfficeTemplates.tsx` (Code wandert in EmailAgent Tab 3) |

Die Komponenten unter `src/components/admin/ki-office/` (ThreadList, ConversationView, ContactPanel, AIReplyAssistant) bleiben erhalten — sie werden vom E-Mail Agent Posteingang-Tab importiert.

---

## Was sich NICHT aendert

- Edge Functions (`sot-research-engine`, `sot-research-firecrawl-extract`, `sot-admin-mail-send`) bleiben
- Hooks (`useAdminResearch`, `useAdminSequences`, `useAdminTemplates`, `useAdminEmailThreads`) bleiben (werden nur von neuen Seiten importiert)
- DB-Tabellen fuer E-Mail-System bleiben identisch
- Bestehende Kontakte-Daten bleiben erhalten

## Implementierungsreihenfolge

1. DB-Migration (Compliance-Spalten + SOAT-Tabellen)
2. Routing konsolidieren (3 Routes statt 7)
3. E-Mail Agent bauen (3-Tab Seite)
4. Kontaktbuch erweitern (Compliance-UI)
5. Recherche aufwerten (Widget-Grid + Progress)
6. Sidebar anpassen
7. Alte Dateien loeschen
8. ManifestRouter Imports bereinigen

## Technische Zusammenfassung

| Kategorie | Anzahl |
|---|---|
| Neue DB-Spalten (contacts) | 5 |
| Neue DB-Tabellen | 2 |
| Neue UI-Seiten | 1 (EmailAgent) |
| Umbenannte UI-Seiten | 2 |
| Geloeschte UI-Seiten | 4 |
| Routing-Aenderungen | 2 Dateien |
| Sidebar-Aenderung | 1 Datei |
