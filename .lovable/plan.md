
# Kaufy 2026 — Kompletter Neuaufbau

## Analyse-Ergebnis

### 1. Was gelöscht werden muss (`/kaufy/*`)

**13 Seiten-Dateien:**
```
src/pages/zone3/kaufy/
├── KaufyHome.tsx          ← alte Seite
├── KaufyLayout.tsx        ← Layout (behalten, aber umziehen)
├── KaufyExpose.tsx
├── KaufyVermieter.tsx
├── KaufyVerkaeufer.tsx
├── KaufyVertrieb.tsx
├── KaufyBeratung.tsx
├── KaufyModule.tsx
├── KaufyModuleDetail.tsx
├── KaufyBerater.tsx
├── KaufyAnbieter.tsx
├── KaufyMeety.tsx
└── KaufyFAQ.tsx
```

**6 Komponenten-Dateien:**
```
src/components/zone3/kaufy/
├── ArmstrongSidebar.tsx
├── InvestmentSearchCard.tsx  ← ALTE Suche (wird ersetzt)
├── KaufyInputBar.tsx
├── KaufyPropertyCard.tsx     ← ALTE Kachel (wird ersetzt)
├── PerspektivenAccordion.tsx
├── ZahlenSektion.tsx
└── index.ts
```

### 2. Golden Path — Datenfluss Zone 3

| Schritt | Quelle | Daten |
|---------|--------|-------|
| 1 | Zone 2 MOD-04 | Eigentümer aktiviert Verkaufsauftrag |
| 2 | Zone 2 MOD-06 | Listing erstellt (`status: active`) |
| 3 | Zone 2 MOD-06 | `public_id` generiert (z.B. `berlin-a1b2c3d4`) |
| 4 | Zone 2 MOD-06 | `listing_publications` Eintrag `channel: partner_network, status: active` |
| 5 | Zone 1 Admin | Sales Desk zeigt aktive Listings |
| 6 | Zone 3 Kaufy | Query: `listings.status = 'active'` mit `listing_publications` |

**Korrekte Query für Zone 3:**
```sql
SELECT * FROM listings 
WHERE status = 'active'
AND EXISTS (
  SELECT 1 FROM listing_publications lp 
  WHERE lp.listing_id = listings.id 
  AND lp.channel = 'partner_network' 
  AND lp.status = 'active'
)
```

### 3. MOD-08 Komponenten (KORREKT — zu verwenden)

| Komponente | Pfad | Funktion |
|------------|------|----------|
| `InvestmentResultTile` | `src/components/investment/` | T-Konto Kachel (Einnahmen/Ausgaben) |
| `MasterGraph` | `src/components/investment/` | 40-Jahres-Chart |
| `Haushaltsrechnung` | `src/components/investment/` | Cashflow-Tabelle |
| `InvestmentSliderPanel` | `src/components/investment/` | Interaktive Regler |
| `DetailTable40Jahre` | `src/components/investment/` | Excel-Projektion |
| `ExposeImageGallery` | `src/components/investment/` | Bildergalerie |
| `ExposeDocuments` | `src/components/investment/` | Dokumenten-Liste |

### 4. Engine-Parameter (MOD-08 Standard)

```typescript
interface SearchParams {
  taxableIncome: number;        // zVE
  equity: number;               // Eigenkapital
  maritalStatus: 'single' | 'married';  // Familienstand
  hasChurchTax: boolean;        // Kirchensteuer
  churchTaxState?: string;      // Bundesland (BY, BW = 8%, Rest = 9%)
}
```

---

## Phasenplan — Step-by-Step

### Phase 1: Aufräumen (Vorbereitung)

**1.1 Alte Route deaktivieren**
- `routesManifest.ts`: Kaufy-Block auf `kaufy2026` umleiten
- Alte `/kaufy` Routen bleiben vorerst für Fallback

**1.2 Neue Route registrieren**

Änderung in `src/manifests/routesManifest.ts`:
```typescript
kaufy2026: {
  base: "/kaufy2026",
  layout: "Kaufy2026Layout",
  routes: [
    { path: "", component: "Kaufy2026Home", title: "KAUFY Home" },
    { path: "vermieter", component: "Kaufy2026Vermieter", title: "Für Vermieter" },
    { path: "verkaeufer", component: "Kaufy2026Verkaeufer", title: "Für Verkäufer" },
    { path: "vertrieb", component: "Kaufy2026Vertrieb", title: "Für Partner" },
    { path: "immobilien/:publicId", component: "Kaufy2026Expose", title: "Exposé", dynamic: true },
  ],
},
```

---

### Phase 2: Layout & Struktur (Design-System)

**2.1 Neues Layout erstellen**

Datei: `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx`

Struktur gemäß hochgeladenem HTML:
- Header: Logo links, Nav mittig, Auth-Buttons rechts
- Main: Outlet
- Footer: 5-Spalten-Grid (Plattform, Für wen, Unternehmen, etc.)

**2.2 CSS-Klassen erweitern**

In `src/styles/zone3-theme.css` ergänzen:
```css
/* Kaufy 2026 — Schwebende Suchleiste */
.kaufy-hero-wrapper {
  position: relative;
  width: calc(100% - 120px);
  margin: 0 60px;
  border-radius: 20px;
  overflow: visible;
}

.kaufy-search-card {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 1100px;
  background: hsl(var(--z3-secondary));
  border-radius: 24px;
  padding: 16px 28px;
}
```

---

### Phase 3: Suchkomponente (Investment-Suche)

**3.1 Neue Suchkomponente**

Datei: `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx`

Struktur (gemäß Design):
```text
┌─────────────────────────────────────────────────────────────┐
│  [Einkommen (zvE)]  [Eigenkapital]  [Ergebnisse →] [⌄]      │
├─────────────────────────────────────────────────────────────┤
│  Familienstand: Ledig · Verheiratet                         │
│  KiSt: Nein · Ja                                            │
│  Bundesland: [Dropdown]                                     │
└─────────────────────────────────────────────────────────────┘
```

Props:
```typescript
interface Kaufy2026SearchBarProps {
  onSearch: (params: {
    zvE: number;
    equity: number;
    maritalStatus: 'single' | 'married';
    hasChurchTax: boolean;
    churchTaxState?: string;
  }) => void;
  isLoading?: boolean;
  defaultExpanded?: boolean;
}
```

**3.2 Klassische Suche (Tab 2)**

```text
┌─────────────────────────────────────────────────────────────┐
│  [Stadt/PLZ]  [Max. Preis]  [Min. Fläche]  [Suchen →]       │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 4: Homepage (Kaufy2026Home.tsx)

**4.1 Hero-Sektion**

Datei: `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx`

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ╭───────────────────────────────────────────────────────╮  │
│  │                                                       │  │
│  │  [HERO BILD - Hero_Background-2.png]                  │  │
│  │                                                       │  │
│  │  "Die KI-Plattform für Kapitalanlageimmobilien."      │  │
│  │  "Marktplatz & digitale Mietsonderverwaltung"         │  │
│  │                                                       │  │
│  │  [Kostenlos registrieren]                             │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │  [zvE] | [Eigenkapital] | [Ergebnisse →] [⌄]│     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  ╰───────────────────────────────────────────────────────╯  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**4.2 Ergebnis-Sektion (erscheint nach Suche)**

```typescript
{hasSearched && (
  <section className="zone3-section">
    <div className="zone3-container">
      <h2>Passende Kapitalanlage-Objekte</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculatedProperties.map(prop => (
          <InvestmentResultTile 
            key={prop.listing_id}
            listing={prop}
            metrics={metricsCache[prop.listing_id]}
            linkPrefix="/kaufy2026/immobilien"
          />
        ))}
      </div>
    </div>
  </section>
)}
```

**4.3 Weitere Sektionen (aus Design)**

1. **Perspektiven-Karten** (Vermieter, Verkäufer, Vertriebe)
2. **Akkordeon** "Eine Plattform. Drei Perspektiven."
3. **Zahlen-Sektion** (dunkler Hintergrund)

---

### Phase 5: Exposé-Seite

**5.1 Exposé wiederverwenden**

Datei: `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx`

Basiert auf `InvestmentExposePage.tsx` aus MOD-08:
- Gleiche Struktur
- Gleiche Komponenten (`MasterGraph`, `Haushaltsrechnung`, etc.)
- Angepasste Navigation (zurück zu `/kaufy2026`)

```typescript
import {
  MasterGraph,
  Haushaltsrechnung,
  InvestmentSliderPanel,
  DetailTable40Jahre,
  ExposeImageGallery,
  ExposeDocuments,
} from '@/components/investment';
```

---

### Phase 6: Datenabfrage (Golden Path)

**6.1 Listings-Query für Zone 3**

```typescript
const { data: listings } = await supabase
  .from('listings')
  .select(`
    id,
    public_id,
    title,
    asking_price,
    properties!inner (
      id,
      property_type,
      address,
      city,
      postal_code,
      total_area_sqm,
      annual_income
    )
  `)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(50);
```

**6.2 Investment-Engine Aufruf**

```typescript
const handleInvestmentSearch = async (params: SearchParams) => {
  const { data } = await supabase.functions.invoke('sot-investment-engine', {
    body: {
      purchasePrice: listing.asking_price,
      monthlyRent: listing.monthly_rent,
      equity: params.equity,
      taxableIncome: params.zvE,
      maritalStatus: params.maritalStatus,
      hasChurchTax: params.hasChurchTax,
      churchTaxState: params.churchTaxState,
      termYears: 15,
      repaymentRate: 2,
      afaModel: 'linear',
      buildingShare: 0.8,
      managementCostMonthly: 25,
      valueGrowthRate: 2,
      rentGrowthRate: 1.5,
    },
  });
  
  return data; // { summary, projection, inputs }
};
```

---

### Phase 7: Asset-Upload

**7.1 Bilder kopieren**

Die hochgeladenen Bilder werden nach `src/assets/kaufy2026/` kopiert:
- `Hero_Background-2.png` → Hero-Bild
- `Objekt_1-2.png`, `Objekt_2-2.png` → Fallback-Bilder
- `Vermieter_hero-2.jpg` → Vermieter-Seite
- `Perspektiven-2.png` → Zahlen-Sektion

---

### Phase 8: Routing & Manifest

**8.1 Manifest aktualisieren**

```typescript
// routesManifest.ts
kaufy2026: {
  base: "/kaufy2026",
  layout: "Kaufy2026Layout",
  routes: [
    { path: "", component: "Kaufy2026Home", title: "KAUFY Home" },
    { path: "vermieter", component: "Kaufy2026Vermieter", title: "Für Vermieter" },
    { path: "verkaeufer", component: "Kaufy2026Verkaeufer", title: "Für Verkäufer" },
    { path: "vertrieb", component: "Kaufy2026Vertrieb", title: "Für Partner" },
    { path: "immobilien/:publicId", component: "Kaufy2026Expose", title: "Exposé", dynamic: true },
  ],
},
```

**8.2 Armstrong-Context aktualisieren**

In `useArmstrongContext.ts`:
```typescript
if (pathname.startsWith('/kaufy2026')) return 'kaufy';
```

---

## Datei-Erstellungsplan

| # | Datei | Aktion | Beschreibung |
|---|-------|--------|--------------|
| 1 | `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` | NEU | Layout mit Header/Footer |
| 2 | `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | NEU | Homepage mit Hero + Suche |
| 3 | `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` | NEU | Exposé (basiert auf MOD-08) |
| 4 | `src/pages/zone3/kaufy2026/Kaufy2026Vermieter.tsx` | NEU | Vermieter-Seite |
| 5 | `src/pages/zone3/kaufy2026/Kaufy2026Verkaeufer.tsx` | NEU | Verkäufer-Seite |
| 6 | `src/pages/zone3/kaufy2026/Kaufy2026Vertrieb.tsx` | NEU | Partner-Seite |
| 7 | `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx` | NEU | Investment-Suche |
| 8 | `src/components/zone3/kaufy2026/Kaufy2026ClassicSearch.tsx` | NEU | Klassische Suche |
| 9 | `src/components/zone3/kaufy2026/Kaufy2026Hero.tsx` | NEU | Hero mit Floating Search |
| 10 | `src/components/zone3/kaufy2026/PerspektivenKarten.tsx` | NEU | 3er-Grid |
| 11 | `src/components/zone3/kaufy2026/PerspektivenAkkordeon.tsx` | NEU | Akkordeon |
| 12 | `src/components/zone3/kaufy2026/ZahlenSektion.tsx` | NEU | Dunkle Sektion |
| 13 | `src/components/zone3/kaufy2026/index.ts` | NEU | Barrel-Export |
| 14 | `src/manifests/routesManifest.ts` | ÄNDERN | kaufy2026 hinzufügen |
| 15 | `src/styles/zone3-theme.css` | ÄNDERN | Kaufy2026-Styles |
| 16 | `src/assets/kaufy2026/*` | NEU | Bilder kopieren |

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | `/kaufy2026` aufrufen | Hero mit Floating-Suchleiste |
| 2 | Suchleiste sichtbar | zvE, Eigenkapital, Ergebnisse-Button |
| 3 | Expand-Toggle klicken | Familienstand, KiSt, Bundesland erscheinen |
| 4 | "Ergebnisse →" klicken | Listings laden, Engine berechnet |
| 5 | Ergebnis-Kacheln | `InvestmentResultTile` mit T-Konto |
| 6 | Kachel klicken | Navigation zu `/kaufy2026/immobilien/{publicId}` |
| 7 | Exposé-Seite | MasterGraph, Haushaltsrechnung, Slider |
| 8 | Zurück-Button | Navigation zu `/kaufy2026` |
| 9 | Responsive (Mobile) | Suche + Kacheln funktional |
| 10 | Footer | 5-Spalten-Grid mit Links |

---

## Bestätigung: Zone-Trennung

| Zone | Rolle | Kaufy2026-Bezug |
|------|-------|-----------------|
| Zone 1 | Admin | Sales Desk überwacht Listings (Read-Only) |
| Zone 2 | Portal | MOD-04 aktiviert Verkaufsauftrag, MOD-06 erstellt Listing |
| Zone 3 | Website | Liest `listings` + `listing_publications`, zeigt Investment-Engine |

**Zone 2 hat KEINE direkte Verbindung zu Zone 3.**
Daten fließen über die Datenbank (Listings mit `status: active`).

---

## Nächste Schritte nach Freigabe

1. Assets kopieren (Bilder)
2. Neue Dateien erstellen (Layout, Home, Komponenten)
3. Manifest aktualisieren
4. CSS erweitern
5. Manueller Test aller Flows
6. Alte `/kaufy` Route als Fallback behalten
