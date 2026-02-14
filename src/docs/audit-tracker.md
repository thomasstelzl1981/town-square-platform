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
    section Neu (Sprint 2)
    MOD-14 Agenten Grundgeruest        :done, a14, 2026-02-12, 1d
    Mobile Deep-Test (teilweise)       :done, mob, 2026-02-12, 1d
    Zone-2 Welle 1 Analyse             :done, z2w1, 2026-02-12, 1d
    section Zurückgestellt
    MOD-18 Finanzanalyse               :crit, m18, 2026-03-01, 14d
    Mobile Test (mit Auth)             :active, mob2, 2026-02-13, 3d
    Zone-2 Welle 2-4                   :active, z2w2, 2026-02-13, 7d
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
| MOD-14 | Agenten-Tab: 4 Sektionen (Katalog, Log, Kosten, Wissen) | ✅ Erledigt |

## Sprint 2 Erkenntnisse

### MOD-14 Agenten (Neu implementiert)
- 5 neue Dateien: AgentenPage.tsx + 4 Sub-Komponenten
- Aktions-Katalog: Liest alle 45+ Aktionen aus armstrongManifest.ts
- Ausführungs-Log: DB-Anbindung an armstrong_action_runs
- Kosten-Dashboard: DB-Anbindung an armstrong_billing_events
- Wissensbasis: DB-Anbindung an armstrong_knowledge_items

### Mobile Deep-Test (Teilweise)
- Login-Screen auf 375px: ✅ Layout korrekt
- Auth-Seite auf 375px: ✅ Formular korrekt zentriert, responsive
- Dashboard auf 375px: ✅ Widget-Stack, BottomNav sichtbar
- Agenten-Tab auf Mobile: ✅ SubTabNav scrollbar, Tabs responsive
- **Vollständiger Portal-Test erfordert eingeloggten Browser-Session**

### Zone-2 Welle 1 Code-Analyse (7 Module)

| Modul | Pattern | PageShell | ErrorBoundary | Lazy | Role-Gate | Bewertung |
|-------|---------|-----------|---------------|------|-----------|-----------|
| MOD-00 Dashboard | Widget-DnD Grid | ✅ (custom) | — | — | — | ✅ Sauber |
| MOD-04 Immobilien | Routes+SubTabs | ✅ | ✅ | ✅ Detail | GoldenPath | ✅ Sauber |
| MOD-07 Finanzierung | 4 Tiles+Detail | ✅ | — | ✅ Detail | — | ✅ Sauber |
| MOD-08 Investments | 6 Tiles+Exposé | ✅ | — | — | — | ✅ Sauber |
| MOD-11 FM-Manager | Lazy Tabs+Cases | ✅ fixed | — | ✅ All | ✅ finance_manager | ✅ Fixed |
| MOD-12 Akquise | FM-Pattern+Stepper | ✅ | — | — | — | ✅ Sauber |
| MOD-13 Projekte | 4-Tile+Detail+Unit | ✅ | — | — | — | ✅ Sauber |

### Welle 2-4 Analyse (14 Module)

| Modul | Pattern | PageShell | Lazy | Bewertung |
|-------|---------|-----------|------|-----------|
| MOD-01 Stammdaten | 4 Tiles | ✅ (in Tabs) | — | ✅ Sauber |
| MOD-02 KI-Office | 6 Tiles+MobileGuard | ✅ (in Tabs) | — | ✅ Sauber |
| MOD-03 DMS | 4 Tiles | ✅ (in Tabs) | — | ✅ Sauber |
| MOD-05 Website Builder | 0 Tiles (dynamic) | ✅ (WBDashboard) | ✅ All | ✅ Migriert (ehem. MOD-21) |
| MOD-06 Verkauf | 5 Tiles+Exposé | ✅ (in Tabs) | ✅ All | ✅ Sauber |
| MOD-09 Vertriebspartner | 4 Tiles+Details | ✅ (in Tabs) | ✅ All | ✅ Sauber |
| MOD-10 Leads | 4 Tiles+SelfieAds | ✅ (ModuleTilePage) | ✅ SelfieAds | ✅ Sauber |
| MOD-14 CommPro | 4 Tiles | ✅ | — | ✅ Sauber |
| MOD-15 Fortbildung | 4 Tabs | ✅ | — | ✅ Sauber |
| MOD-16 Shops | 3 Shops+Bestellungen | ✅ | — | ✅ Sauber |
| MOD-17 Fuhrpark | 4 Tiles+Detail | ✅ (in Tabs) | — | ✅ Sauber |
| MOD-18 Finanzanalyse | Blueprint/Stub | ✅ (ModuleTilePage) | — | ⏸️ Zurückgestellt |
| MOD-19 PV | 4 Tiles+Detail | ✅ fixed | ✅ All | ✅ Fixed |
| MOD-20 Miety | 6 Tiles | ⚠️ eigene TileShell | ✅ Dossier | ⚠️ Monolith (1089 Zeilen) |

**Fixes angewendet:**
- **MOD-11**: `<div className="space-y-6">` → direkte Routes (PageShell in Sub-Pages)
- **MOD-19**: Unnötiger `<div className="flex flex-col h-full">` Wrapper entfernt

**Offene Punkte:**
- **MOD-20 Miety**: 1089-Zeilen Monolith mit eigener `TileShell` — Refactoring in eigenen Sprint

## Zurückgestellt (eigene Sprints)

| Thema | Begründung |
|-------|-----------|
| MOD-18 Finanzanalyse | Blueprint/Stub — erfordert eigene Architektur-Entscheidung |
| MOD-20 Miety Refactoring | 1089-Zeilen Monolith aufsplitten in Sub-Dateien |
| Mobile Test (vollständig) | Erfordert eingeloggten User im Browser-Tool |
| End-to-End Tests | Strategisch, eigener Sprint |
| Performance-Audit | 85+ Edge Functions, eigener Sprint |
