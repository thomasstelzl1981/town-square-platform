
# Demo-Daten Leaks Fix — Projekte, Akquise, Zuhause

## Problem

Wenn Demo-Toggles deaktiviert sind, verschwinden zwar die Demo-Widgets, aber die Demo-Daten bleiben im System aktiv (z.B. Demo-Projekt wird weiterhin als `selectedProject` verwendet, Detail-Views zeigen Demo-Daten).

## Ursache

Die `useState`-Initialisierung in den Projekt-Tabs faellt auf `DEMO_PROJECT_ID` zurueck, selbst wenn `showDemoProject === false`. Zusaetzlich fallen `baseUnits` und `activeProject` auf Demo-Daten zurueck.

## Fixes (4 Dateien)

### 1. `src/pages/portal/projekte/PortfolioTab.tsx`

**Zeile 53** — Fallback aendern:
```typescript
// ALT:
const [selectedProjectId, setSelectedProjectId] = useState<string>(
  showDemoProject ? DEMO_PROJECT_ID : (portfolioRows[0]?.id || DEMO_PROJECT_ID)
);
// NEU:
const [selectedProjectId, setSelectedProjectId] = useState<string>(
  showDemoProject ? DEMO_PROJECT_ID : (portfolioRows[0]?.id || '')
);
```

**Zeile 75-77** — selectedProject Guard:
```typescript
// ALT:
const selectedProject = isSelectedDemo
  ? DEMO_PROJECT
  : portfolioRows.find(p => p.id === selectedProjectId) || portfolioRows[0];
// NEU:
const selectedProject = (isSelectedDemo && showDemoProject)
  ? DEMO_PROJECT
  : portfolioRows.find(p => p.id === selectedProjectId) || portfolioRows[0] || null;
```

**Zeile 109-110** — baseUnits Guard:
```typescript
// ALT:
if (isSelectedDemo || !realUnits || realUnits.length === 0) return DEMO_UNITS;
// NEU:
if (isSelectedDemo && showDemoProject) return DEMO_UNITS;
if (!realUnits || realUnits.length === 0) return [];
```

### 2. `src/pages/portal/projekte/VertriebTab.tsx`

**Zeile 36** — Fallback aendern:
```typescript
// ALT:
const [selectedProject, setSelectedProject] = useState<string>(
  showDemoProject ? DEMO_PROJECT_ID : (projects[0]?.id || DEMO_PROJECT_ID)
);
// NEU:
const [selectedProject, setSelectedProject] = useState<string>(
  showDemoProject ? DEMO_PROJECT_ID : (projects[0]?.id || '')
);
```

**Zeile 39-40** — isSelectedDemo Guard:
```typescript
const isSelectedDemo = showDemoProject && isDemoProject(selectedProject);
```

### 3. `src/pages/portal/projekte/LandingPageTab.tsx`

**Zeile 60** — Fallback aendern:
```typescript
// ALT:
const [selectedId, setSelectedId] = useState<string>(
  showDemoProject ? DEMO_PROJECT_ID : (portfolioRows[0]?.id || 'new')
);
// NEU:
const [selectedId, setSelectedId] = useState<string>(
  showDemoProject ? DEMO_PROJECT_ID : (portfolioRows[0]?.id || '')
);
```

**Zeile 62** — isSelectedDemo Guard:
```typescript
const isSelectedDemo = showDemoProject && isDemoProject(selectedId);
```

**Zeile 65-67** — activeProject Guard:
```typescript
// ALT:
const activeProject: ProjectPortfolioRow = isSelectedDemo
  ? DEMO_PROJECT
  : (portfolioRows.find(p => p.id === selectedId) || portfolioRows[0] || DEMO_PROJECT);
// NEU:
const activeProject: ProjectPortfolioRow | null = isSelectedDemo
  ? DEMO_PROJECT
  : (portfolioRows.find(p => p.id === selectedId) || portfolioRows[0] || null);
```

### 4. Zuhause-Modul — Kein Fix noetig

Das Zuhause-Modul zeigt echte Profildaten (eigene Wohnung), keine Demo-Daten. Das ist das erwartete Verhalten bei Demo OFF.

## Ergebnis

- Demo OFF + keine echten Projekte = leerer Zustand (kein Projekt selektiert)
- Demo OFF + echte Projekte = erstes echtes Projekt selektiert
- Demo ON = Demo-Projekt selektiert (wie bisher)
