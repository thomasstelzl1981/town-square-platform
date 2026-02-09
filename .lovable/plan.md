

# Plan: Kaufy-Homepage mit MOD-08 harmonisieren

## Problemanalyse

Nach detaillierter Analyse habe ich zwei zentrale Probleme identifiziert:

### Problem 1: Falsche Ergebnis-Kachel

| Kaufy Homepage (`KaufyPropertyCard`) | MOD-08 (`InvestmentResultTile`) |
|--------------------------------------|----------------------------------|
| 4:3 Bildformat | 16:9 Bildformat |
| Vertikale Metrik-Liste (Cashflow, Steuervorteil, Netto) | T-Konto-Layout (Einnahmen links grün, Ausgaben rechts rot) |
| Keine Summen-Zeilen (Σ) | Summen-Zeilen vorhanden |
| Einfacher Netto-Footer | Prominenter Monatsbelastung-Footer mit Haken |

**Die `KaufyPropertyCard` ist die ALTE Version.** Die korrekte Komponente ist `InvestmentResultTile` (MOD-08 Standard).

### Problem 2: Eingabefelder-Inkonsistenz

| Feld | InvestmentSearchCard (Kaufy) | SucheTab (MOD-08) | Engine-API |
|------|------------------------------|-------------------|------------|
| zVE | ✅ vorhanden | ✅ vorhanden | `taxableIncome` |
| Eigenkapital | ✅ vorhanden | ✅ vorhanden | `equity` |
| Familienstand | ✅ vorhanden (expanded) | ✅ vorhanden (expanded) | `maritalStatus` |
| Kirchensteuer | ✅ vorhanden (expanded) | ✅ vorhanden (expanded) | `hasChurchTax` |
| Bundesland | ✅ vorhanden (expanded) | ❌ NICHT vorhanden | `churchTaxState` |

**Problem:** Das Bundesland-Feld in der Kaufy-Suche (`state`) wird zwar erfasst, aber **NICHT an die Engine übergeben**!

In `KaufyHome.tsx` Zeile 121-136:
```typescript
await supabase.functions.invoke('sot-investment-engine', {
  body: {
    // ...
    hasChurchTax: false,  // ← HARDCODED!
    // churchTaxState fehlt komplett!
  },
});
```

### Problem 3: Klassische Suche nicht funktional

Die klassische Suche in `InvestmentSearchCard.tsx` erfasst zwar `city`, `maxPrice`, `minArea`, aber:
- Der Button ruft nur `onSearch()` mit default Investment-Werten auf (Zeilen 66-74)
- Es werden keine klassischen Filter an KaufyHome zurückgegeben
- Die Filterung erfolgt nicht

---

## Lösung

### Schritt 1: KaufyPropertyCard durch InvestmentResultTile ersetzen

**Datei:** `src/pages/zone3/kaufy/KaufyHome.tsx`

**Änderung 1 — Import:**
```typescript
// ENTFERNEN:
import { KaufyPropertyCard } from '@/components/zone3/kaufy/KaufyPropertyCard';

// HINZUFÜGEN:
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
```

**Änderung 2 — Interface erweitern:**
```typescript
interface PropertyData {
  // ... bestehende Felder ...
  // NEU für InvestmentResultTile:
  listing_id?: string;
  hero_image_path?: string;
  monthly_rent_total?: number;
}
```

**Änderung 3 — Render-Block (Zeilen 222-228):**
```typescript
{properties.map((prop) => (
  <InvestmentResultTile
    key={prop.public_id}
    listing={{
      listing_id: prop.public_id,
      public_id: prop.public_id,
      title: prop.title,
      asking_price: prop.asking_price,
      property_type: prop.property_type || 'apartment',
      address: '',
      city: prop.city,
      postal_code: prop.postal_code || null,
      total_area_sqm: prop.total_area_sqm || null,
      unit_count: 1,
      monthly_rent_total: prop.monthly_rent || 0,
      hero_image_path: prop.image_url,
    }}
    metrics={searchParams ? {
      monthlyBurden: prop.netBurden || 0,
      roiAfterTax: prop.gross_yield || 0,
      loanAmount: (prop.asking_price - (searchParams.equity || 50000)) * 0.9,
      yearlyInterest: ((prop.asking_price - (searchParams.equity || 50000)) * 0.9) * 0.035,
      yearlyRepayment: ((prop.asking_price - (searchParams.equity || 50000)) * 0.9) * 0.02,
      yearlyTaxSavings: (prop.taxSavings || 0) * 12,
    } : null}
    linkPrefix="/kaufy/immobilien"
  />
))}
```

### Schritt 2: SearchParams Interface erweitern

**Datei:** `src/components/zone3/kaufy/InvestmentSearchCard.tsx`

Das Interface ist bereits vollständig (Zeilen 27-33), aber `state` wird nicht als `churchTaxState` genutzt.

### Schritt 3: Engine-Aufruf korrigieren

**Datei:** `src/pages/zone3/kaufy/KaufyHome.tsx`

**Problem:** Die `handleSearch`-Funktion übergibt `churchTaxState` nicht.

**Änderung — handleSearch-Funktion:**

1. Interface der SearchParams erweitern:
```typescript
const [searchParams, setSearchParams] = useState<{ 
  zvE: number; 
  equity: number;
  maritalStatus: 'single' | 'married';
  hasChurchTax: boolean;
  churchTaxState?: string;
} | null>(null);
```

2. handleSearch anpassen (Zeilen 113-156):
```typescript
const handleSearch = async (params: { 
  zvE: number; 
  equity: number;
  maritalStatus: 'single' | 'married';
  hasChurchTax: boolean;
  state: string;
}) => {
  setIsCalculating(true);
  setSearchParams({
    zvE: params.zvE,
    equity: params.equity,
    maritalStatus: params.maritalStatus,
    hasChurchTax: params.hasChurchTax,
    churchTaxState: params.state,
  });

  const updatedProperties = await Promise.all(
    dbListings.map(async (prop) => {
      try {
        const { data } = await supabase.functions.invoke('sot-investment-engine', {
          body: {
            purchasePrice: prop.asking_price,
            monthlyRent: prop.monthly_rent,
            equity: params.equity,
            termYears: 15,
            repaymentRate: 2,
            taxableIncome: params.zvE,
            maritalStatus: params.maritalStatus,         // ← NEU
            hasChurchTax: params.hasChurchTax,           // ← NEU
            churchTaxState: params.state,                 // ← NEU
            afaModel: 'linear',
            buildingShare: 0.8,
            managementCostMonthly: 25,
            valueGrowthRate: 2,
            rentGrowthRate: 1.5,
          },
        });
        // ...
      }
    })
  );
  // ...
};
```

### Schritt 4: Klassische Suche funktional machen

**Datei:** `src/components/zone3/kaufy/InvestmentSearchCard.tsx`

**Änderung — Callback Interface erweitern:**
```typescript
interface InvestmentSearchCardProps {
  onSearch: (params: SearchParams) => void;
  onClassicSearch?: (params: { city: string; maxPrice: number | null; minArea: number | null }) => void;
  isLoading?: boolean;
}
```

**Änderung — handleSearch für klassische Suche:**
```typescript
const handleSearch = () => {
  if (activeTab === 'investment') {
    onSearch({
      zvE: parseInt(zvE) || 60000,
      equity: parseInt(equity) || 50000,
      maritalStatus,
      hasChurchTax,
      state,
    });
  } else if (onClassicSearch) {
    onClassicSearch({
      city,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      minArea: minArea ? parseInt(minArea) : null,
    });
  }
};
```

**Datei:** `src/pages/zone3/kaufy/KaufyHome.tsx`

**Änderung — handleClassicSearch hinzufügen:**
```typescript
const handleClassicSearch = (params: { city: string; maxPrice: number | null; minArea: number | null }) => {
  // Client-side filtering
  const filtered = dbListings.filter((prop) => {
    if (params.city && !prop.city.toLowerCase().includes(params.city.toLowerCase())) {
      return false;
    }
    if (params.maxPrice && prop.asking_price > params.maxPrice) {
      return false;
    }
    if (params.minArea && (prop.total_area_sqm || 0) < params.minArea) {
      return false;
    }
    return true;
  });
  setCalculatedProperties(filtered);
  setSearchParams(null); // keine Investment-Metriken
};
```

---

## Dateien-Änderungen

| Datei | Änderung |
|-------|----------|
| `src/pages/zone3/kaufy/KaufyHome.tsx` | InvestmentResultTile + Engine-Parameter + Klassische Suche |
| `src/components/zone3/kaufy/InvestmentSearchCard.tsx` | onClassicSearch Callback |

---

## Visuelles Ergebnis (nach Änderung)

### Ergebnis-Kachel (InvestmentResultTile — T-Konto Layout)

```text
┌─────────────────────────────────────┐
│           [BILD 16:9]               │
│                                     │
│                        [3,7% ▲]     │
├──────────────────┬──────────────────┤
│  € 220.000       │         62 m²    │
│  Leipzig         │           ETW    │
├──────────────────┴──────────────────┤
│  EINNAHMEN       │  AUSGABEN        │
│  + Miete  €682   │  − Zinsen €495   │
│  + Steuer €120   │  − Tilgung €283  │
│  ─────────────   │  ─────────────   │
│  Σ        €802   │  Σ         €778  │
├─────────────────────────────────────┤
│  Monatsbelastung      +€24/Mo ✓     │
└─────────────────────────────────────┘
```

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | `/kaufy` aufrufen | `InvestmentResultTile` statt `KaufyPropertyCard` |
| 2 | Investment-Suche mit zVE/EK | T-Konto-Layout mit Einnahmen/Ausgaben |
| 3 | "Mehr Optionen" → Bundesland auswählen | Bundesland wird an Engine übergeben |
| 4 | Kirchensteuer: Ja + Bayern | Korrekte Steuerersparnis (8% statt 9%) |
| 5 | Klassische Suche mit Stadt-Filter | Gefilterte Ergebnisse ohne Investment-Metriken |
| 6 | Klassische Suche mit Preis-Filter | Nur Objekte unter Max-Preis |
| 7 | Klick auf Kachel | Navigation zu `/kaufy/immobilien/{publicId}` |
| 8 | Favoriten-Button | Funktioniert weiterhin |

