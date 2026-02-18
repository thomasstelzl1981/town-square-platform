

# Soll-Ist-Analyse: FinAPI Bank-Anbindung

## Kritischer Bug: Falscher API-Feldname

Der wichtigste Fehler befindet sich in Zeile 216 der Edge Function `sot-finapi-sync/index.ts`:

| | Ist (Code) | Soll (FinAPI V2 Docs) |
|---|---|---|
| Interface-Feld | `bankingInterface: "FINTS_SERVER"` | `interface: "FINTS_SERVER"` oder `"XS2A"` |
| Login-Label | `"Onlinebanking-Kennung"` | `"Onlinebanking-ID"` |

Das Feld `bankingInterface` ist der **V1-Feldname**. In der V2-API (die wir unter `/api/v2/` aufrufen) heisst das Feld schlicht `interface`. Dadurch wird der Import-Request von FinAPI als ungueltig abgelehnt (wahrscheinlich 400 oder 422), was den Fehler "Edge-Funktion kann nicht abgerufen werden" ausloest.

Zusaetzlich ist das Login-Label `"Onlinebanking-Kennung"` falsch. Laut FinAPI-Dokumentation fuer Testbank 280001 muss es `"Onlinebanking-ID"` heissen.

---

## Vollstaendige Soll-Ist-Vergleichstabelle

| Schritt | Soll (FinAPI V2 Docs) | Ist (Code) | Status |
|---------|----------------------|------------|--------|
| OAuth Token Endpoint | `POST /api/v2/oauth/token` | `POST /api/v2/oauth/token` | OK |
| Client Credentials Grant | `grant_type=client_credentials` mit `client_id` + `client_secret` als form-urlencoded | Korrekt implementiert (Zeile 22-31) | OK |
| User Password Grant | `grant_type=password` mit `client_id`, `client_secret`, `username`, `password` | Korrekt implementiert (Zeile 39-61) | OK |
| User erstellen | `POST /api/v2/users` mit `id`, `password`, `email` im JSON-Body, Auth: Bearer client_token | Korrekt implementiert (Zeile 102-113) | OK |
| Bank Connection Import - Endpoint | `POST /api/v2/bankConnections/import` | `POST /api/v2/bankConnections/import` | OK |
| Bank Connection Import - Interface-Feld | `"interface": "XS2A"` oder `"FINTS_SERVER"` | `"bankingInterface": "FINTS_SERVER"` | **FALSCH** |
| Bank Connection Import - Login Labels | `"label": "Onlinebanking-ID"`, `"label": "PIN"` | `"label": "Onlinebanking-Kennung"`, `"label": "PIN"` | **FALSCH** (Label 1) |
| Bank Connection Import - Login Values | `"value": "demo"`, `"value": "demo"` | Korrekt | OK |
| Sandbox URL | `https://sandbox.finapi.io` | `https://sandbox.finapi.io` | OK |
| Test Bank ID | `280001` | `280001` | OK |
| Secrets vorhanden | `FINAPI_CLIENT_ID` + `FINAPI_CLIENT_SECRET` | Beide als Secrets konfiguriert | OK |
| JWT Config | `verify_jwt = false` in config.toml | Vorhanden (Zeile 228-229) | OK |
| Auth im Code | getClaims-Pattern | Korrekt implementiert | OK |

---

## Weiterer Bug: KontenTab Owner-Name-Query

In `KontenTab.tsx` Zeile 138 wird `properties.name` abgefragt, aber die Spalte existiert nicht (gleicher Bug wie zuvor im AddBankAccountDialog). Muss auf `landlord_contexts` geaendert werden.

---

## Aenderungen

### 1. `supabase/functions/sot-finapi-sync/index.ts` (Zeile 214-221)

Aktuell (falsch):
```
body: JSON.stringify({
  bankId,
  bankingInterface: "FINTS_SERVER",
  loginCredentials: [
    { label: "Onlinebanking-Kennung", value: "demo" },
    { label: "PIN", value: "demo" },
  ],
}),
```

Korrektur:
```
body: JSON.stringify({
  bankId,
  interface: "XS2A",
  loginCredentials: [
    { label: "Onlinebanking-ID", value: "demo" },
    { label: "PIN", value: "demo" },
  ],
}),
```

Aenderungen:
- `bankingInterface` wird zu `interface` (V2-Feldname)
- `"FINTS_SERVER"` wird zu `"XS2A"` (empfohlen fuer Sandbox, beide Interfaces liefern identische Daten laut Docs)
- `"Onlinebanking-Kennung"` wird zu `"Onlinebanking-ID"` (exakter Label-Name laut FinAPI Testbank-Doku)

### 2. `src/pages/portal/finanzanalyse/KontenTab.tsx` (Zeile 137-139)

Owner-Name-Query von `properties` auf `landlord_contexts` umstellen (gleicher Fix wie bei AddBankAccountDialog), damit Vermietereinheiten korrekt benannt werden.

### 3. Bessere Fehlerbehandlung in der Edge Function

Zusaetzlich: Pruefung ob `FINAPI_CLIENT_ID` und `FINAPI_CLIENT_SECRET` gesetzt sind, bevor API-Calls gemacht werden — damit statt eines kryptischen Fehlers eine klare Meldung kommt.

