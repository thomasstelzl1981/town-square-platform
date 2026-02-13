
# Universelles Demo-Daten-Framework — Backlog v6.2

## Status: COMPLETED ✅

Alle 7 Schritte des universellen Demo-Daten-Frameworks sind abgeschlossen.
Alle 15 Golden Path Prozesse haben funktionale Demo-Widgets mit Toggle-Steuerung.

---

## Erstellte/Geänderte Dateien

| # | Datei | Art | Status |
|---|-------|-----|--------|
| 1 | `src/docs/backlog-v6.2-demo-data-universal.json` | NEU | ✅ |
| 2 | `src/manifests/demoDataManifest.ts` | NEU | ✅ 15/15 done |
| 3 | `src/hooks/useDemoLocalEntity.ts` | NEU | ✅ |
| 4 | `src/hooks/useDemoFinanceCase.ts` | NEU | ✅ |
| 5 | `src/hooks/useDemoAcquisition.ts` | NEU | ✅ |
| 6 | `src/hooks/useDemoListings.ts` | ERWEITERT | ✅ GP-PROJEKT Shapes |
| 7 | `src/config/tenantConstants.ts` | ERWEITERT | ✅ DEMO_PROJECT_IDS |
| 8 | `src/config/demoDataRegistry.ts` | ERWEITERT | ✅ 5 neue Registrierungen |

## Architektur

```text
demoDataManifest.ts (SSOT: 15 Einträge — alle done)
  │
  ├── useDemoListings.ts ──── GP-PORTFOLIO (Z1+Z2+Z3) + GP-PROJEKT (Z1+Z2+Z3)
  ├── useDemoFinanceCase.ts ─ GP-FINANZIERUNG (Z1+Z2)
  ├── useDemoAcquisition.ts ─ GP-SUCHMANDAT (Z1+Z2)
  └── useDemoLocalEntity.ts ─ 10x Z2-only Prozesse (Guard + Badge)
```

## Consumer Status (alle Module haben Demo-Widgets via useDemoToggles)

| Prozess | Modul | Demo-Widget | Toggle | Cross-Zone |
|---------|-------|-------------|--------|------------|
| GP-PORTFOLIO | MOD-04 | ✅ | ✅ | ✅ Z1+Z3 |
| GP-VERWALTUNG | MOD-04 | ✅ | ✅ | — Z2-only |
| GP-SANIERUNG | MOD-04 | ✅ | ✅ | — Z2-only |
| GP-FINANZIERUNG | MOD-07 | ✅ | ✅ | ✅ Hook ready |
| GP-PRIVATKREDIT | MOD-07 | ✅ | ✅ | — Z2-only |
| GP-SUCHMANDAT | MOD-08 | ✅ | ✅ | ✅ Hook ready |
| GP-SIMULATION | MOD-08 | ✅ | ✅ | — Z2-only |
| GP-FM-FALL | MOD-11 | ✅ | ✅ | — Manager |
| GP-AKQUISE-MANDAT | MOD-12 | ✅ | ✅ | — Manager |
| GP-PROJEKT | MOD-13 | ✅ | ✅ | ✅ Hook ready |
| GP-SERIEN-EMAIL | MOD-14 | ✅ | ✅ | — Z2-only |
| GP-RECHERCHE | MOD-14 | ✅ | ✅ | — Z2-only |
| GP-FAHRZEUG | MOD-17 | ✅ | ✅ | — Z2-only |
| GP-PV-ANLAGE | MOD-19 | ✅ | ✅ | — Z2-only |
| GP-WEBSITE | MOD-21 | ✅ | ✅ | — Z2-only |
