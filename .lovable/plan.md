
# Objekteingang: Mandate-Widgets + Tabelle CI-konform

## Was sich aendert

### 1. Mandate-Widgets oben (wie am Dashboard)

Aktuell fehlen im Objekteingang die Mandate-Kacheln komplett. Das wird korrigiert:

```text
+------------------+------------------+------------------+
| + NEUES MANDAT   | ACQ-2026-00001   | (weitere...)     |
| (Platzhalter)    | Fam. Investorius |                  |
+------------------+------------------+------------------+
```

- Links immer die `MandateCaseCardNew`-Kachel (leere Kalkulation / neues Mandat)
- Daneben die existierenden Mandate als `MandateCaseCard` (inkl. Seed-Daten-Mandat)
- Klick auf ein Mandat filtert die Tabelle auf dessen Objekte; Klick auf "Neues Mandat" navigiert zur Mandate-Erstellung
- Verwendung von `WidgetGrid` + `WidgetCell` (CI-Standard)

### 2. Tabelle immer ausgeklappt (starr, kein Collapsible)

Die Tabelle ist aktuell in einer `Card` gewrappt, aber nicht eingeklappt. Die Filter-Chips und die Tabelle werden jedoch CI-konform ueberarbeitet:

- **Wrapper**: `TABLE.WRAPPER` (glass-card rounded-xl overflow-hidden) statt generischer Card
- **Header-Zeile**: `TABLE.HEADER_BG` + `TABLE.HEADER_CELL` Klassen
- **Body-Zeilen**: `TABLE.ROW_HOVER` + `TABLE.ROW_BORDER` + `TABLE.BODY_CELL`
- Tabelle ist immer sichtbar, kein Collapse-Mechanismus

### 3. Filter-Chips bleiben oberhalb der Tabelle

Die bestehenden Filter-Chips (Alle, Eingegangen, In Analyse, etc.) und die Suchleiste bleiben erhalten — sie passen ins CI.

## Technische Umsetzung

### Datei: `src/pages/portal/akquise-manager/ObjekteingangList.tsx`

| Bereich | Aenderung |
|---------|-----------|
| Imports | `WidgetGrid`, `WidgetCell`, `MandateCaseCard`, `MandateCaseCardNew` und `DESIGN`/`TABLE` hinzufuegen |
| Neuer State | `selectedMandateId` (null = alle Mandate) fuer Widget-Filter |
| Vor Filter-Chips | Neuer Abschnitt "Mandate" mit `WidgetGrid` — `MandateCaseCardNew` links + alle Mandate als `MandateCaseCard` |
| Filter-Logik | `filteredOffers` erweitern um optionalen `selectedMandateId`-Filter |
| Tabelle Wrapper | `Card` → `div className={TABLE.WRAPPER}` |
| Tabelle Header | Grid-Zeile bekommt `TABLE.HEADER_BG` + `TABLE.HEADER_CELL` |
| Tabelle Rows | `TABLE.ROW_HOVER` + `TABLE.ROW_BORDER` + `TABLE.BODY_CELL` |

### Keine weiteren Dateien betroffen

Die `MandateCaseCard` und `MandateCaseCardNew` Komponenten existieren bereits und werden nur importiert.
