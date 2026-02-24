
# Lennox & Friends — Eigener Partner-Account ✅

## Durchgeführte Änderungen

### 1. Demo-Seed-Engine bereinigt (`useDemoSeedEngine.ts`)
- Phase 7 (Pet Manager Business-Daten) aus Golden Tenant **entfernt**
- Nur noch Owner-Pets (Luna + Bello) für MOD-05 werden im Golden Tenant geseedet
- `TOTAL_SEED_STEPS`: 33 → 28
- `EXPECTED`-Diagnostik: pet_z1_customers, pet_providers, pet_services, pet_customers, pet_bookings entfernt; pets: 5 → 2
- Neue Funktion `seedOwnerPets()` ersetzt die alte `seedPets()` (nur Luna + Bello)

### 2. Demo-Cleanup bereinigt (`useDemoCleanup.ts`)
- Pet-Business-Entities (pet_bookings, pet_customers, pet_services, pet_z1_customers, pet_providers) aus `CLEANUP_ORDER` entfernt
- Nur noch `pets` (Owner-Pets) wird beim Demo-Reset gelöscht

### 3. rolesMatrix.ts — pet_manager korrigiert
- `ROLE_EXTRA_TILES.pet_manager`: `['MOD-22']` → `['MOD-22', 'MOD-10']`
- `ROLES_CATALOG.pet_manager.totalModules`: 15 → 16
- `MODULE_ROLE_MATRIX['MOD-10']`: `pet_manager` hinzugefügt

### 4. Lennox & Friends Account angelegt (Produktiv)
- **Manager Application**: `f0000000-0000-4000-a000-000000022001` (Robyn Gebhard)
- **Edge Function** `sot-manager-activate` erfolgreich ausgeführt
- **User**: `99d271be-4ebb-4495-970d-ad91e943e4f0` (robyn@lennoxandfriends.de)
- **Tenant**: `eac1778a-23bc-4d03-b3f9-b26be27c9505` (Lennox & Friends Dog Resorts — Filiale Ottobrunn)
- **Role**: `pet_manager`
- **Tiles**: 14 Basis + MOD-22 + MOD-10 = 16 Module ✅

### 5. Bekanntes Issue
- `org_type` bleibt `client` statt `partner` — der Trigger `enforce_org_hierarchy_immutability()` blockiert auch Service-Role-Updates. Muss in einer separaten Migration behoben werden (Trigger für Service-Role-Key bypassen oder org_type beim Erstellen richtig setzen).

## Nächste Schritte
- [ ] org_type-Trigger fixen (SECURITY DEFINER bypass für Service-Role)
- [ ] Einladungs-E-Mail an Robyn senden (Password-Reset-Link)
- [ ] Pet-Business-Daten für Lennox-Tenant seeden (Kunden, Services, Buchungen)
