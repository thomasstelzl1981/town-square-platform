

# Fix: Falscher Empfängername im Postservice-Mandat

## Befund

Die Daten sind NICHT hardcoded. Die `PostserviceCard` liest korrekt aus der Datenbank-Tabelle `postservice_mandates`. Der angezeigte Name stammt aus dem `payload_json`-Feld des aktiven Mandats:

```text
payload_json: {
  "recipient_name": "Mister Thomas / System of a Town",
  "address": "Musterstraße 1",
  "city": "München",
  "postal_code": "80331"
}
```

Das ist ein Demo-Seed-Datensatz, der beim Golden-Tenant-Seeding mit einem falschen/unsinnigen Empfängernamen erstellt wurde.

## Loesung

Ein einfaches Datenbank-Update korrigiert den Empfängernamen auf den Standard-Demo-Haushaltsnamen:

```sql
UPDATE postservice_mandates
SET payload_json = jsonb_set(
  payload_json::jsonb,
  '{recipient_name}',
  '"Max Mustermann"'
)
WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'
  AND status = 'active';
```

Zusaetzlich muss die Demo-Seed-Quelle (CSV oder Seed-Funktion in `useDemoSeedEngine.ts`) geprueft und dort ebenfalls korrigiert werden, damit bei einem Re-Seed der korrekte Name verwendet wird.

## Aenderungen

| Was | Aenderung |
|---|---|
| DB-Update (einmalig) | `payload_json.recipient_name` auf "Max Mustermann" setzen |
| `src/hooks/useDemoSeedEngine.ts` | Postservice-Seed-Funktion pruefen und `recipient_name` korrigieren |
| Ggf. `public/demo-data/` | Falls eine CSV/JSON-Datei fuer Postservice existiert, dort korrigieren |

Keine Aenderungen an der `PostserviceCard`-Komponente noetig — die funktioniert korrekt.
