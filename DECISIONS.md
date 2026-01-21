# System of a Town — Decision Log

> **Format**: ADR-light (Date, Decision, Reason, Implications)  
> **Last Updated**: 2026-01-21

---

## ADR-001: Greenfield Architecture

**Date**: 2026-01-20  
**Decision**: Build System of a Town as a greenfield project with no legacy dependencies.  
**Reason**: No existing system to migrate; clean slate allows optimal architecture decisions without backward compatibility constraints.  
**Implications**:
- Schema designed from scratch for multi-tenancy
- No migration scripts for legacy data
- All architectural patterns can be applied consistently

---

## ADR-002: Multi-Org Per User Tenancy Model

**Date**: 2026-01-20  
**Decision**: Users can belong to multiple organizations via memberships with explicit active organization switching.  
**Reason**: Real estate professionals often work across multiple organizations (agencies, investment groups, property management companies).  
**Implications**:
- `memberships` table links users to organizations with roles
- `profiles.active_tenant_id` tracks current context
- UI must provide organization switcher
- All queries must filter by active tenant context

---

## ADR-003: No SECURITY DEFINER for Authorization

**Date**: 2026-01-20  
**Decision**: RLS policies use direct membership-existence checks. No SECURITY DEFINER views or functions for authorization.  
**Reason**: 
- Simplifies security model
- Database is the security boundary
- Avoids privilege escalation risks
- Makes policies auditable and explicit  
**Implications**:
- All RLS policies contain inline `EXISTS (SELECT 1 FROM memberships ...)` checks
- Role checks embedded directly in policies
- No helper functions for auth bypass
- Slightly more verbose policies, but more secure

---

## ADR-004: Properties as Neutral Assets

**Date**: 2026-01-20  
**Decision**: Properties have no sales lifecycle status. They are neutral containers.  
**Reason**: A property can be simultaneously listed for sale (Kaufy) and have active leases (Miety). Conflating sales status with property state creates data model conflicts.  
**Implications**:
- `properties.status` reflects operational state only (available, under_renovation, etc.)
- `listing.status` drives sales lifecycle (draft → internal_review → active → reserved → inactive/sold)
- `lease.status` drives rental lifecycle (draft → active → notice_given → terminated/renewed)
- Clear separation between asset state and business process state

---

## ADR-005: Explicit Data Room Access Model

**Date**: 2026-01-20  
**Decision**: Data room access requires explicit `access_grants` table entries. Share links tracked in `share_links` table with view/download counters.  
**Reason**: 
- Financing packages require auditable access
- Regulatory compliance needs access logging
- Token-based sharing enables external party access without accounts  
**Implications**:
- `access_grants`: scope_type/scope_id + subject_type/subject_id + permissions + expires_at + status
- `share_links`: token + expires_at + view_count + download_count + status
- All access logged in `audit_events`
- No implicit "open" data rooms

---

## ADR-006: Platform Admin Has No Cross-Tenant Access

**Date**: 2026-01-20  
**Decision**: Platform Admin role is for provisioning and technical support only. No cross-tenant business data access.  
**Reason**: 
- Principle of least privilege
- Prevents accidental or malicious data exposure
- Support/impersonation mode is a complex feature requiring explicit design  
**Implications**:
- Platform Admin RLS policies only allow access to platform-level tables (organizations list, user accounts)
- Business tables (properties, contacts, listings, etc.) exclude Platform Admin
- Support/Impersonation Mode deferred to Phase 2

---

## ADR-007: Communication Events Without Parsing

**Date**: 2026-01-20  
**Decision**: Inbound emails stored as raw `communication_events` via webhook. No automatic parsing into business entities.  
**Reason**: 
- Email parsing is complex and error-prone
- Manual linking provides explicit audit trail
- Avoids scope creep into inbox functionality  
**Implications**:
- Inbound webhook stores raw email data
- UI provides manual link/unlink to entities (contact, listing, property, finance_package)
- Link/unlink actions recorded in audit trail
- No inbox UI, no mailbox sync, no IMAP

---

## ADR-008: Single Email Provider (Resend)

**Date**: 2026-01-20  
**Decision**: Use Resend as the single transactional email provider.  
**Reason**: 
- Simple, modern API
- Good deliverability
- Reasonable pricing
- No need for multiple providers in Phase 1  
**Implications**:
- All outbound transactional email routed through Resend
- Use cases: invites, notifications, data room shares
- No marketing email, no bulk sends
- Provider abstraction layer not required in Phase 1

---

## ADR-009: Roles in Memberships Table Only

**Date**: 2026-01-20  
**Decision**: User roles stored in `memberships` table, never in `profiles` or `auth.users`.  
**Reason**: 
- Roles are org-specific (a user can be admin in Org A, sales_partner in Org B)
- Prevents privilege escalation via profile manipulation
- RLS policies check memberships directly  
**Implications**:
- `memberships` table: user_id + tenant_id + role
- Profiles contain only display info (name, avatar, active_tenant_id)
- No role field in profiles table
- Role changes require membership updates

---

## ADR-010: Financing Handoff Only

**Date**: 2026-01-20  
**Decision**: Financing package preparation stops at "Ready for Future Room" status. No bank submission or orchestration.  
**Reason**: 
- Future Room is a separate product with its own workflow
- Bank API integration is complex and out of scope
- Clean handoff boundary simplifies system  
**Implications**:
- Package builder collects documents and applicant data
- Completeness validation before export
- Data room + share link + summary PDF generated
- Status set to `ready_for_handoff`
- No follow-up automation, no status updates from banks

---

## ADR-011: Desktop-First UI

**Date**: 2026-01-20  
**Decision**: UI is desktop-first with tablet-friendly layouts. Essential mobile views only.  
**Reason**: 
- Primary users are real estate professionals at desks
- Complex workflows (package building, lease management) require screen real estate
- Mobile is secondary use case  
**Implications**:
- Sidebar navigation (collapsible)
- Card-based layouts
- Tables with horizontal scroll on mobile
- Forms optimized for desktop input
- Mobile views for read-only dashboards and notifications

---

## ADR-012: Audit Trail Immutability

**Date**: 2026-01-20  
**Decision**: Audit events are immutable. No UPDATE or DELETE policies on `audit_events` table.  
**Reason**: 
- Regulatory compliance
- Non-repudiation
- Forensic investigation capability  
**Implications**:
- `audit_events` table has INSERT-only RLS policy
- No soft delete or modification
- Retention policy to be defined (archival, not deletion)
- Indexed for query performance on actor_id, entity_type, entity_id

---

## ADR-013: Platform Admin God Mode

**Date**: 2026-01-20  
**Decision**: Platform Admin has unrestricted access across all tenants ("God Mode"), explicitly overriding previous ADR-006.  
**Reason**: 
- Business cannot operate without a super-role that can see, fix, and support everything
- Support mode and troubleshooting require full visibility
- Previous restriction made system unoperatable  
**Implications**:
- `is_platform_admin()` function grants full bypass in all RLS policies
- Platform Admin can read/write ANY row in ANY tenant
- Platform Admin always bypasses lockdown flags
- ADR-006 is superseded

---

## ADR-014: Child Privacy Lockdown (Parent Access Block)

**Date**: 2026-01-21  
**Decision**: Organizations can block parent-derived access via `parent_access_blocked` flag.  
**Reason**: 
- Child organizations may need privacy from parent hierarchy
- Sub-partners or clients may require data isolation from partners
- Enables true multi-tenant privacy within hierarchies  
**Implications**:
- `organizations.parent_access_blocked BOOLEAN NOT NULL DEFAULT FALSE`
- When enabled, parent org cannot access child's data via hierarchy
- Platform Admin ALWAYS bypasses this lockdown
- Only org_admin of the child org or platform_admin can toggle
- All changes logged in `audit_events`

---

## ADR-015: Three-Zone Architecture

**Date**: 2026-01-21  
**Decision**: System is structured into three distinct frontend zones sharing the same DB/RLS foundation.  
**Reason**: 
- Clear separation of concerns between operator tools, user workspaces, and public-facing sites
- Different UX patterns for different audiences
- Enables independent evolution of each zone  
**Implications**:
- Zone 1: Admin Portal (internal control center, sidebar-based, operators/admins)
- Zone 2: User Portals (end-user workspaces, mobile-first, tile-based, modular features)
- Zone 3: Websites (public-facing, AI-assisted, conversion-oriented)
- All zones share database, RLS, and core authentication
- "Modules" terminology reserved for Zone 2 tile-features only

---

## ADR-016: Immutable Organization Hierarchy

**Date**: 2026-01-21  
**Decision**: Critical organization hierarchy fields are immutable after creation.  
**Reason**: 
- Reparenting organizations creates audit complexity
- Materialized paths and depth become inconsistent
- Business rules depend on stable hierarchy  
**Implications**:
- `org_type`, `parent_id`, `depth`, `materialized_path` cannot be updated
- Enforced via BEFORE UPDATE trigger
- Organizations cannot be deleted in Phase 1
- Revocation model used instead of deletion

---

## ADR-017: Immutable Delegation History

**Date**: 2026-01-21  
**Decision**: Delegations are never deleted, only revoked.  
**Reason**: 
- Audit trail must preserve who had access when
- Legal/compliance requires historical access records
- Enables forensic investigation of past access  
**Implications**:
- `org_delegations.status` enum: active, revoked, expired
- Revocation sets `status = 'revoked'`, `revoked_by`, `revoked_at`
- No DELETE policy on delegations
- Active delegation enforced via partial unique index

---

## ADR-018: Module/Feature Framework for Zone 2

**Date**: 2026-01-21  
**Decision**: Zone 2 uses a modular framework with tenant-specific feature activation.  
**Reason**: 
- Different tenants need different capabilities
- Avoids one-size-fits-all approach
- Enables future business model flexibility (feature-based pricing)  
**Implications**:
- `module_catalog`: defines available tile-modules
- `tenant_features`: maps activated modules per organization
- `module_dependencies`: defines inter-module requirements
- UI in Zone 2 renders only activated tiles
- Admin Portal (Zone 1) manages feature activation

---

## ADR-019: Mieter als eigenständiger Tenant

**Date**: 2026-01-21  
**Decision**: Mieter erhalten bei Invite-Akzeptanz einen eigenen Tenant (org_type: 'renter') mit membership_role: 'renter_user'.  
**Reason**: 
- Mieter-Daten sind strikt getrennt von Vermieter-Daten
- Mieter können später eigene Immobilien besitzen
- Klare RLS-Trennung möglich  
**Implications**:
- org_type Enum erweitert um 'renter'
- membership_role Enum erweitert um 'renter_user'
- renter_org ist root-level (kein parent_id)
- leases.renter_org_id verknüpft Mieter mit Mietvertrag

---

## ADR-020: Lease-Exklusivität pro Unit

**Date**: 2026-01-21  
**Decision**: Pro Unit kann nur ein aktiver Mietvertrag existieren (status IN active, notice_given).  
**Reason**: 
- Business-Regel: Eine Wohnung kann nicht doppelt vermietet sein
- Verhindert Dateninkonsistenzen  
**Implications**:
- Partial Unique Index auf leases(unit_id) WHERE status IN ('active', 'notice_given')
- Constraint wird auf DB-Ebene erzwungen
- UI verhindert doppelte Anlage

---

## ADR-021: Property-Features (Option B)

**Date**: 2026-01-21  
**Decision**: Feature-Aktivierung pro Property über eigenständige property_features Tabelle (Option B).  
**Reason**: 
- Flexibilität für zukünftige Features
- Audit-Trail für Aktivierungen/Deaktivierungen
- Keine JSONB-Komplexität  
**Implications**:
- property_features Tabelle mit feature_code: 'msv' | 'kaufy' | 'website_visibility'
- UNIQUE(property_id, feature_code)
- Status-Tracking: active/inactive mit Timestamps
- RLS: nur Tenant-Owner + Platform Admin

---

## ADR-022: Immobilienportfolio als Source of Truth

**Date**: 2026-01-21  
**Decision**: Das Immobilienportfolio (Zone 2) ist die einzige Quelle der Wahrheit für alle Immobiliendaten.  
**Reason**: 
- Eigentümer/Vermieter pflegen Daten zentral
- Mieter haben keinen Schreibzugriff auf Immobiliendaten
- Alle Workflows (Miety, Kaufy) entstehen aus dem Portfolio  
**Implications**:
- Properties, Units nur durch Eigentümer editierbar
- Mieter sehen nur eigene Leases (via renter_org_id)
- Verkaufsaufträge, MSV entstehen aus Portfolio

---

## ADR-023: Vermieter-initiierter Invite-Flow

**Date**: 2026-01-21  
**Decision**: Mieter werden aktiv vom Vermieter per Einladung ins System geholt.  
**Reason**: 
- Vermieter kontrolliert wer Zugang erhält
- Audit-Trail für alle Einladungen
- Token-basierte Registrierung  
**Implications**:
- renter_invites Tabelle mit Token, Status, Ablaufdatum
- Nur 1 pending Invite pro Lease (Partial Unique Index)
- Bei Akzeptanz: renter_org erstellen, leases.renter_org_id setzen
- 14 Tage Standardgültigkeit

---

## ADR-024: Explizites Document-Sharing

**Date**: 2026-01-21  
**Decision**: Dokumente werden nur über explizite access_grants geteilt, keine impliziten Berechtigungen.  
**Reason**: 
- Datenschutz: Mieter sehen nur freigegebene Dokumente
- Audit-Trail für alle Freigaben
- Granulare Kontrolle (view/download)  
**Implications**:
- access_grants Tabelle mit scope_type='document', subject_type='organization'
- Status-Tracking: active/revoked/expired
- Mieter-RLS prüft access_grants vor Dokumentzugriff
- Keine automatischen Freigaben

---

## Template for Future Decisions

```markdown
## ADR-XXX: [Title]

**Date**: YYYY-MM-DD  
**Decision**: [What was decided]  
**Reason**: [Why this decision was made]  
**Implications**:
- [Implication 1]
- [Implication 2]
- [Implication 3]
```
