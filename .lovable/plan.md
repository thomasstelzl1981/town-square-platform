
# DMS-Widget: Immer geoeffneter Tree mit Spalten-Design

## Das Problem

Das aktuelle Widget zeigt eine Click-to-Reveal Miller-Column: Erst muss man "Allgemein" oder "Einheiten" anklicken, dann erscheint Spalte 2, dann Spalte 3. Das ist umstaendlich -- der Nutzer will sofort alles sehen.

## Die neue Idee

Zwei Bereiche, beide **immer offen und sichtbar**, vertikal untereinander:

```text
+===========================================================+
| [FolderOpen] Projektdokumente        [Neuer Ordner] [Upload] |
+===========================================================+
|                                                             |
| ALLGEMEIN                                                   |
| +------------------+--------------------------------------+ |
| | 01_Expose        | [Drop-Zone: Dateien hier ablegen]    | |
| | 02_Preisliste    |                                      | |
| | 03_Bilder & Mktg |                                      | |
| | 04_Kalkulation   |                                      | |
| | 05_Reservierungen|                                      | |
| | 06_Vertraege     |                                      | |
| | 99_Sonstiges     |                                      | |
| +------------------+--------------------------------------+ |
|                                                             |
| EINHEITEN (24)                                              |
| +------------------+------------------+-------------------+ |
| | WE-001           | 01_Grundriss     | [Drop-Zone]       | |
| | WE-002           | 02_Bilder        | Dateien hier      | |
| | WE-003 *         | 03_Verkaufsunt.  | ablegen           | |
| | WE-004           | 04_Vertraege     |                   | |
| | ...              | 99_Sonstiges     |                   | |
| | WE-024           |                  |                   | |
| +------------------+------------------+-------------------+ |
|                                                             |
| 31 Ordner · 0 Dateien                          Statusleiste |
+===========================================================+
```

## Funktionsweise

### Bereich "Allgemein" (2 Spalten, immer offen)
- **Spalte 1:** Die 7 Standard-Projektordner, alle sichtbar
- **Spalte 2:** Drop-Zone -- zeigt den aktiven Ordner-Namen und nimmt Dateien per Drag-and-Drop an
- Klick auf einen Ordner markiert ihn (Highlight), die Drop-Zone rechts zeigt "Dateien in 01_Expose ablegen"

### Bereich "Einheiten" (3 Spalten, immer offen)
- **Spalte 1:** Alle 24 Einheiten aufgereiht (scrollbar), immer sichtbar
- **Spalte 2:** Die 5 Unterordner der aktuell gewaehlten Einheit
- **Spalte 3:** Drop-Zone -- zeigt Zielordner + nimmt Dateien an
- Klick auf eine Einheit waehlt sie aus und zeigt deren Unterordner in Spalte 2
- Klick auf einen Unterordner markiert ihn, Spalte 3 zeigt "Dateien in WE-003 / 02_Bilder ablegen"
- Erste Einheit (WE-001) ist standardmaessig vorausgewaehlt

## Technische Umsetzung

**Datei:** `src/components/projekte/ProjectDMSWidget.tsx` -- kompletter Umbau

### State
- `selectedGeneralFolder: string | null` -- welcher Allgemein-Ordner ist aktiv
- `selectedUnitId: string | null` -- welche Einheit ist gewaehlt (default: erste)
- `selectedUnitFolder: string | null` -- welcher Einheiten-Unterordner ist aktiv

### Layout-Struktur
- Zwei visuell getrennte Sektionen mit Ueberschriften ("Allgemein", "Einheiten")
- Jede Sektion hat ihr eigenes Spalten-Grid mit `flex` und `divide-x`
- Die Drop-Zone-Spalte nutzt `FileDropZone` und zeigt dynamisch den Zielpfad an
- Einheiten-Spalte 1 bekommt `max-h-[300px] overflow-y-auto` (scrollbar bei 24 Eintraegen)

### Drop-Logik
- Allgemein-Drop: `onDrop(files, 'allgemein', selectedGeneralFolder)`
- Einheiten-Drop: `onDrop(files, 'einheit', selectedUnitId, selectedUnitFolder)`
- Im Demo-Modus: Drop deaktiviert, aber Navigation funktioniert

### Demo-Modus
- `opacity-60`, `pointer-events-none` auf den Drop-Zones
- Navigation in den Ordnern funktioniert trotzdem (zum Erkunden)
- "Musterdaten"-Badge bleibt in der Toolbar

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/ProjectDMSWidget.tsx` |

## Risiko

Niedrig. Nur eine UI-Komponente wird umgebaut. Keine DB-Aenderungen. Die FileDropZone-Komponente wird wiederverwendet.
