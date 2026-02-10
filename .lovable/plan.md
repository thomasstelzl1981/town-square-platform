
# Kalkulator-Reparatur: Berechnungslogik nach Akquise-Manager-Vorbild

## Kernproblem

Die Demo-Daten und die Berechnungslogik passen nicht zusammen:

1. **Demo-Daten**: `annual_net_rent` wird aus `Kaufpreis * 4%` berechnet, aber `list_price` aus `Verkaufspreis-Anteil`. Dadurch ergibt die Rueckrechnung ~2,67% statt 4%.
2. **targetYield-Slider**: Aendert einen State-Wert, der nirgends in die Preisberechnung einfliesst.
3. **Provision**: Wird nur als Anzeige berechnet, veraendert aber keine Preise.

## Loesung: Akquise-Manager-Formel uebernehmen

Die Kernformel aus `AufteilerCalculation.tsx` (Zeile 81):

```text
Verkaufspreis_brutto = Jahresnettomiete / (Zielrendite / 100)
```

Diese Formel wird zur Basis fuer die Preisfindung in MOD-13.

## Neue Berechnungskette

```text
EINGABEN:
  Investitionskosten        z.B. 4.800.000 EUR
  Provision (Slider)        5-15%, Default 10%
  Endkundenrendite (Slider) 2-8%, Default 4.0%
  Preisanpassung (+/-)      -20% bis +20%, Default 0%
  Manuelle Einzelpreis-Overrides (Tabelle)

BERECHNUNG PRO EINHEIT:
  1. Basispreis = Jahresnetto_i / (Endkundenrendite / 100)
     → Bei 4% und 7.680 EUR Jahresnetto = 192.000 EUR

  2. Falls manueller Override vorhanden → Override-Preis verwenden

  3. Preisanpassung anwenden:
     effektiver_preis = basispreis * (1 + Preisanpassung/100)

  4. Rendite rueckrechnen (fuer Anzeige):
     ist_rendite = Jahresnetto / effektiver_preis * 100

  5. EUR/m² = effektiver_preis / Flaeche

  6. Provision pro Einheit = effektiver_preis * Provisionssatz

GESAMTKALKULATION:
  Gesamtverkauf      = Summe aller effektiven Preise
  Provision_abs      = Gesamtverkauf * Provisionssatz
  Marge_abs          = Gesamtverkauf - Investitionskosten - Provision_abs
  Marge_%            = Marge_abs / Gesamtverkauf * 100
  Gewinn/Einheit     = Marge_abs / Anzahl Einheiten
  Ø Ist-Rendite      = Durchschnitt aller ist_renditen
```

### Wie die Slider jetzt wirken

**Endkundenrendite-Slider (NEU - jetzt funktional):**
- Veraendert den Basispreis aller Einheiten: `Preis = Miete / Rendite`
- Niedrigere Rendite → hoeherer Preis → hoehere Marge
- Hoehere Rendite → niedrigerer Preis → niedrigere Marge

**Provision-Slider:**
- Veraendert die Provisionshoehe, die von der Marge abgezogen wird
- Preise bleiben gleich, Marge sinkt/steigt

**Preisanpassung (+/-):**
- Multipliziert alle Preise proportional
- Ist-Rendite veraendert sich entsprechend

**Manuelle Einzelpreise:**
- Override pro Einheit, Preisanpassung wirkt NICHT auf Overrides (sind absolut)
- Ist-Rendite der Einheit wird rueckgerechnet

## Aenderungen

### 1. demoProjectData.ts — Daten korrigieren

Die Demo-Daten muessen konsistent sein. Die `annual_net_rent` bleibt wie sie ist (berechnet aus Kaufpreis-Anteil * 4%). Aber `list_price` wird NICHT mehr aus TOTAL_SALE berechnet, sondern ergibt sich dynamisch aus der Rendite-Formel im PortfolioTab. Die statischen Werte `list_price`, `yield_percent`, `price_per_sqm`, `provision_eur` in den Demo-Daten werden zu Referenzwerten degradiert — die tatsaechlichen Anzeige-Werte kommen aus `calculatedUnits`.

Keine Aenderung an der Datei noetig, da die Berechnung im PortfolioTab die Demo-Werte ueberschreibt.

### 2. PortfolioTab.tsx — Berechnungslogik ueberarbeiten

Der `useMemo`-Block fuer `calculatedUnits` wird komplett neu geschrieben:

```text
Fuer jede Einheit:
  1. basispreis = unit.annual_net_rent / targetYield
  2. Wenn Override vorhanden → Override als Basispreis nehmen
  3. effektiver_preis = basispreis * (1 + priceAdjustment/100)
     ABER: Overrides sind absolut, Preisanpassung wirkt NICHT auf sie
  4. ist_rendite = unit.annual_net_rent / effektiver_preis * 100
  5. eur_pro_qm = effektiver_preis / unit.area_sqm
  6. provision = effektiver_preis * provisionRate
```

### 3. StickyCalculatorPanel.tsx — Anzeige anpassen

Minimale Aenderungen:
- "Ø Ist-Rendite" zeigt den tatsaechlichen Durchschnitt (rueckgerechnet aus Preisen)
- "Zielrendite" zeigt den Slider-Wert
- Farbvergleich bleibt: gruen wenn Ist >= Ziel, rot wenn darunter
- Die Ist-Rendite wird sich bei Default-Einstellungen (4% Slider, 0% Anpassung) exakt mit der Zielrendite decken

### 4. UnitPreislisteTable.tsx — Override-Logik anpassen

Die `onUnitPriceChange`-Funktion im PortfolioTab muss angepasst werden:
- Manuelle Preise werden als absolute Overrides gespeichert (OHNE Preisanpassung)
- Wenn der Nutzer einen Preis manuell eingibt, wird dieser direkt als `effective_price` verwendet
- Preisanpassung (+/-) wirkt NUR auf Einheiten OHNE Override

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |
| Aendern | `src/components/projekte/StickyCalculatorPanel.tsx` |
| Aendern | `src/components/projekte/UnitPreislisteTable.tsx` |

## Erwartetes Ergebnis nach Implementierung

Bei Default-Einstellungen (4% Rendite, 10% Provision, 0% Preisanpassung):
- Gesamtverkauf ≈ 4.800.000 EUR (weil Miete aus Kaufpreis*4% → Preis = Miete/4% = Kaufpreis)
- Ø Ist-Rendite = 4,00% (exakt)
- Marge = negativ (weil Verkauf ≈ Kauf, minus Provision)

Das ist korrekt! Der Nutzer muss dann die Rendite senken (z.B. auf 3,5%) damit die Preise steigen und eine positive Marge entsteht. Genau wie im Akquise-Manager.

## Risiko

Niedrig-Mittel. Berechnungslogik wird vereinfacht und an bewaehrtes Muster angeglichen. Keine DB-Aenderungen.
