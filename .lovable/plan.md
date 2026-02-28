

## Code-Splitting Plan: Zone-basierte Router-Trennung

### Problem

`ManifestRouter.tsx` ist eine 781-Zeilen-Datei mit **310 `React.lazy`-Imports**. Obwohl lazy-loaded, muss Vites Dev-Server trotzdem den gesamten Module-Graph beim Start aufbauen — alle 3 Zonen gleichzeitig. Das sprengt den Speicher der Preview-Instanz.

### Lösung: Drei separate Zone-Router-Dateien

Die Component-Maps und Imports werden aus `ManifestRouter.tsx` in drei eigenständige Dateien extrahiert, die selbst erst lazy-loaded werden, wenn die jeweilige Zone tatsächlich besucht wird.

```text
VORHER:
  ManifestRouter.tsx (781 Zeilen, 310 lazy imports)
    ├── Zone 1 imports (40+ components)
    ├── Zone 2 imports (25+ components)
    └── Zone 3 imports (80+ components, 8 Brands)

NACHHER:
  ManifestRouter.tsx (~80 Zeilen, 3 lazy imports)
    ├── lazy(() => Zone1Router.tsx)  — nur bei /admin/*
    ├── lazy(() => Zone2Router.tsx)  — nur bei /portal/*
    └── lazy(() => Zone3Router.tsx)  — nur bei /website/*
```

### Dateien

| Aktion | Datei | Inhalt |
|--------|-------|--------|
| Neu | `src/router/Zone1Router.tsx` | AdminLayout, alle Admin-Components, Component-Maps, Desk-Maps, Zone-1-Routing-Logic |
| Neu | `src/router/Zone2Router.tsx` | PortalLayout, alle Module-Pages, Dynamic-Routes, Zone-2-Routing-Logic |
| Neu | `src/router/Zone3Router.tsx` | Alle Brand-Layouts, alle Brand-Component-Maps, Zone-3-Routing-Logic inkl. Flat-Routes |
| Edit | `src/router/ManifestRouter.tsx` | Reduziert auf ~80 Zeilen: nur noch 3 lazy-importierte Zone-Router + Legacy-Redirects + 404 |

### Erwarteter Effekt

- **Portal-Nutzer** (`/portal/*`): Laden nur Zone2Router → ~25 Module statt 310
- **Website-Besucher** (`kaufy.immo`): Laden nur Zone3Router → nur die jeweilige Brand
- **Admin** (`/admin/*`): Lädt nur Zone1Router
- **Dev-Server Memory**: Sinkt um ca. 60-70%, weil nur 1 von 3 Zonen im Module-Graph landet
- **Keine funktionale Änderung** — alle Routen, Redirects und Component-Maps bleiben identisch

### Technische Details

- Jeder Zone-Router exportiert eine `<Routes>`-Struktur als Default-Export
- `ManifestRouter.tsx` nutzt `React.lazy(() => import('./Zone1Router'))` etc.
- Legacy-Redirects und 404 bleiben in ManifestRouter (zonenübergreifend)
- `PathNormalizer` bleibt in ManifestRouter als Wrapper
- Die `getDomainEntry()`-Logik für Flat-Routes wandert in Zone3Router

