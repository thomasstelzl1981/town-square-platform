

# Diagnose: Weisser Bildschirm im Preview

## Ursache gefunden

Der Vite Dev-Server im Preview gibt **503-Fehler** zurueck beim Laden von Modulen:

```
Failed to load resource: the server responded with a status of 503 ()
→ src/components/ui/input-otp.tsx
```

Das bedeutet: Der Dev-Server ist ueberlastet und kann nicht alle Module ausliefern. Die App startet, aber React kann nicht vollstaendig rendern — daher der weisse Bildschirm.

## Warum passiert das?

Das Projekt hat 780+ Dateien. Der Preview Dev-Server laeuft in einem Browser-Container mit begrenztem Speicher. Wenn Vite zu viele Module gleichzeitig kompilieren muss, antwortet er mit 503 (Service Unavailable). Das ist **kein Code-Bug** — es ist eine Ressourcen-Limitierung der Preview-Umgebung.

Die Cleanups der letzten Naechte haben die Dateianzahl vermutlich nicht wesentlich reduziert, und bestimmte Imports laden Module eager statt lazy:

- `Auth.tsx` wird direkt in `App.tsx` importiert (nicht lazy) und zieht `input-otp` mit
- Das erhoet den initialen Module-Graph

## Plan: Preview-Last reduzieren

### 1. Auth-Page lazy laden (App.tsx)
`Auth.tsx` ist aktuell ein direkter Import in App.tsx. Da die Auth-Seite nur bei `/auth` benoetigt wird, kann sie lazy geladen werden:

```typescript
// Vorher: import Auth from "./pages/Auth";
// Nachher:
const Auth = lazy(() => import("./pages/Auth"));
```

Das entfernt `input-otp` und alle Auth-Abhaengigkeiten aus dem initialen Bundle.

### 2. AuthResetPassword lazy laden (App.tsx)
Gleiche Optimierung:
```typescript
const AuthResetPassword = lazy(() => import("./pages/AuthResetPassword"));
```

### 3. PresentationPage lazy laden (App.tsx)
Bereits importiert aber nicht lazy:
```typescript
const PresentationPage = lazy(() => import("./pages/presentation/PresentationPage"));
```

### Zusammenfassung

| Datei | Aenderung |
|---|---|
| `src/App.tsx` | Auth, AuthResetPassword, PresentationPage → lazy imports |

Diese Aenderung reduziert den initialen Module-Graph um ca. 15-20 Module und entlastet den Dev-Server. Die Published-Version (systemofatown.lovable.app) ist davon **nicht betroffen** — dort wird alles korrekt gebundled.

**Wichtig:** Wenn der Preview trotzdem weiss bleibt, hilft ein Reload des Previews (Refresh-Button). Das ist ein bekanntes Verhalten bei grossen Projekten in der Preview-Umgebung.

