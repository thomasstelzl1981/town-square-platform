
# Backlog V2 — CI/Design-Konsistenz Sprint

## Status: 24 Issues identifiziert, 0 abgearbeitet

Die V1-backlog.json (Architecture Sprint) ist mit 40/47 Issues abgeschlossen. Die 7 verbleibenden Feature-Issues wurden in den `roadmap`-Block der neuen backlog.json verschoben.

## Scan-Ergebnis: 24 CI-Issues in 6 Kategorien

| Kategorie | Anzahl | Beschreibung |
|-----------|--------|-------------|
| pageshell | 4 | Fehlende oder inkonsistente PageShell-Wrapper |
| lazy-loading | 7 | Fehlende React.lazy() Imports |
| suspense | 3 | Inkonsistente Suspense-Fallbacks |
| header | 6 | Fehlende oder inkonsistente ModulePageHeader |
| header-hierarchy | 3 | Titel-Standards (Modul vs Tile) |
| architecture | 2 | Monolith-Dateien mit Inline-Komponenten |

## Priorisierung

### Sprint 1 — High Priority (7 Issues)
- CIv2-001: MOD-17 Cars PageShell (M)
- CIv2-002: MOD-17 Cars lazy loading (S)
- CIv2-003: MOD-13 Projekte lazy loading (S)
- CIv2-008: MOD-11 FM fehlende Suspense (XS)
- CIv2-011: MOD-09 VP fehlende ModulePageHeader (S)
- CIv2-012: MOD-13 Projekte custom Headers (S)
- CIv2-015: Global Header-Titel-Standard definieren (M)

### Sprint 2 — Medium Priority (10 Issues)
- CIv2-004 bis CIv2-007: Lazy Loading für MOD-18, 15, 16, 12
- CIv2-009, CIv2-010: Custom Spinners entfernen (MOD-19, 20)
- CIv2-013, CIv2-014: MOD-07/03 ModulePageHeader prüfen
- CIv2-016, CIv2-017: MOD-02/14 Tabs prüfen
- CIv2-020: ModuleTilePage PageShell-Migration

### Sprint 3 — Documentation & Cleanup (7 Issues)
- CIv2-018, CIv2-019: Inline-Tiles extrahieren (MOD-18, 10)
- CIv2-021 bis CIv2-024: Pattern-Dokumentation und Standards
