# 02_TYPESCRIPT — TypeScript Hygiene-Analyse

## Analyse-Stand: 2026-02-26 | Analyst: GitHub Agent v2
## Basis: Vollständiger Repo-Scan (src/, supabase/, manifests/, spec/)

---

## Abschnitt A — `any`-Inventar (Dateien mit >5 expliziten `any`)

**Gesamtbefund:** 1.301 `any`-Vorkommen (`as any` + `: any` + `<any>`) in 1.268 TypeScript-Dateien.

### Top 20 Dateien nach `any`-Häufigkeit

| Rang | Datei | `any`-Anzahl | Priorität |
|------|-------|-------------|-----------|
| 1 | `src/hooks/useVVSteuerData.ts` | 52 | 🔴 P1 |
| 2 | `src/hooks/useUnitDossier.ts` | 35 | 🔴 P1 |
| 3 | `src/hooks/useDemoSeedEngine.ts` | 34 | 🔴 P1 |
| 4 | `src/hooks/useFinanzberichtData.ts` | 33 | 🔴 P1 |
| 5 | `src/pages/portal/office/EmailTab.tsx` | 25 | 🟠 P1 |
| 6 | `src/pages/portal/finanzanalyse/DarlehenTab.tsx` | 23 | 🟠 P1 |
| 7 | `src/pages/portal/stammdaten/ProfilTab.tsx` | 22 | 🟠 P1 |
| 8 | `src/components/portfolio/BWATab.tsx` | 21 | 🟠 P1 |
| 9 | `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | 20 | 🟡 P2 |
| 10 | `src/pages/portal/projekte/ProjectDetailPage.tsx` | 17 | 🟡 P2 |
| 11 | `src/hooks/useDossierForm.ts` | 17 | 🟡 P2 |
| 12 | `src/pages/zone3/lennox/LennoxMeinBereich.tsx` | 16 | 🟡 P2 |
| 13 | `src/pages/portal/projekte/PortfolioTab.tsx` | 15 | 🟡 P2 |
| 14 | `src/pages/portal/finanzanalyse/SachversicherungenTab.tsx` | 15 | 🟡 P2 |
| 15 | `src/pages/admin/compliance/useComplianceCases.ts` | 14 | 🟡 P2 |
| 16 | `src/components/portal/cars/CarsAutos.tsx` | 14 | 🟡 P2 |
| 17 | `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | 13 | 🟡 P2 |
| 18 | `src/hooks/useNKAbrechnung.ts` | 13 | 🟡 P2 |
| 19 | `src/components/portal/finanzanalyse/VorsorgeLueckenrechner.tsx` | 13 | 🟡 P2 |
| 20 | `src/pages/portal/petmanager/PMProfil.tsx` | 12 | 🟡 P2 |

---

### Konkrete Refactoring-Vorschläge (Top 5)

#### 1. `src/hooks/useVVSteuerData.ts` — 52 any

**Problem:** `supabase as any` für Tabellen die noch nicht im generierten Type-Schema sind (`property_accounting`, `vv_annual_data`, `property_financing`, `nk_periods` usw.) und `p: any` in Array-Mappings.

**Fix mit Zod-Schema:**
```typescript
// 1. Temporäres Zod-Schema für noch nicht typisierte Tabellen
import { z } from 'zod';

const PropertyAccountingSchema = z.object({
  property_id: z.string().uuid(),
  building_share_percent: z.number().nullable(),
  land_share_percent: z.number().nullable(),
  afa_rate_percent: z.number().nullable(),
  afa_start_date: z.string().nullable(),
  afa_method: z.string().nullable(),
  ak_ground: z.number().nullable(),
  ak_building: z.number().nullable(),
});
type PropertyAccounting = z.infer<typeof PropertyAccountingSchema>;

// 2. Anstatt: (supabase as any).from('property_accounting')
// Verwende: supabase.from('property_accounting' as keyof Database['public']['Tables'])
// Oder: direkten Cast mit Zod-Validation:
const { data: rawAccounting } = await (supabase as ReturnType<typeof createClient>)
  .from('property_accounting' as any)
  .select('...');
const accounting = PropertyAccountingSchema.array().parse(rawAccounting ?? []);
```

#### 2. `src/hooks/useFinanzberichtData.ts` — 33 any

**Problem:** Alle Data-Fetching-Calls mit `(supabase as any).from(...)` und `(data || []) as any[]`.

**Fix mit Interface:**
```typescript
// Interface für häufig verwendete unbetypte Queries
interface PvPlant {
  id: string;
  loan_bank: string | null;
  loan_amount: number | null;
  loan_monthly_rate: number | null;
  annual_yield_kwh: number | null;
  feed_in_tariff_cents: number | null;
  annual_revenue: number | null;
}

// Anstatt:
// const { data } = await (supabase as any).from('pv_plants' as any).select(...)
// return (data || []) as any[];

// Verwende:
const { data } = await supabase
  .from('pv_plants' as keyof Database['public']['Tables'])
  .select<string, PvPlant>('id, loan_bank, ...');
return (data ?? []) as PvPlant[];
```

#### 3. `src/hooks/useDemoSeedEngine.ts` — 34 any

**Problem:** Demo-Daten ohne Typdefinition.

**Fix:**
```typescript
// Erstelle types/demo.ts:
export interface DemoSeedResult {
  table: string;
  inserted: number;
  errors: string[];
}

export interface DemoSeedConfig {
  tenantId: string;
  modules: string[];
  dryRun?: boolean;
}

// Ersetze: any[] -> DemoSeedResult[]
// Ersetze: (data: any) => ... -> (data: DemoSeedResult) => ...
```

#### 4. `src/hooks/useFinanzmanagerData.ts` — `as any` für Enums

**Problem:**
```typescript
category: values.category as any,          // Zeile 39
payment_interval: values.payment_interval as any || 'monatlich',  // Zeile 47
status: (values.status as any) || 'aktiv', // Zeile 48
```

**Fix mit expliziten Typen:**
```typescript
// types/finanzmanager.ts
export type FinanzKategorie = 'einnahmen' | 'ausgaben' | 'investment' | 'vorsorge' | 'other';
export type ZahlungsIntervall = 'monatlich' | 'quartalsweise' | 'jaehrlich' | 'einmalig';
export type FinanzStatus = 'aktiv' | 'pausiert' | 'beendet';

// Im Hook:
category: values.category as FinanzKategorie,
payment_interval: (values.payment_interval as ZahlungsIntervall) ?? 'monatlich',
status: (values.status as FinanzStatus) ?? 'aktiv',
```

#### 5. `src/hooks/useTenantReset.ts` — RPC Casts

**Problem:**
```typescript
await supabase.rpc('log_data_event' as any, {...})
await supabase.rpc('reset_sandbox_tenant' as any, {...})
```

**Fix:** Fehlende RPC-Typen im generierten Schema ergänzen (supabase gen types) oder:
```typescript
// Typ-sicherer Wrapper:
type LogDataEventParams = { p_event_type: string; p_payload: Record<string, unknown> };
await (supabase.rpc as (fn: string, args: LogDataEventParams) => Promise<unknown>)(
  'log_data_event', { p_event_type: 'reset', p_payload: { tenant_id: tenantId } }
);
```

---

## Abschnitt B — `as any` Casts (786 gesamt)

### Problematischste `as any`-Casts

| Datei | Zeile | Cast | Warum problematisch | Fix |
|-------|-------|------|---------------------|-----|
| `src/hooks/useFinanzberichtData.ts` | 78 | `(supabase as any).from(...)` | Umgeht alle Supabase-Typ-Checks | Type-Assert via Zod |
| `src/hooks/useVVSteuerData.ts` | 36,37,48,49 | `(supabase as any).from(...)` | Kein Type-Check auf Tabellen/Spalten | Supabase-Types aktualisieren |
| `src/hooks/useTenantReset.ts` | 21,51 | `rpc('...' as any)` | RPC-Aufruf ohne Typ-Sicherheit | Schema regenerieren |
| `src/hooks/usePetDMS.ts` | 48,67 | `insert(subfolders as any)` | Insert ohne Spalten-Validierung | Interface erstellen |
| `src/hooks/useFinanzmanagerData.ts` | 39,47,48,118,188,255 | Enum-Casts | String-Enums ohne Type-Guard | Union-Typen definieren |
| `src/pages/portal/office/EmailTab.tsx` | multiple | `event as any` | Event-Handler ohne Typ | React.ChangeEvent<HTMLInputElement> |

### Empfohlene Batch-Fix-Strategie

```bash
# 1. Supabase-Types regenerieren (erfasst neue Tabellen wie property_accounting, vv_annual_data)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# 2. ESLint-Rule aktivieren (bereits konfiguriert, aber nicht enforced):
# eslint.config.js: "@typescript-eslint/no-explicit-any": "error"
```

---

## Abschnitt C — Fehlende Return-Types (hooks/ und engines/)

### Hooks ohne expliziten Return-Type

```typescript
// Beispiele aus src/hooks/:
export function useVVSteuerData(taxYear: number) { // Kein : ReturnType<...>
export function useFinanzberichtData() {            // Kein : { data: ..., isLoading: boolean }
export function useNKAbrechnung(propertyId?: string) { // Kein return type
export function useDossierMutations() {             // Kein return type
export function usePetBookings(providerId?: string) { // Kein return type
```

**Geschätzte Anzahl betroffener Hooks:** ~85 von 141 Hooks haben keinen expliziten Return-Type.

**Empfohlenes Muster:**
```typescript
interface UseVVSteuerDataReturn {
  contexts: VVContext[];
  properties: VVProperty[];
  isLoading: boolean;
  saveManualData: (propertyId: string, data: VVAnnualManualData) => Promise<void>;
}

export function useVVSteuerData(taxYear: number): UseVVSteuerDataReturn {
  // ...
}
```

### Engines ohne Return-Types

In `src/engines/` (14 Dateien) sind die meisten Spec-Typen vorhanden, aber einige Engine-Funktionen fehlen Return-Type-Annotationen.

---

## Abschnitt D — useEffect Dependencies (exhaustive-deps Violations)

### Identifizierte Violation-Pattern

**Gesamtbefund:** ~93 useEffect-Calls in Hooks. Durch ESLint-Deaktivierungen (`// eslint-disable-next-line`) werden Violations aktiv unterdrückt.

### Top 10 Violations mit Fix

#### 1. `src/hooks/useDocumentIntake.ts:213,226`
```typescript
// Aktuell (Problem: ESLint-Disable):
// eslint-disable-next-line @typescript-eslint/no-explicit-any
useEffect(() => {
  loadDocument(documentId); // documentId nicht in Deps
}, []);

// Fix:
useEffect(() => {
  if (documentId) loadDocument(documentId);
}, [documentId, loadDocument]); // loadDocument mit useCallback wrappen
```

#### 2. `src/hooks/useIntakeEntityLoader.ts:113`
```typescript
// Aktuell:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
useEffect(() => {
  fetchEntity(entityId); // entityId fehlt
}, []);

// Fix:
const fetchEntity = useCallback(async (id: string) => {
  // ...
}, [supabase, activeTenantId]);

useEffect(() => {
  if (entityId) fetchEntity(entityId);
}, [entityId, fetchEntity]);
```

#### 3. `src/hooks/useModuleTiles.ts:25`
```typescript
// Aktuell:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
useEffect(() => {
  loadTiles(); // Stale closure: loadTiles liest moduleCode ohne Dep
}, []);

// Fix:
useEffect(() => {
  loadTiles();
}, [moduleCode]); // moduleCode als Dep
```

#### 4. `src/hooks/useUniversalUpload.ts:173,183,256,285,328`
```typescript
// Aktuell (5 Violations):
// eslint-disable-next-line @typescript-eslint/no-explicit-any

// Fix: uploadConfig als stabiles Ref oder useReducer für Upload-State
const uploadConfig = useRef({ tenantId, moduleCode, entityId });
useEffect(() => {
  uploadConfig.current = { tenantId, moduleCode, entityId };
});
```

### Generelle Empfehlung
```javascript
// eslint.config.js — Rule von warn auf error setzen:
'react-hooks/exhaustive-deps': 'error',
```

---

## Abschnitt E — Rules of Hooks Violations

### Identifizierte Violations

Durch den ESLint-Report (1.678 Problems aus `CODE_ANALYSIS_REPORT.md`) sind Rules-of-Hooks-Violations bekannt. Konkrete Fundstellen aus dem Code:

#### Bedingte Hook-Aufrufe (pattern: Hook nach return/if)

```typescript
// Problematisches Pattern in mehreren Komponenten:
function MyComponent({ userId }: { userId?: string }) {
  if (!userId) return null; // ← Early Return

  const { data } = useQuery(...); // ← Hook nach return: VIOLATION!
}
```

**Suche-Pattern für Violations:**
```bash
grep -rn "if.*return\|return.*null" src/components/ --include="*.tsx" -A 3 | grep "use[A-Z]"
```

#### Hooks in Callbacks
```typescript
// Pattern identifiziert in src/components/:
const handleClick = () => {
  const { data } = useQuery(...); // Hook in Event-Handler: VIOLATION!
};
```

### Empfehlung
Alle Rules-of-Hooks-Violations sollten mit `eslint --rule 'react-hooks/rules-of-hooks: error'` vollständig erfasst und behoben werden.

---

## Zusammenfassung TypeScript-Schulden

| Kategorie | Anzahl | Trend |
|-----------|--------|-------|
| `any`-Vorkommen gesamt | 1.301 | ↑ (war 1.548 laut ESLint, gesunken durch Fixes) |
| `as any`-Casts | 786 | Stabil hoch |
| ESLint-Disable Kommentare (hooks/) | 9+ | Neu |
| Hooks ohne Return-Type | ~85/141 | Hoch |
| useEffect Violations (geschätzt) | 15-25 | Bekannt |

> **Fazit**: Die TypeScript-Qualität hat sich seit der CODE_ANALYSIS_REPORT vom 21.02.2026 leicht verbessert
> (1.548 → 1.301 Violations), aber die Kern-Probleme in den Finanz-Hooks und Steuer-Daten-Hooks
> sind unverändert kritisch.
