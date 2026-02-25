

## Refactoring-Plan: Preislisten-Kalkulator (PortfolioTab)

### Kernproblem

Der PortfolioTab hat einen **Endkundenrendite-Slider** (`targetYield`, Default 4%), der die Verkaufspreise aus der Rendite zurueckrechnet. Dadurch werden die **echten Preise aus der hochgeladenen Preisliste (SSOT)** ueberschrieben. Die Preisliste zeigt z.B. 112.500 EUR statt der echten 100.000 EUR — und die Rendite ist immer exakt der Slider-Wert (4%), nicht die tatsaechliche Rendite.

### Ist-Zustand (fehlerhaft)

```text
PortfolioTab.tsx Z.161:
  basePrice = annual_net_rent / targetYield    ← FALSCH: ignoriert list_price
  effectivePrice = basePrice * (1 + priceAdjustment%)

Ergebnis: Preis wird aus Rendite berechnet → Rendite = immer targetYield → Zirkelschluss
```

### Soll-Zustand (SSOT-konform)

```text
PortfolioTab.tsx:
  effectivePrice = list_price * (1 + priceAdjustment%)    ← KORREKT: DB-Preis als Basis

Ergebnis: Preis = hochgeladener Preis (± Anpassung) → Rendite ergibt sich daraus
```

### Aufteiler-Kalkulator (Block D)

Wird **NICHT veraendert**. Der dortige `targetYield`-Slider ist korrekt implementiert: Er wird nur als Fallback verwendet wenn `totalListPrice = 0` ist (Z.260-262 der Engine). Wenn Einheiten mit Preisen existieren, nutzt die Engine immer `totalListPrice`. Umlaufvermoegen — keine AfA.

---

### Aenderungen

#### 1. PortfolioTab.tsx — Preisberechnung auf SSOT umstellen

**Z.108:** `targetYield`-State entfernen
**Z.152-163:** Preisberechnung aendern:
```typescript
// VORHER (falsch):
const basePrice = targetYield > 0 ? u.annual_net_rent / targetYield : 0;
effectivePrice = Math.round(basePrice * (1 + priceAdjustment / 100));

// NACHHER (korrekt):
effectivePrice = Math.round(u.list_price * (1 + priceAdjustment / 100));
```

**Z.100-101:** Investitionskosten-Default mit 20%-Margen-Rueckrechnung:
```typescript
// VORHER:
const [investmentCosts, setInvestmentCosts] = useState(
  selectedProject?.purchase_price || 4_800_000   ← hardcodierter Fallback
);

// NACHHER:
// Default: purchase_price aus DB, Fallback: totalListPrice / 1.20 (20% Marge)
```
Die 20%-Margen-Logik wird via `useEffect` synchronisiert wenn Units geladen werden: Wenn `purchase_price` in der DB 0 oder null ist, wird `summe_list_prices / 1.20` als Indikation gesetzt.

#### 2. StickyCalculatorPanel.tsx — targetYield-Slider entfernen

**Z.209-222:** Gesamten "Endkundenrendite"-Slider-Block entfernen.
**Props:** `targetYield` und `onTargetYieldChange` Props entfernen.
Alle anderen Slider (Provision, Preisanpassung) und Inputs (Investitionskosten, Gesamtverkaufspreis) bleiben bestehen.

#### 3. UnitPreislisteTable.tsx — Spalte umbenennen

**Z.142:** `"Rendite"` → `"Bruttorendite"`

#### 4. InvestPreislisteTable.tsx — Spalte umbenennen

**Z.89:** `"Rendite"` → `"Bruttorendite"`

#### 5. PortfolioTab.tsx — Investitionskosten-Default aus Units berechnen

Neuer `useEffect` der die Investitionskosten automatisch setzt wenn kein `purchase_price` in der DB gespeichert ist:

```typescript
useEffect(() => {
  if (selectedProject && baseUnits.length > 0) {
    const totalList = baseUnits.reduce((s, u) => s + u.list_price, 0);
    if (!selectedProject.purchase_price && totalList > 0) {
      setInvestmentCosts(Math.round(totalList / 1.20));
    }
  }
}, [selectedProject?.id, baseUnits]);
```

Dies ist die einzige Rueckrechnung: `Investitionskosten ≈ Summe Listenpreise / 1,20` als erste Indikation. Der User kann den Wert dann im Kalkulator manuell anpassen und speichern.

---

### Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| `src/pages/portal/projekte/PortfolioTab.tsx` | `targetYield`-State entfernen, Preisberechnung auf `list_price` umstellen, Investitionskosten-Default aus Units (20% Marge), Props zu StickyCalculatorPanel anpassen |
| `src/components/projekte/StickyCalculatorPanel.tsx` | `targetYield`-Slider + Props entfernen |
| `src/components/projekte/UnitPreislisteTable.tsx` | Z.142: "Rendite" → "Bruttorendite" |
| `src/components/projekte/InvestPreislisteTable.tsx` | Z.89: "Rendite" → "Bruttorendite" |

### Was NICHT geaendert wird

| Punkt | Begruendung |
|---|---|
| Aufteiler-Kalkulator (Block D) | `targetYield` dort korrekt als Fallback implementiert, Umlaufvermoegen |
| InvestEngine Tab | Nutzt bereits `list_price` aus DB (SSOT) |
| Engine `calcAufteilerProject` | Logik korrekt, `totalListPrice` hat Vorrang vor Yield-Rueckrechnung |
| SalesStatusReportWidget | Erhaelt `targetYield` nicht mehr als Prop (wird entfernt) |

### Zusammenfassung

Nach dem Refactoring zeigt die Preisliste im PortfolioTab die **echten hochgeladenen Preise** (± prozentuale Anpassung via Slider). Die Rendite ergibt sich automatisch als `Jahresnetto / Preis` und ist identisch zur InvestPreislisteTable. Die Investitionskosten werden initial als `Summe Listenpreise / 1,20` geschaetzt (20% Bautraegermarge) und koennen manuell angepasst werden.

