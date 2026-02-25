

## Fehleranalyse: Warum alle Finanzdaten 0 EUR zeigen

### Root Cause: Falsches Spalten-Mapping `rent_net` vs `current_rent`

**DB-Befund (verifiziert):**
| Spalte | Wert | Status |
|---|---|---|
| `list_price` | 205.666 / 181.930 | ✅ korrekt befuellt |
| `current_rent` | 771.69 / 682.63 | ✅ korrekt befuellt |
| `rent_net` | NULL | ❌ nie befuellt |
| `rent_nk` | NULL | ❌ nie befuellt |
| `price_per_sqm` | 2.300 | ✅ korrekt befuellt |

**Edge Function** (`sot-project-intake/index.ts` Z.645) schreibt die Miete in `current_rent`:
```typescript
current_rent: u.currentRent || 0,  // ← hier landet die Miete
```

**PortfolioTab** (`PortfolioTab.tsx` Z.127) liest aber `rent_net`:
```typescript
const rentNet = u.rent_net ?? 0;      // ← NULL → 0
const rentNk = u.rent_nk ?? 0;        // ← NULL → 0
const annualNetRent = rentNet * 12;    // ← 0 × 12 = 0
```

### Kaskaden-Effekt: Eine falsche Spalte → alles 0

```text
rent_net = NULL → rentNet = 0
                      ↓
              annualNetRent = 0
                      ↓
    effective_price = 0 / targetYield = 0  (Z.160)
    effective_yield = 0                     (Z.164)
    effective_price_per_sqm = 0             (Z.165)
    effective_provision = 0                 (Z.166)
                      ↓
    Tabelle: alle Spalten 0 EUR
    Kalkulator: Zielverkaufspreis 0 statt berechnet
```

### Fix: 1 Stelle in PortfolioTab.tsx

**Zeile 127-128** — `current_rent` als Fallback verwenden:

```typescript
// ALT:
const rentNet = u.rent_net ?? 0;
const rentNk = u.rent_nk ?? 0;

// NEU:
const rentNet = u.rent_net ?? u.current_rent ?? 0;
const rentNk = u.rent_nk ?? 0;
```

Das ist alles. Eine Zeile aendern, und alle Finanzwerte kaskadieren korrekt:
- `rentNet = 771.69` (aus current_rent)
- `annualNetRent = 771.69 × 12 = 9.260,28`
- `effective_price = 9.260,28 / 0.04 = 231.507` (bei 4% Zielrendite)
- `effective_yield`, `price_per_sqm`, `provision` berechnen sich automatisch

### Optionaler Zusatzfix: `list_price` auch in der Tabelle anzeigen

Aktuell zeigt die Tabelle `effective_price` (berechnet aus Rendite), nicht den tatsaechlichen `list_price` aus der DB. Wenn auch der Original-Kaufpreis sichtbar sein soll, muss das DemoUnit-Interface erweitert werden — das ist aber ein separates Thema, kein Bug.

### Betroffene Datei

| Datei | Zeile | Aenderung |
|---|---|---|
| `src/pages/portal/projekte/PortfolioTab.tsx` | 127 | `u.rent_net ?? u.current_rent ?? 0` |

### Aufwand

1 Minute. Eine Zeile.

