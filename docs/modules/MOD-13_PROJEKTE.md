# MOD-13: Projekte

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/projekte` |
| **Icon** | `FolderKanban` |
| **Org-Types** | `partner` |
| **Default Visible** | Ja |
| **Display Order** | 13 |
| **Golden-Tenant-Vorlage** | ✅ Ja — systemweit für alle Partner-Tenants mit `project_manager`-Rolle |

## Beschreibung

Das Projekte-Modul (Display: "Projektmanager") bietet eine übergreifende Projekt-Management-Ansicht für Bauträger und Aufteiler. Es ermöglicht die vollständige Verwaltung von Mehreinheiten-Projekten von der KI-gestützten Akquisition bis zum Abverkauf.

**Golden-Tenant-Vermerk:** MOD-13 in seiner aktuellen Form (6 Tiles: Dashboard → Projekte → InvestEngine → Vertrieb → Landing Page → Lead Manager) wird als systemweite Vorlage im Golden Tenant geführt. Alle Partner-Tenants mit `project_manager`-Rolle erhalten exakt diese Funktionalität. Der Code ist generisch (keine Tenant-spezifischen Hardcodes), die Daten kommen aus `dev_projects` + `dev_project_units` (mandantenfähig via tenant_id + RLS).

## Tiles (6-Tile-Pattern)

### 1. Dashboard
- **Route:** `/portal/projekte/dashboard`
- **Beschreibung:** Projekt-Grid mit KPIs, Manager-Visitenkarte und Magic Intake
- **Funktionen:**
  - Magic Intake (KI-basierter Projekt-Import)
  - Projekt-Übersicht mit Status-Cards
  - KI-Marktanalyse

### 2. Projekte
- **Route:** `/portal/projekte/projekte`
- **Beschreibung:** Projektliste mit Verwaltung
- **Funktionen:**
  - Projekt-Übersicht
  - Status-Tracking (frei/reserviert/verkauft)
  - Marge & Fortschritts-Anzeige

### 3. InvestEngine
- **Route:** `/portal/projekte/invest-engine`
- **Beschreibung:** Investorenperspektive auf die Preisliste (tabellarisch)
- **Golden Path Step:** GP05_STEP_03_INVEST_ANALYSIS (Phase 3)
- **Funktionen:**
  - zVE/EK-Eingabe (wie MOD-08 Investment-Suche)
  - Tabellarische Preisliste mit Steuereffekt und Monatsbelastung nach Steuer
  - Klick auf Einheit → Vollbild-Exposé mit 40-Jahres-Projektion (MasterGraph, Haushaltsrechnung, SliderPanel)
  - AfA-Modell und Gebäudeanteil aus Projekt-Datenblatt vorbelegt
  - Setzt `invest_engine_analyzed = true` nach erster Berechnung (Golden Path Compliance)

### 4. Vertrieb
- **Route:** `/portal/projekte/vertrieb`
- **Beschreibung:** Vertriebsstatusreport & Verkaufssteuerung
- **Funktionen:**
  - Aggregierte EUR-Werte
  - 2-seitiger PDF-Export
  - E-Mail-Versand

### 5. Landing Page
- **Route:** `/portal/projekte/landing-page`
- **Beschreibung:** Landing-Page-Generierung für Projekte

### 6. Lead Manager
- **Route:** `/portal/projekte/lead-manager`
- **Beschreibung:** Projekt-Kampagnen via MOD-10 Integration

## Golden Path (GP-05) — 7 Phasen

| Phase | Step ID | Label | Type | Camunda Key |
|-------|---------|-------|------|-------------|
| 1 | create_project | Projekt anlegen | user_task | GP05_STEP_01_CREATE_PROJECT |
| 2 | plan_units | Einheiten planen | user_task | GP05_STEP_02_PLAN_UNITS |
| **3** | **invest_analysis** | **Investment-Analyse (InvestEngine)** | **user_task** | **GP05_STEP_03_INVEST_ANALYSIS** |
| 4 | phase_change_sales | Phasenwechsel → Vertrieb | user_task | GP05_STEP_04_PHASE_CHANGE |
| 5 | listing_distribution | Listing-Distribution | service_task | GP05_STEP_05_LISTING_DISTRIBUTE |
| 6 | landing_page | Landing Page erstellen | service_task | GP05_STEP_06_LANDING_PAGE |
| 7 | handover_complete | Übergabe und Abschluss | user_task | GP05_STEP_07_HANDOVER |

### Context Resolver Flags

| Flag | Quelle | Beschreibung |
|------|--------|-------------|
| project_exists | dev_projects | Projekt wurde angelegt |
| units_created | dev_project_units | Mindestens eine Einheit existiert |
| invest_analysis_done | dev_projects.invest_engine_analyzed | InvestEngine wurde genutzt |
| phase_vertrieb | dev_projects.phase | Projekt in Vertriebsphase |
| vertriebsauftrag_active | sales_desk_requests | Aktiver Vertriebsauftrag |
| listings_published | listings | Aktive Listings für Projekt-Einheiten |
| distribution_active | listing_publications | Aktive Publications in Downstream-Modulen |

### Vertriebsauftrag → Distribution Flow

```text
SalesApprovalSection.tsx (MOD-13, Zone 2)
├── activateVertriebsauftrag()
│   ├── INSERT sales_desk_requests (status: 'approved')
│   ├── INSERT user_consents (3x Verträge)
│   └── createListingsForProject()
│       ├── INSERT properties + listings (status: 'active')
│       └── INSERT listing_publications (partner_network + optional kaufy)
▼
RLS Permissive Policies → Cross-Tenant Sichtbarkeit
├── MOD-08 (Investments/Suche) — alle Tenants
├── MOD-09 (Vertriebspartner/Katalog) — Partner-Tenants
└── Zone 3 (Kaufy) — öffentlich
```

## Magic Intake v2

### KI-Modelle
- **Exposé:** `google/gemini-2.5-pro` (maximale Präzision)
- **Preisliste:** `google/gemini-2.5-flash` (schnelles Tool-Calling)

### Sequenzielle Analyse
1. Exposé → extrahiert Projektdaten, WEG-Struktur, Bauträger
2. Preisliste → nutzt Exposé-Kontext für präziseres Mapping

### Erweiterte Felder
- Hausgeld, Instandhaltungsrücklage, Netto-Rendite, WEG-Zuordnung, Mietfaktor

### Review-Step
- Inline-Editing aller Zellen
- Einheit hinzufügen/entfernen
- Summenzeile
- Validierung vor Erstellung (Pflichtfelder, Duplikate, Ausreißer)

## Datenmodell

### Primäre Tabellen
- `developer_contexts` — Verkäufer-Gesellschaften
- `dev_projects` — Projekte (inkl. `invest_engine_analyzed` Boolean)
- `dev_project_units` — Einheiten
- `dev_project_reservations` — Reservierungen
- `dev_project_calculations` — Aufteilerkalkulation
- `dev_project_documents` — Dokument-Verknüpfungen

### DMS-Integration
Bei Projektanlage wird automatisch eine Ordnerstruktur in `storage_nodes` erstellt:
- `/{project_code}/01_expose/` — Exposé (inkl. registrierter Upload-Datei)
- `/{project_code}/02_preisliste/` — Preisliste (inkl. registrierter Upload-Datei)
- `/{project_code}/Einheiten/{unit_number}/` — Einheiten-Dokumente

## Projektakte (10-Block-Struktur)

| Block | Titel | Entität |
|-------|-------|---------|
| A | Identität & Status | dev_projects |
| B | Standort & Story | dev_projects |
| C | Einheiten | dev_project_units |
| D | Aufteilerkalkulation | dev_project_calculations |
| E | Preisliste & Provision | dev_project_units |
| F | Dokumente | storage_nodes |
| G | Reservierungen | dev_project_reservations |
| H | Vertrieb | dev_project_reservations |
| I | Verträge | dev_project_documents |
| J | Veröffentlichung | dev_projects |

## Integration

### Abhängigkeiten
- **MOD-02 (KI-Office):** Kontakte, Kalender
- **MOD-03 (DMS):** Dokumenten-Struktur
- **MOD-04 (Immobilien):** Immobilienakten-Erstellung aus Einheiten
- **MOD-08 (Investments):** InvestEngine nutzt SSOT-Komponenten (MasterGraph, SliderPanel, Haushaltsrechnung)
- **MOD-10 (Leads):** Lead Manager Inline-Integration
- **Zone 1 Sales Desk:** Projekt-Übergabe, Kill-Switch
- **Zone 3 Kaufy:** Marktplatz-Listings via listing_publications
