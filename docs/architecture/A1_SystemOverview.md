# A1 — SYSTEM OVERVIEW

**Version:** A1_SystemOverview_v1.0  
**Status:** FROZEN  
**Changelog:** Resend arrow corrected (Z1_INT --> EXT); Oversight read-only link added (Z1_OVS -.-> Z2).

---

## Beschreibung

Dieses Diagramm zeigt die Gesamtarchitektur von „System of a Town" mit dem 3-Zonen-Modell:
- **Zone 1:** Admin / Governance / Source of Truth
- **Zone 2:** User Portals (9 Module, Kachel-basiert)
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
    end

    subgraph Z2["ZONE 2 — USER PORTALS"]
        Z2_M1["Stammdaten"]
        Z2_M2["KI Office"]
        Z2_M3["Posteingang / DMS"]
        Z2_M4["Immobilien"]
        Z2_M5["Miet-Sonderverwaltung"]
        Z2_M6["Verkauf"]
        Z2_M7["Vertriebspartner"]
        Z2_M8["Finanzierung"]
        Z2_M9["Leadgenerierung"]
    end

    subgraph Z3["ZONE 3 — WEBSITES"]
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
        E_META["Managed Ads (Meta)"]
    end

    Z1 --> CORE
    Z2 --> CORE
    Z3 --> CORE

    Z1_TILE --> Z2
    Z1_INT --> EXT
    Z1_OVS -.->|read-only| Z2

    Z3_LC --> Z2_M9

    E_IMAP --> Z2_M2
    E_CAYA --> Z2_M3
    E_META --> Z3_LP
```

---

## Architektur-Regeln

1. **Zone 1** nutzt KEINE Zone-2-Module (strikte Trennung)
2. **Zone 2** Module arbeiten auf Kernobjekten, sind funktional isoliert
3. **Zone 3** ist read-/lead-first, Leads fließen nach Zone 2
4. **Integrationen** werden durch Zone 1 Registry gesteuert (Z1 → EXT)
5. **Oversight** hat nur Lesezugriff auf Zone 2 Daten
