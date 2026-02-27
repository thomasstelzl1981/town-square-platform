

## Problem: Zuhause-Seite leer beim ersten Navigieren

### Ursache

`MietyPortalPage` ignoriert den `isLoading`-Zustand aus `useZuhauseWidgets`. Die Ladesequenz:

1. Navigation zu `/portal/immobilien/zuhause`
2. `useZuhauseWidgets` startet DB-Queries — `dataReady = false`, `order = []`
3. `MietyPortalPage` prueft Zeile 205: `homes.length === 0 && visibleWidgetIds.length <= 2` → zeigt Empty-State ODER
4. Bernhard hat Homes → `homes.length > 0` aber `visibleWidgetIds = []` (weil `order` noch `[]` ist, Hydration wartet auf `dataReady`)
5. → DashboardGrid rendert mit 0 Widgets → leere Seite

Beim Hard Refresh sind die Queries bereits gecached (React Query) → `dataReady` ist sofort `true` → Hydration laeuft → Widgets erscheinen.

### Fix

**Datei: `src/pages/portal/MietyPortalPage.tsx`**

1. `isLoading` aus `useZuhauseWidgets()` destrukturieren (wird bereits exportiert, Zeile 250)
2. Loading-Guard am Anfang der Komponente einbauen — vor dem Empty-State-Check:

```tsx
const { allWidgets, visibleWidgetIds, order, updateOrder, hideWidget, showWidget, hiddenIds, getWidget, homes, isLoading } = useZuhauseWidgets();

// ... nach den Hooks, vor showCreateForm Check:
if (isLoading) {
  return (
    <PageShell>
      <ModulePageHeader title="Home" description="Ihr persönliches Zuhause-Dashboard" />
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </PageShell>
  );
}
```

3. `Loader2` Import von `lucide-react` hinzufuegen

### Betroffene Datei

| Datei | Aenderung |
|-------|----------|
| `src/pages/portal/MietyPortalPage.tsx` | `isLoading` aus Hook nutzen, Loading-Spinner vor Empty-State |

