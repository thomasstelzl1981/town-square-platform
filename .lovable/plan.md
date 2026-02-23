

# Komplett-Check & Fix: Doppelte Demo-Daten

## Problem-Analyse

Die Duplikate entstehen durch ein architektonisches Muster-Problem: **Hardcoded Demo-Daten + DB-geseedete Demo-Daten werden gleichzeitig angezeigt**, weil die DB-Hooks die Demo-IDs nicht herausfiltern.

### Konkret identifizierte Duplikat-Quellen

**1. Projekte (MOD-13) -- Hauptursache der Duplikate**

Der `useDevProjects`-Hook holt ALLE Projekte aus der DB, ohne Demo-IDs zu filtern. Gleichzeitig fuegt `ProjekteDashboard.tsx` ein hardcoded `DEMO_PROJECT`-Widget hinzu, wenn der Demo-Toggle aktiv ist. Ergebnis:

- Widget 1: Hardcoded `DEMO_PROJECT` (ID: `demo-project-001`, "Residenz am Stadtpark")
- Widget 2: DB-geseedetes Projekt (ID: `f0000000-...-013001`, "Kernsanierung Altbau")

Das sind sogar zwei verschiedene Demo-Projekte mit unterschiedlichen Daten -- noch schlimmer als einfache Duplikate.

**2. Finanzanalyse (MOD-18) -- Indirekte Duplikate**

`useFinanzberichtData` holt `household_persons` in einer separaten Query (Zeile 43-55) OHNE `isDemoId`-Filter. `useFinanzanalyseData` holt dieselben Daten MIT Filter. Beide werden in `FinanzberichtSection` verwendet, was zu inkonsistenten Personenzahlen fuehren kann.

### Weitere geprufte Module (KEIN Problem)

- **SachversicherungenTab**: Korrekt -- filtert mit `isDemoId`
- **VorsorgeTab**: Korrekt -- filtert mit `isDemoId`
- **InvestmentTab**: Korrekt -- filtert mit `isDemoId`
- **KrankenversicherungTab**: Korrekt -- nutzt nur Client-Side Demo-Daten
- **VorsorgeDokumenteTab**: Korrekt -- filtert mit `isDemoId`
- **Miety (useHomesQuery)**: Korrekt -- filtert mit `isDemoId`

---

## Aktionsplan

### Fix 1: `useDevProjects` -- Demo-ID-Filter einfuegen

**Datei:** `src/hooks/useDevProjects.ts`

Aenderung: `isDemoId`-Import hinzufuegen und `useDemoToggles` einbauen. Bei deaktiviertem Demo-Toggle werden DB-Ergebnisse mit `isDemoId` gefiltert -- analog zu allen anderen Modulen.

### Fix 2: Hardcoded `DEMO_PROJECT` entfernen ODER DB-Seed entfernen

**Entscheidung:** Das hardcoded `DEMO_PROJECT` in `demoProjectData.ts` sollte entfernt werden. Stattdessen soll das DB-geseedete Projekt als einzige Demo-Quelle dienen (konsistent mit allen anderen Modulen).

Betroffene Dateien:
- `src/pages/portal/projekte/ProjekteDashboard.tsx` -- Hardcoded Demo-Widget entfernen
- `src/pages/portal/projekte/PortfolioTab.tsx` -- Hardcoded Fallback entfernen
- `src/pages/portal/projekte/VertriebTab.tsx` -- Hardcoded Fallback entfernen
- `src/pages/portal/projekte/LandingPageTab.tsx` -- Hardcoded Fallback entfernen

Die Demo-Kachel wird dann nur noch via DB-Seed und `useDevProjects` angezeigt (gefiltert durch den Toggle).

### Fix 3: `useFinanzberichtData` -- Household-Persons-Filter

**Datei:** `src/hooks/useFinanzberichtData.ts`

Die separate `household_persons`-Query (Zeile 43-55) muss den `isDemoId`-Filter in der Aggregation (Zeile 251) erhalten -- was bereits korrekt implementiert ist (`filteredHouseholdPersons`). Allerdings wird das Ergebnis auch als `householdPersons` an `persons` aus `useFinanzanalyseData` gemischt. Hier sicherstellen, dass keine Doppelzaehlung entsteht.

---

## Technische Details

### Fix 1 -- useDevProjects.ts

```typescript
// Neue Imports:
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';

// Im Hook:
const { isEnabled } = useDemoToggles();
const demoEnabled = isEnabled('GP-PROJEKT');

// portfolioRows und projects filtern:
const filteredProjects = demoEnabled ? projects : projects.filter(p => !isDemoId(p.id));
const filteredPortfolioRows = demoEnabled ? portfolioRows : portfolioRows.filter(p => !isDemoId(p.id));
```

### Fix 2 -- ProjekteDashboard.tsx

Entfernung der Zeilen 211-214 (hardcoded Demo-Widget) und Anpassung der Stats-Berechnung (Zeilen 162-169), sodass kein manuelles `demoAdd` mehr noetig ist.

### Fix 3 -- useFinanzberichtData.ts

Pruefung: Die `filteredHouseholdPersons`-Variable wird bereits korrekt gefiltert. Kein separater Fix noetig -- das Problem lag nur bei Projekte.

---

## Zusammenfassung

| # | Problem | Fix | Dateien |
|---|---------|-----|---------|
| 1 | useDevProjects filtert keine Demo-IDs | isDemoId-Filter einfuegen | useDevProjects.ts |
| 2 | Hardcoded DEMO_PROJECT + DB-Seed = Duplikate | Hardcoded Widget entfernen | ProjekteDashboard, PortfolioTab, VertriebTab, LandingPageTab |
| 3 | useFinanzberichtData Household-Persons | Bereits korrekt gefiltert | Kein Fix noetig |

**Geschaetzter Aufwand:** 30-45 Minuten

