
# Demo-Engine Komplett-Umbau: Seed ON = Alles da, Seed OFF = Alles weg

## Ziel

Der Demo-Toggle muss wie ein echter Account funktionieren:
- **Toggle ON**: Alle Demo-Daten werden per Seed-Engine in die Datenbank geschrieben (simuliert echte Dateneingabe)
- **Toggle OFF**: Alle Demo-Daten werden vollstaendig entfernt (0 Records in allen Tabellen)
- Kein "Ghost Data", keine halblebigen DB-Seeds

## Ist-Zustand (Probleme)

| Problem | Detail |
|---------|--------|
| Seed-Engine deckt nur 7 Tabellen ab | contacts, properties, units, leases, loans, msv_bank_accounts, bank_transactions |
| 15+ Tabellen sind "DB-Seeds" | cars_vehicles, insurance_contracts, household_persons, pv_plants, kv_contracts, vorsorge_contracts, private_loans, miety_homes, acq_mandates, pets, pet_customers, pet_bookings, pet_providers, pet_services, pet_rooms, pet_staff |
| Cleanup loescht nur Registry-Eintraege | Aktuell nur bank_transactions (100) in Registry — alles andere bleibt |
| Subscriptions nie geseeded | 8 Abos in data.ts definiert, 0 in DB |
| dev_projects = 0 | MOD-13 Projekt fehlt komplett |
| rent_payments = 0 | Rent-Match Pipeline wurde nie getriggert |

## Soll-Zustand

Nach Toggle ON muessen exakt diese Daten existieren:

```text
Container 1: Max Mustermann (Komplett-Demo)
|
+-- 4 Haushaltspersonen (Max, Lisa, Felix, Emma)
+-- 5 Kontakte (Max, Lisa, Bergmann, Hoffmann, Weber)
+-- 3 Immobilien (Berlin, Muenchen, Hamburg)
|   +-- je 1 Unit, 1 Lease, 1 Loan, 1 Listing
+-- 2 Fahrzeuge (Porsche 911, BMW M5)
+-- 1 PV-Anlage (32.4 kWp)
+-- 7 Sachversicherungen
+-- 6 Vorsorgevertraege
+-- 4 KV-Vertraege
+-- 2 Privatkredite
+-- 8 Abonnements
+-- 1 Bankkonto + 100 Transaktionen
+-- 1 Miety-Zuhause + 4 Versorgungsvertraege
+-- 1 Akquise-Mandat
+-- 1 Immobilienprojekt (Residenz am Stadtpark)
+-- 2 Pets (Luna, Bello)

Container 2: Lennox & Friends Pet Manager
|
+-- 1 Provider + 4 Services + 10 Zimmer + 3 Staff
+-- 3 Kunden + 3 Hunde + 5 Buchungen
```

Nach Toggle OFF: **0 Records** in allen operativen Tabellen.

## Umsetzungsplan

### Phase 1: CSV-Dateien fuer fehlende Entities erstellen

Neue CSV-Dateien in `public/demo-data/`:

| Datei | Inhalt | Zeilen |
|-------|--------|--------|
| `demo_vehicles.csv` | 2 Fahrzeuge | 2 |
| `demo_insurance_contracts.csv` | 7 Versicherungen | 7 |
| `demo_household_persons.csv` | 4 Personen | 4 |
| `demo_pv_plants.csv` | 1 Anlage | 1 |
| `demo_kv_contracts.csv` | 4 Vertraege | 4 |
| `demo_vorsorge_contracts.csv` | 6 Vertraege | 6 |
| `demo_subscriptions.csv` | 8 Abonnements | 8 |
| `demo_private_loans.csv` | 2 Kredite | 2 |
| `demo_miety_homes.csv` | 1 Home | 1 |
| `demo_miety_contracts.csv` | 4 Versorgungsvertraege | 4 |
| `demo_acq_mandates.csv` | 1 Mandat | 1 |
| `demo_pets.csv` | 5 Pets (Luna, Bello + PM-Demo) | 5 |
| `demo_pet_customers.csv` | 3 Kunden | 3 |
| `demo_pet_bookings.csv` | 5 Buchungen | 5 |

Alle Spalten werden exakt aus den bestehenden `data.ts`-Konstanten und DB-Schema abgeleitet.

### Phase 2: Seed-Engine erweitern (useDemoSeedEngine.ts)

Neue Seed-Funktionen fuer jede Tabelle, gleicher Pattern wie existierende:
1. `seedVehicles(tenantId)` 
2. `seedInsuranceContracts(tenantId)`
3. `seedHouseholdPersons(tenantId)`
4. `seedPvPlants(tenantId)`
5. `seedKvContracts(tenantId)`
6. `seedVorsorgeContracts(tenantId)`
7. `seedSubscriptions(tenantId)`
8. `seedPrivateLoans(tenantId)`
9. `seedMietyHomes(tenantId)`
10. `seedMietyContracts(tenantId)`
11. `seedAcqMandates(tenantId)`
12. `seedPets(tenantId)`
13. `seedPetCustomers(tenantId)`
14. `seedPetBookings(tenantId)`

Seed-Reihenfolge im `seedDemoData()` Orchestrator:
```text
1. contacts (FK-Ziel fuer leases)
2. properties
3. units (FK: property_id)
4. leases (FK: unit_id, contact_id)
5. loans (FK: property_id)
6. msv_bank_accounts
7. bank_transactions (FK: account_ref)
8. household_persons
9. cars_vehicles
10. pv_plants
11. insurance_contracts
12. kv_contracts
13. vorsorge_contracts
14. subscriptions
15. private_loans
16. miety_homes
17. miety_contracts (FK: home_id)
18. acq_mandates
19. pets
20. pet_customers
21. pet_bookings
```

Jede Funktion registriert ihre IDs in `test_data_registry`.

### Phase 3: Cleanup-Engine erweitern (useDemoCleanup.ts)

`CLEANUP_ORDER` erweitern um alle neuen Entity-Typen:
```text
bank_transactions → pet_bookings → pet_customers → pets →
miety_contracts → miety_homes → subscriptions → private_loans →
vorsorge_contracts → kv_contracts → insurance_contracts →
pv_plants → cars_vehicles → household_persons →
acq_mandates → loans → leases → units →
msv_bank_accounts → properties → contacts
```

### Phase 4: Alt-DB-Seeds einmalig loeschen

Alle bestehenden "DB-Seed"-Daten, die bisher NICHT ueber die Seed-Engine verwaltet wurden, muessen einmalig geloescht werden:
- 2 cars_vehicles, 7 insurance_contracts, 4 household_persons, 1 pv_plant
- 4 kv_contracts, 6 vorsorge_contracts, 2 private_loans
- 1 miety_home, 1 acq_mandate
- 5 pets, 3 pet_customers, 5 pet_bookings
- Pet Provider/Services/Rooms/Staff (bleiben als Infrastruktur, werden NICHT getoggelt)

Diese werden danach NUR noch via Seed-Engine erzeugt.

### Phase 5: Backlog-Datei erstellen

Neue Datei `DEMO_ENGINE_BACKLOG.md` mit:
- Vollstaendige Entity-Checkliste (Soll vs. Ist)
- Status pro Tabelle (CSV vorhanden / Seed-Funktion / Cleanup-Funktion / Getestet)
- Offene Punkte (dev_projects, rent_payments via rent-match)
- Test-Protokoll: Seed ON → Verify Counts → Seed OFF → Verify 0

### Phase 6: Verifizierung

Nach Implementierung wird ein vollstaendiger Zyklus getestet:
1. Toggle OFF → Cleanup → DB-Counts pruefen (alles 0)
2. Toggle ON → Seed → DB-Counts pruefen (alle Soll-Werte)
3. Toggle OFF → Cleanup → DB-Counts pruefen (wieder 0)

## Bewusst ausgenommen (spaeter)

| Entity | Grund |
|--------|-------|
| dev_projects (MOD-13) | Braucht eigene CSV + komplexe Struktur (Units, Berechnungen) |
| rent_payments | Werden via sot-rent-match Edge Function erzeugt, nicht direkt geseeded |
| Pet Provider/Services/Rooms/Staff | Infrastruktur-Daten, gehoeren zum Mandanten, nicht zum Demo-Toggle |
| documents (DMS) | 41 Eintraege, Ordnerstruktur — gehoert zur Mandanten-Konfiguration |

## Technische Details

### CSV-Format
- Delimiter: `;` (Semikolon, wie bestehende CSVs)
- Encoding: UTF-8
- Alle IDs: Bestehende `e0000000-*` und `d0000000-*` Praefix-IDs aus data.ts
- Alle Spalten: Exakt wie DB-Schema (snake_case)

### Seed-Engine Pattern (pro Tabelle)
```typescript
async function seedVehicles(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_vehicles.csv');
  if (!rows.length) return [];
  const data = rows.map(r => stripNulls({ ...r, tenant_id: tenantId }));
  const { error } = await (supabase as any)
    .from('cars_vehicles').upsert(data, { onConflict: 'id' });
  if (error) console.error('[DemoSeed] cars_vehicles:', error.message);
  else console.log(`[DemoSeed] cars_vehicles: ${rows.length}`);
  return error ? [] : rows.map(r => r.id as string);
}
```

### Cleanup-Order Logik
Kinder vor Eltern, RESTRICT-FK vor CASCADE-FK. Die erweiterte Liste stellt sicher, dass keine FK-Violations auftreten.
