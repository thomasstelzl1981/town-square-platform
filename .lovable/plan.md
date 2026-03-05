

# Landing Page = Primary Sales Channel — Feature Parity Plan

## Status Quo

The Project Landing Page already has **most** Kaufy features integrated:

| Feature | Kaufy | Landing Page | Status |
|---|---|---|---|
| InvestmentExposeView (40-year projection) | ✅ | ✅ | Done |
| Calculator on overview page | ✅ | ✅ | Done |
| Unit detail page with full Exposé | ✅ | ✅ | Done |
| KaufyFinanceRequestSheet (KDF-Check + Selbstauskunft) | ✅ | ✅ | Done |
| Submit → sot-futureroom-public-submit → Zone 1 | ✅ | ✅ | Done |
| Lead capture → Zone 1 pool | ✅ | ✅ | Done (sot-project-landing-lead) |
| **Document downloads on Exposé** | ✅ | ❌ `showDocuments=false` | **Gap** |
| **SLC inquiry tracking** | ✅ | ⚠️ Silent fail (no listing in SLC) | **Gap** |
| **Unit row navigation** | React Router | `window.location.href` (full reload) | **Minor gap** |
| **"Finanzierung beantragen" from unit table** | N/A (single listing) | Missing CTA column | **Enhancement** |
| **Finance source attribution** | `zone3_kaufy_expose` | Same source string | **Gap** (needs distinct source) |

## Implementation Plan

### 1. Enable Document Visibility on Exposé
**File:** `ProjectLandingExpose.tsx`
- Change `showDocuments={false}` to `showDocuments={true}`
- This uses the existing InvestmentExposeView document tab which reads from `document_links` (already covered by the public RLS policies we added)

### 2. Distinct Source Attribution
**File:** `ProjectLandingExpose.tsx`
- The KaufyFinanceRequestSheet submits with `source: 'zone3_kaufy_expose'` hardcoded inside the sheet
- Need to either: add a `source` prop to KaufyFinanceRequestSheet, or create a wrapper that overrides the source
- Target source: `zone3_project_landing` so Zone 1 can distinguish Kaufy marketplace leads from project landing page leads
- This is critical for ROI tracking of social media campaigns

### 3. Fix Unit Row Navigation (UX)
**File:** `ProjectLandingHome.tsx` line 565
- Replace `window.location.href` with React Router `useNavigate` for SPA navigation (no full page reload)
- Faster transition, preserves scroll state

### 4. Add "Finanzierung" Quick-Action in Unit Table
**File:** `ProjectLandingHome.tsx`
- Add a small CTA button/icon in each unit row that directly opens the finance request for that specific unit
- Alternatively: add a dedicated column "Aktion" with a small "Anfragen" button
- This eliminates the need to first click into the Exposé just to request financing

### 5. SLC Event Recording for Project Units
**File:** `KaufyFinanceRequestSheet.tsx` or new adapter
- Currently `recordInquiryForListing` expects a `listingId` from the `listings` table
- For project units, there's no listing record — the call silently fails
- Fix: Make the SLC recording conditional (skip if source is `zone3_project_landing`) OR create a parallel `recordInquiryForProject` function that logs into `sales_lifecycle_events` with entity_type `project_unit`
- This ensures Zone 1 has full visibility of all inquiries

### 6. Source Prop on KaufyFinanceRequestSheet
**File:** `src/components/zone3/KaufyFinanceRequestSheet.tsx`
- Add optional `source?: string` prop (default: `'zone3_kaufy_expose'`)
- Pass `source` into the payload instead of hardcoded value
- ProjectLandingExpose passes `source="zone3_project_landing"`
- Kaufy2026Expose keeps default

## No Database Changes Required
All necessary RLS policies are already in place from the previous migration.

## Freeze Check
- `src/components/zone3/KaufyFinanceRequestSheet.tsx` — Not in any freeze file
- `src/pages/zone3/project-landing/*` — Not frozen
- No engine changes needed (ENG-INVEST is used as-is)

## Priority Order
1. Source attribution (critical for business analytics)
2. Enable documents on Exposé (1 line change)
3. Fix navigation to SPA routing (UX)
4. Quick-action financing from unit table (conversion optimization)
5. SLC event recording (data completeness)

