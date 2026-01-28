# ZONE OVERVIEW

**Version:** v1.0  
**Datum:** 2026-01-26

---

## 3-Zonen-Architektur

```mermaid
flowchart TB
    subgraph Z1["ZONE 1 — ADMIN / GOVERNANCE"]
        Z1_ORG["Organizations / Tenants"]
        Z1_USR["Users & Memberships"]
        Z1_DEL["Delegations & Hierarchies"]
        Z1_TILE["Tile Catalog / Feature Activation"]
        Z1_INT["Integrations Registry"]
        Z1_OVS["Oversight / Monitoring"]
        Z1_LEADS["Lead Pool Management"]
        Z1_PARTNER["Partner Verification"]
        Z1_COMM["Commission Approval"]
    end

    subgraph Z2["ZONE 2 — USER PORTALS (10 Module)"]
        Z2_M1["MOD-01: Stammdaten"]
        Z2_M2["MOD-02: KI Office"]
        Z2_M3["MOD-03: DMS"]
        Z2_M4["MOD-04: Immobilien"]
        Z2_M5["MOD-05: MSV"]
        Z2_M6["MOD-06: Verkauf"]
        Z2_M7["MOD-07: Finanzierung"]
        Z2_M8["MOD-08: Investment-Suche"]
        Z2_M9["MOD-09: Vertriebspartner"]
        Z2_M10["MOD-10: Leadgenerierung"]
    end

    subgraph Z3["ZONE 3 — WEBSITES"]
        Z3_KAUFY["Kaufy Marketplace"]
        Z3_LP["Public Websites / Landingpages"]
        Z3_LC["Lead Capture"]
    end

    subgraph CORE["KERNOBJEKTE"]
        C_ORG["Organization"]
        C_USR["User"]
        C_PROP["Property"]
        C_LEAD["Lead"]
        C_DOC["Document"]
    end

    Z1 --> CORE
    Z2 --> CORE
    Z3 --> CORE

    Z1_TILE --> Z2
    Z1_OVS -.->|read-only| Z2
    Z1_LEADS --> Z2_M10

    Z2_M6 -->|publish| Z3_KAUFY
    Z2_M8 -->|read| Z2_M6
    Z2_M9 -->|read| Z2_M6

    Z3_LC --> Z1_LEADS
    Z3_KAUFY --> Z3_LC

    style Z1 fill:#E8F4FD
    style Z2 fill:#E8FDE8
    style Z3 fill:#FDF8E8
```

---

## Zone 1 — Admin/Governance

### Zweck
Zentrale Steuerung der Plattform, Tenant-Management, Integrations-Registry, Oversight.

### Funktionen

| Sektion | Route | Beschreibung |
|---------|-------|--------------|
| Dashboard | `/admin` | Plattform-KPIs |
| Organizations | `/admin/organizations` | Tenant CRUD |
| Users | `/admin/users` | User Management |
| Delegations | `/admin/delegations` | Org-to-Org Rechte |
| Tile Catalog | `/admin/tiles` | Module aktivieren |
| Integrations | `/admin/integrations` | API Registry |
| Oversight | `/admin/oversight` | Read-only Monitoring |
| Lead Pool | `/admin/leads` | Lead-Zuweisung |
| Partner Verification | `/admin/partners` | §34c/VSH Prüfung |
| Commissions | `/admin/commissions` | Provisions-Freigabe |
| Billing | `/admin/billing` | Abrechnung |
| Audit Log | `/admin/audit` | Event-Log |

### Zugriff
- Nur `platform_admin` Rolle
- Kein Tenant-Scoping

---

## Zone 2 — User Portals

### Zweck
Operative Arbeit für Tenants (Vermieter, Partner, Käufer).

### Module

| MOD | Name | Typ | Zielgruppe |
|-----|------|-----|------------|
| 01 | Stammdaten | Core | Alle |
| 02 | KI Office | Core | Alle |
| 03 | DMS | Core | Alle |
| 04 | Immobilien | Core | Vermieter |
| 05 | MSV | Freemium | Vermieter |
| 06 | Verkauf | Standard | Verkäufer |
| 07 | Finanzierung | Standard | Käufer/Verkäufer |
| 08 | Investment-Suche | Standard | Investoren |
| 09 | Vertriebspartner | Addon | Partner |
| 10 | Leadgenerierung | Addon | Partner |

### Zugriff
- `org_admin`, `internal_ops`, `sales_partner`, `renter_user`
- Strikte Tenant-Isolation via RLS

---

## Zone 3 — Websites

### Zweck
Öffentliche Präsenz, Lead-Generierung, Marktplatz.

### Komponenten

| Komponente | URL | Beschreibung |
|------------|-----|--------------|
| Kaufy Marketplace | kaufy.io | Immobilien-Marktplatz |
| Landingpages | *.kaufy.io | Marketing-Seiten |
| Lead Capture | Formulare | Lead-Erfassung → Zone 1 |

### Datenflüsse

1. **Favorites Sync**: Kaufy (anonym) → LocalStorage → Login → MOD-08 Import
2. **Lead Capture**: Formular → Zone 1 Lead Pool → MOD-10 Partner Inbox

---

## Zonen-Grenzen

### Regel 1: Zone 1 nutzt KEINE Zone-2-Module
Zone 1 ist Governance, nicht operativ.

### Regel 2: Zone 2 Module sind isoliert
Module kommunizieren über definierte Interfaces, nicht direkte DB-Zugriffe.

### Regel 3: Zone 3 ist read/lead-first
Keine Schreiboperationen auf Business-Daten, nur Lead-Erfassung.

### Regel 4: Kernobjekte sind zonen-übergreifend
Organization, User, Property, Lead, Document existieren in allen Zonen.

---

## Integration Points

### Zone 1 → Zone 2
- Tile Activation (welche Module sichtbar)
- Lead Assignment (Pool → Partner)
- Partner Verification Status
- Commission Approval

### Zone 2 → Zone 3
- Listing Publishing (MOD-06 → Kaufy)
- Investment Engine Results

### Zone 3 → Zone 1
- Lead Capture → Lead Pool
- Favorites (via Login-Sync zu Zone 2)

---

*Dieses Dokument definiert die 3-Zonen-Architektur.*
