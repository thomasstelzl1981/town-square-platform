
# Fix: PV-Widget Schalter in KI-Office Widgets

## Problem

Der Toggle-Schalter fuer das PV-Live-Widget (und potenziell andere Widgets) funktioniert nicht korrekt. Die DB-Operation schlaegt fehl (401 RLS-Verletzung), und der Schalter springt zurueck, weil das Optimistic Update fuer authentifizierte Nutzer fehlt.

## Ursachen (3 Bugs in `useWidgetPreferences.ts`)

1. **Fehlendes Optimistic Update**: In `onMutate` wird `newPrefs` berechnet, aber nie via `queryClient.setQueryData()` in den Cache geschrieben. Der Switch springt sofort zurueck.
2. **Fehlender Rollback bei Auth-Usern**: `onError` macht nur fuer `!user` einen Rollback — bei eingeloggten Nutzern bleibt der kaputte Zustand stehen.
3. **localStorage-Pfad ohne Merge**: Fuer nicht-authentifizierte Nutzer werden nachtraeglich hinzugefuegte Widgets (z.B. PV Live) nicht in die bestehenden localStorage-Preferences gemergt.

## Loesung

Alle 3 Bugs werden in einer Datei behoben:

### `src/hooks/useWidgetPreferences.ts`

**Fix 1 — Optimistic Update mit setQueryData:**
```text
onMutate: async ({ code, enabled }) => {
  if (user) {
    await queryClient.cancelQueries(...)
    const prev = queryClient.getQueryData([...])
    queryClient.setQueryData([...], (old) =>
      old?.map(p => p.widget_code === code ? {...p, enabled} : p)
    )
    return { previousPrefs: prev }
  }
  // localStorage-Pfad bleibt
}
```

**Fix 2 — Rollback fuer Auth-User:**
```text
onError: (err, variables, context) => {
  if (user && context?.previousPrefs) {
    queryClient.setQueryData([...], context.previousPrefs)
  } else if (!user && context?.previousPrefs) {
    setLocalPreferences(context.previousPrefs)
    saveToStorage(context.previousPrefs)
  }
  toast.error(...)
}
```

**Fix 3 — localStorage-Merge fuer fehlende Widgets:**
Am Ende des `useMemo` fuer `preferences` wird der `!user`-Zweig ebenfalls um eine Merge-Logik erweitert, die neue Widgets aus `SYSTEM_WIDGETS` ergaenzt, falls sie in localStorage noch nicht vorhanden sind.

**Fix 4 — Gleiche Fixes fuer updateOrderMutation:**
Dieselben Optimistic-Update- und Rollback-Fixes auch auf die Sortier-Mutation anwenden.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useWidgetPreferences.ts` | Optimistic Update, Rollback, localStorage-Merge — ca. 30 Zeilen geaendert |

## Keine DB-Migration noetig

Die RLS-Policies sind korrekt konfiguriert. Das Problem ist rein clientseitig (fehlende optimistische Updates und fehlender Merge).
