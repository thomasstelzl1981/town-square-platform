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

Das Projekte-Modul bietet eine übergreifende Projekt-Management-Ansicht für komplexe Vorhaben wie Immobilien-Sanierungen, Investitionsprojekte oder Vertriebskampagnen.

## Tiles (4-Tile-Pattern)

### 1. Übersicht
- **Route:** `/portal/projekte/uebersicht`
- **Beschreibung:** Alle Projekte im Überblick
- **Ansichten:**
  - Kanban-Board
  - Listen-Ansicht
  - Projekt-Cards

### 2. Portfolio
- **Route:** `/portal/projekte/portfolio`
- **Beschreibung:** Projekt-Portfolio-Management
- **Funktionen:**
  - Ressourcen-Allokation
  - Budget-Tracking
  - Prioritäten-Matrix

### 3. Timeline
- **Route:** `/portal/projekte/timeline`
- **Beschreibung:** Zeitplanung und Meilensteine
- **Funktionen:**
  - Gantt-Chart
  - Meilenstein-Tracking
  - Abhängigkeiten

### 4. Einstellungen
- **Route:** `/portal/projekte/einstellungen`
- **Beschreibung:** Projekt-Konfiguration
- **Funktionen:**
  - Vorlagen
  - Status-Definitionen
  - Benachrichtigungen

## Datenmodell

### Primäre Tabellen
- `projects` — Projekte (zu erstellen)
- `project_tasks` — Aufgaben
- `project_milestones` — Meilensteine
- `cases` — Integration mit Case-System

## Integration

### Abhängigkeiten
- **MOD-04 (Immobilien):** Objekt-Projekte
- **MOD-19 (Photovoltaik):** PV-Projekte
- **MOD-02 (KI Office):** Kalender-Sync
