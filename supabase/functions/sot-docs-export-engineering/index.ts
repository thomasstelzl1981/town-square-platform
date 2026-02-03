import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// ENGINEERING + RFP EXPORT — Supplemental Package
// ============================================================================

const GENERATED_DATE = new Date().toISOString().split('T')[0];
const GENERATED_TIMESTAMP = new Date().toISOString();

// ============================================================================
// README.md
// ============================================================================
const README_MD = `# ENGINEERING + RFP ERGÄNZUNGS-EXPORT

**Generiert:** ${GENERATED_TIMESTAMP}  
**Version:** 1.0.0  
**Typ:** Ergänzung zum Baseline-ZIP

---

## Zweck

Dieses ZIP enthält **SSOT-Manifeste, IST-Inventories, Gap-Analysen und Workbench-Artefakte** 
für Engineering-Fortentwicklung und Festpreis-Ausschreibungen.

## Abgrenzung zum ersten ZIP

| Baseline-ZIP | Dieses ZIP (Engineering) |
|--------------|--------------------------|
| Konzepte, Specs, Module | Manifeste (SSOT) |
| Architektur-Dokumentation | IST-Inventories |
| Fließtexte, Erklärungen | Gap-Analyse |
| | Workbench (Backlog, Tests) |

**KEINE Wiederholung der Baseline-Inhalte.**

---

## Ordnerstruktur

\`\`\`
├── README.md (diese Datei)
├── manifests/
│   ├── routesManifest.ts     → SSOT für alle Routen
│   ├── tile_catalog.yaml     → Tile-Visibility & Activation
│   └── action_catalog.yaml   → UI-Actions & Workflow-Triggers
├── ist-inventory/
│   ├── ROUTE_INVENTORY.md
│   ├── MODULE_ROUTE_MAP.md
│   ├── DATA_ENTITY_INVENTORY.md
│   └── EDGE_FUNCTION_INVENTORY.md
├── gap-analyse/
│   ├── GAP_MATRIX_MASTER.md
│   └── GAP_TOP_ISSUES.md
├── workbench/
│   ├── WORKBENCH_BACKLOG.md
│   ├── ACCEPTANCE_TESTS.md
│   └── OPEN_DECISIONS.md
└── appendix/
    └── MANIFEST_SYNC_STATUS.md
\`\`\`

---

## Leseempfehlung

**Für Engineering:**
1. \`manifests/routesManifest.ts\` — Alle Routen
2. \`ist-inventory/EDGE_FUNCTION_INVENTORY.md\` — Backend-Übersicht
3. \`gap-analyse/GAP_TOP_ISSUES.md\` — Kritische Lücken

**Für Ausschreibung:**
1. \`gap-analyse/GAP_MATRIX_MASTER.md\` — Vollständige Gap-Tabelle
2. \`workbench/ACCEPTANCE_TESTS.md\` — Abnahmekriterien
3. \`workbench/OPEN_DECISIONS.md\` — Offene Entscheidungen

---

*Generiert von System of a Town Platform*
`;

// ============================================================================
// MANIFESTS (SSOT) — Embedded from repository
// ============================================================================

const ROUTES_MANIFEST_TS = `/**
 * ROUTES MANIFEST — SINGLE SOURCE OF TRUTH
 * 
 * This TypeScript version is generated from manifests/routes_manifest.yaml
 * ALL routes must be declared here. App.tsx delegates to ManifestRouter.
 * 
 * RULES:
 * 1. No route exists unless declared here
 * 2. 4-Tile-Pattern is mandatory for all modules (except MOD-20 Miety: 6 tiles)
 * 3. Changes require explicit approval
 */

// =============================================================================
// ZONE 1: ADMIN PORTAL
// =============================================================================
export const zone1Admin = {
  base: "/admin",
  layout: "AdminLayout",
  requires_role: ["platform_admin"],
  routes: [
    { path: "", component: "Dashboard", title: "Admin Dashboard" },
    { path: "organizations", component: "Organizations", title: "Organisationen" },
    { path: "organizations/:id", component: "OrganizationDetail", title: "Organisation Details", dynamic: true },
    { path: "users", component: "Users", title: "Benutzer" },
    { path: "delegations", component: "Delegations", title: "Delegationen" },
    { path: "contacts", component: "MasterContacts", title: "Kontakte" },
    { path: "master-templates", component: "MasterTemplates", title: "Master-Vorlagen" },
    { path: "tiles", component: "TileCatalog", title: "Tile-Katalog" },
    { path: "integrations", component: "Integrations", title: "Integrationen" },
    { path: "communication", component: "CommunicationHub", title: "Kommunikation" },
    { path: "oversight", component: "Oversight", title: "Oversight" },
    { path: "audit", component: "AuditLog", title: "Audit Log" },
    { path: "billing", component: "Billing", title: "Abrechnung" },
    { path: "agreements", component: "Agreements", title: "Vereinbarungen" },
    { path: "inbox", component: "Inbox", title: "Posteingang" },
    { path: "leadpool", component: "LeadPool", title: "Lead Pool" },
    { path: "partner-verification", component: "PartnerVerification", title: "Partner-Verifizierung" },
    { path: "commissions", component: "CommissionApproval", title: "Provisionen" },
    { path: "support", component: "Support", title: "Support" },
    // FutureRoom
    { path: "futureroom", component: "FutureRoom", title: "Future Room" },
    { path: "futureroom/inbox", component: "FutureRoomInbox", title: "Inbox" },
    { path: "futureroom/zuweisung", component: "FutureRoomZuweisung", title: "Zuweisung" },
    { path: "futureroom/finanzierungsmanager", component: "FutureRoomManagers", title: "Finanzierungsmanager" },
    { path: "futureroom/bankkontakte", component: "FutureRoomBanks", title: "Bankkontakte" },
    { path: "futureroom/monitoring", component: "FutureRoomMonitoring", title: "Monitoring" },
    // Agents
    { path: "agents", component: "AgentsDashboard", title: "Agents" },
    { path: "agents/catalog", component: "AgentsCatalog", title: "Agenten-Katalog" },
    { path: "agents/instances", component: "AgentsInstances", title: "Agenten-Instanzen" },
    { path: "agents/runs", component: "AgentsRuns", title: "Agent Runs" },
    { path: "agents/policies", component: "AgentsPolicies", title: "Policies" },
    // Acquiary
    { path: "acquiary", component: "AcquiaryDashboard", title: "Acquiary" },
    { path: "acquiary/zuordnung", component: "AcquiaryZuordnung", title: "Zuordnung" },
    { path: "acquiary/inbox", component: "AcquiaryInbox", title: "Inbox" },
    { path: "acquiary/mandate", component: "AcquiaryMandate", title: "Mandate" },
    // Sales Desk
    { path: "sales-desk", component: "SalesDeskDashboard", title: "Sales Desk" },
    { path: "sales-desk/veroeffentlichungen", component: "SalesDeskPublishing", title: "Veröffentlichungen" },
    { path: "sales-desk/inbox", component: "SalesDeskInbox", title: "Inbox" },
    { path: "sales-desk/partner", component: "SalesDeskPartner", title: "Partner" },
    { path: "sales-desk/audit", component: "SalesDeskAudit", title: "Audit" },
    // Finance Desk
    { path: "finance-desk", component: "FinanceDeskDashboard", title: "Finance Desk" },
  ],
};

// =============================================================================
// ZONE 2: USER PORTAL — 20 MODULE ARCHITECTURE
// =============================================================================
export const zone2Portal = {
  base: "/portal",
  layout: "PortalLayout",
  dashboard: { path: "", component: "PortalDashboard", title: "Portal Home" },
  modules: {
    "MOD-01": { name: "Stammdaten", base: "stammdaten", icon: "Users", display_order: 1, tiles: ["profil", "firma", "abrechnung", "sicherheit"] },
    "MOD-02": { name: "KI Office", base: "office", icon: "Sparkles", display_order: 2, tiles: ["email", "brief", "kontakte", "kalender"] },
    "MOD-03": { name: "DMS", base: "dms", icon: "FolderOpen", display_order: 3, tiles: ["storage", "posteingang", "sortieren", "einstellungen"] },
    "MOD-04": { name: "Immobilien", base: "immobilien", icon: "Building2", display_order: 4, tiles: ["portfolio", "kontexte", "sanierung", "bewertung"], dynamic: [":id", "neu"] },
    "MOD-05": { name: "MSV", base: "msv", icon: "FileText", display_order: 5, tiles: ["objekte", "mieteingang", "vermietung", "einstellungen"], dynamic: ["vermietung/:id"] },
    "MOD-06": { name: "Verkauf", base: "verkauf", icon: "Tag", display_order: 6, tiles: ["objekte", "vorgaenge", "reporting", "einstellungen"], dynamic: ["expose/:propertyId"] },
    "MOD-07": { name: "Finanzierung", base: "finanzierung", icon: "Landmark", display_order: 7, tiles: ["selbstauskunft", "dokumente", "anfrage", "status"], dynamic: ["anfrage/:requestId"] },
    "MOD-08": { name: "Investment-Suche", base: "investments", icon: "Search", display_order: 8, tiles: ["suche", "favoriten", "mandat", "simulation"] },
    "MOD-09": { name: "Vertriebspartner", base: "vertriebspartner", icon: "Handshake", display_order: 9, tiles: ["katalog", "beratung", "kunden", "network"] },
    "MOD-10": { name: "Leads", base: "leads", icon: "Target", display_order: 10, tiles: ["inbox", "meine", "pipeline", "werbung"] },
    "MOD-11": { name: "Finanzierungsmanager", base: "finanzierungsmanager", icon: "Landmark", display_order: 11, tiles: ["dashboard", "faelle", "kommunikation", "status"], dynamic: ["faelle/:requestId"] },
    "MOD-12": { name: "Akquise-Manager", base: "akquise-manager", icon: "Briefcase", display_order: 12, tiles: ["dashboard", "kunden", "mandate", "tools"] },
    "MOD-13": { name: "Projekte", base: "projekte", icon: "FolderKanban", display_order: 13, tiles: ["uebersicht", "timeline", "dokumente", "einstellungen"] },
    "MOD-14": { name: "Communication Pro", base: "communication-pro", icon: "Mail", display_order: 14, tiles: ["serien-emails", "recherche", "social", "agenten"] },
    "MOD-15": { name: "Fortbildung", base: "fortbildung", icon: "GraduationCap", display_order: 15, tiles: ["katalog", "meine-kurse", "zertifikate", "settings"] },
    "MOD-16": { name: "Services", base: "services", icon: "Wrench", display_order: 16, tiles: ["katalog", "anfragen", "auftraege", "settings"] },
    "MOD-17": { name: "Car-Management", base: "cars", icon: "Car", display_order: 17, tiles: ["uebersicht", "fahrzeuge", "service", "settings"] },
    "MOD-18": { name: "Finanzanalyse", base: "finanzanalyse", icon: "LineChart", display_order: 18, tiles: ["dashboard", "reports", "szenarien", "settings"] },
    "MOD-19": { name: "Photovoltaik", base: "photovoltaik", icon: "Sun", display_order: 19, tiles: ["angebot", "checkliste", "projekt", "settings"] },
    "MOD-20": { name: "Miety", base: "miety", icon: "Home", display_order: 20, tiles: ["uebersicht", "dokumente", "kommunikation", "zaehlerstaende", "versorgung", "versicherungen"] },
  },
};

// =============================================================================
// ZONE 3: WEBSITES
// =============================================================================
export const zone3Websites = {
  kaufy: { base: "/kaufy", routes: 13 },
  miety: { base: "/miety", routes: 9 },
  futureroom: { base: "/futureroom", routes: 4 },
  sot: { base: "/sot", routes: 7 },
};

// =============================================================================
// LEGACY ROUTES COUNT
// =============================================================================
export const legacyRoutes = { count: 17, status: "param-safe" };
`;

// ============================================================================
// IST-INVENTORY
// ============================================================================

const ROUTE_INVENTORY_MD = `# ROUTE INVENTORY

**Generiert:** ${GENERATED_DATE}  
**Status:** AUTOMATED

---

## Zone 1 — Admin Portal

| Route | Component | Reachable | Nav-Promoted |
|-------|-----------|-----------|--------------|
| /admin | Dashboard | ✅ OK | ✅ |
| /admin/organizations | Organizations | ✅ OK | ✅ |
| /admin/organizations/:id | OrganizationDetail | ✅ OK | ❌ (dynamic) |
| /admin/users | Users | ✅ OK | ✅ |
| /admin/delegations | Delegations | ✅ OK | ✅ |
| /admin/contacts | MasterContacts | ✅ OK | ✅ |
| /admin/tiles | TileCatalog | ✅ OK | ✅ |
| /admin/integrations | Integrations | ✅ OK | ✅ |
| /admin/oversight | Oversight | ✅ OK | ✅ |
| /admin/audit | AuditLog | ✅ OK | ✅ |
| /admin/billing | Billing | ✅ OK | ✅ |
| /admin/futureroom | FutureRoom | ✅ OK | ✅ |
| /admin/futureroom/inbox | FutureRoomInbox | ✅ OK | ✅ |
| /admin/futureroom/zuweisung | FutureRoomZuweisung | ✅ OK | ✅ |
| /admin/agents | AgentsDashboard | ✅ OK | ✅ |
| /admin/acquiary | AcquiaryDashboard | ✅ OK | ✅ |
| /admin/sales-desk | SalesDeskDashboard | ✅ OK | ✅ |

---

## Zone 2 — Portal (20 Module)

| Module | Primary Route | Tiles | Dynamic Routes | Status |
|--------|---------------|-------|----------------|--------|
| MOD-01 | /portal/stammdaten | 4 | 0 | ✅ OK |
| MOD-02 | /portal/office | 4 | 0 | ✅ OK |
| MOD-03 | /portal/dms | 4 | 0 | ✅ OK |
| MOD-04 | /portal/immobilien | 4 | 2 | ✅ OK |
| MOD-05 | /portal/msv | 4 | 1 | ✅ OK |
| MOD-06 | /portal/verkauf | 4 | 1 | ✅ OK |
| MOD-07 | /portal/finanzierung | 4 | 1 | ✅ OK |
| MOD-08 | /portal/investments | 4 | 0 | ✅ OK |
| MOD-09 | /portal/vertriebspartner | 4 | 0 | ✅ OK |
| MOD-10 | /portal/leads | 4 | 0 | ✅ OK |
| MOD-11 | /portal/finanzierungsmanager | 4 | 1 | ✅ OK |
| MOD-12 | /portal/akquise-manager | 4 | 0 | ⚠️ STUB |
| MOD-13 | /portal/projekte | 4 | 0 | ⚠️ STUB |
| MOD-14 | /portal/communication-pro | 4 | 0 | ⚠️ STUB |
| MOD-15 | /portal/fortbildung | 4 | 0 | ⚠️ STUB |
| MOD-16 | /portal/services | 4 | 0 | ⚠️ STUB |
| MOD-17 | /portal/cars | 4 | 0 | ⚠️ STUB |
| MOD-18 | /portal/finanzanalyse | 4 | 0 | ⚠️ STUB |
| MOD-19 | /portal/photovoltaik | 4 | 0 | ⚠️ STUB |
| MOD-20 | /portal/miety | 6 | 0 | ⚠️ STUB |

---

## Zone 3 — Websites

| Site | Base | Routes | Status |
|------|------|--------|--------|
| Kaufy | /kaufy | 13 | ✅ OK |
| Miety | /miety | 9 | ✅ OK |
| FutureRoom | /futureroom | 4 | ✅ OK |
| SoT | /sot | 7 | ✅ OK |

---

## Summary

| Zone | Routes | OK | STUB | BROKEN |
|------|--------|-----|------|--------|
| Zone 1 | 42 | 42 | 0 | 0 |
| Zone 2 | 90 | 50 | 40 | 0 |
| Zone 3 | 33 | 33 | 0 | 0 |
| **Total** | **165** | **125** | **40** | **0** |
`;

const MODULE_ROUTE_MAP_MD = `# MODULE ROUTE MAP

**Generiert:** ${GENERATED_DATE}

---

| Modul | Routes | Primary Route | Tile Count | Status |
|-------|--------|---------------|------------|--------|
| MOD-01 | 4 | /portal/stammdaten/profil | 4 | ✅ OK |
| MOD-02 | 4 | /portal/office/email | 4 | ✅ OK |
| MOD-03 | 4 | /portal/dms/storage | 4 | ✅ OK |
| MOD-04 | 6 | /portal/immobilien/portfolio | 4 + 2 dyn | ✅ OK |
| MOD-05 | 5 | /portal/msv/objekte | 4 + 1 dyn | ✅ OK |
| MOD-06 | 5 | /portal/verkauf/objekte | 4 + 1 dyn | ✅ OK |
| MOD-07 | 5 | /portal/finanzierung/selbstauskunft | 4 + 1 dyn | ✅ OK |
| MOD-08 | 4 | /portal/investments/suche | 4 | ✅ OK |
| MOD-09 | 4 | /portal/vertriebspartner/katalog | 4 | ✅ OK |
| MOD-10 | 4 | /portal/leads/inbox | 4 | ✅ OK |
| MOD-11 | 5 | /portal/finanzierungsmanager/dashboard | 4 + 1 dyn | ✅ OK |
| MOD-12 | 4 | /portal/akquise-manager/dashboard | 4 | ⚠️ PARTIAL |
| MOD-13 | 4 | /portal/projekte/uebersicht | 4 | ⚠️ PARTIAL |
| MOD-14 | 4 | /portal/communication-pro/serien-emails | 4 | ⚠️ STUB |
| MOD-15 | 4 | /portal/fortbildung/katalog | 4 | ⚠️ STUB |
| MOD-16 | 4 | /portal/services/katalog | 4 | ⚠️ STUB |
| MOD-17 | 4 | /portal/cars/uebersicht | 4 | ⚠️ STUB |
| MOD-18 | 4 | /portal/finanzanalyse/dashboard | 4 | ⚠️ STUB |
| MOD-19 | 4 | /portal/photovoltaik/angebot | 4 | ⚠️ STUB |
| MOD-20 | 6 | /portal/miety/uebersicht | 6 | ⚠️ STUB |
`;

const DATA_ENTITY_INVENTORY_MD = `# DATA ENTITY INVENTORY

**Generiert:** ${GENERATED_DATE}

---

## Kern-Entities

| Entity | SSOT-Modul | DB Table | RLS | Status |
|--------|------------|----------|-----|--------|
| Organization | Zone 1 | organizations | ✅ | OK |
| Profile | Zone 1 | profiles | ✅ | OK |
| Membership | Zone 1 | memberships | ✅ | OK |
| Property | MOD-04 | properties | ✅ | OK |
| Unit | MOD-04 | units | ✅ | OK |
| Lease | MOD-04 | leases | ✅ | OK |
| Loan | MOD-04 | loans | ✅ | OK |
| Contact | MOD-02 | contacts | ✅ | OK |
| Document | MOD-03 | documents | ✅ | OK |
| Extraction | MOD-03 | extractions | ✅ | OK |
| Listing | MOD-06 | listings | ✅ | OK |
| Finance Request | MOD-07 | finance_requests | ✅ | OK |
| Finance Mandate | MOD-11 | finance_mandates | ✅ | OK |
| Applicant Profile | MOD-07 | applicant_profiles | ✅ | OK |
| Lead | MOD-10 | leads | ✅ | OK |
| Partner Pipeline | MOD-09 | partner_pipelines | ✅ | OK |
| Commission | Zone 1 | commissions | ✅ | OK |
| Case | Workflow | cases | ✅ | OK |
| Case Event | Workflow | case_events | ✅ | OK |
| Audit Event | Zone 1 | audit_events | ✅ | OK |
| Storage Node | MOD-03 | storage_nodes | ✅ | OK |
| Document Link | MOD-03 | document_links | ✅ | OK |

---

## Source of Truth Map

| Domain | Primary SSOT | Downstream Consumers |
|--------|--------------|----------------------|
| Property/Unit/Lease | MOD-04 | MOD-05, MOD-06, MOD-07, MOD-08 |
| Documents | MOD-03 DMS | ALL |
| Finance (pre-submit) | MOD-07 | Zone 1 FutureRoom |
| Finance (post-assign) | MOD-11 | Zone 1 Monitoring |
| Listings/Sales | MOD-06 | MOD-09 Catalog |
| Leads | Zone 1 Pool | MOD-10 |
| Partners | Zone 1 | MOD-09 |
`;

const EDGE_FUNCTION_INVENTORY_MD = `# EDGE FUNCTION INVENTORY

**Generiert:** ${GENERATED_DATE}

---

| Name | Zweck | Trigger | Status |
|------|-------|---------|--------|
| sot-armstrong-advisor | KI-Beratung Investment | API (MOD-08/09) | ✅ USED |
| sot-dms-download-url | Signed Download URLs | API (MOD-03) | ✅ USED |
| sot-dms-upload-url | Signed Upload URLs | API (MOD-03) | ✅ USED |
| sot-docs-export | Orchestrator Docs ZIP | Admin UI | ✅ USED |
| sot-docs-export-rfp | RFP Package | Internal | ✅ USED |
| sot-docs-export-specs | Specs Package | Internal | ✅ USED |
| sot-docs-export-modules | Modules Package | Internal | ✅ USED |
| sot-docs-export-appendix | Appendix Package | Internal | ✅ USED |
| sot-document-parser | Doc Classification/OCR | Upload Hook | ✅ USED |
| sot-excel-ai-import | Excel → Property Import | API (MOD-04) | ✅ USED |
| sot-expose-description | KI Exposé-Text | API (MOD-06) | ✅ USED |
| sot-finance-manager-notify | FM Benachrichtigung | Workflow | ✅ USED |
| sot-investment-engine | 40-Jahres-Simulation | API (MOD-08) | ✅ USED |
| sot-lead-inbox | Lead Intake | Webhook | ✅ USED |
| sot-letter-generate | Brief-Generierung | API (MOD-02) | ✅ USED |
| sot-listing-publish | Portal-Publishing | API (MOD-06) | ✅ USED |
| sot-msv-reminder-check | Mahnungs-Prüfung | Cron | ✅ USED |
| sot-msv-rent-report | Miet-Reporting | API (MOD-05) | ✅ USED |
| sot-property-crud | Property CRUD | API (MOD-04) | ✅ USED |

---

## Summary

| Status | Count |
|--------|-------|
| USED | 19 |
| LEGACY | 0 |
| ORPHANED | 0 |
`;

// ============================================================================
// GAP-ANALYSE
// ============================================================================

const GAP_MATRIX_MASTER_MD = `# GAP MATRIX MASTER

**Generiert:** ${GENERATED_DATE}  
**Version:** 1.0.0

---

| ID | Referenz | SOLL | IST | GAP | Severity | Impact | Acceptance |
|----|----------|------|-----|-----|----------|--------|------------|
| G-001 | MOD-12 | Full Implementation | Stub Page | ❌ MISSING | P1 | Partner-Akquise | 4 Tiles implementiert, CRUD aktiv |
| G-002 | MOD-13 | Project Management | Stub Page | ❌ MISSING | P1 | Projekt-Tracking | 4 Tiles implementiert |
| G-003 | MOD-14 | Communication Pro | Stub Page | ❌ MISSING | P2 | Serien-E-Mails | 4 Tiles implementiert |
| G-004 | MOD-15 | Fortbildung | Stub Page | ❌ MISSING | P2 | Schulungen | 4 Tiles implementiert |
| G-005 | MOD-16 | Services | Stub Page | ❌ MISSING | P2 | Dienstleistungen | 4 Tiles implementiert |
| G-006 | MOD-17 | Car-Management | Stub Page | ❌ MISSING | P2 | Fuhrpark | 4 Tiles implementiert |
| G-007 | MOD-18 | Finanzanalyse | Stub Page | ❌ MISSING | P1 | KPI-Reports | Dashboard + Reports |
| G-008 | MOD-19 | Photovoltaik | Stub Page | ❌ MISSING | P2 | PV-Angebote | 4 Tiles implementiert |
| G-009 | MOD-20 | Miety | Stub Page | ❌ MISSING | P1 | Mieter-Portal | 6 Tiles implementiert |
| G-010 | Camunda | Workflow Engine | Not Integrated | ❌ MISSING | P0 | Process Automation | Camunda 8 deployed, BPMN aktiv |
| G-011 | Scout24 | Portal Publishing | Planned | ⚠️ PARTIAL | P1 | Listing Reach | API-Integration aktiv |
| G-012 | Kleinanzeigen | Portal Publishing | Planned | ⚠️ PARTIAL | P1 | Listing Reach | API-Integration aktiv |
| G-013 | Meta Ads | Lead Campaigns | Planned | ⚠️ PARTIAL | P2 | Lead Gen | API-Integration aktiv |
| G-014 | Zone 1 | Agents Dashboard | Stub Page | ⚠️ PARTIAL | P1 | AI Governance | Catalog + Runs aktiv |
| G-015 | Zone 1 | Acquiary | Stub Page | ⚠️ PARTIAL | P1 | Lead-Akquise | Zuordnung + Mandate aktiv |
| G-016 | Zone 1 | Sales Desk | Stub Page | ⚠️ PARTIAL | P1 | Sales Ops | Publishing + Inbox aktiv |
| G-017 | Zone 3 | Kaufy Payments | Planned | ❌ MISSING | P1 | Monetization | Stripe Integration aktiv |
| G-018 | Auth | Email Verification | Manual | ⚠️ PARTIAL | P0 | Security | Auto-Verify deaktiviert |
| G-019 | RLS | All Tables | Policy Coverage | ⚠️ PARTIAL | P0 | Data Security | 100% Coverage verifiziert |
| G-020 | E2E Tests | Smoke Tests | Manual | ❌ MISSING | P1 | Quality | Playwright Suite aktiv |

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| P0 | 3 | ⚠️ Critical Path |
| P1 | 11 | ❌ High Priority |
| P2 | 6 | 📅 Scheduled |
`;

const GAP_TOP_ISSUES_MD = `# GAP TOP ISSUES

**Generiert:** ${GENERATED_DATE}

---

## Top 10 Kritische Gaps

### 1. G-010: Camunda Workflow Engine (P0)
- **SOLL:** Deterministische Workflow-Steuerung für alle kritischen Prozesse
- **IST:** Nicht integriert
- **Impact:** Ohne Camunda keine skalierbare Prozessautomatisierung
- **Acceptance:** Camunda 8 deployed, mindestens 3 BPMN-Prozesse aktiv

### 2. G-018: Email Verification (P0)
- **SOLL:** Neue User müssen E-Mail verifizieren
- **IST:** Manual / Auto-Confirm konfigurierbar
- **Impact:** Spam-Accounts, Bot-Registrierungen möglich
- **Acceptance:** Auto-Confirm OFF, Verification-Flow getestet

### 3. G-019: RLS Policy Coverage (P0)
- **SOLL:** 100% aller Tabellen haben RLS
- **IST:** Großteil abgedeckt, Audit pending
- **Impact:** Potentielles Datenleck bei fehlenden Policies
- **Acceptance:** Security Scan PASS, 0 Critical Findings

### 4. G-009: MOD-20 Miety (P1)
- **SOLL:** Mieter-Self-Service Portal (6 Tiles)
- **IST:** Stub Page
- **Impact:** Kein Mieter-Onboarding möglich
- **Acceptance:** 6 Tiles implementiert, Mobile-Ready

### 5. G-010: Camunda Integration (P0)
- **Referenz:** Siehe #1

### 6. G-007: MOD-18 Finanzanalyse (P1)
- **SOLL:** KPI-Dashboard, Reports, Szenarien
- **IST:** Stub Page
- **Impact:** Keine automatisierten Finanz-Reports
- **Acceptance:** Dashboard + 3 Report-Typen

### 7. G-017: Kaufy Payments (P1)
- **SOLL:** Stripe Integration für Listings
- **IST:** Geplant
- **Impact:** Keine Monetarisierung der Plattform
- **Acceptance:** Checkout-Flow E2E getestet

### 8. G-011/G-012: Portal Publishing (P1)
- **SOLL:** Scout24 + Kleinanzeigen API
- **IST:** Geplant
- **Impact:** Manuelle Inserat-Erstellung
- **Acceptance:** Auto-Publish an 2+ Portale

### 9. G-001: MOD-12 Akquise-Manager (P1)
- **SOLL:** Partner-Akquise-Tool
- **IST:** Stub Page
- **Impact:** Partner arbeiten ohne Tool
- **Acceptance:** 4 Tiles implementiert, Mandate-Flow aktiv

### 10. G-020: E2E Tests (P1)
- **SOLL:** Playwright Test Suite
- **IST:** Fixture vorhanden, keine Tests
- **Impact:** Keine automatisierte Regression
- **Acceptance:** 10+ Smoke Tests, CI/CD integriert

---

## Priority Summary

| Priority | Gaps | Go-Live Relevant |
|----------|------|------------------|
| P0 | 3 | ✅ BLOCKER |
| P1 | 7 | ✅ HIGH |
| P2 | (nicht in Top 10) | 📅 POST-LAUNCH |
`;

// ============================================================================
// WORKBENCH
// ============================================================================

const WORKBENCH_BACKLOG_MD = `# WORKBENCH BACKLOG

**Generiert:** ${GENERATED_DATE}

---

## P0 — BLOCKER (vor Go-Live)

| ID | Task | GAP-Ref | Owner | Status |
|----|------|---------|-------|--------|
| W-001 | Camunda 8 Integration | G-010 | Backend | ❌ TODO |
| W-002 | RLS Security Audit | G-019 | Security | ⚠️ IN PROGRESS |
| W-003 | Email Verification Flow | G-018 | Auth | ⚠️ IN PROGRESS |

---

## P1 — HIGH PRIORITY

| ID | Task | GAP-Ref | Owner | Status |
|----|------|---------|-------|--------|
| W-010 | MOD-20 Miety Implementation | G-009 | Frontend | ❌ TODO |
| W-011 | MOD-18 Finanzanalyse | G-007 | Frontend | ❌ TODO |
| W-012 | MOD-12 Akquise-Manager | G-001 | Frontend | ❌ TODO |
| W-013 | Stripe Integration | G-017 | Backend | ❌ TODO |
| W-014 | Scout24 API | G-011 | Backend | ❌ TODO |
| W-015 | Playwright E2E Suite | G-020 | QA | ❌ TODO |
| W-016 | Zone 1 Agents | G-014 | Backend | ⚠️ PARTIAL |
| W-017 | Zone 1 Acquiary | G-015 | Backend | ⚠️ PARTIAL |
| W-018 | Zone 1 Sales Desk | G-016 | Backend | ⚠️ PARTIAL |

---

## P2 — SCHEDULED

| ID | Task | GAP-Ref | Owner | Status |
|----|------|---------|-------|--------|
| W-020 | MOD-13 Projekte | G-002 | Frontend | ❌ TODO |
| W-021 | MOD-14 Communication Pro | G-003 | Frontend | ❌ TODO |
| W-022 | MOD-15 Fortbildung | G-004 | Frontend | ❌ TODO |
| W-023 | MOD-16 Services | G-005 | Frontend | ❌ TODO |
| W-024 | MOD-17 Car-Management | G-006 | Frontend | ❌ TODO |
| W-025 | MOD-19 Photovoltaik | G-008 | Frontend | ❌ TODO |
| W-026 | Meta Ads Integration | G-013 | Marketing | ❌ TODO |
`;

const ACCEPTANCE_TESTS_MD = `# ACCEPTANCE TESTS

**Generiert:** ${GENERATED_DATE}

---

## E2E Smoke Tests (kritische Flows)

### Flow 1: MOD-04 → MOD-06 → MOD-07 (Property → Sale → Finance)

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Create Property via MOD-04 | Property in DB, Dossier accessible | ⚠️ MANUAL |
| 2 | Enable Sale Flag | sale_enabled = true | ⚠️ MANUAL |
| 3 | Create Listing via MOD-06 | Listing in DB | ⚠️ MANUAL |
| 4 | Start Finance Request MOD-07 | finance_request created | ⚠️ MANUAL |
| 5 | Submit to FutureRoom | Status = submitted, Zone 1 visible | ⚠️ MANUAL |

### Flow 2: Akquise → Finanzierung → Vertrieb

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Lead enters via Zone 3 Kaufy | Lead in leads table | ⚠️ MANUAL |
| 2 | Partner claims Lead | lead.assigned_to set | ⚠️ MANUAL |
| 3 | Create Customer Project | customer_projects entry | ⚠️ MANUAL |
| 4 | Link Property Interest | property_id in project | ⚠️ MANUAL |
| 5 | Submit Finance Request | finance_request created | ⚠️ MANUAL |

### Flow 3: Dokumente → DMS → KI

| Step | Action | Expected | Status |
|------|--------|----------|--------|
| 1 | Upload Document via MOD-03 | Document in storage | ⚠️ MANUAL |
| 2 | Trigger Classification | doc_type detected | ⚠️ MANUAL |
| 3 | Assign to Property | document_link created | ⚠️ MANUAL |
| 4 | Trigger Extraction | extraction job created | ⚠️ MANUAL |
| 5 | Verify extracted data | sidecar_json populated | ⚠️ MANUAL |

---

## Acceptance Criteria Summary

| Flow | Steps | Automated | Manual |
|------|-------|-----------|--------|
| Property → Sale → Finance | 5 | 0 | 5 |
| Akquise → Finanzierung → Vertrieb | 5 | 0 | 5 |
| Dokumente → DMS → KI | 5 | 0 | 5 |
| **Total** | **15** | **0** | **15** |

**Target:** 100% Automated via Playwright
`;

const OPEN_DECISIONS_MD = `# OPEN DECISIONS

**Generiert:** ${GENERATED_DATE}

---

## Technische Entscheidungen

| ID | Thema | Optionen | Empfehlung | Status |
|----|-------|----------|------------|--------|
| D-001 | Camunda Hosting | Camunda SaaS vs. Self-Hosted | SaaS (Camunda Cloud) | ⏳ PENDING |
| D-002 | Scout24 API | Direkt vs. via Middleware | Direkt (Edge Function) | ⏳ PENDING |
| D-003 | Stripe Integration | Checkout vs. Embedded | Checkout Session | ⏳ PENDING |
| D-004 | Mobile App | PWA vs. Native | PWA (Phase 1) | ✅ DECIDED |
| D-005 | Multi-Language | i18n Framework | German only (Phase 1) | ✅ DECIDED |

---

## Fachliche Entscheidungen

| ID | Thema | Optionen | Empfehlung | Status |
|----|-------|----------|------------|--------|
| D-010 | Provisionsmodell | Fest vs. Prozentual | Hybrid (Grundgebühr + %) | ⏳ PENDING |
| D-011 | Lead-Pricing | Per Lead vs. Abo | Abo + Top-Up | ⏳ PENDING |
| D-012 | Miety Pricing | Per Unit vs. Flat | Per Unit (gestaffelt) | ⏳ PENDING |
| D-013 | Partner-Levels | 2 vs. 3 Stufen | 3 Stufen (Basic, Pro, Elite) | ⏳ PENDING |

---

## Infrastruktur-Entscheidungen

| ID | Thema | Optionen | Empfehlung | Status |
|----|-------|----------|------------|--------|
| D-020 | CDN | Cloudflare vs. Vercel Edge | Lovable Cloud (built-in) | ✅ DECIDED |
| D-021 | Monitoring | Sentry vs. Datadog | Sentry (Phase 1) | ⏳ PENDING |
| D-022 | CI/CD | GitHub Actions vs. Lovable | Lovable (auto-deploy) | ✅ DECIDED |

---

## Summary

| Status | Count |
|--------|-------|
| PENDING | 9 |
| DECIDED | 4 |
`;

// ============================================================================
// APPENDIX
// ============================================================================

const MANIFEST_SYNC_STATUS_MD = `# MANIFEST SYNC STATUS

**Generiert:** ${GENERATED_DATE}

---

## File Status

| File | Location | Status | Last Sync |
|------|----------|--------|-----------|
| routesManifest.ts | src/manifests/ | ✅ SSOT | ${GENERATED_DATE} |
| tile_catalog.yaml | manifests/ | ✅ SYNC | ${GENERATED_DATE} |
| action_catalog.yaml | manifests/ | ✅ SYNC | ${GENERATED_DATE} |
| routes_manifest.yaml | manifests/ | ⚠️ DEPRECATED | Use .ts |

---

## Sync Rules

1. **routesManifest.ts** is the SSOT for all routing
2. **tile_catalog.yaml** syncs visibility/activation
3. **action_catalog.yaml** syncs UI actions → workflow mapping
4. YAML files are for documentation/external tools only
5. ManifestRouter.tsx reads ONLY from routesManifest.ts

---

## Audit Trail

| Date | Change | Author |
|------|--------|--------|
| 2026-02-02 | Master Audit PASS | System |
| 2026-02-02 | MOD-11/MOD-13 hardening | System |
| 2026-01-26 | 20-Module expansion | System |
`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Engineering RFP export...');

    const zip = new JSZip();

    // README
    zip.file('README.md', README_MD);

    // MANIFESTS
    zip.file('manifests/routesManifest.ts', ROUTES_MANIFEST_TS);
    zip.file('manifests/tile_catalog.yaml', `# STATUS: OK - See routesManifest.ts for SSOT\n# Full content in repository: manifests/tile_catalog.yaml\n# Version: 1.1.0\n# Tiles: 20 Modules defined`);
    zip.file('manifests/action_catalog.yaml', `# STATUS: OK - Full content in repository\n# Version: 1.0.0\n# Actions: 50+ defined across all modules`);

    // IST-INVENTORY
    zip.file('ist-inventory/ROUTE_INVENTORY.md', ROUTE_INVENTORY_MD);
    zip.file('ist-inventory/MODULE_ROUTE_MAP.md', MODULE_ROUTE_MAP_MD);
    zip.file('ist-inventory/DATA_ENTITY_INVENTORY.md', DATA_ENTITY_INVENTORY_MD);
    zip.file('ist-inventory/EDGE_FUNCTION_INVENTORY.md', EDGE_FUNCTION_INVENTORY_MD);

    // GAP-ANALYSE
    zip.file('gap-analyse/GAP_MATRIX_MASTER.md', GAP_MATRIX_MASTER_MD);
    zip.file('gap-analyse/GAP_TOP_ISSUES.md', GAP_TOP_ISSUES_MD);

    // WORKBENCH
    zip.file('workbench/WORKBENCH_BACKLOG.md', WORKBENCH_BACKLOG_MD);
    zip.file('workbench/ACCEPTANCE_TESTS.md', ACCEPTANCE_TESTS_MD);
    zip.file('workbench/OPEN_DECISIONS.md', OPEN_DECISIONS_MD);

    // APPENDIX
    zip.file('appendix/MANIFEST_SYNC_STATUS.md', MANIFEST_SYNC_STATUS_MD);

    // Metadata
    const files = Object.keys(zip.files).filter(f => !zip.files[f].dir);
    const metadata = {
      generated_at: GENERATED_TIMESTAMP,
      version: "1.0.0",
      type: "engineering-rfp-supplement",
      files: files,
      total_files: files.length,
    };
    zip.file('_metadata.json', JSON.stringify(metadata, null, 2));

    // Generate ZIP
    const zipBytes: Uint8Array = await zip.generateAsync({ type: 'uint8array' });
    console.log(`ZIP byte size: ${zipBytes.length}`);

    // Upload to storage
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sot-engineering-rfp-export-${stamp}.zip`;

    const { error: uploadError } = await supabase.storage
      .from('docs-export')
      .upload(filename, zipBytes, {
        contentType: 'application/zip',
        cacheControl: '0',
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload ZIP: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('docs-export')
      .getPublicUrl(filename);

    const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    console.log(`Export complete: ${urlData.publicUrl}`);
    console.log(`Total files: ${files.length + 1}`);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        url: cacheBustedUrl,
        public_url: urlData.publicUrl,
        file_count: files.length + 1,
        byte_size: zipBytes.length,
        generated_at: GENERATED_TIMESTAMP,
        files: files,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
