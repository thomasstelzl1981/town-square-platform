

# Anpassung Simulation-Tab: Cashflow statt Monatsbelastung + Kompakte Annahmen-Kacheln

## Zusammenfassung der Änderungen

### 1. Tabelle: "Monatsbelastung" → "Cashflow"

**Aktuelle Spalte:**
- `monatsbelastung`: Zeigt die monatliche Rate (Annuität / 12)

**Neue Spalte:**
- `cashflow`: Jährliche Belastung der Immobilie = Miete - Annuität
- Kann positiv (Überschuss) oder negativ (Unterdeckung) sein
- Ohne Steuereffekt

**Berechnung:**
```typescript
cashflow: Math.round(currentRent - totalAnnuity)
```

### 2. Annahmen-Kacheln: Slider → Kompakte +/- Stepper

**Aktuelles Design (Zeilen 138-176):**
- Card mit Schiebereglern
- Viel Platz, langsame Bedienung

**Neues Design:**
Kompakte Stepper-Kacheln mit:
- Bezeichnung (z.B. "Wertzuwachs p.a.")
- Zahl (z.B. "2,0%")
- Minus-Button (links)
- Plus-Button (rechts)

```
┌───────────────────────────────────────────────────────────────┐
│  [-]   Wertzuwachs p.a.   2,0%   [+]                         │
│  [-]   Mietsteigerung p.a.   1,5%   [+]                      │
└───────────────────────────────────────────────────────────────┘
```

---

## Implementierungsdetails

### 1. Interface anpassen

```typescript
interface ProjectionRow {
  year: number;
  verkehrswert: number;
  restschuld: number;
  nettoVermoegen: number;
  miete: number;
  zins: number;
  tilgung: number;
  annuitaet: number;
  cashflow: number;  // NEU: ersetzt monatsbelastung
}
```

### 2. projectionData Berechnung ändern

```typescript
years.push({
  year: 2026 + year,
  verkehrswert: Math.round(currentValue),
  restschuld: Math.max(0, Math.round(debt)),
  nettoVermoegen: Math.round(netWealth),
  miete: Math.round(currentRent),
  zins: Math.round(interest),
  tilgung: Math.round(amortization),
  annuitaet: Math.round(totalAnnuity),
  // NEU: Cashflow = Miete - Annuität
  cashflow: Math.round(currentRent - totalAnnuity),
});
```

### 3. Tabellen-Spalte ändern

**Header:**
```tsx
<TableHead className="text-right">Cashflow</TableHead>
```

**Body:**
```tsx
<TableCell className={cn(
  "text-right font-medium",
  row.cashflow >= 0 ? "text-green-600" : "text-destructive"
)}>
  {formatCurrency(row.cashflow)}
</TableCell>
```

### 4. Kompakte Annahmen-Stepper erstellen

Neue Komponente innerhalb der Datei:

```tsx
interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

function CompactStepper({ label, value, onChange, min, max, step, suffix = '%' }: StepperProps) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <button 
        onClick={decrease}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value.toFixed(1)}{suffix}</p>
      </div>
      <button 
        onClick={increase}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
```

### 5. Annahmen-Bereich ersetzen

**Alt (Zeilen 138-176):** Card mit Slidern

**Neu:**
```tsx
{/* Kompakte Annahmen-Stepper */}
<div className="grid grid-cols-2 gap-3">
  <CompactStepper
    label="Wertzuwachs p.a."
    value={valueGrowth}
    onChange={setValueGrowth}
    min={0}
    max={5}
    step={0.5}
  />
  <CompactStepper
    label="Mietsteigerung p.a."
    value={rentGrowth}
    onChange={setRentGrowth}
    min={0}
    max={5}
    step={0.5}
  />
</div>
```

---

## Vorher/Nachher-Vergleich

### Tabelle

| Vorher | Nachher |
|--------|---------|
| Mtl. Rate: 747 € | Cashflow: +1.836 € (grün) |
| Mtl. Rate: 747 € | Cashflow: -564 € (rot) |

### Annahmen-Bereich

**Vorher:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Annahmen anpassen                                              │
├─────────────────────────────────────────────────────────────────┤
│  Wertzuwachs p.a.                                    [2.0%]     │
│  ━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│                                                                 │
│  Mietsteigerung p.a.                                 [1.5%]     │
│  ━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
└─────────────────────────────────────────────────────────────────┘
```

**Nachher:**
```
┌────────────────────────┐  ┌────────────────────────┐
│  [-]  Wertzuwachs    │  │  [-]  Mietsteigerung │
│       p.a.           │  │       p.a.           │
│       2,0%       [+] │  │       1,5%       [+] │
└────────────────────────┘  └────────────────────────┘
```

---

## Betroffene Datei

| Datei | Änderungen |
|-------|------------|
| `InventoryInvestmentSimulation.tsx` | Interface, Berechnung, Tabelle, Annahmen-UI |

---

## Implementierungsschritte

1. **Import erweitern**: `Minus` und `Plus` Icons von lucide-react importieren
2. **Interface ändern**: `monatsbelastung` → `cashflow`
3. **Berechnung anpassen**: `cashflow = miete - annuitaet`
4. **CompactStepper-Komponente** erstellen (inline)
5. **Annahmen-Bereich** ersetzen: Card mit Slidern → Grid mit Steppern
6. **Tabellen-Spalte** ändern: Header + Body mit farbcodiertem Cashflow

