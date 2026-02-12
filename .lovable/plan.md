

# Backlog-Status und Empfehlung: Neuer CI-fokussierter Scan

## Aktueller Stand: backlog.json

**40 von 47 Issues erledigt (85%)**. Die verbleibenden **7 Issues** lassen sich klar in zwei Kategorien teilen:

### Kategorie A: Noch nicht fertig entwickelte Module (KEIN Backlog-Thema)
Diese Issues betreffen Features, die bewusst noch nicht gebaut wurden. Sie gehoeren auf eine Feature-Roadmap, nicht in den Bereinigungs-Backlog:

| ID | Modul | Beschreibung | Warum kein Backlog |
|----|-------|--------------|-------------------|
| CI-001 | MOD-10 Leads | Tiles sind ModuleTilePage-Stubs | Feature noch nicht entwickelt |
| SPEC-002 | Global | 15 Module ohne Spec-Datei | Specs folgen der Entwicklung |
| DATA-001 | MOD-08 | investment_favorites nicht persistent | Feature-Erweiterung |
| DATA-002 | MOD-03 | DMS Storage-Usage zeigt 0 Bytes | Erfordert neue Edge Function |
| UX-003 | MOD-12 | MandatCreateWizardManager Platzhalter | Feature-Erweiterung |

### Kategorie B: Echte Bereinigungs-Issues (gehoeren in den Backlog)
| ID | Modul | Beschreibung | Status |
|----|-------|--------------|--------|
| CI-005 | MOD-17 Cars | PageShell fehlt in allen 4 Sub-Tabs | offen (Effort M) |
| 1 weiteres | - | - | offen |

## Deine Beobachtung ist korrekt: CI-Inkonsistenzen bestehen weiter

Der erste Backlog hat **Architektur und Code-Hygiene** gut abgedeckt, aber **CI/Design-Konsistenz auf Tile-Ebene** wurde nur oberflaechlich geprueft. Konkret sehe ich folgende Muster-Abweichungen, die der alte Scan NICHT erfasst hat:

### 1. PageShell + ModulePageHeader Nutzung (inkonsistent)

| Muster | Module | Problem |
|--------|--------|---------|
| PageShell im Router-Parent | MOD-15 Fortbildung | Header einmal oben, Tabs darunter -- sauber |
| PageShell in jedem Sub-Tab | MOD-16 Services, MOD-20 Miety | Jeder Tab hat eigenen Header -- auch okay, aber anderes Muster |
| Kein PageShell | MOD-17 Cars (alle 4 Tabs) | Kein standardisierter Wrapper |
| Kein PageShell | MOD-13 Projekte (Tabs) | Tabs haben eigene Card-Layouts ohne PageShell |
| Inline in Monolith | MOD-12 Akquise | PageShell nur in Haupt-Route, Detail-Views mischen |

### 2. Header-Darstellung (inkonsistent)

- Manche Module zeigen den **Modul-Titel** im Header (z.B. "SHOPS", "FORTBILDUNG")
- Manche zeigen den **Tile-Titel** (z.B. "Inbox", "Fahrzeuge")
- Manche haben **gar keinen ModulePageHeader** und nutzen eigene Card-Titel
- MOD-17 Cars hat **keinen einheitlichen Header** in den Sub-Tabs

### 3. Lazy Loading (inkonsistent)

| Muster | Module |
|--------|--------|
| React.lazy + Suspense | MOD-19 Photovoltaik |
| React.lazy ohne Suspense (P0-FIX) | MOD-05, 06, 09, 10 |
| Direct imports (kein lazy) | MOD-13 Projekte, MOD-17 Cars |
| Lazy in Sprint 2 migriert | MOD-01, 02, 03, 04, 07, 08, 14 |

### 4. Kachel-Architektur (3 verschiedene Patterns)

- **Pattern A: ModuleTilePage** -- Leere Platzhalter mit quickSteps (MOD-10, MOD-18)
- **Pattern B: Eigene Komponenten** -- Voll implementiert mit eigenem Layout (MOD-17, MOD-13, MOD-12)
- **Pattern C: Hybrid** -- Manche Tabs ModuleTilePage, manche eigene (MOD-06)

## Empfehlung: Neuer, fokussierter CI-Backlog (V2)

Ja, ich empfehle eine **neue backlog.json Version 2.0**, die sich ausschliesslich auf **visuelle und strukturelle Konsistenz** konzentriert. Die alte backlog.json wird als "V1 - Architecture Sprint" archiviert, die neue fokussiert auf:

### Scan-Scope V2: Nur CI und Darstellung

| Pruefpunkt | Was wird verglichen |
|------------|---------------------|
| PageShell-Wrapper | Jeder Sub-Tab muss in PageShell gerendert werden |
| ModulePageHeader | Einheitliches Format: Modul-Titel UPPERCASE + Beschreibung |
| Lazy Loading | Konsistentes Pattern (lazy + P0-FIX oder lazy + Suspense) |
| Tile-Spacing | Gleiche Paddings, Card-Radii, Gap-Werte |
| Empty States | Konsistente EmptyState-Komponente statt Custom-Leerseiten |
| Header-Hierarchie | H1 = Modul, H2 = Tile, H3 = Sektionen |
| Mobile Responsiveness | Gleiche Breakpoints und Stacking-Verhalten |

### Vorgehen

1. Die bestehende `backlog.json` wird bereinigt: Kategorie-A-Issues (Features) werden in einen separaten `roadmap`-Block verschoben
2. Kategorie-B-Issues (CI-005 etc.) bleiben als offene Issues
3. Ein neuer systematischer CI-Scan ueber alle 21 Module erfasst die oben genannten Pruefpunkte
4. Ergebnis: Eine saubere V2-backlog.json mit geschaetzt **15-25 neuen CI-Issues**, die in 2-3 Sprints abarbeitbar sind

### Erwarteter Aufwand

- Scan: 1 Session
- Fixes: 2-3 Sessions (hauptsaechlich S/M-Effort: PageShell-Wrapper, Header, Lazy-Loading vereinheitlichen)
- Ergebnis: Alle 21 Module sehen visuell und strukturell identisch aus

