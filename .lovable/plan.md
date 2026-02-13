

# Session-Stabilitaet: Unerwuenschte Logouts beheben

## Ursache

Die Auth-Backend-Logs zeigen **keine Fehler** — alle Token-Refreshes sind erfolgreich (Status 200). Das Problem liegt im Frontend:

1. **Race Condition in `PortalLayout.tsx` (Zeile 83):** Die Pruefung `if (!user && !isDevelopmentMode)` leitet sofort zu `/auth` weiter, sobald `user` kurzzeitig `null` ist — z.B. waehrend eines Token-Refresh-Zyklus oder bei einem kurzen Netzwerk-Timeout.

2. **Gleiche Race Condition in `AdminLayout.tsx` (Zeile 38-40):** Navigiert sofort zu `/auth` wenn `user` null wird.

3. **`onAuthStateChange` (Zeile 204-228):** Setzt `user` auf `null` bei jedem Event ohne Session, ohne zwischen `SIGNED_OUT` (echtes Logout) und temporaerem Zustand (Refresh-Uebergang) zu unterscheiden.

Die Einstellung "86.400 Sekunden" hat keinen Einfluss auf das Auth-Verhalten — das war vermutlich eine React-Query-Cache-Einstellung, keine Auth-Session-Einstellung.

## Loesung

### 1. `AuthContext.tsx` — Event-basierte Unterscheidung

Die `onAuthStateChange`-Logik wird erweitert, um nur bei einem echten `SIGNED_OUT`-Event den User-State zu loeschen:

```text
onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Echtes Logout → State komplett zuruecksetzen
    setUser(null); setSession(null); ...
  } else if (session?.user) {
    // Gueltige Session → State aktualisieren
    setUser(session.user); setSession(session); ...
  }
  // Kein else: bei temporaerem null-State wird NICHTS geaendert
});
```

### 2. `PortalLayout.tsx` — Grace-Period statt sofortiger Redirect

Die Redirect-Logik wird um eine Verzoegerung ergaenzt, damit ein kurzzeitiges `null` keinen Redirect ausloest:

```text
Vorher:  if (!user && !isDev) → sofort /auth
Nachher: if (!user && !isDev && !isLoading && hasInitialized && kein laufender Refresh)
         → erst nach 2s Verzoegerung redirect
```

### 3. `AdminLayout.tsx` — Gleiche Absicherung

Die `navigate('/auth')`-Logik wird analog zum PortalLayout mit einer Verzoegerung versehen.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | `onAuthStateChange` nur bei `SIGNED_OUT` Event den User auf null setzen; neuer `isRefreshing`-State |
| `src/components/portal/PortalLayout.tsx` | Redirect mit Verzoegerung (2s Debounce) statt sofortigem Redirect |
| `src/components/admin/AdminLayout.tsx` | Gleiche Debounce-Logik fuer den Admin-Bereich |

## Erwartetes Ergebnis

- Token-Refreshes laufen im Hintergrund ohne sichtbare Unterbrechung
- Nur ein explizites Logout (Button-Klick) oder ein abgelaufener Refresh-Token (7+ Tage) fuehrt zum Login-Screen
- Keine Aenderung am Backend noetig

