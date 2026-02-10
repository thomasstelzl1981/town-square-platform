
# Kalkulator-Ueberarbeitung: Reihenfolge + Endkundenrendite-Slider

## Zwei Aenderungen

### 1. Reihenfolge im Kalkulator umstellen

Aktuell: Eingaben → PieChart → KPIs
Neu: Eingaben → KPIs → PieChart

```text
+-------------------------------------------+
| [Calculator] Kalkulator          [Demo]   |
+-------------------------------------------+
| Investitionskosten                        |
| [ 4.800.000 EUR            ] [Sichern]   |
+-------------------------------------------+
| Provision (brutto)             10,0 %    |
| ===========O============================ |
+-------------------------------------------+
| Endkundenrendite               4,0 %     |
| ====================================O=== |
|              (2,0% — 8,0%, Step 0,1%)    |
+-------------------------------------------+
| Preisanpassung                            |
|        [ - ]    0 %    [ + ]              |
+-------------------------------------------+
|                                           |
| Gesamtverkauf       7.200.000 EUR        |
| Investitionskosten  4.800.000 EUR        |
| Provision (10%)       720.000 EUR        |
| ---------------------------------------- |
| Marge            1.680.000 EUR (23,3%)   |
| Gewinn / Einheit      70.000 EUR        |
| Ø Endkundenrendite         4,00 %       |
|                                           |
+-------------------------------------------+
|         (PieChart ganz unten)             |
|       Kosten / Provision / Marge          |
+-------------------------------------------+
```

### 2. Neuer Slider: Endkundenrendite

- Position: zwischen Provision-Slider und Preisanpassung-Stepper
- Range: 2,0% bis 8,0%, Step 0,1%, Default 4,0%
- **Wirkung: Preise bleiben gleich, Marge veraendert sich**
- Konkret: Der Slider stellt die Zielrendite ein, die dem Endkunden kommuniziert wird. Er beeinflusst die Berechnung der angezeigten Rendite-KPI und der Marge, veraendert aber nicht die absoluten Verkaufspreise

Neue Props am Kalkulator:
- `targetYield: number` (z.B. 0.04 fuer 4%)
- `onTargetYieldChange: (v: number) => void`

Neuer State im PortfolioTab:
- `targetYield` mit Default 0.04

Die Rendite-Berechnung in `calculatedUnits` im PortfolioTab nutzt dann `targetYield` statt der rueckgerechneten Rendite. Die Marge ergibt sich weiterhin aus: `Gesamtverkauf - Investitionskosten - Provision`.

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/StickyCalculatorPanel.tsx` |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |

## Aenderungen im Detail

**StickyCalculatorPanel.tsx:**
- Neuer Prop `targetYield` + `onTargetYieldChange`
- Neuer Slider-Block fuer Endkundenrendite (nach Provision, vor Preisanpassung)
- KPI-Grid nach oben verschieben (direkt nach der letzten Separator nach den Eingaben)
- PieChart ans Ende verschieben (nach den KPIs)

**PortfolioTab.tsx:**
- Neuer State `const [targetYield, setTargetYield] = useState(0.04)`
- Props an StickyCalculatorPanel weitergeben

## Risiko

Niedrig. Reine UI-Umstellung und ein neuer Slider mit Prop-Durchreichung. Keine Aenderung der Kernberechnungslogik.
