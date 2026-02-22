

## Fix: React Hooks Naming Violation in useGeolocation.ts

### Problem
Die Funktion `useProfileFallback` innerhalb von `useEffect` beginnt mit `use`, was ESLint als React Hook interpretiert. Hooks duerfen aber nicht innerhalb von Callbacks aufgerufen werden -- das erzeugt 4 `rules-of-hooks` Violations.

### Loesung
Umbenennung von `useProfileFallback` zu `applyProfileFallback` an allen 5 Stellen in `src/hooks/useGeolocation.ts`:

- Zeile 26: Definition `const useProfileFallback = ()` wird zu `const applyProfileFallback = ()`
- Zeile 42: Aufruf in mobile-Branch
- Zeile 47: Aufruf bei fehlendem `navigator.geolocation`
- Zeile 70: Aufruf im catch-Block (Geocoding-Fehler)
- Zeile 80: Aufruf im Geolocation-Error-Callback

### Risiko
Minimal -- rein kosmetische Umbenennung einer lokalen Variable. Kein Export, keine externe Abhaengigkeit.

### Technische Details
Datei: `src/hooks/useGeolocation.ts`
Aenderung: 5x Textersetzung `useProfileFallback` zu `applyProfileFallback`
Keine weiteren Dateien betroffen (nur in dieser Datei verwendet).

