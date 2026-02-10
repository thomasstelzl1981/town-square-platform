
# MOD-13 Projekte — Implementierungsplan

## Status: P0 In Arbeit

### Erledigte Schritte

#### ✅ ProjectAufteilerCalculation (Block D — interaktiv)
- Neue Komponente `src/components/projekte/blocks/ProjectAufteilerCalculation.tsx`
- 3 Slider: Zielrendite Endkunde, Vertriebsprovision, Vertriebsdauer
- 5 Eingabefelder: Kaufpreis, Sanierung, Nebenkosten %, Zinssatz %, EK-Anteil %
- Kosten vs. Erloese Side-by-Side Cards
- Hero-Result: Gewinn, Marge, ROI auf EK
- Sensitivitaetsanalyse (Bar-Chart)
- Speichern in `dev_projects` + `dev_project_calculations`
- Start-Setup: 25% Marge, 3% Provision

#### ✅ Dashboard Redesign (ProjekteDashboard.tsx)
- "So funktioniert's" 4-Schritt-Visual (Upload → KI → Pruefen → Vertrieb)
- Magic Intake Card mit Glassmorphism-Design, Glow-Effekt
- Dropzones mit Hover-Animationen und groesseren Touch-Targets
- CI-konformes Design (glass-card, shadow-glow, rounded-xl)

#### ✅ ProjectDetailPage Tab D umgebaut
- Read-Only Block D ersetzt durch `<ProjectAufteilerCalculation />`
- Import + Export in index.ts hinzugefuegt

#### ✅ Edge Function `sot-project-intake` — Full AI + XLSX + Storage-Tree
- **Analyze Mode:** Gemini 2.5 Flash fuer Expose-Extraktion (Projektname, Adresse, PLZ, Stadt, Einheiten, Preise)
- **Pricelist Parsing:** AI-basierte XLSX/CSV/PDF-Preislisten-Extraktion → extractedUnits Array
- **Create Mode:** Projekt + Units Bulk-Insert + Storage-Tree Seeding
- **Storage-Tree:** 7 Projektordner (01_expose bis 99_sonstiges) + Einheiten-Ordner mit 5 Sub-Ordnern pro Unit
- **Rate-Limit Handling:** 429/402 Fehler werden sauber durchgereicht
- **Auto-Context:** Developer Context wird automatisch angelegt wenn keiner existiert

### Naechste Schritte

#### P0.3 — Demo-Seed
- 1 Developer Context + 1 Projekt + 5 Units + Storage-Tree (DB-Migration)

#### P1 — Vertriebsfreigabe
- TermsGate Consent-Panel
- Status-Sync (Reservierung → Unit-Status)
- Preisliste editierbar (ProjectPricingBlock)

#### P2 — Lead-Maschine (eigener Prompt)
- Kampagnen-Studio (Facebook/Instagram)
- Lead-Inbox
- Content-Generierung aus Expose
