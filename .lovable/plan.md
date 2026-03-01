

## Diagnose

Die Gmail OAuth-Verbindung funktioniert technisch (Edge Function loggt "Successfully connected"), aber das Popup-Fenster schliesst sich nicht und zeigt stattdessen den rohen HTML-Quellcode.

**Ursache 1 — `window.opener` ist `null`**: Nach der Google OAuth-Redirect-Kette (Popup → Google → Edge Function Callback) verliert der Browser die `window.opener`-Referenz. Dadurch wird `postMessage` nie an das Elternfenster gesendet, und das Popup bleibt offen.

**Ursache 2 — UTF-8**: Dem HTML fehlt `<meta charset="utf-8">`, daher wird "schließt" als "schlieÃŸt" angezeigt.

## Loesung

Zwei Dateien muessen angepasst werden:

### 1. Edge Function: `supabase/functions/sot-mail-gmail-auth/index.ts`

Die `popupResultHtml`-Funktion (Zeilen 51-72) wird robuster:

- `<meta charset="utf-8">` hinzufuegen (behebt Umlaut-Problem)
- **localStorage als Fallback-Kanal**: Zusaetzlich zu `postMessage` wird das Ergebnis in `localStorage.setItem('gmail_auth_result', ...)` geschrieben — das funktioniert auch ohne `window.opener`
- `postMessage` bleibt als primaerer Kanal erhalten (fuer den Fall dass opener existiert)
- Retry-Logik fuer `window.close()` (manche Browser brauchen einen kurzen Delay)

```javascript
// Neue popupResultHtml:
// 1. Schreibt Ergebnis in localStorage (zuverlässig)
// 2. Versucht postMessage (falls opener da)
// 3. Versucht window.close() mit Retry
// 4. Zeigt "Fenster manuell schliessen" Fallback-Text
```

### 2. Frontend: `src/components/portal/office/AccountIntegrationDialog.tsx`

Die `handleGoogleConnect`-Funktion (Zeilen 316-348) erhaelt einen zusaetzlichen `storage`-Event-Listener:

```typescript
// Neben dem bestehenden message-Listener:
const handleStorage = (e: StorageEvent) => {
  if (e.key === 'gmail_auth_result') {
    // Parse result, cleanup, show toast
    localStorage.removeItem('gmail_auth_result');
  }
};
window.addEventListener('storage', handleStorage);
```

### 3. Frontend: `src/pages/portal/office/EmailTab.tsx`

Gleiche localStorage-Fallback-Logik wie in AccountIntegrationDialog (hat denselben postMessage-Listener).

### Freeze-Check
- Edge Function: Nicht eingefroren (kein Modul-Pfad)
- AccountIntegrationDialog + EmailTab: MOD-02 (KI Office) — muss `modules_freeze.json` pruefen

