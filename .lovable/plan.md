
## Ziel (P0)
Zone 2 (Portal) soll sich wieder wie “normale Navigation” anfühlen:
- Jeder Klick auf ein Modul/Tile navigiert sofort (kein “erst Loader, dann zweiter Klick”).
- Kein Flackern/Unmount der gesamten Portal-UI beim Navigieren.
- Immobilienakte / Portfolio etc. bleiben stabil erreichbar, ohne dass Navigation “verschluckt” wird.

## Was wir bereits sicher wissen (aus Code-Review)
### Root Cause #1 (sehr wahrscheinlich, systemisch): Render-Loop in `PortalNav.tsx`
In `src/components/portal/PortalNav.tsx` passiert aktuell Folgendes:
- `manifestTiles = buildTilesFromManifest()` wird **bei jedem Render neu gebaut** (neues Array).
- `visibleTiles = manifestTiles.filter(...)` ist dadurch ebenfalls **bei jedem Render eine neue Referenz**.
- Der Effekt “Auto-open active module” hat `visibleTiles` in den Dependencies:
  - `useEffect(..., [location.pathname, visibleTiles])`
- Ergebnis: Der Effekt läuft extrem häufig / potenziell jede Navigation löst eine Render-Kaskade aus und setzt `openModules`, was wieder rerendert.

Das kann Router-Transitions, Lazy-Mounts und Click-Events “gefühlt” instabil machen (erste Navigation wird gestartet, UI remountet/ändert Zustand, der Nutzer klickt erneut und dann klappt es).

### Root Cause #2: Imperative Navigation per `<button>` + `navigate()` (Zone 2) vs. deklarative Links (Zone 1)
In Zone 2 nutzt der Parent-Eintrag für Module mit Subtiles (z.B. Immobilien, Finanzierung) ein `<button>` mit `navigate(route)`.
Zone 1 nutzt durchgehend `NavLink` (declarativ), was stabiler ist.

In einer UI, die durch Root Cause #1 stark rerendert, ist ein `<button>`-Click deutlich anfälliger dafür, “unterzugehen”, weil der DOM unter dem Cursor ggf. neu gerendert wird.

### Root Cause #3: PortalLayout unmountet die gesamte UI bei `isLoading`
`src/components/portal/PortalLayout.tsx`:
- Wenn `isLoading` true ist, wird **die komplette Portal-UI ersetzt** durch einen Fullscreen-Loader.
- Wenn `AuthContext` während Navigation kurz “wackelt” (z.B. dev-mode fetches / setActiveOrganization / setProfile), ist das ein kompletter Remount von Nav + Outlet.
Das fühlt sich exakt so an wie: “Erster Klick → Rad → nichts passiert; zweiter Klick → klappt”.

### Root Cause #4: Dev-Mode AuthContext erzeugt unnötige State-Updates (Objekt-Referenzen)
In `src/contexts/AuthContext.tsx` wird in Dev-Mode mehrfach ein neues `mockOrg`-Objekt literal erstellt und in State gesetzt.
Auch wenn die Daten “gleich” sind, ist die Referenz neu → React sieht das als Änderung → Portal remountet häufiger als nötig.

## Umsetzung (konkret, minimal-invasiv, aber wirksam)

### Schritt 1 — `PortalNav.tsx` stabilisieren (P0)
**Ziel:** Keine render-getriebene State-Loop mehr.

Maßnahmen:
1) `manifestTiles` memoizen
- `const manifestTiles = useMemo(() => buildTilesFromManifest(), []);`
  - (Manifest ist SSOT und statisch; wenn wir jemals dynamisch werden, hängen wir es an eine saubere dependency).

2) `visibleTiles` memoizen
- `const visibleTiles = useMemo(() => manifestTiles.filter(...), [manifestTiles, activeTileCodes, isDevelopmentMode, userRoles]);`

3) Auto-open-Effect so umbauen, dass er NICHT an einem ständig-neuen Array hängt
Option A (präferiert):
- `const activeModuleCode = useMemo(() => findActiveModuleCode(location.pathname, visibleTiles), [location.pathname, visibleTiles]);`
- `useEffect(() => { if(activeModuleCode) setOpenModules(prev => prev[activeModuleCode] ? prev : ({...prev, [activeModuleCode]: true})) }, [activeModuleCode]);`

Damit setzt er `openModules` nur, wenn wirklich nötig.

### Schritt 2 — Parent-Navigation von `<button>` auf `<Link/NavLink>` umstellen (P0)
**Ziel:** Router soll Navigation “nativ” behandeln; kein Event-Verlust durch imperative Navigation.

Maßnahmen:
- In der Expanded-Variante für Module mit Subtiles:
  - Parent wird `Link`/`NavLink` statt `button`.
  - Chevron bleibt ein `button` und macht ausschließlich Toggle.
- In collapsed state ebenso: statt `button` könnte man ebenfalls `Link`/`NavLink` verwenden (oder button lassen, aber stabiler ist Link).

Wichtig: Styling behalten, Funktion gleich:
- Parent click: /portal/{base}
- Chevron: nur submenu toggle, `stopPropagation` bleibt.

### Schritt 3 — `PortalLayout.tsx` Loading-Guard entschärfen (P0)
**Ziel:** Portal-UI (Navigation) darf beim kurzzeitigen Loading nicht unmounten.

Maßnahmen:
- Statt `if(isLoading) return FullscreenLoader`:
  - Portal layout immer rendern,
  - bei loading: ein **Overlay** (oder nur “Content skeleton”) über dem Outlet, aber Sidebar/Header bleiben.
- Alternative (noch minimaler):
  - “Initial loading only”: nur beim allerersten Mount blocken, danach niemals mehr Fullscreen ersetzen.
  - Umsetzen via `hasInitialized` state/ref.

### Schritt 4 — `AuthContext.tsx` Dev-Mode State stabilisieren (P0)
**Ziel:** Keine unnötigen “neue Objekt-Referenz” Updates; weniger Remounts.

Maßnahmen:
1) `DEV_MOCK_ORG` und `DEV_MOCK_PROFILE/MEMBERSHIP` als **Konstanten außerhalb** der Komponente definieren (oder via useMemo).
2) Beim Setzen: nur updaten, wenn sich `id` wirklich ändert (guard):
- `setActiveOrganization(prev => prev?.id === DEV_TENANT_UUID ? prev : DEV_MOCK_ORG);`
3) Dev-Mode init nicht doppelt triggern:
- Aktuell passieren `onAuthStateChange` und `getSession()` beide; prüfen, dass wir nicht 2x hintereinander denselben Dev-Init fahren.

### Schritt 5 — (Optional, aber sinnvoll) “Anti-Lüge” Diagnostik für Zone 2 Navigation
**Ziel:** Wenn wieder Instabilität auftritt, sehen wir es sofort.

Maßnahmen (nur dev-mode):
- Kleine Debug-Info im PortalHeader oder PortalNav:
  - renderCount (useRef++)
  - currentPath
  - activeModuleCode
  - isLoading flags (auth + nav loading)

Das hilft, ohne weitere Audit-Runden.

## Betroffene Dateien
- `src/components/portal/PortalNav.tsx` (Memoization + Link/NavLink + openModules-effect fix)
- `src/components/portal/PortalLayout.tsx` (Loading UI: Overlay statt Unmount)
- `src/contexts/AuthContext.tsx` (Dev-mode state stabilization)
- Optional:
  - `src/components/portal/MobileDrawer.tsx` (wahrscheinlich nicht nötig, aber falls wir Patterns angleichen wollen)
  - `src/components/portal/PortalHeader.tsx` (nur falls Debug-Badge)

## Risiken / Trade-offs
- Memoization muss sauber abhängig sein von `activeTileCodes/userRoles`; sonst könnte das Menü nicht “nachladen”. Wir lösen das durch korrektes `useMemo` dependency set.
- Änderung von Fullscreen-Loader zu Overlay kann “kurz falsche Daten” zeigen, wenn Outlet-Page auf Auth-Daten wartet. Deshalb ggf. nur Outlet blocken, nicht Header/Nav.

## Validierung (Akzeptanztests)
1) Reproduzierbarkeit:
- Browser hard refresh auf `/portal`
- Dann 10x hintereinander verschiedene Module klicken (Immobilien, DMS, Finanzierung, …)
- Erwartung: Jede Navigation beim ersten Klick.

2) “Spinner-/Loader”:
- Kein dauerndes Flackern im PortalLayout (Nav bleibt stabil sichtbar).

3) Deep link:
- Direkt `/portal/immobilien/00000000-0000-4000-a000-000000000001` laden
- Erwartung: Seite bleibt stehen, kein “kurz sichtbar, dann wieder Loader” Loop.

4) Regression Zone 1:
- Admin weiterhin stabil (sollte unangetastet bleiben).

## Reihenfolge (damit wir schnell Wirkung sehen)
1) PortalNav Memoization + Effect Fix (wahrscheinlich größter Hebel)
2) Parent Buttons -> Link/NavLink
3) PortalLayout Loader entschärfen
4) AuthContext Dev-mode Stabilisierung
5) Optional Debug-Badge

