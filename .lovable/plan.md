
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

### Naechste Schritte

#### P0.2 — Edge Function `sot-project-intake`
- PDF-Analyse via Lovable AI (Gemini)
- XLSX-Import zu `dev_project_units`
- Storage-Tree Seeding (7 Standardordner)

#### P0.3 — Demo-Seed
- 1 Developer Context + 1 Projekt + 5 Units (DB-Migration)

#### P1 — Vertriebsfreigabe
- TermsGate Consent-Panel
- Status-Sync (Reservierung → Unit-Status)

#### P2 — Lead-Maschine (eigener Prompt)
- Kampagnen-Studio (Facebook/Instagram)
- Lead-Inbox
- Content-Generierung aus Expose
