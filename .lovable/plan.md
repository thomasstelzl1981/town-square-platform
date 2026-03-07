

# Fix: Renditefaktor-Kalkulation aus Basisdaten

## Problem

Die KPI-Kachel "Rendite / Faktor" (rechts oben, `ObjektKPIRow`) zeigt nur einen Wert, wenn `yield_indicated` in der Datenbank existiert (aus der KI-Extraktion). Wenn dieses Feld leer ist, aber Kaufpreis und Jahresmiete vorhanden sind, wird trotzdem "–" angezeigt — obwohl die Rendite trivial berechenbar ist.

## Loesung

In `ObjekteingangDetail.tsx` (Zeile 185): Statt nur `offer.yield_indicated` zu nutzen, die Rendite selbst berechnen aus den vorhandenen Basisdaten:

```
Bruttorendite = (yearlyRent / effectivePrice) * 100
Faktor = effectivePrice / yearlyRent
```

Dabei wird `effectivePrice` (inkl. Gegenvorschlag) und `yearlyRent` (bereits via `deriveYearlyRent` abgeleitet) verwendet — beides ist zu diesem Zeitpunkt im Code bereits berechnet.

## Aenderung

**Datei**: `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` — Zeile 185

Statt:
```tsx
yieldFactor={offer.yield_indicated ? `${offer.yield_indicated.toFixed(1)}% · ${(100 / offer.yield_indicated).toFixed(1)}x` : '–'}
```

Berechnung aus Basisdaten:
```tsx
const computedYield = effectivePrice > 0 && yearlyRent > 0
  ? (yearlyRent / effectivePrice) * 100
  : null;
// ...
yieldFactor={computedYield ? `${computedYield.toFixed(1)}% · ${(effectivePrice / yearlyRent).toFixed(1)}x` : '–'}
```

Das hat den Vorteil, dass der Faktor auch reagiert, wenn der Nutzer den Kaufpreis im Gegenvorschlag aendert — aktuell bleibt er statisch.

Eine Datei, eine Zeile. Kein Freeze-Konflikt.

