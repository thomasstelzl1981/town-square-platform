

# MOD-13: Portfolio Redesign -- Globalobjekt-Kachel, Stellplaetze, DMS-Upgrade

## Uebersicht

Die PortfolioTab-Seite wird vereinfacht und aufgewertet. Die Projekt-Widget-Kachelreihe und der "Neues Projekt"-Button werden entfernt (Projekte werden am Dashboard angelegt). Stattdessen geht es direkt unter der Ueberschrift mit einer grossen Globalobjekt-Beschreibung los.

## Aenderungen

### 1. Kachelreihe und "Neues Projekt"-Button entfernen

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

- Die gesamte Projekt-Widget-Kachelreihe (ProjectCard Grid, Zeilen 96-113) wird entfernt
- Der "Neues Projekt"-Button und der QuickIntakeUploader aus dem Header werden entfernt
- Die Imports fuer `ProjectCard`, `ProjectCardPlaceholder`, `Plus`, `CreateProjectDialog` und `QuickIntakeUploader` werden bereinigt
- Der Header behaelt nur die Ueberschrift und den Gesellschafts-Filter (Select)

### 2. Neue Globalobjekt-Beschreibungskachel (ImmoScout24-Stil)

**Neue Datei:** `src/components/projekte/ProjectOverviewCard.tsx`

Grosse Kachel direkt unter der Ueberschrift mit zwei Spalten:

**Linke Spalte (ca. 40%):**
- Bildergalerie-Platzhalter mit Durchklick-Dots (4 Bilder)
- Im Demo-Modus: Graue Flaechen mit "Beispielbilder" Text

**Rechte Spalte (ca. 60%):**
- Projektname als Titel
- Adresse mit PLZ und Stadt
- Allgemeine Objektbeschreibung (2-3 Absaetze: Lage, Ausstattung, Konzept)
- Eckdaten-Grid:
  - Wohneinheiten: 24
  - Stellplaetze: 24
  - Wohnflaeche gesamt: ca. 1.540 m2
  - Baujahr: 1998 / Sanierung 2021
  - Heizart: Zentralheizung (Gas)
  - Energieklasse: B
  - Gesamtverkaufspreis: 7.200.000 EUR

Im Demo-Modus mit `opacity-60` und "Musterdaten"-Badge.

### 3. Stellplatz-Spalte in Preisliste

**Datei:** `src/components/projekte/UnitPreislisteTable.tsx`

Neue Spalte "Stellplatz" in der Tabelle:
- Fester Demo-Wert: 20.000 EUR pro Einheit
- Wird in der Summenzeile aufsummiert (24 x 20.000 = 480.000 EUR)

**Datei:** `src/components/projekte/demoProjectData.ts`

- `DemoUnit` Interface bekommt `parking_price: number`
- Alle Demo-Units bekommen `parking_price: 20_000`

### 4. DMS-Widget: StorageFileManager-Design mit Drag-and-Drop

**Datei:** `src/components/projekte/ProjectDMSWidget.tsx`

Kompletter Umbau zum echten Storage-Look:
- Toolbar oben (Ordnername, Upload-Button, Neuer-Ordner-Button)
- Listendarstellung mit Icons, Dateigroessen, Datums-Spalten
- Drag-and-Drop-Zone umschliesst die gesamte Kachel
- Im Demo-Modus: Gleiche Ordnerstruktur, aber im modernen Listview-Stil mit `opacity-60` und "Musterdaten"-Badge
- Im echten Modus: Ordner klickbar, Upload via Drag-and-Drop funktional

### 5. Demo-Daten erweitern

**Datei:** `src/components/projekte/demoProjectData.ts`

- Neue Konstante `DEMO_PROJECT_DESCRIPTION` mit 3 Absaetzen (Lage, Ausstattung, Sanierungskonzept)
- `total_parking_spaces: 24`, `total_living_area: 1540`
- `parking_price: 20_000` in allen DEMO_UNITS

## Seitenstruktur nach Umbau

```text
+----------------------------------------------------------+
| PROJEKT-PORTFOLIO (Headline)           [Gesellschaft v]  |
+----------------------------------------------------------+
| +------------------------+-----------------------------+ |
| | [Bild 1] [Bild 2] ... | Residenz am Stadtpark       | |
| | Platzhalter-Galerie    | Am Stadtpark 12, 80331 Muc  | |
| |  o  o  o  o            |                             | |
| |                        | Beschreibungstext ueber     | |
| |                        | Lage, Ausstattung, Konzept  | |
| |                        |                             | |
| |                        | 24 WE | 24 TG | 1540 m2    | |
| |                        | 1998  | Gas   | Klasse B    | |
| +------------------------+-----------------------------+ |
+----------------------------------------------------------+
| Preisliste (inkl. Stellplatz-Spalte)        | Sticky     |
| ID | WE | Typ | m2 | Netto | NK | Rendite | Kalkulator |
| Preis | Prov | Stellplatz | EUR/m2 | Status|            |
| ...24 Zeilen...                             |            |
| SUMME (inkl. Stellplaetze)                  |            |
+----------------------------------------------------------+
| Projektdokumente (StorageFileManager-Stil)               |
| [Toolbar: Ordner / Upload / Neuer Ordner]                |
| Allgemein/                                               |
|   01_Expose / 02_Preisliste / ...                        |
| Einheiten/                                               |
|   WE-001/ WE-002/ ...                                    |
+----------------------------------------------------------+
```

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Erstellen | `src/components/projekte/ProjectOverviewCard.tsx` |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |
| Aendern | `src/components/projekte/UnitPreislisteTable.tsx` |
| Aendern | `src/components/projekte/ProjectDMSWidget.tsx` |
| Aendern | `src/components/projekte/demoProjectData.ts` |

## Risiko

Niedrig. Keine DB-Aenderungen. Die Kachelreihe wird entfernt, alle anderen Aenderungen sind additiv. Die Globalobjekt-Kachel ist eine neue Komponente. Stellplatz-Spalte ist eine einfache Erweiterung.

