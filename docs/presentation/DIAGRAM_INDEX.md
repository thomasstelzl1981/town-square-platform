# DIAGRAM INDEX

**Version:** v1.0  
**Datum:** 2026-01-26

---

## Diagramm-Verzeichnis

| DIA-ID | Titel | Typ | Module | API-IDs | Tabellen | Datei |
|--------|-------|-----|--------|---------|----------|-------|
| DIA-001 | Zone-Architektur Overview | Flowchart | All | — | — | ZONE_OVERVIEW.md |
| DIA-002 | Marken-/Registrierungslogik | Flowchart | All | — | — | SOFTWARE_FOUNDATION.md |
| DIA-003 | Core Foundations | Flowchart | Backbone | — | profiles, orgs, memberships | FLOW_PACK.md |
| DIA-004 | Gesamt-Systemdatenfluss | Flowchart | All | — | All | SYSTEM_DIAGRAM.md |
| DIA-005 | Source-of-Truth Map | Flowchart | All | — | All | DATA_FLOW_PACK.md |
| DIA-010 | MOD-04 → MOD-06 Listing | Sequence | 04, 06 | API-700, 201 | properties, listings | FLOW_PACK.md |
| DIA-011 | MOD-06 Publishing Channels | Sequence | 06 | API-210..213 | listings, publications | FLOW_PACK.md |
| DIA-012 | MOD-06 → MOD-09 Partner Release | Sequence | 06, 09 | API-213, 310 | listings, visibility | FLOW_PACK.md |
| DIA-013 | Kaufy Favorites Sync | Sequence | 08 | API-423 | favorites | FLOW_PACK.md |
| DIA-014 | MOD-08 Simulation | Sequence | 04, 05, 07, 08 | API-441 | properties, leases | FLOW_PACK.md |
| DIA-015 | MOD-05 → Miety Invite | Sequence | 05 | API-850 | renter_invites | FLOW_PACK.md |
| DIA-016 | Lead Capture → Pipeline | Sequence | 10, Z1 | API-160, 510 | leads, assignments | FLOW_PACK.md |
| DIA-020 | Listing Create/Activate | Sequence | 06 | API-201..204 | listings | API_FLOW_PACK.md |
| DIA-021 | Publishing Kaufy | Sequence | 06 | API-210 | publications | API_FLOW_PACK.md |
| DIA-022 | Publishing Scout24 | Sequence | 06 | API-211 | publications | API_FLOW_PACK.md |
| DIA-023 | Kleinanzeigen Link | Sequence | 06 | API-212 | publications | API_FLOW_PACK.md |
| DIA-024 | Partner-Netzwerk Release | Sequence | 06 | API-213 | visibility, consents | API_FLOW_PACK.md |
| DIA-025 | Favorites Import | Sequence | 08 | API-423 | favorites | API_FLOW_PACK.md |
| DIA-026 | Lead Pool Assign | Sequence | 10, Z1 | API-161, 511 | leads, assignments | API_FLOW_PACK.md |
| DIA-030 | Listing Lifecycle | StateDiagram | 06 | — | listings | STATE_MACHINES.md |
| DIA-031 | Publication Lifecycle | StateDiagram | 06 | — | publications | STATE_MACHINES.md |
| DIA-032 | MSV Lifecycles | StateDiagram | 05 | — | enrollments, payments | STATE_MACHINES.md |
| DIA-033 | Partner Verification | StateDiagram | 09 | — | verifications | STATE_MACHINES.md |
| DIA-034 | Lead/Deal Lifecycles | StateDiagram | 10 | — | leads, deals | STATE_MACHINES.md |
| DIA-035 | Finance Case Lifecycle | StateDiagram | 07 | — | finance_cases | STATE_MACHINES.md |

---

## Diagramm-Typen

| Typ | Beschreibung | Mermaid-Syntax |
|-----|--------------|----------------|
| Flowchart | Architektur, Datenfluss | `flowchart TB/LR` |
| Sequence | API-Flows, Interaktionen | `sequenceDiagram` |
| StateDiagram | Status-Maschinen | `stateDiagram-v2` |
| ERD | Datenmodell | `erDiagram` |
| Journey | User Journeys | `journey` |

---

## Coverage Matrix

| Modul | Flowchart | Sequence | State | ERD | Status |
|-------|-----------|----------|-------|-----|--------|
| Zone 1 | DIA-001 | DIA-026 | — | — | ✓ |
| MOD-04 | DIA-005 | DIA-010 | — | — | ✓ |
| MOD-05 | DIA-005 | DIA-015 | DIA-032 | — | ✓ |
| MOD-06 | DIA-004 | DIA-011..024 | DIA-030/31 | — | ✓ |
| MOD-07 | DIA-005 | — | DIA-035 | — | ✓ |
| MOD-08 | DIA-004 | DIA-013/25 | — | — | ✓ |
| MOD-09 | DIA-004 | DIA-012 | DIA-033 | — | ✓ |
| MOD-10 | DIA-004 | DIA-016/26 | DIA-034 | — | ✓ |
| Zone 3 | DIA-001 | DIA-013/16 | — | — | ✓ |

---

*Dieses Dokument ist der Index aller Diagramme.*
