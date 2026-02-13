
# Universelles Demo-Daten-Framework — Backlog v6.2

## Status: COMPLETED (Schritt 1–7)

Alle 7 Schritte des universellen Demo-Daten-Frameworks wurden implementiert.

---

## Erstellte/Geänderte Dateien

| # | Datei | Art | Beschreibung |
|---|-------|-----|-------------|
| 1 | `src/docs/backlog-v6.2-demo-data-universal.json` | NEU | Backlog-JSON mit allen 7 Schritten |
| 2 | `src/manifests/demoDataManifest.ts` | NEU | Zentrales Manifest: 15 Einträge, Zones, Consumers, Status |
| 3 | `src/hooks/useDemoLocalEntity.ts` | NEU | Generischer Guard-Hook für Z2-only Prozesse |
| 4 | `src/hooks/useDemoFinanceCase.ts` | NEU | Cross-Zone Hook: GP-FINANZIERUNG (Z1+Z2) |
| 5 | `src/hooks/useDemoAcquisition.ts` | NEU | Cross-Zone Hook: GP-SUCHMANDAT (Z1+Z2) |
| 6 | `src/hooks/useDemoListings.ts` | ERWEITERT | GP-PROJEKT Shapes (Sales Desk, Kaufy, Katalog) |
| 7 | `src/config/tenantConstants.ts` | ERWEITERT | DEMO_PROJECT_IDS + isDemoProject |
| 8 | `src/config/demoDataRegistry.ts` | ERWEITERT | 5 neue Hook-Registrierungen |

---

## Architektur

```text
demoDataManifest.ts (SSOT: 15 Einträge)
  │
  ├── useDemoListings.ts ──── GP-PORTFOLIO (Z1+Z2+Z3) + GP-PROJEKT (Z1+Z2+Z3)
  ├── useDemoFinanceCase.ts ─ GP-FINANZIERUNG (Z1+Z2)
  ├── useDemoAcquisition.ts ─ GP-SUCHMANDAT (Z1+Z2)
  └── useDemoLocalEntity.ts ─ 10x Z2-only Prozesse (Guard + Badge)
```

## Nächste Schritte (Consumer-Integration)

Die Hooks sind bereit. Die Consumer-Dateien (die eigentlichen Modul-Seiten) müssen die Hooks importieren und die Daten mergen. Dies erfolgt Modul für Modul gemäß dem Manifest.
