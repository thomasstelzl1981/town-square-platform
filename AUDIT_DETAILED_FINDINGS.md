# DETAILED FINDINGS CATALOG - System Audit

**Created**: 2026-02-06  
**Audit Type**: READ-ONLY Analysis  
**Scope**: Zone 1 + Zone 2 MOD 1-11

---

## 📊 FINDINGS TABLE

| ID | Category | Priority | Type | Evidenz | Impact | Maßnahme |
|----|----------|----------|------|---------|--------|----------|
| **F001** | Routing | **P0** | Bug | `ManifestRouter.tsx:206-211`<br>`routesManifest.ts:114-118` | Admin Desk navigation → 404 errors | Import `AgentsDashboard`, `AgentsCatalog`, `AgentsInstances`, `AgentsRuns`, `AgentsPolicies` components |
| **F002** | Routing | **P0** | Bug | `ManifestRouter.tsx:200-201`<br>`routesManifest.ts:108,112` | FutureRoom sub-navigation broken | Create `FutureRoomInbox.tsx` and `FutureRoomMonitoring.tsx` components |
| **F003** | Routing | **P1** | WIP | `routesManifest.ts:265-440`<br>MOD-08 to MOD-20 | Users see empty placeholder pages | Implement 27 missing tile tab components for modules 8-11 |
| **F004** | Routing | **P2** | Compliance | `routesManifest.ts:511-535` | Double navigation overhead (redirect + load) | Create migration plan to remove 13 legacy redirects |
| **F005** | Routing | **P2** | Improvement | No `/tests/e2e/` directory | Routing changes cause regressions | Add Playwright test suite for critical routes |
| **F006** | Zonen | **P0** | ✅ Compliance | All zone boundaries verified | NONE - Architecture is clean | Maintain current isolation practices |
| **F007** | Modulgrenzen | **P0** | ✅ Compliance | All MOD 1-11 checked | NONE - No cross-module imports | Maintain current module boundaries |
| **F008** | Daten/SSOT | **P1** | WIP/Needs Confirmation | No `/supabase/policies/` docs | Cannot verify RLS implementation | Document all RLS policies in repo |
| **F009** | Daten/SSOT | **P2** | Improvement | `landlord_contexts` usage in:<br>- `immobilien/KontexteTab.tsx`<br>- `office/BriefTab.tsx` | Unclear if contexts are org-grouping or tenant-separation | Add context model documentation |
| **F010** | Daten/SSOT | **P2** | Improvement | No ER diagram | Team unclear on relationships | Create ERD for core 30 tables |
| **F011** | Security | **P0** | Needs Confirmation | Supabase RLS not in codebase | Potential cross-tenant data leaks | Audit ALL Supabase RLS policies |
| **F012** | Security | **P1** | Compliance | `routesManifest.ts:requiresRole`<br>`AuthContext.tsx:isPlatformAdmin` | Admin routes protected client-side only | Verify Supabase RLS enforces role server-side |
| **F013** | Security | **P2** | Improvement | `audit_events` table usage minimal | Limited compliance evidence | Enhance audit logging for all admin actions |
| **F014** | Build | **P1** | Quality | Lint output shows 35+ files:<br>- `TestDataManager.tsx:559`<br>- `FinanceRequestDetail.tsx:61,146,161`<br>- `ObjectSelector.tsx:31,32,33` | Type-safety weakness, runtime errors | Replace `any` with proper TypeScript types |
| **F015** | Build | **P1** | Quality | `npm audit` output:<br>16 vulnerabilities<br>11 moderate, 5 high | Security vulnerabilities in production | Run `npm audit fix` + manual review |
| **F016** | Build | **P2** | Improvement | Both files present:<br>- `bun.lockb`<br>- `package-lock.json` | Lock file conflicts possible | Standardize on npm OR bun |
| **F017** | Build | **P2** | Improvement | No `.github/workflows/` folder | Manual deployments, no automated tests | Setup GitHub Actions CI/CD |
| **F018** | Performance | **P1** | Improvement | `PortfolioTab.tsx:142-250`<br>Query loads all units | Slow load with 100+ properties | Add pagination: `LIMIT 50 OFFSET n` |
| **F019** | Performance | **P1** | Improvement | `PortfolioTab.tsx`:<br>- Query 1: landlord_contexts<br>- Query 2: context_assignments<br>- Query 3: units<br>- Query 4: leases<br>- Query 5: financing | 4-5 DB roundtrips per page load | Create aggregated Postgres view |
| **F020** | Performance | **P2** | Improvement | `ManifestRouter.tsx` imports all:<br>- 39 admin pages<br>- 54 portal pages | Large initial JS bundle | Implement React.lazy() per module |
| **F021** | Performance | **P2** | Improvement | Multiple queries for same data:<br>Properties queried in Portfolio, Immobilien, Verkauf | Redundant API calls | Review React Query staleTime/cacheTime |
| **F022** | Cleanup | **P2** | Improvement | `/src/pages/portfolio/`<br>- `PropertyDetail.tsx`<br>- `PropertyList.tsx` | Code duplication, confusion | Delete after migration to `/portal/immobilien` complete |
| **F023** | Cleanup | **P2** | Improvement | `PropertyDetail.tsx:1`<br>Has `@deprecated` comment | Legacy code warning present | Complete migration, then delete file |
| **F024** | Cleanup | **P3** | Improvement | `package.json` lists 700 packages | Potential bundle bloat | Audit + remove unused dependencies |
| **F025** | Delivery | **P0** | WIP | No E2E test framework | No smoke tests for releases | Setup Playwright + 10 critical path tests |
| **F026** | Delivery | **P1** | WIP | No component docs | Slow developer onboarding | Create Storybook or component catalog |
| **F027** | Delivery | **P1** | Improvement | No route documentation | Hard to navigate 174 routes | Generate route-to-component matrix |
| **F028** | Delivery | **P2** | Improvement | No SSOT documentation | Unclear data ownership | Document which table owns which entity |
| **F029** | Delivery | **P2** | Improvement | Module % not tracked | Unclear project status | Create module readiness dashboard |
| **F030** | Delivery | **P3** | Improvement | No deployment docs | Risky releases | Document deployment checklist |

---

## 📁 ADDITIONAL DETAIL PER FINDING

### F001: Missing Admin Desk Components (CRITICAL)

**Full Details:**
- **Routes Declared**: Lines 114-129 in `routesManifest.ts`
  - `/admin/agents` (5 sub-routes)
  - `/admin/acquiary` (4 sub-routes)  
  - `/admin/sales-desk` (3 sub-routes)

- **Component Map Missing**: Lines 178-203 in `ManifestRouter.tsx`
  - `adminComponentMap` does not include: `AgentsDashboard`, `AcquiaryDashboard`, `SalesDeskDashboard`
  - Sub-components also missing: `AgentsCatalog`, `AcquiaryZuordnung`, etc.

- **Impact**: When admin clicks these menu items → white screen, console error

- **Fix Steps**:
  1. Create component files in `/pages/admin/agents/`, `/admin/acquiary/`, `/admin/desks/`
  2. Import in `ManifestRouter.tsx` lines 25-50
  3. Add to `adminComponentMap` object lines 178-203
  4. Add to `adminDeskMap` if using desk sub-routing lines 206-211

---

### F018: Portfolio Pagination Missing

**Full Details:**
- **Current Code**: `PortfolioTab.tsx` lines 142-250
  ```typescript
  const { data: unitsWithProperties, isLoading } = useQuery({
    queryKey: ['portfolio-units-annual', activeOrganization?.id],
    queryFn: async () => {
      const { data: units } = await supabase
        .from('units')
        .select(...)  // NO LIMIT!
        .eq('tenant_id', activeOrganization!.id);
      // ... returns ALL units
    }
  });
  ```

- **Problem**: With 100 properties → slow query, slow rendering

- **Fix Pattern**:
  ```typescript
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-units', activeOrganization?.id, page],
    queryFn: async () => {
      const start = (page - 1) * ITEMS_PER_PAGE;
      const { data, count } = await supabase
        .from('units')
        .select('*', { count: 'exact' })
        .range(start, start + ITEMS_PER_PAGE - 1)
        .eq('tenant_id', activeOrganization!.id);
      return { units: data, totalCount: count };
    }
  });
  ```

- **UI Addition**: Add `<Pagination>` component from Shadcn

---

### F011: RLS Policy Verification

**Context:**
- Supabase uses Row Level Security (RLS) for multi-tenant isolation
- Policies are created in Supabase Dashboard OR via migrations
- No `/supabase/migrations/` folder found in repo

**Security Risk:**
- Cannot verify if RLS policies exist for all tables
- Cannot verify if policies correctly filter by `tenant_id`
- Potential for cross-tenant data access

**Verification Steps Needed:**
1. Document ALL RLS policies in `/supabase/policies/README.md`
2. For each table, document:
   - SELECT policy (who can read)
   - INSERT policy (who can write)
   - UPDATE policy (who can modify)
   - DELETE policy (who can delete)
3. Verify tenant_id is in WHERE clause for all policies
4. Test with multiple tenants to ensure isolation

**Example Documentation Format:**
```markdown
## Table: properties

### SELECT Policy
- Name: `tenant_isolation_select`
- Rule: `tenant_id = auth.uid() OR EXISTS(...)`
- Purpose: Users see only their tenant's properties

### INSERT Policy
- Name: `tenant_isolation_insert`
- Rule: `tenant_id = auth.uid()`
- Purpose: Users can only create properties for their tenant
```

---

## 🔄 PRIORITY MATRIX

### P0 (Week 1 - Critical):
- F001, F002 (Routing 404s)
- F011 (RLS Verification)
- F025 (E2E Tests)

### P1 (Weeks 2-3 - High):
- F003 (Stub Implementations)
- F008 (RLS Documentation)
- F012 (Security Verification)
- F014 (TypeScript any)
- F015 (npm vulnerabilities)
- F018, F019 (Performance)

### P2 (Week 4-5 - Medium):
- F004 (Legacy Redirects)
- F005 (Route Tests)
- F013 (Audit Enhancement)
- F020, F021 (Performance Optimization)
- F022, F023 (Cleanup)
- F027, F028 (Documentation)

### P3 (Future - Nice-to-have):
- F024 (Dependency Audit)
- F029 (Dashboard)
- F030 (Deployment Docs)

---

**STATUS LEGEND:**
- 🔴 P0 = Critical (Blocks production)
- 🟠 P1 = High (Should fix soon)
- 🟡 P2 = Medium (Can wait)
- 🟢 P3 = Low (Nice to have)
- ✅ = Verified OK (No action needed)

