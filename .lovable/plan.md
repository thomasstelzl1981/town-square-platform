

# Fix-Plan: Konsistentes Klickverhalten Level 1 & 2 Navigation

## Problem-Zusammenfassung

Die Navigation flackert, weil **3-4 asynchrone State-Updates** bei einem einzigen Klick passieren:
1. `AreaTabs.handleAreaClick` → `setActiveArea` + `navigate`
2. `usePortalLayout.useEffect` → `deriveAreaFromPath` (gibt falschen Wert zurück für `/portal/area/...` Pfade)
3. `AreaOverviewPage.useEffect` → `setActiveArea` (Korrektur)

Das führt zu mehreren Re-Renders und sichtbarem Flackern der Module-Tabs.

---

## Lösungsansatz

### Fix 1: `deriveAreaFromPath` muss Area-Pfade erkennen

**Datei:** `src/manifests/areaConfig.ts`

Die Funktion `deriveAreaFromPath` muss `/portal/area/:areaKey` Pfade korrekt auflösen, bevor sie auf Modul-Pfade prüft.

**Änderung:**
```typescript
export function deriveAreaFromPath(pathname: string, moduleRouteMap: Record<string, string>): AreaKey {
  // NEU: Prüfe zuerst auf Area-Overview-Pfade
  const areaMatch = pathname.match(/^\/portal\/area\/([a-z]+)/);
  if (areaMatch) {
    const areaKey = areaMatch[1] as AreaKey;
    if (areaConfig.find(a => a.key === areaKey)) {
      return areaKey;
    }
  }
  
  // Bestehende Logik: Prüfe Modul-Pfade
  for (const [code, route] of Object.entries(moduleRouteMap)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      const area = getAreaForModule(code);
      if (area) return area;
    }
  }
  
  return 'base';
}
```

---

### Fix 2: Redundanten useEffect in AreaOverviewPage entfernen

**Datei:** `src/pages/portal/AreaOverviewPage.tsx`

Da `deriveAreaFromPath` jetzt korrekt funktioniert, wird der State automatisch synchronisiert. Der explizite `useEffect` in AreaOverviewPage ist redundant und verursacht ein zusätzliches Re-Render.

**Änderung:** useEffect entfernen oder durch eine Prüfung ergänzen, die nur bei Diskrepanz aktualisiert:

```typescript
// ENTFERNEN oder so anpassen:
useEffect(() => {
  // Nur setzen, wenn der State noch nicht korrekt ist
  // (Sollte durch Fix 1 nicht mehr nötig sein)
}, [area?.key]);
```

---

### Fix 3: SubTabs-Visibility-Logik vereinfachen

**Datei:** `src/components/portal/SubTabs.tsx`

Statt auf `subTabsVisible` State zu vertrauen, sollte SubTabs selbst entscheiden, ob es sich zeigt — basierend auf der URL:

```typescript
export function SubTabs({ module, moduleBase }: SubTabsProps) {
  const location = useLocation();
  
  // Zeige SubTabs nur, wenn wir auf einer Modul-Route sind (nicht auf Area-Overview)
  const isOnModulePage = location.pathname.startsWith(`/portal/${moduleBase}`);
  
  if (!isOnModulePage || !module.tiles || module.tiles.length === 0) {
    return null;
  }
  
  // ... Rest bleibt gleich
}
```

Damit wird `subTabsVisible` State überflüssig für diese Komponente.

---

### Fix 4: TopNavigation sollte Area-Overview-Routen berücksichtigen

**Datei:** `src/components/portal/TopNavigation.tsx`

Die SubTabs sollten nicht gerendert werden, wenn wir auf einer Area-Overview-Seite sind:

```typescript
// Erkennen, ob wir auf einer Area-Overview-Seite sind
const isOnAreaOverview = location.pathname.startsWith('/portal/area/');

// SubTabs nur rendern, wenn activeModule existiert UND wir nicht auf Area-Overview sind
{activeModule && !isOnAreaOverview && (
  <SubTabs module={activeModule.module} moduleBase={activeModule.module.base} />
)}
```

---

## Zusammenfassung der Änderungen

| Nr | Datei | Änderung | Zweck |
|----|-------|----------|-------|
| 1 | `areaConfig.ts` | `deriveAreaFromPath` erweitern | Area-Pfade korrekt erkennen |
| 2 | `AreaOverviewPage.tsx` | `useEffect` entfernen | Redundantes Re-Render vermeiden |
| 3 | `SubTabs.tsx` | URL-basierte Sichtbarkeit | State-Abhängigkeit eliminieren |
| 4 | `TopNavigation.tsx` | Area-Overview-Prüfung | SubTabs auf Overview-Seiten verstecken |

---

## Erwartetes Ergebnis

- **1 Klick = 1 State-Update** (kein Flackern)
- Level 1 (Area-Tabs) navigiert sauber zu `/portal/area/:areaKey`
- Level 2 (Module-Tabs) bleibt stabil sichtbar
- Level 3 (SubTabs) erscheint nur auf Modul-Seiten, nicht auf Area-Overviews

---

## Keine Änderungen an

- Routing-Struktur in `ManifestRouter.tsx`
- Business-Logik der Module
- Mobile Navigation

