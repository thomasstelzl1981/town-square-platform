
## Gmail-Integration via eigenem OAuth-Flow

### Problem

Der aktuelle Gmail-Connect in `EmailTab.tsx` nutzt `supabase.auth.signInWithOAuth({ provider: 'google' })`. Das laeuft ueber Lovable Cloud Managed Auth, die nur Basic-Profile-Scopes liefert — keine Gmail API Berechtigung. Deshalb funktioniert Google Mail nicht.

### Loesung

Einen dedizierten Gmail OAuth-Flow bauen, analog zum bestehenden Google Drive Flow in `sot-cloud-sync`. Die gleichen Google OAuth Credentials (`GOOGLE_DRIVE_CLIENT_ID` / `GOOGLE_DRIVE_CLIENT_SECRET`) werden wiederverwendet, da sie zum selben Google Cloud Projekt gehoeren.

### Architektur

```text
Frontend (EmailTab)                    Edge Function                        Google
       |                                    |                                  |
       |--- POST /sot-mail-gmail-auth ----->|                                  |
       |    action: "init"                  |                                  |
       |<-- { authUrl } -------------------|                                  |
       |                                    |                                  |
       |--- window.open(authUrl) ------------------------------------------>|
       |                                    |                                  |
       |    (User autorisiert Gmail)        |                                  |
       |                                    |<-- callback?code=... ------------|
       |                                    |--- token exchange -------------->|
       |                                    |<-- access_token, refresh_token --|
       |                                    |                                  |
       |                                    |--- INSERT mail_accounts -------->|
       |                                    |--- redirect to returnUrl ------->|
       |<-- (Popup schliesst, account da)   |                                  |
```

### Aenderungen

**1. Neue Edge Function: `sot-mail-gmail-auth`**

Analog zu `sot-cloud-sync`, aber fuer Gmail:

- **action: "init"**: Erstellt Google OAuth URL mit Scopes `gmail.readonly`, `gmail.send`, `userinfo.email`, `userinfo.profile`
- **action: "callback"**: Empfaengt OAuth Code, tauscht gegen Tokens, erstellt/aktualisiert `mail_accounts`-Eintrag mit `provider: 'google'`
- **action: "refresh"**: Token-Refresh (fuer spaeter, wenn Tokens ablaufen)

Nutzt die bestehenden Secrets: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`

Redirect URI: `{SUPABASE_URL}/functions/v1/sot-mail-gmail-auth?action=callback`

**Wichtig**: In der Google Cloud Console muss diese Redirect URI als "Authorized redirect URI" hinzugefuegt werden.

**2. Frontend: `EmailTab.tsx` — `handleGoogleConnect` ersetzen**

Aktuell (funktioniert nicht):
```text
supabase.auth.signInWithOAuth({ provider: 'google', ... })
```

Neu (Popup-Flow wie bei Drive):
```text
1. POST sot-mail-gmail-auth { action: 'init', returnUrl }
2. Oeffne authUrl in Popup-Fenster
3. Popup schliesst automatisch nach Callback
4. Refetch mail_accounts
```

**3. Token-Refresh in `sot-mail-sync`**

Der bestehende `syncGoogleMail` wirft bei 401: "Access token expired - needs refresh". Das muss erweitert werden:

- Bei 401: Refresh-Token aus `mail_accounts` lesen
- Token-Refresh via Google OAuth Token-Endpoint
- Neuen Access-Token in `mail_accounts` speichern
- Retry der API-Anfrage

**4. `sot-mail-send` — Gmail Send erweitern (falls noch nicht vorhanden)**

Pruefen ob die bestehende Mail-Send-Funktion bereits Gmail API unterstuetzt. Falls nicht: `gmail.send` Scope wird bereits angefordert, die Send-Logik muss Gmail API `messages.send` nutzen.

### Google Cloud Console — Manuelle Konfiguration

Der Nutzer muss in seiner Google Cloud Console (gleiche App wie fuer Drive):

1. Die Redirect URI hinzufuegen: `https://ktpvilzjtcaxyuufocrs.supabase.co/functions/v1/sot-mail-gmail-auth?action=callback`
2. Gmail API aktivieren (falls noch nicht geschehen)
3. Die Scopes `gmail.readonly` und `gmail.send` in der OAuth-Consent-Screen-Konfiguration hinzufuegen

### Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/functions/sot-mail-gmail-auth/index.ts` | Neu — Gmail OAuth Edge Function |
| `supabase/config.toml` | Update — `verify_jwt = false` fuer neue Funktion |
| `src/pages/portal/office/EmailTab.tsx` | Update — `handleGoogleConnect` auf Popup-Flow umstellen |
| `supabase/functions/sot-mail-sync/index.ts` | Update — Token-Refresh-Logik bei 401 |

### Was NICHT geaendert wird

- `sot-cloud-sync` — bleibt fuer Google Drive
- `sot-mail-connect` — bleibt fuer IMAP und manuelle OAuth-Token-Speicherung
- Engine-Dateien, Datenbank-Schema (mail_accounts hat bereits `access_token`, `refresh_token`, `token_expires_at`)
- Secrets — `GOOGLE_DRIVE_CLIENT_ID` / `GOOGLE_DRIVE_CLIENT_SECRET` werden wiederverwendet

### Voraussetzung

Bevor die Implementierung getestet werden kann, muss der Nutzer in der Google Cloud Console:
1. Gmail API aktivieren
2. Die neue Redirect URI als "Authorized redirect URI" eintragen
