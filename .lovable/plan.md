
# Kalender-Seite: Rechte Kachel (Tagesdetails) verkleinern

## Problem

Die rechte Spalte hat zwei Karten:
1. **Tagesdetails** mit `ScrollArea h-[400px]` — zu gross
2. **Schnellzugriff** — zusaetzliche Hoehe

Zusammen sind sie deutlich laenger als die Kalender-Kachel links (col-span-8). Das wirkt ungleichmaessig.

## Loesung

Die ScrollArea der Tagesdetails von `h-[400px]` auf `h-[280px]` reduzieren. Damit passen beide rechte Karten besser zur Hoehe der linken Kalender-Karte.

## Technische Aenderung

**Datei:** `src/pages/portal/office/KalenderTab.tsx`

**Zeile 556:**
```
// Vorher
<ScrollArea className="h-[400px]">

// Nachher
<ScrollArea className="h-[280px]">
```

Das ist die einzige Aenderung. Die Kacheln werden dadurch homogener in der Gesamthoehe.
