
## GP-PET Vollstaendige Funktions- und Gap-Analyse mit Implementierungsplan

---

### TEIL 1: IST-ZUSTAND (Bestandsaufnahme)

#### 1.1 Datenbank — Was existiert in der DB

| Tabelle | Datensaetze | Inhalt |
|---------|-------------|--------|
| pet_providers | 1 | Lennox & Friends (active, verified, 10 PLZ-Gebiete) |
| pet_rooms | 10 | 6 Zimmer, 2 Boxen, 2 Auslaeufe |
| pet_staff | 3 | Anna Mueller, Max Krause, Lisa Schmidt (echte IDs, nicht Demo-IDs) |
| pet_services | 4 | Grooming, Walking, Daycare, Boarding (feste IDs d0...60-63) |
| pet_shop_products | 16 | 6 Ernaehrung (Lakefields), 10 Fressnapf, 0 LennoxStyle, 0 LennoxTracker |
| pet_z1_customers | 0 | LEER |
| pet_z1_pets | 0 | LEER |
| pet_customers | 0 | LEER |
| pets | 2 | Luna + Bello (owner_user_id = DEMO_USER_ID, customer_id = NULL) |
| pet_bookings | 0 | LEER |
| pet_invoices | 0 | LEER |

#### 1.2 Demo-Daten im Code (petManagerDemo.ts) — NUR clientseitig

| Datentyp | Anzahl | Details |
|----------|--------|---------|
| DEMO_PM_CUSTOMERS | 3 | Berger (manual/Z2), Richter (lead/Z3), Stein (lead/Z3) |
| DEMO_PM_PETS | 3 | Rocky (Berger), Mia + Oskar (Richter) |
| DEMO_PM_BOOKINGS | 5 | 2 Pension + 3 Service (confirmed/completed) |
| Staff-IDs | 3 | d0...1030-1032 (weichen von echten DB-Staff-IDs ab!) |

**Kritisches Problem:** Die Demo-Daten in `petManagerDemo.ts` verwenden eigene Staff-IDs (d0...1030-1032), aber die echten Staff-Datensaetze in der DB haben andere UUIDs (935e..., c198..., 847b...). Ebenso fehlen Z1-Daten komplett — die GP-PET Context Resolver prueft die DB und findet nichts.

#### 1.3 Golden Path GP-PET — Engine-Status

| Komponente | Status | Details |
|------------|--------|---------|
| Definition (GP_PET.ts) | VORHANDEN | 6 Phasen, Fail-States, Contracts definiert |
| Context Resolver (gpPetResolver) | VORHANDEN | Prueft pet_customers, pets, pet_bookings in DB |
| Engine-Registrierung | VORHANDEN | registerGoldenPath('GP-PET', ...) |
| Resolver-Ergebnis aktuell | ALLE FALSE | customer_exists=false, pet_exists=true (2 Pets), first_booking_completed=false |

#### 1.4 Zone 1 (Admin Pet Desk) — UI-Status

| Tab | Status | Details |
|-----|--------|---------|
| Governance | FUNKTIONAL | KPI-Dashboard, liest pet_providers/bookings/invoices |
| Vorgaenge | PLATZHALTER | Nur Text, keine Logik |
| Kunden | FUNKTIONAL (read-only) | Liest pet_z1_customers, zeigt Z1-Pets — aber DB leer |
| Shop | FUNKTIONAL | CRUD fuer pet_shop_products, 4 Tabs |
| Billing | PLATZHALTER | Nur Text |

#### 1.5 Zone 2 (Portal Pet Manager) — UI-Status

| Seite | Status | Details |
|-------|--------|---------|
| PMKunden | TEILS FUNKTIONAL | Liest pet_customers (leer), Demo-Fallback clientseitig |
| PMPension/PMServices/PMKalender | UI-Shells | Darstellung vorhanden, keine echten Buchungsdaten |
| PMBuchungen | UI-Shell | Liest pet_bookings (leer) |
| PMPersonal | FUNKTIONAL | 3 Staff in DB |
| PMRaeume | FUNKTIONAL | 10 Raeume in DB |
| PetsShop | FUNKTIONAL | Liest pet_shop_products aus DB |

#### 1.6 Zone 3 (Lennox Website) — UI-Status

| Seite | Status | Details |
|-------|--------|---------|
| LennoxStartseite | FUNKTIONAL | PLZ-Suche, Provider-Ergebnisse |
| LennoxPartnerProfil | FUNKTIONAL | Service-Kacheln aus DB |
| LennoxPartnerWerden | UI VORHANDEN, KEIN DB-WRITE | TODO-Kommentar in Zeile 49 — speichert nicht |
| LennoxShop | FUNKTIONAL | Liest pet_shop_products |
| LennoxMeinBereich | FUNKTIONAL (leer) | Liest pet_z1_customers/pets — DB leer |
| LennoxAuth | FUNKTIONAL | Signup ruft sot-pet-profile-init Edge Function |
| Edge Function sot-pet-profile-init | FUNKTIONAL | Erstellt pet_z1_customers mit source='website' |

---

### TEIL 2: GAP-ANALYSE

#### GP-PET Phase 1 — Lead-Erfassung (Z3 -> Z1)

| ID | Gap | Schwere | Beschreibung |
|----|-----|---------|-------------|
| GAP-01 | LennoxPartnerWerden kein DB-Write | KRITISCH | Zeile 49: TODO-Kommentar, `setTimeout` statt Insert |
| GAP-02 | Booking-Anfrage (Z3) kein DB-Write | MITTEL | LennoxPartnerProfil hat Booking-UI aber keine Persistenz |
| GAP-03 | sot-pet-profile-init Tenant-Lookup fragil | NIEDRIG | Sucht `slug='internal'`, Fallback auf erste Org |

#### GP-PET Phase 2 — Z1-Profil anlegen

| ID | Gap | Schwere | Beschreibung |
|----|-----|---------|-------------|
| GAP-04 | PetDeskKunden hat kein CREATE | HOCH | Nur Leseansicht, kein Button zum manuellen Anlegen |
| GAP-05 | pet_z1_customers leer | KRITISCH | Kein Seed, GP-Resolver liefert keine Daten |

#### GP-PET Phase 3 — Qualifizierung und Zuweisung (Z1 -> Z2)

| ID | Gap | Schwere | Beschreibung |
|----|-----|---------|-------------|
| GAP-06 | PetDeskVorgaenge komplett Platzhalter | KRITISCH | Keine Lead-Liste, kein Status-Workflow |
| GAP-07 | Kein Zuweisungs-Workflow Z1->Z2 | KRITISCH | Keine Logik fuer pet_z1_customers -> pet_customers Kopie |
| GAP-08 | Status-Workflow nicht implementiert | HOCH | new -> qualified -> assigned existiert nur im Schema |

#### GP-PET Phase 4 — Tierakte (Z2)

| ID | Gap | Schwere | Beschreibung |
|----|-----|---------|-------------|
| GAP-09 | pets ohne customer_id | MITTEL | 2 DB-Pets haben customer_id=NULL, nur owner_user_id |
| GAP-10 | Keine pet_z1_pets in DB | HOCH | Z1-Tier-Tabelle leer |

#### GP-PET Phase 5 — Erste Buchung (Z2)

| ID | Gap | Schwere | Beschreibung |
|----|-----|---------|-------------|
| GAP-11 | pet_bookings leer | KRITISCH | Kein Seed, GP success_state unerreichbar |

#### GP-PET Phase 6 — Aktiver Kunde

| ID | Gap | Schwere | Beschreibung |
|----|-----|---------|-------------|
| GAP-12 | success_state unerreichbar | KRITISCH | Abhaengig von GAP-05, GAP-11 |

#### Demo-Daten-Konsistenz

| ID | Gap | Schwere | Beschreibung |
|----|-----|---------|-------------|
| GAP-13 | Demo-Daten nur clientseitig | HOCH | petManagerDemo.ts wird nie in DB geschrieben |
| GAP-14 | Staff-ID-Mismatch | MITTEL | Demo Staff-IDs (d0...1030-32) ≠ echte DB-IDs |
| GAP-15 | Demo-Bookings referenzieren nicht-existente Pets/Kunden | HOCH | pet_bookings.pet_id FK kann nicht aufgeloest werden |

---

### TEIL 3: IMPLEMENTIERUNGSPLAN

#### Schritt 1: Demo-Daten-Seed (SQL-Migration)

Ziel: petManagerDemo.ts-Daten 1:1 in die DB uebertragen, sodass GP-PET Resolver alle Flags auf `true` bekommt.

**1a) pet_z1_customers — 2 Eintraege (Lead-Kunden)**

```text
Richter (d0...1040): Thomas Richter, source=website, status=assigned
Stein   (d0...1041): Claudia Stein, source=website, status=assigned
```

**1b) pet_z1_pets — 3 Eintraege (Z1-Tierakten)**

```text
Rocky (d0...1050): z1_customer_id = Richter? NEIN — Rocky gehoert Berger (Z2-Eigenkunde)
Mia   (d0...1051): z1_customer_id = d0...1040 (Richter)
Oskar (d0...1052): z1_customer_id = d0...1040 (Richter)
```

Nur Mia und Oskar kommen ueber Z1 (da Richter ein Lead/Z3-Kunde ist). Rocky ist Bergers Hund (Eigenkunde Z2), wird direkt in pets angelegt.

**1c) pet_customers — 3 Eintraege (Z2-Provider-Kunden)**

Verwenden die bestehenden Demo-IDs aus petManagerDemo.ts:

```text
Berger  (d0...1001): source=manual, origin_zone=Z2, z1_customer_id=NULL
Richter (d0...1002): source=lead, origin_zone=Z3, z1_customer_id=d0...1040
Stein   (d0...1003): source=lead, origin_zone=Z3, z1_customer_id=d0...1041
```

**1d) pets — 3 zusaetzliche Eintraege (Z2-Tierakten, mit customer_id)**

Verwenden Demo-IDs, ergaenzen customer_id:

```text
Rocky (d0...1010): customer_id=d0...1001 (Berger)
Mia   (d0...1011): customer_id=d0...1002 (Richter)
Oskar (d0...1012): customer_id=d0...1002 (Richter)
```

Hinweis: Luna + Bello (d0...0010/0011) bleiben unveraendert — das sind MOD-05 Tiere mit owner_user_id.

**1e) pet_bookings — 5 Eintraege**

Verwenden die echten DB-Staff-IDs (nicht die Demo-IDs aus petManagerDemo.ts):

```text
Booking 1 (d0...1020): Rocky, Boarding, 2026-03-03, confirmed, staff_id=NULL (Pension)
Booking 2 (d0...1021): Mia, Boarding, 2026-03-10, confirmed, staff_id=NULL (Pension)
Booking 3 (d0...1022): Rocky, Grooming, 2026-02-25, completed, staff_id=935e... (Anna)
Booking 4 (d0...1023): Oskar, Walking, 2026-02-27, confirmed, staff_id=c198... (Max)
Booking 5 (d0...1024): Mia, Grooming, 2026-03-01, confirmed, staff_id=847b... (Lisa)
```

Staff-ID-Mapping: Anna=935e7dd4..., Max=c198ffb0..., Lisa=847b65f8... (echte DB-Werte).

**1f) petManagerDemo.ts aktualisieren**

Staff-IDs im Code an echte DB-Werte angleichen und Z1-Customer-IDs korrekt setzen.

#### Schritt 2: PetDeskVorgaenge — Minimale Lead-Qualifizierung

Aktuell Platzhalter, wird ersetzt durch:

- Tabelle aller pet_z1_customers mit status `new` oder `qualified`
- Status-Badges (Neu, Qualifiziert, Zugewiesen)
- Action-Button "Qualifizieren" (new -> qualified)
- Action-Button "Provider zuweisen" (qualified -> assigned):
  - Kopiert Kundendaten von pet_z1_customers nach pet_customers
  - Kopiert Tierdaten von pet_z1_pets nach pets
  - Setzt pet_z1_customers.status = 'assigned'
  - Setzt pet_z1_customers.assigned_provider_id + assigned_at

#### Schritt 3: PetDeskKunden — CREATE-Button

- Button "Kunde anlegen" im Header
- Dialog: Vorname, Nachname, E-Mail, Telefon, Adresse, PLZ, Stadt, Notizen
- Insert in pet_z1_customers mit source='manual'

#### Schritt 4: LennoxPartnerWerden — DB-Persistenz

- TODO in Zeile 49 ersetzen durch echten supabase.functions.invoke('sot-pet-profile-init') Aufruf
- Oder direkten Insert in pet_z1_customers mit source='partner_application' (via Edge Function)

#### Schritt 5: petManagerDemo.ts — Staff-IDs korrigieren

- STAFF_ANNA = echte DB-ID (935e7dd4-3d93-4170-9022-0b0148c90811)
- STAFF_MAX_K = echte DB-ID (c198ffb0-1b16-4cfa-b582-a86fa0fbf097)
- STAFF_LISA = echte DB-ID (847b65f8-6f2e-432c-8d3e-cf54a97e4707)

---

### TEIL 4: DATEIEN-UEBERSICHT

| Datei | Aktion | Begruendung |
|-------|--------|-------------|
| SQL-Migration | NEU | Seed: pet_z1_customers, pet_z1_pets, pet_customers, pets, pet_bookings |
| src/engines/demoData/petManagerDemo.ts | EDIT | Staff-IDs auf echte DB-Werte, Z1-Customer-IDs ergaenzen |
| src/pages/admin/petmanager/PetDeskVorgaenge.tsx | REWRITE | Lead-Liste mit Qualifizierung + Zuweisungs-Workflow |
| src/pages/admin/petmanager/PetDeskKunden.tsx | EDIT | CREATE-Button + Dialog hinzufuegen |
| src/pages/zone3/lennox/LennoxPartnerWerden.tsx | EDIT | TODO durch echten DB-Insert ersetzen |

### TEIL 5: GP-PET RESOLVER NACH SEED

| Flag | Vorher | Nachher |
|------|--------|---------|
| customer_exists | false | true (3 pet_customers) |
| pet_exists | true (2 MOD-05 Pets) | true (2 MOD-05 + 3 PM Pets) |
| first_booking_completed | false | true (Booking 3: completed) |
| **success_state** | **UNERREICHBAR** | **ERREICHBAR** |
