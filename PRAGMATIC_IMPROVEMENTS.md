# Pragmatic Improvements — Late-Stage Development (~80% Complete)

> **Context**: NOT in formal testing phase, modules still evolving, calculations not fully validated  
> **Goal**: Stabilize architecture and performance WITHOUT blocking ongoing development  
> **Date**: 2026-02-16

---

## Executive Summary

**Development Stage**: ~80% Complete, Pre-Testing Phase  
**Strategy**: Safe, high-impact improvements only  
**Avoid**: Test coverage mandates, refactoring evolving modules, TypeScript strict enforcement

---

## ✅ IMPLEMENT NOW — Safe & High-Impact

### Category 1: Performance (Reduces Future Refactor Cost)

#### **PERF-01: Armstrong Dashboard Aggregation View**
**Impact**: 🟢 High — Eliminates 6 sequential queries  
**Risk**: 🟢 Low — Database-only change  
**Effort**: 2-3 hours  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// useArmstrongDashboard.ts: 6 separate queries
const { count: actions24h } = await supabase.select('*').gte('created_at', yesterday)
const { data: costs30d } = await supabase.select('cost').gte('created_at', last30)
const { data: errors } = await supabase.select('*').eq('status', 'error')
// ... 3 more queries
```

**Solution**:
```sql
-- Migration: Create aggregation view
CREATE VIEW v_armstrong_dashboard_kpis AS
SELECT 
  tenant_id,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as actions_24h,
  SUM(cost) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as costs_30d,
  -- ... other KPIs
FROM armstrong_actions
GROUP BY tenant_id;

-- Hook becomes: Single query
const { data } = await supabase.from('v_armstrong_dashboard_kpis').select('*').single()
```

**Files to Change**:
- `supabase/migrations/new_armstrong_dashboard_view.sql` (create)
- `src/hooks/armstrong/useArmstrongDashboard.ts` (update)

---

#### **PERF-02: Server-Side Pagination for Lists**
**Impact**: 🟢 High — Prevents browser freeze with 1000+ items  
**Risk**: 🟢 Low — Non-breaking API addition  
**Effort**: 4-5 hours  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// AkquiseDatenbank.tsx: Loads ALL offers
const { data: offersData } = useAcqOffers() // No limit!

// Client-side filter/sort on full dataset
const filtered = useMemo(() => {
  return offersData?.filter(...).sort(...) // O(n log n) on every keystroke
}, [offersData, searchTerm])
```

**Solution**:
```typescript
// Add pagination parameters
const { data, count } = useAcqOffers({ 
  page: 1, 
  perPage: 50,
  search: searchTerm,
  sortBy: 'created_at'
})

// Backend: .range((page-1) * perPage, page * perPage - 1)
```

**Files to Change**:
- `src/hooks/acquisition/useAcqOffers.ts` (add pagination params)
- `src/hooks/acquisition/useAcqContacts.ts` (add pagination params)
- `src/components/akquise/AkquiseDatenbank.tsx` (use pagination)
- `src/components/contacts/ContactList.tsx` (use pagination)

**Priority**: High (affects user experience with large datasets)

---

#### **PERF-03: Portfolio Summary Pagination**
**Impact**: 🟡 Medium — Prevents slowdown with 100+ properties  
**Risk**: 🟢 Low — Optional parameter  
**Effort**: 3-4 hours  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// PortfolioTab.tsx: Unbounded queries
.select(`units(*), leases(*), loans(*)`) // Can load 10,000+ rows
```

**Solution**:
```typescript
// Add limits and pagination
.select(`units(*), leases(*), loans(*)`)
.range(0, 99) // First 100 properties
.order('created_at', { ascending: false })
```

**Files to Change**:
- `src/components/portfolio/PortfolioTab.tsx`
- `src/hooks/portfolio/usePortfolioSummary.ts`

**Priority**: Medium (becomes critical with scale)

---

### Category 2: Security Hygiene (Foundational, Low-Risk)

#### **SEC-01: CORS Origin Restriction**
**Impact**: 🔴 CRITICAL — Prevents CSRF, unauthorized access  
**Risk**: 🟢 Low — Environment-based config  
**Effort**: 1-2 hours  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// ALL 109 edge functions:
'Access-Control-Allow-Origin': '*' // ← CRITICAL VULNERABILITY
```

**Solution**:
```typescript
// supabase/functions/_shared/cors.ts
const ALLOWED_ORIGINS = [
  'https://kaufy.io',
  'https://miety.de',
  'https://futureroom.de',
  'https://systemofatown.com',
  'http://localhost:5173', // Dev
]

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}
```

**Files to Change**:
- `supabase/functions/_shared/cors.ts` (create)
- Update all 109 function `index.ts` files to import and use

**Automation**:
```bash
# Script to update all functions
for dir in supabase/functions/*/; do
  sed -i "s/'Access-Control-Allow-Origin': '\*'/...getCorsHeaders(req)/" "$dir/index.ts"
done
```

**Priority**: CRITICAL (security vulnerability)

---

#### **SEC-02: Webhook Signature Validation**
**Impact**: 🔴 CRITICAL — Prevents webhook spoofing  
**Risk**: 🟢 Low — Adds validation layer  
**Effort**: 2 hours  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// sot-acq-inbound-webhook/index.ts
// TODO: Verify webhook signature ← NOT IMPLEMENTED
```

**Solution**:
```typescript
// supabase/functions/_shared/webhook-validation.ts
import { createHmac } from 'node:crypto'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  return signature === expectedSignature
}

// In webhook function:
const signature = req.headers.get('x-webhook-signature')
if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
  return new Response('Invalid signature', { status: 401 })
}
```

**Files to Change**:
- `supabase/functions/_shared/webhook-validation.ts` (create)
- `supabase/functions/sot-acq-inbound-webhook/index.ts`
- `supabase/functions/sot-renovation-inbound-webhook/index.ts`
- `supabase/functions/sot-whatsapp-webhook/index.ts`

**Priority**: CRITICAL (security vulnerability)

---

#### **SEC-03: Public Endpoint Input Validation**
**Impact**: 🟡 Medium — Prevents malformed data  
**Risk**: 🟢 Low — Early validation  
**Effort**: 3 hours  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// sot-public-project-intake: Accepts arbitrary JSON
const data = await req.json() // No validation
```

**Solution**:
```typescript
import { z } from 'zod'

const ProjectIntakeSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  contact_email: z.string().email(),
  // ... other fields
})

const data = await req.json()
const validated = ProjectIntakeSchema.parse(data) // Throws if invalid
```

**Files to Change**:
- `supabase/functions/sot-public-project-intake/index.ts`
- `supabase/functions/sot-futureroom-public-submit/index.ts`
- `supabase/functions/sot-website-lead-capture/index.ts`

**Priority**: Medium (data quality)

---

### Category 3: Architectural Guardrails (Prevents Future Issues)

#### **ARCH-01: ESLint Cross-Zone Import Rules**
**Impact**: 🟢 High — Prevents architectural erosion  
**Risk**: 🟢 Low — Static analysis only  
**Effort**: 1 hour  
**Blocks Development**: ❌ No (warning mode initially)

**Current Issue**: No enforcement of zone boundaries (1 violation already exists)

**Solution**:
```javascript
// eslint.config.js
import importPlugin from 'eslint-plugin-import'

export default [
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      'import/no-restricted-paths': ['warn', { // Start with 'warn'
        zones: [
          {
            target: './src/pages/admin',
            from: './src/pages/portal'
          },
          {
            target: './src/pages/admin',
            from: './src/pages/zone3'
          },
          {
            target: './src/pages/portal',
            from: './src/pages/admin'
          },
          {
            target: './src/pages/portal',
            from: './src/pages/zone3'
          },
          {
            target: './src/pages/zone3',
            from: './src/pages/admin'
          },
          {
            target: './src/pages/zone3',
            from: './src/pages/portal'
          }
        ]
      }]
    }
  }
]
```

**Files to Change**:
- `eslint.config.js` (update)
- `package.json` (add `eslint-plugin-import` if needed)

**Priority**: High (prevents future violations)

---

#### **ARCH-02: Fix Intra-Portal Violation**
**Impact**: 🟡 Low — Cleanup existing violation  
**Risk**: 🟢 Low — Simple extraction  
**Effort**: 30 minutes  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// src/pages/portal/stammdaten/AbrechnungTab.tsx
import { AktionsKatalog } from '@/pages/portal/communication-pro/agenten/AktionsKatalog'
import { KostenDashboard } from '@/pages/portal/communication-pro/agenten/KostenDashboard'
```

**Solution**:
```bash
# Move to shared
mv src/pages/portal/communication-pro/agenten/AktionsKatalog.tsx src/shared/armstrong/
mv src/pages/portal/communication-pro/agenten/KostenDashboard.tsx src/shared/armstrong/

# Update imports
import { AktionsKatalog } from '@/shared/armstrong/AktionsKatalog'
import { KostenDashboard } from '@/shared/armstrong/KostenDashboard'
```

**Files to Change**:
- Move 2 files to `src/shared/armstrong/`
- Update imports in `src/pages/portal/stammdaten/AbrechnungTab.tsx`

**Priority**: Low (cosmetic)

---

#### **ARCH-03: Remove Production Code Artifacts**
**Impact**: 🟡 Medium — Code cleanliness  
**Risk**: 🟢 Low — Cleanup only  
**Effort**: 1 hour  
**Blocks Development**: ❌ No

**Current Issue**:
- 29 `console.log()` statements
- 15 empty `catch {}` blocks

**Solution**:
```typescript
// Replace console.log with conditional logging
const isDev = import.meta.env.DEV
if (isDev) console.log('Debug info:', data)

// Fix empty catches
try {
  risky()
} catch (err) {
  console.error('Context:', err) // At minimum
}
```

**Files to Change**:
- `src/contexts/AuthContext.tsx` (3 console.logs)
- `src/hooks/armstrong/useArmstrongVoice.ts` (2 console.logs)
- `src/hooks/usePortalLayout.tsx` (3 console.logs)
- `src/components/futureroom/FutureRoomAkte.tsx` (empty catch)
- `src/components/communication/DictationButton.tsx` (empty catch)
- ... (29 total console.logs, 15 empty catches)

**Priority**: Medium (code hygiene)

---

### Category 4: Critical TypeScript Cleanup (Engines & Contracts Only)

#### **TS-01: NK Abrechnung Engine Types**
**Impact**: 🟡 Medium — Safer calculations  
**Risk**: 🟡 Medium — Touches calculation logic  
**Effort**: 3 hours  
**Blocks Development**: ⚠️ Maybe (if NK calculations evolving)

**Current Issue**:
```typescript
// nkAbrechnung engine has `any` types
function calculateUmlage(data: any): any { ... }
```

**Solution**:
```typescript
interface NKUmlageData {
  heizkosten: number
  warmwasser: number
  umlageschluessel: 'qm' | 'personen' | 'einheiten'
  einheiten: Array<{
    id: string
    flaeche_qm: number
    personen: number
  }>
}

interface NKUmlageResult {
  einheiten: Array<{
    einheit_id: string
    heizkosten_anteil: number
    warmwasser_anteil: number
    gesamt: number
  }>
  gesamt_heizkosten: number
  gesamt_warmwasser: number
}

function calculateUmlage(data: NKUmlageData): NKUmlageResult { ... }
```

**Files to Change**:
- `src/engines/nkAbrechnung/*.ts` (multiple engine files)

**Priority**: Medium (depends on calculation stability)  
**Recommendation**: ⏸️ **DEFER if NK calculations still evolving**

---

#### **TS-02: Finance Calculation Types**
**Impact**: 🟡 Medium — Contract accuracy  
**Risk**: 🟡 Medium — Touches finance logic  
**Effort**: 2 hours  
**Blocks Development**: ⚠️ Maybe (if Finance still evolving)

**Current Issue**:
```typescript
// useConsumerLoan.ts
const loanData: any = { ... }
```

**Solution**:
```typescript
interface ConsumerLoan {
  amount: number
  interestRate: number
  termYears: number
  monthlyPayment: number
  totalInterest: number
}
```

**Priority**: Medium  
**Recommendation**: ⏸️ **DEFER if Finance calculations not validated**

---

#### **TS-03: Contract Generator Types**
**Impact**: 🟢 High — Legal document safety  
**Risk**: 🟢 Low — Pure type additions  
**Effort**: 2 hours  
**Blocks Development**: ❌ No

**Current Issue**:
```typescript
// contractGenerator.ts
function generateContract(data: any): string { ... }
```

**Solution**:
```typescript
interface MandatContract {
  landlord: {
    name: string
    address: string
  }
  property: {
    address: string
    units: number
  }
  fees: {
    percentage: number
    minimum: number
  }
  term: {
    start: Date
    end?: Date
  }
}

function generateContract(data: MandatContract): string { ... }
```

**Files to Change**:
- `src/lib/contracts/contractGenerator.ts`
- `src/lib/contracts/generateLegalDocumentPdf.ts`

**Priority**: High (legal documents)  
**Recommendation**: ✅ **IMPLEMENT NOW** (low risk, high value)

---

## ⏸️ DEFER UNTIL FEATURE FREEZE

### Testing & Coverage
- ❌ Full test coverage (currently 4%)
- ❌ E2E test suites (Playwright)
- ❌ Component snapshot tests
- ❌ Integration test expansion
- **Reason**: Modules still evolving, calculations not validated

### TypeScript Strictness
- ❌ Activate `strict: true` globally
- ❌ Fix all 60+ `any` types
- ❌ Fix all 35+ `as any` casts
- **Reason**: Refactoring cost too high during active development

### Large Refactoring
- ❌ Module restructuring
- ❌ Database schema changes
- ❌ Major API refactors
- **Reason**: Would block ongoing development

### Payment & Auth
- ❌ Any payment layer work
- ❌ Any authentication changes
- **Reason**: Explicitly excluded

---

## Implementation Priority Matrix

```
     IMPACT
       ↑
  HIGH │ SEC-01 CORS     PERF-01 Armstrong  ARCH-01 ESLint
       │ SEC-02 Webhooks PERF-02 Pagination  TS-03 Contracts
       │
MEDIUM │ SEC-03 Input    PERF-03 Portfolio   ARCH-03 Cleanup
       │                                      
   LOW │                                      ARCH-02 Fix Violation
       │
       └──────────────────────────────────────────────────→ EFFORT
            1h            2-3h                 4-5h
```

---

## Recommended Implementation Order

### Week 1: Security Foundation (Critical)
1. **SEC-01**: CORS restriction (1-2h) — CRITICAL
2. **SEC-02**: Webhook validation (2h) — CRITICAL
3. **ARCH-01**: ESLint rules (1h) — Prevents future issues
4. **ARCH-03**: Console.log cleanup (1h) — Quick win

**Total**: 5-6 hours | **Impact**: Security hardened

---

### Week 2: Performance Wins (High Value)
5. **PERF-01**: Armstrong dashboard view (2-3h) — High impact
6. **PERF-02**: Server-side pagination (4-5h) — User experience
7. **TS-03**: Contract generator types (2h) — Legal safety

**Total**: 8-10 hours | **Impact**: 50-70% performance improvement

---

### Week 3: Polish & Optional (If Time)
8. **PERF-03**: Portfolio pagination (3-4h) — Optional
9. **SEC-03**: Input validation (3h) — Optional
10. **ARCH-02**: Fix violation (30m) — Cosmetic

**Total**: 6-7 hours | **Impact**: Nice-to-have

---

## Success Metrics

**Security**: ✅ No CORS allow-all, webhooks validated  
**Performance**: ✅ 50%+ faster dashboards, no browser freeze  
**Architecture**: ✅ ESLint enforcing boundaries  
**Development Velocity**: ✅ No blocking changes

---

## What This Plan AVOIDS

- ❌ Test coverage mandates
- ❌ TypeScript strict enforcement everywhere
- ❌ Refactoring evolving modules
- ❌ Large architectural changes
- ❌ Payment/Auth work
- ❌ Feature development blocking

---

## Files to Change Summary

**Performance** (3 tasks):
- 2 migrations (Armstrong view)
- 6 hook files (pagination)
- 4 component files (pagination usage)

**Security** (3 tasks):
- 1 shared CORS helper
- 109 edge function updates (scriptable)
- 1 webhook validation helper
- 3 webhook functions
- 3 public endpoint validations

**Architecture** (3 tasks):
- 1 ESLint config
- 2 file moves (shared extraction)
- ~50 file cleanups (console.log, empty catches)

**TypeScript** (1 task):
- 2 contract generator files

**Total**: ~180 files | **Mostly Scriptable**: Yes (CORS updates)

---

## Automation Scripts

```bash
# 1. CORS Update (bulk)
./scripts/update-cors-headers.sh

# 2. Console.log Finder
grep -r "console.log" src/ --exclude-dir=node_modules

# 3. Empty Catch Finder
grep -A1 "catch.*{" src/ | grep "^--$"
```

---

**Next Steps**: Implement Week 1 (Security Foundation) first, then assess ongoing development needs before Week 2.
