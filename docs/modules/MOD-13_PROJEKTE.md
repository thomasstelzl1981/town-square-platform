# MOD-13: Projekte

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/projekte` |
| **Icon** | `FolderKanban` |
| **Org-Types** | `client`, `partner` |
| **Default Visible** | Ja |
| **Display Order** | 13 |

## Beschreibung

Das Projekte-Modul bietet eine übergreifende Projekt-Management-Ansicht für Bauträger und Aufteiler. Es ermöglicht die vollständige Verwaltung von Mehreinheiten-Projekten von der Akquisition bis zum Abverkauf.

## Tiles (4-Tile-Pattern)

### 1. Kontexte
- **Route:** `/portal/projekte/kontexte`
- **Beschreibung:** Verkäufer-Gesellschaften verwalten
- **Funktionen:**
  - Context-Anlage (GmbH, KG, Privat)
  - Context-Switcher
  - Steuer-/Rechtsdaten

### 2. Portfolio
- **Route:** `/portal/projekte/portfolio`
- **Beschreibung:** Projektliste mit Aufteiler-KPIs
- **Funktionen:**
  - Projekt-Übersicht
  - Status-Tracking (frei/reserviert/verkauft)
  - Marge & Fortschritts-Anzeige

### 3. Vertrieb
- **Route:** `/portal/projekte/vertrieb`
- **Beschreibung:** Reservierungen & Partner-Performance
- **Funktionen:**
  - Reservierungs-Workflow
  - Partner-Attribution
  - Provisions-Tracking

### 4. Marketing
- **Route:** `/portal/projekte/marketing`
- **Beschreibung:** Kaufy-Integration & Landingpages
- **Funktionen:**
  - Kaufy Marktplatz (kostenlos)
  - Premium-Platzierung (200€/Monat)
  - Projekt-Landingpage (200€/Monat)

## Datenmodell

### Primäre Tabellen
- `developer_contexts` — Verkäufer-Gesellschaften
- `dev_projects` — Projekte
- `dev_project_units` — Einheiten
- `dev_project_reservations` — Reservierungen
- `dev_project_calculations` — Aufteilerkalkulationen
- `dev_project_documents` — Dokument-Verknüpfungen

### DMS-Integration
Bei Projektanlage wird automatisch eine Ordnerstruktur in `storage_nodes` erstellt:
- `/{project_code}/Allgemein/` — Globalobjekt-Dokumente
- `/{project_code}/Einheiten/WE-XXX/` — Einheiten-Dokumente

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
- **Zone 1 Sales Desk:** Projekt-Übergabe
- **Zone 3 Kaufy:** Marktplatz-Listings
