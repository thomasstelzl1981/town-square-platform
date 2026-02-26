# 04_CODE_HYGIENE — Code Hygiene Analyse

## Analyse-Stand: 2026-02-26 | Analyst: GitHub Agent v2
## Basis: Vollständiger Repo-Scan (src/, supabase/, manifests/, spec/)

---

## Abschnitt A — Tote Code-Pfade

### Hinweis zur Methodik
Eine vollständige "tote Code" Analyse in einem 1.268-Dateien-Projekt erfordert einen statischen Analyse-Lauf. Folgende Datei-Kategorien wurden als potenzielle Kandidaten identifiziert:

### Potenzielle verwaiste Dateien (aus Struktur-Analyse)

| Datei | Verdachtsgrund | Zu prüfen |
|-------|---------------|-----------|
| `src/data/` | Data-Dateien — möglicherweise durch Demo-Engine ersetzt | Import-Check |
| `src/goldenpath/devValidator.ts` | DEV-only, `if (import.meta.env.DEV)` Guard | ✅ Gewollt |
| `src/validation/architectureValidator.ts` | DEV-only | ✅ Gewollt |
| `src/pages/presentation/PresentationPage.tsx` | Nur über nicht-guessable URL erreichbar | ✅ Gewollt |

### Empfehlung für vollständige Dead-Code-Analyse
```bash
# ts-prune installieren und ausführen:
npx ts-prune --project tsconfig.app.json | grep -v "used in module"

# oder eslint-plugin-unused-imports:
npm install eslint-plugin-unused-imports
# In eslint.config.js hinzufügen:
'unused-imports/no-unused-imports': 'error',
'unused-imports/no-unused-vars': 'warn',
```

---

## Abschnitt B — Duplikat-Logik

### Identifizierte Code-Duplikationen (>20 Zeilen)

#### 1. Auth-Check-Pattern in Edge Functions (~131 Duplikate)
```typescript
// Dieses Pattern erscheint in ~89 Edge Functions identisch:
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
```

**Fix:** Shared-Helper in `supabase/functions/_shared/`:
```typescript
// supabase/functions/_shared/auth.ts
export async function requireAuth(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new UnauthorizedError();
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new UnauthorizedError();
  return user;
}
```

#### 2. CORS-Headers-Pattern (~119 Duplikate)
```typescript
// Identisch in fast jeder Edge Function:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
};
if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}
```

**Fix:** Bereits teilweise in `_shared/cors.ts` — aber nur von ~12 Funktionen verwendet.
```typescript
// supabase/functions/_shared/cors.ts — auf alle Funktionen ausweiten
export const corsHeaders = { ... };
export const handleCors = (req: Request): Response | null => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return null;
};
```

#### 3. Supabase-Client-Initialisierung (~131 Duplikate)
```typescript
// In fast jeder Edge Function:
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sbAdmin = createClient(supabaseUrl, serviceKey);
```

**Fix:**
```typescript
// supabase/functions/_shared/supabase.ts
export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}
```

#### 4. Error-Response-Helper (~100+ Duplikate)
```typescript
// Wiederholt in allen Funktionen:
return new Response(JSON.stringify({ error: "..." }), {
  status: 400,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});
```

**Fix:**
```typescript
// supabase/functions/_shared/response.ts
export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
```
> **Hinweis**: `json()` Helper existiert bereits in einigen Funktionen — auf alle ausweiten.

#### 5. Tenant-ID-Validierung in Frontend (~30+ Hooks)
```typescript
// Wiederholt in hooks/:
const { activeTenantId } = useAuth();
if (!activeTenantId) return null; // oder: throw, oder: queryFn: async () => { if (!activeTenantId) return []; }
```

**Fix:** Custom QueryKey-Factory:
```typescript
// src/hooks/queryKeys.ts
export const queryKeys = {
  properties: (tenantId: string) => ['properties', tenantId] as const,
  contacts: (tenantId: string) => ['contacts', tenantId] as const,
  // ...
};
// Standardisiert die enabled-Bedingung:
const { data } = useQuery({
  queryKey: queryKeys.properties(activeTenantId!),
  queryFn: ...,
  enabled: !!activeTenantId,
});
```

---

## Abschnitt C — `console.log` Inventar

### Gesamtübersicht

| Typ | src/ | supabase/functions/ | Gesamt |
|-----|------|---------------------|--------|
| `console.log` | 59 | ~400 | ~459 |
| `console.error` | 265 | ~250 | ~515 |
| `console.warn` | 79 | ~83 | ~162 |
| **Gesamt** | **403** | **733** | **1.136** |

### Debug-Logs (sollten entfernt werden)

| Datei | Zeile | Log | Empfehlung |
|-------|-------|-----|------------|
| `src/hooks/useDemoSeedEngine.ts` | multiple (49x) | Debug-Logs für Seed-Prozess | Nur in DEV belassen oder entfernen |
| `src/hooks/useLennoxInitialSeed.ts` | multiple (17x) | Seed-Debug-Logs | Entfernen |
| `src/hooks/useArmstrongVoice.ts` | multiple (13x) | Voice-Debug-Logs | Entfernen für PROD |
| `src/hooks/useCloudSync.ts` | multiple (8x) | Sync-Status-Logs | Zu strukturiertem Logger |
| `src/hooks/useDemoAutoLogin.ts` | multiple (6x) | Login-Debug | Entfernen |
| `src/router/ManifestRouter.tsx` | multiple (4x) | Router-Debug | Entfernen |

### Error-Logs ohne nachfolgendes `throw` (sollten geworfen werden)

| Datei | Zeile | Problem |
|-------|-------|---------|
| `src/components/projekte/SalesStatusReportWidget.tsx` | 195 | `console.error('PDF generation failed')` — User sieht keinen Fehler |
| `src/components/projekte/SalesStatusReportWidget.tsx` | 228 | `console.error('Send failed')` — Silent fail |
| `src/components/projekte/QuickIntakeUploader.tsx` | 111,208,255,304 | 4x Silent fails beim Upload |
| `src/components/projekte/StickyCalculatorPanel.tsx` | 133 | `console.error('Save failed')` — Daten-Verlust möglich |
| `src/components/projekte/CreatePropertyFromUnits.tsx` | 136,202 | Bulk-Create fehlt Fehler-Propagation |
| `src/hooks/useDemoSeedEngine.ts` | multiple | 49 console.log — keine strukturierten Errors |

**Empfohlenes Pattern:**
```typescript
// Statt:
try {
  await saveData();
} catch (err) {
  console.error('Save failed:', err); // ← Silent fail
}

// Verwende:
try {
  await saveData();
} catch (err) {
  toast.error('Speichern fehlgeschlagen: ' + (err as Error).message);
  throw err; // ← Für Error-Boundary-Propagation
}
```

---

## Abschnitt D — Große Dateien (>500 Zeilen)

**96 Dateien** in `src/` haben mehr als 500 Zeilen. Die kritischsten:

### Top 10 zu splitten

#### 1. `src/integrations/supabase/types.ts` — 22.146 Zeilen
**Verantwortlichkeiten:**
- Alle DB-Tabellen-Typen (298 Tabellen)
- RPC-Funktions-Typen
- Storage-Bucket-Typen

**Split-Vorschlag:**
```
src/integrations/supabase/types/
├── finance.ts        # finance_*, vorsorge_*, bank_*
├── properties.ts     # properties, units, leases, listings
├── projects.ts       # dev_projects, dev_project_units
├── crm.ts            # contacts, leads, acq_*
├── admin.ts          # organizations, profiles, admin_*
├── storage.ts        # storage_nodes, documents
└── index.ts          # re-exports Database type
```

#### 2. `src/manifests/armstrongManifest.ts` — 4.369 Zeilen
**Verantwortlichkeiten:** Armstrong AI Konfiguration, Prompts, Modul-Definitionen

**Split-Vorschlag:**
```
src/manifests/armstrong/
├── core.ts           # Basis-Konfiguration
├── prompts.ts        # Prompt-Templates
├── modules.ts        # Modul-Definitionen
└── index.ts          # Gesamtes Manifest
```

#### 3. `src/pages/portal/immobilien/PortfolioTab.tsx` — 1.239 Zeilen
**Verantwortlichkeiten:** Portfolio-Übersicht, Filter, Karten, Modals, KPIs

**Split-Vorschlag:**
```
src/pages/portal/immobilien/portfolio/
├── PortfolioTab.tsx              # Koordination (~150 Zeilen)
├── PortfolioFilters.tsx          # Filter-Panel
├── PortfolioKPIBar.tsx           # KPI-Kennzahlen
├── PortfolioPropertyGrid.tsx     # Eigenschafts-Karten
└── PortfolioModals.tsx           # Create/Edit Modals
```

#### 4. `src/pages/portal/akquise-manager/AkquiseMandate.tsx` — 1.123 Zeilen
**Verantwortlichkeiten:** Mandat-Liste, Detail-View, Status-Änderungen, Aktionen

**Split-Vorschlag:**
```
src/pages/portal/akquise-manager/
├── AkquiseMandate.tsx           # Hauptkoordinator (~100 Zeilen)
├── MandatList.tsx               # Listen-Ansicht
├── MandatDetail.tsx             # Detail-Ansicht
└── MandatActions.tsx            # Action-Buttons/Dialogs
```

#### 5. `src/hooks/useDemoSeedEngine.ts` — 1.020 Zeilen
**Verantwortlichkeiten:** Demo-Daten für alle 20+ Module seeden

**Split-Vorschlag:**
```
src/hooks/demoSeed/
├── index.ts                     # Haupt-Hook (~100 Zeilen)
├── seedProperties.ts            # Immobilien-Seeds
├── seedContacts.ts              # Kontakt-Seeds
├── seedFinance.ts               # Finanz-Seeds
├── seedProjects.ts              # Projekt-Seeds
└── seedPetManager.ts            # Pet-Manager-Seeds
```

---

## Abschnitt E — Inkonsistenzen

### E1. Namenskonventionen: MOD_13 vs. MOD-13

**Befund:** 1.369 Vorkommen von `MOD_[0-9]` und `MOD-[0-9]` im Code — beide Schreibweisen koexistieren.

| Schreibweise | Vorkommen | Verwendungskontext |
|-------------|-----------|-------------------|
| `MOD_13` (Unterstrich) | ~700 | Code-Logik, `moduleCode`-Spalten, Storage-Pfade |
| `MOD-13` (Bindestrich) | ~669 | Kommentare, JSDoc, Dateinamen-Präfixe |

**Standard-Empfehlung:**
```typescript
// Konstante in src/constants/modules.ts definieren:
export const MODULE_CODES = {
  IMMOBILIEN: 'MOD_04',
  PROJEKTE: 'MOD_13',
  FINANZIERUNG: 'MOD_07',
  // ... alle Module
} as const;
export type ModuleCode = typeof MODULE_CODES[keyof typeof MODULE_CODES];

// Kommentare: MOD-13 (mit Bindestrich) = Lesbarkeit
// Code/DB: MOD_13 (mit Unterstrich) = SQL-kompatibel
```

### E2. Import-Stile

✅ **Positiv:** Kein `require()` im `src/`-Code gefunden — konsistenter ESM-Import.

### E3. Datum-Formate im Code

```typescript
// Deutsch-Format gefunden:
"01.01.2026"          // src/data/demo-dates.ts (vermutet)
format(date, 'dd.MM.yyyy')  // in Datumsformatierungen

// ISO-Format (korrekt für DB):
"2026-01-01"
new Date().toISOString()

// Empfehlung: Immer ISO-Format für DB/API, Lokalisierung nur in UI
```

### E4. Magic Numbers/Strings ohne Konstante

```typescript
// Identifizierte Magic Values:
'MOD_13'  // 1369x — OHNE Konstante
'MOD_04'  // ~200x — OHNE Konstante
'MOD_07'  // ~150x — OHNE Konstante
5 * 60 * 1000  // staleTime in QueryClient — ✅ bereits konfiguriert
10 * 60 * 1000 // gcTime — ✅ bereits konfiguriert
2 * 60 * 1000  // Timeout-Werte in Edge Functions — OHNE Konstante

// Magic Strings in Supabase-Queries ohne Enums:
.eq('status', 'active')   // 'active' ohne Type-Guard
.eq('status', 'pending')  // 'pending' ohne Type-Guard
.eq('category', 'privat') // 'privat' ohne Type-Guard
```

**Fix:**
```typescript
// src/constants/status.ts
export const PropertyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;
export type PropertyStatus = typeof PropertyStatus[keyof typeof PropertyStatus];
```

### E5. Deno-Import-Versionen in Edge Functions

```typescript
// Inkonsistente Versionen gefunden:
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";  // alt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";       // vague
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"; // aktuell

// Empfehlung: Import-Map in supabase/functions/_shared/import_map.json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.49.1"
  }
}
```
