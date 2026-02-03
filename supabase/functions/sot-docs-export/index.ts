import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// EMBEDDED DOCUMENTATION CONTENT
// These files are embedded at build time since Edge Functions cannot access
// the repository filesystem at runtime.
// ============================================================================

const DOCS_CONTENT: Record<string, string> = {
  // ==================== RFP Package ====================
  "rfp/00_EXECUTIVE_SUMMARY.md": `# EXECUTIVE SUMMARY — System of a Town (SoT)

**Datum:** ${new Date().toISOString().split('T')[0]}
**Version:** Export v1.0

---

## Projektübersicht

System of a Town (SoT) ist eine modulare Immobilienverwaltungs- und Vertriebsplattform mit 3-Zonen-Architektur:

- **Zone 1 (Admin/Governance):** Plattform-Steuerung, Tenant-Management, Oversight
- **Zone 2 (User Portal):** 20 operative Module für Vermieter, Partner, Käufer
- **Zone 3 (Websites):** Öffentliche Marktplätze (Kaufy, Miety) und Lead-Capture

## Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| Backend | Supabase (Lovable Cloud) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Edge Functions | Deno |

## Module (Zone 2)

| MOD | Name | Status |
|-----|------|--------|
| 01 | Stammdaten | Active |
| 02 | KI Office | Active |
| 03 | DMS | Active |
| 04 | Immobilien | Active (SSOT) |
| 05 | MSV | Active |
| 06 | Verkauf | Active |
| 07 | Finanzierung | Active |
| 08 | Investment-Suche | Active |
| 09 | Vertriebspartner | Addon |
| 10 | Leadgenerierung | Addon |
| 11-20 | Zusatzmodule | Planned |

---

*Dieses Dokument wurde automatisch generiert.*
`,

  "rfp/01_GLOSSAR.md": `# GLOSSAR

| Begriff | Definition |
|---------|------------|
| **Lovable** | Tool/Arbeitsmodus (KI-Editor) |
| **System of a Town (SoT)** | Verwaltungs-/KI-Software (Zone 1 + Zone 2) |
| **Kaufy** (mit y) | Marktplatz-Marke (Zone 3 Website) + Channel/Source-Name |
| **Miety** | Mieter-App (Renter Portal) |
| **Future Room** | Externes Finanzierungssystem |
| **SSOT** | Single Source of Truth |
| **Tenant** | Mandant/Organisation im System |
| **RLS** | Row Level Security (Postgres) |
| **MOD-XX** | Modul-Bezeichnung (z.B. MOD-04 = Immobilien) |
`,

  // ==================== Spec Files ====================
  "spec/00_frozen/MODULE_BLUEPRINT.md": `# System of a Town — Modul-Blueprint

> **Datum**: 2026-01-26  
> **Version**: 2.1 (10 Module, Kaufy-Korrektur)  
> **Status**: FROZEN  
> **Zweck**: Verbindliches Gerüst für Zone 1 (Admin) und Zone 2 (User Portal mit 10 Modulen)

---

## GLOSSAR (FROZEN)

| Begriff | Definition |
|---------|------------|
| **Lovable** | Name des Tools/Arbeitsmodus (ohne "e") |
| **System of a Town (SoT)** | Verwaltungs-/KI-Software (Zone 1 + Zone 2) |
| **Kaufy** (mit y) | Marktplatz-Marke (Zone 3 Website) + Channel/Source-Name in Zone 2 |
| **Miety** | Mieter-App (Renter Portal) — Andockpunkt aus MOD-05, nicht bauen |

---

## Übersicht

| Zone | Zweck | Anzahl Bereiche | Anzahl Routen |
|------|-------|-----------------|---------------|
| **Zone 1** | Admin-Portal (Steuerzentrale) | 12 Sektionen | ~20 Routen |
| **Zone 2** | User-Portal (10 Module) | 10 Module | 50 Routen (10×5) |
| **Zone 3** | Websites (Kaufy, Landingpages) | 2 Bereiche | ~10 Routen |

---

## MARKEN- & ZUGRIFFSLOGIK (FROZEN)

### Registrierungswege

| Registrierung über | Sichtbare Module | Zielgruppe |
|--------------------|------------------|------------|
| **SoT** (System of a Town) | MOD-01 bis MOD-08 | Vermieter, Portfoliohalter, KI-Verwaltung |
| **Kaufy** (Marktplatz) | MOD-01 bis MOD-10 | Kapitalanlageberater, Finanzvertriebe, Aufteiler, Bauträger |

---

## Zone 2 — 10 Module (FROZEN)

| MOD | Name | Typ | Sichtbarkeit | Route-Prefix | Spec-Status |
|-----|------|-----|--------------|--------------|-------------|
| 01 | Stammdaten | Core | Alle | \`/portal/stammdaten\` | COMPLETE |
| 02 | KI Office | Core | Alle | \`/portal/office\` | COMPLETE |
| 03 | DMS | Core | Alle | \`/portal/dms\` | COMPLETE |
| 04 | Immobilien | Core | Alle | \`/portal/immobilien\` | COMPLETE |
| 05 | MSV | Freemium | Alle | \`/portal/msv\` | COMPLETE |
| 06 | Verkauf | Standard | Alle | \`/portal/verkauf\` | COMPLETE |
| 07 | Finanzierung | Standard | Alle | \`/portal/finanzierung\` | COMPLETE |
| 08 | Investment-Suche / Ankauf | Standard | Alle | \`/portal/investments\` | COMPLETE |
| 09 | Vertriebspartner | Addon | Kaufy-Registrierte | \`/portal/vertriebspartner\` | COMPLETE |
| 10 | Leadgenerierung | Addon | Kaufy-Registrierte | \`/portal/leads\` | COMPLETE |
`,

  "spec/00_frozen/SOFTWARE_FOUNDATION.md": `# SOFTWARE FOUNDATION

**Projekt:** System of a Town (SoT)  
**Version:** v1.0 FROZEN  
**Datum:** 2026-01-26

---

## 1. Markenlogik

| Marke | Definition | Zone | Modulname erlaubt? |
|-------|------------|------|--------------------|
| **Lovable** | Tool/Arbeitsmodus (ohne "e") | — | — |
| **System of a Town (SoT)** | Verwaltungs-/KI-Software | Zone 1 + 2 | Ja |
| **Kaufy** (mit y) | Marktplatz-Marke | Zone 3 + Channel | **NEIN** |
| **Miety** | Mieter-App (Andockpunkt) | Extern | Nein |
| **Future Room** | Externes Finanzierungssystem | Extern | Nein |

---

## 2. 10-Modul-Architektur

| MOD | Name | Typ | Route-Prefix | API-Range |
|-----|------|-----|--------------|-----------|
| 01 | Stammdaten | Core | \`/portal/stammdaten\` | — |
| 02 | KI Office | Core | \`/portal/office\` | INTERNAL-001 |
| 03 | DMS | Core | \`/portal/dms\` | — |
| 04 | Immobilien | Core | \`/portal/immobilien\` | API-700..799 |
| 05 | MSV | Freemium | \`/portal/msv\` | API-800..899 |
| 06 | Verkauf | Standard | \`/portal/verkauf\` | API-200..299 |
| 07 | Finanzierung | Standard | \`/portal/finanzierung\` | API-600..699 |
| 08 | Investment-Suche | Standard | \`/portal/investments\` | API-400..499 |
| 09 | Vertriebspartner | Addon | \`/portal/vertriebspartner\` | API-300..399 |
| 10 | Leadgenerierung | Addon | \`/portal/leads\` | API-500..599 |

---

## 3. Architektur-Invarianten

1. **Tenant-Isolation**: Alle Business-Daten haben \`tenant_id\` FK
2. **RLS überall**: Keine Tabelle ohne Row Level Security
3. **Audit-Pflicht**: Kritische Aktionen → \`audit_events\`
4. **Consent-Gates**: Rechtlich relevante Aktionen → \`user_consents\`
5. **Public IDs**: Externe Referenzen nutzen \`SOT-X-XXXXXXXX\` Format
6. **Immutable Identity**: org_type, parent_id nach Erstellung unveränderlich
`,

  "spec/01_platform/ACCESS_MATRIX.md": `# ACCESS MATRIX

**Version:** v1.0  
**Datum:** 2026-01-26

---

## Rollen-Übersicht

| Rolle | Zone | Beschreibung |
|-------|------|--------------|
| \`platform_admin\` | Zone 1 | God Mode, voller Zugriff auf alle Tenants |
| \`org_admin\` | Zone 2 | Tenant-Admin, voller Zugriff auf eigenen Tenant |
| \`internal_ops\` | Zone 2 | Operativer Mitarbeiter |
| \`sales_partner\` | Zone 2 | Vertriebspartner (MOD-09/10) |
| \`renter_user\` | Zone 2 | Mieter (Miety Andockpunkt) |

---

## Modul-Zugriff nach Rolle

| Modul | platform_admin | org_admin | internal_ops | sales_partner | renter_user |
|-------|---------------|-----------|--------------|---------------|-------------|
| MOD-01 Stammdaten | ✓ | ✓ | ✓ (read) | ✓ (own) | ✓ (own) |
| MOD-02 KI Office | ✓ | ✓ | ✓ | ✓ | — |
| MOD-03 DMS | ✓ | ✓ | ✓ | ✓ (limited) | ✓ (limited) |
| MOD-04 Immobilien | ✓ | ✓ | ✓ | — | — |
| MOD-05 MSV | ✓ | ✓ | ✓ | — | ✓ (own unit) |
| MOD-06 Verkauf | ✓ | ✓ | ✓ | — | — |
| MOD-07 Finanzierung | ✓ | ✓ | ✓ | — | — |
| MOD-08 Investment-Suche | ✓ | ✓ | ✓ | ✓ | — |
| MOD-09 Vertriebspartner | ✓ | — | — | ✓ | — |
| MOD-10 Leadgenerierung | ✓ | — | — | ✓ | — |
`,

  "spec/01_platform/ZONE_OVERVIEW.md": `# ZONE OVERVIEW

**Version:** v1.0  
**Datum:** 2026-01-26

---

## 3-Zonen-Architektur

### Zone 1 — Admin/Governance
Zentrale Steuerung der Plattform, Tenant-Management, Integrations-Registry, Oversight.

| Sektion | Route | Beschreibung |
|---------|-------|--------------|
| Dashboard | \`/admin\` | Plattform-KPIs |
| Organizations | \`/admin/organizations\` | Tenant CRUD |
| Users | \`/admin/users\` | User Management |
| Delegations | \`/admin/delegations\` | Org-to-Org Rechte |
| Tile Catalog | \`/admin/tiles\` | Module aktivieren |
| Oversight | \`/admin/oversight\` | Read-only Monitoring |

### Zone 2 — User Portals
Operative Arbeit für Tenants (Vermieter, Partner, Käufer).
10-20 Module mit Tile-basierter Navigation.

### Zone 3 — Websites
Öffentliche Präsenz, Lead-Generierung, Marktplatz (Kaufy, Miety).
`,

  "spec/02_modules/mod-04_immobilien.md": `# MOD-04 — IMMOBILIEN (Property Portfolio SSOT)

> **Version**: 2.0.0  
> **Status**: FROZEN  
> **SSOT-Rolle**: Source of Truth für Properties, Units, Leases, Loans, WEG/NK, Documents

---

## Executive Summary

MOD-04 "Immobilien" ist das **Single Source of Truth (SSOT)** für alle Objekt-, Einheiten- und Mietvertragsdaten.

**Downstream-Module (MOD-05 MSV, MOD-06 Verkauf) DÜRFEN KEINE eigenen Objekt-/Einheitendaten führen.**

---

## FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | MOD-04 ist SSOT für: properties, units, leases, loans, nk_periods, storage_nodes, document_links |
| **R2** | Kanonische Dossier-Route: \`/portal/immobilien/:propertyId\` |
| **R3** | Create-Flow: EINE Route \`/portal/immobilien/neu\` → Redirect zu Dossier |
| **R4** | Portfolio-Liste: \`/portal/immobilien/portfolio\` |
| **R5** | Flags steuern Downstream: \`sale_enabled\` → MOD-06, \`rental_managed\` → MOD-05 |

---

## Dossier-Struktur (10 Blöcke)

- Block A: Identität/Zuordnung
- Block B: Adresse
- Block C: Gebäude/Technik
- Block D: Recht/Grundbuch
- Block E: Investment-KPIs
- Block F: Mietverhältnisse
- Block G: WEG/Nebenkosten
- Block H: Finanzierung
- Block I: Buchhaltung
- Block J: Dokumente
`,

  "spec/02_modules/mod-05_msv_contract.md": `# MOD-05 — MSV Downstream Contract

> **Version**: 1.0.0  
> **Status**: FROZEN  
> **SSOT-Rolle**: Consumer (liest aus MOD-04)

---

## Purpose

MOD-05 "Mietsonderverwaltung" (MSV) ist ein **Consumer-Modul**, das Mietverhältnisse operativ verwaltet.

**MSV besitzt KEINE eigenen Property/Unit/Lease-Daten.** Alle Daten werden aus MOD-04 gelesen.

---

## Read Contract

| Tabelle | Filter |
|---------|--------|
| units | tenant_id = active |
| properties | status = 'active' |
| leases | status = 'active' |
| contacts | – |

---

## Write Contract (MSV-owned)

| Tabelle | Beschreibung |
|---------|--------------|
| msv_enrollments | Premium-Aktivierung |
| msv_payment_reports | Mietberichte |
| communication_events | Mahnungen |
`,

  "spec/02_modules/mod-06_verkauf_contract.md": `# MOD-06 — VERKAUF Downstream Contract

> **Version**: 1.0.0  
> **Status**: FROZEN  
> **SSOT-Rolle**: Consumer (liest aus MOD-04)

---

## Purpose

MOD-06 "Verkauf" verwaltet den Verkaufsprozess (Listings, Publications, Inquiries, Transactions).

**Verkauf besitzt KEINE eigenen Property/Unit-Daten.** Alle Daten werden aus MOD-04 gelesen.

---

## Eigene Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| listings | Inserat-Payload |
| listing_publications | Channel-Status |
| inquiries | Anfragen |
| reservations | Reservierungen |
| transactions | Abgeschlossene Verkäufe |

---

## Listing-Lifecycle

\`\`\`
draft → active → reserved → sold
              ↘ withdrawn
\`\`\`
`,

  "spec/02_modules/mod-07_finanzierung.md": `# MOD-07: Finanzierung (Customer Finance Preparation)

**Version:** 2.1.0  
**Status:** FROZEN

---

## Übersicht

MOD-07 ist das Vorbereitungsmodul für Finanzierungsanfragen.

**SoT-Regel:** MOD-07 ist Source of Truth **NUR bis zur Einreichung**. Danach übernimmt Zone 1 FutureRoom.

---

## Status-Machine

\`\`\`
draft → collecting → ready → submitted → [Zone 1 übernimmt]
\`\`\`

| Status | Beschreibung | Editierbar? |
|--------|--------------|-------------|
| draft | Neu erstellt | ✅ Ja |
| collecting | In Bearbeitung | ✅ Ja |
| ready | Alle Pflichtfelder vorhanden | ✅ Ja |
| submitted | Eingereicht | ❌ Nein |

---

## Selbstauskunft: 8 Sektionen

1. Identität
2. Haushalt
3. Beschäftigung Privat
4. Unternehmer-Erweiterung
5. Einkommen & Ausgaben
6. Vermögen
7. Finanzierungswunsch
8. Erklärungen
`,
};

// Add manifest files separately (will be longer)
const MANIFEST_ROUTES = `/**
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

// Zone 1: Admin Portal
export const zone1Admin = {
  base: "/admin",
  layout: "AdminLayout",
  requires_role: ["platform_admin"],
  routes: [
    { path: "", component: "Dashboard", title: "Admin Dashboard" },
    { path: "organizations", component: "Organizations", title: "Organisationen" },
    { path: "users", component: "Users", title: "Benutzer" },
    { path: "delegations", component: "Delegations", title: "Delegationen" },
    { path: "tiles", component: "TileCatalog", title: "Tile-Katalog" },
    { path: "integrations", component: "Integrations", title: "Integrationen" },
    { path: "oversight", component: "Oversight", title: "Oversight" },
    { path: "audit", component: "AuditLog", title: "Audit Log" },
    { path: "billing", component: "Billing", title: "Abrechnung" },
    { path: "futureroom", component: "FutureRoom", title: "Future Room" },
    { path: "futureroom/inbox", component: "FutureRoomInbox", title: "Inbox" },
    { path: "futureroom/zuweisung", component: "FutureRoomZuweisung", title: "Zuweisung" },
  ],
};

// Zone 2: User Portal (20 Module)
export const zone2Portal = {
  base: "/portal",
  layout: "PortalLayout",
  dashboard: { path: "", component: "PortalDashboard", title: "Portal Home" },
  modules: {
    "MOD-01": { name: "Stammdaten", base: "stammdaten", icon: "Users" },
    "MOD-02": { name: "KI Office", base: "office", icon: "Sparkles" },
    "MOD-03": { name: "DMS", base: "dms", icon: "FolderOpen" },
    "MOD-04": { name: "Immobilien", base: "immobilien", icon: "Building2" },
    "MOD-05": { name: "MSV", base: "msv", icon: "FileText" },
    "MOD-06": { name: "Verkauf", base: "verkauf", icon: "Tag" },
    "MOD-07": { name: "Finanzierung", base: "finanzierung", icon: "Landmark" },
    "MOD-08": { name: "Investment-Suche", base: "investments", icon: "Search" },
    "MOD-09": { name: "Vertriebspartner", base: "vertriebspartner", icon: "Handshake" },
    "MOD-10": { name: "Leads", base: "leads", icon: "Target" },
    "MOD-11": { name: "Finanzierungsmanager", base: "finanzierungsmanager", icon: "Landmark" },
  },
};

// Zone 3: Websites
export const zone3Websites = {
  kaufy: { base: "/kaufy", layout: "KaufyLayout" },
  miety: { base: "/miety", layout: "MietyLayout" },
  sot: { base: "/sot", layout: "SotLayout" },
  futureroom: { base: "/futureroom", layout: "FutureRoomLayout" },
};
`;

DOCS_CONTENT["manifests/routesManifest.ts"] = MANIFEST_ROUTES;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check authentication (optional - allow public access for now)
    const authHeader = req.headers.get("Authorization");
    
    console.log("Starting documentation export...");

    // Create ZIP archive
    const zip = new JSZip();
    
    // Add all embedded documentation
    for (const [path, content] of Object.entries(DOCS_CONTENT)) {
      zip.file(path, content);
      console.log(`Added: ${path}`);
    }

    // Add metadata
    const metadata = {
      generated_at: new Date().toISOString(),
      version: "1.0.0",
      project: "System of a Town",
      file_count: Object.keys(DOCS_CONTENT).length,
      files: Object.keys(DOCS_CONTENT),
    };
    zip.file("META.json", JSON.stringify(metadata, null, 2));

    // Add README
    const readme = `# System of a Town — Dokumentationspaket

Generiert: ${new Date().toISOString()}

## Inhalt

### /rfp
Zusammenfassung und Glossar für externe Agenturen.

### /spec
Frozen Specifications und Contracts:
- 00_frozen: Module Blueprint, Software Foundation
- 01_platform: Access Matrix, Zone Overview
- 02_modules: MOD-04 bis MOD-07 Contracts

### /manifests
SSOT-Dateien:
- routesManifest.ts: Alle Routen

## Verwendung

Dieses Paket dient als Ausschreibungsgrundlage für externe Software-Entwickler.
`;
    zip.file("README.md", readme);

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: "uint8array" });
    
    // Upload to Supabase Storage
    const filename = `sot-docs-export-${new Date().toISOString().split('T')[0]}.zip`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("docs-export")
      .upload(filename, zipBlob, {
        contentType: "application/zip",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("docs-export")
      .getPublicUrl(filename);

    console.log("Export complete:", urlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        url: urlData.publicUrl,
        file_count: Object.keys(DOCS_CONTENT).length + 2, // +2 for META.json and README
        generated_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Export error:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
