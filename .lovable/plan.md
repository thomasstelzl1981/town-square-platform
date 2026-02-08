
# Plan: Kaufy Zone 3 Investment-Engine Harmonisierung

## Detaillierte Problemanalyse

Nach gründlicher Code- und visueller Analyse habe ich folgende Diskrepanzen identifiziert:

### Seite 1: KaufyHome.tsx (Homepage)
**Status: Funktioniert korrekt**
- Investment-Suchfeld mit zVE/EK vorhanden (`InvestmentSearchCard`)
- Property-Cards mit Investment-Metriken (`KaufyPropertyCard`)
- Berechnung via Edge Function funktioniert

### Seite 2: KaufyImmobilien.tsx (Immobilien-Übersicht)
**Status: Veraltet — verwendet nicht die Investment-Engine**

| Aspekt | Ist-Zustand | Soll-Zustand (wie MOD-08) |
|--------|-------------|---------------------------|
| Suchfeld | Nur Text-Filter | zVE + EK Investment-Suche |
| Cards | Eigene simple Cards | `InvestmentResultTile` mit T-Konto |
| Berechnung | Keine | `useInvestmentEngine` + `metricsCache` |

**Konkret fehlt:**
- Zeilen 166-177: Nur einfache Textsuche
- Zeilen 220-281: Eigene Card-Implementierung ohne Investment-Metriken

### Seite 3: KaufyExpose.tsx (Einzelobjekt-Exposé)
**Status: Teilweise veraltet**

| Aspekt | Ist-Zustand | Soll-Zustand (wie MOD-08) |
|--------|-------------|---------------------------|
| Haushaltsrechnung | `variant="detailed"` (Zeile 385) | `variant="ledger"` (T-Konto) |
| Bildergalerie | Eigene Implementierung (Zeilen 276-319) | `ExposeImageGallery` SSOT |
| Dokumente | Nicht vorhanden | `ExposeDocuments` |
| Karte | Nicht vorhanden | `ExposeLocationMap` |
| Key Facts | 4 Spalten | 6 Spalten (+ Rendite, Heizung) |

---

## Lösung: Drei-Phasen-Implementierung

### Phase 1: KaufyImmobilien.tsx — Investment-Suche integrieren

**Neue Imports hinzufügen:**
```typescript
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { InvestmentSearchCard } from '@/components/zone3/kaufy/InvestmentSearchCard';
```

**Neue State-Variablen:**
```typescript
const [hasSearched, setHasSearched] = useState(false);
const [metricsCache, setMetricsCache] = useState<Record<string, any>>({});
const [searchParams, setSearchParams] = useState<{ zvE: number; equity: number } | null>(null);
const { calculate, isLoading: isCalculating } = useInvestmentEngine();
```

**Investment-Berechnung (analog zu MOD-08 SucheTab.tsx Zeilen 237-280):**
```typescript
const handleInvestmentSearch = useCallback(async (params: { zvE: number; equity: number }) => {
  setSearchParams(params);
  const newCache: Record<string, any> = {};
  
  await Promise.all(listings.slice(0, 20).map(async (listing) => {
    const input: CalculationInput = {
      ...defaultInput,
      purchasePrice: listing.asking_price,
      monthlyRent: listing.monthly_rent_total || (listing.asking_price * 0.04 / 12),
      equity: params.equity,
      taxableIncome: params.zvE,
      maritalStatus: 'single',
      hasChurchTax: false,
    };

    const result = await calculate(input);
    if (result) {
      newCache[listing.id] = {
        monthlyBurden: result.summary.monthlyBurden,
        roiAfterTax: result.summary.roiAfterTax,
        loanAmount: result.summary.loanAmount,
        yearlyInterest: result.summary.yearlyInterest,
        yearlyRepayment: result.summary.yearlyRepayment,
        yearlyTaxSavings: result.summary.yearlyTaxSavings,
      };
    }
  }));

  setMetricsCache(newCache);
  setHasSearched(true);
}, [listings, calculate]);
```

**Hero-Section erweitern:**
Ersetzen der einfachen Textsuche durch `InvestmentSearchCard`:
```tsx
{/* Investment Search im Hero */}
<InvestmentSearchCard onSearch={handleInvestmentSearch} isLoading={isCalculating} />
```

**Cards durch InvestmentResultTile ersetzen:**
```tsx
{filteredListings.map((listing) => (
  <InvestmentResultTile
    key={listing.id}
    listing={{
      listing_id: listing.id,
      public_id: listing.public_id,
      title: listing.title,
      asking_price: listing.asking_price,
      property_type: listing.property_type,
      address: listing.address,
      city: listing.city,
      postal_code: listing.postal_code,
      total_area_sqm: listing.total_area_sqm,
      unit_count: 1,
      monthly_rent_total: listing.monthly_rent_total || 0,
      hero_image_path: listing.hero_image_path,
    }}
    metrics={hasSearched ? metricsCache[listing.id] : null}
    isFavorite={favorites.includes(listing.public_id)}
    onToggleFavorite={() => toggleFavorite(listing.public_id)}
    linkPrefix="/kaufy/immobilien"
  />
))}
```

**Interface erweitern:**
```typescript
interface PublicListing {
  // ... bestehende Felder ...
  monthly_rent_total?: number; // hinzufügen für Berechnung
}
```

### Phase 2: KaufyExpose.tsx — SSOT-Komponenten nutzen

**Änderung 1: Haushaltsrechnung (Zeile 385)**
```tsx
// VORHER:
<Haushaltsrechnung result={calcResult} variant="detailed" showMonthly={true} />

// NACHHER:
<Haushaltsrechnung result={calcResult} variant="ledger" showMonthly={true} />
```

**Änderung 2: Bildergalerie ersetzen (Zeilen 276-319)**
```tsx
// VORHER: 43 Zeilen eigene Implementierung

// NACHHER:
import { ExposeImageGallery } from '@/components/investment';

<ExposeImageGallery propertyId={listing.property_id} aspectRatio="video" />
```

Dafür muss `property_id` in der Listing-Query hinzugefügt werden.

**Änderung 3: Dokumente hinzufügen (nach DetailTable40Jahre)**
```tsx
import { ExposeDocuments } from '@/components/investment';

{/* Nach DetailTable40Jahre */}
<ExposeDocuments propertyId={listing.property_id} viewerType="external" />
```

**Änderung 4: Google Maps hinzufügen (am Ende)**
```tsx
import { ExposeLocationMap } from '@/components/verkauf';

{/* Am Ende des Contents */}
<ExposeLocationMap
  address={listing.address}
  city={listing.city}
  postalCode={listing.postal_code}
  showExactLocation={false}
/>
```

**Änderung 5: Key Facts auf 6 Spalten erweitern (Zeilen 337-358)**
```tsx
<div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 rounded-xl bg-muted/50">
  {/* Bestehende 4 Spalten */}
  <div>
    <p className="text-sm text-muted-foreground">Wohnfläche</p>
    <p className="font-semibold flex items-center gap-1">
      <Maximize2 className="w-4 h-4" /> {listing.total_area_sqm} m²
    </p>
  </div>
  {/* ... weitere bestehende ... */}
  
  {/* 2 neue Spalten */}
  <div>
    <p className="text-sm text-muted-foreground">Rendite (brutto)</p>
    <p className="font-semibold">
      {listing.asking_price > 0 
        ? `${((params.monthlyRent * 12) / listing.asking_price * 100).toFixed(1)}%`
        : '–'}
    </p>
  </div>
  <div>
    <p className="text-sm text-muted-foreground">Heizung</p>
    <p className="font-semibold">{listing.heating_type || '–'}</p>
  </div>
</div>
```

### Phase 3: Listing-Query erweitern

**KaufyExpose.tsx — property_id in Query (Zeile 74-93)**
```typescript
const { data: listing, isLoading } = useQuery({
  queryKey: ['public-listing', publicId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, public_id, title, description, asking_price,
        properties!inner (
          id,           // ← HINZUFÜGEN für ExposeImageGallery, ExposeDocuments
          property_type, address, city, postal_code,
          total_area_sqm, year_built, annual_income,
          heating_type  // ← HINZUFÜGEN für Key Facts
        )
      `)
      .eq('public_id', publicId)
      .single();
    
    // ... Transform mit property_id: props.id
  }
});
```

---

## Dateien-Änderungen

| Datei | Änderungsumfang |
|-------|-----------------|
| `src/pages/zone3/kaufy/KaufyImmobilien.tsx` | Investment-Suche + InvestmentResultTile (ca. 80 Zeilen ändern) |
| `src/pages/zone3/kaufy/KaufyExpose.tsx` | SSOT-Komponenten + variant="ledger" (ca. 60 Zeilen ändern) |

---

## Technische Abhängigkeiten

Alle benötigten Komponenten existieren bereits:
- `InvestmentSearchCard` — bereits in `src/components/zone3/kaufy/`
- `InvestmentResultTile` — bereits in `src/components/investment/`
- `ExposeImageGallery` — bereits in `src/components/investment/`
- `ExposeDocuments` — bereits in `src/components/investment/`
- `ExposeLocationMap` — bereits in `src/components/verkauf/`
- `useInvestmentEngine` — bereits in `src/hooks/`

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Kaufy → /kaufy/immobilien laden | Investment-Suchfelder (zVE, EK) sichtbar |
| 2 | Suche ausführen | T-Konto-Kacheln mit Monatsbelastung erscheinen |
| 3 | Kachel klicken → Exposé | Bildergalerie mit `ExposeImageGallery` |
| 4 | Exposé → Haushaltsrechnung | T-Konto-Layout (ledger) statt detailed |
| 5 | Exposé scrollen | Dokumente-Sektion sichtbar |
| 6 | Exposé am Ende | Google Maps Karte sichtbar |
| 7 | Key Facts prüfen | 6 Spalten inkl. Rendite und Heizung |
| 8 | Kaufy Homepage bleibt unverändert | Keine Regression |
| 9 | MOD-08 bleibt unverändert | Keine Regression |

---

## Zusammenfassung

Die Kaufy-Website hat drei unterschiedliche Zustände:

1. **KaufyHome** (Homepage): ✅ Nutzt Investment-Engine korrekt
2. **KaufyImmobilien** (Übersicht): ❌ Veraltet — keine Investment-Suche, simple Cards
3. **KaufyExpose** (Exposé): ❌ Teilweise veraltet — `variant="detailed"`, eigene Galerie

Die Lösung synchronisiert alle drei Seiten mit dem MOD-08 Standard durch:
- Integration der `InvestmentSearchCard` in die Übersichtsseite
- Verwendung der `InvestmentResultTile` mit T-Konto-Layout
- Umstellung auf SSOT-Komponenten (`ExposeImageGallery`, `ExposeDocuments`, `ExposeLocationMap`)
- Änderung der Haushaltsrechnung auf `variant="ledger"`
