

# "2 Antragsteller"-Badge und Trennstrich am Einstieg entfernen

## Zusammenfassung

Im Sticky-Header der Selbstauskunft (`SelbstauskunftFormV2.tsx`) werden zwei Elemente entfernt:

1. **Badge "2 Antragsteller"** (Zeilen 373-378) — der bedingt angezeigte Badge mit Users-Icon
2. **Der Trennstrich** (`border-b` auf dem Sticky-Header-Container, Zeile 370) — die horizontale Linie unterhalb des Headers

## Aenderung

**Datei:** `src/components/finanzierung/SelbstauskunftFormV2.tsx`

- Zeile 370: `border-b` aus den Klassen des Sticky-Headers entfernen
- Zeilen 373-378: Den gesamten Block mit dem `hasCoData`-Badge entfernen (inkl. des umschliessenden `<div>`)

Der Rest des Sticky-Headers (Completion-Badge, "Aus Vermietereinheit"-Button, Speichern-Button) bleibt unveraendert.

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| EDIT | `src/components/finanzierung/SelbstauskunftFormV2.tsx` — Badge + border-b entfernen |

Keine weiteren Dateien betroffen. Keine Datenbank-Aenderungen.

