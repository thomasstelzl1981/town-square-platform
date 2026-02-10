
# DMS-Widget Umbau: Echte Column-View mit Drag-and-Drop pro Ordner

## Problem

Das aktuelle `ProjectDMSWidget` zeigt einen verschachtelten Ordnerbaum mit einem separaten Drag-and-Drop-Feld ganz unten. Das ist weder uebersichtlich noch praxistauglich. Der Nutzer muss Dokumente direkt in den richtigen Ordner (z.B. die passende Einheit) ziehen koennen.

## Loesung

Das Widget wird komplett auf ein **Column-Layout** umgebaut -- analog zur bestehenden `ColumnView` im DMS (MOD-03). Drei Spalten nebeneinander:

```text
+-------------------+--------------------+---------------------+
| Spalte 1          | Spalte 2           | Spalte 3            |
| (Root-Ebene)      | (gewaehlter Ordner)| (Unterordner/Files) |
|                   |                    |                     |
| > Allgemein       | 01_Expose          | [Drop-Zone]         |
|   Einheiten (24)  | 02_Preisliste      | Dateien hier        |
|                   | 03_Bilder          | ablegen             |
|                   | ...                |                     |
|                   |                    |                     |
| oder:             | oder:              |                     |
|                   | WE-001             | 01_Grundriss        |
|                   | WE-002             | 02_Bilder           |
|                   | WE-003             | 03_Verkaufsunterla. |
|                   | ...                | 04_Vertraege        |
+-------------------+--------------------+---------------------+
```

Jede Spalte ist scrollbar. Die letzte aktive Spalte (= der aktuell angewaehlt Ordner) fungiert automatisch als **Drop-Zone**: Dateien, die dorthin gezogen werden, landen im richtigen `storage_node`.

## Aenderungen

### 1. ProjectDMSWidget komplett umbauen

**Datei:** `src/components/projekte/ProjectDMSWidget.tsx`

- Weg mit dem verschachtelten `FolderRow`-Baum und dem separaten Drop-Feld
- Stattdessen: **3-Spalten-Miller-Column-Layout** (analog zu `ColumnView`)
- State: `columnPath: string[]` -- trackt den Navigations-Pfad durch die Ordnerstruktur
- Jede Spalte zeigt die Kinder des ausgewaehlten Ordners
- Klick auf einen Ordner oeffnet dessen Inhalt in der naechsten Spalte
- Die letzte offene Spalte hat eine integrierte `FileDropZone`
- Toolbar bleibt oben (Upload-Button, Neuer-Ordner-Button)

### 2. Demo-Daten als Spalten-Items

- Die Demo-Ordnerstruktur (PROJECT_FOLDERS, UNIT_FOLDERS) wird als flache Item-Listen pro Spalte aufbereitet
- Jeder Ordner bekommt eine eindeutige Demo-ID (z.B. `demo-folder-allgemein`, `demo-folder-einheiten`, `demo-unit-WE-001`)
- Im Demo-Modus: `opacity-60`, Drop deaktiviert, aber Navigation funktioniert
- Im echten Modus: Daten kommen aus `storage_nodes` via Props, Drop triggert Upload

### 3. Drop-Logik pro Spalte

- `FileDropZone` umschliesst die aktive (letzte) Spalte
- `onDrop` uebergibt die Dateien zusammen mit der aktuellen `targetNodeId` (= der Ordner, in den gedroppt wird)
- Die `onUploadFiles`-Prop wird erweitert zu `onUploadFiles(files: File[], targetNodeId: string)`

### 4. Spalten-Styling

- Spaltenbreite: `min-w-[200px]` mit `flex-1`
- Trennlinien zwischen Spalten (`border-r`)
- Ordner-Icons + Chevrons wie in der bestehenden `ColumnView`
- Datei-Icons basierend auf MIME-Type
- Hover-Effekte und Selektion-Highlighting
- Max-Hoehe mit eigenem Scroll pro Spalte

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/ProjectDMSWidget.tsx` |

## Seitenstruktur DMS-Widget nach Umbau

```text
+----------------------------------------------------------+
| [FolderOpen] Projektdokumente    [Neuer Ordner] [Upload] |
+----------------------------------------------------------+
| Allgemein     | 01_Expose         | [FileDropZone]       |
| Einheiten(24) | 02_Preisliste     | Dateien hier ablegen |
|               | 03_Bilder         |                      |
|               | 04_Kalkulation    |                      |
|               | 05_Reservierungen |                      |
|               | 06_Vertraege      |                      |
|               | 99_Sonstiges      |                      |
+----------------------------------------------------------+
| oder nach Klick auf "Einheiten":                         |
+----------------------------------------------------------+
| Allgemein     | WE-001            | 01_Grundriss    [DZ] |
| Einheiten(24)*| WE-002            | 02_Bilder            |
|               | WE-003            | 03_Verkaufsunt.      |
|               | ...               | 04_Vertraege         |
|               | WE-024            | 99_Sonstiges         |
+----------------------------------------------------------+
| 2 Ordner · 0 Dateien                          Status-Bar |
+----------------------------------------------------------+
```

## Risiko

Niedrig. Nur eine Datei wird geaendert. Die Column-Logik ist bereits im DMS erprobt (ColumnView). Keine DB-Aenderungen.
