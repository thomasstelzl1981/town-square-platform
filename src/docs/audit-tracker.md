# Audit-Tracker: System of a Town Platform

> Stand: 12. Februar 2026

```mermaid
gantt
    title Audit-Abarbeitung: System of a Town
    dateFormat  YYYY-MM-DD
    section Erledigt (AP 1-4)
    AP-1 Console.log Bereinigung       :done, ap1, 2026-02-12, 1d
    AP-2 PageShell Migration MOD-16    :done, ap2, 2026-02-12, 1d
    AP-3 MarketingTab Deprecated       :done, ap3, 2026-02-12, 1d
    AP-4 Kaufy Expose Fallback         :done, ap4, 2026-02-12, 1d
    section Erledigt (Phase 5-9)
    Phase 5 MOD-08 Manifest-Kommentar  :done, p5, 2026-02-12, 1d
    Phase 6+8 FinanceDesk Konsolidierung :done, p6, 2026-02-12, 1d
    Phase 7 FutureRoom Bewerbungsformular :done, p7, 2026-02-12, 1d
    Phase 9 FortbildungPage Header OK  :done, p9, 2026-02-12, 1d
    section Zurückgestellt
    MOD-18 Finanzanalyse               :crit, m18, 2026-03-01, 14d
    MOD-14 Agenten Armstrong           :crit, m14, 2026-03-01, 14d
```

## Abgeschlossene Massnahmen

| Phase | Beschreibung | Status |
|-------|-------------|--------|
| AP-1 | Console.log → toast.info (6 Stellen) | ✅ Erledigt |
| AP-2 | ShopTab + BestellungenTab → PageShell/ModulePageHeader | ✅ Erledigt |
| AP-3 | MarketingTab.tsx als @deprecated markiert | ✅ Erledigt |
| AP-4 | Kaufy Expose Fallback-Ansicht verbessert | ✅ Erledigt |
| Phase 5 | MOD-08 Dynamic Routes Manifest-Kommentar | ✅ Erledigt (kein Bug, Doku ergänzt) |
| Phase 6+8 | FinanceDesk → FutureRoom Redirect, KPIs entfernt | ✅ Erledigt |
| Phase 7 | FutureRoom Karriere Bewerbungsformular | ✅ Erledigt |
| Phase 9 | FortbildungPage Header-Prüfung | ✅ Kein Problem (Header nur 1x) |

## Zurückgestellt (eigene Sprints)

| Thema | Begründung |
|-------|-----------|
| MOD-18 Finanzanalyse | Blueprint/Stub — erfordert eigene Architektur-Entscheidung |
| MOD-14 Agenten | Erfordert Armstrong-Agent-Integration |
| End-to-End Tests | Strategisch, eigener Sprint |
| Performance-Audit | 85+ Edge Functions, eigener Sprint |
| Mobile Deep-Test | Alle 21 Module auf 375px, eigener Sprint |
