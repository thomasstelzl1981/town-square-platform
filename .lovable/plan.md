

# FinAPI Neuaufbau: Web Form 2.0 Flow

## Ursache des Fehlers

Der FinAPI-Fehler `ILLEGAL_ENTITY_STATE` bedeutet woertlich:
"Fuer diesen Client sind direkte API-Aufrufe nicht zulaessig. Bitte fuehren Sie den Aufruf ueber das finAPI Web Form durch."

Die aktuellen FinAPI-Zugangsdaten (Client ID/Secret) sind fuer den **Web Form 2.0 Modus** konfiguriert. Der bisherige Code versuchte `POST /api/v2/bankConnections/import` direkt aufzurufen — das ist fuer diesen Client-Typ gesperrt.

## Neuer Flow (Web Form 2.0)

```text
+------------------+     +------------------+     +------------------+
| Frontend         |     | Edge Function    |     | FinAPI           |
| (KontenTab)      |     | (sot-finapi-sync)|     | Web Form API     |
+------------------+     +------------------+     +------------------+
        |                        |                        |
   1. Klick "Bank               |                        |
      anbinden"                  |                        |
        |--- action: connect --->|                        |
        |                        |-- POST /api/v2/users ->|
        |                        |<-- user created -------|
        |                        |                        |
        |                        |-- POST /api/webForms/  |
        |                        |   bankConnectionImport |
        |                        |<-- { url, id } --------|
        |                        |                        |
        |<-- { webFormUrl, id } -|                        |
        |                        |                        |
   2. Oeffne URL in             |                        |
      Popup-Fenster              |                        |
        |                        |                        |
   3. User loggt sich           |                        |
      bei Bank ein               |---------(finAPI hosted form)--------|
        |                        |                        |
   4. Popup schliesst           |                        |
      sich automatisch           |                        |
        |                        |                        |
   5. Poll Status               |                        |
        |--- action: poll ------>|                        |
        |                        |-- GET /api/webForms/id |
        |                        |<-- { status, payload}--|
        |                        |                        |
        |                        |   Falls COMPLETED:     |
        |                        |   Konten in DB speichern|
        |<-- { connected } ------|                        |
```

## Aenderungen

### 1. Edge Function komplett neu schreiben: `supabase/functions/sot-finapi-sync/index.ts`

**Loeschen**: Den gesamten bisherigen Code.

**Neu schreiben** mit 3 Actions:

- **`connect`**: Erstellt FinAPI-User (wie bisher), dann ruft `POST /api/webForms/bankConnectionImport` auf (NICHT `/api/v2/bankConnections/import`). Gibt die Web Form URL zurueck.

- **`poll`**: Nimmt eine `webFormId` entgegen, ruft `GET /api/webForms/{id}` auf. Wenn Status `COMPLETED`, liest `payload.bankConnectionId` aus und speichert Konten in DB.

- **`sync`**: Bleibt aehnlich — holt Transaktionen fuer bestehende Verbindungen.

Wichtige API-Details aus der Dokumentation:
- Web Form Endpoint: `POST /api/webForms/bankConnectionImport` (NICHT `/api/v2/`)
- Web Form Status: `GET /api/webForms/{id}`
- Auth: Bearer User-Token (nicht Client-Token)
- Response enthält `url` (Web Form URL) und `id` (Web Form ID)

### 2. Frontend umbauen: `src/pages/portal/finanzanalyse/KontenTab.tsx`

- **Klick auf "Bank anbinden"**: Ruft Edge Function mit `action: connect` auf
- **Erhaelt URL**: Oeffnet `window.open(url, '_blank', 'width=500,height=700')` als Popup
- **Polling**: Startet `setInterval` alle 3 Sekunden mit `action: poll, webFormId`
- **Abschluss**: Wenn Poll `COMPLETED` zurueckgibt, schliesst Polling, invalidiert Queries, zeigt Toast

### 3. Keine Datenbank-Aenderungen noetig

Die bestehenden Tabellen `finapi_connections`, `finapi_transactions`, `msv_bank_accounts` bleiben unveraendert.

---

## Technische Details

### Edge Function: Neuer `connect` Action

```text
1. Secrets pruefen (FINAPI_CLIENT_ID, FINAPI_CLIENT_SECRET)
2. Client-Token holen (POST /api/v2/oauth/token, grant_type=client_credentials)
3. FinAPI-User erstellen oder wiederverwenden (POST /api/v2/users)
4. User-Token holen (POST /api/v2/oauth/token, grant_type=password)
5. Web Form erstellen:
   POST /api/webForms/bankConnectionImport
   Authorization: Bearer {userToken}
   Body: { bankId: 280001 }
6. Response: { url: "https://webform.finapi.io/wf/...", id: "..." }
7. User-Credentials in DB speichern (finapi_connections)
8. Return: { webFormUrl, webFormId }
```

### Edge Function: Neuer `poll` Action

```text
1. webFormId aus Body lesen
2. GET /api/webForms/{webFormId}
   Authorization: Bearer {userToken}
3. Wenn status == "COMPLETED":
   - bankConnectionId aus payload lesen
   - Konten abrufen (GET /api/v2/accounts?bankConnectionIds=...)
   - In msv_bank_accounts speichern
   - finapi_connections updaten
   - Return: { status: "connected", accounts_imported: N }
4. Wenn status == "NOT_YET_OPENED" oder "OPENED":
   - Return: { status: "pending" }
5. Wenn status == "ABORTED" oder "FAILED":
   - Return: { status: "failed" }
```

### Frontend: Popup + Polling Logik

```text
1. connectMutation ruft Edge Function auf
2. Bei Erfolg: window.open(webFormUrl) + Polling starten
3. Polling alle 3s: action=poll mit webFormId
4. Bei "connected": Polling stoppen, Queries invalidieren, Toast
5. Bei "failed": Polling stoppen, Fehler-Toast
6. Timeout nach 5 Minuten: Polling stoppen
```

