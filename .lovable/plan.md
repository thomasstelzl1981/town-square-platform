
# Bugfix: Grenzsteuersatz-Berechnung bei Splitting

## Analyse des Problems

**Aktueller Screenshot zeigt:**
- zVE: 98.000 €
- Veranlagungsart: Splitting
- Berechneter Grenzsteuersatz: **3472.1%** ❌
- Effektiver Steuersatz: 19.9% ✅

**Erwarteter Grenzsteuersatz:** ca. **34-35%**

---

## Fehlerursache identifiziert

**Datei:** `src/lib/taxCalculator.ts`

Die Funktion `calculateMarginalRate` hat eine inkonsistente Rückgabe:

| Zone | Formel | Rückgabewert | Problem |
|------|--------|--------------|---------|
| Zone 4 (>66.760) | `return 0.42` | Dezimalwert (0.42) | ✅ Korrekt |
| Zone 5 (>277.825) | `return 0.45` | Dezimalwert (0.45) | ✅ Korrekt |
| Zone 2 (12.097-17.005) | `(2*922.98*y + 1400) / 100` | **Prozent als Zahl** (z.B. 14.5) | ❌ Falsch |
| Zone 3 (17.006-66.760) | `(2*181.19*z + 2397) / 100` | **Prozent als Zahl** (z.B. 35.6) | ❌ Falsch |

Dann wird in Zeile 153 nochmal mit 100 multipliziert:
```typescript
const marginalTaxRate = calculateMarginalRate(...) * 100;
```

**Rechenbeispiel (Splitting mit zVE=98.000 €):**
- halfZvE = 49.000 €
- Zone 3: z = (49.000 - 17.005) / 10.000 = 3.1995
- Formel: (2 × 181.19 × 3.1995 + 2397) / 100 = **35.57**
- Zeile 153 multipliziert: 35.57 × 100 = **3557%** ≈ 3472.1% (mit Kinderfreibetrag)

---

## Korrektur

**Die Formel in Zone 2 und Zone 3 muss Dezimalwerte liefern (wie Zone 4/5):**

```text
Zone 2 (aktuell):   (2 * 922.98 * y + 1400) / 100
Zone 2 (korrigiert): (2 * 922.98 * y + 1400) / 10000

Zone 3 (aktuell):   (2 * 181.19 * z + 2397) / 100
Zone 3 (korrigiert): (2 * 181.19 * z + 2397) / 10000
```

**Erklärung:** Die BMF-Formel gibt den Grenzsteuersatz in Zehntelprozent aus (z.B. 2397 = 23.97%). Durch Division durch 10.000 statt 100 erhalten wir den korrekten Dezimalwert (0.2397).

---

## Zu ändernde Datei

**Datei:** `src/lib/taxCalculator.ts`

| Zeile | Aktuell | Korrigiert |
|-------|---------|------------|
| 90 | `return (2 * 922.98 * y + 1400) / 100;` | `return (2 * 922.98 * y + 1400) / 10000;` |
| 94 | `return (2 * 181.19 * z + 2397) / 100;` | `return (2 * 181.19 * z + 2397) / 10000;` |

---

## Erwartetes Ergebnis nach Fix

**Für zVE = 98.000 € mit Splitting:**
- halfZvE = 49.000 €
- z = 3.1995
- Grenzsteuersatz = (2 × 181.19 × 3.1995 + 2397) / 10000 = **0.3557** (Dezimal)
- Anzeige: 0.3557 × 100 = **35.6%** ✅

---

## Validierung

Nach der Korrektur:
- [ ] Splitting mit zVE 98.000 € → Grenzsteuersatz ~35%
- [ ] Einzelveranlagung mit zVE 60.000 € → Grenzsteuersatz ~42%
- [ ] Niedrige Einkommen (30.000 €) → Grenzsteuersatz ~28%
- [ ] Hohe Einkommen (300.000 €) → Grenzsteuersatz 45%
