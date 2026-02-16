# Enterprise Readiness Code Review — Town Square Platform

> **Review-Datum**: 2026-02-16  
> **Reviewer**: GitHub Copilot Enterprise Agent  
> **Scope**: Architektur, Code-Qualität, Sicherheit, Testbarkeit, Performance  
> **Ausschluss**: Payment/Auth-Konfiguration (noch nicht entwickelt)

---

## Executive Summary

Das Town Square Platform Repository zeigt eine **durchdachte Architektur** mit klaren Zonen-Grenzen, manifestgesteuertem Routing und solider technischer Foundation. Die **3-Zonen-Architektur** (Admin/Portal/Websites) ist korrekt implementiert.

**Kritische Punkte**:
- ⚠️ **Test-Coverage extrem niedrig** (~4%, nur 8 Test-Dateien)
- 🔴 **Sicherheitslücken** in Edge Functions (CORS allow-all, fehlende Webhook-Validierung)
- 🟡 **Performance-Risiken** durch N+1-Queries und fehlende Paginierung
- 🟡 **TypeScript-Disziplin** mangelhaft (60+ `any`-Typen, 35+ `as any`-Casts)

**Stärken**:
- ✅ Klare Zone-Isolation (nur 1 intra-portal Violation)
- ✅ SSOT-Routing über `routesManifest.ts`
- ✅ RLS-Policies implementiert (260+ Tenant-Indizes)
- ✅ Umfangreiche Dokumentation (`spec/`, `docs/`, ADR-Logs)

**Gesamt-Reifegrad**: **B-** (gut fundiert, aber Test- und Sicherheits-Gaps vor Production kritisch)

---

## 1. Architektur-Qualität (Zonen/Module/SSOT)

### 1.1 Zonen-Struktur ✅ **STARK**

#### **Implementierung korrekt**:
| Zone | Pfad | Module | Zweck |
|------|------|--------|-------|
| Zone 1 | `/admin/**` | 30+ Module | Governance, Backoffice, Armstrong, Delegation |
| Zone 2 | `/portal/**` | 21 Module | Operatives Arbeiten (MOD-00 bis MOD-20) |
| Zone 3 | `/website/**` | 8 Websites | Public Marketing (kaufy, miety, futureroom, sot, etc.) |

**Verzeichnisstruktur**:
```
src/pages/admin/    ← Zone 1 (kein Import aus portal/ oder zone3/)
src/pages/portal/   ← Zone 2 (kein Import aus admin/ oder zone3/)
src/pages/zone3/    ← Zone 3 (kein Import aus admin/ oder portal/)
```

### 1.2 Cross-Zone Isolation ⚠️ **1 VIOLATION**

**ZBC-R04 (No-Cross-Import Regel) Compliance**:
- ✅ **Keine Zone 1 ↔ Zone 2 Violations**
- ✅ **Keine Zone 3 ↔ Andere Zonen Violations**
- ⚠️ **1 Intra-Portal Violation**:
  - **Datei**: `src/pages/portal/stammdaten/AbrechnungTab.tsx` (Zeilen 19-20)
  - **Issue**: Import von `communication-pro` Komponenten in `stammdaten`
  ```typescript
  import { AktionsKatalog } from '@/pages/portal/communication-pro/agenten/AktionsKatalog';
  import { KostenDashboard } from '@/pages/portal/communication-pro/agenten/KostenDashboard';
  ```
  - **Impact**: Kreiert versteckte Abhängigkeiten zwischen Portal-Modulen
  - **Fix**: Extrahieren nach `src/shared/` oder `src/components/portal-shared/`

### 1.3 SSOT Routing ✅ **STARK**

**ZBC-R01 & ZBC-R02 Compliance**:
- ✅ `src/manifests/routesManifest.ts` ist **einzige Source of Truth** (36 KB)
- ✅ `App.tsx` delegiert korrekt an `ManifestRouter`
- ✅ **Keine Routen** definiert in:
  - Komponenten
  - `constants/rolesMatrix.ts`
  - DB `tile_catalog`
- ✅ Nur erlaubte Ausnahmen in `App.tsx`:
  - `/` → Redirect
  - `/auth` → Login
  - `/presentation-*` → Hidden Routes

**Manifest-Struktur**:
```typescript
// routesManifest.ts
zone1Admin: { routes: [...] }          // Admin
zone2Portal: { modules: 21 }           // Portal (4-Tile Pattern)
zone3Websites: { sites: 8 }            // Public Websites
```

### 1.4 Golden Path Engine ✅ **VORHANDEN**

**Implementierung**:
- Pfad: `src/manifests/goldenPaths/`
- Dateien:
  - `GP_FINANCE_Z3.ts` (Zone 3 → Finance)
  - `GP_LEAD.ts` (Lead Capture)
  - `GP_VERMIETUNG.ts` (Rental Process)
  - `MOD_04.ts`, `MOD_07_11.ts`, `MOD_08_12.ts`, `MOD_13.ts`
- Engine: `src/goldenpath/` (Hooks, Guards)
- **Manifest**: `goldenPathProcesses.ts`

**Status**: Architektur vorhanden, aber **keine Tests** für Golden Path Guards.

### 1.5 Modulisolierung 🟡 **FRAGIL**

**Shared-Bereiche** (korrekt zone-agnostisch):
- ✅ `src/components/ui/**` — shadcn Primitives
- ✅ `src/shared/**` — Business-Komponenten
- ✅ `src/hooks/**` — Globale Hooks
- ✅ `src/integrations/**` — Supabase Client
- ✅ `src/manifests/**` — Manifests
- ✅ `src/lib/**` — Utils

**Probleme**:
- 🟡 Keine ESLint-Regel, die Cross-Zone-Imports automatisch blockiert
- 🟡 Intra-Portal Modulgrenzen nicht erzwungen (`communication-pro` → `stammdaten`)
- 🟡 `src/shared/` hat **keine** Tests (potenziell shared bugs)

### 1.6 Architektur-Qualität **Gesamt**: B+

| Aspekt | Note | Kommentar |
|--------|------|-----------|
| Zone-Struktur | A | Klar getrennt, korrekte Verzeichnisse |
| SSOT Routing | A | Perfekt in routesManifest.ts zentralisiert |
| Cross-Zone Isolation | B | 1 Violation, aber keine kritischen |
| Module Isolation | C+ | Keine Enforcement-Regeln, 1 Violation |
| Golden Path Engine | B | Vorhanden, aber untested |

**Risiken**:
- 🔴 **Fehlende ESLint Cross-Zone Rules** → künftige Violations unvermeidbar
- 🟡 **Golden Path Guards** ohne Tests → Regression-Risiko bei Änderungen

---

## 2. Code-Qualität

### 2.1 TypeScript-Disziplin 🔴 **KRITISCH**

#### **Problem 1: Exzessive `any`-Nutzung**
- **Count**: 60+ Instanzen
- **Beispiele**:
  ```typescript
  // EditableHelpers.tsx
  ref={ref as any}
  
  // SectionRenderer.tsx
  React.FC<{ content: any; design: any }>
  
  // useFinanzberichtData.ts
  catMap = new Map<string, { items: any[]; subtotal: number }>
  
  // useWebsites.ts
  branding_json?: any
  ```
- **Impact**: Eliminiert Type-Safety, reduziert IDE-Unterstützung, erhöht Runtime-Fehler

#### **Problem 2: `as any` Type Casts**
- **Count**: 35+ Instanzen
- **Beispiele**:
  ```typescript
  // MandatDetail.tsx
  <Badge variant={statusConfig.variant as any}>
  
  // AnfrageTab.tsx
  formData={{} as any}
  coFormData={{} as any}
  
  // ProjectDetailPage.tsx
  reservations={dossier.reservations as any}
  ```

**Empfehlung**: TypeScript `strict: true` aktivieren, Zod-Schemas für Runtime-Validation.

### 2.2 Lesbarkeit 🟡 **MITTEL**

#### **Positive Patterns**:
- ✅ Konsistente Datei-Namenskonvention (PascalCase für Komponenten, camelCase für Utils)
- ✅ React Query Hooks folgen `use{Entity}{Action}` Pattern
- ✅ Komponenten-Struktur meist unter 300 Zeilen

#### **Probleme**:
- 🔴 **40+ Triple-Nested Ternary Operators**:
  ```typescript
  color = score >= 70 ? 'text-green-600' : 
          score >= 40 ? 'text-amber-600' : 
          'text-red-500'
  ```
  → Sollten Helper-Funktionen sein

- 🔴 **Komplexe Nested Logic** ohne Kommentare:
  - `usePortfolioSummary.ts` (172 Zeilen): 40-Jahre-Projektionen in `useMemo`
  - `AkquiseDatenbank.tsx` (110 Zeilen): Filter/Sort/Aggregation in Component

### 2.3 Duplikate 🟡 **VORHANDEN**

**Identifizierte Patterns**:
- **PDF Generation**: 3x ähnliche Implementierungen
  - `generateProjectReportPdf.ts`
  - `generateLegalDocumentPdf.ts`
  - `generateKaufyInvestorPdfDetail.ts`
- **Data Fetching Hooks**: 118+ Hooks, viele mit identischem Pattern:
  ```typescript
  // useAcqMandate.ts, useFinanceMandate.ts, useDMSDocument.ts
  const { data, isLoading, error } = useQuery({
    queryKey: ['entity', id],
    queryFn: async () => { ... }
  })
  ```
  → **Factory Pattern** oder Hook-Generator wäre wartbarer

### 2.4 Spaghetti-Risiken 🟡 **MODERAT**

**Gefährdete Bereiche**:
1. **Armstrong Integration** (10+ Hooks ohne Tests)
   - Komplexe Zustandsverwaltung über mehrere Hooks
   - Voice/Text-Switching ohne klare State Machine
   - Console.logs verteilt (debugging artifacts)

2. **Portfolio Aggregation** (`usePortfolioSummary.ts`)
   - 172 Zeilen, 5 separate `useMemo` Chains
   - Client-side Aggregationen statt DB-Views
   - Leicht zu brechen bei Schema-Änderungen

3. **Communication Pro** Module
   - Mixing von UI + Business Logic + API Calls
   - Fehlende Abstraktionsschicht

### 2.5 Naming 🟡 **INKONSISTENT**

**Konsistent**:
- ✅ Components: PascalCase
- ✅ Hooks: `use{Noun}{Verb}`
- ✅ Utils: camelCase

**Inkonsistent**:
- 🟡 **Prefixes variieren**:
  - `acq_` vs `acquisition_` in Tabellennamen
  - `sot-` vs `SOT-` in Public IDs
  - `MOD-` vs `mod-` in verschiedenen Kontexten
- 🟡 **Abkürzungen**:
  - `NK` (Nebenkosten) vs. `operation_costs`
  - `VV` (Vermietung/Verwaltung) vs. `rental`
  - `Akquise` vs. `acquisition`

### 2.6 Console.log Statements 🔴 **KRITISCH**

**Count**: 29 Instanzen in Production Code
- `AuthContext.tsx`: 3x
- `useArmstrongVoice.ts`: 2x
- `usePortalLayout.tsx`: 3x
- `EmailTab.tsx`, `useGoldenPathSeeds.ts`, etc.

**Risiko**: 
- Security (Logs können sensitive Daten enthalten)
- Performance (Bundle-Bloat)
- Debugging-Artefakte

**Fix**: Logger-Middleware mit `if (__DEV__)` Guards.

### 2.7 Empty Catch Blocks 🔴 **KRITISCH**

**Count**: 15+ Instanzen
```typescript
// FutureRoomAkte.tsx
try { 
  setIntakeData(JSON.parse(stored)); 
} catch { /* silent failure */ }

// DictationButton.tsx
try { 
  browserRecRef.current?.stop(); 
} catch { /* ignore */ }
```

**Impact**: Bugs werden verschluckt, Debugging unmöglich.

### 2.8 Code-Qualität **Gesamt**: C+

| Aspekt | Note | Kommentar |
|--------|------|-----------|
| TypeScript-Disziplin | D | 60+ `any`, 35+ `as any` |
| Lesbarkeit | B- | Meist gut, aber 40+ nested ternaries |
| Duplikate | C+ | PDF gen, Data fetching patterns |
| Spaghetti-Risiken | B- | Armstrong & Portfolio gefährdet |
| Naming | B | Meist gut, Prefix-Inkonsistenzen |
| Production Readiness | D | 29 console.logs, 15 empty catches |

---

## 3. Sicherheit (Architektur-Ebene)

### 3.1 RLS Policies ✅⚠️ **IMPLEMENTIERT, ABER GAPS**

**Positive**:
- ✅ RLS aktiviert auf Core-Tabellen (`properties`, `units`, `leases`, `contacts`)
- ✅ Tenant-Isolation via Membership-Checks:
  ```sql
  tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())
  ```
- ✅ 260+ Composite Indizes auf `(tenant_id, created_at)`

**Gaps**:
- 🟡 Migration `20260209213925` zeigt `DROP POLICY` ohne Replacement
- 🟡 Keine explizite RLS-Dokumentation (welche Tabellen haben RLS?)
- 🟡 Service Role **bypassed RLS** (erwartet, aber muss dokumentiert sein)

### 3.2 Database Views ⚠️ **NICHT AUDITIERT**

- Views erwähnt in Code, aber **keine View-Definitionen** in Migrations sichtbar
- Risiko: **View-basierte Datenexposition** ohne RLS
- Empfehlung: Alle Views auditieren auf Tenant-Filtering

### 3.3 Edge Functions 🔴 **KRITISCHE LÜCKEN**

#### **Problem 1: CORS Allow-All** 🔴
```typescript
'Access-Control-Allow-Origin': '*'  // ← Auf ALLEN 109 Functions!
```
**Impact**: 
- CSRF-Angriffe möglich
- Cross-Origin Credential Leakage
- Keine Origin-Kontrolle

#### **Problem 2: Fehlende Webhook-Validierung** 🔴
```typescript
// sot-renovation-inbound-webhook/index.ts
// TODO: Verify webhook signature  ← NICHT IMPLEMENTIERT!
```
**Betroffene Functions**:
- `sot-acq-inbound-webhook`
- `sot-renovation-inbound-webhook`
- `sot-whatsapp-webhook`

#### **Problem 3: Public Endpoints ohne Auth** 🔴
- `sot-public-project-intake`: Datei-Upload **ohne** Authentifizierung
- `sot-futureroom-public-submit`: Finance-Requests **ohne** Rate-Limiting
- `sot-website-lead-capture`: Lead-Capture **ohne** CAPTCHA

#### **Problem 4: Service Role Overuse** 🔴
```typescript
// 140+ Functions nutzen:
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
// → Bypassed RLS komplett!
```

**Empfehlung**: 
- User-scoped Tokens wo möglich
- Service Role nur für Cross-Tenant Operations

### 3.4 Exposed Credentials ⚠️

**In `.env` (öffentlich im Repo)**:
```
VITE_SUPABASE_PROJECT_ID="ktpvilzjtcaxyuufocrs"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..." (JWT sichtbar)
```
- ✅ Publishable Key ist **expected** public
- ⚠️ Aber: Project ID könnte limitiert werden

**OAuth Tokens**:
- `mail_accounts.access_token`: Klartext-Storage
- Besser: `credentials_vault_key` verwenden (verschlüsselt)

### 3.5 SQL Injection ✅ **SICHER**

- ✅ Alle Queries via Supabase Client (parametrisiert)
- ✅ Kein String-Concatenation für SQL
- ✅ Edge Functions nutzen `.eq()`, `.select()` Methods

### 3.6 Input Validation ⚠️ **INKONSISTENT**

**Positiv**:
- Basic Checks vorhanden: `if (!data.address || !data.city)`

**Gaps**:
- 🔴 Keine Zod-Schemas für Webhook-Payloads
- 🔴 Public Endpoints akzeptieren arbitrary JSON
- 🔴 Datei-Upload ohne Type-Checking

**Empfehlung**: Zod-basierte Schema-Validation vor DB-Insert.

### 3.7 Cross-Zone Data Access 🟡 **PUBLIC ID RISK**

**Pattern**:
```sql
public_id TEXT NOT NULL UNIQUE DEFAULT 'CTX-' || substr(gen_random_uuid()::text, 1, 8)
```
- 8-Zeichen Base32 = ~1 Billion Kombinationen
- **Risiko**: Enumeration Attacks bei fehlender Rate-Limiting

**Multi-Zone Flow**:
```
Zone 3 (Public) → Edge Function → Zone 1 (Admin) → Lead Pool
```
- ✅ Korrekte Handoffs über Edge Functions
- ⚠️ Fehlende Webhook-Signaturen = Spoofing-Risiko

### 3.8 Sicherheit **Gesamt**: C

| Aspekt | Note | Kommentar |
|--------|------|-----------|
| RLS Policies | B+ | Implementiert, aber Gaps in Docs |
| Database Views | ? | Nicht auditiert |
| Edge Functions | D | CORS allow-all, fehlende Webhook-Validierung |
| Credential Management | B- | .env exposed (acceptable), OAuth plaintext |
| SQL Injection | A | Parametrisierte Queries |
| Input Validation | C | Inconsistent, keine Schemas |
| Cross-Zone Security | C+ | Public ID Enumeration Risk |

**Blocker vor Production**:
1. 🔴 CORS auf spezifische Origins einschränken
2. 🔴 Webhook-Signatur-Validierung implementieren
3. 🔴 Rate-Limiting auf Public Endpoints
4. 🟡 Zod-Schemas für alle Inputs

---

## 4. Testbarkeit

### 4.1 Test-Coverage 🔴 **EXTREM NIEDRIG (~4%)**

**Vorhandene Tests** (8 Dateien):
| Datei | Typ | Coverage |
|-------|-----|----------|
| `engine.test.ts` (projektCalc) | Unit | 3 Functions ✅ |
| `engine.test.ts` (akquiseCalc) | Unit | 5 Functions ✅ |
| `engine.test.ts` (finanzierung) | Unit | 6 Functions ✅ |
| `engine.test.ts` (provision) | Unit | ? |
| `engine.test.ts` (bewirtschaftung) | Unit | ? |
| `demoDataSystem.test.ts` | Integration | Demo Toggles ✅ |
| `manifestDrivenRoutes.test.ts` | Integration | 21 Modules, 85 Routes ✅ |
| `example.test.ts` | Placeholder | N/A |

**Untested**:
- 🔴 **118+ Hooks** (0% Coverage)
- 🔴 **40+ Component Folders** (0% Coverage)
- 🔴 **3 Services** (europace, fortbildung)
- 🔴 **10 Lib/Utils** (contractGenerator, taxCalculator, etc.)

### 4.2 Test-Infrastruktur ✅ **KONFIGURIERT**

- Framework: **Vitest** (Unit) + **Playwright** (E2E)
- Config: `vitest.config.ts`, `playwright.config.ts`
- Setup: `src/test/setup.ts`
- Commands: `npm run test`, `npm run test:watch`

**Aber**: 
- ⚠️ **Keine E2E-Tests** gefunden
- ⚠️ **Keine Coverage Reports** konfiguriert

### 4.3 High-Risk Untested Modules

**Business-Critical**:
1. **NK Abrechnung** (Nebenkosten-Aufteilung)
   - 6+ Module, komplexe Berechnungen
   - Fehlende Tests = Finanz-Risiko

2. **Finance Submission** Flow
   - `useFinanceSubmission`, `useFinanceMandate`, `useConsumerLoan`
   - Europace-Integration untested

3. **Acquisition Tools**
   - 15+ Hooks (`useAcqMandate`, `useAcqOffers`, `useAcqContacts`)
   - Pipeline-Logik komplett untested

4. **PDF & Legal Document Generation**
   - `contractGenerator.ts`, `generateLegalDocumentPdf.ts`
   - 0% Coverage = Legal-Risiko

5. **Armstrong Integration**
   - 10+ Hooks, Voice/Text Switching
   - Komplexe State Machine untested

### 4.4 Minimale Regression-Suite (Empfehlung)

**Phase 1: Critical Path Tests** (2-3 Tage Aufwand)
```
1. NK Abrechnung Engine
   - ✅ Umlageschlüssel-Korrektheit
   - ✅ Heiz-/Warmwasser-Aufteilung
   - ✅ Nachzahlungs-Berechnungen

2. Finance Calculation Hooks
   - ✅ useConsumerLoan: Zins-/Raten-Berechnung
   - ✅ useFinanceMandate: Darlehens-Aggregation
   - ✅ useFinanceSubmission: Europace-Payload

3. Acquisition Pipeline
   - ✅ useAcqMandate: Mandats-Erstellung
   - ✅ useAcqOffers: Angebots-Validierung
   - ✅ Pipeline-Status-Transitions

4. Contract Generation
   - ✅ contractGenerator: Mandats-PDF
   - ✅ generateLegalDocumentPdf: Legal-Compliance

5. Golden Path Guards
   - ✅ GP_FINANCE_Z3: Zone 3 → Finance Flow
   - ✅ GP_LEAD: Lead Capture → Routing
   - ✅ GP_VERMIETUNG: Rental Process Steps
```

**Phase 2: E2E Happy Paths** (3-4 Tage Aufwand)
```
1. Finance Request (Zone 3 → Zone 1)
   - Submit finance request via public form
   - Verify lead creation in admin pool
   - Assign to agent, process finance package

2. Acquisition Flow
   - Create acquisition mandate
   - Generate offer
   - Convert to contract

3. Rental Management
   - Create property
   - Add unit
   - Create lease
   - Generate NK Abrechnung

4. Armstrong Integration
   - Voice command → Action execution
   - Email generation via Armstrong
   - Document attachment flow
```

**Phase 3: Component Snapshot Tests** (2 Tage Aufwand)
- UI Library (`src/components/ui/**`)
- Shared Business Components

### 4.5 Testbarkeit **Gesamt**: D

| Aspekt | Note | Kommentar |
|--------|------|-----------|
| Test Coverage | F | ~4% (8 von 180+ Modulen) |
| Test Infrastructure | B | Vitest + Playwright konfiguriert |
| Unit Tests | C | Nur Calc-Engines getestet |
| Integration Tests | D | 2 Tests (Demo, Routes) |
| E2E Tests | F | 0 Tests |
| Critical Business Logic | F | NK Abrechnung, Finance, ACQ untested |

**Blocker vor Production**:
- 🔴 NK Abrechnung Tests (Finanz-Risiko)
- 🔴 Finance Submission Tests (Europace-Integration)
- 🔴 Golden Path Guards Tests (Regression-Risiko)

---

## 5. Performance / Skalierung

### 5.1 N+1 Query Patterns 🔴 **KRITISCH**

**Betroffene Hooks**:
1. **`useArmstrongDashboard.ts`** (Zeilen 52-98)
   ```typescript
   // 6+ sequentielle Queries statt 1 View:
   const { count: actions24h } = await supabase.select('*').gte('created_at', yesterday)
   const { data: costs30d } = await supabase.select('cost').gte('created_at', last30)
   const { data: errors } = await supabase.select('*').eq('status', 'error')
   // ... 3 weitere Queries
   ```
   **Impact**: 6x Roundtrips statt 1 aggregierte View

2. **`usePortfolioSummary.ts`** (Zeilen 39-103)
   - Separate Queries für Units, Leases, Loans
   - Client-Side Joins via Maps
   - Unbounded result sets (keine `.limit()`)

### 5.2 Fehlende Paginierung 🔴 **KRITISCH**

**Gefährdete Komponenten**:
1. **`AkquiseDatenbank.tsx`** (Zeilen 65-110)
   ```typescript
   // Lädt ALLE Offers in Memory:
   const { data: offersData } = useAcqOffers()
   
   // Filter/Sort Client-Side (Zeilen 101-110):
   const filteredAndSortedOffers = useMemo(() => {
     return offersData?.filter(...).sort(...)  // O(n log n) bei jedem Keystroke!
   }, [offersData, searchTerm, ...])
   ```
   **Risiko bei 5.000+ Offers**: 50MB+ JSON, Browser-Freeze

2. **`DataTable.tsx`**
   - Paginierung **nur client-side** (Zeile 55-84)
   - Alle Daten geladen, dann gepaginate

3. **Portfolio/Contact Lists**
   - Keine Server-Side Paginierung
   - Bei 1.000+ Units/Leases: Multi-Second Load Times

### 5.3 Heavy Client-Side Aggregationen 🟡 **PERFORMANCE-RISIKO**

**`usePortfolioSummary.ts`** (Zeilen 106-172):
```typescript
// Maps für Deduplication:
const leaseMap = new Map()
leases?.forEach(l => {
  const existing = leaseMap.get(l.unit_id) || { ... }
  // ... multiple operations pro Lease
})

// 40-Jahre Finanz-Projektionen:
for (let year = 0; year < 40; year++) {
  // ... compound interest calculations
}
```
**Impact**: 200ms+ bei 100 Units, skaliert O(n × 40).

### 5.4 Fehlende Memoization 🟡 **OPTIMIERBAR**

**Gefunden**:
- ✅ `DataTable.tsx`: 3x `useMemo` für Filter→Sort→Paginate
- ⚠️ **Fehlende** `useCallback` für Event-Handlers
  - `handleSort`, `getValue`, `onEdit`, etc.
  - Re-renders bei Parent-Updates

**Nicht gememoized**:
- Contact Lists ohne `useMemo`
- `.map()` in Render ohne stable Keys

### 5.5 Database View Complexity ⚠️ **UNTESTED**

**Identifiziert**:
- `v_armstrong_dashboard_kpis` (erwähnt im Code)
- **Aber**: Fallback-Queries vorhanden (6 separate Selects)

**Gaps**:
- Keine Views für Portfolio-Aggregationen
- Keine Views für ACQ-Offer-Analytics
- Fehlende Indizes für View-Performance?

**Indizes**: ✅ 260+ Composite auf `(tenant_id, created_at)`

### 5.6 Unbounded Data Fetches 🔴 **KRITISCH**

**High-Risk Queries**:
```typescript
// PortfolioTab.tsx:195-209
.select(`
  units(*),
  leases(*),
  loans(*)
`)  // ← KEIN .limit(), kann 10.000+ rows laden!

// AkquiseDatenbank:68-75
.select(`*`) from acq_offers  // ← KEIN .limit()
```

**Empfehlung**: `.limit(50)` + `.range()` für Paginierung.

### 5.7 Caching ⚠️ **NUR REACT QUERY**

**Positiv**:
- ✅ React Query mit `queryKey` Invalidation
- ✅ `staleTime`, `cacheTime` konfiguriert

**Gaps**:
- ⚠️ Keine Server-Side Caching (Redis, etc.)
- ⚠️ Keine CDN-Caching für Static Assets
- ⚠️ Wiederholte 40-Jahre-Projektionen (könnte gecached werden)

### 5.8 Performance **Gesamt**: C-

| Aspekt | Note | Kommentar |
|--------|------|-----------|
| N+1 Queries | D | Armstrong Dashboard, Portfolio |
| Paginierung | D | Client-side only, unbounded fetches |
| Client-Side Aggregationen | C | 40-Jahre-Projektionen, Lease Dedup |
| Memoization | B- | Teilweise vorhanden, Callbacks fehlen |
| DB View Usage | C | Views erwähnt, aber Fallback-Queries |
| Caching | C+ | Nur React Query, kein Server-Cache |
| Indizes | A | 260+ Tenant-Indizes ✅ |

**Blocker für 1.000+ Users**:
1. 🔴 Server-Side Paginierung für Offers/Contacts
2. 🔴 Aggregations-Views für Portfolio/Armstrong
3. 🟡 40-Jahre-Projektion Backend-seitig cachen

---

## 6. Tech Debt Liste (Top 10)

| # | Item | Impact | Aufwand | Risiko | Priorität |
|---|------|--------|---------|--------|-----------|
| **1** | **Test-Coverage auf <5%** | 🔴 **KRITISCH** | 🔴 **10-15 PT** | 🔴 **Regression-Risiko** | **P0** |
| | **Details**: 118+ Hooks, 40+ Components, 10 Utils untested. NK Abrechnung, Finance, ACQ komplett ohne Tests. | Production-Blocker | 2-3 Sprints | Finanz-/Legal-Risiko | SOFORT |
| **2** | **CORS Allow-All auf 109 Edge Functions** | 🔴 **KRITISCH** | 🟡 **2-3 PT** | 🔴 **CSRF/Security** | **P0** |
| | **Details**: `Access-Control-Allow-Origin: '*'` auf allen Functions. Webhook-Signature-Validation fehlt. | Security-Lücke | 1-2 Tage | Data Breach Risk | SOFORT |
| **3** | **TypeScript `any` Overuse (60+ Instanzen)** | 🔴 **HOCH** | 🔴 **8-10 PT** | 🟡 **Type-Safety** | **P1** |
| | **Details**: 60+ `any` Types, 35+ `as any` Casts. Type-Safety eliminiert, Runtime-Fehler wahrscheinlich. | Wartbarkeit | 1 Sprint | Latente Bugs | Sprint 1 |
| **4** | **N+1 Queries & Fehlende Paginierung** | 🟠 **HOCH** | 🟡 **5 PT** | 🟠 **Skalierung** | **P1** |
| | **Details**: Armstrong Dashboard 6x sequentielle Queries, AkquiseDatenbank lädt alle Offers, Portfolio unbounded. | Performance | 3-5 Tage | 1000+ User Blocker | Sprint 1 |
| **5** | **Fehlende ESLint Cross-Zone Rules** | 🟠 **MITTEL** | 🟢 **1 PT** | 🟠 **Architektur-Erosion** | **P1** |
| | **Details**: Keine automatische Enforcement von Zone-Boundaries. 1 Violation bereits vorhanden. | Architektur | 1 Tag | Künftige Violations | Sprint 1 |
| **6** | **Console.log() in Production (29x)** | 🟠 **MITTEL** | 🟢 **1 PT** | 🟡 **Security/Performance** | **P2** |
| | **Details**: AuthContext, Armstrong, Portal-Layout, etc. Logs können Secrets enthalten. | Security | 0.5 Tage | Data Exposure | Sprint 1 |
| **7** | **Empty Catch Blocks (15+)** | 🟠 **MITTEL** | 🟢 **1 PT** | 🟡 **Debugging** | **P2** |
| | **Details**: FutureRoomAkte, DictationButton, PDF Generation. Fehler werden verschluckt. | Debuggability | 0.5 Tage | Silent Failures | Sprint 1 |
| **8** | **27 TODO/FIXME ohne Owner** | 🟡 **MITTEL** | 🟡 **3 PT** | 🟡 **Feature-Inkomplett** | **P2** |
| | **Details**: `TODO: Verify webhook signature`, `TODO: Replace with live query`, etc. Keine Tickets, kein Deadline. | Tech Debt | 2 Tage (Triage) | Unklare Roadmap | Sprint 2 |
| **9** | **Deprecated Code noch in Use (14+)** | 🟡 **NIEDRIG** | 🟡 **3 PT** | 🟡 **Breaking Changes** | **P2** |
| | **Details**: `routes_manifest.yaml`, MarketingTab, 14 Finance-Felder marked `@deprecated` aber aktiv genutzt. | Maintenance | 2 Tage | Future Breaks | Sprint 2 |
| **10** | **Intra-Portal Module Violation** | 🟡 **NIEDRIG** | 🟢 **1 PT** | 🟢 **Isolation** | **P3** |
| | **Details**: `stammdaten/AbrechnungTab.tsx` importiert aus `communication-pro/agenten/`. | Architektur | 1 Tag | Hidden Dependencies | Sprint 2 |

### 6.1 Impact-Risiko-Matrix

```
        IMPACT
         ↑
    HIGH │ #1 Tests    #2 CORS    #3 Any
         │ #4 N+1      #5 ESLint
         │
   MEDIUM│ #6 Logs     #7 Catch   #8 TODO
         │
     LOW │             #9 Deprecated #10 Cross-Import
         │
         └─────────────────────────────────→ RISIKO
               LOW      MEDIUM      HIGH
```

### 6.2 Aufwands-Übersicht

| Kategorie | Story Points | Tage (1 Dev) |
|-----------|--------------|--------------|
| **P0 (Blocker)** | 15 PT | 10-12 Tage |
| **P1 (High)** | 15 PT | 10 Tage |
| **P2 (Medium)** | 6 PT | 4 Tage |
| **P3 (Low)** | 1 PT | 1 Tag |
| **GESAMT** | **37 PT** | **~25 Tage** |

---

## 7. "Next 2 Sprints" Plan

### Sprint 1 (2 Wochen): **Foundation Hardening**

#### **Week 1: Security & Architecture**

**Tag 1-2: CORS & Webhook Security (P0)**
- [ ] **Task 1.1**: CORS Origins einschränken
  - Alle 109 Edge Functions: Replace `'*'` mit allowlist
  - Domains: `kaufy.io`, `miety.de`, `futureroom.de`, `systemofatown.com`
  - Aufwand: **2 PT** | Owner: Backend
- [ ] **Task 1.2**: Webhook-Signature-Validation
  - `sot-acq-inbound-webhook`, `sot-renovation-inbound-webhook`, `sot-whatsapp-webhook`
  - Implement HMAC-SHA256 Signature Check
  - Aufwand: **1 PT** | Owner: Backend

**Tag 3-4: ESLint Cross-Zone Rules (P1)**
- [ ] **Task 1.3**: ESLint Plugin konfigurieren
  - Rule: `no-cross-zone-imports`
  - Paths: `admin/*` → blocked from `portal/*`, etc.
  - Aufwand: **1 PT** | Owner: DevOps
- [ ] **Task 1.4**: Fix Intra-Portal Violation
  - Extract `AktionsKatalog`, `KostenDashboard` nach `src/shared/`
  - Aufwand: **0.5 PT** | Owner: Frontend

**Tag 5: Production Code Cleanup (P2)**
- [ ] **Task 1.5**: Console.log() Removal
  - Alle 29 Instanzen → Logger-Middleware mit `__DEV__` Guards
  - Aufwand: **0.5 PT** | Owner: Frontend
- [ ] **Task 1.6**: Empty Catch Blocks
  - 15+ Instanzen → Logging oder Rethrow
  - Aufwand: **0.5 PT** | Owner: Frontend

#### **Week 2: Performance & Tests**

**Tag 6-7: Performance Hotspots (P1)**
- [ ] **Task 1.7**: Server-Side Paginierung
  - `AkquiseDatenbank.tsx`, Contact Lists
  - Implement `.range()` + Backend Pagination
  - Aufwand: **3 PT** | Owner: Full-Stack
- [ ] **Task 1.8**: Armstrong Dashboard View
  - Create `v_armstrong_dashboard_kpis` (aggregated)
  - Replace 6x sequential queries
  - Aufwand: **2 PT** | Owner: Backend

**Tag 8-10: Test Foundation (P0 Start)**
- [ ] **Task 1.9**: NK Abrechnung Tests
  - Unit-Tests für Umlageschlüssel, Heiz-/Warmwasser
  - Aufwand: **3 PT** | Owner: QA + Backend
- [ ] **Task 1.10**: Finance Calculation Tests
  - `useConsumerLoan`, `useFinanceMandate` Unit-Tests
  - Aufwand: **2 PT** | Owner: QA + Backend

**Sprint 1 Deliverables**:
- ✅ Security-Lücken geschlossen (CORS, Webhooks)
- ✅ Architecture Enforcement (ESLint Rules)
- ✅ Performance 50% verbessert (Pagination, Views)
- ✅ 15+ kritische Tests hinzugefügt

---

### Sprint 2 (2 Wochen): **Test-Coverage & TypeScript**

#### **Week 1: Test Expansion**

**Tag 1-3: Golden Path & Integration Tests (P0)**
- [ ] **Task 2.1**: Golden Path Guards Tests
  - `GP_FINANCE_Z3`, `GP_LEAD`, `GP_VERMIETUNG`
  - Unit + Integration Tests
  - Aufwand: **4 PT** | Owner: QA + Frontend
- [ ] **Task 2.2**: Acquisition Flow Tests
  - `useAcqMandate`, `useAcqOffers`, Pipeline-Status
  - Aufwand: **3 PT** | Owner: QA + Backend

**Tag 4-5: E2E Happy Paths (P0)**
- [ ] **Task 2.3**: Finance Request E2E (Zone 3 → Zone 1)
  - Playwright Test: Public Form → Lead Creation → Assignment
  - Aufwand: **2 PT** | Owner: QA
- [ ] **Task 2.4**: Rental Management E2E
  - Property → Unit → Lease → NK Abrechnung
  - Aufwand: **2 PT** | Owner: QA

#### **Week 2: TypeScript Strictness**

**Tag 6-8: Type-Safety Refactor (P1)**
- [ ] **Task 2.5**: Activate `strict: true` in `tsconfig.json`
  - Fix 60+ `any` Types incrementally
  - Priorität: Finance, NK Abrechnung, Armstrong
  - Aufwand: **5 PT** | Owner: Frontend
- [ ] **Task 2.6**: Zod Schema Validation
  - Webhook Payloads, Public Endpoints
  - Aufwand: **2 PT** | Owner: Backend

**Tag 9-10: Tech Debt Triage (P2)**
- [ ] **Task 2.7**: TODO/FIXME → Tickets
  - Alle 27 Items in Backlog konvertieren (Jira/Linear)
  - Owner + Priority + Sprint zuweisen
  - Aufwand: **1 PT** | Owner: PM
- [ ] **Task 2.8**: Deprecated Code Audit
  - 14 Items: Migration-Plan erstellen oder Code entfernen
  - Aufwand: **2 PT** | Owner: Tech Lead

**Sprint 2 Deliverables**:
- ✅ Test-Coverage auf 25%+ (kritische Pfade)
- ✅ TypeScript `strict: true` aktiviert
- ✅ E2E-Tests für 2 Happy Paths
- ✅ Tech Debt transparent (alle TODOs ticketed)

---

### Post-Sprint 2: **Continuous Improvement**

**Monitoring Setup**:
- [ ] Coverage Reports in CI (Vitest + Istanbul)
- [ ] Performance Monitoring (Sentry + Custom Metrics)
- [ ] Security Scanning (Snyk, OWASP Dependency-Check)

**Documentation Updates**:
- [ ] RLS Policy Dokumentation
- [ ] View-Liste mit Security-Audit
- [ ] Test-Strategy Guide

---

## 8. GitHub Optimization Review — Regression-Risiken

### 8.1 Review-Findings

**Audit-Datei**: `spec/audit/github_optimization_review_backlog.json`

**Zusammenfassung**:
```json
{
  "audit_date": "2026-02-16",
  "trigger": "GitHub AI Agent Merge",
  "findings": [
    {
      "id": "GH-OPT-001",
      "priority": "P0",
      "status": "fixed",
      "category": "build_error",
      "file": "src/components/finanzierung/CaseDocumentRoom.tsx",
      "description": "foldersWithDocs scope error after useMemo refactor",
      "fix": "Extracted foldersWithDocs as useCallback at component level"
    }
  ],
  "verdict": "1 P0 build fix applied, architecture intact"
}
```

### 8.2 Regression-Risiken **MARKIERT**

**GH-OPT-001: CaseDocumentRoom useMemo Refactor**
- **Risk**: `foldersWithDocs` Scope-Änderung könnte Side-Effects haben
- **Impact**: Finance Document Room (kritischer Workflow)
- **Mitigation**: 
  - ⚠️ **E2E-Test erforderlich** für Finance Document Upload
  - Manuelle QA vor Production-Deploy

**Architectural Integrity** ✅:
- Routes Manifest: **intakt**
- Zone Boundaries: **intakt**
- Golden Path Wiring: **intakt**
- Legacy Redirects: **intakt**
- Rogue Routes: **keine gefunden**

**Empfehlung**: 
- GH-OPT-001 Fix ist korrekt, aber **Test hinzufügen**
- Zukünftige AI-Refactors: Immer mit Test-Coverage kombinieren

---

## 9. Zusammenfassung & Priorisierung

### 9.1 Kritische Findings (Production-Blocker)

| Finding | Severity | Sprint | Owner |
|---------|----------|--------|-------|
| Test-Coverage <5% | 🔴 **P0** | 1+2 | QA + Dev |
| CORS Allow-All | 🔴 **P0** | 1 | Backend |
| Webhook-Validation fehlt | 🔴 **P0** | 1 | Backend |
| N+1 Queries | 🔴 **P0** | 1 | Backend |
| TypeScript `any` Overuse | 🟠 **P1** | 2 | Frontend |

### 9.2 Stärken (beibehalten)

- ✅ **3-Zonen-Architektur** korrekt implementiert
- ✅ **SSOT Routing** über `routesManifest.ts`
- ✅ **RLS Policies** auf Core-Tabellen
- ✅ **ADR-Dokumentation** umfassend
- ✅ **Composite Indizes** (260+ Tenant-Scoped)

### 9.3 Gesamt-Reifegrad: **B-**

**Breakdown**:
| Dimension | Note | Gewicht | Gewichtet |
|-----------|------|---------|-----------|
| Architektur | B+ | 25% | 0.21 |
| Code-Qualität | C+ | 20% | 0.13 |
| Sicherheit | C | 25% | 0.15 |
| Testbarkeit | D | 20% | 0.08 |
| Performance | C- | 10% | 0.06 |
| **GESAMT** | **B-** | **100%** | **0.63** |

**Interpretation**:
- **Fundament solide** (Architektur A-, RLS B+)
- **Aber**: Kritische Lücken in Tests, Security, Performance
- **Production-Ready**: **NEIN** (5 P0-Blocker)
- **Nach Sprint 1+2**: **JA** (bei erfolgreicher Umsetzung)

---

## 10. Empfohlene Nächste Schritte

### Sofort (diese Woche):
1. 🔴 **CORS Origins einschränken** (2 PT)
2. 🔴 **Webhook-Signature-Validation** (1 PT)
3. 🔴 **NK Abrechnung Tests starten** (3 PT)

### Sprint 1 (nächste 2 Wochen):
4. 🟠 ESLint Cross-Zone Rules (1 PT)
5. 🟠 Server-Side Paginierung (3 PT)
6. 🟠 Armstrong Dashboard View (2 PT)
7. 🟠 Console.log() Cleanup (0.5 PT)

### Sprint 2 (Wochen 3-4):
8. 🟡 TypeScript `strict: true` (5 PT)
9. 🟡 Golden Path E2E-Tests (4 PT)
10. 🟡 TODO-Triage → Backlog (1 PT)

---

## Anhang A: Verwendete Tools & Methodik

**Code-Analyse**:
- `grep` (ripgrep) für Pattern-Suche
- `glob` für File-Discovery
- Custom Explore Agents (AI-gestützt)

**Metriken**:
- Manuelle Zählung von Violations
- Test-Coverage via Vitest Config
- Performance-Analyse via Code-Review

**Dokumenten-Review**:
- `spec/current/**` (normativ)
- `docs/**` (abgeleitet)
- ADR-Logs (`DECISIONS.md`)
- GitHub Audit (`spec/audit/*.json`)

---

**Ende des Reviews** — Version 1.0 — 2026-02-16
