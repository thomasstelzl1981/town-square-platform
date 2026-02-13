
# Reparatur: Portfolio Demo-Daten fuer Charts, EUeR und Tabelle

## Ursache

Die DB-Migration hat die Leipzig-Property geloescht. Danach ist `properties` leer. Alle visuellen Sektionen (Vermoegenschart, EUeR, Investmentkalkulation, Immobilientabelle) pruefen `hasData` (`displayUnits.length > 0`), was jetzt immer `false` ist. Nur das Demo-Widget und die UnitDossierView (Klick auf Demo-Widget) funktionieren noch, weil sie hartcodierte Daten nutzen.

## Loesung: Demo-Fallback-Daten fuer alle Sektionen

Wenn keine echten DB-Daten vorhanden sind UND das Demo-Feature aktiviert ist (`demoEnabled`), werden hartcodierte Demo-Werte in die bestehenden Variablen injiziert. Dadurch sehen alle Sektionen — Charts, EUeR, Tabelle — sofort realistische Daten.

### Aenderung in einer Datei: `src/pages/portal/immobilien/PortfolioTab.tsx`

**1. Demo-Totals Konstante** (nach DEMO_DOSSIER_DATA, ca. Zeile 751):

Neue Konstante `DEMO_TOTALS` mit den Aggregatwerten passend zur Demo-Akte Berlin:
- 3 Einheiten, 1 Objekt, 202 m2 Flaeche
- Verkehrswert 850.000, Restschuld 520.000
- Jahresmiete 10.200, Annuitaet 24.960 (2.080 x 12)
- Zinssatz 2.8%, Rendite 3.95%

**2. Demo-DisplayUnits** (ca. Zeile 519):

Wenn `displayUnits` leer ist und `demoEnabled`, wird ein Array mit 3 Demo-Einheiten (WE-B01, WE-B02, WE-B03) als Fallback gesetzt. Diese Einheiten erscheinen in der Immobilientabelle.

**3. Demo-Injection in totals/amortizationData/projectionData/eurChartData**:

Alle `useMemo`-Berechnungen bekommen eine Fallback-Logik:
- `totals`: Wenn keine echten Daten, nutze `DEMO_TOTALS`
- `amortizationData`: Berechnet 30-Jahres-Projektion aus DEMO_TOTALS
- `projectionData`: Berechnet Investmentkalkulation aus DEMO_TOTALS
- `eurChartData`: Berechnet EUeR aus DEMO_TOTALS

**4. hasData-Logik anpassen** (Zeile 520):

```text
const hasData = displayUnits.length > 0 || (demoEnabled && !unitsWithProperties?.length);
```

So werden Charts, EUeR und Tabelle auch im reinen Demo-Modus angezeigt.

### Ergebnis

Ohne echte DB-Daten zeigt das Portfolio-Dashboard:
- 4 KPI-StatCards mit Demo-Werten
- Vermoegensentwicklung-Chart (30 Jahre) mit Objektwert, Restschuld, Netto-Vermoegen
- Monatliche EUeR mit Einnahmen/Ausgaben
- Immobilientabelle mit 3 Demo-Einheiten (Berlin)
- Investmentkalkulation (10/30 Jahre)

Sobald echte Daten in der DB vorhanden sind, werden diese automatisch bevorzugt.

### Betroffene Dateien

Nur eine Datei: `src/pages/portal/immobilien/PortfolioTab.tsx`
