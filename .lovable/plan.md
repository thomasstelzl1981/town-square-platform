
# Berechnungsmodul Akquise-Manager — Bugfix, Seed-Korrektur & Redesign

## Gefundene Probleme

### Problem 1: Fehlende Jahresmiete (Hauptursache aller falschen Berechnungen)

Die CSV-Datei `public/demo-data/demo_acq_offers.csv` enthaelt KEIN Feld `noi_indicated`. In der Datenbank ist der Wert daher NULL. Da alle Berechnungen auf `offer.noi_indicated` basieren, ergibt sich:
- monthlyRent = 0, yearlyRent = 0
- Bruttorendite = 0%, Faktor = 0, Cashflow = 0
- Aufteiler-Verkaufspreis = 0 (Division Miete / Rendite = 0 / 4% = 0)
- Gewinn = negativer Betrag (nur Kosten, kein Erloees)

Die Jahresmiete laesst sich aus den vorhandenen Daten ableiten: `price_asking * yield_indicated / 100 = 2.400.000 * 4,8% = 115.200 EUR/Jahr`.

### Problem 2: ENGINE VIOLATION in QuickAnalysisBanner

Die `QuickAnalysisBanner`-Funktion (Zeilen 330-396 in ObjekteingangDetail.tsx) enthaelt ~20 Zeilen duplizierte Berechungslogik (Ankaufsnebenkosten, Finanzierbarkeit, Aufteiler-Gewinn), anstatt die Engine-Funktionen `calcBestandQuick` und `calcAufteilerFull` zu verwenden.

### Problem 3: Kein Fallback wenn noi_indicated fehlt

Selbst wenn die CSV korrigiert wird — es gibt keinen Fallback in der UI, der `noi_indicated` aus `price_asking * yield_indicated / 100` ableitet, falls der Wert fehlt. Das ist fragil.

### Problem 4: Ungleichmaessige Kachel-Groessen

Die Bestand- und Aufteiler-Kalkulationen stehen nebeneinander (`grid-cols-2`), haben aber voellig unterschiedliche Inhaltshoehen (Bestand: 5 Cards mit Charts; Aufteiler: 5 Cards mit anderen Inhalten). Das erzeugt ein unruhiges Layout.

## Loesung

### 1. CSV-Seed korrigieren

`public/demo-data/demo_acq_offers.csv` — Spalte `noi_indicated` hinzufuegen mit Wert `115200` (= 2.400.000 * 4,8%).

### 2. Fallback-Ableitung in ObjekteingangDetail.tsx

Vor der Uebergabe an Berechnungen eine Helper-Zeile einbauen:

```text
const yearlyRent = offer.noi_indicated 
  || (offer.price_asking && offer.yield_indicated 
      ? offer.price_asking * offer.yield_indicated / 100 
      : 0);
```

Diese wird fuer BestandCalculation (`monthlyRent: yearlyRent / 12`), AufteilerCalculation (`yearlyRent`) und QuickAnalysisBanner verwendet.

### 3. QuickAnalysisBanner auf Engine umstellen

Die inline-Berechnungen werden durch Aufrufe von `calcBestandQuick()` und `calcAufteilerFull()` ersetzt. Die Banner-Komponente wird zu einem reinen Renderer.

### 4. Layout-Redesign: Tabs statt Side-by-Side

Statt zwei Spalten mit ungleicher Hoehe wird ein **Tab-Layout** verwendet:
- Tab "Bestand (Hold)" → BestandCalculation (volle Breite)
- Tab "Aufteiler (Flip)" → AufteilerCalculation (volle Breite)

Dadurch haben beide Kalkulationen die gleiche Breite und es gibt keine Hoehen-Diskrepanz.

Die Schnellanalyse-Banner bleibt oberhalb der Tabs als kompakte KPI-Leiste (volle Breite, gleiche Kartenhoehe durch `items-stretch` auf dem Grid).

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| public/demo-data/demo_acq_offers.csv | Spalte `noi_indicated` mit Wert 115200 hinzufuegen |
| src/pages/portal/akquise-manager/ObjekteingangDetail.tsx | Fallback yearlyRent, QuickAnalysisBanner auf Engine umstellen, Kalkulations-Layout von grid-cols-2 auf Tabs umbauen, KPI-Grid mit `items-stretch` |

## Kein Modul-Freeze betroffen

Alle Dateien liegen in `src/pages/portal/akquise-manager/` (MOD-12 Pfad). Freeze-Status muss geprueft werden.

## Technische Details

### KPI-Banner nach Umbau (Pseudo-Code)

```text
const bestandQuick = calcBestandQuick({ purchasePrice, monthlyRent: yearlyRent / 12 });
const aufteilerFull = calcAufteilerFull({ purchasePrice, yearlyRent, ...AUFTEILER_DEFAULTS, projectCosts: 0 });

// Dann nur noch rendern:
Gesamtinvestition: bestandQuick.totalInvestment
Bruttorendite: bestandQuick.grossYield
EK-Bedarf: bestandQuick.equity
Gewinn (Flip): aufteilerFull.profit
Marge (Flip): aufteilerFull.profitMargin
```

### Tab-Layout (Pseudo-Code)

```text
<Tabs defaultValue="bestand">
  <TabsList>
    <TabsTrigger value="bestand">Bestand (Hold)</TabsTrigger>
    <TabsTrigger value="aufteiler">Aufteiler (Flip)</TabsTrigger>
  </TabsList>
  <TabsContent value="bestand">
    <BestandCalculation ... /> (volle Breite)
  </TabsContent>
  <TabsContent value="aufteiler">
    <AufteilerCalculation ... /> (volle Breite)
  </TabsContent>
</Tabs>
```
