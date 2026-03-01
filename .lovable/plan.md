

## Problem: Portal-Guard blockiert authentifizierte Nutzer auf Brand-Domains

### Ursache

In `ManifestRouter.tsx` (Zeile 82-88) gibt es einen Portal-Guard:

```text
Route /portal/* →
  IF domainEntry exists (= Brand-Domain wie systemofatown.com)
    → REDIRECT to /website/sot   ← PROBLEM
  ELSE
    → Zone2Router
```

Wenn der Nutzer sich auf `systemofatown.com` einloggt, navigiert `Auth.tsx` (Zeile 34) nach `/portal`. Der Guard erkennt die Brand-Domain und leitet sofort zurück zur Website — **unabhängig davon, ob der Nutzer eingeloggt ist**.

### Lösung

Den Portal-Guard in `ManifestRouter.tsx` so anpassen, dass **authentifizierte Nutzer** auf Brand-Domains trotzdem Zone 2 erreichen. Nur **nicht-authentifizierte** Besucher werden zur Website umgeleitet.

### Änderungen

**1. `src/router/ManifestRouter.tsx`** — Portal-Guard um Auth-Check erweitern:
- Neuen Guard-Komponenten `PortalOrWebsiteRedirect` erstellen, der den Auth-Status prüft
- Wenn User eingeloggt → Zone2Router laden
- Wenn User nicht eingeloggt → zur Brand-Website weiterleiten (bisheriges Verhalten)

```text
Route /portal/* →
  IF domainEntry exists
    IF user authenticated → Zone2Router  ← NEU
    ELSE → REDIRECT to /website/sot     ← wie bisher
  ELSE
    → Zone2Router
```

**2. Auth-Status**: Nutzt den bestehenden `useAuth()` Hook aus `@/contexts/AuthContext` — kein neuer State nötig.

### Technische Details

- Die Komponente `PortalOrWebsiteRedirect` wird inline im ManifestRouter definiert
- Sie nutzt `useAuth()` für den Session-Check und zeigt einen Loading-Spinner während `isLoading`
- Keine Änderungen an Zone-Grenzen, Manifests oder Freeze-geschützten Modulen nötig
- Betrifft nur `ManifestRouter.tsx` (nicht frozen, kein Modul-Pfad)

