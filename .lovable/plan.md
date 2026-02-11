

# MOD-13 Projekte: Mobile Tile-Navigation

## Problem

Auf dem Desktop zeigt die `TopNavigation` drei Ebenen: Area > Module > Tiles. Auf Mobile gibt `TopNavigation` jedoch `null` zurueck (Zeile 57-59 in `TopNavigation.tsx`). Dadurch fehlt die Level-3-Navigation (SubTabs), die zwischen den 4 Tiles "Dashboard / Projekte / Vertrieb / Landing Page" umschaltet. Die `MobileBottomNav` navigiert nur auf Area-Ebene.

## Loesung

Die bestehende `SubTabs`-Komponente wird **direkt im Content-Bereich** der Modul-Seiten auf Mobile angezeigt -- als horizontale Pill-Leiste am oberen Rand des Inhalts. Kein neues Menue, kein neues UI-Element, sondern das vorhandene `SubTabs` wird wiederverwendet.

### Ansatz: Generische Loesung in `PortalLayout.tsx`

Statt die SubTabs nur in MOD-13 einzubauen, wird die SubTabs-Leiste im Mobile-Layout von `PortalLayout.tsx` oberhalb des `<Outlet />` eingefuegt. So profitieren **alle** Module automatisch davon.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/PortalLayout.tsx` | Im Mobile-Block: SubTabs-Komponente oberhalb `<Outlet />` rendern, mit gleicher Logik wie in TopNavigation (aktives Modul ermitteln) |
| `src/components/portal/SubTabs.tsx` | Keine Aenderung noetig -- rendert bereits korrekt basierend auf `location.pathname` |

## Technische Details

### PortalLayout.tsx (Mobile-Block, ca. Zeile 88-113)

Neue Imports: `useLocation`, `getModulesSorted`, `getModuleDisplayLabel` aus bestehenden Manifests.

Logik: Aktives Modul wird aus `location.pathname` abgeleitet (gleiche Logik wie `TopNavigation`). Wenn ein Modul aktiv ist und dessen Tiles existieren, wird `<SubTabs>` als sticky horizontale Leiste am oberen Rand des Content-Bereichs gerendert.

```text
Mobile Layout (vorher):
  SystemBar
  <main>
    <Outlet />      <-- kein Tile-Nav
  </main>
  MobileBottomNav

Mobile Layout (nachher):
  SystemBar
  <main>
    <SubTabs />     <-- nur wenn Modul aktiv + Tiles vorhanden
    <Outlet />
  </main>
  MobileBottomNav
```

Die SubTabs-Leiste wird `sticky top-0 z-10 bg-background/80 backdrop-blur-sm` gestylt, damit sie beim Scrollen sichtbar bleibt. Kein neues Menue-Konzept -- es ist dieselbe Komponente wie auf Desktop, nur an anderer Stelle platziert.

### Keine Aenderung an SubTabs.tsx

Die Komponente ist bereits path-basiert und braucht keine mobile-spezifische Anpassung. Die `overflow-x-auto scrollbar-none` Klassen sorgen bereits fuer horizontales Scrollen bei Platzmangel.
