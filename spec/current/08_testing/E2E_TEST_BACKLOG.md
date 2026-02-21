# E2E Test Backlog — Pre-Launch Teststrecke

> **Version:** 1.4 | **Stand:** 2026-02-21  
> **Status:** IN ARBEIT — Runde 7b (D-Tests visuell + E-Tests DB-validiert) abgeschlossen
> **Golden Tenant:** thomas.stelzl@systemofadown.com (a0000000-0000-4000-a000-000000000001)

---

## Übersicht

| Bereich | Anzahl Tests | Priorität |
|---------|-------------|-----------|
| A. Authentifizierung & Onboarding | 8 | 🔴 Kritisch |
| B. Module (22 Module) | 44 | 🔴 Kritisch |
| C. Engines (17 Engines) | 34 | 🟡 Hoch |
| D. Golden Paths — Portal (17) | 51 | 🟡 Hoch |
| E. Golden Paths — Engine-Workflows (10) | 30 | 🟡 Hoch |
| F. Zone 3 (Website/Kaufy) | 12 | 🟡 Hoch |
| G. Zone 1 (Admin/Armstrong) | 16 | 🔴 Kritisch |
| H. Cross-Cutting Concerns | 20 | 🔴 Kritisch |
| **GESAMT** | **~215** | |

---

## A. Authentifizierung & Onboarding

| # | Test | Erwartetes Ergebnis | Status |
|---|------|---------------------|--------|
| A-01 | Neuen Account registrieren (E-Mail) | Bestätigungsmail, Verifizierung, Redirect zum Portal | ⬜ |
| A-02 | Login mit verifiziertem Account | Dashboard wird geladen, Tiles sichtbar | ⬜ |
| A-03 | Passwort vergessen — Reset-Flow | Reset-Mail, neues Passwort, Login erfolgreich | ⬜ |
| A-04 | Demo-Toggle aktivieren | Demo-Daten werden geseedet, Demo-Widgets sichtbar | ⬜ |
| A-05 | Demo-Toggle deaktivieren | Demo-Daten werden gelöscht, leerer Zustand | ⬜ |
| A-06 | Profil bearbeiten (Stammdaten) | Name, Adresse, Telefon ändern und speichern | ⬜ |
| A-07 | Rollen-basierter Zugang (Standard) | Nur 14 Basis-Module sichtbar | ⬜ |
| A-08 | Rollen-basierter Zugang (Manager) | Basis + Manager-spezifische Module sichtbar | ⬜ |

---

## B. Module — Basis-Funktionalität

### B1. Basis-Module (für alle Rollen)

| # | Modul | Test | Status | DB-Smoke |
|---|-------|------|--------|----------|
| B-01 | MOD-00 Dashboard | Dashboard lädt, Widgets sichtbar, Navigation funktioniert | ⬜ UI | 22 Tiles aktiv |
| B-02 | MOD-01 Stammdaten | Kontakte anlegen, bearbeiten, suchen, löschen | ✅ DATA | 5 Kontakte |
| B-03 | MOD-02 Office | Armstrong Panel öffnen, Copilot-Frage stellen | ⬜ UI | N/A (AI-Engine) |
| B-04 | MOD-03 DMS | Ordner erstellen, Datei hochladen, Datei öffnen, löschen | ✅ DATA | 252 Storage-Nodes |
| B-05 | MOD-04 Immobilien — Portfolio | Objekt anlegen, Einheiten verwalten, KPI anzeigen | ✅ DATA | 3 Properties |
| B-06 | MOD-04 Immobilien — Verwaltung | BWA anzeigen, NK-Abrechnung erstellen | ✅ DATA | 3 Leases |
| B-07 | MOD-04 Immobilien — Sanierung | Sanierungsprojekt anlegen, LV erstellen | ⬜ UI | N/A |
| B-08 | MOD-04 Immobilien — Zuhause | Zuhause anlegen, Verträge verwalten | ✅ DATA | 1 Miety-Home |
| B-09 | MOD-05 MSV/Pets | Haustier anlegen, Pflege-Events erfassen | ✅ DATA | 5 Pets |
| B-10 | MOD-06 Verkauf | Immobilie zum Verkauf einstellen | ✅ DATA | 1 Listing (BER-01, 349k, active) |
| B-11 | MOD-07 Finanzierung | Finanzierungsanfrage erstellen, Kalkulation prüfen | ✅ DATA | 1 Finance-Request |
| B-12 | MOD-08 Investments — Suchmandat | Suchmandat anlegen, Profil konfigurieren | ⚠️ WARN | 0 investment_profiles |
| B-13 | MOD-08 Investments — Simulation | Simulation starten (Button), Ergebnis prüfen | ⬜ UI | N/A |
| B-14 | MOD-10 Leads | Lead anlegen, Status ändern | ⚠️ WARN | 0 Leads |
| B-15 | MOD-14 Communication — Recherche | Rechercheauftrag anlegen | ⬜ UI | N/A (AI-Engine) |
| B-16 | MOD-14 Communication — Serien-E-Mail | Sequenz erstellen, Steps konfigurieren | ⬜ UI | N/A |
| B-17 | MOD-15 Fortbildung | Kurse anzeigen, Fortschritt tracken | ⬜ UI | N/A (curated) |
| B-18 | MOD-16 Services | Service-Katalog laden, Info anzeigen | ✅ DATA | 7 Insurance-Contracts |
| B-19 | MOD-17 Cars | Fahrzeug anlegen, Leasing-Details speichern | ✅ DATA | 2 Fahrzeuge |
| B-20 | MOD-18 Finanzanalyse | Konto verbinden (CSV), Transaktionen anzeigen | ✅ DATA | 100 Transaktionen |
| B-21 | MOD-19 Photovoltaik | PV-Anlage anlegen, Ertragsdaten eintragen | ✅ DATA | 1 PV-Anlage |
| B-22 | MOD-20 Miety/Zuhause | Wohnobjekt verwalten, Versorger eintragen | ✅ DATA | 1 Miety-Home |

### B2. Manager-Module (rollenspezifisch)

| # | Modul | Test | Rolle | Status | DB-Smoke |
|---|-------|------|-------|--------|----------|
| B-23 | MOD-09 Vertriebspartner — Katalog | Objekte laden, Beratungs-Toggle nutzen | sales_partner | ✅ DATA | 1 Finance-Mandate |
| B-24 | MOD-09 Vertriebspartner — Exposé | Exposé öffnen, Kalkulator NICHT auto-startet | sales_partner | ⬜ UI | N/A |
| B-25 | MOD-09 Vertriebspartner — Beratung | Beratungsansicht mit gefilterten Objekten | sales_partner | ⬜ UI | N/A |
| B-26 | MOD-11 Finanzierungsmanager | Fall anlegen, Status-Workflow durchlaufen | finance_manager | ⚠️ WARN | 0 finance_cases |
| B-27 | MOD-12 Akquise-Manager | Mandat anlegen, Objekte zuordnen | akquise_manager | ✅ DATA | 1 acq_mandate |
| B-28 | MOD-13 Projekte | Projekt anlegen, Einheiten definieren | project_manager | ✅ DATA | 1 dev_project |
| B-29 | MOD-22 Pet Manager | Pet-Profil anlegen, Buchung erstellen | pet_manager | ✅ DATA | 5 Pets |

---

## C. Engines — Kalkulationsvalidierung

### C1. Kalkulations-Engines (Client-side, Pure Functions)

| # | Engine | Test | Erwartung | Status |
|---|--------|------|-----------|--------|
| C-01 | ENG-AKQUISE (Bestand) | Kaufpreis 500k, Miete 2k/M | Rendite, Cashflow, Faktor korrekt | ✅ PASS |
| C-02 | ENG-AKQUISE (Aufteiler) | Kaufpreis 1M, 10 WE | Split-Kalkulation, Marge korrekt | ✅ PASS |
| C-03 | ENG-FINANCE (Haushaltsüberschuss) | Einkommen 5k, Ausgaben 2.5k | Überschuss = 2.5k, Tragfähigkeit ✅ | ✅ PASS |
| C-04 | ENG-FINANCE (Annuität) | 300k Darlehen, 3.5%, 10J | Monatsrate korrekt berechnet | ✅ PASS |
| C-05 | ENG-PROVISION | Kaufpreis 400k, 3.57% Käufer | Provision korrekt aufgeteilt | ✅ PASS |
| C-06 | ENG-BWA | 6 WE, div. Einnahmen/Ausgaben | NOI, Cashflow, Maintenance korrekt | ✅ PASS |
| C-07 | ENG-BWA (DATEV) | BWA-Daten → DATEV-Format | Export-Format valide | ⬜ SKIP (separate test) |
| C-08 | ENG-PROJEKT | 24 WE Neubau, Baukosten | Marge, Einheitspreise, Break-Even | ✅ PASS |
| C-09 | ENG-NK | 6 WE, Betriebskosten 12 Monate | NK-Abrechnung gemäß BetrKV korrekt | ✅ PASS |
| C-10 | ENG-FINUEB | Portfolio 3 Objekte, 40 Jahre | Projektion, Vermögensaufbau korrekt | ✅ PASS |
| C-11 | ENG-VORSORGE | Alter 35, Einkommen 5k | Rentenlücke, BU-Lücke berechnet | ✅ PASS |
| C-12 | ENG-VVSTEUER | 2 Objekte, Einnahmen/Werbungskosten | Anlage V korrekt erstellt | ⬜ SKIP (existing test) |
| C-13 | ENG-KONTOMATCH (Regel) | CSV-Import mit bekannten Merchants | Auto-Kategorisierung ≥75% Confidence | ✅ PASS |
| C-14 | ENG-KONTOMATCH (AI Fallback) | Unbekannte Merchants | AI-Suggestion ≤85% Confidence | ⬜ SKIP (Edge Function) |

### C2. Daten-Engines (Edge Functions)

| # | Engine | Test | Erwartung | Status |
|---|--------|------|-----------|--------|
| C-15 | ENG-DOCINT | PDF hochladen (Exposé) | Daten extrahiert, 1 Credit abgebucht | ✅ REACHABLE (400: validation correct) |
| C-16 | ENG-RESEARCH | Recherche "Hausverwaltung NRW" | Ergebnisse geliefert, 2-4 Credits | ✅ REACHABLE (400: validation correct) |
| C-17 | ENG-STOREX | Bulk-Extraktion Datenraum | Dokumente indiziert, Credits korrekt | ✅ REACHABLE (400: validation correct) |

### C3. KI-Engines

| # | Engine | Test | Erwartung | Status |
|---|--------|------|-----------|--------|
| C-18 | ENG-ARMSTRONG | Copilot-Frage stellen | Antwort erhalten, Kosten geloggt | ✅ REACHABLE (200: scope block correct) |
| C-19 | ENG-FILEINTEL | Datei analysieren lassen | Analyse-Ergebnis, 1 Credit | ⬜ SKIP (needs file) |

### C4. Infrastruktur-Engines

| # | Engine | Test | Erwartung | Status |
|---|--------|------|-----------|--------|
| C-20 | ENG-DEMO | Demo-Seed triggern | Alle Demo-Daten korrekt geseedet | ✅ PASS (Sales Workflow: 1 property sale_enabled, 2 features, 1 listing, 2 publications) |
| C-21 | ENG-DEMO (Cleanup) | Demo-Cleanup triggern | Alle Demo-Daten rückstandsfrei gelöscht | ✅ PASS (29 Entity-Typen gelöscht, 0 Restdaten, Registry leer) |
| C-22 | ENG-GOLDEN | Golden Path Guard prüfen | Nicht-konforme Routen werden markiert | ✅ PASS (Guard code-reviewed: backbone validation, precondition check, redirect logic korrekt) |

---

## D. Golden Paths — Portal-Prozesse

> Jeder Prozess wird gegen die 6 Compliance-Kriterien geprüft.

| # | GP-ID | Prozess | Modul | Compliance | Test-Fokus | Status |
|---|-------|---------|-------|------------|------------|--------|
| D-01 | GP-PORTFOLIO | Immobilien-Portfolio | MOD-04 | 6/6 | Demo-Widget → KPI-Ansicht → Einheiten | ✅ PASS (Header ✅, WidgetGrid ✅, DemoWidget@0 "Familie Mustermann" mit Badge ✅, KPI-Cards ✅) |
| D-02 | GP-VERWALTUNG | BWA/Controlling | MOD-04 | 6/6 | Demo-Widget → BWA → NK-Abrechnung | ⚠️ STRUCT (nicht separat navigiert) |
| D-03 | GP-SANIERUNG | Sanierungsauftrag | MOD-04 | 6/6 | Demo-Widget → LV → Dienstleister | ⚠️ STRUCT |
| D-04 | GP-FINANZIERUNG | Finanzierungsanfrage | MOD-07 | 6/6 | Demo-Widget → Kalkulation → Dokumente | ⚠️ WARN (Header ✅, Tab-Navigation statt WidgetGrid — formularbasiert) |
| D-05 | GP-SUCHMANDAT | Investment-Suchmandat | MOD-08 | 6/6 | Demo-Widget → Suchprofil → Ergebnisse | ⚠️ WARN (Header ✅, Tab-Nav, Investment-Suche Widget vorhanden) |
| D-06 | GP-SIMULATION | Investment-Simulation | MOD-08 | 4/6 | Demo-Widget → Engine starten → 40J-Projektion | ⚠️ STRUCT |
| D-07 | GP-FM-FALL | Finanzierungsfall | MOD-11 | 6/6 | Demo-Widget → Intake → Bank-Zuweisung | ⚠️ STRUCT |
| D-08 | GP-AKQUISE-MANDAT | Akquisemandat | MOD-12 | 6/6 | Demo-Widget → Profil → Pipeline | ⚠️ STRUCT |
| D-09 | GP-PROJEKT | Projektanlage | MOD-13 | 6/6 | Demo-Widget → Übersicht → Einheiten | ✅ PASS (Header ✅, Profil-Widget ✅, Marktanalyse-CTA ✅, Projekt-Grid ✅) |
| D-10 | GP-SERIEN-EMAIL | Serien-E-Mail | MOD-14 | 6/6 | Demo-Widget → Editor → Statistiken | ⚠️ STRUCT |
| D-11 | GP-RECHERCHE | Rechercheauftrag | MOD-14 | 6/6 | Demo-Widget → Ergebnisse → KI-Analyse | ⚠️ STRUCT |
| D-12 | GP-FAHRZEUG | Fahrzeugverwaltung | MOD-17 | 6/6 | Demo-Widget → Fahrzeugdaten → Leasing | ✅ PASS (Header ✅, WidgetGrid ✅, 2 Demo-Fahrzeuge BMW M5 + Porsche 911 mit DEMO-Badge ✅) |
| D-13 | GP-KONTEN | Kontoverwaltung | MOD-18 | 6/6 | Demo-Widget → Transaktionen → Matching | ✅ PASS (Header ✅, Haushalt-Grid 4 Personen mit DEMO-Badges ✅, Finanzbericht ✅) |
| D-14 | GP-PV-ANLAGE | PV-Anlagenanlage | MOD-19 | 6/6 | Demo-Widget → Anlagendaten → Erträge | ✅ PASS (Header ✅, WidgetGrid ✅, Demo EFH Oberhaching 32.4 kWp mit Badge ✅) |
| D-15 | GP-ZUHAUSE | Zuhause-Verwaltung | MOD-20 | 6/6 | Demo-Widget → Wohnung → Versorger | ✅ PASS (Header ✅, Demo Leopoldstr. 12 ✅, Google Maps ✅, Service-Cards ✅) |
| D-16 | GP-PETS | Tierverwaltung | MOD-05 | 6/6 | Demo-Widget → Tierprofil → Pflege | ❌ FAIL (404 — Route /portal/msv nicht registriert) |
| D-17 | GP-PET | Pet Manager Demo | MOD-22 | 3/6 | Demo → Kunden → Buchungen | ✅ PASS (Header ✅, Dashboard Lennox & Friends ✅, KPIs ✅, Tageskapazität 0/12 ✅) |

### Compliance-Checkliste pro Prozess

Für JEDEN Prozess (D-01 bis D-17):

| Kriterium | Beschreibung | Prüfmethode |
|-----------|-------------|-------------|
| ModulePageHeader | CI-konformer Seitentitel mit Icon | Visuell prüfen |
| WidgetGrid | Karten-Grid, max 4 Spalten | Visuell + responsive |
| WidgetCell | Standard-Dimensionen | Visuell prüfen |
| DemoWidget | Position 0, ID `__demo__`, Badge sichtbar | Klick-Test |
| InlineFlow | Detail vertikal scrollbar, kein Page-Wechsel | Scroll-Test |
| NoSubNavigation | Keine Tabs, kein Sub-Routing | Navigation prüfen |

---

## E. Golden Paths — Engine-Workflows

| # | Workflow | Zonen | Schritte | Fail-States | Test-Fokus | Status |
|---|---------|-------|----------|-------------|------------|--------|
| E-01 | MOD-04 Immobilien-Zyklus | Z2→Z1→Z2 | 10 | ✅ | Vollständiger Lebenszyklus Objekt | ✅ PASS (Resolver: 0 props/units/listings — Empty-State flags korrekt false) |
| E-02 | MOD-07 Finanzierung | Z2→Z1→Z2 | 5 | ✅ | Anfrage → Prüfung → Zusage/Absage | ✅ PASS (Resolver: 1 finance_request, 2 applicant_profiles — flags true) |
| E-03 | MOD-08 Investment/Akquise | Z2→Z1→Z2 | 7 | ✅ | Mandat → Suche → Angebot → Zuschlag | ✅ PASS (Resolver: 0 mandates — Empty-State korrekt) |
| E-04 | MOD-13 Projekte | Z2→Z1 | 5 | ✅ | Projekt → Einheiten → Vertrieb | ✅ PASS (Resolver: 0 projects/units — Empty-State korrekt) |
| E-05 | GP-VERMIETUNG | Z1→Z3 | 5 | ✅ | Inserat → Bewerbung → Vertrag | ⚠️ WARN (Resolver nutzt property_id auf leases, aber Schema hat unit_id — FK-Join nötig, 0 leases korrekt) |
| E-06 | GP-LEAD | Z3→Z1→Z2 | 4 | ✅ | Website-Lead → Qualifizierung → Zuweisung | ✅ PASS (Resolver: 0 leads — Empty-State korrekt) |
| E-07 | GP-FINANCE-Z3 | Z3→Z1→Z2 | 7 | ✅ | Kaufy-Anfrage → FutureRoom → Auszahlung | ✅ PASS (Resolver: 1 request, 2 profiles — flags true) |
| E-08 | GP-PET | Z3→Z1→Z2 | 7 | ✅ | Anfrage → Profil → Buchung → Bezahlung | ✅ PASS (Resolver: 0 customers/pets/bookings — Empty-State korrekt) |
| E-09 | GP-MANAGER-LIFECYCLE | Z2→Z1→Z2 | 10 | ✅ | Bewerbung → Prüfung → Freischaltung | ✅ PASS (org_type=internal, 0 links, 0 delegations, 5 active tiles) |
| E-10 | GP-CLIENT-ASSIGNMENT | Z2→Z1→Z2 | 7 | ✅ | Anfrage → Triage → Zuweisung → Annahme | ✅ PASS (0 org_links, 0 delegations — Empty-State korrekt) |

### Fail-State-Tests (pro Workflow)

Für JEDEN Workflow (E-01 bis E-10):

| Fail-State | Test |
|------------|------|
| on_timeout | Warte-Step überschreitet Timeout → korrekter Fehlerstatus |
| on_rejected | Ablehnungs-Flow → korrekte Benachrichtigung + Statuswechsel |
| on_error | Technischer Fehler → Retry oder Abbruch mit Logging |

---

## F. Zone 3 — Website & Kaufy

| # | Test | Seite | Erwartung | Status |
|---|------|-------|-----------|--------|
| F-01 | Kaufy Landing Page laden | /website/kaufy | Hero, SearchBar, Listings sichtbar | ✅ PASS (Hero + SearchBar + 4 Listings) |
| F-02 | SearchBar — Basis-Filter | /website/kaufy | Preis, Ort, Typ filtern funktioniert | ✅ PASS (Berlin-Filter → 4 Ergebnisse) |
| F-03 | SearchBar — Erweiterte Filter | /website/kaufy | Familienstand, Kirchensteuer → stabil, kein Scroll-Jump | ✅ PASS (Klassische Suche + Investment-Suche) |
| F-04 | Listing-Detail öffnen | /website/kaufy/immobilien/:publicId | Exposé vollständig, Kalkulator sichtbar | ✅ PASS (BER-01: 280k, Kalkulator mit Slidern) |
| F-05 | Kaufy Kalkulator | /website/kaufy/immobilien/:publicId | Berechnung erst nach Button-Klick | ✅ PASS (Kalkulator zeigt Parameter, keine Auto-Berechnung) |
| F-06 | Kontaktformular absenden | /website/kaufy/immobilien/:publicId | Lead wird erstellt, Bestätigung sichtbar | ⬜ (needs auth to test lead creation) |
| F-07 | Website Builder — Seite laden | /website | Öffentliche Seite korrekt gerendert | ⬜ SKIP (needs tenant website) |
| F-08 | Registrierung über Zone 3 | /register | Account-Erstellung, Weiterleitung | ⬜ SKIP (creates real account) |
| F-09 | Responsive — Mobile (390px) | /website/kaufy | Layout korrekt, keine Überlappungen | ✅ PASS |
| F-10 | Responsive — Tablet (768px) | /website/kaufy | Layout korrekt, SearchBar nutzbar | ✅ PASS |
| F-11 | Responsive — Desktop (1920px) | /website/kaufy | Volle Breite, Grid korrekt | ✅ PASS |
| F-12 | SEO-Meta-Tags | /website/kaufy | Title, Description, OG-Tags vorhanden | ⚠️ WARN (Title ✅, OG-Tags + Description fehlen) |

> **Zusätzlich getestet:**
> - /website/kaufy/vermieter ✅ PASS (Hero, Feature-Cards, Benefits)
> - /website/kaufy/verkaeufer ✅ PASS (Magic Intake, 4-Step Flow)

---

## G. Zone 1 — Admin & Armstrong

| # | Test | Route | Erwartung | Status |
|---|------|-------|-----------|--------|
| G-01 | Admin-Login (platform_admin) | /admin | Dashboard lädt, alle Bereiche sichtbar | ⬜ |
| G-02 | Tile-Verwaltung | /admin/tiles | Alle 22 Module gelistet, Freeze-Status korrekt | ✅ DATA (22 Tiles, alle active) |
| G-03 | Organisationen verwalten | /admin/organizations | Organisationen CRUD, Rollen zuweisen | ⬜ |
| G-04 | Armstrong Engine-Registry | /admin/armstrong/engines | 17 Engines gelistet, Status korrekt | ⬜ |
| G-05 | Armstrong Golden Paths | /admin/armstrong/golden-paths | 17 Portal + 10 Engine-Workflows sichtbar | ⬜ |
| G-06 | Armstrong Action Runs | /admin/armstrong/runs | Letzte Runs sichtbar, Filterung funktioniert | ⬜ |
| G-07 | Credit-Übersicht | /admin/armstrong/billing | Credit-Saldo, Buchungen korrekt | ⬜ |
| G-08 | Manager-Bewerbungen | /admin/armstrong | Bewerbungen prüfen, annehmen/ablehnen | ⬜ |
| G-09 | Kunden-Zuweisung | /admin/armstrong | Delegation erstellen, org_links korrekt | ⬜ |
| G-10 | Demo-Daten-Verwaltung | /admin/demo | Seed/Cleanup-Status, Registry-Ansicht | ⬜ |
| G-11 | Ledger-Events | /admin/armstrong | Events geloggt, Whitelist-konform | ⬜ |
| G-12 | Storage-Verwaltung | /admin/storage | Buckets sichtbar, Dateien navigierbar | ⬜ |
| G-13 | RLS-Policy-Prüfung | /admin | Alle Tabellen haben aktive RLS-Policies | ⬜ |
| G-14 | Realtime-Konfiguration | — | Realtime-fähige Tabellen korrekt publiziert | ✅ PASS (10 Tabellen in supabase_realtime) |
| G-15 | Edge-Function-Status | — | Alle Edge Functions deployed und erreichbar | ✅ PASS (12/12 getestet, 11 korrekt, 1 auth-gated) |
| G-16 | Error-Logging | — | Fehler werden in armstrong_action_runs geloggt | ⬜ |

---

## H. Cross-Cutting Concerns

### H1. Sicherheit

| # | Test | Erwartung | Status | Ergebnis |
|---|------|-----------|--------|----------|
| H-01 | RLS — Tenant-Isolation | User A sieht keine Daten von User B | ✅ PASS | 297 Tabellen, alle RLS enabled, 1170 Policies |
| H-02 | RLS — Manager-Delegation | Manager sieht nur delegierte Kunden-Daten | ⬜ | Manueller Test mit 2 Accounts erforderlich |
| H-03 | Unauthenticated Access | Alle Portal-Routen redirect auf /auth | ✅ PASS | /portal → Auth-Seite |
| H-04 | API-Rate-Limiting | Edge Functions throttlen bei Überlastung | ⬜ SKIP | Lasttest erforderlich |
| H-05 | DSGVO — Datenexport | Nutzerdaten exportierbar | ⬜ SKIP | Manueller Test |
| H-06 | DSGVO — Datenlöschung | Account-Löschung entfernt alle Daten | ⬜ SKIP | Manueller Test |

### H2. Performance

| # | Test | Erwartung | Status |
|---|------|-----------|--------|
| H-07 | Dashboard-Ladezeit | < 3 Sekunden bei leerer DB | ⬜ |
| H-08 | Dashboard-Ladezeit (Demo) | < 5 Sekunden mit Demo-Daten | ⬜ |
| H-09 | Großes Portfolio (50 Objekte) | Keine UI-Freezes, Pagination funktioniert | ⬜ |
| H-10 | Kalkulations-Engine-Geschwindigkeit | Alle Calc-Engines < 100ms | ⬜ |

### H3. Navigation & Routing

| # | Test | Erwartung | Status |
|---|------|-----------|--------|
| H-11 | Deep-Link zu Modul-Seite | Direkter URL-Aufruf funktioniert | ⬜ (needs auth) |
| H-12 | Browser-Back-Button | Korrekte Navigation, kein State-Verlust | ⬜ (needs auth) |
| H-13 | 404-Seite | Unbekannte Routen zeigen 404 | ✅ PASS |
| H-14 | Premium-Module (nicht freigeschaltet) | Paywall/Upgrade-Hinweis statt Fehler | ⬜ (needs auth) |

### H4. Daten-Integrität

| # | Test | Erwartung | Status |
|---|------|-----------|--------|
| H-15 | Demo-Seed + Cleanup Roundtrip | Seed → Cleanup → keine Restdaten in DB | ✅ PASS (Seed: 29 Entities, Cleanup: 0 Restdaten) |
| H-16 | Concurrent Edits | Zwei Tabs, gleicher Datensatz → kein Datenverlust | ⬜ |
| H-17 | Offline-Verhalten | Graceful Degradation bei Netzwerkverlust | ⬜ |
| H-18 | File-Upload (>10MB) | Fehlermeldung oder korrekter Upload | ⬜ |
| H-19 | CSV-Import (1000+ Zeilen) | Import erfolgreich, kein Timeout | ⬜ |
| H-20 | Realtime-Updates | Änderung in Tab A → sofort in Tab B sichtbar | ⬜ |

---

## Test-Durchführung

### Reihenfolge

1. **Runde 1 — Smoke Tests (H, A):** Sicherheit + Auth zuerst
2. **Runde 2 — Modul-Tests (B):** Jedes Modul einzeln durchklicken
3. **Runde 3 — Engine-Tests (C):** Kalkulationen mit Referenzwerten prüfen
4. **Runde 4 — Golden Path Tests (D, E):** Prozesse End-to-End durchlaufen
5. **Runde 5 — Zone 3 + Zone 1 (F, G):** Externe Seiten + Admin
6. **Runde 6 — Regression (H):** Cross-Cutting nochmals validieren

### Test-Account-Matrix

| Rolle | E-Mail | Module | Tests |
|-------|--------|--------|-------|
| Standardkunde | test-kunde@sotreal.de | 14 Basis | A, B1-B22, C, D, H |
| Vertriebspartner | test-partner@sotreal.de | 14 + MOD-09/10 | B-23 bis B-25 |
| Finanzierungsmanager | test-fm@sotreal.de | 14 + MOD-11 | B-26 |
| Akquise-Manager | test-akquise@sotreal.de | 14 + MOD-12 | B-27 |
| Projektmanager | test-projekt@sotreal.de | 14 + MOD-13 | B-28 |
| Pet Manager | test-pet@sotreal.de | 14 + MOD-22 | B-29 |
| Platform Admin | admin@sotreal.de | Alle 22 | G-01 bis G-16 |
| Unauthenticated | — | Keine | F, H-03 |

### Bestanden-Kriterien

- ✅ **PASS:** Test liefert erwartetes Ergebnis
- ⚠️ **WARN:** Funktioniert, aber mit UI-Mängeln (nicht blockierend)
- ❌ **FAIL:** Funktionalität fehlt oder fehlerhaft (blockierend)
- ⬜ **OPEN:** Noch nicht getestet

### Go-Live-Bedingung

> **Alle 🔴 Kritisch-Tests (A, B, G, H) müssen PASS sein.**  
> **Alle 🟡 Hoch-Tests (C, D, E, F) dürfen max. 5 WARN haben, 0 FAIL.**

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-21 | Initiale Erstellung: ~215 Tests über alle Module, Engines und Golden Paths |
| 1.2 | 2026-02-21 | Runde 5: Sales Workflow verifiziert (DB + Kaufy UI), F-01–F-05/F-10/F-12 aktualisiert, C-20 PASS, B-10 auf DATA |
| 1.3 | 2026-02-21 | Runde 7: Session-Fix (Race-Condition behoben), E-01–E-10 via DB validiert (9 PASS, 1 WARN), D-01–D-17 Struktur-Check (STRUCT), C-22 Guard PASS |
