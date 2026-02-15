

# Armstrong Zone 2 — Vollstaendiger Scan: Fehlende Actions & Knowledge Gaps

## 1. Status Quo: Action-Inventar

Armstrong hat aktuell **ca. 120 Z2-Actions** (inkl. Coach-Slides/Engine). Die Module-Abdeckung:

| Modul | Actions vorhanden | Status |
|-------|-------------------|--------|
| MOD-00 Dashboard | 9 (Widgets, Briefing, Report, Meeting) | Gut |
| MOD-02 KI-Office | 13 (Letter, WA, Email, Calendar, Contacts) | Gut |
| MOD-03 DMS | 5 (Search, Link, Extract, Upload, Confidence) | Gut |
| MOD-04 Immobilien | 12 (CRUD, KPI, NK, Lease, Tenant, Expose) | Gut |
| MOD-07 Finanzierung | 7 (Selbstauskunft, Checklist, Export, Readiness, Credit, Bank) | Gut |
| MOD-08 Investment | 4 + 41 Coach (Analyze, Simulate, Mandate, Research) | Gut |
| MOD-12 Akquise | 3 (Draft, Analyze, Mandate) | Basis |
| MOD-13 Projekte | 2 (Create, Explain) | Basis |
| MOD-14 Recherche | 5 (Free, Pro, Import, Dedupe, Order) | Gut |
| MOD-16 Sanierung | 3 (Tender, Compare, Commission) | Basis |
| MOD-17 Cars | 1 (Dossier Research) | Minimal |
| MOD-18 Finanzen | 1 (Insurance Research) | Minimal |
| MOD-19 Photovoltaik | 4 (Explain Connect, Monitoring, PV Research, View) | Gut |
| KB | 3 (Memo, Suggest, Sales Script) | Gut |
| Landing Page | 2 (Generate, Publish) | Gut |
| **MOD-05 Pets** | **0** | **Fehlt** |
| **MOD-06 Verkauf** | **0** | **Fehlt** |
| **MOD-09 Vertriebspartner** | **0** | **Fehlt** |
| **MOD-10 Leadmanager** | **0** | **Fehlt** |
| **MOD-11 Finanzierungsmanager** | **0** | **Fehlt** |

## 2. Fehlende Actions nach Modul

### 2.1 MOD-06 Verkauf (0 Actions -- KRITISCH)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD06.EXPLAIN_MODULE | Verkaufsmodul erklaeren | readonly | Nein |
| ARM.MOD06.GENERATE_EXPOSE | Expose generieren | execute_with_confirmation | Ja |
| ARM.MOD06.PUBLISH_LISTING | Inserat veroeffentlichen | execute_with_confirmation | Ja |
| ARM.MOD06.UNPUBLISH_LISTING | Inserat deaktivieren | execute_with_confirmation | Nein |
| ARM.MOD06.ANALYZE_MARKET_PRICE | Marktpreis analysieren | readonly | Nein |

### 2.2 MOD-09 Vertriebspartner (0 Actions -- KRITISCH)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD09.EXPLAIN_MODULE | Vertriebspartner-Modul erklaeren | readonly | Nein |
| ARM.MOD09.CREATE_PARTNER_PROFILE | Partnerprofil anlegen | execute_with_confirmation | Nein |
| ARM.MOD09.VIEW_OBJECT_CATALOG | Objektkatalog einsehen | readonly | Nein |
| ARM.MOD09.RUN_PARTNER_SIMULATION | Investment-Simulation fuer Kunden | readonly | Nein |
| ARM.MOD09.DRAFT_PARTNER_OFFER | Angebot fuer Kunden erstellen | draft_only | Nein |

### 2.3 MOD-10 Leadmanager (0 Actions -- KRITISCH)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD10.EXPLAIN_MODULE | Leadmanager erklaeren | readonly | Nein |
| ARM.MOD10.VIEW_LEAD_PIPELINE | Lead-Pipeline anzeigen | readonly | Nein |
| ARM.MOD10.QUALIFY_LEAD | Lead qualifizieren | execute | Nein |
| ARM.MOD10.ASSIGN_LEAD | Lead zuweisen | execute_with_confirmation | Ja |
| ARM.MOD10.CREATE_DEAL | Deal aus Lead erstellen | execute_with_confirmation | Nein |

### 2.4 MOD-11 Finanzierungsmanager (0 Actions -- KRITISCH)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD11.EXPLAIN_MODULE | Finanzierungsmanager erklaeren | readonly | Nein |
| ARM.MOD11.CREATE_CASE | Finanzierungsfall anlegen | execute_with_confirmation | Nein |
| ARM.MOD11.MAGIC_INTAKE | Magic Intake starten | execute_with_confirmation | Ja |
| ARM.MOD11.PREPARE_SUBMISSION | Einreichung vorbereiten | execute_with_confirmation | Ja |
| ARM.MOD11.TRACK_PROVISION | Provision tracken | readonly | Nein |

### 2.5 MOD-05 Pets (0 Actions -- NIEDRIG)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD05.EXPLAIN_MODULE | Pets-Modul erklaeren | readonly | Nein |
| ARM.MOD05.CREATE_PET | Tier anlegen | execute_with_confirmation | Nein |
| ARM.MOD05.SCHEDULE_VET | Tierarzttermin planen | execute_with_confirmation | Ja |

### 2.6 Erweiterungen bestehender Module

#### MOD-17 Cars (nur 1 Action)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD17.EXPLAIN_MODULE | Fahrzeugmodul erklaeren | readonly | Nein |
| ARM.MOD17.CREATE_VEHICLE | Fahrzeug anlegen | execute_with_confirmation | Nein |
| ARM.MOD17.SCHEDULE_SERVICE | Wartungstermin planen | execute_with_confirmation | Ja |

#### MOD-18 Finanzen (nur 1 Action)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD18.EXPLAIN_MODULE | Finanzmodul erklaeren | readonly | Nein |
| ARM.MOD18.EXPLAIN_INSURANCE | Versicherung erklaeren | readonly | Nein |
| ARM.MOD18.SUBSCRIPTION_OVERVIEW | Abo-Uebersicht erstellen | readonly | Nein |

#### MOD-13 Projekte (nur 2 Actions)

| Action Code | Titel | Mode | Widget? |
|-------------|-------|------|---------|
| ARM.MOD13.CALCULATE_AUFTEILER | Aufteiler-Kalkulation | readonly | Nein |
| ARM.MOD13.GENERATE_SALES_REPORT | Verkaufsstandsbericht | execute_with_confirmation | Ja |
| ARM.MOD13.DRAFT_RESERVATION | Reservierung vorbereiten | draft_only | Nein |

## 3. Knowledge Base — Gap-Analyse

### 3.1 Aktueller KB-Bestand (62 Items, 7 Kategorien)

| Kategorie | Items | Abdeckung |
|-----------|-------|-----------|
| system | 10 | Grundlegend |
| real_estate | 12 | Gut |
| tax_legal | 4 | **Duenn** |
| finance | 8 | Gut |
| sales | 20 | Sehr gut |
| templates | 2 | **Duenn** |
| research | 0 | Leer (dynamisch) |
| photovoltaik | 6 | Gut |

### 3.2 Fehlende KB-Artikel (KRITISCH)

#### Kategorie: system (fehlen ca. 15 Items)

Armstrong kann Module erklaeren, hat aber keine KB-Artikel fuer:

- **KB.SYS.MOD05** — Pets-Modul: Was kann es?
- **KB.SYS.MOD06** — Verkaufsmodul: Golden Path Verkauf
- **KB.SYS.MOD09** — Vertriebspartner: Onboarding & Objektkatalog
- **KB.SYS.MOD10** — Leadmanager: Pipeline & Zuweisung
- **KB.SYS.MOD11** — Finanzierungsmanager: Fall-Flow & Magic Intake
- **KB.SYS.MOD12** — Akquisemanager: Mandat & Inbound-Flow
- **KB.SYS.MOD13** — Projekte: Aufteiler & Reservierung
- **KB.SYS.MOD16** — Sanierung: 8-Schritte-Golden-Path
- **KB.SYS.MOD17** — Cars: Fahrzeugverwaltung
- **KB.SYS.MOD18** — Finanzen: Privatfinanzen & Versicherungen
- **KB.SYS.DASHBOARD** — Dashboard-Widgets & Briefing
- **KB.SYS.DMS** — Dokumentenmanagement & Sortierregeln
- **KB.SYS.ROLLEN** — Rollensystem (6 Rollen + org_admin)
- **KB.SYS.BILLING** — Credit-System (1 Credit = 0.50 EUR)
- **KB.SYS.ZONE_ARCHITECTURE** — Zone 1/2/3 Erklaerung

#### Kategorie: tax_legal (fehlen ca. 4 Items)

- **KB.TAX.AFA** — AfA-Modelle (linear, degressiv, Sonder-AfA)
- **KB.TAX.GRUNDERWERBSTEUER** — Bundesland-Saetze
- **KB.TAX.SPEKULATIONSFRIST** — 10-Jahres-Regel
- **KB.TAX.WERBUNGSKOSTEN** — Was ist absetzbar?

#### Kategorie: templates (fehlen ca. 5 Items)

- **KB.TPL.MIETVERTRAG** — Mietvertrag-Checkliste
- **KB.TPL.UEBERGABEPROTOKOLL** — Wohnungsuebergabe
- **KB.TPL.NEBENKOSTENBRIEF** — NK-Abrechnung Begleitschreiben
- **KB.TPL.KUENDIGUNGSBRIEF** — Kuendigungsschreiben Mieter
- **KB.TPL.FINANZIERUNGSDOCS** — Dokumenten-Checkliste Bank

### 3.3 Fehlende KB-Kategorie

Die Kategorie **photovoltaik** existiert in der DB, aber NICHT in `armstrongKBTaxonomy.ts`. Das bedeutet, Armstrong kann die PV-Artikel nicht korrekt kategorisiert ausliefern. Die Taxonomy muss um diese Kategorie ergaenzt werden.

## 4. Zusammenfassung

### Neue Actions: 33 insgesamt

| Modul | Neue Actions | Prioritaet |
|-------|-------------|------------|
| MOD-06 Verkauf | 5 | HOCH |
| MOD-09 Vertriebspartner | 5 | HOCH |
| MOD-10 Leadmanager | 5 | HOCH |
| MOD-11 Finanzierungsmanager | 5 | HOCH |
| MOD-13 Projekte (Erweiterung) | 3 | MITTEL |
| MOD-17 Cars (Erweiterung) | 3 | MITTEL |
| MOD-18 Finanzen (Erweiterung) | 3 | MITTEL |
| MOD-05 Pets | 3 | NIEDRIG |
| Summe | **33** | — |

### KB-Luecken: ca. 24 fehlende Artikel

| Kategorie | Fehlend | Prioritaet |
|-----------|---------|------------|
| system (Modul-Erklaerungen) | 15 | HOCH |
| tax_legal | 4 | MITTEL |
| templates | 5 | MITTEL |
| Summe | **24** | — |

### Taxonomy-Fix: 1 Aenderung

- `armstrongKBTaxonomy.ts` um Kategorie `photovoltaik` ergaenzen

## 5. Technische Umsetzung

### Datei-Aenderungen

1. **`src/manifests/armstrongManifest.ts`** — 33 neue Action-Eintraege
2. **`src/constants/armstrongKBTaxonomy.ts`** — Kategorie `photovoltaik` hinzufuegen
3. **Keine DB-Migration noetig** — Actions sind rein manifest-seitig, KB-Artikel werden ueber das UI oder Armstrong selbst eingepflegt

### Empfohlene Reihenfolge

1. Phase 1: Actions fuer MOD-06, MOD-09, MOD-10, MOD-11 (20 Actions) + Taxonomy-Fix
2. Phase 2: Erweiterungen MOD-13, MOD-17, MOD-18 (9 Actions)
3. Phase 3: MOD-05 Pets (3 Actions) + KB-Artikel Seeding (via Armstrong oder manuell)

