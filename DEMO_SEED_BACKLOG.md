# Demo Seed Engine — Backlog

> Status-Tracking für den Komplett-Umbau der Demo-Engine.
> Seed ON = Alles da, Seed OFF = Alles weg.

## Legende
- ✅ = CSV + Seed + Cleanup fertig
- 🔧 = Code-based Seed (JSONB)
- ⬜ = Offen / Später

---

## Entity-Checkliste

| Nr | Tabelle | CSV | Seed | Cleanup | Soll-Count | Status |
|----|---------|-----|------|---------|------------|--------|
| 1 | contacts | demo_contacts.csv | seedFromCSV | ✓ | 5 | ✅ |
| 2 | properties | demo_properties.csv | seedFromCSV | ✓ | 3 | ✅ |
| 3 | units | demo_units.csv | seedFromCSV | ✓ | 3 | ✅ |
| 4 | leases | demo_leases.csv | seedFromCSV | ✓ | 3 | ✅ |
| 5 | loans | demo_loans.csv | seedFromCSV | ✓ | 3 | ✅ |
| 6 | msv_bank_accounts | demo_bank_accounts.csv | seedFromCSV | ✓ | 1 | ✅ |
| 7 | bank_transactions | demo_bank_transactions.csv | seedFromCSV | ✓ | 100 | ✅ |
| 8 | household_persons | demo_household_persons.csv | seedFromCSV | ✓ | 4 | ✅ |
| 9 | cars_vehicles | demo_vehicles.csv | seedFromCSV | ✓ | 2 | ✅ |
| 10 | pv_plants | demo_pv_plants.csv | seedFromCSV | ✓ | 1 | ✅ |
| 11 | insurance_contracts | — (JSONB) | seedInsuranceContracts | ✓ | 7 | 🔧 |
| 12 | kv_contracts | — (JSONB) | seedKvContracts | ✓ | 4 | 🔧 |
| 13 | vorsorge_contracts | demo_vorsorge_contracts.csv | seedFromCSV | ✓ | 6 | ✅ |
| 14 | user_subscriptions | demo_user_subscriptions.csv | seedFromCSV | ✓ | 8 | ✅ |
| 15 | private_loans | demo_private_loans.csv | seedFromCSV | ✓ | 2 | ✅ |
| 16 | miety_homes | demo_miety_homes.csv | seedFromCSV | ✓ | 1 | ✅ |
| 17 | miety_contracts | demo_miety_contracts.csv | seedFromCSV | ✓ | 4 | ✅ |
| 18 | acq_mandates | — (ARRAY/JSONB) | seedAcqMandates | ✓ | 1 | 🔧 |
| 19 | pet_customers | demo_pet_customers.csv | seedFromCSV | ✓ | 3 | ✅ |
| 20 | pets | — (ARRAY) | seedPets | ✓ | 5 | 🔧 |
| 21 | pet_bookings | demo_pet_bookings.csv | seedFromCSV | ✓ | 5 | ✅ |

**Gesamt: 21 Tabellen, 163 Entities**

---

## Bewusst ausgenommen

| Entity | Grund |
|--------|-------|
| dev_projects (MOD-13) | Komplexe Struktur, eigene Phase |
| rent_payments | Via sot-rent-match Edge Function |
| pet_providers/services/rooms/staff | Infrastruktur, nicht getoggelt |
| documents (DMS) | Ordnerstruktur, Mandanten-Config |
| property_accounting | Wird separat via AfA-Engine verwaltet |

---

## Alt-DB-Seeds (einmalig zu löschen)

Die bestehenden DB-Seeds mit Demo-Tenant-ID müssen einmalig gelöscht werden,
damit der nächste Seed-Zyklus saubere Daten erzeugt.

| Tabelle | IDs | Status |
|---------|-----|--------|
| household_persons | 4 Einträge | ⬜ Via Seed-Engine Cleanup |
| insurance_contracts | 7 Einträge | ⬜ Via Seed-Engine Cleanup |
| kv_contracts | 4 Einträge | ⬜ Via Seed-Engine Cleanup |
| vorsorge_contracts | 6 Einträge | ⬜ Via Seed-Engine Cleanup |
| private_loans | 2 Einträge | ⬜ Via Seed-Engine Cleanup |
| cars_vehicles | 2 Einträge | ⬜ Via Seed-Engine Cleanup |
| pv_plants | 1 Eintrag | ⬜ Via Seed-Engine Cleanup |
| miety_homes | 1 Eintrag (falsches ID) | ⬜ Manuell löschen |
| acq_mandates | 1 Eintrag | ⬜ Via Seed-Engine Cleanup |
| pets | 5 Einträge | ⬜ Via Seed-Engine Cleanup |
| pet_customers | 3 Einträge | ⬜ Via Seed-Engine Cleanup |
| pet_bookings | 5 Einträge | ⬜ Via Seed-Engine Cleanup |

**Strategie:** Da die Seed-Engine Upsert verwendet, werden bestehende Einträge
überschrieben. Beim nächsten Toggle OFF → Cleanup werden alle Registry-Einträge gelöscht.

---

## Test-Protokoll

### Zyklus 1: Seed ON
1. Toggle ON → seedDemoData() ausführen
2. DB-Counts prüfen (alle Soll-Werte aus Checkliste)
3. UI prüfen: Alle Module zeigen Demo-Daten

### Zyklus 2: Seed OFF
1. Toggle OFF → cleanupDemoData() ausführen
2. DB-Counts prüfen (alle 0)
3. UI prüfen: Alle Module leer

### Zyklus 3: Re-Seed
1. Toggle ON → seedDemoData() erneut
2. DB-Counts prüfen (identisch mit Zyklus 1)
3. Idempotenz bestätigt

---

## Änderungslog

| Datum | Änderung |
|-------|----------|
| 2026-02-19 | Backlog erstellt, 21 Tabellen implementiert |
| 2026-02-19 | 10 neue CSVs + 4 Code-based Seeds erstellt |
| 2026-02-19 | Cleanup-Order auf 21 Entity-Types erweitert |
