

# Depot anbinden via FinAPI (Read-Only)

## Uebersicht

Im Investment-Tab wird ein "Depot anbinden (FinAPI)"-Button hinzugefuegt, der denselben Web Form 2.0 Flow nutzt wie die Bankkonten-Anbindung. Nach erfolgreicher Verbindung werden Wertpapier-Depots und deren Positionen read-only angezeigt.

## Datenbank

Zwei neue Tabellen:

**`finapi_depot_accounts`** — Verbundene Wertpapier-Depots
- id (uuid, PK)
- tenant_id (uuid, NOT NULL)
- person_id (uuid, nullable) — Zuordnung zu household_persons
- account_name (text)
- depot_number (text)
- bank_name (text)
- finapi_account_id (text) — FinAPI Account-ID
- connection_id (uuid, FK auf finapi_connections)
- status (text, default 'active')
- created_at, updated_at (timestamptz)

**`finapi_depot_positions`** — Wertpapier-Positionen (read-only Snapshot)
- id (uuid, PK)
- depot_account_id (uuid, FK auf finapi_depot_accounts)
- tenant_id (uuid)
- finapi_security_id (text)
- isin (text)
- wkn (text)
- name (text)
- quantity (numeric)
- quantity_nominal (numeric)
- current_value (numeric)
- purchase_value (numeric)
- currency (text, default 'EUR')
- entry_quote (numeric)
- current_quote (numeric)
- profit_or_loss (numeric)
- last_updated (timestamptz)

RLS: Beide Tabellen mit `tenant_id`-Policy (gleich wie `msv_bank_accounts`).

## Edge Function: `sot-finapi-sync` erweitern

Zwei neue Actions:

**`connect_depot`**:
1. Gleicher Flow wie `connect` (User erstellen, Web Form oeffnen)
2. Nach COMPLETED im Poll: Accounts abrufen, nach Typ "Security" filtern
3. Securities-Accounts in `finapi_depot_accounts` speichern
4. Positionen via `GET /api/v2/securities?accountIds=...` abrufen
5. Positionen in `finapi_depot_positions` speichern

**`sync_depot`**:
1. User-Token holen
2. `GET /api/v2/securities?accountIds=...` abrufen
3. Positionen in `finapi_depot_positions` upserten (auf `finapi_security_id`)

Der `poll` Action wird erweitert: Ein neues Body-Feld `type: 'depot'` steuert, ob nach dem COMPLETED-Event Securities- statt Checking-Accounts importiert werden.

## Frontend: InvestmentTab.tsx

Neuer Abschnitt zwischen "Investment-Sparplaene" und "Armstrong Depot":

**"Wertpapier-Depots (Read-Only)"**

- Header mit "Depot anbinden (FinAPI)"-Button (gleicher Popup + Polling Mechanismus wie KontenTab)
- Polling-Indikator (Loader + "Warte auf Bank-Anmeldung...")
- WidgetGrid mit verbundenen Depots als Kacheln:
  - Depot-Name, Bank, Depotnummer
  - Gesamtwert, Anzahl Positionen
  - Sync-Button
- Unter dem Grid: Positionen-Tabelle (read-only) des ausgewaehlten Depots
  - Spalten: Wertpapier, ISIN, Stueck, Kaufwert, Aktuell, +/- (Gewinn/Verlust)
  - Farbcodierung: gruen fuer Gewinn, rot fuer Verlust
- Loesch-Funktion pro Depot (mit WidgetDeleteOverlay, kein Demo-Guard noetig da keine Demo-Daten)

## Zu aendernde Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (neue SQL) | Tabellen `finapi_depot_accounts` + `finapi_depot_positions` + RLS |
| `supabase/functions/sot-finapi-sync/index.ts` | Actions `connect_depot`, `sync_depot` + Poll-Erweiterung |
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | Depot-Anbindung UI, Polling, Positionen-Tabelle |

