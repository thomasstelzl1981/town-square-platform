

## Plan: Demo-Finanzierungsfall für Europace-Sandbox aktivieren

### Ist-Zustand (Diagnose)

Die Datenkette für den Demo-Fall "Max Mustermann — ETW Berlin" ist **unterbrochen**:

| Tabelle | Demo-ID | CSV-Status | DB-Status | Problem |
|---|---|---|---|---|
| `finance_requests` | ...0701 | `ready` | `ready` | OK |
| `applicant_profiles` | ...0711/0712 | vorhanden | vorhanden | OK (Netto 5.200, Geburtsdatum, PLZ) |
| `finance_mandates` | ...0721 | `accepted` | **`delegated`** | Seed hat Status nicht korrekt übernommen |
| `future_room_cases` | ...0731 | `active` | **fehlt komplett** | Seed hat diesen Datensatz nicht angelegt |

**Folge:** FMEinreichung (MOD-11) zeigt keine Fälle, weil `useFutureRoomCases()` aus `future_room_cases` liest — und die ist leer. Ohne aktiven Case kann kein Europace-Request ausgelöst werden.

### Was zu tun ist

#### 1. Demo-Daten in DB korrigieren (Migration)

Zwei SQL-Statements um die Kette zu schließen:

- `finance_mandates` ...0721: Status auf `accepted` setzen, `accepted_at` befüllen
- `future_room_cases` ...0731: INSERT mit `finance_mandate_id` = ...0721, `status` = `active`, `manager_tenant_id` = Demo-Tenant-ID

Zusätzlich `finance_requests` ...0701: `applicant_snapshot` mit den relevanten Europace-Feldern aus `applicant_profiles` befüllen (als Fallback).

#### 2. Seed Engine absichern (useDemoSeedEngine.ts)

Die CSV `demo_future_room_cases.csv` wird bereits referenziert, aber der Datensatz landet nicht in der DB. Ursache prüfen:
- Die CSV hat `TENANT_PLACEHOLDER` als `manager_tenant_id` — der Seed-Prozess muss das ersetzen
- Sicherstellen, dass die Seed-Reihenfolge stimmt: `finance_mandates` VOR `future_room_cases`

#### 3. Europace-Testdaten validieren

Die Europace Sandbox braucht Mindestdaten für Vorschläge. Prüfung ob die Demo-`applicant_profiles`-Daten ausreichen:

| Feld | Demo-Wert | Europace-Pflicht |
|---|---|---|
| `net_income_monthly` | 5.200 | Ja |
| `birth_date` | 1985-03-15 | Ja |
| `employment_type` | unbefristet → ANGESTELLTER | Ja |
| `equity_amount` | 77.000 | Ja |
| `purchase_price` | 385.000 | Ja |
| `address_postal_code` | 80802 (Objekt: 10625) | Ja |
| `max_monthly_rate` | 1.450 | Optional |

Die Daten sind **vollständig** für einen Europace-Sandbox-Request.

#### 4. Freeze-Status

- **MOD-11**: bereits `frozen: false` — Änderungen erlaubt
- **Edge Functions (sot-europace-proxy)**: keine Änderung nötig, Sandbox-Modus funktioniert
- **Seed Engine** (`useDemoSeedEngine.ts`): liegt außerhalb der Module-Freeze-Pfade — frei editierbar

### Zusammenfassung

Nach Umsetzung wird der Demo-Fall "Max Mustermann — ETW Berlin 385.000 EUR" in der FMEinreichung (Kachel 4: Europace) erscheinen. Der Button "Konditionen ermitteln" sendet die Daten an die Europace Sandbox und liefert Test-Vorschläge (Zinssätze, Raten, LeadRating) zurück.

