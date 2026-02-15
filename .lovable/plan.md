
# Konten-Widgets auf CI-Standard umstellen (4 Spalten)

## Problem

Die Konten-Kacheln nutzen aktuell `RECORD_CARD.GRID` (2 Spalten, md:grid-cols-2). Der CI-Standard fuer Widgets ist aber das `WidgetGrid` mit 4 Spalten (`lg:grid-cols-4`) und quadratischen `WidgetCell`-Zellen.

## Loesung

Den gesamten Konten-Block in `UebersichtTab.tsx` von `RECORD_CARD.GRID` auf `WidgetGrid` + `WidgetCell` umstellen. So passen 4 Konten nebeneinander in eine Reihe.

## Aenderungen in `src/pages/portal/finanzanalyse/UebersichtTab.tsx`

1. **Imports hinzufuegen**: `WidgetGrid` und `WidgetCell` aus `@/components/shared/`

2. **Grid-Container ersetzen**:
   - ALT: `<div className={RECORD_CARD.GRID}>` (2 Spalten)
   - NEU: `<WidgetGrid>` (4 Spalten, aspect-square)

3. **Jede Konto-Kachel in `WidgetCell` wrappen**:
   - Demo-Widget, echte Konten und CTA-Widget jeweils in `<WidgetCell>` einpacken
   - Die bisherigen `RECORD_CARD.CLOSED`-Klassen werden durch die standardmaessigen `WidgetCell`-Dimensionen ersetzt (aspect-square Desktop, 260px Mobil)
   - Card-Styling (glass-card, hover, border) bleibt erhalten

4. **KontoAkteInline bleibt ausserhalb des Grids**, wird nach dem `</WidgetGrid>` gerendert (span-2 ist bereits gesetzt via `md:col-span-2` in der Komponente — das muss ggf. auf volle Breite angepasst werden, da das Grid jetzt 4 Spalten hat)

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | RECORD_CARD.GRID → WidgetGrid/WidgetCell, ca. 15 Zeilen |
