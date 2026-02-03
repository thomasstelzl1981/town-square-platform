# SYSTEM OF A TOWN — Comprehensive Analysis & Reporting Plan

**Version:** 1.1  
**Datum:** 2026-02-03  
**Zweck:** Strukturierter Plan zur vollständigen Soll-Ist-Analyse aller Module und Zonen

---

## 0. AUSGABEFORMAT (NEU)

### 0.1 Primäre Ausgabe: TXT-Block im Chat

Der vollständige Report wird **direkt im Chat als formatierter TXT-Block** ausgegeben:

```
============================================================
SYSTEM OF A TOWN - VOLLSTÄNDIGER SOLL-IST ANALYSE-REPORT
Datum: 2026-02-03
Stand: [Aktueller Git/Revert-Stand]
============================================================

[VOLLSTÄNDIGER REPORT-INHALT]

============================================================
ENDE DES REPORTS
============================================================
```

Dies ermöglicht direktes Kopieren und Weiterverarbeiten.

### 0.2 Sekundäre Ausgabe: Archivierung

Zusätzlich wird der Report als Datei gespeichert:
- `public/SYSTEM_ANALYSIS_REPORT_2026-02-03.txt`

### 0.3 Report-Struktur (TXT-Block)

```
============================================================
EXECUTIVE SUMMARY
============================================================
Gesamtstatus: [KRITISCH/EINGESCHRÄNKT/STABIL]
Zone 1: [X/Y] funktional
Zone 2 Core (MOD 01-12): [X/12] funktional
Zone 2 Extended (MOD 13-20): [X/8] stub-ready
Zone 3: [X/4] funktional

Kritische Blocker: [Anzahl]
Reparierbar: [JA/NEIN/TEILWEISE]

============================================================
SOLL-IST ABGLEICH: ZONE 1 (ADMIN)
============================================================

BEREICH: Dashboard (/admin)
------------------------------------------------------------
SOLL (aus docs/architecture/ZONE1_ADMIN_ROUTES.md):
  - Funktion: Plattform-KPIs, Quick Actions
  - Komponente: Dashboard.tsx
  - Abhängigkeiten: Keine

IST (aus Codebase):
  - Route vorhanden: [✅/❌]
  - Komponente existiert: [✅/❌]
  - UI funktional: [✅/❌]

STATUS: [COMPLETE/PARTIAL/BROKEN/MISSING]
DELTA: [Beschreibung der Abweichung]
------------------------------------------------------------

[... weitere Bereiche ...]

============================================================
SOLL-IST ABGLEICH: ZONE 2 - MOD-01 STAMMDATEN
============================================================

SOLL (aus docs/modules/MOD-01_STAMMDATEN.md):
------------------------------------------------------------
- Pfad: /portal/stammdaten
- Tiles: profil, firma, abrechnung, sicherheit
- Hauptfunktionen:
  • Persönliche Profildaten
  • Organisationsverwaltung
  • Abrechnungsübersicht
  • Sicherheitseinstellungen
- DB-Tabellen: profiles, organizations, memberships

IST (aus Codebase):
------------------------------------------------------------
- Route im Manifest: [✅/❌]
- Page-Komponente: [✅/❌] src/pages/portal/StammdatenPage.tsx
- Tab-Komponenten: 
  • ProfilTab: [✅/❌]
  • FirmaTab: [✅/❌]
  • AbrechnungTab: [✅/❌]
  • SicherheitTab: [✅/❌]
- Navigation funktional: [✅/❌]
- Daten sichtbar: [✅/❌]

DELTA-TABELLE:
------------------------------------------------------------
| Aspekt          | Soll  | Ist   | Status  |
|-----------------|-------|-------|---------|
| Route           | X     | X     | ✅      |
| Tile: profil    | X     | X     | ✅      |
| Tile: firma     | X     | X     | ✅      |
| Tile: abrechnung| X     | -     | ❌      |
| DB: profiles    | X     | X     | ✅      |

FEHLER & PROBLEME:
------------------------------------------------------------
1. [Konkreter Fehler]
2. [Konkreter Fehler]

HANDLUNGSEMPFEHLUNG: [FIX/OK/REVERT]
------------------------------------------------------------

[... MOD-02 bis MOD-20 analog ...]

============================================================
SOLL-IST ABGLEICH: ZONE 3 (WEBSITES)
============================================================

[... analog ...]

============================================================
ENTSCHEIDUNGSMATRIX
============================================================

| Modul  | Status   | Aufwand  | Empfehlung |
|--------|----------|----------|------------|
| MOD-01 | COMPLETE | -        | OK         |
| MOD-04 | BROKEN   | 2h       | FIX        |
| MOD-07 | MISSING  | 4h       | FIX        |
| ...    | ...      | ...      | ...        |

============================================================
FINALE EMPFEHLUNG
============================================================

[ ] Reparatur möglich (Aufwand: ~X Prompts)
[ ] Weiterer Revert empfohlen
[ ] Hybrid-Ansatz

============================================================
ENDE DES REPORTS
============================================================
```

---

## 1. REPORTING-STRATEGIE

### 1.1 Analyse-Dimensionen

Für jedes Modul werden folgende Dimensionen geprüft:

| Dimension | Beschreibung | Prüfmethode |
|-----------|--------------|-------------|
| **A. Manifest** | Route im routesManifest.ts vorhanden | Code-Review |
| **B. Tile Catalog** | Tile-Definition in tile_catalog.yaml | YAML-Abgleich |
| **C. Spec** | Dokumentation in docs/modules/MOD-XX_*.md | Datei-Existenz + Inhalt |
| **D. Page Component** | React-Komponente in src/pages/portal | Code-Existenz |
| **E. Tabs/Tiles** | Sub-Routes implementiert (4-Tile-Pattern) | Routing-Check |
| **F. Navigation** | Im PortalNav sichtbar | UI-Test |
| **G. Datenbank** | Tabellen gemäß Spec vorhanden | Schema-Query |
| **H. Edge Functions** | Backend-Logik implementiert | Funktions-Check |
| **I. UI-Funktionalität** | Grundlegende Interaktion möglich | Browser-Test |

### 1.2 SOLL-Quellen

| Bereich | Primäre SOLL-Quelle | Sekundäre Quelle |
|---------|---------------------|------------------|
| Zone 1 | docs/architecture/ZONE1_ADMIN_ROUTES.md | ACCESS_MATRIX.md |
| Zone 2 | docs/modules/MOD-XX_*.md | routesManifest.ts |
| Zone 3 | docs/zone3/*.md | ZONE3_MASTER_CONCEPT.md |
| Memory | <useful-context> | Frozen Decisions |

### 1.3 Bewertungsschema

| Status | Symbol | Bedeutung |
|--------|--------|-----------|
| **COMPLETE** | ✅ | Soll = Ist, voll funktional |
| **PARTIAL** | ⚠️ | Teilweise implementiert, Lücken |
| **STUB** | 📋 | Platzhalter vorhanden |
| **MISSING** | ❌ | Im Soll definiert, nicht im Ist |
| **BROKEN** | 🔴 | Implementiert aber fehlerhaft |
| **EXTRA** | ➕ | Im Ist, aber nicht im Soll |

### 1.4 Prioritätsstufen

| Priorität | Beschreibung |
|-----------|--------------|
| **P0** | Kritisch — Blockiert andere Module |
| **P1** | Hoch — Kernfunktionalität fehlt |
| **P2** | Mittel — Wichtig aber nicht blockierend |
| **P3** | Niedrig — Nice-to-have |

---

## 2. ZONE 1 — ADMIN PORTAL (25 Bereiche)

### 2.1 Zu prüfende Bereiche

| # | Bereich | Route | SOLL-Quelle |
|---|---------|-------|-------------|
| 1 | Dashboard | /admin | ZONE1_ADMIN_ROUTES.md |
| 2 | Organizations | /admin/organizations | ACCESS_MATRIX.md |
| 3 | Organization Detail | /admin/organizations/:id | ACCESS_MATRIX.md |
| 4 | Users | /admin/users | ACCESS_MATRIX.md |
| 5 | Delegations | /admin/delegations | ACCESS_MATRIX.md |
| 6 | Master Contacts | /admin/contacts | Memory |
| 7 | Master Templates | /admin/master-templates | Memory |
| 8 | Tile Catalog | /admin/tiles | tile-catalog-sync |
| 9 | Integrations | /admin/integrations | ADR-037 |
| 10 | Communication Hub | /admin/communication | Memory |
| 11 | Audit Log | /admin/audit | Memory |
| 12 | Billing | /admin/billing | Memory |
| 13 | Agreements | /admin/agreements | Memory |
| 14 | Inbox | /admin/inbox | ADR-037 |
| 15 | Lead Pool | /admin/leadpool | Memory |
| 16 | Partner Verification | /admin/partner-verification | Memory |
| 17 | Commissions | /admin/commissions | Memory |
| 18 | Support | /admin/support | Memory |
| 19 | FutureRoom | /admin/futureroom | futureroom-governance |
| 20 | FutureRoom Banks | /admin/futureroom/bankkontakte | futureroom-governance |
| 21 | FutureRoom Managers | /admin/futureroom/finanzierungsmanager | futureroom-governance |
| 22 | Sales Desk | /admin/desks/sales | ZONE1_ADMIN_ROUTES.md |
| 23 | Finance Desk | /admin/desks/finance | ZONE1_ADMIN_ROUTES.md |
| 24 | Acquiary | /admin/desks/acquiary | ZONE1_ADMIN_ROUTES.md |
| 25 | Agents | /admin/desks/agents | ADR-039 |

---

## 3. ZONE 2 — MODULE 01-12 (CORE — MUSS vollständig sein)

### MOD-01: Stammdaten
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| profil | /portal/stammdaten/profil | Persönliche Daten |
| firma | /portal/stammdaten/firma | Organisation |
| abrechnung | /portal/stammdaten/abrechnung | Billing |
| sicherheit | /portal/stammdaten/sicherheit | Passwort, Sessions |

**DB:** profiles, organizations, memberships

---

### MOD-02: KI Office
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| email | /portal/office/email | Mailbox |
| brief | /portal/office/brief | KI-Briefe |
| kontakte | /portal/office/kontakte | Kontakte |
| kalender | /portal/office/kalender | Termine |

**DB:** contacts, calendar_events

---

### MOD-03: DMS
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| storage | /portal/dms/storage | Ordner-Tree |
| posteingang | /portal/dms/posteingang | Inbound |
| sortieren | /portal/dms/sortieren | Klassifizierung |
| einstellungen | /portal/dms/einstellungen | Connectors |

**DB:** storage_nodes, documents, document_links

---

### MOD-04: Immobilien (KRITISCH)
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| kontexte | /portal/immobilien/kontexte | Vermieter-Kontexte |
| portfolio | /portal/immobilien/portfolio | Immobilien-Liste |
| sanierung | /portal/immobilien/sanierung | Sanierungsprojekte |
| bewertung | /portal/immobilien/bewertung | Wertentwicklung |
| **:id** | /portal/immobilien/:id | **Immobilienakte** (10 Blöcke) |

**DB:** properties, units, loans, leases, landlord_contexts

**Kritische Prüfpunkte:**
- Immobilienakte erreichbar und sichtbar?
- CreatePropertyDialog funktional?
- Inline-Editing funktional?

---

### MOD-05: MSV
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| objekte | /portal/msv/objekte | Unit-Liste |
| mieteingang | /portal/msv/mieteingang | Zahlungen |
| vermietung | /portal/msv/vermietung | Exposés |
| einstellungen | /portal/msv/einstellungen | Konfiguration |

**DB:** leases, rent_payments, msv_enrollments

---

### MOD-06: Verkauf
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| objekte | /portal/verkauf/objekte | Listings |
| vorgaenge | /portal/verkauf/vorgaenge | Transaktionen |
| reporting | /portal/verkauf/reporting | KPIs |
| so-funktionierts | /portal/verkauf/so-funktionierts | Erklärung |

**DB:** listings, listing_publications, reservations

---

### MOD-07: Finanzierung (KRITISCH)
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| **selbstauskunft** | /portal/finanzierung/selbstauskunft | **Selbstauskunft-Formular** |
| dokumente | /portal/finanzierung/dokumente | Bonitätsunterlagen |
| anfrage | /portal/finanzierung/anfrage | Finanzierungsanfragen |
| status | /portal/finanzierung/status | Bearbeitungsstatus |

**DB:** applicant_profiles, finance_requests, finance_packages

**Kritische Prüfpunkte:**
- SelbstauskunftTab vorhanden und funktional?
- Formular (Privat/Unternehmer) nutzbar?
- Dokument-Upload funktional?

---

### MOD-08: Investments
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| suche | /portal/investments/suche | Multi-Source-Suche |
| favoriten | /portal/investments/favoriten | Watchlist |
| mandat | /portal/investments/mandat | Buy-Side |
| simulation | /portal/investments/simulation | Portfolio-Impact |

**DB:** investment_profiles, favorites

---

### MOD-09: Vertriebspartner
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| katalog | /portal/vertriebspartner/katalog | Objekte |
| beratung | /portal/vertriebspartner/beratung | Sessions |
| kunden | /portal/vertriebspartner/kunden | Projekte |
| network | /portal/vertriebspartner/network | Partner-Netzwerk |

**DB:** partner_pipelines, customer_projects

---

### MOD-10: Leadgenerierung
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| inbox | /portal/leads/inbox | Neue Leads |
| meine | /portal/leads/meine | Zugewiesene |
| pipeline | /portal/leads/pipeline | Deal-Pipeline |
| werbung | /portal/leads/werbung | Kampagnen |

**DB:** leads, ad_campaigns

---

### MOD-11: Finanzierungsmanager (KRITISCH)
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| how-it-works | /portal/finanzierungsmanager/how-it-works | Prozess-Erklärung |
| selbstauskunft | /portal/finanzierungsmanager/selbstauskunft | Fälle bearbeiten |
| einreichen | /portal/finanzierungsmanager/einreichen | Bank-Submission |
| status | /portal/finanzierungsmanager/status | Vorgangsstatus |

**DB:** finance_mandates, finance_cases, case_events

**Kritische Prüfpunkte:**
- WorkflowSubbar funktional?
- Mandate-Annahme funktional?
- Case-Events geloggt?

---

### MOD-12: Akquise-Manager
| Tile | Route | SOLL-Funktion |
|------|-------|---------------|
| dashboard | /portal/akquise-manager/dashboard | Übersicht |
| kunden | /portal/akquise-manager/kunden | Kundenakquise |
| mandate | /portal/akquise-manager/mandate | Aktive Mandate |
| tools | /portal/akquise-manager/tools | Werkzeuge |

---

## 4. ZONE 2 — MODULE 13-20 (EXTENDED — Stub erlaubt)

| Modul | Route | Erwartung | Tiles |
|-------|-------|-----------|-------|
| MOD-13 | /portal/projekte | STUB | 4 (uebersicht, timeline, dokumente, einstellungen) |
| MOD-14 | /portal/communication-pro | STUB | 4 |
| MOD-15 | /portal/fortbildung | STUB | 4 |
| MOD-16 | /portal/services | STUB | 4 |
| MOD-17 | /portal/cars | STUB | 4 |
| MOD-18 | /portal/finanzanalyse | STUB | 4 |
| MOD-19 | /portal/photovoltaik | STUB | 4 |
| MOD-20 | /portal/miety | STUB | 6 (Ausnahme!) |

---

## 5. ZONE 3 — WEBSITES

| Site | Prefix | SOLL-Quelle |
|------|--------|-------------|
| Kaufy | /kaufy/* | ZONE3_MASTER_CONCEPT.md |
| Miety | /miety/* | MIETY_COPYKIT.md |
| FutureRoom | /futureroom/* | futureroom-governance |
| SOT | /sot/* | SOT_WEBSITE_FULLSPEC.md |

---

## 6. DURCHFÜHRUNGSPLAN

### Phase 1: SOLL-Extraktion (1 Prompt)
1. Alle docs/modules/MOD-XX_*.md lesen
2. routesManifest.ts vollständig parsen
3. Memory-Kontext erfassen

### Phase 2: IST-Erfassung (1-2 Prompts)
1. Komponenten-Existenz prüfen
2. DB-Schema gegen types.ts
3. Edge Functions listen

### Phase 3: Browser-Tests (1-2 Prompts)
1. Navigation MOD-01 bis MOD-12
2. Kritische Flows (MOD-04, MOD-07, MOD-11)
3. Screenshots

### Phase 4: Report-Generierung (1 Prompt)
1. TXT-Block im Chat ausgeben
2. Archiv-Datei speichern
3. Empfehlung formulieren

---

## 7. ZEITSCHÄTZUNG

| Phase | Dauer |
|-------|-------|
| Phase 1 | 1 Prompt |
| Phase 2 | 1-2 Prompts |
| Phase 3 | 1-2 Prompts |
| Phase 4 | 1 Prompt |
| **GESAMT** | **4-6 Prompts** |

---

**Nächster Schritt:** Soll ich jetzt mit Phase 1 (SOLL-Extraktion aus allen Specs) beginnen?
