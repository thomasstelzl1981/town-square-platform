
# Fix: Max Mustermann wiederherstellen

## Problem

Bei der letzten Bereinigungsmigration (`20260219154009`) wurde Max Mustermann (`b1f6d204-05ac-462f-9dae-8fba64ab9f88`) aus `household_persons` geloescht. Er ist die **Hauptperson** der Demo-Familie und muss in der DB existieren, da andere Datensaetze (Vorsorge, KV-Vertraege) auf seine `person_id` verweisen.

Die clientseitige Demo-Definition in `data.ts` ist korrekt — Max steht dort als erster Eintrag in `DEMO_FAMILY`. Aber die DB hat den Record nicht mehr.

## Loesung

### SQL-Migration: Max Mustermann re-inserieren

Ein einzelnes INSERT in `household_persons` mit allen Feldern aus der Demo-Spezifikation:

```text
INSERT INTO household_persons (
  id, tenant_id, user_id, role, salutation,
  first_name, last_name, birth_date, email, phone,
  employment_status, employer_name, marital_status,
  sort_order, is_primary
) VALUES (
  'b1f6d204-05ac-462f-9dae-8fba64ab9f88',
  'a0000000-0000-4000-a000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'hauptperson', 'Herr', 'Max', 'Mustermann', '1982-03-15',
  'max@mustermann-demo.de', '+49 170 1234567',
  'selbstaendig', 'IT-Beratung Mustermann', 'verheiratet',
  0, true
)
ON CONFLICT (id) DO NOTHING;
```

Zusaetzlich: Adresse (Strasse, PLZ, Stadt) setzen, passend zum Profil:

```text
UPDATE household_persons SET
  street = 'Leopoldstraße 42',
  zip = '80802',
  city = 'München'
WHERE id = 'b1f6d204-05ac-462f-9dae-8fba64ab9f88';
```

### Keine Code-Aenderungen noetig

- `data.ts`: Max ist dort korrekt definiert
- `ALL_DEMO_IDS`: Enthaelt `DEMO_PRIMARY_PERSON_ID` bereits
- `isDemoId()`: Erkennt die ID korrekt

## Geaenderte Dateien

1. **Neue SQL-Migration** — Max Mustermann re-insert mit vollstaendigen Demo-Daten

## Ergebnis

- Demo AN: Max, Lisa, Felix, Emma sichtbar (4 Personen wie in der Spezifikation)
- Demo AUS: 0 Personen (alle 4 IDs sind in `ALL_DEMO_IDS`)
