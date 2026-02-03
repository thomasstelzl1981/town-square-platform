import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// RFP PACKAGE: Executive Summary, Glossary, Scope
// ============================================================================

const README_MD = `# System of a Town — Dokumentationspaket

**Version:** 1.0.0  
**Erstellt:** ${new Date().toISOString().split('T')[0]}  
**Status:** RFP-Ready

---

## Paket-Übersicht

Dieses Dokumentationspaket enthält die vollständige technische Spezifikation 
für das System of a Town Plattform-Projekt.

### Ordnerstruktur

| Ordner | Inhalt |
|--------|--------|
| \`/rfp\` | Executive Summary, Scope, Glossar |
| \`/spec\` | Frozen Specifications, API Contracts |
| \`/docs/architecture\` | Systemarchitektur, ADRs, Catalogs |
| \`/docs/modules\` | Modul-Spezifikationen (MOD-01 bis MOD-20) |
| \`/manifests\` | Routes, Tiles, Actions (SSOT) |
| \`/diagrams\` | Mermaid-Diagramme |

### Leseempfehlung

**Für Business/Projektleitung:**
1. \`/rfp/RFP_OVERVIEW.md\` — Executive Summary
2. \`/rfp/GLOSSAR.md\` — Begriffsdefinitionen

**Für Tech Lead/Agentur:**
1. \`/spec/00_frozen/SOFTWARE_FOUNDATION.md\` — Technische Basis
2. \`/spec/00_frozen/MODULE_BLUEPRINT.md\` — Modul-Architektur
3. \`/manifests/routesManifest.ts\` — Routing SSOT
4. \`/docs/architecture/*.md\` — Architektur-Details

---

*Generiert von System of a Town Platform*
`;

const GLOSSAR_MD = `# Glossar — System of a Town

---

## Kernbegriffe

| Begriff | Definition |
|---------|------------|
| **Tenant** | Eine Organisation (Firma, Privatperson) mit eigenem Datenraum |
| **Zone 1** | Admin-Portal für Plattform-Governance (\`/admin/*\`) |
| **Zone 2** | User-Portal mit 20 Modulen (\`/portal/*\`) |
| **Zone 3** | Marketing-Websites (Kaufy, Miety, SoT, FutureRoom) |
| **Tile** | Funktionale Unterseite eines Moduls (max. 4 pro Modul, Ausnahme MOD-20) |
| **SSOT** | Single Source of Truth — verbindliche Datenquelle |
| **RLS** | Row-Level Security — Supabase-Zugriffssteuerung |
| **Manifest** | Strukturierte Konfigurationsdatei (YAML/TS) |

## Module (MOD-01 bis MOD-20)

| Code | Name | Zone | Beschreibung |
|------|------|------|--------------|
| MOD-01 | Stammdaten | 2 | Profil, Firma, Abrechnung, Sicherheit |
| MOD-02 | KI Office | 2 | E-Mail, Brief, Kontakte, Kalender |
| MOD-03 | DMS | 2 | Dokumentenmanagement, Storage, Extraktion |
| MOD-04 | Immobilien | 2 | Portfolio, Kontexte, Bewertung, Sanierung |
| MOD-05 | MSV | 2 | Mietverwaltung, Vermietung, Mieteingang |
| MOD-06 | Verkauf | 2 | Listings, Reservierungen, Transaktionen |
| MOD-07 | Finanzierung | 2 | Selbstauskunft, Dokumenten-Upload, Antrag |
| MOD-08 | Investments | 2 | Investment-Suche, Favoriten, Simulation |
| MOD-09 | Vertriebspartner | 2 | Katalog, Beratung, Netzwerk |
| MOD-10 | Leads | 2 | Lead-Inbox, Pipeline, Werbung |
| MOD-11 | Finanzierungsmanager | 2 | Manager-Workstation für Finanzberater |
| MOD-12 | Akquise-Manager | 2 | Kundenakquise, Mandate |
| MOD-13 | Projekte | 2 | Projektmanagement, Timeline |
| MOD-14 | Communication Pro | 2 | Serien-E-Mails, Social, Recherche |
| MOD-15 | Fortbildung | 2 | Schulungen, Zertifikate |
| MOD-16 | Services | 2 | Dienstleistungs-Marktplatz |
| MOD-17 | Car-Management | 2 | Fuhrparkverwaltung |
| MOD-18 | Finanzanalyse | 2 | Reports, Szenarien, KPIs |
| MOD-19 | Photovoltaik | 2 | PV-Angebote, Projekte |
| MOD-20 | Miety | 2 | Mieter-Portal (6 Tiles) |

## Org-Types

| Type | Beschreibung |
|------|--------------|
| \`internal\` | System of a Town Platform (Zone 1 Admin) |
| \`client\` | Endkunden (Vermieter, Investoren) |
| \`partner\` | Vertriebspartner, Finanzberater |
| \`subpartner\` | Unterpartner eines Partners |

## Rollen

| Rolle | Berechtigung |
|-------|--------------|
| \`platform_admin\` | Voller Zone-1-Zugang |
| \`org_admin\` | Admin der eigenen Organisation |
| \`org_member\` | Standard-Mitglied |
| \`finance_manager\` | Finanzierungsmanager (MOD-11) |
| \`sales_partner\` | Vertriebspartner (MOD-09) |

---

*Stand: ${new Date().toISOString().split('T')[0]}*
`;

const RFP_OVERVIEW_MD = `# RFP Overview — System of a Town

**Version:** 1.0.0  
**Datum:** ${new Date().toISOString().split('T')[0]}

---

## 1. Projektziel

System of a Town ist eine KI-gestützte Immobilienverwaltungs-Plattform für:
- **Vermieter & Investoren:** Portfolio-Management, Mietverwaltung, Finanzierung
- **Vertriebspartner:** Objektkatalog, Beratungs-Tools, Provisionsabwicklung
- **Mieter:** Self-Service Portal (Miety)

## 2. Produktvision

| Produkt | Zielgruppe | Kernfunktion |
|---------|------------|--------------|
| **System of a Town** | Vermieter, Portfoliohalter | KI-gestützte Immobilienverwaltung |
| **Kaufy** | Kapitalanleger, Vertrieb | Marktplatz für Rendite-Immobilien |
| **Miety** | Mieter | Digitaler Mieterzugang |
| **FutureRoom** | Finanzierungssuchende | Finanzierungs-Vermittlung |

## 3. Zonen-Konzept

\`\`\`
Zone 1: Admin-Portal (/admin/*)
├── Plattform-Governance
├── Lead-Pool, Partner-Verifizierung
├── Operative Desks (Finance, Sales, Acquiary)
└── Integrations-Registry

Zone 2: User-Portal (/portal/*)
├── 20 Module (MOD-01 bis MOD-20)
├── Manifest-driven Routing
└── Tile-basierte Navigation

Zone 3: Marketing-Websites
├── /kaufy — Kapitalanlage-Marktplatz
├── /sot — System of a Town Website
├── /miety — Mieter-Website
└── /futureroom — Finanzierungs-Landing
\`\`\`

## 4. Technologie-Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (Postgres, Auth, Storage) |
| **Edge Functions** | Deno (Supabase Functions) |
| **Hosting** | Lovable Cloud |
| **Workflow** | Camunda 8 (geplant) |

## 5. Ausschreibungs-Scope

### In-Scope
- Implementation aller 20 Portal-Module
- Zone-1 Admin-Dashboard
- Edge Functions für API-Logik
- Supabase-Schema und RLS-Policies
- Zone-3 Marketing-Websites

### Out-of-Scope
- Native Mobile Apps (nur Web/PWA)
- Externe ERP-Integration (Phase 2)
- Multi-Language (nur Deutsch in Phase 1)

## 6. Kontakt

*[Placeholder für Ansprechpartner]*

---

*Dieses Dokument ist Teil des RFP-Pakets.*
`;

const SCOPE_MD = `# Scope & Boundaries

---

## In-Scope (Phase 1)

### Zone 1 — Admin-Portal
- Dashboard mit Quick Actions
- Organisations-Management
- User-Management
- Tile-Aktivierung
- Integrations-Registry
- Operative Desks (Finance, Sales, Acquiary)
- Audit-Log

### Zone 2 — Portal-Module
- Alle 20 Module (MOD-01 bis MOD-20)
- Manifest-driven Routing
- Standardisierte 4-Tile-Struktur (Ausnahme MOD-20: 6 Tiles)
- "So funktioniert's" Landing Pages

### Zone 3 — Websites
- Kaufy Marketing-Website
- System of a Town Website
- Miety Website
- FutureRoom Landing

### Backend
- Supabase Database Schema
- Row-Level Security (RLS)
- Edge Functions
- Storage-Integration

---

## Out-of-Scope (Phase 1)

| Feature | Grund | Phase |
|---------|-------|-------|
| Native iOS/Android Apps | Web-First Strategie | Phase 2+ |
| Multi-Language (EN, FR) | Fokus DACH-Markt | Phase 2 |
| ERP-Integration (DATEV, etc.) | Komplexität | Phase 2 |
| Camunda Workflow Engine | Separate Integration | Phase 1.5 |
| Scout24 API | Externe Abhängigkeit | Phase 1.5 |
| Meta Ads API | Externe Abhängigkeit | Phase 1.5 |

---

## Acceptance Criteria (Phase 1)

- [ ] Alle 20 Module erreichbar und funktional
- [ ] RLS-Policies für alle Tabellen
- [ ] Zone-1 Dashboard vollständig
- [ ] Mindestens 10 Edge Functions deployed
- [ ] Dokumentation vollständig
- [ ] Audit-Log für kritische Aktionen

---

*Stand: ${new Date().toISOString().split('T')[0]}*
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting RFP package generation...');
    
    const zip = new JSZip();
    
    // Add RFP files
    zip.file('README.md', README_MD);
    zip.file('rfp/RFP_OVERVIEW.md', RFP_OVERVIEW_MD);
    zip.file('rfp/GLOSSAR.md', GLOSSAR_MD);
    zip.file('rfp/SCOPE_AND_BOUNDARIES.md', SCOPE_MD);
    
    // Generate ZIP as base64
    const zipContent = await zip.generateAsync({ type: 'base64' });
    
    console.log('RFP package generated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        package: 'rfp',
        zipBase64: zipContent,
        files: ['README.md', 'rfp/RFP_OVERVIEW.md', 'rfp/GLOSSAR.md', 'rfp/SCOPE_AND_BOUNDARIES.md']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error generating RFP package:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
