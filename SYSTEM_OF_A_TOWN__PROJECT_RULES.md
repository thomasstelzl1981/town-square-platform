# System of a Town — Project Rules

> **Status**: Phase 1.2 — Foundation + Admin Portal FROZEN  
> **Last Updated**: 2026-01-21

---

## Architecture Overview

### Three-Zone Model (DNA)

| Zone | Name | Purpose | UX Pattern |
|------|------|---------|------------|
| **Zone 1** | Admin Portal | Internal control center for operators | Sidebar-based, desktop-first |
| **Zone 2** | User Portals | End-user workspaces | Mobile-first, tile-based (Apple Homescreen logic) |
| **Zone 3** | Websites | Public-facing sales & advisory | AI-assisted, conversational, conversion-oriented |

**Important**: These zones are separate frontends sharing the same DB/RLS foundation.

### Terminology Rules

| Term | Definition | Zone |
|------|------------|------|
| **Modules** | Tile-features in User Portals (one main tile + sub-tiles) | Zone 2 only |
| **AI/Automation** | Cross-cutting capability, not a module | Enhances Zone 2 + Zone 3 |
| **Integrations** | Backend API connections | Configured in Zone 1 |

---

## Phase 1 Goal

- Deliver a multi-tenant core platform for real estate sales (Kaufy) and property management (Miety)
- Enable secure financing package handoff to Future Room (no orchestration)
- Establish strict tenant isolation with membership-based RLS from day one
- Build modular architecture with clear boundaries between Core, Kaufy, and Miety
- Ship a functional, auditable system with no Phase-2 placeholders

---

## Scope

### ✅ In Scope

| Area | Details |
|------|---------|
| **Core** | Auth, orgs, memberships, contacts, documents, data rooms, audit trail |
| **Kaufy** | Properties (neutral), units, listings (sales lifecycle), partner visibility, reservations |
| **Miety** | Properties (shared), units, leases (rental lifecycle), rent payment tracking |
| **Financing** | Package builder, completeness validation, data room export, summary PDF |
| **Communication** | Outbound transactional email (Resend), inbound webhook intake, manual entity linking |

### ❌ Out of Scope (Phase 1)

| Exclusion | Reason |
|-----------|--------|
| Acquiary | Separate product |
| Future Room orchestration | Separate product (handoff only) |
| Bank APIs / submission | Not in Phase 1 |
| CRM sync | Not in Phase 1 |
| Marketing automation | Not in Phase 1 |
| Payments / billing | Not in Phase 1 |
| Email inbox UI | Not in Phase 1 |
| IMAP / mailbox sync | Not in Phase 1 |
| Nylas, Unipile, Apify | Not allowed |
| OAuth / Magic links | Not required |
| SECURITY DEFINER for auth | Explicitly forbidden |

---

## Module Boundaries

### Core Module
- Authentication (email + password, Supabase Auth)
- Organizations and memberships
- Profiles (lightweight, no roles)
- Contacts (person/company, tenant-scoped)
- Documents (storage + metadata)
- Data rooms (access_grants + share_links)
- Communication events (outbound + inbound intake)
- Audit trail (immutable)

### Kaufy Module
- Properties (neutral assets, no sales status)
- Units (within properties)
- Listings (sales lifecycle: draft → internal_review → active → reserved → inactive/sold)
- Partner visibility grants
- Reservations (approval workflow)

### Miety Module
- Properties (shared with Kaufy)
- Units (shared with Kaufy)
- Leases (rental lifecycle: draft → active → notice_given → terminated/renewed)
- Rent payments (tracking only, no processing)

---

## Multi-Tenancy Rules

1. **Multi-org per user**: Users can belong to multiple organizations via memberships
2. **Active tenant context**: Users explicitly switch their active organization (stored in profiles.active_tenant_id)
3. **Strict tenant isolation**: All business data is scoped to tenant_id
4. **No cross-tenant visibility**: User A in Org A cannot see Org B data, even if they belong to Org B (must switch context)
5. **Platform Admin = God Mode**: Platform Admins have unrestricted access across ALL tenants (read/write/admin)
6. **Child Privacy Lockdown**: Child orgs can block parent-derived access via `parent_access_blocked` flag (platform_admin bypasses)

---

## Platform Admin Rules (God Mode)

| Capability | Allowed |
|------------|---------|
| Read ANY row in ANY tenant | ✅ |
| Write/Update ANY row in ANY tenant | ✅ |
| Bypass lockdown flags | ✅ |
| Manage all organizations | ✅ |
| Manage all memberships | ✅ |
| Manage all delegations | ✅ |
| Access audit events | ✅ |

**Implementation**: `is_platform_admin()` SECURITY INVOKER function checks membership role.

---

## Authentication Rules

- **Provider**: Supabase Auth only
- **Method**: Email + password (no OAuth, no magic links in Phase 1)
- **Verification**: Email verification required before access
- **Session**: Standard Supabase session management
- **Redirect**: Use `emailRedirectTo` with `window.location.origin`

---

## RLS Rules (NON-NEGOTIABLE)

### Mandatory Requirements

1. **Tenant isolation on EVERY business table** — no exceptions
2. **Membership-existence checks** — direct inline checks, no helper functions for auth
3. **No `USING(true)`** — every policy must have explicit conditions
4. **No SECURITY DEFINER for authorization** — DB is the security boundary
5. **Platform Admin excluded** — no special bypass for business data

### Standard RLS Pattern

```sql
-- For tenant-scoped tables
CREATE POLICY "Tenant members can access"
ON public.{table_name}
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = {table_name}.tenant_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = {table_name}.tenant_id
  )
);
```

### Role-Specific Restrictions

```sql
-- Example: Sales partners see only assigned listings
CREATE POLICY "Sales partners see assigned listings"
ON public.listings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = listings.tenant_id
    AND m.role = 'org_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM listing_partner_visibility lpv
    JOIN memberships m ON m.user_id = lpv.partner_user_id
    WHERE lpv.listing_id = listings.id
    AND m.user_id = auth.uid()
    AND m.tenant_id = listings.tenant_id
    AND m.role = 'sales_partner'
  )
);
```

---

## Data Room Rules

### Required Tables

| Table | Purpose |
|-------|---------|
| `data_rooms` | Container for document collections |
| `access_grants` | Explicit access: scope_type/scope_id + subject_type/subject_id + permissions + expires_at + status |
| `share_links` | Token-based access: token + expires_at + view_count + download_count + status |

### Required Audit Events

- `grant_created`
- `grant_revoked`
- `link_created`
- `link_viewed`
- `link_downloaded`
- `document_exported`

---

## Communication Rules

### Outbound

- **Provider**: Resend (single provider)
- **Use cases**: User invites, partner invites, data room notifications, status notifications
- **Logging**: All outbound messages logged as `communication_events` (direction = 'outbound')

### Inbound

- **Intake**: Webhook only (no IMAP, no mailbox sync)
- **Storage**: Stored as unassigned `communication_events` (direction = 'inbound')
- **Parsing**: None — raw storage only
- **Linking**: Manual link/unlink to entity (contact, listing, property, finance_package)
- **Audit**: Link/unlink actions logged in audit trail

### Forbidden

- Email inbox UI
- Mailbox synchronization
- IMAP access
- Nylas, Unipile, or similar integrations

---

## Engineering Guardrails

### Architecture

- **No direct DB calls in UI components** — use service/domain layers
- **Separation of concerns**: Types → Hooks → Services → Components
- **Modular structure**: `/src/modules/{core,kaufy,miety}/`
- **Shared UI**: `/src/components/ui/` (shadcn)
- **Shared hooks**: `/src/hooks/`

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Tables | snake_case, plural | `organizations`, `memberships` |
| Columns | snake_case | `tenant_id`, `created_at` |
| Types | PascalCase | `Organization`, `Membership` |
| Components | PascalCase | `PropertyCard`, `ListingTable` |
| Hooks | camelCase, use prefix | `useOrganization`, `useListings` |
| Services | camelCase | `organizationService`, `listingService` |

### Code Quality

- No Phase-2 placeholders or TODOs for future features
- No dead code or unused imports
- No console.log in production (use proper error handling)
- All tenant-scoped queries must include tenant_id filter

---

## Definition of Done (Phase 1)

| Criterion | Validation |
|-----------|------------|
| Auth works | Register → verify email → login → switch org |
| Tenant isolation | User A cannot access Org B data (RLS enforced) |
| Platform Admin isolated | Platform Admin cannot read tenant business data |
| Kaufy flow complete | Create property → create listing → progress status → approve reservation |
| Miety flow complete | Add property → add unit → create lease → track payments |
| Package handoff works | Build → validate → create data room + grants + link + PDF |
| Data room access logged | All views/downloads recorded in audit_events |
| Communication linking works | Inbound message can be linked/unlinked with audit |
| Audit trail active | All critical actions logged |
| No dead routes | All navigation functional |
| No out-of-scope features | Clean boundaries enforced |

---

## Top 10 Do / Don't

### ✅ DO

1. **DO** scope every business table with `tenant_id`
2. **DO** use membership-existence checks inline in RLS policies
3. **DO** treat properties as neutral assets (no sales lifecycle)
4. **DO** drive sales lifecycle from `listing.status`
5. **DO** drive rental lifecycle from `lease.status` + `rent_payments`
6. **DO** require explicit `access_grants` for data room access
7. **DO** log all critical actions in `audit_events`
8. **DO** use service layers between UI and database
9. **DO** validate completeness before allowing finance package export
10. **DO** use semantic design tokens from the design system

### ❌ DON'T

1. **DON'T** use SECURITY DEFINER for authorization logic
2. **DON'T** add `USING(true)` to any RLS policy
3. **DON'T** give Platform Admin cross-tenant data access
4. **DON'T** build inbox UI or mailbox sync
5. **DON'T** call Supabase directly from UI components
6. **DON'T** add Phase-2 features or placeholders
7. **DON'T** store roles in profiles table (use memberships)
8. **DON'T** use OAuth or magic links (email+password only)
9. **DON'T** process payments (tracking only)
10. **DON'T** orchestrate bank submissions (handoff only)

---

## Change Summary Template

After every change, output:

```
## Change Summary

1. **What changed**: [Brief description]
2. **Files changed**: [List of files]
3. **DB changes**: [Tables/columns/indexes added/modified]
4. **RLS changes**: [Policies added/modified]
5. **Routes/pages changed**: [Routes added/modified]
6. **New assumptions**: [Any new assumptions made]
7. **Risks/mitigations**: [Identified risks and how they're addressed]
```
