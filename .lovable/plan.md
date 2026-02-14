
# Systemweiter UI-Audit und Investment-Engine-Reparatur

## Analyse: 6 Kernprobleme identifiziert

### Problem 1: PropertyCurrencyCell zeigt Centbetraege (,00 EUR) und Euro auf zweiter Zeile
**Ursache**: `PropertyCurrencyCell` in `src/components/shared/PropertyTable.tsx` formatiert mit `minimumFractionDigits: 2` und haengt ` EUR` an. Bei schmalen Spalten bricht das EUR-Zeichen in eine zweite Zeile um.
**Loesung**: Umstellen auf `maximumFractionDigits: 0` (keine Cents) und Nutzung von `Intl.NumberFormat` mit `style: 'currency'` statt manueller EUR-Konkatenation. So wird das EUR-Zeichen als geschuetztes Leerzeichen gerendert und bricht nicht um.

**Datei**: `src/components/shared/PropertyTable.tsx` (Zeilen 244-268)
```typescript
// VORHER:
const formatted = value.toLocaleString('de-DE', { 
  minimumFractionDigits: 2, maximumFractionDigits: 2 
}) + ' €';

// NACHHER:
const formatted = new Intl.NumberFormat('de-DE', { 
  style: 'currency', currency: 'EUR', 
  maximumFractionDigits: 0 
}).format(value);
```

### Problem 2: InvestmentResultTile - Schriftgroessen zu klein, Doppelzeilen
**Ursache**: Die T-Konto-Sektion nutzt `text-[10px]` und `text-xs`. EUR-Werte brechen bei schmalen Kacheln um.
**Loesung**: Schriftgroessen erhoehen (Ueberschriften `text-xs`, Werte `text-sm`), Preiszeile von `text-lg` auf `text-xl`, Typ-Label von `text-xs` auf `text-sm`.

**Datei**: `src/components/investment/InvestmentResultTile.tsx`
- Zeile 144: `text-lg` auf `text-xl` (Kaufpreis)
- Zeile 147: `text-sm` bleibt (Ort)
- Zeile 153-154: `text-sm`/`text-xs` auf `text-base`/`text-sm`
- Zeile 163: `text-[10px]` auf `text-xs` (EINNAHMEN/AUSGABEN Header)
- Zeile 166: `text-xs` auf `text-sm` (alle Wertzeilen)
- Zeile 195: `text-[10px]` auf `text-xs`

### Problem 3: Centbetraege in 11+ weiteren Dateien
**Ursache**: Viele Komponenten nutzen lokale `formatCurrency`-Funktionen mit `minimumFractionDigits: 2`.
**Loesung**: Alle lokalen Formatter durch Import von `formatCurrency` aus `src/lib/formatters.ts` ersetzen (dort bereits `maximumFractionDigits: 0`). Betroffene Dateien:

| Datei | Aktuell |
|---|---|
| `src/components/immobilienakte/InvestmentKPIBlock.tsx` | `minimumFractionDigits: 2` |
| `src/components/immobilienakte/FinancingBlock.tsx` | `minimumFractionDigits: 2` |
| `src/components/immobilienakte/TenancyBlock.tsx` | `minimumFractionDigits: 2` |
| `src/components/immobilienakte/NKWEGBlock.tsx` | `minimumFractionDigits: 2` |
| `src/components/immobilienakte/editable/TenancySummaryBlock.tsx` | `minimumFractionDigits: 2` |
| `src/components/immobilienakte/editable/EditableTenancyBlock.tsx` | `minimumFractionDigits: 2` |
| `src/components/finanzierung/FinanceApplicationPreview.tsx` | hat Cents |
| `src/components/portfolio/TenancyTab.tsx` | `minimumFractionDigits: 2` |

Ausnahme: In den Finanzierungs-Rechnern (KDF, Amortisation, FinanceOfferCard) bleiben 2 Dezimalstellen erhalten, da dort Zinssaetze und exakte Annuitaeten dargestellt werden.

### Problem 4: Investment-Engine rechnet nicht mit echten Immobilienakten-Daten
**Ursache**: Die Demo-Immobilien in `useDemoListings.ts` haben plausible, aber willkuerliche Werte (z.B. BER-01: 850.000 EUR Kaufpreis, 3.500 EUR Miete). Diese stimmen nicht mit den tatsaechlich in der Datenbank angelegten Demo-Immobilien ueberein.

Die Investment-Engine berechnet korrekt - das Problem liegt in den Eingabedaten:
- BER-01: Kaufpreis 850.000 EUR mit nur 50.000 EUR EK ergibt Darlehen ~800.000 EUR, was monatliche Zinsen von ~2.333 EUR und Tilgung ~1.333 EUR erklaert. Das sind die Werte aus dem Screenshot.
- Die Werte in `useDemoListings.ts` muessen mit den echten DB-Immobilienakten abgeglichen werden.

**Loesung**: Die drei Demo-Properties in `useDemoListings.ts` auf realistische ETW-Werte anpassen:
```
BER-01: Kaufpreis 220.000, Miete 840/Mo, 85 m2, 1 WE (ETW)
MUC-01: Kaufpreis 350.000, Miete 1.250/Mo, 72 m2, 1 WE (ETW)  
HH-01: Kaufpreis 195.000, Miete 580/Mo, 45 m2, 1 WE (ETW)
```
(Abgleich mit Portfolio-Screenshot: BER-01 Verkehrswert 320k/Miete 10.200 p.a., MUC-01 480k/15.000 p.a., HH-01 195k/6.960 p.a.)

Exakter Abgleich mit DB-Werten (aus Screenshot sichtbar):
- BER-01: Miete p.a. 10.200 EUR = 850/Mo, Verkehrswert 320.000
- MUC-01: Miete p.a. 15.000 EUR = 1.250/Mo, Verkehrswert 480.000
- HH-01: Miete p.a. 6.960 EUR = 580/Mo, Verkehrswert 195.000

Kaufpreise = Verkehrswerte fuer Demo: 320.000, 480.000, 195.000.

### Problem 5: Portfolio-Summenzeile hat Doppelzeilen und kleine Schrift
**Ursache**: In der Summenzeile (Zeilen 1128-1148) werden Labels als `text-xs text-muted-foreground` ueber den Werten gerendert. Bei schmalen Viewports brechen die formatierten Betraege um.
**Loesung**: Labels und Werte in eine Zeile konsolidieren. `text-xs` Labels entfernen (Zero-Clutter-Policy), nur Werte mit einheitlicher `text-sm font-semibold` zeigen.

### Problem 6: 1000er-Punkt fehlt teilweise
**Ursache**: `Intl.NumberFormat('de-DE')` liefert korrekte 1000er-Punkte. Das Problem tritt nur in Komponenten auf, die manuelle String-Konkatenation verwenden oder `toFixed()` nutzen.
**Loesung**: Wird durch Problem 3 (zentrale Formatter-Nutzung) automatisch behoben.

---

## Aenderungsplan (Dateien)

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 1 | `src/components/shared/PropertyTable.tsx` | PropertyCurrencyCell: Cents entfernen, Intl.NumberFormat nutzen |
| 2 | `src/components/investment/InvestmentResultTile.tsx` | Schriftgroessen erhoehen (text-xs auf text-sm, etc.) |
| 3 | `src/hooks/useDemoListings.ts` | Kaufpreise/Mieten an DB-Immobilienakten anpassen |
| 4 | `src/components/immobilienakte/InvestmentKPIBlock.tsx` | formatCurrency aus lib/formatters importieren |
| 5 | `src/components/immobilienakte/FinancingBlock.tsx` | formatCurrency aus lib/formatters importieren |
| 6 | `src/components/immobilienakte/TenancyBlock.tsx` | formatCurrency aus lib/formatters importieren |
| 7 | `src/components/immobilienakte/NKWEGBlock.tsx` | formatCurrency aus lib/formatters importieren |
| 8 | `src/components/immobilienakte/editable/TenancySummaryBlock.tsx` | formatCurrency aus lib/formatters importieren |
| 9 | `src/components/immobilienakte/editable/EditableTenancyBlock.tsx` | formatCurrency aus lib/formatters importieren |
| 10 | `src/components/portfolio/TenancyTab.tsx` | formatCurrency aus lib/formatters importieren |
| 11 | `src/components/finanzierung/FinanceApplicationPreview.tsx` | Cents entfernen |
| 12 | `src/pages/portal/immobilien/PortfolioTab.tsx` | Summenzeile vereinfachen, Doppelzeilen eliminieren |

Keine DB-Aenderungen erforderlich. Rein Frontend/UI.
