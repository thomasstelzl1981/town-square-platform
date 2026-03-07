

# Berechnungsfehler in der Aufteiler-Kalkulation (ENG-AKQUISE)

## Gefundene Fehler

### BUG 1 — Mieteinnahmen werden DOPPELT gezaehlt (KRITISCH)

Die Mieteinnahmen waehrend der Haltedauer (`rentalIncomeOffset`) werden an **zwei Stellen** verrechnet:

1. Sie **reduzieren** die Gesamtinvestition: `totalInvestmentGross = totalCostBase + totalFinancingCosts` wobei `totalFinancingCosts = Zinsen + Disagio − Mieteinnahmen`
2. Sie werden **nochmals als Erloes** addiert: `totalRevenue = salesPriceNet + Garagen + rentIncome`

Rechnerisch: `profit = salesPriceNet + garage + 2×rentIncome − totalCostBase − Zinsen − Disagio`

Die Mieteinnahmen werden also **doppelt als Gewinn** verbucht. Bei z.B. 48.000 € Jahresmiete × 2 Jahre = 96.000 € doppelt = **192.000 € Gewinn-Inflation**.

### BUG 2 — Gesamtinvestition niedriger als Kaufpreis

Direkte Folge von Bug 1: Wenn die Mieteinnahmen hoeher sind als die Zinskosten, wird `totalFinancingCosts` **negativ**. Dadurch sinkt `totalInvestmentGross` unter den reinen Kaufpreis — was betriebswirtschaftlich unsinnig ist.

### BUG 3 — Gleicher Fehler in der Alternativenmatrix

Die `calcAlternativenMatrix`-Funktion (Zeilen 436-481) hat exakt denselben Doppelzaehlungsfehler:
- Zeile 461: `totalInv = totalCostBase + interest + disagio − rental`
- Zeile 465: `totalRev = netSale + garageSaleProceeds + rental`

Alle 9 Matrix-Zellen sind dadurch um `rental` zu optimistisch.

## Korrektur

**Prinzip**: Die Gesamtinvestition bildet ab, was tatsaechlich **ausgegeben** wird (Ankauf + Bau + Zinsen + Disagio). Mieteinnahmen sind **Erloes**, nicht Kostenreduktion.

### Aenderungen in `engine.ts` — `calcAufteilerFull`:

```text
VORHER:
  totalFinancingCosts = interestAcq + interestConst + disagio − rentalIncomeOffset
  totalInvestmentGross = totalCostBase + totalFinancingCosts
  totalRevenue = salesPriceNet + garageSaleProceeds + rentIncome

NACHHER:
  totalFinancingCosts = interestAcq + interestConst + disagio   ← Mieteinnahmen RAUS
  totalInvestmentGross = totalCostBase + totalFinancingCosts    ← jetzt korrekt > Kaufpreis
  totalRevenue = salesPriceNet + garageSaleProceeds + rentIncome ← bleibt (einmal als Erloes)
  profit = totalRevenue − totalInvestmentGross                  ← korrekt, keine Doppelzaehlung
```

### Aenderungen in `calcAlternativenMatrix`:

```text
VORHER:
  totalInv = totalCostBase + interest + disagio − rental
  totalRev = netSale + garageSaleProceeds + rental

NACHHER:
  totalInv = totalCostBase + interest + disagio      ← rental RAUS
  totalRev = netSale + garageSaleProceeds + rental    ← bleibt
```

### Aenderungen in `netCosts` (fuer Sensitivitaetsanalyse):

`netCosts` wird ebenfalls korrigiert: `netCosts = totalCostBase + interestCosts + disagio` (ohne Mietabzug). Die Sensitivitaet muss konsistent mit dem Hauptergebnis sein.

### UI-Anpassung Aufteiler-Tab:

Die "Summe Finanzierung" in Sektion 4 zeigt aktuell `fb.totalFinancingCosts` (der den Mietabzug enthielt). Nach dem Fix zeigt sie die reinen Finanzierungskosten. Die Mieteinnahmen werden weiterhin unter "Exit / Erloese" als Erloes angezeigt — das ist korrekt.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/engines/akquiseCalc/engine.ts` | Bug-Fix in `calcAufteilerFull`, `calcAlternativenMatrix`, `netCosts` |
| `src/pages/portal/akquise-manager/components/AufteilerCalculation.tsx` | Sektion 4: Mieteinnahmen-Zeile entfernen (gehoert in Sektion 5 Exit) |

Keine neuen Dateien, keine Freeze-Konflikte.

