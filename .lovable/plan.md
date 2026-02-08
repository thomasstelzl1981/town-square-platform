
# Reparatur Simulation-Tab: Immer anzeigen + Spaltenname korrigieren

## Zusammenfassung

**2 Fehler gefunden:**
1. Falscher Spaltenname: `lender_name` statt `bank_name` (Zeile 173)
2. Unnötige Bedingung: Simulation wird nur angezeigt wenn Finanzierung vorhanden (Zeile 314)

---

## Fehler 1: Falscher Spaltenname

### Aktueller Code (PropertyDetailPage.tsx, Zeile 173)
```typescript
.select('id, loan_number, lender_name, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
```

### Problem
Die Spalte `lender_name` existiert nicht in der `loans`-Tabelle. Der korrekte Name ist `bank_name`.

### Lösung
```typescript
.select('id, loan_number, bank_name, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
```

### Mapping anpassen (Zeile 181)
```typescript
// Von:
bank_name: loan.lender_name,

// Zu:
bank_name: loan.bank_name,
```

---

## Fehler 2: Simulation nur bei vorhandener Finanzierung

### Aktueller Code (Zeilen 314-338)
```typescript
{property && financing.length > 0 ? (
  <InventoryInvestmentSimulation ... />
) : (
  <div className="...">
    <p>Keine Finanzierungsdaten vorhanden</p>
  </div>
)}
```

### Problem
Für schuldenfreie Immobilien wird nur ein leerer Zustand angezeigt. Die Wertentwicklung ist aber auch ohne Finanzierung interessant.

### Lösung
Bedingung entfernen und Fallback-Werte für Finanzierung (0) verwenden:

```typescript
{property ? (
  <InventoryInvestmentSimulation
    data={{
      purchasePrice: property.purchase_price || property.market_value || 0,
      marketValue: property.market_value || property.purchase_price || 0,
      annualRent: (property.rental_income_monthly || 0) * 12,
      // Fallback auf 0 wenn keine Finanzierung
      outstandingBalance: financing[0]?.current_balance || 0,
      interestRatePercent: financing[0]?.interest_rate || 0,
      annuityMonthly: financing[0]?.monthly_rate || 0,
      buildingSharePercent: accountingData?.building_share_percent || 80,
      afaRatePercent: accountingData?.afa_rate_percent || 2,
      afaMethod: accountingData?.afa_method || 'linear',
      contextName: contextData?.name,
      marginalTaxRate: contextData?.marginal_tax_rate || 0.42,
    }}
  />
) : null}
```

---

## Anpassung InventoryInvestmentSimulation

Die Komponente zeigt bei `outstandingBalance = 0` automatisch:
- Restschuld: 0 EUR (verschwindet im Chart)
- Netto-Vermögen = Verkehrswert (da keine Schulden)
- Steuervorteil: nur AfA (keine Zinsabzüge)

Optional können wir die Info-Box für "Restschuld" ausblenden wenn 0:

```typescript
// In InfoBox-Rendering (Zeile 198)
{data.outstandingBalance > 0 && (
  <InfoBox label="Restschuld" value={formatCurrency(data.outstandingBalance)} />
)}
```

---

## Ergebnis nach der Korrektur

```
┌─────────────────────────────────────────────────────────────────┐
│ MIT Finanzierung                                                │
├─────────────────────────────────────────────────────────────────┤
│ • Chart zeigt: Verkehrswert, Restschuld, Netto-Vermögen        │
│ • Steuervorteil: AfA + Zinsen berücksichtigt                   │
│ • Tabelle: Alle Spalten sichtbar                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ OHNE Finanzierung (schuldenfrei)                                │
├─────────────────────────────────────────────────────────────────┤
│ • Chart zeigt: Verkehrswert = Netto-Vermögen (identisch)       │
│ • Restschuld-Linie bei 0 / ausgeblendet                        │
│ • Steuervorteil: nur AfA                                       │
│ • Tabelle: Restschuld-Spalte zeigt "–"                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Betroffene Dateien

| Datei | Zeilen | Änderung |
|-------|--------|----------|
| `PropertyDetailPage.tsx` | 173 | `lender_name` → `bank_name` |
| `PropertyDetailPage.tsx` | 181 | `loan.lender_name` → `loan.bank_name` |
| `PropertyDetailPage.tsx` | 314-338 | Bedingung `financing.length > 0` entfernen |
| `InventoryInvestmentSimulation.tsx` | 196-200 | Optional: Restschuld-Box ausblenden wenn 0 |

---

## Implementierungsschritte

1. Spaltenname in Abfrage korrigieren (Zeile 173)
2. Mapping anpassen (Zeile 181)
3. Bedingung für Simulation entfernen (Zeile 314)
4. Optional: Komponente für schuldenfreie Darstellung optimieren
