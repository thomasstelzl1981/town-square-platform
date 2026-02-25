

## Demo-Tenant — Vollständige Tiefenanalyse & Reparaturplan

### Befund-Tabelle: Soll vs. Ist (Demo Tenant `c3123104-...`)

| # | Entity | Soll | Ist | Status | Ursache |
|---|--------|------|-----|--------|---------|
| 1 | household_persons | **4** (Max, Lisa, Felix, Emma) | **2** (2× Max Mustermann) | **FEHLER** | Seed hat NUR den Hauptperson-Record geseedet (b1f6d204), Lisa/Felix/Emma fehlen. Zusätzlich existiert ein manuell erstellter Duplikat (75154d6a, erstellt 22.02.) |
| 2 | units | **3** (BER-01-WE01, MUC-01-WE01, HH-01-WE01) | **6** (3× MAIN + 3× WE-01) | **FEHLER** | Property-Trigger erzeugt MAIN units. Seed-Engine updatet MAIN units mit `area_sqm`, erstellt aber SEPARAT die WE-01 units mit Demo-IDs. **Doppelte Immobilien-Zeilen im Portfolio.** |
| 3 | pets | **2** (Luna, Bello) | **0** | **FEHLER** | `seedOwnerPets` hat korrekte Daten, aber Insert ist fehlgeschlagen (wahrscheinlich RLS-Problem oder missing `owner_user_id` Column Match). Nicht in test_data_registry. |
| 4 | insurance_contracts | **7** | **0** | **FEHLER** | Seed komplett fehlgeschlagen. Nicht in test_data_registry. |
| 5 | property_accounting | **3** | **0** | **FEHLER** | AfA-Daten nicht geseedet. Nicht in test_data_registry. |
| 6 | pension_records | **2** | **1** | **FEHLER** | Nur 1 statt 2 Records |
| 7 | user_subscriptions | **8** | **7** | **WARNUNG** | 1 Record fehlt |
| 8 | household_persons (Reg.) | 4 | 0 in Registry | **FEHLER** | Nicht im test_data_registry registriert |
| 9 | vorsorge_contracts | **6** | **6** | OK | |
| 10 | kv_contracts | **4** | **4** | OK | |
| 11 | contacts | **5** | **5** | OK | Aber nicht in Registry |
| 12 | properties | **3** | **3** | OK | |
| 13 | loans | **3** | **3** | OK | |
| 14 | private_loans | **2** | **2** | OK | |
| 15 | cars_vehicles | **6** | **6** | OK | Aber nicht in Registry |
| 16 | leases | **3** | **3** | OK | |
| 17 | finance_requests | **2** | **2** | OK | |
| 18 | listings | **1** | **1** | OK | |
| 19 | pv_plants | **1** | **1** | OK | |
| 20 | miety_homes | **1** | **1** | OK | |
| 21 | miety_contracts | **4** | **5** | **WARNUNG** | 1 Duplikat |
| 22 | msv_bank_accounts | **1** | **1** | OK | |
| 23 | bank_transactions | **100** | **100** | OK | |
| 24 | dev_projects | **1** | **0** | **FEHLER** | Projekt-Seed fehlgeschlagen |

---

### Root-Cause-Analyse der 5 kritischen Fehler

**FEHLER 1: Doppelte Personen (2× "Max Mustermann Hauptperson")**

- Record `75154d6a` wurde am 22.02. **manuell** erstellt (via UI "Person hinzufügen" in Finanzanalyse oder FMUebersichtTab)
- Record `b1f6d204` wurde am 25.02. vom Seed-Engine korrekt angelegt
- Die CSV enthält 4 Personen (Max, Lisa, Felix, Emma) — aber nur Max (die Hauptperson) wurde geseedet
- **Ursache im Code:** `seedHouseholdPersons()` ersetzt den `b1f6d204` placeholder-ID mit `userId` — aber im Demo-Tenant-Kontext (useDemoAutoLogin) ist die userId die des Demo-Users (`f497a78a`), NICHT die Demo-Person-ID. Das upsert auf `id = userId` kollidiert mit dem manuell erstellten Record. Die 3 anderen Personen (Lisa, Felix, Emma mit IDs `e0000000-*`) sollten eigentlich inserted werden, aber der Seed bricht nach dem ersten Fehler ab oder die Chunks werden nicht korrekt verarbeitet.
- **Fix:** Delete des manuellen Duplikats `75154d6a`. Seed erneut ausführen, oder Lisa/Felix/Emma manuell inserieren.

**FEHLER 2: Doppelte Immobilien-Einheiten (6 statt 3)**

- Der Property-INSERT-Trigger (`trg_property_create_default_unit`) erzeugt automatisch eine MAIN-Unit pro Property
- Die Seed-Engine findet diese MAIN unit per `.limit(1).maybeSingle()` und updated sie mit `area_sqm` aus der CSV
- ABER: Die WE-01 Units mit Demo-IDs `d0000000-*` existieren EBENFALLS — sie wurden offenbar in einem früheren Seed-Lauf direkt per `seedFromCSV` inserted
- **Ursache:** Das Seed-Update ändert die MAIN unit's `area_sqm`, aber NICHT `unit_number` oder `current_monthly_rent` (diese Felder bleiben null/MAIN). Gleichzeitig wurden die WE-01 units separat eingefügt.
- **Fix:** DELETE der 3 MAIN units (90bdd653, fd55d604, a89bcfaa). Die WE-01 units sind die korrekten Demo-Daten. Zusätzlich muss die Seed-Engine korrigiert werden: nach dem UPDATE sollte geprüft werden, ob die Unit-Number aktualisiert wurde.

**FEHLER 3: 0 Pets (Luna + Bello fehlen)**

- `seedOwnerPets()` hat hardcoded Pets mit `owner_user_id: userId` — im Demo-Account ist `userId = f497a78a`
- Die Pets-Tabelle hat möglicherweise eine RLS-Policy oder einen NOT-NULL Constraint der verhindert, dass der Insert funktioniert
- Nicht in test_data_registry → Seed-Schritt wurde entweder übersprungen oder hat einen Error geworfen
- **Fix:** Manuelles INSERT oder Seed-Engine-Debug. Pets manuell per SQL einfügen.

**FEHLER 4: 0 Versicherungsverträge**

- `seedInsuranceContracts()` wurde aufgerufen, hat aber 0 Ergebnisse produziert
- Wahrscheinlich ein Schema-Mismatch (Column-Namen in CSV vs. DB) oder RLS-Problem
- **Fix:** Untersuchen der `seedInsuranceContracts()` Funktion und der CSV-Datei, dann manuelles INSERT

**FEHLER 5: 0 Property Accounting (AfA-Daten)**

- Weder in DB noch in Registry
- Die Funktion `seedPropertyAccounting()` muss geprüft werden
- **Fix:** Manuelles INSERT der 3 AfA-Records

---

### Reparaturplan

**Phase 1 — DB-Bereinigung (Duplikate entfernen)**

```sql
-- 1. Doppelte Hauptperson entfernen (manuell erstellte)
DELETE FROM household_persons 
WHERE id = '75154d6a-0a36-4dab-98de-ad9f1aad35bf' 
AND tenant_id = 'c3123104-e2ec-47ca-9f0a-616808557ece';

-- 2. Doppelte MAIN-Units entfernen (Trigger-generiert, keine Daten)
DELETE FROM units 
WHERE unit_number = 'MAIN' 
AND tenant_id = 'c3123104-e2ec-47ca-9f0a-616808557ece'
AND id IN ('90bdd653-deb6-4484-a6f9-8db926de972a', 
           'fd55d604-5735-4a2f-a571-f744238f1be5', 
           'a89bcfaa-abc3-4c5f-95c9-c4e24a1996fa');
```

**Phase 2 — Fehlende Daten nachspeisen (SQL INSERT)**

Für household_persons (Lisa, Felix, Emma), pets (Luna, Bello), insurance_contracts (7 Verträge), property_accounting (3 Records), pension_records (2. Record), dev_projects (1 Projekt).

**Phase 3 — Seed-Engine Code-Fixes**

1. `seedUnits()` im Orchestrator (Zeile 931-977): Nach dem UPDATE der MAIN unit muss geprüft werden, ob `unit_number` tatsächlich aktualisiert wurde. Alternativ: Die ganze UPDATE-Logik entfernen und stattdessen die MAIN units LÖSCHEN und die CSV units direkt INSERTen.

2. `seedHouseholdPersons()` (Zeile 746-792): Der `HAUPTPERSON_PLACEHOLDER_ID`-Ersatz durch `userId` ist problematisch im Demo-Kontext, weil es kollidiert wenn bereits ein manueller Record mit der gleichen `userId` existiert. Empfehlung: Vor dem Upsert den manuellen Record löschen.

3. `seedOwnerPets()`: Error Handling verbessern, um die tatsächliche Fehlerursache zu loggen.

4. `seedInsuranceContracts()`: Schema-Validierung gegen die tatsächlichen DB-Spalten.

**Phase 4 — Verifizierung**

Alle 24 Entity-Typen auf Soll-Werte prüfen, test_data_registry vollständig befüllt.

---

### Empfehlung zur Vorgehensweise

Die sofortige Maßnahme ist Phase 1 + Phase 2 (SQL-Bereinigung + fehlende Daten nachspeisen). Das behebt die sichtbaren Probleme im Demo-Account sofort.

Phase 3 (Seed-Engine Code-Fixes) ist notwendig um zu verhindern, dass bei einem erneuten Seed die gleichen Fehler wieder auftreten. Das betrifft 3-4 Funktionen in `useDemoSeedEngine.ts`.

Ich kann beides in einem Schritt umsetzen. Die Code-Fixes betreffen keine frozen Module — `useDemoSeedEngine.ts` liegt unter `src/hooks/` (kein Modul-Pfad).

