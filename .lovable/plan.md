
# Preisliste + Kalkulator: 5 Verbesserungen

## 1. Stellplatzpreise editierbar machen

In `UnitPreislisteTable.tsx` wird die Stellplatz-Spalte (aktuell nur Anzeige `eur(u.parking_price)`) durch eine `EditableCell` ersetzt. Der Callback `onUnitPriceChange` wird um den Feldtyp `'parking_price'` erweitert.

In `PortfolioTab.tsx` wird `handleUnitPriceChange` erweitert, um `parking_price` Overrides zu speichern. Der Override-State `unitOverrides` bekommt ein optionales `parking_price`-Feld. Die `calculatedUnits`-Berechnung uebernimmt den Override oder den Default (20.000 EUR).

## 2. Status aenderbar machen (Dropdown)

Der `DemoUnit`-Typ in `demoProjectData.ts` wird von `status: 'available'` auf `status: 'available' | 'reserved' | 'notary' | 'sold'` erweitert.

Die Status-Map in `UnitPreislisteTable.tsx` bekommt einen neuen Eintrag `notary` (Label "Notar", blaue Farbe). Die Badge-Zelle wird durch ein klickbares Dropdown (Select) ersetzt. Ein neuer Callback `onStatusChange(unitId, newStatus)` wird vom PortfolioTab durchgereicht.

In `PortfolioTab.tsx` wird ein separater State `unitStatusOverrides: Record<string, string>` gefuehrt. Der Status-Override wird in `calculatedUnits` eingeflochten.

## 3. PieChart durch kompaktes Balkendiagramm ersetzen

In `StickyCalculatorPanel.tsx` wird der PieChart (~160px Hoehe) durch ein horizontales gestapeltes Balkendiagramm ersetzt. Dafuer wird `BarChart` aus recharts verwendet. Ein einzelner horizontaler Balken zeigt die drei Segmente (Investitionskosten, Provision, Marge) nebeneinander. Hoehe: ca. 60px statt 160px. Die Legende bleibt darunter.

## 4. Kalkulator-Hoehe reduzieren

Konkrete Massnahmen in `StickyCalculatorPanel.tsx`:
- PieChart-Bereich von 160px auf ~60px (Balkendiagramm)
- Paddings und Margins reduzieren: `space-y-4` auf `space-y-2.5`, `pb-3` auf `pb-2`
- KPI-Grid kompakter: `space-y-2` auf `space-y-1.5`
- Gesamthoehe sinkt um ca. 150-200px

## 5. Zwei redundante KPI-Zeilen entfernen

Im KPI-Bereich von `StickyCalculatorPanel.tsx` (Zeilen 203-212) werden die beiden Zeilen "Ø Ist-Rendite" und "Zielrendite" komplett geloescht. Diese Werte sind redundant, da die Endkundenrendite bereits ueber den Slider gesteuert wird und die tatsaechliche Rendite pro Einheit in der Preisliste sichtbar ist. Das spart zusaetzlich Hoehe im Kalkulator.

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/demoProjectData.ts` (Status-Typ erweitern) |
| Aendern | `src/components/projekte/UnitPreislisteTable.tsx` (Stellplatz editierbar, Status-Dropdown) |
| Aendern | `src/components/projekte/StickyCalculatorPanel.tsx` (Balkendiagramm, kompaktere Hoehe, 2 KPI-Zeilen entfernen) |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` (parking + status Overrides) |

## Risiko

Niedrig. Bestehende Berechnungslogik wird nicht veraendert, nur erweitert (Stellplatz-Override, Status-Override). Chart-Tausch und Zeilen-Entfernung sind rein visuell.
