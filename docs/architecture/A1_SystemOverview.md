# A1 — SYSTEM OVERVIEW

**Version:** A1_SystemOverview_v2.0  
**Status:** FROZEN  
**Changelog:** v2.0 — 10-Modul-Architektur; Kaufy (mit y) korrigiert; MOD-08 Investment-Suche neu; MOD-09/10 renummeriert.

---

## Beschreibung

Dieses Diagramm zeigt die Gesamtarchitektur von „System of a Town" mit dem 3-Zonen-Modell:
- **Zone 1:** Admin / Governance / Source of Truth
- **Zone 2:** User Portals (10 Module, Kachel-basiert)
- **Zone 3:** Websites (Public / Lead-first)

Kernobjekte (Organization, User, Property, Lead, Document) sind zonenübergreifend gültig.

---

## Mermaid Flowchart

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

    subgraph EXT["EXTERNE SYSTEME"]
        E_RESEND["System Mail (Resend)"]
        E_IMAP["Personal Mail (IMAP/Gmail)"]
        E_CAYA["Post Inbound (Caya)"]
        E_SCOUT24["Immobilienscout24"]
        E_STRIPE["Stripe Billing"]
        E_META["Managed Ads (Meta)"]
    end

    Z1 --> CORE
    Z2 --> CORE
    Z3 --> CORE

    Z1_TILE --> Z2
    Z1_INT --> EXT
    Z1_OVS -.->|read-only| Z2
    Z1_LEADS --> Z2_M10

    Z2_M6 -->|publish| Z3_KAUFY
    Z2_M6 -->|publish| E_SCOUT24
    Z2_M8 -->|read| Z2_M6
    Z2_M9 -->|read| Z2_M6

    Z3_LC --> Z1_LEADS
    Z3_KAUFY --> Z3_LC

    E_IMAP --> Z2_M2
    E_CAYA --> Z2_M3
    E_META --> Z3_LP

    style Z1 fill:#E8F4FD
    style Z2 fill:#E8FDE8
    style Z3 fill:#FDF8E8
```

---

## Modulübersicht (10 Module)

### Sichtbarkeitsmatrix

| Registrierung | Sichtbare Module |
|---------------|------------------|
| **SoT** (System of a Town) | MOD-01 bis MOD-08 |
| **Kaufy** (Marktplatz) | MOD-01 bis MOD-10 |

### Modulkatalog

| MOD | Name | Typ | Route-Prefix |
|-----|------|-----|--------------|
| 01 | Stammdaten | Core | `/portal/stammdaten` |
| 02 | KI Office | Core | `/portal/office` |
| 03 | DMS | Core | `/portal/dms` |
| 04 | Immobilien | Core | `/portal/immobilien` |
| 05 | MSV | Freemium | `/portal/msv` |
| 06 | Verkauf | Standard | `/portal/verkauf` |
| 07 | Finanzierung | Standard | `/portal/finanzierung` |
| 08 | Investment-Suche / Ankauf | Standard | `/portal/investments` |
| 09 | Vertriebspartner | Addon | `/portal/vertriebspartner` |
| 10 | Leadgenerierung | Addon | `/portal/leads` |

---

## Architektur-Regeln

1. **Zone 1** nutzt KEINE Zone-2-Module (strikte Trennung)
2. **Zone 2** Module arbeiten auf Kernobjekten, sind funktional isoliert
3. **Zone 3** ist read-/lead-first, Leads fließen via Zone 1 Pool nach Zone 2
4. **Integrationen** werden durch Zone 1 Registry gesteuert (Z1 → EXT)
5. **Oversight** hat nur Lesezugriff auf Zone 2 Daten
6. **Kaufy** ist KEIN Modulname — es ist eine Marke/Source/Channel

---

## Markenlogik (FROZEN)

| Marke | Zone | Verwendung |
|-------|------|------------|
| **System of a Town (SoT)** | Zone 1 + 2 | Verwaltungssoftware |
| **Kaufy** (mit y) | Zone 3 + Channel | Marktplatz-Marke, Source in MOD-06/08 |
| **Miety** | Andockpunkt | Mieter-App (Phase 2) |

---

*Dieses Dokument ist die verbindliche Systemübersicht für die 10-Modul-Architektur.*
