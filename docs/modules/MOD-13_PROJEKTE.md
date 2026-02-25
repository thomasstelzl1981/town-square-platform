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

## Beschreibung

Das Projekte-Modul (Display: "Projektmanager") bietet eine übergreifende Projekt-Management-Ansicht für Bauträger und Aufteiler. Es ermöglicht die vollständige Verwaltung von Mehreinheiten-Projekten von der KI-gestützten Akquisition bis zum Abverkauf.

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
- **Beschreibung:** Investorenperspektive auf die Preisliste
- **Funktionen:**
  - zVE/EK-Eingabe (wie MOD-08 Investment-Suche)
  - Tabellarische Preisliste mit Steuereffekt und Monatsbelastung nach Steuer
  - Klick auf Einheit → Vollbild-Exposé mit 40-Jahres-Projektion
  - AfA-Modell und Gebäudeanteil aus Projekt-Datenblatt vorbelegt

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
- `dev_projects` — Projekte
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
- **MOD-10 (Leads):** Lead Manager Inline-Integration
- **Zone 1 Sales Desk:** Projekt-Übergabe
- **Zone 3 Kaufy:** Marktplatz-Listings
