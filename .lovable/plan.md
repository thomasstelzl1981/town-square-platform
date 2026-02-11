

# Demo-Projekt fixieren + Projekt-Switcher als Kacheln + Echte Units laden

## Bestaetigung: Demo-Projekt bleibt

Das Demo-Projekt ("Residenz am Stadtpark") wird durch `isDemoMode(portfolioRows)` automatisch angezeigt, wenn keine echten Projekte existieren (`portfolioRows.length === 0`). Sobald ein echtes Projekt angelegt wird, verschwindet das Demo und die echten Daten werden gezeigt. Dieses Verhalten bleibt unveraendert — das Demo-Projekt ist im Muster-Account permanent sichtbar.

---

## Aenderung 1: Projekt-Switcher als Kacheln (PortfolioTab)

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

Aktuell: Ein `Select`-Dropdown (Zeile 159-166) zum Projekt-Wechsel.

Neu: Die bestehende `ProjectCard`-Komponente (bereits vorhanden mit `isSelected`-Prop und Ring-Highlight) als horizontale Kachel-Leiste einsetzen:

- Oberhalb der Preisliste eine horizontale Reihe mit `ProjectCard`-Kacheln rendern (gleiche Komponente wie auf dem Dashboard)
- Im Demo-Modus: Eine einzelne Demo-Kachel (ausgegraut, wie bisher)
- Mit echten Projekten: Alle Projekte als klickbare Kacheln, das ausgewaehlte bekommt `isSelected={true}` (Ring-Highlight)
- Das Select-Dropdown wird entfernt und durch die Kacheln ersetzt
- Kacheln nutzen `onClick` statt Navigation, um `selectedProjectId` zu setzen

---

## Aenderung 2: Echte Units laden (kritischer Fix)

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

Aktuell (Zeile 86):
```
const baseUnits: DemoUnit[] = isDemo ? DEMO_UNITS : DEMO_UNITS; // TODO: replace with real units
```

Dieser TODO ist der Kern des Problems — echte Projekte zeigen immer Demo-Daten.

Neu:
- Einen Supabase-Query auf `dev_project_units` fuer das `selectedProjectId` ausfuehren (analog zu `useProjectDossier`)
- Die echten Units auf das `DemoUnit`-Interface mappen:
  - `unit_number` -> `name`
  - `unit_type` -> `type`
  - `area_sqm` -> `area_sqm`
  - `list_price` -> `list_price`
  - `status` -> `status`
  - Fehlende Felder wie `annual_net_rent`, `parking_price` mit Defaults (0) befuellen
- Im Demo-Modus weiterhin `DEMO_UNITS` verwenden

---

## Aenderung 3: ProjectOverviewCard dynamisch machen

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

Aktuell: `ProjectOverviewCard` bekommt nur `isDemo` als Prop und zeigt immer die gleichen Demo-Daten.

Neu: Das ausgewaehlte Projekt (`selectedProject`) als Prop an die OverviewCard uebergeben, damit Name, Stadt, PLZ, Einheiten-Count dynamisch angezeigt werden.

---

## Technische Details

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `PortfolioTab.tsx` | Select-Dropdown durch ProjectCard-Kacheln ersetzen, echte Units laden, OverviewCard dynamisieren |

### Keine Aenderungen an
- `ProjectCard.tsx` (unterstuetzt bereits `isSelected` und `onClick`)
- `demoProjectData.ts` (Demo-Logik bleibt)
- `ProjekteDashboard.tsx` (Dashboard bleibt wie es ist)
- Datenbankschema (alle Tabellen existieren)

