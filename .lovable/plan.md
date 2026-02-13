
# Golden Path Interaction Standard — Systemweite Prozess-Registry

## Design-Grundlage

Alle Prozess-Seiten werden gemäß dem **Design Manifest V4.0** (`src/config/designManifest.ts`) umgesetzt:

- **Layout**: `PageShell` → `ModulePageHeader` (TYPOGRAPHY.PAGE_TITLE) → `WidgetGrid` (WIDGET_GRID.FULL) → Inline-Detail-Flow
- **Widget-Zellen**: `WidgetCell` (WIDGET_CELL.DIMENSIONS: h-[260px] / md:aspect-square)
- **Cards**: CARD.BASE + CARD.INTERACTIVE für klickbare Widgets
- **KPI-Zeilen**: KPI_GRID.FULL für kompakte Kennzahlen
- **Formulare**: FORM_GRID.FULL für Detail-Sektionen
- **Typografie**: TYPOGRAPHY.* — keine ad-hoc Tailwind-Klassen
- **Spacing**: SPACING.SECTION zwischen Sektionen, SPACING.CARD innerhalb
- **Banner**: INFO_BANNER.HINT für Demo-Hinweise
- **Max 4 Spalten** auf Desktop — keine Ausnahme

---

## Ziel-Layout (alle Prozess-Module identisch)

```text
┌──────────────────────────────────────────────────────┐
│  MODULNAME (TYPOGRAPHY.PAGE_TITLE)                   │
│  Beschreibung (TYPOGRAPHY.MUTED)                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  WidgetGrid (WIDGET_GRID.FULL, max 4 cols)           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │  DEMO   │  │  Fall 1 │  │  Fall 2 │  │  +Neu  │ │
│  │(pos 0)  │  │         │  │         │  │  CTA   │ │
│  │WidgetCell│  │WidgetCell│  │WidgetCell│  │WidgetCell│
│  └─────────┘  └─────────┘  └─────────┘  └────────┘ │
│                                                      │
│  ─── Inline-Detail (SPACING.SECTION) ───             │
│  Sektion 1 (CARD.CONTENT / FORM_GRID)                │
│  Sektion 2                                           │
│  Sektion N                                           │
│  (alles scrollbar, kein Tab-Wechsel)                 │
└──────────────────────────────────────────────────────┘
```

---

## Prozess-Registry (15 Prozesse)

| # | Prozess-ID | Modul | Seite | Prozessname | MP | Compliance | Phase |
|---|-----------|-------|-------|-------------|:--:|------------|-------|
| 1 | GP-PORTFOLIO | MOD-04 | PortfolioTab | Immobilien-Portfolio | 1 | Demo fehlt | 2A |
| 2 | GP-VERWALTUNG | MOD-04 | VerwaltungTab | Mietverwaltung | 1 | Demo fehlt | 2A |
| 3 | GP-SANIERUNG | MOD-04 | SanierungTab | Sanierungsauftrag | 1 | Demo fehlt | 2A |
| 4 | GP-FINANZIERUNG | MOD-07 | AnfrageTab | Finanzierungsanfrage | 2 | Demo fehlt | 2A |
| 5 | GP-PRIVATKREDIT | MOD-07 | PrivatkreditTab | Privatkreditantrag | 1 | Demo fehlt | 2A |
| 6 | GP-SUCHMANDAT | MOD-08 | MandatTab | Investment-Suchmandat | 1 | Umbau nötig | 2C |
| 7 | GP-SIMULATION | MOD-08 | SimulationTab | Investment-Simulation | 1 | Demo fehlt | 2A |
| 8 | GP-FM-FALL | MOD-11 | FMDashboard | Finanzierungsfall | 2 | Demo fehlt | 2B |
| 9 | GP-AKQUISE-MANDAT | MOD-12 | AkquiseMandate | Akquisemandat | 2 | Demo fehlt | 2B |
| 10 | GP-PROJEKT | MOD-13 | ProjekteDashboard | Projektanlage | 1 | Demo vorhanden | 2B |
| 11 | GP-SERIEN-EMAIL | MOD-14 | SerienEmailsPage | Serien-E-Mail-Kampagne | 1 | Umbau nötig | 2C |
| 12 | GP-RECHERCHE | MOD-14 | ResearchTab | Rechercheauftrag | 1 | ✅ KONFORM | — |
| 13 | GP-FAHRZEUG | MOD-17 | CarsFahrzeuge | Fahrzeugverwaltung | 1 | Demo fehlt | 2A |
| 14 | GP-PV-ANLAGE | MOD-19 | AnlagenTab | PV-Anlagenanlage | 1 | Umbau nötig | 2C |
| 15 | GP-WEBSITE | MOD-21 | WBDashboard | Website-Auftrag | 1 | ✅ KONFORM | — |

**MP** = Menüpunkte (1 = alles in einem Tab, 2 = über zwei Tabs)

---

## Demo-Daten-Konzept

### Prinzipien (gemäß Design Manifest)

1. Demo-Widget ist **IMMER Position 0** im WidgetGrid
2. ID ist **IMMER `__demo__`** (String, keine UUID)
3. Status-Badge: `bg-primary/10 text-primary` mit Label "Demo"
4. Alle Felder sind editierbar (User experimentiert)
5. Bei Schließen/Wechsel: **Reset auf hartcodierten Standard**
6. Rein clientseitig — **kein DB-Speichern**
7. Toggle über `useDemoToggles` Hook (localStorage)

### Steuerung

Neuer Stammdaten-Tab **"Demo-Daten"** in MOD-01 mit:
- Globaler Toggle (alle an/aus)
- Individueller Toggle pro Prozess
- Compliance-Badge pro Prozess
- Persistenz via localStorage (`gp_demo_toggles`)

---

## Implementierungsphasen

### Phase 1: Infrastruktur (aktueller Schritt)
- `src/manifests/goldenPathProcesses.ts` — SSOT für alle 15 Prozesse
- `src/hooks/useDemoToggles.ts` — localStorage Toggle-Hook
- `src/pages/portal/stammdaten/DemoDatenTab.tsx` — Management-UI
- Routing in StammdatenPage + routesManifest

### Phase 2A: Demo-Widgets nachrüsten (bereits konformes Layout)
GP-PORTFOLIO, GP-VERWALTUNG, GP-SANIERUNG, GP-FINANZIERUNG, GP-PRIVATKREDIT, GP-SIMULATION, GP-FAHRZEUG

### Phase 2B: Widget-Anpassung + Demo
GP-FM-FALL, GP-AKQUISE-MANDAT, GP-PROJEKT

### Phase 2C: Komplett-Umbau auf WidgetGrid
GP-SUCHMANDAT, GP-SERIEN-EMAIL, GP-PV-ANLAGE

### Phase 3: Validator-Integration
DEV-Modus-Check für Compliance aller registrierten Prozesse
