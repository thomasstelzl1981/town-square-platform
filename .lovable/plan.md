
# MOD-13 Kalkulator — Analyse und Reparaturplan

## IST-Analyse: Die drei Kacheln

Das Portfolio-Tab hat drei relevante Kacheln:

1. **StickyCalculatorPanel** (links, 1/3 Breite) — Stellschrauben mit Slidern
2. **UnitPreislisteTable** (volle Breite) — Einheiten-Preisliste mit Inline-Editing
3. **SalesStatusReportWidget** (rechts, 2/3 Breite) — Vertriebsstatus-KPIs und PDF-Report

---

## Gefundene Probleme

### Problem 1: Fehlendes Feld "Gesamtprojektverkaufspreis"
Der StickyCalculatorPanel hat nur ein Eingabefeld: **Investitionskosten**. Es fehlt ein zweites Feld fuer den **Gesamtprojektverkaufspreis** (total_sale_target). Aktuell wird der Gesamtverkaufspreis ausschliesslich aus der Summe der Einheiten-Preise berechnet (`units.reduce(effective_price)`), was bedeutet:
- Man kann keinen Top-Down-Zielpreis vorgeben
- Die Marge-Berechnung haengt komplett von den Einzelpreisen ab, statt umgekehrt

### Problem 2: Berechnungslogik-Inkonsistenz zwischen den Kacheln
Die drei Kacheln verwenden **unterschiedliche Berechnungsmodelle**, die nicht synchronisiert sind:

**StickyCalculatorPanel:**
```
Marge = totalSale - investmentCosts - provisionAbs
```
- `totalSale` = Summe aller `effective_price` der Einheiten
- `provisionAbs` = totalSale * provisionRate
- Problem: Investitionskosten beinhalten KEINE Nebenkosten, Sanierung oder Zinsen

**ProjectAufteilerCalculation (Projektakte Tab D):**
```
netCosts = purchasePrice + ancillaryCosts + renovationBudget + interestCosts - rentIncome
profit = salesPriceNet - netCosts
```
- Wesentlich detailliertere Kalkulation mit Nebenkosten, Zinsen, Mieteinnahmen
- Nutzt separate Slider und eigene Speicherlogik

**SalesStatusReportWidget:**
```
grossProfit = totalVolume - investmentCosts - totalProvision
```
- Provision nur von sold/notary-Einheiten (korrekt laut Spec)
- Investitionskosten = nur das eine Input-Feld, keine Nebenkosten

### Problem 3: Keine Persistenz des Gesamtverkaufspreises im Portfolio-Tab
Im StickyCalculatorPanel wird der Gesamtverkaufspreis nirgends gespeichert. Der Save-Button speichert nur die Investitionskosten im lokalen State, nicht in die Datenbank.

### Problem 4: Preisberechnungslogik in der Preisliste
Die effective_price-Berechnung in PortfolioTab (Zeile 138-139):
```
basePrice = annual_net_rent / targetYield
effectivePrice = basePrice * (1 + priceAdjustment / 100)
```
Das ist korrekt fuer eine Rendite-basierte Preisfindung. ABER: Es gibt keinen Rueckkanal — wenn man einen Gesamtverkaufspreis vorgibt, werden die Einzelpreise nicht proportional angepasst.

---

## Reparatur- und Erweiterungsplan

### Schritt 1: StickyCalculatorPanel erweitern
Neues Eingabefeld **"Gesamtverkaufspreis (Ziel)"** hinzufuegen:
- Input-Feld mit Save-Button (identisch zum Investitionskosten-Feld)
- Wenn gesetzt: Wird als `totalSaleTarget` an den Kalkulator uebergeben
- Die Marge-Berechnung nutzt dann: `max(totalSaleTarget, summe_einheiten)`
- Neuer State in PortfolioTab: `totalSaleTarget` mit Setter

### Schritt 2: Berechnungslogik konsolidieren
Die Kalkulation im StickyCalculatorPanel wird erweitert um:
```
totalSale = totalSaleTarget > 0 ? totalSaleTarget : units.reduce(effective_price)
provisionAbs = totalSale * provisionRate
marginAbs = totalSale - investmentCosts - provisionAbs
marginPct = marginAbs / investmentCosts * 100  (auf Invest bezogen, nicht auf Sale)
profitPerUnit = marginAbs / units.length
```

### Schritt 3: SalesStatusReportWidget synchronisieren
- `grossProfit` nutzt den gleichen `totalSaleTarget` statt nur die Summe der Einheiten
- Die Provision-Berechnung bleibt korrekt (nur sold/notary)
- Neuer KPI: "Zielverkaufspreis" wird angezeigt

### Schritt 4: Persistenz sicherstellen
Bei Speichern (existierender Save-Button oder neuer) werden beide Werte in `dev_projects` geschrieben:
- `purchase_price` (Investitionskosten)
- `total_sale_target` (Gesamtverkaufspreis)

Das Feld `total_sale_target` existiert bereits in der Datenbank und im Typ `ProjectPortfolioRow`.

### Schritt 5: Initialisierung aus DB-Daten
Beim Projektwechsel im Portfolio-Tab werden beide Werte aus dem Projekt geladen:
- `investmentCosts` = `selectedProject.purchase_price`
- `totalSaleTarget` = `selectedProject.total_sale_target`

---

## Technische Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/projekte/PortfolioTab.tsx` | Neuer State `totalSaleTarget`, an beide Kacheln weitergeben, Initialisierung aus Projekt-Daten |
| `src/components/projekte/StickyCalculatorPanel.tsx` | Neues Input-Feld "Gesamtverkaufspreis", erweiterte Props, korrigierte Marge-Berechnung, DB-Save fuer beide Felder |
| `src/components/projekte/SalesStatusReportWidget.tsx` | Neue Prop `totalSaleTarget`, Rohertrag-Berechnung nutzt den Zielpreis |

**Keine DB-Migration noetig** — `total_sale_target` existiert bereits auf `dev_projects`.

**Keine neuen Routen, keine Engine-Aenderung.**
