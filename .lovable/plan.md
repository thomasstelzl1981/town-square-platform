
# Vertragstabs verkleinern in Zuhause (MOD-20)

## Problem

Die Vertragskarten in den Zuhause-Tiles (Versorgung + Versicherungen) nutzen `aspect-square` Cards — das ergibt riesige quadratische Kacheln. In der Finanzanalyse (MOD-18) wurde bereits das kompakte `WidgetGrid` / `WidgetCell` System verwendet, das deutlich kleinere, uebersichtlichere Karten erzeugt.

## Loesung

Beide Tiles (VersorgungTile + VersicherungenTile) werden auf das gleiche Layout-Muster umgestellt wie in der Finanzanalyse:

- **IST-Karte** (Vertrag): Kompakte `WidgetCell` im `WidgetGrid` — kein `aspect-square` mehr, stattdessen die standardisierte `WIDGET_CELL.DIMENSIONS` Klasse (Desktop: quadratisch aber kleiner, Mobile: `h-[260px]`)
- **SOLL-Karte** (Vergleich): Bleibt direkt neben der IST-Karte, aber ebenfalls als kompakte `WidgetCell`

## Betroffene Dateien

### 1. `src/pages/portal/miety/tiles/VersorgungTile.tsx`

- Import von `WidgetGrid` und `WidgetCell` hinzufuegen
- Import der Design-Manifest-Konstanten (`CARD`, `HEADER`, `TYPOGRAPHY`, `DEMO_WIDGET`, `getActiveWidgetGlow`) hinzufuegen
- Aeusseres Layout aendern: Statt `grid grid-cols-1 sm:grid-cols-2 gap-4` pro Kategorie wird ein `WidgetGrid` verwendet, das alle IST+SOLL Karten in einem 4-Spalten-Grid zeigt (je 2 Karten pro Kategorie = IST + SOLL nebeneinander)
- IST-Card: `aspect-square` entfernen, in `WidgetCell` wrappen, kompaktes Layout (Icon + Titel + Preis + Zaehlerstand komprimiert)
- SOLL-Card: Gleiche Behandlung — in `WidgetCell` wrappen, `aspect-square` entfernen
- Zaehlerstand-Bereich innerhalb der IST-Karte wird kompakter dargestellt (kleinere Schrift, weniger Abstand)

### 2. `src/pages/portal/miety/tiles/VersicherungenTile.tsx`

- Gleiche Umstellung wie VersorgungTile
- Import von `WidgetGrid` und `WidgetCell`
- Layout-Wechsel von `grid grid-cols-1 sm:grid-cols-2 gap-4` auf `WidgetGrid`
- Beide Karten (IST + SOLL) in `WidgetCell` wrappen
- `h-[260px] sm:h-auto sm:aspect-square` durch `WidgetCell` Dimensionen ersetzen

## Layout-Ergebnis

```text
Desktop (4-Spalten-Grid):
+------------+------------+------------+------------+
| Strom IST  | Strom SOLL | Gas IST    | Gas SOLL   |
+------------+------------+------------+------------+
| Wasser IST | Wasser SOLL| Internet   | Platzhalter|
+------------+------------+------------+------------+

Mobile (1 Spalte):
+------------------------+
| Strom IST              |
+------------------------+
| Strom SOLL             |
+------------------------+
| Gas IST                |
+------------------------+
| ...                    |
```

Die Karten werden durch das `WidgetGrid`/`WidgetCell`-System automatisch auf die gleiche kompakte Groesse wie in der Finanzanalyse gebracht — konsistent ueber die gesamte Plattform.
