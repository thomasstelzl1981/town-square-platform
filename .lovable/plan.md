
# Stammdaten-Profil in Demo-Seeding aufnehmen

## Problem

Beim Aktivieren der Demo-Daten wird das `profiles`-Profil des eingeloggten Users nicht befuellt. Felder wie `first_name`, `last_name`, `street`, `house_number`, `postal_code`, `city`, Telefonnummern etc. bleiben leer. Das fuehrt dazu, dass:
- Visitenkarten in den Manager-Modulen leer sind
- Das Stammdatenformular unter MOD-01 nicht befuellt ist
- Nur `tax_number` einen Wert hat (manuell gesetzt)

Gleichzeitig werden Adressdaten in `miety_homes` (Modul Zuhause) und in `household_persons` (Selbstauskunft MOD-07) korrekt geseedet — das Profil selbst aber nicht.

## Besonderheit: profiles ist kein normaler Demo-Entity

Die `profiles`-Tabelle unterscheidet sich grundlegend von allen anderen 21 Entity-Typen:
- Die `id` ist die `auth.users.id` des eingeloggten Users (kein Demo-UUID)
- Es wird kein neuer Datensatz eingefuegt, sondern der bestehende Datensatz **aktualisiert**
- Beim Cleanup darf die Zeile **nicht geloescht** werden — stattdessen werden die Felder auf NULL zurueckgesetzt
- Die E-Mail-Adresse wird **nicht** angetastet (kommt vom Auth-System)

## Loesung

### 1. Neue CSV-Datei: `public/demo-data/demo_profile.csv`

Semicolon-delimited, eine Datenzeile (ohne id, ohne email):

```text
first_name;last_name;display_name;street;house_number;postal_code;city;country;phone_mobile;phone_landline;phone_whatsapp;tax_number;tax_id;is_business;person_mode
Max;Mustermann;Max Mustermann;Leopoldstrasse;42;80802;Muenchen;Deutschland;+49 170 1234567;+49 89 12345678;+49 170 1234567;143/123/45678;12 345 678 901;false;private
```

Felder, die NICHT in die CSV kommen:
- `id` (wird dynamisch vom eingeloggten User genommen)
- `email` (kommt vom Auth-System)
- `avatar_url` (optional, nicht im Demo-Scope)
- `active_tenant_id` (bereits gesetzt)
- `spouse_profile_id` (kein zweiter User vorhanden)
- `email_signature`, `letterhead_*`, `reg_*`, `insurance_*` (optionale Business-Felder, spaeter ergaenzbar)

### 2. Neue Seed-Funktion in `useDemoSeedEngine.ts`

```text
async function seedProfile(tenantId: string, userId: string): Promise<string[]>
```

- Liest `demo_profile.csv` via `fetchCSV()`
- Nimmt die erste Zeile als Feldwerte
- Fuehrt ein `supabase.from('profiles').update({...fields}).eq('id', userId)` aus
- Gibt `[userId]` als registrierte ID zurueck
- Entity-Type in der Registry: `profile` (Singular, da immer nur 1 Datensatz)

Einordnung im Seed-Ablauf: **Phase 0** (vor contacts), da das Profil die Basis fuer Visitenkarten und Anzeigenamen ist.

### 3. Cleanup-Erweiterung in `useDemoCleanup.ts`

Neuer spezieller Cleanup-Schritt fuer `profile`:
- Statt `DELETE` ein `UPDATE ... SET first_name = NULL, last_name = NULL, display_name = NULL, street = NULL, ...`
- Nur die Felder zuruecksetzen, die per CSV gesetzt wurden
- `email`, `active_tenant_id`, `id` bleiben unangetastet
- Position im Cleanup: ganz am Ende (nach contacts), da keine FK-Abhaengigkeit

### 4. Manifest aktualisieren

`public/demo-data/demo_manifest.json` erhaelt einen neuen Eintrag:

```text
"profile": { "file": "demo_profile.csv", "expectedCount": 1, "dbTable": "profiles", "seedMethod": "update" }
```

Das Feld `seedMethod: "update"` signalisiert, dass hier kein Insert/Upsert sondern ein Update erfolgt.

### 5. Backlog aktualisieren

`DEMO_SEED_BACKLOG.md`: Neue Zeile Nr. 22 fuer `profiles`.

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `public/demo-data/demo_profile.csv` | Neu: CSV mit Max Mustermann Stammdaten |
| `public/demo-data/demo_manifest.json` | Neuer Entity-Eintrag `profile` |
| `src/hooks/useDemoSeedEngine.ts` | Neue Funktion `seedProfile()` + Phase 0 Aufruf |
| `src/hooks/useDemoCleanup.ts` | Spezieller Reset-Schritt fuer `profiles` (UPDATE statt DELETE) |
| `DEMO_SEED_BACKLOG.md` | Neue Zeile Nr. 22 |

## Freeze-Check

Alle betroffenen Dateien liegen ausserhalb der Modul-Pfade — kein Freeze betroffen.
