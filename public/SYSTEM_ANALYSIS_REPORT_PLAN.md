# SYSTEM OF A TOWN — Comprehensive Analysis & Reporting Plan

**Version:** 1.0  
**Datum:** 2026-02-03  
**Zweck:** Strukturierter Plan zur vollständigen Soll-Ist-Analyse aller Module und Zonen

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

### 1.2 Bewertungsschema

| Status | Symbol | Bedeutung |
|--------|--------|-----------|
| **COMPLETE** | ✅ | Vollständig implementiert, funktioniert |
| **PARTIAL** | 🟡 | Teilweise implementiert, mit Lücken |
| **STUB** | 🟠 | Platzhalter/Skeleton vorhanden |
| **MISSING** | ❌ | Nicht vorhanden |
| **BROKEN** | 🔴 | Vorhanden aber fehlerhaft |

### 1.3 Prioritätsstufen

| Priorität | Beschreibung |
|-----------|--------------|
| **P0** | Kritisch — Blockiert andere Module |
| **P1** | Hoch — Kernfunktionalität fehlt |
| **P2** | Mittel — Wichtig aber nicht blockierend |
| **P3** | Niedrig — Nice-to-have |

---

## 2. ZONE 1 — ADMIN PORTAL

### 2.1 Zu prüfende Bereiche

| Bereich | Route | Erwartete Funktion |
|---------|-------|-------------------|
| Dashboard | /admin | Plattform-KPIs, Quick Actions |
| Organizations | /admin/organizations | Tenant CRUD |
| Organization Detail | /admin/organizations/:id | Org-Details, Memberships |
| Users | /admin/users | User Management + Rollen |
| Delegations | /admin/delegations | Org-to-Org Rechte |
| Master Contacts | /admin/contacts | Kontakt-Verwaltung |
| Master Templates | /admin/master-templates | Vorlagen-Verwaltung |
| Tile Catalog | /admin/tiles | Modul-Aktivierung |
| Integrations | /admin/integrations | API Registry |
| Communication Hub | /admin/communication | Kommunikations-Zentrale |
| Audit Log | /admin/audit | Event-Log |
| Billing | /admin/billing | Abrechnung |
| Agreements | /admin/agreements | Vereinbarungen |
| Inbox | /admin/inbox | Zentrale Inbox |
| Lead Pool | /admin/leadpool | Lead-Zuweisung |
| Partner Verification | /admin/partner-verification | §34c/VSH Prüfung |
| Commissions | /admin/commissions | Provisions-Freigabe |
| Support | /admin/support | Support-Modus |
| **FutureRoom** | /admin/futureroom | Finanzierungs-Governance |
| FutureRoom Banks | /admin/futureroom/bankkontakte | Bank-Directory |
| FutureRoom Managers | /admin/futureroom/finanzierungsmanager | Manager-Pool |
| **Desks** | — | Operative Zentrale |
| Sales Desk | /admin/sales-desk | Verkaufs-Governance |
| Finance Desk | /admin/finance-desk | Finanzierungs-Desk |
| Acquiary | /admin/acquiary | Akquise-Governance |
| Agents | /admin/agents | KI-Agenten-Verwaltung |

### 2.2 Zone 1 Prüfkriterien

- [ ] AdminLayout rendert ohne Fehler
- [ ] AdminSidebar zeigt alle manifest-definierten Routen
- [ ] Jede Route ist navigierbar ohne Absturz
- [ ] RLS-geschützte Daten werden korrekt gefiltert

---

## 3. ZONE 2 — USER PORTAL (20 Module)

### 3.1 Module 01-12 (Kernmodule — MUSS vollständig sein)

#### MOD-01: Stammdaten
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Profil | /portal/stammdaten/profil | Persönliche Daten, Avatar | TBD |
| Firma | /portal/stammdaten/firma | Organisation, Team | TBD |
| Abrechnung | /portal/stammdaten/abrechnung | Billing, Credits | TBD |
| Sicherheit | /portal/stammdaten/sicherheit | Passwort, Sessions | TBD |

**Datenbank-Tabellen:** profiles, organizations, memberships, subscriptions

---

#### MOD-02: KI Office
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| E-Mail | /portal/office/email | Persönliche Mailbox (IMAP) | TBD |
| Brief | /portal/office/brief | KI-Briefgenerator | TBD |
| Kontakte | /portal/office/kontakte | Master-Kontakte | TBD |
| Kalender | /portal/office/kalender | Termine, Erinnerungen | TBD |

**Datenbank-Tabellen:** contacts, calendar_events, letter_drafts

---

#### MOD-03: DMS
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Storage | /portal/dms/storage | Ordner-Tree, Dokumente | TBD |
| Posteingang | /portal/dms/posteingang | Inbound-Dokumente | TBD |
| Sortieren | /portal/dms/sortieren | Zuordnung, Klassifizierung | TBD |
| Einstellungen | /portal/dms/einstellungen | Connectors, Extraction | TBD |

**Datenbank-Tabellen:** storage_nodes, documents, document_links, extractions

---

#### MOD-04: Immobilien (KRITISCH — SSOT)
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Kontexte | /portal/immobilien/kontexte | Vermieter-Kontexte | TBD |
| Portfolio | /portal/immobilien/portfolio | Immobilien-Liste | TBD |
| Sanierung | /portal/immobilien/sanierung | Sanierungsprojekte | TBD |
| Bewertung | /portal/immobilien/bewertung | Wertentwicklung | TBD |
| **Immobilienakte** | /portal/immobilien/:id | Objekt-Detail-Hub (10 Blöcke) | TBD |

**Datenbank-Tabellen:** properties, units, loans, leases, landlord_contexts, property_features

**Kritische Prüfpunkte:**
- Kann eine neue Immobilie angelegt werden?
- Wird die Immobilienakte korrekt geladen?
- Funktioniert Inline-Editing?
- Werden Dokumente korrekt verlinkt?

---

#### MOD-05: MSV (Mietsonderverwaltung)
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Objekte | /portal/msv/objekte | Alle Units anzeigen | TBD |
| Mieteingang | /portal/msv/mieteingang | Zahlungsverwaltung (Premium) | TBD |
| Vermietung | /portal/msv/vermietung | Vermietungsexposés | TBD |
| Einstellungen | /portal/msv/einstellungen | Konfiguration | TBD |

**Datenbank-Tabellen:** leases, rent_payments, msv_enrollments

---

#### MOD-06: Verkauf
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Objekte | /portal/verkauf/objekte | Listing-Liste | TBD |
| Vorgänge | /portal/verkauf/vorgaenge | Reservierungen, Transaktionen | TBD |
| Reporting | /portal/verkauf/reporting | Verkaufs-KPIs | TBD |
| Einstellungen | /portal/verkauf/einstellungen | Konfiguration | TBD |

**Datenbank-Tabellen:** listings, listing_publications, reservations, transactions

---

#### MOD-07: Finanzierung (KRITISCH)
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| **Selbstauskunft** | /portal/finanzierung/selbstauskunft | Persönliche Daten für Finanzierung | TBD |
| Dokumente | /portal/finanzierung/dokumente | Bonitätsunterlagen hochladen | TBD |
| Anfrage | /portal/finanzierung/anfrage | Finanzierungsanfragen verwalten | TBD |
| Status | /portal/finanzierung/status | Bearbeitungsstatus verfolgen | TBD |

**Datenbank-Tabellen:** applicant_profiles, finance_requests, finance_packages, finance_documents

**Kritische Prüfpunkte:**
- Wird SelbstauskunftTab korrekt gerendert?
- Funktioniert das Formular (Privat/Unternehmer)?
- Können Dokumente hochgeladen werden?
- Funktioniert der Anfrage-Workflow?

---

#### MOD-08: Investment-Suche
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Suche | /portal/investments/suche | Multi-Source-Suche | TBD |
| Favoriten | /portal/investments/favoriten | Watchlist | TBD |
| Mandat | /portal/investments/mandat | Buy-Side Betreuung | TBD |
| Simulation | /portal/investments/simulation | Portfolio-Impact | TBD |

**Datenbank-Tabellen:** investment_profiles, favorites

---

#### MOD-09: Vertriebspartner
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Katalog | /portal/vertriebspartner/katalog | Verfügbare Objekte | TBD |
| Beratung | /portal/vertriebspartner/beratung | Beratungssessions | TBD |
| Kunden | /portal/vertriebspartner/kunden | Kundenprojekte | TBD |
| Netzwerk | /portal/vertriebspartner/network | Partner-Netzwerk | TBD |

**Datenbank-Tabellen:** partner_pipelines, customer_projects

---

#### MOD-10: Leadgenerierung
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Inbox | /portal/leads/inbox | Neue Leads | TBD |
| Meine Leads | /portal/leads/meine | Zugewiesene Leads | TBD |
| Pipeline | /portal/leads/pipeline | Deal-Pipeline | TBD |
| Werbung | /portal/leads/werbung | Kampagnen | TBD |

**Datenbank-Tabellen:** leads, ad_campaigns, ad_campaign_leads

---

#### MOD-11: Finanzierungsmanager (KRITISCH)
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| So funktioniert's | /portal/finanzierungsmanager/how-it-works | Prozess-Erklärung | TBD |
| Selbstauskunft | /portal/finanzierungsmanager/selbstauskunft | Fälle bearbeiten | TBD |
| Einreichen | /portal/finanzierungsmanager/einreichen | An Bank senden | TBD |
| Status | /portal/finanzierungsmanager/status | Vorgangsstatus | TBD |

**Datenbank-Tabellen:** finance_mandates, finance_cases, case_events

**Kritische Prüfpunkte:**
- Wird WorkflowSubbar korrekt angezeigt?
- Funktioniert die Mandate-Annahme?
- Werden Fälle korrekt geladen?

---

#### MOD-12: Akquise-Manager
| Tile | Route | Spec-Soll | UI-Status |
|------|-------|-----------|-----------|
| Dashboard | /portal/akquise-manager/dashboard | Übersicht | TBD |
| Kunden | /portal/akquise-manager/kunden | Kundenakquise | TBD |
| Mandate | /portal/akquise-manager/mandate | Aktive Mandate | TBD |
| Tools | /portal/akquise-manager/tools | Akquise-Werkzeuge | TBD |

---

### 3.2 Module 13-20 (Erweiterte Module — Rudimentär/Stub erlaubt)

Diese Module sollen im Manifest definiert und navigierbar sein, aber müssen keine vollständige Funktionalität haben:

| Modul | Name | Route | Erwarteter Status |
|-------|------|-------|-------------------|
| MOD-13 | Projekte | /portal/projekte | Stub mit 4 Tiles |
| MOD-14 | Communication Pro | /portal/communication-pro | Stub mit 4 Tiles |
| MOD-15 | Fortbildung | /portal/fortbildung | Stub mit 4 Tiles |
| MOD-16 | Services | /portal/services | Stub mit 4 Tiles |
| MOD-17 | Car-Management | /portal/cars | Stub mit 4 Tiles |
| MOD-18 | Finanzanalyse | /portal/finanzanalyse | Stub mit 4 Tiles |
| MOD-19 | Photovoltaik | /portal/photovoltaik | Stub mit 4 Tiles |
| MOD-20 | Miety | /portal/miety | Stub mit 6 Tiles (Ausnahme) |

---

## 4. ZONE 3 — WEBSITES

### 4.1 Zu prüfende Sites

| Site | Route-Prefix | Erwartete Funktion |
|------|--------------|-------------------|
| Kaufy | /kaufy | Marktplatz-Website |
| Miety | /miety | Mieter-App Website |
| FutureRoom | /futureroom | Finanzierungsportal |
| SoT | /sot | System of a Town Website |

---

## 5. ANALYSE-WORKFLOW

### Phase 1: Manifest-Abgleich (30 min)
1. routesManifest.ts vollständig durchlesen
2. tile_catalog.yaml abgleichen
3. Alle definierten vs. implementierten Routen auflisten
4. Legacy-Redirects prüfen

### Phase 2: Component-Check (60 min)
1. Für jedes Modul: Page-Komponente existiert?
2. Lazy-Loading korrekt konfiguriert?
3. ModuleHowItWorks für Index-Route?
4. Tab-Komponenten vorhanden?

### Phase 3: Datenbank-Abgleich (30 min)
1. Schema-Query für alle relevanten Tabellen
2. Seed-Daten vorhanden?
3. RLS-Policies aktiv?

### Phase 4: UI-Test (60 min)
1. Browser öffnen
2. Jeden Modul-Einstiegspunkt navigieren
3. Screenshots machen
4. Fehler dokumentieren

### Phase 5: Integration-Test (30 min)
1. MOD-04 ↔ MOD-07 Fluss testen
2. MOD-07 ↔ MOD-11 Fluss testen
3. Zone 1 ↔ Zone 2 Interaktion

---

## 6. REPORT-TEMPLATE

### 6.1 Modul-Status-Report

```markdown
## MOD-XX: [Name]

### Manifest-Status
- [ ] Route in routesManifest.ts: ✅/❌
- [ ] Tiles korrekt definiert: ✅/❌
- [ ] Legacy-Redirects: ✅/❌/N/A

### Component-Status
- [ ] Page-Komponente: ✅/❌
- [ ] Tab-Komponenten: ✅/❌
- [ ] HowItWorks-Content: ✅/❌

### Datenbank-Status
- [ ] Tabellen vorhanden: ✅/❌
- [ ] RLS aktiv: ✅/❌
- [ ] Seed-Daten: ✅/❌

### UI-Funktionalität
- [ ] Navigation funktioniert: ✅/❌
- [ ] Grundfunktionen testbar: ✅/❌
- [ ] Keine kritischen Fehler: ✅/❌

### Findings
- Finding 1: ...
- Finding 2: ...

### Empfehlung
- [ ] OK - Keine Aktion nötig
- [ ] FIX - Reparatur möglich
- [ ] REVERT - Tieferer Rollback nötig
```

---

## 7. NÄCHSTE SCHRITTE

Nach Genehmigung dieses Plans:

1. **Schritt 1:** Ich führe die vollständige Analyse durch
2. **Schritt 2:** Ich erstelle den detaillierten Report als `SYSTEM_ANALYSIS_REPORT_2026-02-03.md`
3. **Schritt 3:** Wir priorisieren die Findings
4. **Schritt 4:** Reparatur oder Revert-Entscheidung

---

*Dieser Plan ist der Ausgangspunkt für die strukturierte Systemanalyse.*
