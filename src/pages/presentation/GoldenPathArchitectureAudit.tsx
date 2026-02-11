/**
 * PRESENTATION MODE — Architecture Audit: Zones / Manifests / Contracts
 * READ-ONLY ANALYSIS — No business logic, no data mutation
 */
import React from 'react';

export default function GoldenPathArchitectureAudit() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* HEADER */}
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Architektur-Inventur: Zonen / Manifests / Contracts</h1>
        <p className="text-muted-foreground mt-2">Phase 1 — Ist-Zustand-Analyse (read-only, keine Implementierung)</p>
        <p className="text-xs text-muted-foreground mt-1">Stand: 2026-02-11 | Repo-weite Analyse</p>
      </header>

      {/* SEKTION 1 — Executive Summary */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Sektion 1 — Executive Summary</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Zone-Definition vorhanden:</strong> JA — <code className="bg-muted px-1 rounded text-xs">spec/current/01_platform/ZONE_OVERVIEW.md</code> + <code className="bg-muted px-1 rounded text-xs">docs/architecture/ZONE_OVERVIEW.md</code> (Mermaid-Diagramm + Regeln)</li>
          <li><strong>Programmatisches Zone-Modell:</strong> JA — <code className="bg-muted px-1 rounded text-xs">src/manifests/routesManifest.ts</code> exportiert <code>zone1Admin</code>, <code>zone2Portal</code>, <code>zone3Websites</code> als typisierte <code>ZoneDefinition</code></li>
          <li><strong>Top-5 Manifest-SSOTs:</strong> routesManifest.ts, armstrongManifest.ts, areaConfig.ts, rolesMatrix.ts, tile_catalog (DB)</li>
          <li><strong>API-Contracts vorhanden:</strong> JA — <code className="bg-muted px-1 rounded text-xs">spec/current/06_api_contracts/module_api_overview.md</code> (alle 20 Module, Status: PLANNED) + <code className="bg-muted px-1 rounded text-xs">docs/modules/MOD-06_08_SHARED_DOMAIN_AND_APIS.md</code> (implementierungsnah)</li>
          <li><strong>Cross-Zone Handoffs:</strong> 5 Admin-Desks (Sales Desk, FutureRoom, Acquiary, Lead Pool, Partner Verification) mit definierten Intake-Flows</li>
          <li><strong>Onboarding-Trigger:</strong> <code className="bg-muted px-1 rounded text-xs">on_auth_user_created</code> → auto-creates Org + Profile + Membership + Tile-Aktivierung</li>
          <li><strong>Top-3 Doppel-SSOT Risiken:</strong> (1) rolesMatrix.ts vs. DB-Funktion <code>get_tiles_for_role()</code>, (2) ZONE_OVERVIEW.md in spec/ UND docs/, (3) tile_catalog (DB) vs. routesManifest.ts Module-Liste</li>
          <li><strong>Camunda/Workflow-Engine:</strong> GEPLANT in <code>MIGRATION_TAKTIK_PLAN.txt</code>, aber <strong>nicht implementiert</strong> — alle Camunda-Hooks sind "Deferred"</li>
        </ul>
      </section>

      {/* SEKTION 2 — Zone 1/2/3 Inventur */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Sektion 2 — Zone 1 / Zone 2 / Zone 3 Inventur</h2>
        
        {/* Zone 1 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-blue-400">Zone 1 — Admin / Governance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left border-b border-border">Aspekt</th>
                  <th className="p-2 text-left border-b border-border">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border"><td className="p-2 font-medium">Base-Route</td><td className="p-2"><code>/admin</code></td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Layout</td><td className="p-2">AdminLayout (AdminSidebar + Content)</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Zugang</td><td className="p-2"><code>platform_admin</code> only</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Route-Count</td><td className="p-2">~50 Routes (inkl. Sub-Items für Desks)</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">SSOT-Quelle</td><td className="p-2"><code>routesManifest.ts → zone1Admin</code></td></tr>
                <tr className="border-b border-border">
                  <td className="p-2 font-medium">Sub-Desks</td>
                  <td className="p-2">
                    Sales Desk (4 Sub), FutureRoom (5 Sub), Acquiary (7 Sub), Armstrong Console (7 Sub), Social Media (7 Sub), Agents (4 Sub)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2 font-medium">Governance-Seiten</td>
                  <td className="p-2">Tile Catalog, Integrations, Oversight, Audit Hub, Lead Pool, Roles, Agreements, Commissions</td>
                </tr>
                <tr><td className="p-2 font-medium">Doku-SSOT</td><td className="p-2"><code>docs/architecture/ZONE_OVERVIEW.md</code>, <code>docs/architecture/ZONE1_ADMIN_ROUTES.md</code></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone 2 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-400">Zone 2 — User Portal (21 Module: MOD-00 bis MOD-20)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left border-b border-border">Aspekt</th>
                  <th className="p-2 text-left border-b border-border">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border"><td className="p-2 font-medium">Base-Route</td><td className="p-2"><code>/portal</code></td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Layout</td><td className="p-2">PortalLayout (SystemBar + PortalNav + Content)</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Zugang</td><td className="p-2">Authentifizierte User mit Tenant-Kontext</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Module</td><td className="p-2">21 Module (MOD-00 Dashboard bis MOD-20 Miety)</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Nav-Gruppierung</td><td className="p-2">4 Areas: Missions, Operations, Base, Services (<code>areaConfig.ts</code>)</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Tile-Pattern</td><td className="p-2">4 Tiles pro Modul (Ausnahme: MOD-20 = 6 Tiles)</td></tr>
                <tr className="border-b border-border"><td className="p-2 font-medium">Rollen-Gating</td><td className="p-2">14 Base-Module + Spezial-Tiles per Rolle (<code>rolesMatrix.ts</code> + <code>get_tiles_for_role()</code>)</td></tr>
                <tr><td className="p-2 font-medium">SSOT-Quelle</td><td className="p-2"><code>routesManifest.ts → zone2Portal</code></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone 3 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-yellow-400">Zone 3 — Websites (Öffentlich)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left border-b border-border">Website</th>
                  <th className="p-2 text-left border-b border-border">Base</th>
                  <th className="p-2 text-left border-b border-border">Routes</th>
                  <th className="p-2 text-left border-b border-border">Lead-Capture</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border"><td className="p-2">Kaufy</td><td className="p-2"><code>/kaufy</code></td><td className="p-2">10 (Home, Suche, Ratgeber, etc.)</td><td className="p-2">Ja (ArmstrongWidget + Formulare)</td></tr>
                <tr className="border-b border-border"><td className="p-2">Miety</td><td className="p-2"><code>/miety</code></td><td className="p-2">8 (Home, Leistungen, Vermieter, etc.)</td><td className="p-2">Ja (Registrierung, Invite)</td></tr>
                <tr className="border-b border-border"><td className="p-2">FutureRoom</td><td className="p-2"><code>/futureroom</code></td><td className="p-2">4 (Home, Bonität, Karriere, FAQ)</td><td className="p-2">Nein</td></tr>
                <tr className="border-b border-border"><td className="p-2">SoT</td><td className="p-2"><code>/sot</code></td><td className="p-2">8 (Home, Produkt, Module, Demo, etc.)</td><td className="p-2">Ja (Demo-Request)</td></tr>
                <tr className="border-b border-border"><td className="p-2">Acquiary</td><td className="p-2"><code>/acquiary</code></td><td className="p-2">5 (Home, Methodik, Objekt anbieten)</td><td className="p-2">Ja (<code>public-lead-capture</code> Edge Fn)</td></tr>
                <tr><td className="p-2">Projekt-Landing</td><td className="p-2"><code>/projekt/:slug</code></td><td className="p-2">1 (dynamisch)</td><td className="p-2">Ja (Kontaktformular)</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">SSOT-Quelle: <code>routesManifest.ts → zone3Websites</code> | Doku: <code>docs/zone3/ZONE3_MASTER_CONCEPT.md</code> (FROZEN)</p>
        </div>
      </section>

      {/* SEKTION 3 — Manifests / Registries */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Sektion 3 — Manifests / Registries (SSOT-Inventur)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left border-b border-border">Artefakt</th>
                <th className="p-2 text-left border-b border-border">Pfad</th>
                <th className="p-2 text-left border-b border-border">Zweck</th>
                <th className="p-2 text-left border-b border-border">Zone</th>
                <th className="p-2 text-left border-b border-border">SSOT?</th>
                <th className="p-2 text-left border-b border-border">Konsumenten</th>
                <th className="p-2 text-left border-b border-border">Konflikt</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Routes Manifest</td>
                <td className="p-2"><code>src/manifests/routesManifest.ts</code></td>
                <td className="p-2">Alle Routen aller 3 Zonen (Zone-Typen, Module, Tiles, Legacy)</td>
                <td className="p-2">Z1+Z2+Z3</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">ManifestRouter, AdminSidebar, PortalNav, devValidator, inAppAuditRunner</td>
                <td className="p-2 text-yellow-400">mittel (tile_catalog DB muss synchron sein)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Area Config</td>
                <td className="p-2"><code>src/manifests/areaConfig.ts</code></td>
                <td className="p-2">4 Nav-Areas (Missions, Operations, Base, Services) + Modul-Zuordnung</td>
                <td className="p-2">Z2</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">PortalNav, AreaOverview, deriveAreaFromPath</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Armstrong Manifest</td>
                <td className="p-2"><code>src/manifests/armstrongManifest.ts</code></td>
                <td className="p-2">45+ KI-Actions (Code, Zone, Rollen, Consent, Side-Effects)</td>
                <td className="p-2">Z1+Z2+Z3</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">Armstrong Console, sot-armstrong-advisor Edge Fn, ArmstrongWidget</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Roles Matrix</td>
                <td className="p-2"><code>src/constants/rolesMatrix.ts</code></td>
                <td className="p-2">6 Rollen, 21 Module, Tile-Sets, Frontend-Spiegel von get_tiles_for_role()</td>
                <td className="p-2">Z1+Z2</td>
                <td className="p-2 text-yellow-400">DUAL</td>
                <td className="p-2">RolesManagement, useModuleAccess, PortalNav</td>
                <td className="p-2 text-red-400 font-bold">HOCH (DB + Code müssen synchron sein)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Tile Catalog (DB)</td>
                <td className="p-2"><code>tile_catalog</code> (Supabase Table)</td>
                <td className="p-2">DB-Tabelle: Tile-Codes, Labels, Routes, Sub-Tiles, Activation</td>
                <td className="p-2">Z1→Z2</td>
                <td className="p-2 text-yellow-400">DUAL</td>
                <td className="p-2">TileCatalog Admin Page, tenant_tile_activation, get_tiles_for_role()</td>
                <td className="p-2 text-red-400 font-bold">HOCH (muss mit routesManifest synchron sein)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Golden Paths</td>
                <td className="p-2"><code>src/manifests/goldenPaths/</code></td>
                <td className="p-2">Deklarative GP-Definitionen (bisher nur MOD-04)</td>
                <td className="p-2">Z2</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">useGoldenPath, GoldenPathGuard (nicht eingebunden)</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Storage Manifest</td>
                <td className="p-2"><code>src/config/storageManifest.ts</code></td>
                <td className="p-2">DMS-Baumstruktur pro Modul (20 Module, Ordner-Definitionen)</td>
                <td className="p-2">Z2</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">FileManager, FinanceStorageTree, MillerColumns</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Integration Registry (DB)</td>
                <td className="p-2"><code>integration_registry</code> (Supabase Table)</td>
                <td className="p-2">Externe API-Registrierung (Codes, Auth-Type, URLs, Guardrails)</td>
                <td className="p-2">Z1</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">Integrations Admin Page, ArmstrongIntegrations, Widget-EdgeFunctions</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Armstrong Policies (DB)</td>
                <td className="p-2"><code>armstrong_policies</code> (Supabase Table)</td>
                <td className="p-2">Governance-Policies für KI-Aktionen (Category, Version, Status)</td>
                <td className="p-2">Z1</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">ArmstrongPolicies Admin, sot-armstrong-advisor</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Knowledge Base (DB)</td>
                <td className="p-2"><code>armstrong_knowledge_items</code> (Supabase Table)</td>
                <td className="p-2">7 Kategorien: system, legal, immobilien, finanzierung, etc.</td>
                <td className="p-2">Z1</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">ArmstrongKnowledge Admin, sot-armstrong-advisor (RAG)</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Agreement Templates (DB)</td>
                <td className="p-2"><code>agreement_templates</code> (Supabase Table)</td>
                <td className="p-2">Consent-Vorlagen (SALES_MANDATE, DATA_SHARING, etc.)</td>
                <td className="p-2">Z1→Z2</td>
                <td className="p-2 text-green-400 font-bold">JA</td>
                <td className="p-2">Agreements Admin, VerkaufsauftragTab, user_consents</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Module API Overview</td>
                <td className="p-2"><code>spec/current/06_api_contracts/module_api_overview.md</code></td>
                <td className="p-2">API-Contract-Plan für alle 20 Module (PLANNED, nicht implementiert)</td>
                <td className="p-2">Z1+Z2</td>
                <td className="p-2 text-yellow-400">GEPLANT</td>
                <td className="p-2">Kein Code-Konsument (nur Referenz)</td>
                <td className="p-2 text-green-400">niedrig</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SEKTION 4 — Cross-Zone Contracts / Handoffs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Sektion 4 — Cross-Zone Contracts / Handoffs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left border-b border-border">Contract / Handoff</th>
                <th className="p-2 text-left border-b border-border">Fundstelle</th>
                <th className="p-2 text-left border-b border-border">Direction</th>
                <th className="p-2 text-left border-b border-border">IDs / Correlation</th>
                <th className="p-2 text-left border-b border-border">SoT-Regel</th>
                <th className="p-2 text-left border-b border-border">Typ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Finance Submit → FutureRoom</td>
                <td className="p-2"><code>src/hooks/useSubmitFinanceRequest.ts</code></td>
                <td className="p-2">Z2 (MOD-07) → Z1 (FutureRoom)</td>
                <td className="p-2">finance_request_id, status: <code>submitted_to_zone1</code></td>
                <td className="p-2">Status-Enum als Contract</td>
                <td className="p-2">Code</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">FutureRoom → Finance Manager</td>
                <td className="p-2"><code>src/pages/admin/futureroom/FutureRoomZuweisung.tsx</code></td>
                <td className="p-2">Z1 (FutureRoom) → Z2 (MOD-11)</td>
                <td className="p-2">finance_manager_user_id, mandate_id</td>
                <td className="p-2">Assignment-Flow</td>
                <td className="p-2">Code</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Akquise Mandat Submit → Acquiary</td>
                <td className="p-2"><code>src/hooks/useAcqMandate.ts</code></td>
                <td className="p-2">Z2 (MOD-08) → Z1 (Acquiary)</td>
                <td className="p-2">mandate_id, status: <code>submitted_to_zone1</code></td>
                <td className="p-2">Status-Enum als Contract</td>
                <td className="p-2">Code</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Acquiary → Akquise Manager</td>
                <td className="p-2"><code>src/pages/admin/acquiary/AcquiaryInbox.tsx</code></td>
                <td className="p-2">Z1 (Acquiary) → Z2 (MOD-12)</td>
                <td className="p-2">assigned_manager_user_id, mandate_id</td>
                <td className="p-2">Assignment-Flow</td>
                <td className="p-2">Code</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Lead Capture → Lead Pool</td>
                <td className="p-2"><code>src/pages/zone3/acquiary/AcquiaryObjekt.tsx</code>, Edge Fn: <code>public-lead-capture</code></td>
                <td className="p-2">Z3 → Z1 (Lead Pool)</td>
                <td className="p-2">lead_id, source, zone1_pool=true</td>
                <td className="p-2">Edge Function + 24h Dedup</td>
                <td className="p-2">Code + SQL</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Lead Pool → Partner</td>
                <td className="p-2"><code>src/pages/admin/LeadPool.tsx</code></td>
                <td className="p-2">Z1 (Lead Pool) → Z2 (MOD-10)</td>
                <td className="p-2">lead_id, lead_assignment_id, partner_org_id</td>
                <td className="p-2">TermsGate before visibility</td>
                <td className="p-2">Code</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Verkaufsauftrag → Sales Desk</td>
                <td className="p-2"><code>src/components/portfolio/VerkaufsauftragTab.tsx</code></td>
                <td className="p-2">Z2 (MOD-04) → Z1 (Sales Desk)</td>
                <td className="p-2">listing_id, sales_mandate_consent_id</td>
                <td className="p-2">Feature-Flag + Consent-Gate</td>
                <td className="p-2">Code</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Listing Publish → Kaufy (Z3)</td>
                <td className="p-2"><code>docs/modules/MOD-06_08_SHARED_DOMAIN_AND_APIS.md</code></td>
                <td className="p-2">Z2 (MOD-06) → Z3 (Kaufy)</td>
                <td className="p-2">listing_id, listing_publications.channel=kaufy</td>
                <td className="p-2">Publication-Status-Flow</td>
                <td className="p-2">Code + Doku</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Partner Network Publish</td>
                <td className="p-2"><code>listing_publications</code> (DB), MOD-06_08 Shared APIs</td>
                <td className="p-2">Z2 (MOD-06) → Z2 (MOD-09)</td>
                <td className="p-2">listing_id, channel=partner_network</td>
                <td className="p-2">partner_visible Flag</td>
                <td className="p-2">Code + Doku</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Org Delegations</td>
                <td className="p-2"><code>org_delegations</code> (DB), <code>src/pages/admin/Delegations.tsx</code></td>
                <td className="p-2">Z1 → Z2 (Cross-Tenant)</td>
                <td className="p-2">delegate_org_id, target_org_id, scopes, status</td>
                <td className="p-2">active/revoked/expired Enum</td>
                <td className="p-2">Code + SQL</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">Onboarding (Auto-Tenant)</td>
                <td className="p-2"><code>supabase/migrations/*on_auth_user_created*</code></td>
                <td className="p-2">Auth → Z2 (auto)</td>
                <td className="p-2">user_id → org_id + profile_id + membership</td>
                <td className="p-2">Trigger-Chain + get_tiles_for_role()</td>
                <td className="p-2">SQL</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-medium">MOD-06/08 Shared Domain</td>
                <td className="p-2"><code>docs/modules/MOD-06_08_SHARED_DOMAIN_AND_APIS.md</code></td>
                <td className="p-2">Z2 (MOD-06) ↔ Z2 (MOD-08/09)</td>
                <td className="p-2">Consent Gates: SALES_MANDATE, COMMISSION_AGREEMENT, DATA_SHARING</td>
                <td className="p-2">Audit Events standardisiert</td>
                <td className="p-2">Doku</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Investment Engine Contract</td>
                <td className="p-2"><code>docs/modules/MOD-06_08_SHARED_DOMAIN_AND_APIS.md</code> §4</td>
                <td className="p-2">Z2 (MOD-08) → Edge Fn</td>
                <td className="p-2">Input/Output JSON Schema definiert</td>
                <td className="p-2">Edge Function: sot-investment-engine</td>
                <td className="p-2">Doku + Code</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SEKTION 5 — SQL/Trigger/Migrations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Sektion 5 — SQL/Trigger/Migrations (architektur-relevant)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left border-b border-border">Trigger / Funktion</th>
                <th className="p-2 text-left border-b border-border">Migration</th>
                <th className="p-2 text-left border-b border-border">Entity</th>
                <th className="p-2 text-left border-b border-border">Zweck</th>
                <th className="p-2 text-left border-b border-border">Zone/Modul</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-2"><code>on_auth_user_created</code></td>
                <td className="p-2">20260210111603</td>
                <td className="p-2">auth.users</td>
                <td className="p-2">Auto-Onboarding: Org + Profile + Membership + Tile-Aktivierung</td>
                <td className="p-2">Auth → Z2</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2"><code>trg_set_*_public_id</code> (6x)</td>
                <td className="p-2">20260123203544</td>
                <td className="p-2">organizations, properties, units, contacts, documents, finance_packages</td>
                <td className="p-2">Public-ID-Generierung (SOT-PREFIX-BASE32)</td>
                <td className="p-2">Alle Zonen</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2"><code>create_property_folder_trigger</code></td>
                <td className="p-2">20260128015854</td>
                <td className="p-2">properties</td>
                <td className="p-2">Auto-DMS-Ordnerstruktur bei Property-Anlage</td>
                <td className="p-2">Z2 MOD-04</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2"><code>create_unit_folder_trigger</code></td>
                <td className="p-2">20260128015854</td>
                <td className="p-2">units</td>
                <td className="p-2">Auto-DMS-Ordnerstruktur bei Unit-Anlage</td>
                <td className="p-2">Z2 MOD-04</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2"><code>tr_cars_vehicles_public_id</code></td>
                <td className="p-2">20260206183444</td>
                <td className="p-2">cars_vehicles</td>
                <td className="p-2">Public-ID für Fahrzeuge</td>
                <td className="p-2">Z2 MOD-17</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2"><code>tr_cars_claims_public_id</code></td>
                <td className="p-2">20260206183444</td>
                <td className="p-2">cars_claims</td>
                <td className="p-2">Public-ID für Schadensfälle</td>
                <td className="p-2">Z2 MOD-17</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2"><code>get_tiles_for_role(p_role)</code></td>
                <td className="p-2">20260210111603</td>
                <td className="p-2">tile_catalog</td>
                <td className="p-2">Gibt Tile-Codes für eine Rolle zurück (SSOT für Modul-Aktivierung)</td>
                <td className="p-2">Z1 → Z2</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2"><code>get_user_tenant_id()</code></td>
                <td className="p-2">Diverse</td>
                <td className="p-2">profiles</td>
                <td className="p-2">SECURITY DEFINER — Tenant-ID ohne RLS-Rekursion</td>
                <td className="p-2">Alle (RLS)</td>
              </tr>
              <tr>
                <td className="p-2"><code>seed_golden_path_data()</code></td>
                <td className="p-2">Diverse (13 Migrationen)</td>
                <td className="p-2">Diverse</td>
                <td className="p-2">Dev-Testdaten-Generator für E2E Golden Path</td>
                <td className="p-2">Z1 Admin</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">Hinweis: ~20 weitere <code>update_*_updated_at</code> Trigger existieren (Standard-Pattern, nicht architektur-relevant).</p>
      </section>

      {/* SEKTION 6 — Risiken */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Sektion 6 — Risiken: Doppel-SSOT / Drift</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left border-b border-border">ID</th>
                <th className="p-2 text-left border-b border-border">Beschreibung</th>
                <th className="p-2 text-left border-b border-border">Beteiligte Fundstellen</th>
                <th className="p-2 text-left border-b border-border">Prio</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-2 font-mono font-bold text-red-400">R-001</td>
                <td className="p-2">Roles Matrix: Frontend-Code (<code>rolesMatrix.ts</code>) und DB-Funktion (<code>get_tiles_for_role()</code>) definieren beide die Tile-Zuordnung. Änderung in einer Quelle ohne die andere = Drift.</td>
                <td className="p-2"><code>src/constants/rolesMatrix.ts</code> + DB-Funktion <code>get_tiles_for_role</code></td>
                <td className="p-2 text-red-400 font-bold">HOCH</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-mono font-bold text-red-400">R-002</td>
                <td className="p-2">Tile Catalog (DB) vs. Routes Manifest (Code): Beide definieren Modul-Routen und Tile-Pfade. <code>inAppAuditRunner.ts</code> prüft Synchronität, aber kein automatischer Sync.</td>
                <td className="p-2"><code>tile_catalog</code> (DB) + <code>routesManifest.ts</code></td>
                <td className="p-2 text-red-400 font-bold">HOCH</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-mono font-bold text-yellow-400">R-003</td>
                <td className="p-2">ZONE_OVERVIEW.md existiert doppelt: einmal in <code>spec/current/01_platform/</code> und einmal in <code>docs/architecture/</code>. Inhalt kann divergieren.</td>
                <td className="p-2"><code>spec/current/01_platform/ZONE_OVERVIEW.md</code> + <code>docs/architecture/ZONE_OVERVIEW.md</code></td>
                <td className="p-2 text-yellow-400 font-bold">MITTEL</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-mono font-bold text-yellow-400">R-004</td>
                <td className="p-2">API-Contract-Plan (<code>module_api_overview.md</code>) definiert Endpoints die nicht existieren. Kein Abgleich-Mechanismus zwischen Plan und Implementation.</td>
                <td className="p-2"><code>spec/current/06_api_contracts/module_api_overview.md</code></td>
                <td className="p-2 text-yellow-400 font-bold">MITTEL</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-mono font-bold text-yellow-400">R-005</td>
                <td className="p-2">Handoff-Status-Enums (<code>submitted_to_zone1</code>, <code>ready_for_handoff</code>) sind in DB-Enums definiert aber nicht als expliziter Cross-Zone-Contract dokumentiert.</td>
                <td className="p-2">DB Enums: <code>acq_mandate_status</code>, <code>finance_case_status</code></td>
                <td className="p-2 text-yellow-400 font-bold">MITTEL</td>
              </tr>
              <tr>
                <td className="p-2 font-mono text-green-400">R-006</td>
                <td className="p-2">Shared Domain Doku (<code>MOD-06_08_SHARED_DOMAIN_AND_APIS.md</code>) definiert Audit-Events und Consent-Gates die teilweise implementiert, teilweise nur geplant sind.</td>
                <td className="p-2"><code>docs/modules/MOD-06_08_SHARED_DOMAIN_AND_APIS.md</code></td>
                <td className="p-2 text-green-400">NIEDRIG</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        <p>Architektur-Inventur — Phase 1 Analyse | Keine Code-Änderungen durchgeführt</p>
        <p className="mt-1">Keywords durchsucht: zone, manifest, routesManifest, tile_catalog, contract, handoff, delegate, workflow, sales-desk, futureroom, acquiary, public_id, frozen, ADR</p>
      </footer>
    </div>
  );
}
