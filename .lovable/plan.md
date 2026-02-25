
## Phase 1+2+3: Implementiert ✅

### Phase 1: Projekt-Parameter (AfA & Grund-und-Boden)
- ✅ DB-Migration: `afa_rate_percent`, `afa_model`, `land_share_percent` auf `dev_projects`
- ✅ UI: `ProjectAfaFields` Komponente mit Inline-Edit (AfA-Satz, AfA-Modell, Grundanteil)
- ✅ Integration in `ProjectOverviewCard` unterhalb der Beschreibung

### Phase 2: Hausgeld + Backfill
- ✅ DB-Migration: `hausgeld` Spalte auf `dev_project_units`
- ✅ Edge Function `sot-project-intake`: hausgeld beim Unit-Insert gemappt
- ✅ Backfill: 72 bestehende Units mit Hausgeld aus intake_data befüllt (119,70 / 112,78 / 112,09 EUR)

### Phase 3: Massenerstellung Immobilienakten
- ✅ `CreatePropertyFromUnits.tsx`: MOD_04 → MOD-04 korrigiert
- ✅ Button in `PortfolioTab.tsx` eingebunden (neben Preislisten-Header)
- ✅ Zeigt Badge mit Anzahl offener Units ohne property_id

### Nächste Schritte (noch offen)
- Phase 4: Vertriebsauftrag-Workflow (Unit-Status → 'im_vertrieb')
- Phase 5: Kaufy-Listing (kaufy_listed, kaufy_featured Sync)
- Optional: Armstrong-Kontext für MOD-13 Rückfragen
