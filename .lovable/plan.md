

# Golden Tenant Bereinigung — Komplettplan

## Ist-Zustand: Dateninventar

### Golden Tenant (thomas.stelzl@systemofatown.com)
**User-ID:** `d028bc99-6e29-4fa4-b038-d03015faf222`
**Tenant-ID:** `a0000000-0000-4000-a000-000000000001`

| Tabelle | Anzahl | Davon Alt-Seeds (zu loeschen) | Davon SSOT-Demo (behalten) | Davon DB-Seeds (Entscheidung) |
|---------|--------|-------------------------------|---------------------------|-------------------------------|
| contacts | 10 | 5x `00000000-*` (Alt) | 5x `d0000000-*` (SSOT) | — |
| properties | 3 | — | 3x `d0000000-*` (SSOT) | — |
| units | 6 | 3x `d0000000-b000-*` (Alt) | 3x `d0000000-a000-001x` (SSOT) | — |
| leases | 6 | 3x `d0000000-c000-*` (Alt, verweisen auf alte Kontakte) | 3x `d0000000-a000-020x` (SSOT) | — |
| loans | 6 | 3x `d0000000-d000-*` (Alt) | 3x `d0000000-a000-050x` (SSOT) | — |
| msv_bank_accounts | 1 | — | 1x `d0000000-*` (SSOT) | — |
| bank_transactions | 3 | — | 3x (SSOT) | — |
| cars_vehicles | 2 | — | — | 2x `00000000-*` (DB-Seed, BEHALTEN) |
| insurance_contracts | 7 | — | — | 7x `e0000000-*` (DB-Seed, BEHALTEN) |
| household_persons | 4 | — | — | 4x (DB-Seed, BEHALTEN) |
| pv_plants | 1 | — | — | 1x `00000000-*` (DB-Seed, BEHALTEN) |
| acq_mandates | 1 | — | — | 1x `e0000000-*` (DB-Seed, BEHALTEN) |
| listings | 3 | — | — | 3x (automatisch via Properties) |
| rent_payments | 42 | — | — | Kinder von Leases (CASCADE) |
| property_accounting | 3 | — | — | Kinder von Properties (CASCADE) |
| listing_publications | 6 | — | — | Kinder von Listings (CASCADE) |
| documents | 41 | — | — | DMS-Eintraege (BEHALTEN) |
| pets | 5 | — | 2x Luna+Bello (MOD-05 Demo) | 3x Rocky+Mia+Oskar (Pet Manager Demo) |
| pet_customers | 3 | — | — | 3x (Pet Manager Demo, BEHALTEN) |
| pet_bookings | 5 | — | — | 5x (Pet Manager Demo, BEHALTEN) |
| pet_providers | 1 | — | — | 1x Lennox (BEHALTEN) |
| pet_services | 4 | — | — | 4x (BEHALTEN) |
| pet_rooms | 10 | — | — | 10x (BEHALTEN) |
| pet_staff | 3 | — | — | 3x (BEHALTEN) |
| pet_z1_customers | 4 | — | — | 4x (BEHALTEN) |
| pet_z1_pets | 2 | — | — | 2x (BEHALTEN) |
| pet_vaccinations | 5 | — | — | 5x (BEHALTEN) |
| pet_provider_availability | 11 | — | — | 11x (BEHALTEN) |

### Andere Tenants (ZU LOESCHEN)
| Tenant | User | Daten |
|--------|------|-------|
| `8a50d191-*` (test-beta-check) | `bea22e67-*` | 0 operative Records, nur Membership + Profile |
| `f46f793a-*` (marchner) | `9e2863d9-*` | 0 operative Records, nur Membership + Profile |

---

## Was wird geloescht

### 1. Alt-Seed-Duplikate im Golden Tenant

Die folgenden Entities sind Ueberbleibsel der alten `seed_golden_path_data` RPC und existieren parallel zu den neuen SSOT-Daten:

**Schritt 1 — Alte Leases loeschen (RESTRICT auf Contacts):**
- `d0000000-0000-4000-c000-000000000001` (verweist auf alten Kontakt 00000000-...103)
- `d0000000-0000-4000-c000-000000000002` (verweist auf alten Kontakt 00000000-...101)
- `d0000000-0000-4000-c000-000000000003` (verweist auf alten Kontakt 00000000-...102)
- Ihre `rent_payments` werden per CASCADE mitgeloescht

**Schritt 2 — Alte Units loeschen:**
- `d0000000-0000-4000-b000-000000000001`
- `d0000000-0000-4000-b000-000000000002`
- `d0000000-0000-4000-b000-000000000003`

**Schritt 3 — Alte Loans loeschen:**
- `d0000000-0000-4000-d000-000000000001`
- `d0000000-0000-4000-d000-000000000002`
- `d0000000-0000-4000-d000-000000000003`

**Schritt 4 — Alte Contacts loeschen (erst nach Leases!):**
- `00000000-0000-4000-a000-000000000101` (Max Mustermann, alt)
- `00000000-0000-4000-a000-000000000102` (Lisa Mustermann, alt)
- `00000000-0000-4000-a000-000000000103` (Thomas Bergmann, alt)
- `00000000-0000-4000-a000-000000000104` (Sandra Hoffmann, alt)
- `00000000-0000-4000-a000-000000000105` (Michael Weber, alt)

### 2. Andere Tenants komplett entfernen

**Reihenfolge (FK-sicher):**
1. Memberships der beiden Tenants loeschen
2. Profiles der beiden User loeschen
3. Organizations loeschen
4. Auth-Users loeschen (sofern moeglich via Supabase Admin API, ansonsten manuell)

**Betroffen:**
- User `bea22e67-*` (test-beta-check@example.com) + Tenant `8a50d191-*`
- User `9e2863d9-*` (marchner@mm7immobilien.de) + Tenant `f46f793a-*`

### 3. test_data_registry bereinigen

Alle Registry-Eintraege loeschen und neu anlegen, damit sie exakt den verbleibenden Demo-Entities entsprechen.

---

## Was NICHT geloescht wird

| Kategorie | Entities | Grund |
|-----------|----------|-------|
| Login-Daten | thomas.stelzl@systemofadown.com | Explizite Anforderung |
| Golden Tenant Org | `a0000000-*` (System of a Town) | Basis-Infrastruktur |
| Membership | `b0000000-*` (platform_admin) | Zugehoerigkeit |
| Profile | `d028bc99-*` (Display: Max Mustermann) | User-Profil |
| SSOT-Demo-Daten | 3 Properties, 5 Contacts, 3 Units, 3 Leases, 3 Loans, 1 Bankkonto, Transaktionen | Neue CSV-basierte Demo |
| DB-Seed-Demo | 2 Autos, 7 Versicherungen, 1 PV-Anlage, 1 Akquise-Mandat, 4 Haushaltspersonen | Bestehende Demo-Seeds |
| Pet Manager (MOD-05) | 2 Pets (Luna, Bello), Provider Lennox, 4 Services | Demo-Container 1 |
| Pet Manager (MOD-22) | 3 Kunden, 3 Hunde, 5 Buchungen, 10 Zimmer, 3 Staff | Demo-Container 2 |
| DMS Documents | 41 Eintraege | Ordnerstruktur |
| Listings | 3 (Kinder der Properties) | CASCADE-abhaengig |

---

## Technische Umsetzung

### Schritt 1: Datenbereinigung (SQL via Insert Tool)

FK-sichere Loeschreihenfolge:

```text
1. DELETE leases WHERE id IN (3 alte c000-IDs)      → rent_payments CASCADE
2. DELETE units WHERE id IN (3 alte b000-IDs)        → keine Kinder mehr
3. DELETE loans WHERE id IN (3 alte d000-IDs)
4. DELETE contacts WHERE id IN (5 alte 00000000-IDs) → SET NULL auf Referenzen
5. DELETE memberships WHERE tenant_id IN (2 fremde Tenants)
6. DELETE profiles WHERE id IN (2 fremde User-IDs)
7. DELETE organizations WHERE id IN (2 fremde Tenant-IDs)
8. TRUNCATE + re-seed test_data_registry mit korrekten IDs
```

### Schritt 2: ID-Registry aktualisieren

`src/engines/demoData/data.ts` — `ALL_DEMO_IDS` muss alle verbleibenden Demo-IDs enthalten:
- Alte `00000000-*` IDs fuer Vehicles und PV-Plant behalten (DB-Seeds)
- Alle `e0000000-*` IDs fuer Insurance, Household, Acq-Mandate behalten
- Alle `d0000000-*` SSOT-IDs behalten
- Alte `00000000-*` Contact-IDs ENTFERNEN

### Schritt 3: Cleanup-Hook erweitern

`useDemoCleanup.ts` muss die erweiterten Entity-Typen (vehicles, insurance, pv_plants, acq_mandates, household_persons, pets, pet_customers, etc.) kennen.

### Schritt 4: Seed-Engine erweitern

`useDemoSeedEngine.ts` soll langfristig auch Vehicles, Insurance, PV-Plants, Akquise-Mandate per CSV seeden. Fuer jetzt bleiben diese als DB-Seeds bestehen — die Seed-Engine wird in Phase 4/5 erweitert.

### Schritt 5: Auth-User-Bereinigung

Die beiden Test-User (`test-beta-check`, `marchner`) muessen aus `auth.users` entfernt werden. Da direkte Aenderungen an `auth.*` nicht per Migration moeglich sind, wird dies ueber die Admin-API (Edge Function) oder manuell erledigt.

---

## Erwartetes Endergebnis

Nach der Bereinigung enthaelt die Datenbank **exakt einen Tenant** mit folgender Demo-Welt:

```text
Golden Tenant: System of a Town (thomas.stelzl@systemofadown.com)
|
+-- Haushalt: Max & Lisa Mustermann, Felix (Kind), Emma (Kind)
|
+-- 3 Immobilien (Berlin, Muenchen, Hamburg)
|   +-- je 1 Unit, 1 Lease, 1 Loan
|   +-- je 1 Listing mit Publications
|   +-- je 1 Property Accounting
|   +-- 42 Rent Payments
|
+-- 2 Fahrzeuge (Porsche 911, BMW M5)
+-- 1 PV-Anlage
+-- 7 Versicherungen (PHV, Hausrat, Wohngebaeude, Rechtsschutz, 2x KFZ, BU)
+-- 1 Bankkonto (Sparkasse) + 3 Transaktionen
+-- 1 Akquise-Mandat
|
+-- Pet Manager Container 1 (MOD-05):
|   Luna (Golden Retriever) + Bello (Dackel)
|   Provider: Lennox & Friends, 4 Services
|
+-- Pet Manager Container 2 (MOD-22):
    3 Kunden (Sabine, Thomas, Claudia)
    3 Hunde (Rocky, Mia, Oskar)
    5 Buchungen, 10 Zimmer, 3 Staff

Fehlend (spaeter ergaenzen):
- MOD-13: Immobilienprojekt (dev_projects = 0)
- Demo-Banktransaktionen: Nur 3 statt 100 (CSV hat 100, Seeding lief nicht vollstaendig)
```

