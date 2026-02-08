

# Bugfix: Grenzsteuersatz-Berechnung (3470% → 34,7%)

## Fehleranalyse

Der Grenzsteuersatz wird fälschlicherweise mit 3470% angezeigt statt 34,7%.

**Ursache:** Doppelte Prozent-Konvertierung

In `src/lib/taxCalculator.ts` (Zeile 153-155):
```typescript
const marginalTaxRate = calculateMarginalRate(...) * 100;  // ← Bereits in Prozent!
```

In `src/pages/portal/immobilien/KontexteTab.tsx` (Zeile 183):
```typescript
calculatedTaxRate = Math.round(taxResult.marginalTaxRate * 100);  // ← Nochmal * 100 = FALSCH!
```

**Ergebnis:** 0.347 → 34.7 (taxCalculator) → 3470 (KontexteTab) ❌

---

## Lösung

Die Multiplikation mit 100 in Zeile 183 entfernen:

**Vorher:**
```typescript
calculatedTaxRate = Math.round(taxResult.marginalTaxRate * 100);
```

**Nachher:**
```typescript
calculatedTaxRate = Math.round(taxResult.marginalTaxRate);
```

---

## Betroffene Datei

| Datei | Zeile | Änderung |
|-------|-------|----------|
| `src/pages/portal/immobilien/KontexteTab.tsx` | 183 | `* 100` entfernen |

---

## Verifizierung

Nach dem Fix:
- zVE 98.000 € (Splitting, 0 Kinder) → ca. 34-35% Grenzsteuersatz
- zVE 50.000 € (Einzel) → ca. 27% Grenzsteuersatz
- zVE 300.000 € → 45% Grenzsteuersatz (Spitzensteuersatz)

---

## Einzeilige Korrektur

```typescript
// Zeile 183 ändern von:
calculatedTaxRate = Math.round(taxResult.marginalTaxRate * 100);

// zu:
calculatedTaxRate = Math.round(taxResult.marginalTaxRate);
```

