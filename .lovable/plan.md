

## Demo-Daten-Container fuer Pet Manager (MOD-22)

### Ueberblick

Es wird ein eigenstaendiger Demo-Datenbereich fuer den Pet Manager angelegt, analog zum bestehenden Demo-System (Familie Mustermann). Die Daten werden als hardcoded Constants in einer neuen Datei `src/engines/demoData/petManagerDemo.ts` definiert und in `data.ts`, `spec.ts`, `engine.ts` und `index.ts` integriert.

### Demo-Datensatz

**3 Kunden** (pet_customers, Source: manual + website):

| Name | Source | Origin | Hunde |
|------|--------|--------|-------|
| Sabine Berger | manual (Eigenkunde) | Z2 | Rocky (Labrador, 4 J.) |
| Thomas Richter | lead (Website) | Z3 | Mia (Golden Retriever, 2 J.), Oskar (Dackel, 7 J.) |
| Claudia Stein | lead (Website) | Z3 | — (keine eigenen Hunde, bucht fuer Freundin → nutzt Rocky) |

**3 Hunde** (pets mit customer_id):

| Name | Rasse | Geburt | Kunde |
|------|-------|--------|-------|
| Rocky | Labrador Retriever | 2022-05-10 | Sabine Berger |
| Mia | Golden Retriever | 2024-01-15 | Thomas Richter |
| Oskar | Dackel | 2019-08-22 | Thomas Richter |

**5 Buchungen** (pet_bookings):

| # | Typ | Hund | Zeitraum/Termin | Service | Staff |
|---|-----|------|-----------------|---------|-------|
| 1 | Pension | Rocky | 03.03 – 16.03.2026 (2 Wochen) | Urlaubsbetreuung | — |
| 2 | Pension | Mia | 10.03 – 23.03.2026 (2 Wochen) | Urlaubsbetreuung | — |
| 3 | Service | Rocky | 25.02.2026 09:00 | Hundesalon Komplett | Anna Mueller |
| 4 | Service | Oskar | 27.02.2026 10:00 | Gassi-Service (1h) | Max Krause |
| 5 | Service | Mia | 01.03.2026 14:00 | Hundesalon Komplett | Lisa Schmidt |

### Technische Umsetzung

**1. Neue Datei: `src/engines/demoData/petManagerDemo.ts`**

Enthaelt alle Pet-Manager-Demo-Konstanten:
- Feste UUIDs fuer 3 Kunden, 3 Hunde, 5 Buchungen (Nummernkreis `d0000000-0000-4000-a000-000000001xxx`)
- Typisierte Arrays: `DEMO_PM_CUSTOMERS`, `DEMO_PM_PETS`, `DEMO_PM_BOOKINGS`
- Interfaces: `DemoPMCustomer`, `DemoPMPet`, `DemoPMBooking`
- Nutzt bestehende Staff-IDs (aus DB) und Service-IDs (aus data.ts) sowie Room-IDs (aus DB)

**2. Erweiterung: `src/engines/demoData/spec.ts`**

Neue Interfaces hinzufuegen:
- `DemoPMCustomer` — Kunden-Datensatz mit source/origin_zone
- `DemoPMPet` — Tier mit customer_id Referenz
- `DemoPMBooking` — Buchung (pension oder service)
- `DemoDataSpec` erweitern um `pmCustomers`, `pmPets`, `pmBookings`

**3. Erweiterung: `src/engines/demoData/data.ts`**

- Import + Re-Export der neuen Arrays aus `petManagerDemo.ts`
- Alle neuen Demo-IDs in `ALL_DEMO_IDS` eintragen
- `DEMO_DATA_SPEC` um die drei neuen Felder erweitern
- Coverage Map aktualisieren (GP-PET Eintrag)

**4. Erweiterung: `src/engines/demoData/engine.ts`**

Neue Accessor-Funktionen:
- `getDemoPMCustomers()`
- `getDemoPMPets()`
- `getDemoPMBookings()`

**5. Erweiterung: `src/engines/demoData/index.ts`**

Re-Export der neuen Datei.

**6. Erweiterung: `src/hooks/usePetCustomers.ts`**

Demo-Daten-Integration: Wenn kein Provider vorhanden oder Demo-Modus aktiv, werden die hardcoded Demo-Kunden zurueckgegeben (analog zu anderen Demo-Hooks).

**7. Integration in PMKunden.tsx**

Demo-Kunden in der Kundenliste anzeigen, wenn Demo-Modus aktiv.

### Keine Datenbank-Aenderungen

Alle Demo-Daten sind rein clientseitig (hardcoded Constants). Sie werden nicht in die DB geschrieben, analog zum bestehenden Demo-System.

