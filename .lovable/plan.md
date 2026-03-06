

# Fix: Objektdaten-Sektionen 1–3 im Gutachten-Reader + Foto-Grid

## Problem

Der `ValuationReportReader` startet bei **Sektion 1 (Deckblatt)** nur mit den KPI-Boxen (Marktwert/Beleihungswert), zeigt aber **keine Objektdaten** — keine Adresse, kein Baujahr, keine Flächen, keine Objektart, kein Zustand. Die Sektionsnummern springen direkt von 1 (Deckblatt) zu 2 (Grundbuch), 3 (Standort), 4 (Bodenwert). Es fehlen die eigentlichen Immobilien-Stammdaten als eigenständige Kacheln.

Auch im PDF (Seite 3 "Objektdaten") werden die Daten nur angezeigt, wenn der `snapshot` korrekt befüllt ist — das wurde im letzten Fix adressiert, aber der Web-Reader hat die gleiche Lücke.

## Plan

### 1. Snapshot-Daten an den ReportReader durchreichen

`PropertyValuationTab.tsx` übergibt aktuell keinen `snapshot` an `<ValuationReportReader>`. Neue Prop `snapshot` hinzufügen und `r.snapshot` durchreichen.

### 2. Neue Sektion im ReportReader: "Objektdaten & Gebäudeangaben" (nach Deckblatt, vor Grundbuch)

Direkt nach dem Deckblatt (Sektion 1) eine neue Kachel einfügen:

**Sektion 1b — Objektsteckbrief**
- Adresse (Straße, PLZ, Ort)
- Objektart (ETW/MFH/EFH/etc.)
- Baujahr
- Wohnfläche, Nutzfläche, Grundstücksfläche
- Zimmer, Etagen, Stellplätze
- Zustand, Energieklasse
- Kaltmiete, Hausgeld, Vermietungsstatus
- Modernisierungen (Liste)

Das sind alles Felder aus `CanonicalPropertySnapshot`, die bereits im `snapshot` vorhanden sind.

### 3. Foto-Grid (8 Slots, Drag-and-Drop Upload)

Eine neue Kachel **"Objektfotos"** im Bewertungs-Tab, ähnlich dem bestehenden `RecordCardGallery`-Pattern aber mit 8 Slots statt 4. Fotos werden in den Datenraum (Storage) des Objekts hochgeladen und über `storage_nodes` referenziert.

**Technisch:**
- Neue Komponente `ValuationPhotoGrid.tsx` in `src/components/shared/valuation/`
- Nutzt `useUniversalUpload` für den Upload
- Liest Fotos aus `storage_nodes` mit `document_type = 'photo'` oder einem Tag-System
- 8 Slots im 4×2 Grid, Drag-and-Drop via `react-dropzone`
- Fotos werden später in Phase 2b auch ins PDF eingebettet

### 4. Sektionsnummern korrigieren

Aktuelle Nummerierung: 2 (Grundbuch), 3 (Standort), 4 (Bodenwert), 5 (Ertragswert MWT)...
Neue Nummerierung nach Einfügung: 1 (Deckblatt+Objektsteckbrief), 2 (Grundbuch), 3 (Standort), 4 (Bodenwert)... — bleibt gleich, der Objektsteckbrief wird Teil von Sektion 1.

## Dateien

| Datei | Änderung |
|-------|----------|
| `ValuationReportReader.tsx` | Neue Prop `snapshot`, neue Objektdaten-Kachel nach Deckblatt |
| `PropertyValuationTab.tsx` | `snapshot={r.snapshot}` an ReportReader übergeben |
| `ValuationPhotoGrid.tsx` (neu) | 8-Slot Foto-Grid mit Upload, in `src/components/shared/valuation/` |
| `src/components/shared/valuation/index.ts` | Export ergänzen |

Keine DB-Migration nötig. Keine Engine-Änderung.

