# SOFTWARE FOUNDATION

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

## 2. Registrierungs-Zugriffslogik

| Registrierung über | Sichtbare Module | Zielgruppe |
|--------------------|------------------|------------|
| **SoT** | MOD-01 bis MOD-08 | Vermieter, Portfoliohalter |
| **Kaufy** | MOD-01 bis MOD-10 | Kapitalanlageberater, Vertriebe |

---

## 3. 10-Modul-Architektur

| MOD | Name | Typ | Route-Prefix | API-Range |
|-----|------|-----|--------------|-----------|
| 01 | Stammdaten | Core | `/portal/stammdaten` | — |
| 02 | KI Office | Core | `/portal/office` | — |
| 03 | DMS | Core | `/portal/dms` | — |
| 04 | Immobilien | Core | `/portal/immobilien` | API-700..799 |
| 05 | MSV | Freemium | `/portal/msv` | API-800..899 |
| 06 | Verkauf | Standard | `/portal/verkauf` | API-200..299 |
| 07 | Finanzierung | Standard | `/portal/finanzierung` | API-600..699 |
| 08 | Investment-Suche | Standard | `/portal/investments` | API-400..499 |
| 09 | Vertriebspartner | Addon | `/portal/vertriebspartner` | API-300..399 |
| 10 | Leadgenerierung | Addon | `/portal/leads` | API-500..599 |

---

## 4. Zone-Architektur

### Zone 1 — Admin/Governance
- Organizations/Tenants
- Users & Memberships
- Tile Catalog / Feature Activation
- Integrations Registry
- Oversight / Monitoring
- Partner Verification Review
- Commission Approval
- Lead Pool Management
- Audit Log

### Zone 2 — User Portals
- 10 Module (MOD-01 bis MOD-10)
- Tile-basierte Navigation
- Tenant-isolierte Daten

### Zone 3 — Websites
- Kaufy Marketplace
- Public Landingpages
- Lead Capture

---

## 5. Kernobjekte

| Objekt | Zone-übergreifend | Owner |
|--------|-------------------|-------|
| Organization | ✓ | Backbone |
| User/Profile | ✓ | Backbone |
| Contact | ✓ | Backbone |
| Property | ✓ | MOD-04 |
| Unit | ✓ | MOD-04 |
| Document | ✓ | MOD-03 |
| Lead | ✓ | MOD-10 |

---

## 6. Monetarisierung (FROZEN)

### MOD-06 Partner-Netzwerk
- Partner-Provision: **5–15%** pro Listing (Owner wählt)
- Systemgebühr: **€2.000** erfolgsabhängig (nur bei Closing/BNL)

### MOD-10 Lead-Split (Pool-Leads)
- Platform: **1/3** der Provision
- Partner: **2/3** der Provision

---

## 7. Consent Codes

| Code | Modul | Trigger |
|------|-------|---------|
| SALES_MANDATE | MOD-06 | Listing-Erstellung |
| SCOUT24_CREDITS | MOD-06 | Scout24 Publishing |
| PARTNER_RELEASE | MOD-06 | Partner-Netzwerk-Freigabe |
| SYSTEM_SUCCESS_FEE_2000 | MOD-06 | Erfolgsgebühr |
| COMMISSION_AGREEMENT | MOD-09 | Provisionsvereinbarung |
| FINANCING_SUBMISSION_ACK | MOD-07 | Future Room Handoff |
| LEAD_SPLIT_AGREEMENT | MOD-10 | Pool-Lead Akzeptanz |
| MSV_AGREEMENT | MOD-05 | Premium-Aktivierung |
| META_ADS_TOS | MOD-10 | Meta-Werbung |

---

## 8. Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| Routing | React Router v6 |
| Backend | Supabase (Lovable Cloud) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Edge Functions | Deno (Supabase) |

---

## 9. Architektur-Invarianten

1. **Tenant-Isolation**: Alle Business-Daten haben `tenant_id` FK
2. **RLS überall**: Keine Tabelle ohne Row Level Security
3. **Audit-Pflicht**: Kritische Aktionen → `audit_events`
4. **Consent-Gates**: Rechtlich relevante Aktionen → `user_consents`
5. **Public IDs**: Externe Referenzen nutzen `SOT-X-XXXXXXXX` Format
6. **Immutable Identity**: org_type, parent_id nach Erstellung unveränderlich

---

*Dieses Dokument ist die verbindliche Grundlage für alle Implementierungen.*
