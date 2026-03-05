

# Fix: "Vertrieb aktivieren" Toggle funktioniert nicht

## Root Cause

In `VertriebTab.tsx` Zeile 33:

```tsx
const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id || '');
```

`projects` wird asynchron geladen. Beim ersten Render ist `projects` ein leeres Array (`[]`), also wird `selectedProject` auf `''` initialisiert. Wenn die Daten spaeter geladen werden, bleibt `selectedProject` trotzdem `''` — React `useState` aktualisiert den Initialwert nicht.

Dadurch ist `activeProjectId = ''`, was `SalesApprovalSection` als `projectId=""` erhaelt. Da `!!""` = `false`, ist `hasProject = false` und der Switch ist **disabled**.

## Loesung

In `VertriebTab.tsx`:

1. `selectedProject` mit einem `useEffect` synchronisieren, der den Wert setzt, sobald `projects` geladen sind und noch kein Projekt ausgewaehlt ist:

```tsx
const [selectedProject, setSelectedProject] = useState<string>('');

// Sync: sobald Projekte geladen, erstes Projekt vorauswaehlen
useEffect(() => {
  if (!selectedProject && projects.length > 0) {
    setSelectedProject(projects[0].id);
  }
}, [projects, selectedProject]);
```

Das ist eine reine UI-Korrektur in einer einzelnen Datei (`VertriebTab.tsx`). Keine DB-Aenderung noetig.

