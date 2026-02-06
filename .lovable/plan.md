

# Vollständiger Korrektur- und Erweiterungsplan

## Übersicht

Dieser Plan umfasst alle besprochenen Änderungen:
1. **Datenbank**: Erweiterung von `landlord_contexts` und `context_members`
2. **KontexteTab → Vermietereinheiten**: UI-Neugestaltung mit Eigentümer-Erfassung
3. **CreateContextDialog**: 2-Schritt-Wizard mit Person-/Gesellschaftsdaten
4. **PortfolioTab**: Chart-Korrektur (ComposedChart), Jahrestabelle, Dropdown
5. **MOD-05/MOD-06**: Kontext-Filterung hinzufügen

---

## Teil 1: Datenbank-Erweiterungen

### 1.1 Tabelle `landlord_contexts` — Neue Felder

| Neues Feld | Typ | Default | Beschreibung |
|------------|-----|---------|--------------|
| `tax_rate_percent` | NUMERIC | 30.0 | Fester Steuersatz (%) — editierbar |
| `managing_director` | TEXT | NULL | Geschäftsführer (bei BUSINESS) |

**Migration SQL:**
```sql
ALTER TABLE landlord_contexts
  ADD COLUMN IF NOT EXISTS tax_rate_percent NUMERIC DEFAULT 30.0,
  ADD COLUMN IF NOT EXISTS managing_director TEXT;

COMMENT ON COLUMN landlord_contexts.tax_rate_percent IS 
  'Fester Steuersatz in %. Standardwert 30%. Keine automatische Berechnung über Splitting-Tabelle.';
```

### 1.2 Tabelle `context_members` — Erweiterte Personendaten

Aktuelle Spalten: `id`, `context_id`, `tenant_id`, `first_name`, `last_name`, `ownership_share`, `profession`, `gross_income_yearly`, `tax_class`, `church_tax`

| Neues Feld | Typ | Beschreibung |
|------------|-----|--------------|
| `birth_name` | TEXT | Geburtsname (optional) |
| `birth_date` | DATE | Geburtsdatum |
| `street` | TEXT | Straße |
| `house_number` | TEXT | Hausnummer |
| `postal_code` | TEXT | PLZ |
| `city` | TEXT | Ort |
| `country` | TEXT (default 'Deutschland') | Land |
| `email` | TEXT | E-Mail-Adresse |
| `phone` | TEXT | Telefonnummer |

**Migration SQL:**
```sql
ALTER TABLE context_members
  ADD COLUMN IF NOT EXISTS birth_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS house_number TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;
```

### 1.3 Seed-Daten aktualisieren

Die Demo-Eigentümer für "Familie Mustermann" werden mit Beispieldaten erweitert:

```sql
UPDATE context_members SET
  birth_date = '1980-05-01',
  street = 'Musterstraße',
  house_number = '15',
  postal_code = '04103',
  city = 'Leipzig',
  email = 'max@mustermann.de',
  phone = '+49 341 1234567'
WHERE first_name = 'Max' AND last_name = 'Mustermann';

UPDATE context_members SET
  birth_name = 'Schmidt',
  birth_date = '1982-08-15',
  street = 'Musterstraße',
  house_number = '15',
  postal_code = '04103',
  city = 'Leipzig',
  email = 'lisa@mustermann.de',
  phone = '+49 341 7654321'
WHERE first_name = 'Lisa' AND last_name = 'Mustermann';
```

---

## Teil 2: UI-Umbenennung und KontexteTab-Neugestaltung

### 2.1 Label-Änderungen

| Ort | Alt | Neu |
|-----|-----|-----|
| `tile_catalog.yaml` MOD-04 Tile 1 | "Kontexte" | "Vermietereinheiten" |
| `KontexteTab.tsx` Header | "Weitere Kontexte" | "Vermietereinheiten" |
| `KontexteTab.tsx` Button | "Kontext anlegen" | "Vermietereinheit anlegen" |
| `CreateContextDialog.tsx` Titel | "Neuen Kontext anlegen" | "Vermietereinheit anlegen" |

**Route bleibt unverändert:** `/portal/immobilien/kontexte`

### 2.2 Standard-Kontext-Card entfernen

**Datei:** `src/pages/portal/immobilien/KontexteTab.tsx`

- Zeilen 91-148 (Standard-Kontext-Card) → **Entfernen**
- Zeile 150 (Separator) → **Entfernen**
- Zeile 79: `additionalContexts` Filter entfernen → Alle Kontexte gleich behandeln

**Neue Struktur:**
```
┌─────────────────────────────────────────────────────────────┐
│  Vermietereinheiten                [+ Vermietereinheit anlegen] │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐  ┌───────────────────────────┐ │
│  │ 👥 Familie Mustermann     │  │ 🏢 [GmbH wenn vorhanden]  │ │
│  │ PRIVAT · Vermögensverw.   │  │ BUSINESS · FIBU           │ │
│  │ ────────────────────────  │  │ ────────────────────────  │ │
│  │ Max Mustermann            │  │ Gesellschaft: Muster GmbH │ │
│  │ *01.05.1980 · 50%         │  │ GF: Hans Müller           │ │
│  │ Lisa Mustermann           │  │ HRB: 12345 B              │ │
│  │ geb. Schmidt · *15.08.82  │  │ USt-ID: DE123456789       │ │
│  │ 50%                       │  │ Steuersatz: 30%           │ │
│  │ ────────────────────────  │  │ ────────────────────────  │ │
│  │ Steuersatz: 30%           │  │ 0 Objekt(e)               │ │
│  │ 1 Objekt(e)               │  │                           │ │
│  │ [Bearbeiten] [Zuordnen]   │  │ [Bearbeiten] [Zuordnen]   │ │
│  └───────────────────────────┘  └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Erweiterte Kontext-Karten mit Eigentümer-Anzeige

**Neue Query:** `context_members` für jeden Kontext laden

```typescript
const { data: membersByContext } = useQuery({
  queryKey: ['context-members', activeTenantId],
  queryFn: async () => {
    const { data } = await supabase
      .from('context_members')
      .select('*')
      .eq('tenant_id', activeTenantId!);
    
    // Gruppieren nach context_id
    const byContext = new Map<string, ContextMember[]>();
    data?.forEach(m => {
      const list = byContext.get(m.context_id) || [];
      list.push(m);
      byContext.set(m.context_id, list);
    });
    return byContext;
  },
  enabled: !!activeTenantId,
});
```

**Karten-Rendering:**

Für **PRIVATE** Kontexte:
- Zeigt alle Eigentümer nebeneinander
- Geburtsdatum, Geburtsname (wenn vorhanden), Eigentumsanteil

Für **BUSINESS** Kontexte:
- Gesellschaftsname (= ctx.name)
- Geschäftsführer (ctx.managing_director)
- HRB-Nummer, USt-ID
- Steuersatz (ctx.tax_rate_percent)

---

## Teil 3: CreateContextDialog als 2-Schritt-Wizard

### 3.1 Wizard-Struktur

**Schritt 1: Grunddaten der Vermietereinheit**
- Name (z.B. "Familie Mustermann" oder "Muster Immobilien GmbH")
- Typ: Privat / Geschäftlich
- Steuerregime: EÜR / FIBU / Vermögensverwaltung
- **Steuersatz:** Editierbares Feld, Default 30%
- Adresse (Straße, Hausnr., PLZ, Ort) — für Briefkopf

**Schritt 2a: Bei PRIVATE — Eigentümer erfassen**
```
┌────────────────────────────────────────────────────────────────────┐
│  Eigentümer                                [+ Weiteren hinzufügen] │
├──────────────────────────────┬─────────────────────────────────────┤
│  Eigentümer 1                │  Eigentümer 2                       │
│  ──────────────────────────  │  ──────────────────────────         │
│  Vorname*        [________]  │  Vorname*        [________]         │
│  Nachname*       [________]  │  Nachname*       [________]         │
│  Geburtsname     [________]  │  Geburtsname     [________]         │
│  Geburtsdatum*   [__/__/__]  │  Geburtsdatum*   [__/__/__]         │
│  ──────────────────────────  │  ──────────────────────────         │
│  Straße          [________]  │  Straße          [________]         │
│  Hausnummer      [___]       │  Hausnummer      [___]              │
│  PLZ             [_____]     │  PLZ             [_____]            │
│  Ort             [________]  │  Ort             [________]         │
│  ──────────────────────────  │  ──────────────────────────         │
│  E-Mail          [________]  │  E-Mail          [________]         │
│  Telefon         [________]  │  Telefon         [________]         │
│  ──────────────────────────  │  ──────────────────────────         │
│  Eigentumsanteil [50] %      │  Eigentumsanteil [50] %             │
└──────────────────────────────┴─────────────────────────────────────┘
```

**Schritt 2b: Bei BUSINESS — Gesellschaftsdaten**
- Gesellschaftsname (= Name aus Schritt 1)
- Geschäftsführer (Freitext)
- Rechtsform (Select: GmbH, UG, GmbH & Co. KG, etc.)
- HRB-Nummer
- USt-IdNr.

### 3.2 Speicherlogik

1. **landlord_contexts** Insert mit allen Grunddaten + `tax_rate_percent` + `managing_director`
2. **context_members** Insert für jeden Eigentümer (bei PRIVATE)

---

## Teil 4: PortfolioTab — Chart & Tabelle & Dropdown

### 4.1 Chart-Korrektur: AreaChart → ComposedChart

**Problem:** Die `Line`-Komponente (Restschuld) wird UNTER den `Area`-Flächen gerendert.

**Lösung:** `ComposedChart` statt `AreaChart` verwenden.

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

**Zeile 26 (Import ändern):**
```typescript
// ALT:
import { ..., Area, AreaChart } from 'recharts';

// NEU:
import { ..., Area, ComposedChart } from 'recharts';
```

**Zeilen 609-652 (Chart-Komponente ändern):**
```typescript
// ALT:
<AreaChart data={amortizationData}>

// NEU:
<ComposedChart data={amortizationData}>
```

**Reihenfolge der Elemente bleibt:**
1. Area (objektwert) — hellblau
2. Area (vermoegen) — grün
3. Line (restschuld) — rot, wird durch ComposedChart ÜBER den Areas gerendert

### 4.2 Jahrestabelle unter Portfolio-Summenzeile

**Position:** Nach der Summenzeile der PropertyTable (ca. Zeile 830), vor ExcelImportDialog

**Erweiterte amortizationData-Struktur:**
```typescript
interface ProjectionRow {
  year: number;
  rent: number;
  interest: number;
  amortization: number;
  objektwert: number;
  restschuld: number;
  vermoegen: number;
}
```

**Neue Berechnung:**
```typescript
const projectionData = useMemo(() => {
  if (!totals || totals.totalDebt <= 0) return [];
  
  const appreciationRate = 0.02;
  const years: ProjectionRow[] = [];
  let currentDebt = totals.totalDebt;
  let currentValue = totals.totalValue;
  let currentRent = totals.totalIncome;
  const annuity = totals.totalAnnuity;
  const interestRate = totals.avgInterestRate / 100;
  const rentGrowthRate = 0.015; // 1.5% Mietsteigerung p.a.
  
  for (let year = 0; year <= 30; year++) {
    const interest = currentDebt * interestRate;
    const amortization = Math.min(annuity - interest, currentDebt);
    const wealth = currentValue - currentDebt;
    
    years.push({ 
      year: 2026 + year, 
      rent: Math.round(currentRent),
      interest: Math.round(interest),
      amortization: Math.round(amortization),
      objektwert: Math.round(currentValue),
      restschuld: Math.max(0, Math.round(currentDebt)),
      vermoegen: Math.round(wealth)
    });
    
    currentDebt = Math.max(0, currentDebt - amortization);
    currentValue = currentValue * (1 + appreciationRate);
    currentRent = currentRent * (1 + rentGrowthRate);
  }
  return years;
}, [totals]);
```

**Neue UI-Komponente (10-Jahres-Tabelle):**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📊 Investmentkalkulation (10 Jahre)                    [Alle Jahre anzeigen] │
├───────┬───────────┬────────────┬────────────┬────────────┬──────────┬────────┤
│ Jahr  │ Miete p.a.│ Zinsen     │ Tilgung    │ Restschuld │ Objektwert│Vermögen│
├───────┼───────────┼────────────┼────────────┼────────────┼──────────┼────────┤
│ 2026  │ 6.000 €   │ -2.800 €   │ -1.200 €   │ 78.800 €   │ 165.000 €│86.200 €│
│ 2027  │ 6.090 €   │ -2.758 €   │ -1.242 €   │ 77.558 €   │ 168.300 €│90.742 €│
│ ...   │ ...       │ ...        │ ...        │ ...        │ ...      │ ...    │
└───────┴───────────┴────────────┴────────────┴────────────┴──────────┴────────┘
```

### 4.3 Kontext-Dropdown (immer sichtbar)

**Aktuell (Zeilen 560-563):**
```typescript
{contextTabs.length > 0 && (
  <SubTabNav tabs={contextTabs} />
)}
```

**Neu:**
```typescript
{/* Kontext-Dropdown (immer sichtbar wenn Kontexte existieren) */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <h2 className="text-xl font-semibold">Immobilienportfolio</h2>
    {contexts.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Building2 className="h-4 w-4" />
            {selectedContext?.name || 'Alle Kontexte'}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setContextId(null)}>
            Alle Vermietereinheiten
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {contexts.map(ctx => (
            <DropdownMenuItem key={ctx.id} onClick={() => setContextId(ctx.id)}>
              {ctx.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  </div>
  <Button onClick={() => setShowCreateDialog(true)}>
    <Plus className="mr-2 h-4 w-4" />
    Neue Immobilie anlegen
  </Button>
</div>
```

**Zusätzliche Imports:**
```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
```

---

## Teil 5: Kontext-Filterung in MOD-05 und MOD-06

### 5.1 MOD-05 MSV (`ObjekteTab.tsx`)

**Änderungen:**
1. Query für `landlord_contexts` hinzufügen
2. Query für `context_property_assignment` hinzufügen
3. State für `selectedContextId`
4. Dropdown-Selektor im Header
5. Units nach `property_id` filtern

```typescript
// Kontext-State
const [selectedContextId, setSelectedContextId] = useState<string | null>(null);

// Kontexte laden
const { data: contexts = [] } = useQuery({
  queryKey: ['landlord-contexts'],
  queryFn: async () => supabase.from('landlord_contexts').select('*').then(r => r.data || [])
});

// Context-Property-Assignments laden
const { data: assignments = [] } = useQuery({
  queryKey: ['context-property-assignments'],
  queryFn: async () => supabase.from('context_property_assignment').select('*').then(r => r.data || [])
});

// Units filtern
const filteredUnits = useMemo(() => {
  if (!selectedContextId) return units;
  const propertyIds = assignments
    .filter(a => a.context_id === selectedContextId)
    .map(a => a.property_id);
  return units?.filter(u => propertyIds.includes(u.property_id));
}, [units, assignments, selectedContextId]);
```

### 5.2 MOD-06 Verkauf (`ObjekteTab.tsx`)

Identische Implementierung wie MOD-05.

### 5.3 MOD-03 DMS

**Keine Änderung** — Der Datenraum bleibt vollständig ohne Kontext-Filterung.

---

## Betroffene Dateien (Zusammenfassung)

| Datei | Änderungen |
|-------|------------|
| `supabase/migrations/` | Neue Migration für `landlord_contexts.tax_rate_percent`, `landlord_contexts.managing_director` und `context_members`-Erweiterung |
| `manifests/tile_catalog.yaml` | MOD-04 Tile 1: "Kontexte" → "Vermietereinheiten" |
| `src/pages/portal/immobilien/KontexteTab.tsx` | Standard-Kontext entfernen, Eigentümer anzeigen, Labels ändern |
| `src/components/shared/CreateContextDialog.tsx` | 2-Schritt-Wizard mit Eigentümer-Erfassung |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | ComposedChart, projectionData erweitern, Jahrestabelle, Dropdown statt SubTabNav |
| `src/pages/portal/msv/ObjekteTab.tsx` | Kontext-Dropdown + Filterung |
| `src/pages/portal/verkauf/ObjekteTab.tsx` | Kontext-Dropdown + Filterung |

---

## Validierung nach Umsetzung

### Datenbank
- [ ] `landlord_contexts.tax_rate_percent` existiert (Default 30)
- [ ] `landlord_contexts.managing_director` existiert
- [ ] `context_members` hat alle neuen Spalten (birth_name, birth_date, street, etc.)

### Vermietereinheiten-Seite (KontexteTab)
- [ ] Label zeigt "Vermietereinheiten"
- [ ] "Standard-Kontext"-Card ist entfernt
- [ ] Alle Kontexte erscheinen als gleichwertige Karten
- [ ] PRIVATE: Zeigt Eigentümer mit Geburtsdaten nebeneinander
- [ ] BUSINESS: Zeigt Gesellschaft, GF, HRB, Steuersatz

### CreateContextDialog
- [ ] 2-Schritt-Wizard funktioniert
- [ ] Steuersatz-Feld vorhanden (Default 30%)
- [ ] PRIVATE: Eigentümer nebeneinander erfassbar
- [ ] BUSINESS: Geschäftsführer-Feld vorhanden

### PortfolioTab
- [ ] `ComposedChart` wird verwendet
- [ ] Restschuld (rot, Line) liegt ÜBER den Areas
- [ ] Jahrestabelle zeigt 10 Jahre mit allen Spalten
- [ ] Dropdown IMMER sichtbar (auch bei 1 Kontext)

### MOD-05/MOD-06
- [ ] Kontext-Dropdown im Header vorhanden
- [ ] Filterung funktioniert korrekt

