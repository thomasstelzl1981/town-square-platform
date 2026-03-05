

# MOD-12 Akquise-Manager — KI-Upgrade + Logo-Fix

## Freeze Status
- **MOD-12**: UNFROZEN per user instruction
- **INFRA-edge_functions**: UNFROZEN per user instruction
- **No refreeze** after implementation

---

## Changes (5 Files)

### 1. `supabase/functions/sot-acq-profile-extract/index.ts` — KI-Upgrade
- Read `clientName` and `steeringParams` from request body (currently only `freeText` is read)
- Build a structured steering block from params (region, assetFocus, priceMin/Max, yieldTarget, exclusions) and inject it into the user message as "VERBINDLICHE LEITPARAMETER" that override freetext interpretation
- Replace the 2-line system prompt with a professional prompt that instructs the AI to act as a Senior-Immobilienberater with 20+ years experience, producing 4-6 sentence `profile_text_long` in broker-quality German, including a quality example
- Keep model as `google/gemini-2.5-pro` (full power for Zone 2 engine calls)

### 2. `src/components/akquise/AcqProfilePreview.tsx` — Logo Fix
- Remove `import logoLight from '@/assets/logos/armstrong_logo_light.png'`
- Remove fallback `const logo = logoUrl || logoLight` — if no `logoUrl`, show no logo (empty space preserved)
- Add `companyName` prop, use in footer instead of hardcoded "Armstrong Advisory · Vertraulich"
- Footer shows `{companyName} · Vertraulich` or just `Vertraulich` if no company name

### 3. `src/components/akquise/acqPdfExport.ts` — Logo Fix
- Remove `import logoLight from '@/assets/logos/armstrong_logo_light.png'`
- Add `AcqPdfOptions` interface with `logoUrl?: string` and `companyName?: string`
- Accept options parameter; if `logoUrl` provided, fetch image and convert to base64 for jsPDF; if not, skip logo entirely
- Footer: use `companyName` or just "Vertraulich"

### 4. `src/pages/portal/akquise-manager/components/ProfilePreviewSection.tsx`
- Add `logoUrl` and `companyName` props to the component interface
- Pass them through to `<AcqProfilePreview logoUrl={logoUrl} companyName={companyName} />`

### 5. `src/pages/portal/akquise-manager/AkquiseMandate.tsx`
- Add a `useQuery` to fetch the current user's profile (`profiles` table) for `letterhead_logo_url` and `company_name`
- Resolve `letterhead_logo_url` via `resolveStorageSignedUrl` from `@/lib/storage-url`
- Pass `logoUrl` and `companyName` to `ProfilePreviewSection` and to `generateAcqPdf` options
- Update `generateAcqPdf` call to include `{ logoUrl, companyName }` as 4th argument

---

## Technical Notes
- Signed URL resolution uses existing `resolveStorageSignedUrl` from `src/lib/storage-url.ts`
- Follows tenant branding isolation standard: no Armstrong fallback, no logo = no logo displayed
- Edge function prompt upgrade produces professional broker-quality German text suitable for direct client/partner communication

