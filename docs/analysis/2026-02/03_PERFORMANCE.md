# 03_PERFORMANCE — Performance-Analyse

## Analyse-Stand: 2026-02-26 | Analyst: GitHub Agent v2
## Basis: Vollständiger Repo-Scan (src/, supabase/, manifests/, spec/)

---

## Abschnitt A — Bundle-Analyse

### Aktueller Bundle-Status

Das Projekt verwendet Vite mit Code-Splitting über `React.lazy()` im `ManifestRouter.tsx` (157 Lazy-Imports). Damit ist das Grundgerüst vorhanden. Die kritischen Schwachstellen:

#### Chunks > 200KB (potenzielle Probleme)

| Chunk | Schätzgröße | Problem | Lazy Loading möglich? |
|-------|-------------|---------|----------------------|
| `src/integrations/supabase/types.ts` | ~22.146 Zeilen → ~800KB+ (JS) | Größte Einzeldatei — wird immer geladen | ✅ Splitting nach Modulen |
| `src/manifests/armstrongManifest.ts` | ~4.369 Zeilen → ~150KB | Armstrong-Manifest immer geladen | ✅ Lazy bei Armstrong-Route |
| `src/engines/marketDirectory/spec.ts` | ~917 Zeilen | Engine-Spec immer geladen | ✅ Lazy |
| `src/components/portal/HowItWorks/moduleContents.ts` | ~888 Zeilen | Statische Content-Datei im Bundle | ✅ Lazy/JSON |
| Zone-3-Assets (Shop-Bilder, PDFs) | ~5MB | Im `/public/` direkt | N/A (CDN empfohlen) |

### Top 5 Lazy-Loading-Empfehlungen

#### 1. `src/integrations/supabase/types.ts` — Split nach Modulen
```typescript
// Aktuell: Eine 22k-Zeilen Datei für ALLE Typen
import type { Database } from '@/integrations/supabase/types';

// Fix: Modulare Type-Splits
// src/integrations/supabase/types/finance.ts
// src/integrations/supabase/types/properties.ts
// src/integrations/supabase/types/projects.ts
// Hauptdatei re-exportiert nur:
export type { Database } from './types/database';

// Gewinn: ~30% kleinerer initaler Bundle durch Tree-Shaking
```

#### 2. `src/manifests/armstrongManifest.ts` — Lazy bei Armstrong-Routen
```typescript
// ManifestRouter.tsx — Aktuell: direkter Import
import armstrongManifest from '@/manifests/armstrongManifest';

// Fix: Lazy laden nur wenn Armstrong-Route aktiv
const ArmstrongAdvisor = React.lazy(async () => {
  const [mod, manifest] = await Promise.all([
    import('@/pages/portal/armstrong/ArmstrongAdvisorPage'),
    import('@/manifests/armstrongManifest'),
  ]);
  // Manifest in Context injizieren
  return mod;
});

// Geschätzter Gewinn: ~150KB weniger im initialen Bundle
```

#### 3. Admin-Zone lazy loading
```typescript
// App.tsx — Alle Admin-Seiten in lazy chunk
const AdminApp = React.lazy(() => import('@/router/AdminRouter'));

// Gewinn: Admin-Code (~400+ Komponenten) wird nur für Admin-User geladen
// Geschätzt: ~40% Reduktion für nicht-Admin-User
```

#### 4. PDF-Generator-Bibliothek lazy laden
```typescript
// src/lib/generateLegalDocumentPdf.ts — 935 Zeilen mit PDF-Lib
// Aktuell: immer im Bundle

// Fix:
const generatePdf = async (data: LegalDocumentData) => {
  const { generateLegalDocumentPdf } = await import('@/lib/generateLegalDocumentPdf');
  return generateLegalDocumentPdf(data);
};
// Gewinn: PDF-Lib (~200KB) nur bei Bedarf
```

#### 5. Excel-Import-Bibliothek (bereits teilweise lazy)
```typescript
// src/lib/lazyXlsx.ts — bereits lazy ✅
// Pattern auf andere große Libs ausweiten:
// - Chart-Bibliotheken
// - Map-Bibliotheken  
// - PDF-Viewer
```

---

## Abschnitt B — N+1 Queries

### Identifizierte N+1-Patterns

#### 1. `src/hooks/useAcqContacts.ts:221-262` — Schleife mit DB-Calls
```typescript
// Zeile 221: for-Schleife mit sequenziellen DB-Calls
for (const contactId of contactIds) {
  const { data } = await supabase
    .from('contacts')                    // N+1: einmal pro Kontakt
    .select('*')
    .eq('id', contactId);
}

// Fix: Batch-Query
const { data } = await supabase
  .from('contacts')
  .select('*')
  .in('id', contactIds);               // Eine Query für alle
```

#### 2. `src/hooks/useAdminResearch.ts:154,168,317` — Sequenzielle Queries auf contacts
```typescript
// Zeile 154: Query 1
const { data: contacts1 } = await supabase.from('contacts').select(...).eq('status', 'new');
// Zeile 168: Query 2
const { data: contacts2 } = await supabase.from('contacts').select(...).eq('status', 'enriched');
// Zeile 317: Query 3
const { data: contacts3 } = await supabase.from('contacts').select(...).eq('assigned_to', userId);

// Fix: Parallele Queries oder eine Query mit Or-Filter
const [res1, res2, res3] = await Promise.all([
  supabase.from('contacts').select(...).eq('status', 'new'),
  supabase.from('contacts').select(...).eq('status', 'enriched'),
  supabase.from('contacts').select(...).eq('assigned_to', userId),
]);
```

#### 3. `src/hooks/useNKAbrechnung.ts:109` — Nebenkosten-Berechnung mit Kontakt-Lookup
```typescript
// Pattern: Pro NK-Periode ein contacts-Lookup
// Fix: JOIN in Supabase-Query verwenden
const { data } = await supabase
  .from('nk_periods')
  .select(`
    *,
    contact:contacts!contact_id(id, name, email)
  `)
  .eq('tenant_id', activeTenantId);
```

#### 4. `src/hooks/useVVSteuerData.ts:57` — Units → Leases N+1
```typescript
// Zeile 57: unitIds aus vorheriger Query
const unitIds = units.map((u: any) => u.id);
// Zeile 60-70: Leases per Unit-ID geladen
// Potenziell: Wenn Leases per Unit einzeln geladen werden

// Fix: FK-Join direkt in Supabase
const { data: unitsWithLeases } = await supabase
  .from('units')
  .select('id, property_id, area_sqm, leases(*)')
  .eq('tenant_id', activeTenantId)
  .in('property_id', propertyIds);
```

---

## Abschnitt C — Fehlende Paginierung

### Queries ohne `.limit()` oder `.range()` auf großen Tabellen

| Datei | Zeile | Tabelle | Risiko |
|-------|-------|---------|--------|
| `src/hooks/useFinanzberichtData.ts:129` | 129 | `properties` | 🟠 Hoch — alle aktiven Properties ohne Limit |
| `src/hooks/useVVSteuerData.ts:35` | 35 | `properties` | 🟠 Hoch — alle rental-managed Properties |
| `src/hooks/useVerwaltungData.ts:98` | 98 | `properties` | 🟠 Hoch |
| `src/hooks/useNKAbrechnung.ts:109` | 109 | `contacts` | 🔴 Kritisch — alle Tenant-Kontakte |
| `src/hooks/useAdminResearch.ts:154` | 154 | `contacts` | 🔴 Kritisch |
| `src/hooks/useAdminResearch.ts:168` | 168 | `contacts` | 🔴 Kritisch |
| `src/hooks/useAdminResearch.ts:317` | 317 | `contacts` | 🔴 Kritisch |
| `src/hooks/useAcqContacts.ts:221` | 221 | `contacts` | 🔴 Kritisch |
| `src/hooks/useAcqContacts.ts:231` | 231 | `contacts` | 🔴 Kritisch |
| `src/hooks/useAcqContacts.ts:243` | 243 | `contacts` | 🔴 Kritisch |
| `src/hooks/useAcqContacts.ts:262` | 262 | `contacts` | 🔴 Kritisch |
| `src/hooks/useResearchImport.ts:45` | 45 | `contacts` | 🟠 Hoch |
| `src/hooks/useListings*.ts` | multiple | `listings` | 🟠 Hoch |

### Empfohlener Fix (Beispiel):
```typescript
// Aktuell:
const { data } = await supabase
  .from('contacts')
  .select('id, name, email, phone')
  .eq('tenant_id', activeTenantId);

// Fix mit Paginierung:
const PAGE_SIZE = 100;
const { data, count } = await supabase
  .from('contacts')
  .select('id, name, email, phone', { count: 'exact' })
  .eq('tenant_id', activeTenantId)
  .order('created_at', { ascending: false })
  .range(0, PAGE_SIZE - 1);
```

---

## Abschnitt D — Unnötige Re-Renders

### Fehlendes `useMemo`/`useCallback`

**Befund:** 281 `useMemo`/`useCallback`-Aufrufe in `src/components/` — bei 455 Komponenten.
Viele Handler-Funktionen werden inline definiert und bei jedem Render neu erstellt.

```typescript
// Typisches Anti-Pattern (identifiziert in mehreren Komponenten):
function PropertyList({ tenantId }: { tenantId: string }) {
  // Inline Handler — neue Referenz bei jedem Render
  const handleDelete = (id: string) => { // ← kein useCallback
    deleteProperty(id);
  };

  // Inline Transformation — kein useMemo
  const sortedProperties = properties.sort((a, b) => ...); // ← kein useMemo

  return <List items={sortedProperties} onDelete={handleDelete} />;
}

// Fix:
function PropertyList({ tenantId }: { tenantId: string }) {
  const handleDelete = useCallback((id: string) => {
    deleteProperty(id);
  }, [deleteProperty]);

  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => a.code.localeCompare(b.code)),
    [properties]
  );

  return <List items={sortedProperties} onDelete={handleDelete} />;
}
```

### Fehlendes `React.memo`

**Befund:** Nur **1 von 455 Komponenten** nutzt `React.memo`.

#### Komponenten die von `React.memo` profitieren würden:

| Komponente | Warum? |
|-----------|--------|
| `src/components/portal/KanbanCard.tsx` | Wird für jede Karte gerendert |
| `src/components/portal/TileGrid.tsx` | Wird bei jedem Dashboard-Update neu gerendert |
| `src/components/shared/StatusBadge.tsx` | Pure Komponente, Props ändern sich selten |
| `src/components/ui/DataTable.tsx` | Tabellen-Rows ohne memo |

```typescript
// Beispiel Fix:
export const PropertyCard = React.memo(function PropertyCard({
  property,
  onSelect,
}: PropertyCardProps) {
  return (/* ... */);
}, (prevProps, nextProps) => {
  // Custom comparison für teure Props
  return prevProps.property.id === nextProps.property.id &&
         prevProps.property.updated_at === nextProps.property.updated_at;
});
```

---

## Abschnitt E — Supabase Indizes

### Vorhandene Indizes (Zusammenfassung)
- **982 Indizes** in Migrations definiert — generell gute Index-Abdeckung
- `tenant_id` hat Indizes auf den meisten Haupt-Tabellen ✅
- `properties`, `contacts`, `listings`, `leads`, `dev_project_units` haben tenant_id-Indizes ✅

### Fehlende Indizes

Durch Analyse der häufig verwendeten Filter-Spalten ohne Index:

```sql
-- 1. finance_mandates: status-Filter häufig, kein Composite-Index
CREATE INDEX IF NOT EXISTS idx_finance_mandates_tenant_created
  ON public.finance_mandates(tenant_id, created_at DESC);

-- 2. leases: status ohne tenant Index (Tabelle ohne RLS = besonders kritisch)
CREATE INDEX IF NOT EXISTS idx_leases_tenant_status
  ON public.leases(tenant_id, status);

-- 3. documents: entity_id + module_code häufiger Filter
CREATE INDEX IF NOT EXISTS idx_documents_entity_module
  ON public.documents(entity_id, module_code);

-- 4. rent_payments: tenant + due_date (häufiger Arrears-Check)
CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_due
  ON public.rent_payments(tenant_id, due_date) WHERE paid_at IS NULL;

-- 5. lead_activities: entity_id (FK ohne Index)
CREATE INDEX IF NOT EXISTS idx_lead_activities_entity
  ON public.lead_activities(entity_id, created_at DESC);

-- 6. contacts: category + status (häufiger Filter in Research)
-- ✅ BEREITS VORHANDEN: idx_contacts_tenant_category

-- 7. acq_offers: tenant_id + status (häufige Akquise-Filter)
CREATE INDEX IF NOT EXISTS idx_acq_offers_tenant_status
  ON public.acq_offers(tenant_id, status);

-- 8. storage_nodes: parent_path (Hierarchie-Lookups)
CREATE INDEX IF NOT EXISTS idx_storage_nodes_parent_path
  ON public.storage_nodes(tenant_id, parent_path);
```

### Bereits vorhandene kritische Indizes ✅
- `idx_properties_tenant` — vorhanden
- `idx_units_tenant` — vorhanden
- `idx_contacts_tenant` — vorhanden
- `idx_listings_tenant_status` — vorhanden
- `idx_dev_project_units_tenant_status` — vorhanden
- `idx_finance_mandates_tenant_status` — vorhanden
- `idx_finance_requests_tenant_status` — vorhanden

> **Fazit**: Die Index-Situation hat sich seit dem letzten Review (Feb 16) deutlich verbessert.
> Die 982 vorhandenen Indizes zeigen systematisches Index-Management.
> Die oben aufgelisteten 8 fehlenden Indizes sind Lücken in Randbereichen.
