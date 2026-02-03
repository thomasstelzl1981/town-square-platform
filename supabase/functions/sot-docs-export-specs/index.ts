import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SPECS PACKAGE: Frozen Specs, Platform Specs, Module Contracts
// ============================================================================

const SOFTWARE_FOUNDATION_MD = `# SOFTWARE FOUNDATION

**Version:** 1.0.0  
**Status:** FROZEN  
**Last Updated:** 2026-02-02

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Build Tool | Vite | 5.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | Latest |
| Backend | Supabase | Cloud |
| Database | PostgreSQL | 15.x |
| Auth | Supabase Auth | Integrated |
| Storage | Supabase Storage | Integrated |
| Edge Functions | Deno | 1.x |

---

## Architecture Principles

1. **Manifest-Driven UI:** Routes and navigation are defined in \`routesManifest.ts\`
2. **Row-Level Security:** All tables use RLS with tenant_id scoping
3. **Contract-First APIs:** Edge functions follow defined API contracts
4. **Single Source of Truth:** One canonical location for each data type

---

## Folder Structure

\`\`\`
src/
├── components/           # Shared UI components
├── pages/
│   ├── admin/           # Zone 1 pages
│   ├── portal/          # Zone 2 pages
│   └── zone3/           # Zone 3 pages
├── hooks/               # Custom React hooks
├── manifests/           # Route definitions
├── integrations/        # Supabase client
└── types/               # TypeScript types

supabase/
├── functions/           # Edge functions
└── migrations/          # Database migrations

spec/
└── current/             # Frozen specifications
\`\`\`

---

*This document is FROZEN and should not be modified without formal review.*
`;

const MODULE_BLUEPRINT_MD = `# MODULE BLUEPRINT

**Version:** 1.0.0  
**Status:** FROZEN  
**Last Updated:** 2026-02-02

---

## Module Structure Pattern

Every Zone 2 module follows the standardized 4-Tile Pattern:

\`\`\`
/portal/{module}/
├── how-it-works (default)  # Landing/explanation page
├── tile-1                  # Primary functional tile
├── tile-2                  # Secondary functional tile
└── settings                # Configuration tile
\`\`\`

**Exception:** MOD-20 (Miety) has 6 tiles due to renter-specific requirements.

---

## Module Registry

| Code | Name | Base Path | Org-Types |
|------|------|-----------|-----------|
| MOD-01 | Stammdaten | /portal/stammdaten | all |
| MOD-02 | KI Office | /portal/office | all |
| MOD-03 | DMS | /portal/dms | all |
| MOD-04 | Immobilien | /portal/immobilien | client |
| MOD-05 | MSV | /portal/msv | client |
| MOD-06 | Verkauf | /portal/verkauf | client |
| MOD-07 | Finanzierung | /portal/finanzierung | client |
| MOD-08 | Investments | /portal/investments | client |
| MOD-09 | Vertriebspartner | /portal/vertriebspartner | partner |
| MOD-10 | Leads | /portal/leads | partner |
| MOD-11 | Finanzierungsmanager | /portal/finanzierungsmanager | partner |
| MOD-12 | Akquise-Manager | /portal/akquise-manager | partner |
| MOD-13 | Projekte | /portal/projekte | all |
| MOD-14 | Communication Pro | /portal/communication-pro | partner |
| MOD-15 | Fortbildung | /portal/fortbildung | partner |
| MOD-16 | Services | /portal/services | all |
| MOD-17 | Car-Management | /portal/cars | partner |
| MOD-18 | Finanzanalyse | /portal/finanzanalyse | client |
| MOD-19 | Photovoltaik | /portal/photovoltaik | client |
| MOD-20 | Miety | /portal/miety | renter |

---

## Navigation Groups

| Group | Modules | Purpose |
|-------|---------|---------|
| Foundation | MOD-01, MOD-02, MOD-03 | Core infrastructure |
| Backbone | MOD-04, MOD-05 | Property management |
| Sales | MOD-06, MOD-09 | Sales pipeline |
| Finance | MOD-07, MOD-08, MOD-11 | Financing workflow |
| Partner | MOD-10, MOD-12, MOD-14, MOD-15 | Partner operations |
| Services | MOD-13, MOD-16, MOD-17, MOD-18, MOD-19 | Add-ons |
| Renter | MOD-20 | Tenant self-service |

---

*This document is FROZEN and should not be modified without formal review.*
`;

const DEVELOPMENT_GOVERNANCE_MD = `# DEVELOPMENT GOVERNANCE

**Version:** 1.0.0  
**Status:** FROZEN  
**Last Updated:** 2026-02-02

---

## Core Principles

1. **Spec-First Development:** No code without approved specification
2. **Manifest as SSOT:** \`routesManifest.ts\` is the single source of truth for routing
3. **RLS by Default:** All database tables must have Row-Level Security
4. **Audit Trail:** Critical actions must be logged to \`audit_events\`
5. **Edge Function Naming:** \`sot-{module}-{action}\` pattern

---

## Change Process

\`\`\`mermaid
graph TD
    A[Change Request] --> B{Spec Exists?}
    B -->|No| C[Create Spec]
    B -->|Yes| D[Update Spec]
    C --> E[Review]
    D --> E
    E -->|Approved| F[Implement]
    E -->|Rejected| A
    F --> G[Test]
    G --> H[Deploy]
\`\`\`

---

## File Ownership

| File/Folder | Owner | Change Process |
|-------------|-------|----------------|
| \`routesManifest.ts\` | Platform Lead | Requires spec update |
| \`supabase/migrations/\` | Database Lead | Migration review required |
| \`supabase/functions/\` | Backend Lead | API contract required |
| \`src/pages/admin/\` | Platform Lead | Zone 1 spec required |
| \`src/pages/portal/\` | Module Owner | Module spec required |

---

## Code Review Checklist

- [ ] Follows manifest-driven routing
- [ ] RLS policies implemented
- [ ] TypeScript types defined
- [ ] Console errors resolved
- [ ] Mobile-responsive design
- [ ] Error states handled

---

*This document is FROZEN and should not be modified without formal review.*
`;

const ACCESS_MATRIX_MD = `# ACCESS MATRIX

**Version:** 1.0.0  
**Status:** FROZEN

---

## Role Definitions

| Role | Description | Zone Access |
|------|-------------|-------------|
| \`platform_admin\` | System of a Town staff | Zone 1, 2, 3 |
| \`org_admin\` | Organization administrator | Zone 2, 3 |
| \`org_member\` | Standard member | Zone 2 (limited), 3 |
| \`finance_manager\` | Financing specialist | MOD-11 |
| \`sales_partner\` | Sales partner | MOD-09, MOD-10 |

---

## Module Access by Org-Type

| Module | client | partner | renter |
|--------|--------|---------|--------|
| MOD-01 | ✓ | ✓ | ✓ |
| MOD-02 | ✓ | ✓ | — |
| MOD-03 | ✓ | ✓ | — |
| MOD-04 | ✓ | — | — |
| MOD-05 | ✓ | — | — |
| MOD-06 | ✓ | — | — |
| MOD-07 | ✓ | — | — |
| MOD-08 | ✓ | — | — |
| MOD-09 | — | ✓ | — |
| MOD-10 | — | ✓ | — |
| MOD-11 | — | ✓* | — |
| MOD-12 | — | ✓ | — |
| MOD-13 | ✓ | ✓ | — |
| MOD-14 | — | ✓ | — |
| MOD-15 | — | ✓ | — |
| MOD-16 | ✓ | ✓ | — |
| MOD-17 | — | ✓ | — |
| MOD-18 | ✓ | — | — |
| MOD-19 | ✓ | — | — |
| MOD-20 | — | — | ✓ |

*requires \`finance_manager\` role

---

## RLS Patterns

\`\`\`sql
-- Standard tenant-scoped policy
CREATE POLICY "tenant_isolation" ON public.{table}
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  )
);

-- Platform admin bypass
CREATE POLICY "platform_admin_access" ON public.{table}
FOR ALL USING (
  public.is_platform_admin()
);
\`\`\`

---

*This document is FROZEN.*
`;

const ZONE_OVERVIEW_MD = `# ZONE OVERVIEW

**Version:** 1.0.0  
**Status:** FROZEN

---

## Zone Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                         ZONE 1: ADMIN                               │
│                      /admin/* (AdminLayout)                         │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │  Foundation  │    Master    │   Backbone   │    Desks     │     │
│  │  Dashboard   │   Contacts   │   Billing    │  FutureRoom  │     │
│  │  Orgs/Users  │   Templates  │   Inbox      │  Sales Desk  │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ZONE 2: PORTAL                              │
│                      /portal/* (PortalLayout)                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  MOD-01  MOD-02  MOD-03  MOD-04  MOD-05  MOD-06  MOD-07   │    │
│  │  MOD-08  MOD-09  MOD-10  MOD-11  MOD-12  MOD-13  MOD-14   │    │
│  │  MOD-15  MOD-16  MOD-17  MOD-18  MOD-19  MOD-20           │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ZONE 3: WEBSITES                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │   /kaufy   │  │   /miety   │  │    /sot    │  │/futureroom │   │
│  │  Investors │  │   Renters  │  │  Platform  │  │  Finance   │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## Zone Responsibilities

| Zone | Purpose | Layout | Auth Required |
|------|---------|--------|---------------|
| Zone 1 | Platform governance | AdminLayout | platform_admin |
| Zone 2 | User operations | PortalLayout | org_member+ |
| Zone 3 | Marketing/Lead gen | Site-specific | Optional |

---

*This document is FROZEN.*
`;

const MOD04_CONTRACT_MD = `# MOD-04: Immobilien — Contract

**Version:** 1.0.0  
**Status:** FROZEN

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Zone** | 2 (Portal) |
| **Path** | \`/portal/immobilien\` |
| **Icon** | Building2 |
| **Org-Types** | client |

---

## Tiles (4-Tile Pattern)

| Path | Title | Description |
|------|-------|-------------|
| /kontexte | Kontexte | Eigentümer-Kontexte (Privat, GbR, GmbH) |
| /portfolio | Portfolio | Immobilien-Übersicht mit KPIs |
| /sanierung | Sanierung | Sanierungs-Projekte |
| /bewertung | Bewertung | Wertgutachten, Marktanalyse |

---

## Data Model

### Primary Tables
- \`properties\` — Property master data
- \`units\` — Units within properties
- \`landlord_contexts\` — Ownership contexts
- \`property_features\` — Feature flags

### Relationships
- 1:N \`properties\` → \`units\`
- N:1 \`properties\` → \`landlord_contexts\`

---

## API Endpoints

| ID | Method | Path | Description |
|----|--------|------|-------------|
| API-700 | GET | /properties | List properties |
| API-701 | POST | /properties | Create property |
| API-702 | GET | /properties/:id | Property detail |
| API-703 | PATCH | /properties/:id | Update property |

---

*This document is FROZEN.*
`;

const MOD05_CONTRACT_MD = `# MOD-05: MSV — Contract

**Version:** 1.0.0  
**Status:** FROZEN

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Zone** | 2 (Portal) |
| **Path** | \`/portal/msv\` |
| **Icon** | KeyRound |
| **Org-Types** | client |

---

## Tiles (4-Tile Pattern)

| Path | Title | Description |
|------|-------|-------------|
| /objekte | Objekte | MSV-aktivierte Objekte |
| /mieteingang | Mieteingang | Zahlungseingänge |
| /vermietung | Vermietung | Rental listings |
| /einstellungen | Einstellungen | MSV Premium config |

---

## Data Model

### Primary Tables
- \`leases\` — Lease contracts
- \`rent_payments\` — Payment tracking
- \`rental_listings\` — Public rental ads

### Relationships
- N:1 \`leases\` → \`units\`
- 1:N \`leases\` → \`rent_payments\`

---

*This document is FROZEN.*
`;

const MOD06_CONTRACT_MD = `# MOD-06: Verkauf — Contract

**Version:** 1.0.0  
**Status:** FROZEN

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Zone** | 2 (Portal) |
| **Path** | \`/portal/verkauf\` |
| **Icon** | Gavel |
| **Org-Types** | client |

---

## Tiles (4-Tile Pattern)

| Path | Title | Description |
|------|-------|-------------|
| /objekte | Objekte | Sale-enabled properties |
| /vorgaenge | Vorgänge | Sales pipeline |
| /reporting | Reporting | Analytics |
| /einstellungen | Einstellungen | Sales config |

---

## Sales Workflow

\`\`\`
draft → active → reserved → sold
         ↓
      withdrawn
\`\`\`

---

*This document is FROZEN.*
`;

const MOD07_CONTRACT_MD = `# MOD-07: Finanzierung — Contract

**Version:** 1.0.0  
**Status:** FROZEN

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Zone** | 2 (Portal) |
| **Path** | \`/portal/finanzierung\` |
| **Icon** | Landmark |
| **Org-Types** | client |

---

## Tiles (4-Tile Pattern)

| Path | Title | Description |
|------|-------|-------------|
| /selbstauskunft | Selbstauskunft | Self-disclosure form |
| /dokumente | Dokumente | Document upload |
| /anfrage | Anfrage | Request details |
| /status | Status | Application status |

---

## Data Model

### Primary Tables
- \`finance_requests\` — Financing requests
- \`applicant_profiles\` — Applicant data (9 groups)
- \`finance_documents\` — Document links

---

## Status Flow

\`\`\`
draft → collecting → ready → submitted → in_processing → completed
                        ↓                      ↓
                     blocked               rejected
\`\`\`

---

*This document is FROZEN.*
`;

const MOD11_CONTRACT_MD = `# MOD-11: Finanzierungsmanager — Contract

**Version:** 1.0.0  
**Status:** FROZEN

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Zone** | 2 (Portal) |
| **Path** | \`/portal/finanzierungsmanager\` |
| **Icon** | Landmark |
| **Org-Types** | partner |
| **Requires Role** | finance_manager |

---

## Tiles (4-Tile Pattern)

| Path | Title | Description |
|------|-------|-------------|
| /how-it-works | So funktioniert's | Workflow explanation |
| /selbstauskunft | Selbstauskunft | Case dossier view |
| /einreichen | Einreichen | Bank submission |
| /status | Status | Case tracking |

---

## Data Model

### Primary Tables
- \`finance_mandates\` — Accepted mandates
- \`future_room_cases\` — Bank submission tracking
- \`finance_bank_contacts\` — Bank directory

---

## Workflow

\`\`\`
Zone 1 FutureRoom → mandate_assigned → MOD-11 accepts →
documents_reviewed → package_prepared → submitted_to_bank →
bank_response → case_closed
\`\`\`

---

*This document is FROZEN.*
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting SPECS package generation...');
    
    const zip = new JSZip();
    
    // Frozen specs
    zip.file('spec/00_frozen/SOFTWARE_FOUNDATION.md', SOFTWARE_FOUNDATION_MD);
    zip.file('spec/00_frozen/MODULE_BLUEPRINT.md', MODULE_BLUEPRINT_MD);
    zip.file('spec/00_frozen/DEVELOPMENT_GOVERNANCE.md', DEVELOPMENT_GOVERNANCE_MD);
    
    // Platform specs
    zip.file('spec/01_platform/ACCESS_MATRIX.md', ACCESS_MATRIX_MD);
    zip.file('spec/01_platform/ZONE_OVERVIEW.md', ZONE_OVERVIEW_MD);
    
    // Module contracts
    zip.file('spec/02_modules/mod-04_immobilien.md', MOD04_CONTRACT_MD);
    zip.file('spec/02_modules/mod-05_msv_contract.md', MOD05_CONTRACT_MD);
    zip.file('spec/02_modules/mod-06_verkauf_contract.md', MOD06_CONTRACT_MD);
    zip.file('spec/02_modules/mod-07_finanzierung.md', MOD07_CONTRACT_MD);
    zip.file('spec/02_modules/mod-11_finanzierungsmanager.md', MOD11_CONTRACT_MD);
    
    const zipContent = await zip.generateAsync({ type: 'base64' });
    
    console.log('SPECS package generated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        package: 'specs',
        zipBase64: zipContent,
        files: [
          'spec/00_frozen/SOFTWARE_FOUNDATION.md',
          'spec/00_frozen/MODULE_BLUEPRINT.md',
          'spec/00_frozen/DEVELOPMENT_GOVERNANCE.md',
          'spec/01_platform/ACCESS_MATRIX.md',
          'spec/01_platform/ZONE_OVERVIEW.md',
          'spec/02_modules/mod-04_immobilien.md',
          'spec/02_modules/mod-05_msv_contract.md',
          'spec/02_modules/mod-06_verkauf_contract.md',
          'spec/02_modules/mod-07_finanzierung.md',
          'spec/02_modules/mod-11_finanzierungsmanager.md'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error generating SPECS package:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
