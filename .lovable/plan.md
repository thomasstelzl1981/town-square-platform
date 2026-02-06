
# Korrektur: Portfolio-Charts auf Hauptseite (PortfolioTab.tsx)

## Problem-Analyse

Die verbesserte Visualisierung wurde in `PortfolioSummaryModal.tsx` implementiert, aber der Screenshot zeigt die **Haupt-Portfolio-Seite** (`PortfolioTab.tsx`). Die Charts "Tilgungsverlauf & Wertzuwachs" und "EÜR p.a." werden direkt auf dieser Seite gerendert (Zeilen 603-695) — nicht im Modal.

**Aktueller Zustand:**
- Die Haupt-Seite (`PortfolioTab.tsx`) hat eigene, veraltete Chart-Logik
- Das Modal (`PortfolioSummaryModal.tsx`) hat die neue, verbesserte Logik
- Der User sieht die Haupt-Seite, nicht das Modal

---

## Lösung: Charts auf Hauptseite aktualisieren

### Option A: Charts auf Hauptseite durch verbesserte Version ersetzen (EMPFOHLEN)

Die Charts auf der Hauptseite werden mit derselben korrigierten Logik wie im Modal aktualisiert.

### Option B: Charts von Hauptseite entfernen und ins Modal verlagern

Die Hauptseite zeigt nur KPI-Karten und Tabelle; die detaillierte Analyse ist im Modal bei Klick auf Summenzeile.

**Empfehlung:** Option A — Charts auf Hauptseite verbessern, damit der User sofort die korrekte Visualisierung sieht.

---

## Technische Änderungen in PortfolioTab.tsx

### 1. amortizationData-Berechnung korrigieren (Zeilen 397-425)

**Aktuell (fehlerhaft):**
```typescript
const amortizationData = useMemo(() => {
  // ... berechnet "restschuld", "eigenkapital", "verkehrswert"
  // Problem: "eigenkapital" ist verwirrend, Wertzuwachs nicht parametrisierbar
}, [totals]);
```

**Neu (korrigiert):**
```typescript
const amortizationData = useMemo(() => {
  if (!totals || totals.totalDebt <= 0) return [];
  
  const appreciationRate = 0.02; // 2% Wertzuwachs p.a.
  const years = [];
  let currentDebt = totals.totalDebt;
  let currentValue = totals.totalValue;
  const annuity = totals.totalAnnuity;
  const interestRate = totals.avgInterestRate / 100;
  
  for (let year = 0; year <= 30; year++) {
    const wealth = currentValue - currentDebt;
    
    years.push({ 
      year: 2026 + year, 
      objektwert: Math.round(currentValue),     // Verkehrswert (steigend)
      restschuld: Math.max(0, Math.round(currentDebt)),  // Restschuld (fallend)
      vermoegen: Math.round(wealth)             // Netto-Vermögen (Differenz)
    });
    
    // Nächstes Jahr berechnen
    const interest = currentDebt * interestRate;
    const amortization = Math.min(annuity - interest, currentDebt);
    currentDebt = Math.max(0, currentDebt - amortization);
    currentValue = currentValue * (1 + appreciationRate);
  }
  return years;
}, [totals]);
```

### 2. AreaChart-Darstellung korrigieren (Zeilen 603-659)

**Aktuell (verwirrend):**
- Area "Verkehrswert" + Area "Eigenkapital" überlappen
- Schwer zu interpretieren

**Neu (klar):**
- **Area (hellblau):** Objektwert (steigend)
- **Area (grün, gefüllt):** Netto-Vermögen (Fläche zwischen Objektwert und Restschuld)
- **Line (rot):** Restschuld (fallend bis 0)

```typescript
<AreaChart data={amortizationData}>
  {/* Objektwert als äußere Fläche */}
  <Area 
    type="monotone" 
    dataKey="objektwert" 
    name="Objektwert"
    stroke="hsl(var(--chart-1))" 
    fill="hsl(var(--chart-1))"
    fillOpacity={0.15}
  />
  {/* Vermögen als innere Fläche (grün) */}
  <Area 
    type="monotone" 
    dataKey="vermoegen" 
    name="Netto-Vermögen"
    stroke="hsl(142, 71%, 45%)" 
    fill="hsl(142, 71%, 45%)"
    fillOpacity={0.4}
  />
  {/* Restschuld als Linie (rot, fallend) */}
  <Line 
    type="monotone" 
    dataKey="restschuld" 
    name="Restschuld"
    stroke="hsl(var(--destructive))" 
    strokeWidth={2}
    dot={false}
  />
</AreaChart>
```

### 3. EÜR-Chart korrigieren (Zeilen 661-694)

**Aktuell:** 
- Horizontales Balkendiagramm mit Mischung aus positiven und negativen Werten
- Unübersichtlich

**Neu:**
- Zwei-Spalten-Layout wie im Excel-Referenz
- Oder: Stacked Bar mit Einnahmen vs. Ausgaben nebeneinander

**Alternative:** Die EÜR als Tabelle/Card statt Chart darstellen (übersichtlicher):

```typescript
<Card>
  <CardHeader>
    <CardTitle>Monatliche Übersicht (EÜR)</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-8">
      {/* Einnahmen */}
      <div>
        <h4 className="font-medium text-green-600 mb-3">Einnahmen</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Mieteinnahmen</span>
            <span className="font-medium">{formatCurrency(monthlyRent)}</span>
          </div>
          <div className="flex justify-between">
            <span>Steuervorteil</span>
            <span className="font-medium">{formatCurrency(monthlyTaxBenefit)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Summe</span>
            <span className="text-green-600">{formatCurrency(totalIncome)}</span>
          </div>
        </div>
      </div>
      
      {/* Ausgaben */}
      <div>
        <h4 className="font-medium text-red-600 mb-3">Ausgaben</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Nicht umlf. NK</span>
            <span className="font-medium text-red-600">-{formatCurrency(monthlyNK)}</span>
          </div>
          <div className="flex justify-between">
            <span>Zinsen</span>
            <span className="font-medium text-red-600">-{formatCurrency(monthlyInterest)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tilgung</span>
            <span className="font-medium text-red-600">-{formatCurrency(monthlyAmortization)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Summe</span>
            <span className="text-red-600">-{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
      </div>
    </div>
    
    {/* Ergebnis */}
    <div className="mt-6 pt-4 border-t text-center">
      <span className="text-muted-foreground">Monatliches Ergebnis: </span>
      <span className={`text-lg font-bold ${monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(monthlyResult)}
      </span>
    </div>
  </CardContent>
</Card>
```

---

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | amortizationData + Chart-Rendering + EÜR-Layout korrigieren |

---

## Umsetzungsschritte

1. **amortizationData-Berechnung** (Zeilen 397-425): Felder umbenennen zu `objektwert`, `restschuld`, `vermoegen`
2. **AreaChart** (Zeilen 603-659): DataKeys und Farben anpassen für klare Darstellung
3. **EÜR-Bereich** (Zeilen 661-694): Von BarChart zu Zwei-Spalten-Card-Layout ändern
4. **Monatliche Werte berechnen** für EÜR: Neue useMemo-Hook für monthlyRent, monthlyInterest, etc.

---

## Validierung nach Umsetzung

- [ ] Chart zeigt "Objektwert" (hellblau, steigend), "Restschuld" (rot, fallend), "Netto-Vermögen" (grün)
- [ ] EÜR zeigt Zwei-Spalten-Layout mit Einnahmen links, Ausgaben rechts
- [ ] Monatliches Ergebnis wird korrekt berechnet und angezeigt
- [ ] Werte stimmen mit der Excel-Referenz überein
