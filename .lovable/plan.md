

# Plan: Freeze-Update + Europace Integration Phase 1

## Teil 1: Freeze-Dateien aktualisieren

Alle 4 Freeze-Dateien werden auf "frozen: true" gesetzt, **ausser MOD-11** (Finanzierungsmanager), das explizit geoeffnet wird.

### modules_freeze.json
- MOD-00: frozen: true
- MOD-01: frozen: true
- MOD-05: frozen: true
- MOD-11: **frozen: false** (reason: "Unfrozen for Europace API integration")
- MOD-22: frozen: true
- Alle anderen bleiben frozen (keine Aenderung)

### engines_freeze.json
- ENG-PLC: frozen: true
- Alle anderen bleiben frozen (keine Aenderung)

### infra_freeze.json
- edge_functions: bleibt **frozen: false** (wird fuer Europace Edge Function benoetigt)
- Alle anderen bleiben frozen (keine Aenderung)

### zone3_freeze.json
- LENNOX: frozen: true
- Alle anderen bleiben frozen (keine Aenderung)

---

## Teil 2: Europace API Integration — Phase 1

### 2a) Secrets anlegen

Zwei Secrets muessen vom User eingegeben werden:
- `EUROPACE_CLIENT_ID` (Wert: KDH7UXYSQW5KC3FT)
- `EUROPACE_CLIENT_SECRET` (Wert: aus separater E-Mail)

### 2b) Edge Function `sot-europace-proxy` erstellen

Neue Edge Function als zentraler Proxy fuer alle Europace API Aufrufe.

**OAuth2 Client Credentials Flow:**
```
POST https://api.europace.de/auth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&subject=YFC80
&actor=BUU82
&scope=impersonieren baufinanzierung:angebote:ermitteln baufinanzierung:vorgaenge:schreiben
```

**Aktionen (action-basiert via POST body):**

| Action | Europace Endpoint | Methode |
|---|---|---|
| `request-vorschlaege` | `baufinanzierung.api.europace.de/v1/vorschlaege` | POST |
| `poll-vorschlaege` | `baufinanzierung.api.europace.de/v1/vorschlaege/{anfrageId}` | GET |
| `bookmark-vorschlag` | `baufinanzierung.api.europace.de/vorschlag/bookmark` | POST |

**Mapping der SOT-Falldaten auf Europace-Schema:**
- `applicant.net_income_monthly` → `einkommenNetto`
- `applicant.birth_date` → `geburtsdatum`
- `applicant.equity_amount` → `eigenKapital`
- `property.purchase_price` → `kaufpreis`
- `property.object_type` → `objektArt` (EINFAMILIENHAUS, EIGENTUMSWOHNUNG etc.)
- `property.postal_code` → `anschrift.plz`
- `property.city` → `anschrift.ort`
- Alle Requests im Testmodus: `datenkontext: "TEST_MODUS"`

**Sicherheit:**
- Auth-Check: Request muss von eingeloggtem User kommen (Authorization Header)
- Token wird pro Request geholt (v1, kein Cache)
- Secrets nur serverseitig in Edge Function

### 2c) Adapter `src/services/europace/consumerLoanAdapter.ts` umbauen

Vom Stub ("throw Error") auf echte Edge Function Calls:
- `europace_request_vorschlaege(caseData)` → POST an Edge Function mit action `request-vorschlaege`
- `europace_poll_vorschlaege(anfrageId)` → POST an Edge Function mit action `poll-vorschlaege`
- `europace_bookmark_vorschlag(anfrageId, vorschlagId, vorgangId)` → POST an Edge Function mit action `bookmark-vorschlag`

### 2d) FMEinreichung.tsx Kachel 4 erweitern (MOD-11, jetzt unfrozen)

Die bestehende Kachel 4 "API-Uebergabe (Europace)" (Zeilen 819-858) wird von einem simplen "Fall uebergeben"-Button zu einem funktionalen Europace-Widget erweitert:

1. "Konditionen ermitteln" Button → ruft `europace_request_vorschlaege` auf
2. Polling-Loop mit Ladeindikator (202 → repeat, 200 → Ergebnis)
3. Ergebnis-Anzeige: Vorschlaege als Karten (Zinssatz, Rate, Bank, Zinsbindung)
4. LeadRating-Anzeige (successRating A-F, feasibilityRating 0-100)
5. "In Vorgang uebernehmen" Button pro Vorschlag (Bookmark)

---

## Betroffene Dateien

| Datei | Aenderung | Freeze-Status |
|---|---|---|
| `spec/current/00_frozen/modules_freeze.json` | MOD-00,01,05,22 → frozen, MOD-11 → unfrozen | Meta-Datei |
| `spec/current/00_frozen/engines_freeze.json` | ENG-PLC → frozen | Meta-Datei |
| `spec/current/00_frozen/infra_freeze.json` | Keine Aenderung | Meta-Datei |
| `spec/current/00_frozen/zone3_freeze.json` | LENNOX → frozen | Meta-Datei |
| `supabase/functions/sot-europace-proxy/index.ts` | NEU | edge_functions: nicht frozen |
| `src/services/europace/consumerLoanAdapter.ts` | Refactor Stub → echte Calls | Nicht in Modul-Pfad |
| `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx` | Kachel 4 Europace-Widget | MOD-11: wird unfrozen |

Keine DB-Aenderungen. Keine neuen Tabellen.

