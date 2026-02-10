
# Projekt-Switcher: Gesellschaften durch Projekte ersetzen

## Problem

Der Dropdown oben rechts zeigt aktuell "Alle Gesellschaften" und filtert nach `developer_contexts`. Stattdessen soll er alle Projekte des Nutzers auflisten, damit zwischen verschiedenen Projekten gewechselt werden kann. Die gesamte Seite (Globalobjekt-Kachel, Preisliste, DMS) zeigt dann die Daten des ausgewaehlten Projekts.

## Aenderung

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

1. **Select-Dropdown umbauen:**
   - Statt `contexts` werden `portfolioRows` (= die Projekte) als Optionen angezeigt
   - Placeholder: "Projekt waehlen" statt "Alle Gesellschaften"
   - Wert: `selectedProjectId` statt `selectedContextId`
   - Im Demo-Modus: Ein Eintrag "Residenz am Stadtpark" (Demo)
   - Wenn nur ein Projekt vorhanden ist, wird es automatisch vorausgewaehlt

2. **Context-Filter entfernen:**
   - Der Import `useDeveloperContexts` wird entfernt
   - `selectedContextId` State wird entfernt
   - `useDevProjects()` wird ohne `contextId`-Filter aufgerufen (laedt alle Projekte)

3. **Daten durchreichen:**
   - `selectedProject` steuert die Inhalte der ProjectOverviewCard, Preisliste und DMS
   - Im Demo-Modus bleibt alles wie bisher (DEMO_PROJECT Daten)
   - Bei echten Projekten: `ProjectOverviewCard` bekommt `projectData` aus dem ausgewaehlten Projekt

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |

## Risiko

Niedrig. Eine State-Variable und ein Import werden ersetzt, der Select-Inhalt aendert sich. Keine DB- oder Routing-Aenderungen.
