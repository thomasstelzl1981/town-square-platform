# 04 — Workflows (Golden Paths)

> **SSOT-Delegation**: Die kanonische Quelle für alle Golden Path Workflows ist  
> die **GoldenPathEngine** in `src/manifests/goldenPaths/`

Dieses Verzeichnis dient als Spec-Referenz für individuelle Workflow-Dokumente,  
die über die Engine-Definition hinausgehende Details erfordern (z.B. WF-MEET-01 für LiveKit-Videotelefonie).

## Engine-registrierte Golden Paths (Stand 2026-02-15)

| GP Key | Definition | Module | Beschreibung |
|--------|-----------|--------|--------------|
| GP-PORTFOLIO | MOD_04.ts | MOD-04 | Immobilien-Portfolio Aufbau |
| GP-VERWALTUNG | MOD_04.ts | MOD-04 | Hausverwaltung |
| GP-SANIERUNG | MOD_04.ts | MOD-04 | Sanierungsprojekte |
| GP-FINANZIERUNG | MOD_07_11.ts | MOD-07/11 | Finanzierungsanfrage |
| GP-FM-FALL | MOD_07_11.ts | MOD-11 | Finanzierungsmanager-Fall |
| GP-SUCHMANDAT | MOD_08_12.ts | MOD-08 | Investment-Suchmandat |
| GP-SIMULATION | MOD_08_12.ts | MOD-08 | Investment-Simulation |
| GP-AKQUISE-MANDAT | MOD_08_12.ts | MOD-12 | Akquise-Mandat |
| GP-PROJEKT | MOD_13.ts | MOD-13 | Bauprojekt-Management |
| GP-VERMIETUNG | GP_VERMIETUNG.ts | MOD-04/06 | Vermietungsprozess |
| GP-LEAD | GP_LEAD.ts | MOD-09/10 | Lead-Erfassung und -Verteilung |
| GP-FINANCE-Z3 | GP_FINANCE_Z3.ts | Zone 3 | Öffentliche Finanzierungsanfrage |

## Guard-Coverage

Module mit expliziten `goldenPath` Guards auf dynamic routes:
- MOD-04, MOD-07, MOD-12, MOD-13, MOD-19

Module mit internem Routing (kein Manifest-Guard, kein Bypass-Vektor):
- MOD-08 (InvestmentsPage.tsx, data-driven state)

Event-driven GPs (kein Route-Guard nötig):
- GP-VERMIETUNG, GP-LEAD, GP-FINANCE-Z3

## Einzelne Workflow-Dokumente

| Datei | Beschreibung |
|-------|--------------|
| WF-MEET-01.md | LiveKit Videotelefonie-Workflow |

Siehe: `src/manifests/goldenPaths/index.ts`
