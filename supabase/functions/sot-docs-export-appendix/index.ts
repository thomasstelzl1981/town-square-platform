import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// APPENDIX PACKAGE: Architecture, Diagrams, Catalogs
// ============================================================================

const API_NUMBERING_CATALOG = `# API NUMBERING CATALOG

**Version:** v1.1  
**Datum:** 2026-01-27

---

## Nummernkreise

| Range | Bereich | Status |
|-------|---------|--------|
| API-001..099 | Backbone (Auth, Profiles, Core) | RESERVED |
| API-100..199 | Zone 1 (Admin) | SPEC |
| API-200..299 | MOD-06 Verkauf | SPEC |
| API-300..399 | MOD-09 Vertriebspartner | SPEC |
| API-400..499 | MOD-08 Investment-Suche | SPEC |
| API-500..599 | MOD-10 Leadgenerierung | SPEC |
| API-600..699 | MOD-07 Finanzierung | SPEC |
| API-700..799 | MOD-04 Immobilien | SPEC |
| API-800..899 | MOD-05 MSV | SPEC |
| INTERNAL-001..099 | Interne Edge Functions | ACTIVE |

---

## Edge Functions (Implementiert)

| API-ID | Edge Function | Modul | Status |
|--------|---------------|-------|--------|
| API-701 | sot-property-crud | MOD-04 | ACTIVE |
| API-801 | sot-msv-reminder-check | MOD-05 | ACTIVE |
| API-802 | sot-msv-rent-report | MOD-05 | ACTIVE |
| API-803 | sot-listing-publish | MOD-05 | ACTIVE |
| INTERNAL-001 | sot-letter-generate | MOD-02 | ACTIVE |
| INTERNAL-002 | sot-expose-description | MOD-04 | ACTIVE |
| INTERNAL-003 | sot-dms-upload-url | MOD-03 | ACTIVE |
| INTERNAL-004 | sot-dms-download-url | MOD-03 | ACTIVE |
| INTERNAL-005 | sot-investment-engine | MOD-08 | ACTIVE |
| INTERNAL-006 | sot-armstrong-advisor | MOD-02 | ACTIVE |
| INTERNAL-007 | sot-document-parser | MOD-03 | ACTIVE |
`;

const CONSENT_AUDIT_CATALOG = `# CONSENT & AUDIT CATALOG

**Version:** v1.0

---

## Consent Gates

| Code | Modul | Description |
|------|-------|-------------|
| SALES_MANDATE | MOD-06 | Verkaufsmandat |
| SCOUT24_CREDITS | MOD-06 | Credit-Verbrauch |
| PARTNER_RELEASE | MOD-06 | Partnerfreigabe |
| SYSTEM_SUCCESS_FEE_2000 | MOD-06 | €2.000 Erfolgsgebühr |
| COMMISSION_AGREEMENT | MOD-09 | Provisionsvereinbarung |
| FINANCING_SUBMISSION_ACK | MOD-07 | Datenweitergabe |
| MSV_AGREEMENT | MOD-05 | MSV Premium Vertrag |

---

## Audit Events

| Event Type | Modul | Trigger |
|------------|-------|---------|
| user.login | Auth | Login |
| consent.accepted | Backbone | Consent Given |
| listing.created | MOD-06 | Create Listing |
| listing.published | MOD-06 | Publish |
| lead.captured | MOD-10 | Raw Lead |
| financing.case_created | MOD-07 | New Case |
| document.uploaded | MOD-03 | Upload |
`;

const DATA_MODEL_CATALOG = `# DATA MODEL CATALOG

**Version:** v1.0

---

## Core Tables

| Table | Status | Module |
|-------|--------|--------|
| profiles | EXISTS | Backbone |
| organizations | EXISTS | Backbone |
| memberships | EXISTS | Backbone |
| contacts | EXISTS | Backbone |
| documents | EXISTS | MOD-03 |
| properties | EXISTS | MOD-04 |
| units | EXISTS | MOD-04 |
| leases | EXISTS | MOD-05 |
| loans | EXISTS | MOD-04 |
| finance_requests | EXISTS | MOD-07 |
| applicant_profiles | EXISTS | MOD-07 |
| finance_mandates | EXISTS | MOD-11 |
| listings | PLANNED | MOD-06 |
| leads | PLANNED | MOD-10 |

---

## RLS Pattern

All tables use tenant_id scoping:
\`\`\`sql
CREATE POLICY "tenant_isolation" ON public.{table}
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  )
);
\`\`\`
`;

const SYSTEM_DIAGRAM = `# SYSTEM DIAGRAM

\`\`\`mermaid
graph TB
    subgraph Zone3["Zone 3: Marketing Websites"]
        K[Kaufy]
        M[Miety]
        S[SoT Website]
        F[FutureRoom]
    end
    
    subgraph Zone2["Zone 2: User Portal"]
        MOD01[MOD-01 Stammdaten]
        MOD02[MOD-02 KI Office]
        MOD03[MOD-03 DMS]
        MOD04[MOD-04 Immobilien]
        MOD05[MOD-05 MSV]
        MOD06[MOD-06 Verkauf]
        MOD07[MOD-07 Finanzierung]
        MOD11[MOD-11 Finanzierungsmanager]
    end
    
    subgraph Zone1["Zone 1: Admin Portal"]
        DASH[Dashboard]
        ORGS[Organizations]
        DESK[Operative Desks]
        FR[FutureRoom Inbox]
    end
    
    subgraph Backend["Supabase Backend"]
        DB[(PostgreSQL)]
        AUTH[Auth]
        STORAGE[Storage]
        EDGE[Edge Functions]
    end
    
    Zone3 --> Zone2
    Zone2 --> Backend
    Zone1 --> Backend
    Zone1 --> Zone2
    
    MOD07 --> FR
    FR --> MOD11
\`\`\`
`;

const FLOW_PACK = `# FLOW PACK

## Finance Flow (MOD-07 → Zone 1 → MOD-11)

\`\`\`mermaid
sequenceDiagram
    participant C as Client (MOD-07)
    participant Z1 as Zone 1 FutureRoom
    participant FM as Finance Manager (MOD-11)
    participant B as Bank
    
    C->>C: Fill Selbstauskunft
    C->>C: Upload Documents
    C->>Z1: Submit Request
    Z1->>Z1: Review & Prioritize
    Z1->>FM: Assign Mandate
    FM->>FM: Accept Mandate
    FM->>FM: Prepare Package
    FM->>B: Submit to Bank
    B-->>FM: Response
    FM-->>C: Status Update
\`\`\`

## Sales Flow (MOD-04 → MOD-06 → Partner)

\`\`\`mermaid
stateDiagram-v2
    [*] --> draft
    draft --> active: Activate Listing
    active --> reserved: Reservation
    active --> withdrawn: Withdraw
    reserved --> sold: Complete Sale
    reserved --> active: Cancel Reservation
    sold --> [*]
    withdrawn --> [*]
\`\`\`
`;

const ZONE3_MASTER_CONCEPT = `# ZONE 3 — MASTER CONCEPT

**Status:** FROZEN

---

## Brand-Map

| Brand | Domain | Zielgruppe |
|-------|--------|------------|
| KAUFY | kaufy.app | Kapitalanleger, Vertrieb |
| System of a Town | systemofatown.app | Vermieter, Portfoliohalter |
| MIETY | miety.app | Mieter |

---

## Design-Prinzipien

- Light Mode (alle Brands)
- max-w-[1400px] Container
- rounded-3xl Cards
- 8px Grid-System

---

## Entry-Mechanik

- "Portal öffnen" → /portal
- "Registrieren" → /auth?mode=register
- "Anmelden" → /auth?mode=login
`;

const ROUTES_MANIFEST_SUMMARY = `# Routes Manifest Summary

**SSOT:** src/manifests/routesManifest.ts

---

## Zone 1 Admin Routes (40 total)

| Path | Title |
|------|-------|
| /admin | Dashboard |
| /admin/organizations | Organisationen |
| /admin/users | Benutzer |
| /admin/futureroom | FutureRoom |
| /admin/futureroom/inbox | Inbox |
| /admin/futureroom/zuweisung | Zuweisung |

---

## Zone 2 Modules (20 modules, 82 tiles)

All modules follow 4-tile pattern except MOD-20 (6 tiles)

---

## Zone 3 Websites

| Site | Routes |
|------|--------|
| /kaufy | 13 routes |
| /miety | 9 routes |
| /sot | 7 routes |
| /futureroom | 4 routes |

---

## Legacy Redirects (7 total)

| From | To |
|------|-----|
| /portfolio | /portal/immobilien/portfolio |
| /portfolio/:id | /portal/immobilien/:id |
`;

const AUDIT_PASS = `# AUDIT PASS — FREEZE MARKER

**Date:** 2026-02-02  
**Status:** ✅ PASS

---

## Confirmation

- All 20 modules exist in routesManifest.ts: ✅
- All 20 modules exist in tile_catalog: ✅
- Zone 1 Admin routes complete: ✅
- Zone 3 Website routes complete: ✅
- Legacy redirects param-safe: ✅

---

## Module Inventory

20 Modules (MOD-01 to MOD-20)
82 Tiles (80 standard + 2 extra for Miety)
40 Zone 1 Routes
33 Zone 3 Routes
7 Legacy Redirects

---

*This is the baseline for all further development.*
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting APPENDIX package generation...');
    
    const zip = new JSZip();
    
    // Architecture docs
    zip.file('docs/architecture/API_NUMBERING_CATALOG.md', API_NUMBERING_CATALOG);
    zip.file('docs/architecture/CONSENT_AUDIT_CATALOG.md', CONSENT_AUDIT_CATALOG);
    zip.file('docs/architecture/DATA_MODEL_CATALOG.md', DATA_MODEL_CATALOG);
    
    // Diagrams
    zip.file('diagrams/SYSTEM_DIAGRAM.md', SYSTEM_DIAGRAM);
    zip.file('diagrams/FLOW_PACK.md', FLOW_PACK);
    
    // Zone 3
    zip.file('docs/zone3/ZONE3_MASTER_CONCEPT.md', ZONE3_MASTER_CONCEPT);
    
    // Manifests summary
    zip.file('manifests/ROUTES_MANIFEST_SUMMARY.md', ROUTES_MANIFEST_SUMMARY);
    
    // Audit
    zip.file('appendix/AUDIT_PASS_2026-02-02.md', AUDIT_PASS);
    
    const zipContent = await zip.generateAsync({ type: 'base64' });
    
    console.log('APPENDIX package generated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        package: 'appendix',
        zipBase64: zipContent,
        files: [
          'docs/architecture/API_NUMBERING_CATALOG.md',
          'docs/architecture/CONSENT_AUDIT_CATALOG.md',
          'docs/architecture/DATA_MODEL_CATALOG.md',
          'diagrams/SYSTEM_DIAGRAM.md',
          'diagrams/FLOW_PACK.md',
          'docs/zone3/ZONE3_MASTER_CONCEPT.md',
          'manifests/ROUTES_MANIFEST_SUMMARY.md',
          'appendix/AUDIT_PASS_2026-02-02.md'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error generating APPENDIX package:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
