

## Plan: Armstrong-Widget zählbar machen

### Problem

In `PortalDashboard.tsx` Zeile 120 wird Armstrong bedingungslos eingefügt:
```typescript
return [ARMSTRONG_WIDGET_ID, ...enabledSystemWidgetIds];
```
Das passiert **außerhalb** der Widget-Preferences-Logik. Wenn ein User 8 Widgets aktiviert hat, sieht er 9.

### Lösung

**1 Datei editieren:** `src/pages/portal/PortalDashboard.tsx`

Armstrong nur einfügen, wenn es nicht bereits in `enabledSystemWidgetIds` enthalten ist (Duplikat-Schutz), und es als reguläres System-Widget über die Preferences steuerbar machen:

```typescript
const systemWidgetIds = useMemo(() => {
  if (enabledSystemWidgetIds.includes(ARMSTRONG_WIDGET_ID)) {
    return enabledSystemWidgetIds;
  }
  return [ARMSTRONG_WIDGET_ID, ...enabledSystemWidgetIds];
}, [enabledSystemWidgetIds]);
```

Damit gilt: Wenn Armstrong in den Preferences aktiviert ist → wird es gezählt. Wenn es dort nicht auftaucht (z.B. kein DB-Eintrag), wird es als Fallback trotzdem angezeigt (Abwärtskompatibilität). Keine Dopplung mehr.

### Auswirkung

- User mit 8 aktivierten Widgets (inkl. Armstrong-Preference) → sieht 8
- User ohne explizite Armstrong-Preference → sieht Armstrong trotzdem (Fallback)
- Keine DB-Migration nötig

