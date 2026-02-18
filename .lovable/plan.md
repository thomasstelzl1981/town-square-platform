
# Fix: FinAPI Bankanbindung + UI-Bereinigung

## Problem-Analyse

Drei zusammenhaengende Fehler verhindern die Bankanbindung:

1. **FinAPI API-Fehler** (Hauptursache): Der API-Call an `/api/v2/bankConnections/import` sendet kein `bankingInterface`-Feld. Die FinAPI Sandbox erfordert dieses Feld seit v2. Die Fehlermeldung aus den Logs: `Field 'bankingInterface' not valid: Field is blank.`

2. **CORS-Header unvollstaendig**: Die shared CORS-Konfiguration fehlt die Supabase-Client-Header (`x-supabase-client-platform`, `x-supabase-client-platform-version`, etc.). Deshalb schlaegt der Preflight fehl und der Browser zeigt "non-2xx status code".

3. **UI-Button doppelt**: Es gibt sowohl einen breiten "Bank verbinden"-Button als auch das "+"-Icon. Nur das "+" soll bleiben.

## Aenderungen

### 1. Edge Function: `supabase/functions/sot-finapi-sync/index.ts`

Im `connect`-Case wird der Import-Body um die fehlenden Pflichtfelder ergaenzt:

```text
Vorher:
  body: JSON.stringify({ bankId })

Nachher:
  body: JSON.stringify({
    bankId,
    bankingInterface: "FINTS_SERVER",
    loginCredentials: [
      { label: "Onlinebanking-Kennung", value: "demo" },
      { label: "PIN", value: "demo" }
    ]
  })
```

Die FinAPI Sandbox (Bank-ID 280001 = finAPI Testbank) erwartet diese Felder. `FINTS_SERVER` ist das Standard-Interface fuer deutsche Banken in der Sandbox.

### 2. Shared CORS: `supabase/functions/_shared/cors.ts`

Die `Access-Control-Allow-Headers` werden um die fehlenden Supabase-Client-Header erweitert:

```text
Vorher:
  'authorization, x-client-info, apikey, content-type, x-webhook-signature'

Nachher:
  'authorization, x-client-info, apikey, content-type, x-webhook-signature,
   x-supabase-client-platform, x-supabase-client-platform-version,
   x-supabase-client-runtime, x-supabase-client-runtime-version'
```

### 3. UI: `src/pages/portal/finanzanalyse/KontenTab.tsx`

Der breite "Bank verbinden"-Button (Zeilen 159-171) wird entfernt. Nur das "+"-Icon bleibt:

```text
Vorher:
  <Button variant="glass" size="sm" onClick={...}>Bank verbinden</Button>
  <Button variant="glass" size="icon-round" onClick={...}><Plus /></Button>

Nachher:
  <Button variant="glass" size="icon-round" onClick={...}><Plus /></Button>
```

Die `connectMutation` (Bank-Connect-Logik) bleibt im Code erhalten, wird aber vorerst nicht direkt ueber die UI ausgeloest, da die Bankanbindung ueber den AddBankAccountDialog gesteuert wird.

### Zusammenfassung der betroffenen Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sot-finapi-sync/index.ts` | `bankingInterface` + `loginCredentials` im Import-Body |
| `supabase/functions/_shared/cors.ts` | Fehlende Supabase-Header in Allow-Headers |
| `src/pages/portal/finanzanalyse/KontenTab.tsx` | "Bank verbinden"-Button entfernen |
