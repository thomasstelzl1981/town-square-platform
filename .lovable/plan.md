

# PV Live Widget -- Funktional machen

## Ist-Zustand

Das Widget existiert und zeigt Zahlen (Leistung, Energie, Offline-Count) an, hat aber:
- **Keine Grafik** -- kein visueller Hinweis, dass die Anlage arbeitet
- **Falscher Link** -- navigiert zu `/portal/photovoltaik/monitoring` (existiert nicht), sollte zu `/portal/photovoltaik/anlagen` gehen
- **Kein Lebenszeichen** -- nur statische Zahlen, keine Animation oder Kurve

## Loesung

Das Widget erhaelt eine **Mini-Tagesertragskurve** (Sparkline), die den aktuellen Erzeugungsverlauf der PV-Anlage zeigt. Die Kurve nutzt `generate24hCurve` aus dem DemoLiveGenerator und markiert die aktuelle Stunde mit einem Punkt. Dadurch sieht der Nutzer sofort, dass die Anlage arbeitet.

## Aenderungen

### Datei: `src/components/dashboard/widgets/PVLiveWidget.tsx`

1. **Mini-Chart hinzufuegen**: Eine Recharts `AreaChart` (Sparkline-Stil, ca. 60px hoch) zeigt die 24h-Erzeugungskurve der groessten Anlage. Der Bereich bis zur aktuellen Stunde wird gelb gefuellt, der Rest gestrichelt (Prognose). Ein Punkt markiert die aktuelle Leistung.

2. **Layout anpassen**: 
   - Oben: Titel "PV Live" mit Sonnen-Icon
   - Mitte: Mini-Chart (Sparkline)
   - Darunter: 3-Spalten-KPI-Reihe (Aktuelle Leistung, Heute kWh, Offline)
   - Unten: Top-Anlagen-Liste (wie bisher)

3. **Navigation korrigieren**: Link von `/portal/photovoltaik/monitoring` auf `/portal/photovoltaik/anlagen` aendern.

4. **Pulsierender Indikator**: Ein kleiner gruener Punkt neben "PV Live" pulsiert, wenn mindestens eine Anlage online ist -- visuelles Zeichen fuer "Anlage arbeitet".

### Technische Details

- `generate24hCurve(kwp)` liefert ein Array mit `{ hour, power_w, energy_kwh }` fuer jede halbe Stunde
- `getCurrentHourDecimal()` liefert die aktuelle Stunde als Dezimalzahl
- Die Kurve wird mit `recharts` (`AreaChart`, `Area`, `ReferenceDot`) als Sparkline ohne Achsenbeschriftung gerendert
- Der Gradient geht von Gelb (Sonne) nach Transparent
- Keine neuen Abhaengigkeiten noetig (recharts ist bereits installiert)

### Keine weiteren Dateien betroffen
Nur `PVLiveWidget.tsx` wird geaendert. Keine DB-Migration noetig.

