
# Anpassung Simulation-Tab: Angleichung an Dashboard-Standard

## Analyse der Unterschiede

### 1. Grafik (Chart) - Farbliche Abweichungen

| Element | Dashboard (MasterGraph) | Simulation (Aktuell) |
|---------|-------------------------|----------------------|
| Chart-Typ | `ComposedChart` mit Gradients | `AreaChart` ohne Gradients |
| Immobilienwert | `hsl(var(--primary))` + Gradient | `hsl(var(--chart-1))` |
| Nettovermögen | `hsl(142, 76%, 36%)` (Grün) + Gradient | `hsl(var(--chart-2))` |
| Restschuld | Gestrichelte Linie `strokeDasharray="5 5"` | Durchgezogene Linie |
| Tilgung | Nicht gezeigt | Nicht gezeigt |

### 2. Tabelle - Fehlende Spalten

| Dashboard (DetailTable40Jahre) | Simulation (Aktuell) |
|--------------------------------|----------------------|
| Jahr | Jahr |
| Miete (rent) | Miete p.a. |
| Zinsen (interest) | — fehlt |
| Tilgung (repayment) | — fehlt |
| Restschuld | Restschuld |
| Steuerersparnis | — (soll entfernt werden) |
| Cashflow | — fehlt |
| Immobilienwert | Verkehrswert |
| Nettovermögen | Netto-Vermögen |

### 3. Steuervorteil-Box

User-Anforderung: **Steuervorteil komplett entfernen**, da nur die reine Immobilien-Performance betrachtet werden soll.

---

## Lösung: Komponenten-Refactoring

### Option A: InventoryInvestmentSimulation anpassen (empfohlen)

Die bestehende Komponente so anpassen, dass sie:
1. Die gleichen Farben wie MasterGraph verwendet
2. Tilgung im Chart zeigt (als zusätzliche Linie oder Area)
3. Die Tabelle um fehlende Spalten erweitert (Annuität, Zins, Monatsbelastung)
4. Die Steuervorteil-Box entfernt

### Option B: DetailTable40Jahre direkt nutzen

Schwieriger, da die Datenstruktur (`YearlyData` aus useInvestmentEngine) nicht identisch ist mit den lokalen Berechnungen.

---

## Änderungen im Detail

### 1. Grafik: Farbschema angleichen + Tilgung hinzufügen

```tsx
// ComposedChart statt AreaChart verwenden
// Gleiche Gradients wie MasterGraph

<defs>
  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
  </linearGradient>
  <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4}/>
    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
  </linearGradient>
</defs>

// Immobilienwert
<Area 
  dataKey="verkehrswert" 
  name="Immobilienwert"
  stroke="hsl(var(--primary))" 
  fill="url(#valueGradient)"
/>

// Nettovermögen
<Area 
  dataKey="nettoVermoegen" 
  name="Nettovermögen"
  stroke="hsl(142, 76%, 36%)" 
  fill="url(#wealthGradient)"
/>

// Restschuld - gestrichelte Linie
<Line 
  dataKey="restschuld" 
  name="Restschuld"
  stroke="hsl(var(--destructive))"
  strokeDasharray="5 5"
/>

// NEU: Tilgung als Linie (kumulativ oder jährlich)
<Line 
  dataKey="tilgung" 
  name="Tilgung (p.a.)"
  stroke="hsl(221, 83%, 53%)"  // Blau
  strokeWidth={2}
/>
```

### 2. Tabelle: Spalten erweitern

Neue Spalten hinzufügen:

| Spalte | Datenfeld | Beschreibung |
|--------|-----------|--------------|
| Netto Kaltmiete | `miete` | Mieteinnahmen p.a. |
| Annuität | `annuität` (neu berechnen) | Annuität p.a. = Zins + Tilgung |
| Zinsen | `zins` | Bereits berechnet |
| Tilgung | `tilgung` | Bereits berechnet |
| Monatsbelastung | Annuität / 12 | Monatliche Rate |

Anpassung der projectionData-Berechnung:

```tsx
years.push({
  year: 2026 + year,
  verkehrswert: Math.round(currentValue),
  restschuld: Math.max(0, Math.round(debt)),
  nettoVermoegen: Math.round(netWealth),
  miete: Math.round(currentRent),
  zins: Math.round(interest),
  tilgung: Math.round(amortization),
  // NEU:
  annuitaet: Math.round(interest + amortization),
  monatsbelastung: Math.round((interest + amortization) / 12),
});
```

### 3. Steuervorteil-Box entfernen

Die gesamte Card (Zeilen 207-230) wird entfernt, da nur die reine Immobilien-Performance relevant ist.

Auch den Steuersatz-Badge im Header entfernen (Zeile 150-152).

---

## Ergebnis-Vorschau

### Grafik (nach Änderung)
- Immobilienwert: Primärfarbe mit Gradient (wie Dashboard)
- Nettovermögen: Grün mit Gradient (wie Dashboard)
- Restschuld: Rot, gestrichelt (wie Dashboard)
- NEU: Tilgung als blaue Linie

### Tabelle (nach Änderung)
| Jahr | Miete | Annuität | Zinsen | Tilgung | Monatsbelastung | Restschuld | Verkehrswert | Nettovermögen |
|------|-------|----------|--------|---------|-----------------|------------|--------------|---------------|
| 2026 | 10.800 € | 8.964 € | 5.472 € | 3.492 € | 747 € | 148.508 € | 224.400 € | 75.892 € |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

---

## Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| `src/components/immobilienakte/InventoryInvestmentSimulation.tsx` | Chart-Farben, Tilgung-Linie, Tabellenspalten, Steuervorteil entfernen |

---

## Implementierungsschritte

1. **Chart anpassen:**
   - `AreaChart` → `ComposedChart` ändern
   - Gradients aus MasterGraph übernehmen
   - Farben angleichen (primary, grün, destructive)
   - Restschuld-Linie gestrichelt machen
   - Tilgung als neue Linie hinzufügen

2. **Steuervorteil-Komponenten entfernen:**
   - Steuersatz-Badge im Header entfernen
   - Komplette Steuervorteil-Card entfernen
   - `taxBenefit` useMemo kann bleiben (schadet nicht) oder ebenfalls entfernt werden

3. **Tabelle erweitern:**
   - projectionData um `annuitaet` und `monatsbelastung` erweitern
   - Neue Spalten in TableHeader/TableBody hinzufügen:
     - Miete, Annuität, Zinsen, Tilgung, Monatsbelastung, Restschuld, Verkehrswert, Nettovermögen

4. **Optional: Mobile-View anpassen**
   - Die aktuelle Komponente hat keine spezielle Mobile-Kartenansicht wie DetailTable40Jahre
   - Könnte bei Bedarf später ergänzt werden
