
# Investment Engine — Zentraler Fix-Plan (Revidiert)

## Analyse: Was ist das Problem?

### 3 Stellen, 3 verschiedene Implementierungen

| Kontext | Datei | Query-Problem | Card-Komponente |
|---------|-------|---------------|-----------------|
| **Zone 3 Kaufy** | `KaufyHome.tsx` | ❌ MOCK_PROPERTIES statt DB | `KaufyPropertyCard` |
| **MOD-08 Suche** | `SucheTab.tsx` | ⚠️ Kein `annual_income` in Query | `InvestmentSearchCard` |
| **MOD-09 Beratung** | `BeratungTab.tsx` | ❌ `annual_rent_income` (falsch!) | `PartnerPropertyGrid` |

### Was funktioniert (Screenshots vs. Jetzt)

| Element | Screenshot (Alt) | Jetzt | Problem |
|---------|------------------|-------|---------|
| Hero-Suche | ✅ zVE + EK + Toggle | ✅ Vorhanden | Funktioniert |
| Property Cards | ✅ Mini-EÜR | ⚠️ Teilweise | Query liefert keine Mietdaten |
| Detail-Modal | ✅ 5-Zeilen + Slider | ⚠️ Unterschiedlich | Verschiedene Modals |
| Daten aus DB | ✅ Echte Listings | ❌ MOCK / Query-Fehler | Kernproblem! |

### Root Cause (Warum alte Kaufy funktionierte, jetzt nicht)

1. **Alte Kaufy:** Direkte DB-Anbindung mit korrektem Feldnamen
2. **Jetzt:** 
   - Zone 3: `MOCK_PROPERTIES` Array (keine DB!)
   - MOD-08: Query ohne `annual_income`
   - MOD-09: Query mit falschem Feldnamen `annual_rent_income`

---

## Lösung: 3 Ebenen

### Ebene 1: Daten-Fixes (KRITISCH — P0)

#### 1.1 BeratungTab.tsx — Query-Fix

**Zeile 75:** `annual_rent_income` → `annual_income`

```typescript
// VORHER:
properties!inner (
  address, city, property_type, total_area_sqm, annual_rent_income
)

// NACHHER:
properties!inner (
  address, city, property_type, total_area_sqm, annual_income
)
```

**Zeile 85:** Variable anpassen

```typescript
// VORHER:
const annualRent = props?.annual_rent_income || 0;

// NACHHER:
const annualRent = props?.annual_income || 0;
```

#### 1.2 SucheTab.tsx — Query erweitern

**Zeilen 86-98:** `annual_income` hinzufügen

```typescript
// VORHER:
properties!inner (
  id, address, city, postal_code, property_type, total_area_sqm
)

// NACHHER:
properties!inner (
  id, address, city, postal_code, property_type, total_area_sqm, annual_income
)
```

**Zeile 130:** Echte Mietdaten verwenden

```typescript
// VORHER:
monthly_rent_total: 0

// NACHHER:
monthly_rent_total: item.properties?.annual_income 
  ? item.properties.annual_income / 12 
  : 0
```

#### 1.3 KaufyHome.tsx — Echte DB-Daten statt Mock

**Zeilen 28-77:** `MOCK_PROPERTIES` ersetzen durch DB-Query

```typescript
// Neuer useQuery Hook:
const { data: listings = [], isLoading: isLoadingListings } = useQuery({
  queryKey: ['kaufy-public-listings'],
  queryFn: async () => {
    // 1. Hole Kaufy-Publikationen
    const { data: publications } = await supabase
      .from('listing_publications')
      .select('listing_id')
      .eq('channel', 'kaufy')
      .eq('status', 'active');

    if (!publications?.length) return [];

    // 2. Hole Listing-Details mit Property-Daten
    const { data: listingsData } = await supabase
      .from('listings')
      .select(`
        id, public_id, title, asking_price,
        properties!inner (
          property_type, address, city, postal_code, 
          total_area_sqm, construction_year, annual_income
        )
      `)
      .in('id', publications.map(p => p.listing_id))
      .eq('status', 'active');

    // 3. Transformieren
    return (listingsData || []).map(l => ({
      public_id: l.public_id,
      title: l.title || `${l.properties.property_type} ${l.properties.city}`,
      asking_price: l.asking_price || 0,
      monthly_rent: l.properties.annual_income ? l.properties.annual_income / 12 : 0,
      property_type: l.properties.property_type,
      city: l.properties.city,
      postal_code: l.properties.postal_code,
      total_area_sqm: l.properties.total_area_sqm,
      year_built: l.properties.construction_year,
      gross_yield: l.asking_price > 0 
        ? ((l.properties.annual_income || 0) / l.asking_price) * 100 
        : 0,
    }));
  },
});

// State anpassen:
const [properties, setProperties] = useState<PropertyData[]>([]);

useEffect(() => {
  if (listings.length > 0) {
    setProperties(listings);
  }
}, [listings]);
```

**handleSearch anpassen:** Verwendet `properties` aus DB statt `MOCK_PROPERTIES`

---

### Ebene 2: Einheitliche Komponenten (P1)

Die drei Card-Komponenten haben **ähnliches Design**, aber leichte Unterschiede. Für Konsistenz:

#### 2.1 Gemeinsame Property-Card Features

| Feature | KaufyPropertyCard | InvestmentSearchCard | PartnerPropertyGrid |
|---------|------------------|---------------------|---------------------|
| Typ-Badge | ✅ | ✅ | ✅ |
| Rendite-Badge | ✅ | ✅ | ✅ |
| Herz-Button | ✅ | ✅ | ✅ |
| Mini-EÜR | ✅ 3 Zeilen | ⚠️ 2 Zeilen | ✅ 3 Zeilen |
| Netto-Highlight | ✅ Box | ⚠️ Inline | ✅ Border |

**Empfehlung:** Alle auf das 3-Zeilen-Format angleichen:

```text
+ Cashflow vor Steuer    +XXX €/Mo  (grün/rot)
+ Steuervorteil          +XXX €/Mo  (grün)
─────────────────────────────────────
Netto-Belastung          +XXX €/Mo  (highlight)
```

#### 2.2 Unified Property Card (Optional, Phase 2)

Eine neue `UnifiedPropertyCard.tsx` könnte alle drei ersetzen:

```typescript
interface UnifiedPropertyCardProps {
  property: PropertyData;
  metrics?: CalculatedMetrics;
  variant: 'zone2' | 'zone3';  // Styling-Variante
  onFavorite?: () => void;
  linkTo: string;
}
```

---

### Ebene 3: Konsistentes Detail-Modal (P2)

Alle drei Kontexte sollten dasselbe Modal-Layout nutzen:

```text
┌─────────────────────────────────────────────────────────────┐
│ [X] Investment-Kalkulation — Objekt-Titel                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐  ┌────────────────────────────┐ │
│ │ 40-JAHRES-CHART         │  │ PARAMETER (Slider)         │ │
│ │ • Objektwert (blau)     │  │ zVE: [══════●══] 60.000 €  │ │
│ │ • Restschuld (rot)      │  │ EK:  [══════●══] 50.000 €  │ │
│ │ • Netto-Vermögen (grün) │  │ Zins: [══●═════] 3,5%      │ │
│ └─────────────────────────┘  │ Tilg: [═══●════] 2,0%      │ │
│                              │ Wert: [════●═══] 2,0%      │ │
│ ┌─────────────────────────┐  │                            │ │
│ │ MONATSÜBERSICHT         │  │ ════════════════════════   │ │
│ │ Mieteinnahme    +500 €  │  │ Monatliche Belastung:      │ │
│ │ Darlehensrate   -565 €  │  │ 108 € / Monat              │ │
│ │ Bewirtschaftung -179 €  │  │                            │ │
│ │ Steuereffekt    +112 €  │  │ [PDF] [Favorit] [Anfrage]  │ │
│ │ ─────────────────────   │  └────────────────────────────┘ │
│ │ Netto          -132 €   │                                 │
│ └─────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Datei-Änderungen Übersicht

| Datei | Änderung | Priorität |
|-------|----------|-----------|
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | `annual_rent_income` → `annual_income` | **P0** |
| `src/pages/portal/investments/SucheTab.tsx` | Query um `annual_income` erweitern | **P0** |
| `src/pages/zone3/kaufy/KaufyHome.tsx` | MOCK durch DB-Query ersetzen | **P0** |
| `src/components/investment/InvestmentSearchCard.tsx` | Mini-EÜR 3-Zeilen-Format | P1 |
| `src/components/zone3/kaufy/KaufyPropertyCard.tsx` | (bereits korrekt) | — |
| `src/components/vertriebspartner/PartnerPropertyGrid.tsx` | (bereits korrekt) | — |

---

## Erwartetes Ergebnis nach Fix

| Test | Route | Erwartung |
|------|-------|-----------|
| 1 | `/portal/vertriebspartner/beratung` | Musterimmobilie "Leipziger Straße 42" erscheint mit Metrics |
| 2 | `/portal/investments/suche` | Objekte zeigen echte Rendite + Belastung |
| 3 | `/kaufy` | Echte Listings aus DB (keine Mock-Daten) |
| 4 | Alle Cards | Identisches 3-Zeilen EÜR-Format |

---

## Technische Details

### Warum 3 Fixes genügen

1. **Investment Engine funktioniert** — Der `sot-investment-engine` Edge Function ist korrekt
2. **Card-Komponenten funktionieren** — Sie zeigen Daten korrekt an, wenn sie welche bekommen
3. **Problem ist die Datenquelle** — Falsche Queries und Mock-Daten

### Reihenfolge der Umsetzung

1. **Schritt 1 (5 min):** BeratungTab.tsx Query-Fix
2. **Schritt 2 (5 min):** SucheTab.tsx Query-Erweiterung  
3. **Schritt 3 (15 min):** KaufyHome.tsx DB-Integration
4. **Schritt 4 (Optional):** Card-Angleichung

### Ist der Plan ausreichend?

**Ja**, der Plan ist ausreichend für die **Kernfunktion**:
- ✅ Behebt alle Query-Fehler
- ✅ Ersetzt Mock-Daten durch echte DB
- ✅ Nutzt vorhandene, funktionierende Investment Engine
- ✅ Card-Komponenten sind bereits ähnlich genug

Die optionale Vereinheitlichung (Unified Components) kann in einer späteren Phase erfolgen, wenn die Kernfunktion steht.
