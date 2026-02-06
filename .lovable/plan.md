

# MOD-17 CAR-MANAGEMENT — VOLLSTÄNDIGES PLANUNGSDOKUMENT

---

## 1) IST-AUDIT TABELLE

### Aktueller Zustand unter /portal/cars

| current_path | current_label | current_component | status | problems | recommended_target |
|-------------|---------------|-------------------|--------|----------|-------------------|
| `/portal/cars` | Car-Management | `ModuleHowItWorks` | ok | Nur Dokumentations-Einstieg, zeigt `moduleContents['MOD-17']` | Fahrzeuge (How It Works bleibt erhalten) |
| `/portal/cars/uebersicht` | Übersicht | `UebersichtTile` | placeholder | Zeigt nur Empty State "Keine Fahrzeuge", redundant zu Fahrzeuge-Tile | **ENTFERNEN** — In Fahrzeuge integrieren |
| `/portal/cars/fahrzeuge` | Fahrzeuge | `FahrzeugeTile` | placeholder | Zeigt nur Empty State "Keine Fahrzeuge", keine Logik | Fahrzeuge (primäre Liste) |
| `/portal/cars/service` | Service | `ServiceTile` | placeholder | Zeigt nur Empty State "Keine Termine", falscher Fokus | **UMBENENNEN** → Fahrtenbuch |
| `/portal/cars/settings` | Einstellungen | `EinstellungenTile` | placeholder | Zeigt nur Empty State, keine Settings-Logik | **UMBENENNEN** → Angebote |

### Manifest-Analyse (routesManifest.ts Zeilen 398-410)

```typescript
"MOD-17": {
  name: "Car-Management",
  base: "cars",
  icon: "Car",
  display_order: 17,
  visibility: { default: false, org_types: ["partner"], requires_activation: true },
  tiles: [
    { path: "uebersicht", component: "CarsUebersicht", title: "Übersicht" },
    { path: "fahrzeuge", component: "CarsFahrzeuge", title: "Fahrzeuge" },
    { path: "service", component: "CarsService", title: "Service" },
    { path: "settings", component: "CarsSettings", title: "Einstellungen" },
  ],
}
```

### Thiele-Katalog Analyse (moduleContents.ts Zeilen 603-634)

| Aspekt | Thiele-Katalog | Manifest | Implementierung | DRIFT? |
|--------|----------------|----------|-----------------|--------|
| Tile 1 | Übersicht | uebersicht | ✅ Match | Nein |
| Tile 2 | Fahrzeuge | fahrzeuge | ✅ Match | Nein |
| Tile 3 | Service | service | ✅ Match | Nein |
| Tile 4 | Einstellungen (Route: `/portal/cars/settings`) | settings | ✅ Match | Nein |

**KEIN DRIFT zwischen Thiele-Katalog und Manifest/Implementierung.**  
Aber: Die aktuelle Struktur entspricht NICHT dem fachlichen Zielbild.

### Mock/Seed-Daten Status

- **Datenbank-Tabellen:** KEINE (Query ergab leeres Array)
- **Mock-Daten in UI:** KEINE — alle Tiles zeigen `status="empty"`
- **Edge Functions:** KEINE für MOD-17

---

## 2) SOLL-MAPPING TABELLE

### IST → SOLL Transformation (4-Tile-Regel gemäß Zielbild)

| current_route | target_route | current_name | target_name | action | notes |
|--------------|--------------|--------------|-------------|--------|-------|
| `/portal/cars` | `/portal/cars` | Car-Management | Car-Management | **keep** | How It Works bleibt Index |
| `/portal/cars/uebersicht` | — | Übersicht | — | **remove** | Redundanz zu Fahrzeuge auflösen |
| `/portal/cars/fahrzeuge` | `/portal/cars/fahrzeuge` | Fahrzeuge | Fahrzeuge | **keep** | SSOT für Fahrzeug-CRUD |
| `/portal/cars/service` | `/portal/cars/versicherungen` | Service | Versicherungen | **change** | Fokus auf Versicherung + Hector |
| `/portal/cars/settings` | `/portal/cars/fahrtenbuch` | Einstellungen | Fahrtenbuch | **change** | Provider-Integration (Vimcar) |
| — | `/portal/cars/angebote` | — | Angebote | **create** | Leasing-Deals + Miete24 |
| — | `/portal/cars/:id` | — | Fahrzeugakte | **create** | Canonical Detail-View |
| — | `/portal/cars/versicherungen/:insuranceId` | — | Versicherungsakte | **create** | Insurance Detail |
| — | `/portal/cars/schaeden/:claimId` | — | Schadenfall-Akte | **create** | Claim Detail |

### Neue Tile-Struktur (Zielbild)

| Position | path | title | icon | Beschreibung |
|----------|------|-------|------|--------------|
| 1 | fahrzeuge | Fahrzeuge | Car | SSOT: Liste + Detailansicht |
| 2 | versicherungen | Versicherungen | ShieldCheck | Policen + Schäden + Hector-Vergleich |
| 3 | fahrtenbuch | Fahrtenbuch | BookOpen | Provider-Connection + Exports |
| 4 | angebote | Angebote | ShoppingCart | Leasing-Deals + Miete24 |

### moduleContents.ts Änderungsbedarf

```typescript
// SOLL-Zustand (Plan):
'MOD-17': {
  moduleCode: 'MOD-17',
  title: 'Car-Management',
  oneLiner: 'Fuhrpark, Versicherungen, Fahrtenbuch und Angebote — alles an einem Ort.',
  benefits: [
    'Alle Fahrzeuge mit Stammdaten, Finanzierung und Versicherung übersichtlich.',
    'Versicherungsvergleich über Hector starten — mit automatischer Datenübernahme.',
    'Fahrtenbuch-Integration für steuerliche Nachweise und Exports.',
  ],
  whatYouDo: [
    'Fahrzeuge anlegen und Stammdaten pflegen',
    'Versicherungen verwalten und vergleichen',
    'Schäden dokumentieren und melden',
    'Fahrtenbuch anbinden und Fahrten exportieren',
    'Leasing- und Mietangebote durchstöbern',
  ],
  flows: [
    {
      title: 'Fahrzeug erfassen',
      steps: ['Fahrzeuge', 'Neues Fahrzeug', 'Daten eingeben', 'Optional: Fahrzeugschein hochladen'],
    },
    {
      title: 'Versicherung vergleichen',
      steps: ['Versicherungen', 'Police öffnen', 'Vergleich starten', 'Angebote erhalten'],
    },
  ],
  cta: 'Legen Sie Ihr erstes Fahrzeug an — und behalten Sie den Überblick.',
  subTiles: [
    { title: 'Fahrzeuge', route: '/portal/cars/fahrzeuge', icon: Car },
    { title: 'Versicherungen', route: '/portal/cars/versicherungen', icon: ShieldCheck },
    { title: 'Fahrtenbuch', route: '/portal/cars/fahrtenbuch', icon: BookOpen },
    { title: 'Angebote', route: '/portal/cars/angebote', icon: ShoppingCart },
  ],
}
```

---

## 3) DATENMODELL SPEC

### WICHTIG: Keine Cross-Module-Abhängigkeiten
- **KEIN FK zu `contacts`** — Fahrer/Halter als String-Felder
- **KEIN FK zu `properties` oder `units`**
- **Nur tenant_id als Scoping**
- **DMS-Integration über `document_links` (MOD-03)**

---

### C1) `cars_vehicles` — Fahrzeuge (SSOT)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | YES | `gen_random_uuid()` | PK |
| `tenant_id` | UUID | YES | — | FK to organizations, RLS-Scope |
| `public_id` | TEXT | YES | `'VEH-' || ...` | Human-readable ID |
| `license_plate` | TEXT | YES | — | Kennzeichen (unique per tenant) |
| `vin` | TEXT | NO | NULL | Fahrzeug-Identifikationsnummer |
| `hsn` | TEXT | NO | NULL | Herstellerschlüsselnummer (für Versicherung) |
| `tsn` | TEXT | NO | NULL | Typschlüsselnummer (für Versicherung) |
| `make` | TEXT | NO | NULL | Hersteller (BMW, Mercedes, etc.) |
| `model` | TEXT | NO | NULL | Modell (3er, C-Klasse) |
| `variant` | TEXT | NO | NULL | Variante (320i, C200) |
| `body_type` | TEXT | NO | NULL | Limousine, Kombi, SUV, etc. |
| `color` | TEXT | NO | NULL | Außenfarbe |
| `first_registration_date` | DATE | NO | NULL | Erstzulassung |
| `power_kw` | INTEGER | NO | NULL | Leistung in kW |
| `engine_ccm` | INTEGER | NO | NULL | Hubraum in ccm |
| `fuel_type` | TEXT | NO | 'petrol' | Enum: petrol, diesel, electric, hybrid, lpg, cng |
| `co2_g_km` | INTEGER | NO | NULL | CO2-Ausstoß g/km |
| `weight_kg` | INTEGER | NO | NULL | Leergewicht |
| `max_weight_kg` | INTEGER | NO | NULL | Zul. Gesamtgewicht |
| `seats` | INTEGER | NO | NULL | Anzahl Sitzplätze |
| `doors` | INTEGER | NO | NULL | Anzahl Türen |
| `current_mileage_km` | INTEGER | NO | 0 | Aktueller Kilometerstand |
| `mileage_updated_at` | TIMESTAMPTZ | NO | NULL | Letzte KM-Aktualisierung |
| `annual_mileage_km` | INTEGER | NO | NULL | Jährliche Fahrleistung (für Versicherung) |
| `holder_name` | TEXT | NO | NULL | Halter Name (String, kein FK!) |
| `holder_address` | TEXT | NO | NULL | Halter Adresse |
| `primary_driver_name` | TEXT | NO | NULL | Hauptfahrer Name |
| `primary_driver_birthdate` | DATE | NO | NULL | Hauptfahrer Geburtsdatum |
| `hu_valid_until` | DATE | NO | NULL | Hauptuntersuchung gültig bis |
| `au_valid_until` | DATE | NO | NULL | Abgasuntersuchung gültig bis |
| `status` | TEXT | YES | 'active' | Enum: active, inactive, sold, returned |
| `dms_folder_id` | UUID | NO | NULL | FK to storage_nodes (DMS Root für Fahrzeug) |
| `notes` | TEXT | NO | NULL | Freitext-Notizen |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — |
| `created_by` | UUID | NO | NULL | FK to auth.users |

**ENUM `car_vehicle_status`:** `active`, `inactive`, `sold`, `returned`

**ENUM `car_fuel_type`:** `petrol`, `diesel`, `electric`, `hybrid_petrol`, `hybrid_diesel`, `lpg`, `cng`, `hydrogen`

**UNIQUE CONSTRAINT:** `(tenant_id, license_plate)` — Kein Duplikat-Kennzeichen pro Tenant

---

### C2) `cars_financing` — Finanzierung/Leasing

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | YES | `gen_random_uuid()` | PK |
| `tenant_id` | UUID | YES | — | RLS-Scope |
| `vehicle_id` | UUID | YES | — | FK to cars_vehicles |
| `finance_type` | TEXT | YES | 'owned' | Enum: owned, financed, leased |
| `provider_name` | TEXT | NO | NULL | Leasinggeber/Bank Name |
| `contract_number` | TEXT | NO | NULL | Vertragsnummer |
| `start_date` | DATE | NO | NULL | Vertragsbeginn |
| `end_date` | DATE | NO | NULL | Vertragsende |
| `monthly_rate_cents` | INTEGER | NO | NULL | Monatliche Rate in Cent |
| `currency` | TEXT | YES | 'EUR' | Währung |
| `down_payment_cents` | INTEGER | NO | NULL | Anzahlung in Cent |
| `residual_value_cents` | INTEGER | NO | NULL | Restwert in Cent |
| `total_km_limit` | INTEGER | NO | NULL | Gesamt-Kilometerlimit |
| `interest_rate_percent` | NUMERIC(5,2) | NO | NULL | Zinssatz % (nur bei Finanzierung) |
| `remaining_debt_cents` | INTEGER | NO | NULL | Restschuld in Cent |
| `status` | TEXT | YES | 'active' | Enum: active, completed, terminated |
| `notes` | TEXT | NO | NULL | — |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — |

**ENUM `car_finance_type`:** `owned`, `financed`, `leased`

**CONSTRAINT:** Ein Fahrzeug hat maximal EINE aktive Finanzierung. Check via Status.

---

### C3) `cars_insurances` — Versicherungen

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | YES | `gen_random_uuid()` | PK |
| `tenant_id` | UUID | YES | — | RLS-Scope |
| `vehicle_id` | UUID | YES | — | FK to cars_vehicles |
| `insurer_name` | TEXT | YES | — | Versicherer Name |
| `policy_number` | TEXT | YES | — | Versicherungsschein-Nummer |
| `coverage_type` | TEXT | YES | 'liability_only' | Enum: liability_only, liability_tk, liability_vk |
| `sf_liability` | INTEGER | YES | 0 | Schadenfreiheitsklasse KH (0-35) |
| `sf_full_casco` | INTEGER | NO | NULL | Schadenfreiheitsklasse VK (falls VK) |
| `deductible_partial_cents` | INTEGER | NO | NULL | Selbstbeteiligung TK in Cent |
| `deductible_full_cents` | INTEGER | NO | NULL | Selbstbeteiligung VK in Cent |
| `annual_premium_cents` | INTEGER | YES | — | Jahresbeitrag in Cent |
| `payment_frequency` | TEXT | YES | 'yearly' | Enum: monthly, quarterly, semi_annual, yearly |
| `currency` | TEXT | YES | 'EUR' | — |
| `term_start` | DATE | YES | — | Versicherungsbeginn |
| `term_end` | DATE | NO | NULL | Versicherungsende (falls befristet) |
| `renewal_date` | DATE | NO | NULL | Nächster Verlängerungstermin |
| `cancellation_deadline` | DATE | NO | NULL | Kündigungsfrist |
| `status` | TEXT | YES | 'active' | Enum: active, expired, cancelled, draft |
| `extras` | JSONB | NO | '{}' | Zusatzleistungen (Schutzbrief, Ausland, etc.) |
| `notes` | TEXT | NO | NULL | — |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — |

**ENUM `car_coverage_type`:** `liability_only`, `liability_tk`, `liability_vk`

**ENUM `car_insurance_status`:** `active`, `expired`, `cancelled`, `draft`

**ENUM `car_payment_frequency`:** `monthly`, `quarterly`, `semi_annual`, `yearly`

---

### C4) `cars_claims` — Schäden/Claims

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | YES | `gen_random_uuid()` | PK |
| `tenant_id` | UUID | YES | — | RLS-Scope |
| `vehicle_id` | UUID | YES | — | FK to cars_vehicles |
| `insurance_id` | UUID | NO | NULL | FK to cars_insurances (optional) |
| `public_id` | TEXT | YES | `'CLM-' || ...` | Human-readable ID |
| `damage_date` | DATE | YES | — | Schadendatum |
| `reported_at` | TIMESTAMPTZ | NO | NULL | Meldung an Versicherung |
| `damage_type` | TEXT | YES | 'accident' | Enum: accident, theft, glass, vandalism, storm, animal, fire, other |
| `fault_assessment` | TEXT | NO | NULL | Enum: own_fault, partial_fault, no_fault, unclear |
| `location_description` | TEXT | NO | NULL | Unfallort |
| `description` | TEXT | NO | NULL | Schadensbeschreibung |
| `police_reference` | TEXT | NO | NULL | Polizei-Aktenzeichen |
| `estimated_cost_cents` | INTEGER | NO | NULL | Geschätzte Kosten in Cent |
| `final_cost_cents` | INTEGER | NO | NULL | Finale Kosten in Cent |
| `insurer_reference` | TEXT | NO | NULL | Schadensnummer Versicherung |
| `currency` | TEXT | YES | 'EUR' | — |
| `status` | TEXT | YES | 'draft' | Enum: draft, open, awaiting_docs, submitted, in_review, approved, rejected, closed |
| `payout_cents` | INTEGER | NO | NULL | Auszahlung durch Versicherung |
| `payout_date` | DATE | NO | NULL | Auszahlungsdatum |
| `notes` | TEXT | NO | NULL | — |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — |

**ENUM `car_damage_type`:** `accident`, `theft`, `glass`, `vandalism`, `storm`, `animal`, `fire`, `other`

**ENUM `car_claim_status`:** `draft`, `open`, `awaiting_docs`, `submitted`, `in_review`, `approved`, `rejected`, `closed`

**ENUM `car_fault_assessment`:** `own_fault`, `partial_fault`, `no_fault`, `unclear`

---

### C5) `cars_logbook_connections` — Fahrtenbuch Provider

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | YES | `gen_random_uuid()` | PK |
| `tenant_id` | UUID | YES | — | RLS-Scope |
| `vehicle_id` | UUID | YES | — | FK to cars_vehicles (UNIQUE) |
| `provider` | TEXT | YES | 'none' | Enum: vimcar, carcloud, none |
| `status` | TEXT | YES | 'not_connected' | Enum: not_connected, pending, connected, error |
| `external_vehicle_ref` | TEXT | NO | NULL | Fahrzeug-ID beim Provider |
| `api_credentials_encrypted` | TEXT | NO | NULL | Verschlüsselte API-Keys |
| `last_sync_at` | TIMESTAMPTZ | NO | NULL | Letzte Synchronisation |
| `sync_error_message` | TEXT | NO | NULL | Letzter Fehler |
| `settings` | JSONB | NO | '{}' | Provider-spezifische Einstellungen |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — |

**ENUM `car_logbook_provider`:** `vimcar`, `carcloud`, `none`

**ENUM `car_logbook_status`:** `not_connected`, `pending`, `connected`, `error`

**UNIQUE CONSTRAINT:** `(vehicle_id)` — Ein Fahrzeug hat maximal EINE Provider-Connection

---

### C6) `cars_trips` — Fahrten (Optional, falls Provider-Sync)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | YES | `gen_random_uuid()` | PK |
| `tenant_id` | UUID | YES | — | RLS-Scope |
| `vehicle_id` | UUID | YES | — | FK to cars_vehicles |
| `connection_id` | UUID | NO | NULL | FK to cars_logbook_connections |
| `external_trip_id` | TEXT | NO | NULL | Trip-ID vom Provider |
| `start_at` | TIMESTAMPTZ | YES | — | Fahrtbeginn |
| `end_at` | TIMESTAMPTZ | NO | NULL | Fahrtende |
| `start_address` | TEXT | NO | NULL | Startadresse |
| `end_address` | TEXT | NO | NULL | Zieladresse |
| `distance_km` | NUMERIC(10,2) | YES | 0 | Gefahrene Kilometer |
| `classification` | TEXT | YES | 'unclassified' | Enum: business, private, commute, unclassified |
| `purpose` | TEXT | NO | NULL | Fahrzweck (Freitext) |
| `customer_name` | TEXT | NO | NULL | Kundenname (bei Geschäftsfahrt) |
| `source` | TEXT | YES | 'manual' | Enum: manual, sync |
| `source_payload` | JSONB | NO | NULL | Original-Daten vom Provider |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — |

**ENUM `car_trip_classification`:** `business`, `private`, `commute`, `unclassified`

---

### C7) `cars_offers` — Leasing- und Mietangebote

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | UUID | YES | `gen_random_uuid()` | PK |
| `tenant_id` | UUID | NO | NULL | NULL für globale Angebote |
| `offer_type` | TEXT | YES | 'leasing' | Enum: leasing, rental |
| `provider` | TEXT | YES | — | Enum: bmw_dealer, mercedes_dealer, vw_dealer, miete24, generic |
| `title` | TEXT | YES | — | Angebots-Titel |
| `description` | TEXT | NO | NULL | Beschreibung |
| `vehicle_make` | TEXT | NO | NULL | Hersteller |
| `vehicle_model` | TEXT | NO | NULL | Modell |
| `price_monthly_cents` | INTEGER | NO | NULL | Monatsrate (Leasing) |
| `price_daily_cents` | INTEGER | NO | NULL | Tagespreis (Miete) |
| `term_months` | INTEGER | NO | NULL | Laufzeit Monate |
| `km_per_year` | INTEGER | NO | NULL | Inkl. Kilometer/Jahr |
| `down_payment_cents` | INTEGER | NO | NULL | Anzahlung |
| `image_url` | TEXT | NO | NULL | Bild-URL |
| `link_url` | TEXT | YES | — | CTA-Link (Affiliate/Dealer-Page) |
| `valid_from` | DATE | NO | NULL | Gültig ab |
| `valid_until` | DATE | NO | NULL | Gültig bis |
| `is_featured` | BOOLEAN | YES | FALSE | Hervorgehoben |
| `active` | BOOLEAN | YES | TRUE | Sichtbar |
| `sort_order` | INTEGER | NO | 0 | Sortierung |
| `payload` | JSONB | NO | '{}' | Zusätzliche Daten |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — |

**ENUM `car_offer_type`:** `leasing`, `rental`

**ENUM `car_offer_provider`:** `bmw_dealer`, `mercedes_dealer`, `vw_dealer`, `audi_dealer`, `miete24`, `generic`

---

### Zusammenfassung Tabellen

| Tabelle | PK | Relationships | Purpose |
|---------|-----|---------------|---------|
| `cars_vehicles` | id | tenant_id → organizations | SSOT Fahrzeugstammdaten |
| `cars_financing` | id | vehicle_id → cars_vehicles | Finanzierung/Leasing pro Fahrzeug |
| `cars_insurances` | id | vehicle_id → cars_vehicles | Versicherungspolicen |
| `cars_claims` | id | vehicle_id, insurance_id | Schadensfälle |
| `cars_logbook_connections` | id | vehicle_id → cars_vehicles | Provider-Anbindung |
| `cars_trips` | id | vehicle_id, connection_id | Fahrten (Sync oder manuell) |
| `cars_offers` | id | tenant_id (optional) | Leasing- & Mietangebote |

---

## 4) DMS TREE + LINK POLICY + UI SCOPING PLAN

### D1) Root Tree im DMS für Car-Management

Neuer System-Root im DMS (via Seeding):

```
/Car-Management/                          ← node_type: folder, auto_created: true
├── Fahrzeuge/                            ← node_type: folder
│   └── {license_plate}-{vehicleId}/     ← Template: VEHICLE_DOSSIER_V1
├── Versicherungen/                       ← (Optional, oder inline unter Fahrzeug)
├── Schäden/                              ← (Optional, oder inline unter Fahrzeug)
└── Exporte/                              ← Sammlung für alle Fahrtenbuch-Exports
```

### D2) Subtree pro Fahrzeug (Template: VEHICLE_DOSSIER_V1)

Beim Anlegen eines Fahrzeugs wird automatisch folgender Subtree erstellt:

```
/Car-Management/Fahrzeuge/{license_plate}-{id}/
├── 01_Fahrzeugschein/                    ← doc_type_hint: fahrzeugschein
├── 02_Finanzierung_Leasing/              ← doc_type_hint: leasing_contract, financing_contract
├── 03_Versicherung/                      ← doc_type_hint: insurance_policy, insurance_invoice
│   └── {insuranceId}/                    ← Ordner pro Police (bei mehreren historischen)
├── 04_Schaeden/                          ← doc_type_hint: claim_photo, claim_report, damage_assessment
│   └── {claimId}/                        ← Ordner pro Schadenfall
├── 05_Service_Rechnungen/                ← doc_type_hint: service_invoice, repair_invoice
├── 06_Fahrtenbuch_Exports/               ← doc_type_hint: logbook_export
└── 99_Sonstiges/                         ← doc_type_hint: other
```

### D3) Document Links Policy

Neue `object_type` Werte in `document_links`:

| object_type | object_id | node_id Ziel | Beispiel |
|-------------|-----------|--------------|----------|
| `vehicle` | cars_vehicles.id | Fahrzeug-Subtree Root | Fahrzeugschein |
| `vehicle_financing` | cars_financing.id | 02_Finanzierung_Leasing/ | Leasingvertrag |
| `car_insurance` | cars_insurances.id | 03_Versicherung/{insuranceId}/ | Versicherungspolice |
| `car_claim` | cars_claims.id | 04_Schaeden/{claimId}/ | Schadenfotos |
| `car_service` | (frei, optional) | 05_Service_Rechnungen/ | Werkstattrechnung |
| `car_logbook` | cars_vehicles.id | 06_Fahrtenbuch_Exports/ | PDF/CSV Export |

### doc_type_hint Vorschläge (Plan)

| doc_type_hint | Beschreibung | Ziel-Ordner |
|---------------|--------------|-------------|
| `fahrzeugschein` | Zulassungsbescheinigung Teil I | 01_Fahrzeugschein |
| `fahrzeugbrief` | Zulassungsbescheinigung Teil II | 01_Fahrzeugschein |
| `leasing_contract` | Leasingvertrag | 02_Finanzierung_Leasing |
| `financing_contract` | Finanzierungsvertrag | 02_Finanzierung_Leasing |
| `insurance_policy` | Versicherungspolice | 03_Versicherung |
| `insurance_invoice` | Versicherungsrechnung | 03_Versicherung |
| `insurance_evb` | eVB-Nummer Nachweis | 03_Versicherung |
| `claim_photo` | Schadenfoto | 04_Schaeden/{claimId} |
| `claim_report` | Schadenbericht | 04_Schaeden/{claimId} |
| `damage_assessment` | Gutachten | 04_Schaeden/{claimId} |
| `service_invoice` | Service-Rechnung | 05_Service_Rechnungen |
| `repair_invoice` | Reparaturrechnung | 05_Service_Rechnungen |
| `hu_report` | HU-Bericht | 05_Service_Rechnungen |
| `logbook_export` | Fahrtenbuch-Export | 06_Fahrtenbuch_Exports |

### D4) UI Scoping Plan (Dokumente-Tab)

| Akte | Scope | Filter | Notes |
|------|-------|--------|-------|
| **Fahrzeugakte** | Gesamter Fahrzeug-Subtree | `node_id IN (vehicle subtree)` | Alle Dokumente des Fahrzeugs |
| **Versicherungsakte** | 03_Versicherung/{insuranceId}/ | `object_type = 'car_insurance' AND object_id = :insuranceId` | Nur Police-Dokumente |
| **Schadenfall-Akte** | 04_Schaeden/{claimId}/ | `object_type = 'car_claim' AND object_id = :claimId` | Nur Schadendokumente |
| **Fahrtenbuch** | 06_Fahrtenbuch_Exports/ | `doc_type_hint = 'logbook_export' AND vehicle_id = :vehicleId` | Nur Exports |

**Begründung für Entscheidung "Versicherung unter Fahrzeug":**  
Versicherungen sind IMMER an ein spezifisches Fahrzeug gebunden (Kfz-Haftpflicht ist fahrzeugbezogen, nicht personenbezogen). Daher ist die Ablage unter dem Fahrzeug-Subtree die logisch korrekte Wahl. Eine separate /Versicherungen/-Root wäre nur sinnvoll bei Rahmenverträgen für Flotten — dieses Feature ist NICHT im Scope von MOD-17.

---

## 5) HECTOR INTEGRATION (ZONE 1 API-KATALOG)

### E1) Zone-1 API-Katalog Eintrag

```yaml
# Eintrag in docs/architecture/API_NUMBERING_CATALOG.md

## API-1700..1799 — MOD-17 Car-Management (NEU)

| Range | Bereich | Status |
|-------|---------|--------|
| API-1700..1799 | MOD-17 Car-Management | PLANNED |

### Interne Edge Functions (PLANNED)

| API-ID | Edge Function | Modul | Bereich | Status |
|--------|---------------|-------|---------|--------|
| API-1700 | sot-car-vehicle-crud | MOD-17 | Fahrzeug CRUD | PLANNED |
| API-1701 | sot-car-insurance-crud | MOD-17 | Versicherung CRUD | PLANNED |
| API-1702 | sot-car-claim-crud | MOD-17 | Schaden CRUD | PLANNED |
| API-1710 | sot-car-logbook-sync | MOD-17 | Fahrtenbuch Sync | PLANNED |
| API-1711 | sot-car-logbook-export | MOD-17 | Fahrtenbuch Export | PLANNED |

### Externe Integrationen (PLANNED)

| Provider | Capabilities | Status | Auth Mode | Notes |
|----------|--------------|--------|-----------|-------|
| hector_kfz | quote_compare, policy_extraction | PLANNED | api_key | Versicherungsvergleich |
| vimcar | trip_sync, vehicle_status | PLANNED | oauth2 | Fahrtenbuch-Provider |
| miete24 | affiliate_link | PLANNED | affiliate_id | Mietangebote |
```

### E2) Hector Provider Integration Contract (Plan)

```json
{
  "provider_key": "hector_kfz",
  "provider_name": "Hector",
  "zone": 1,
  "auth_mode": "api_key_header",
  "sandbox_available": "unknown",
  "capabilities": [
    {
      "name": "quote_compare",
      "description": "Kfz-Versicherungsvergleich basierend auf Fahrzeug- und Versicherungsdaten",
      "endpoint_pattern": "POST /api/car/insurance/quotes",
      "status": "planned"
    },
    {
      "name": "policy_extraction",
      "description": "Extraktion von Policendaten aus hochgeladenen PDFs",
      "endpoint_pattern": "POST /api/car/insurance/extract",
      "status": "planned"
    }
  ],
  "status": "planned",
  "notes": "Benötigt Partnerzugang und API-Dokumentation von Hector"
}
```

### E3) Provider-agnostische Contract-Skizze

#### Quote Compare Request/Response

```typescript
// POST /api/car/insurance/quotes

interface CarInsuranceQuoteRequest {
  vehicle: {
    hsn: string;              // REQUIRED für Vergleich
    tsn: string;              // REQUIRED für Vergleich
    first_registration: string; // ISO Date
    annual_mileage_km: number;
    current_mileage_km?: number;
    garage_type?: 'street' | 'carport' | 'garage';
  };
  current_policy?: {
    insurer_name: string;
    sf_liability: number;
    sf_full_casco?: number;
    coverage_type: 'liability_only' | 'liability_tk' | 'liability_vk';
    annual_premium_cents: number;
    term_end: string;         // ISO Date
  };
  driver: {
    birth_date: string;       // ISO Date
    license_date?: string;    // Führerschein seit
    postal_code: string;
  };
  preferences: {
    coverage_type: 'liability_only' | 'liability_tk' | 'liability_vk';
    deductible_partial_max?: number;
    deductible_full_max?: number;
    include_extras?: string[]; // ['schutzbrief', 'ausland', 'rabattschutz']
  };
}

interface CarInsuranceQuoteResponse {
  request_id: string;
  generated_at: string;       // ISO Timestamp
  offers: Array<{
    provider_name: string;
    product_name: string;
    coverage_type: string;
    annual_premium_cents: number;
    monthly_premium_cents: number;
    sf_liability: number;
    sf_full_casco?: number;
    deductible_partial_cents?: number;
    deductible_full_cents?: number;
    extras_included: string[];
    rating_stars?: number;    // 1-5
    link_url: string;         // CTA zum Abschluss
  }>;
  metadata: {
    comparison_count: number;
    cheapest_provider: string;
    savings_vs_current_cents?: number;
  };
}
```

#### Error Model

```typescript
interface HectorApiError {
  error_code: string;         // z.B. 'INVALID_HSN', 'RATE_LIMIT_EXCEEDED'
  message: string;
  details?: Record<string, unknown>;
  retry_after_seconds?: number;
}
```

### E4) Offene Punkte Hector

| Punkt | Status | Aktion erforderlich |
|-------|--------|---------------------|
| API-Dokumentation | UNBEKANNT | Hector kontaktieren für Partnerzugang |
| Sandbox/Testumgebung | UNBEKANNT | Abfragen bei Onboarding |
| Auth-Methode | Vermutet: API-Key Header | Bestätigen |
| Rate Limits | UNBEKANNT | Dokumentation anfordern |
| Webhook für Status-Updates | UNBEKANNT | Prüfen ob verfügbar |
| HSN/TSN Pflicht | Vermutet: JA | Bestätigen für Quote-Anfragen |
| Preismodell | UNBEKANNT | Klären (Pay-per-Quote? Monthly?) |

---

## 6) UX/IA PLAN

### F1) Fahrzeuge (Tile 1)

#### Liste (Tabelle)

| Spalte | Feld | Sortierbar | Filter |
|--------|------|------------|--------|
| Kennzeichen | license_plate | ✅ | ✅ |
| Fahrzeug | `{make} {model}` | ✅ | ✅ (make) |
| Halter | holder_name | ✅ | ❌ |
| KM-Stand | current_mileage_km | ✅ | ❌ |
| HU bis | hu_valid_until | ✅ | ✅ (bald fällig) |
| Status | status | ✅ | ✅ |
| Aktionen | — | ❌ | ❌ |

**CTA:** "Fahrzeug hinzufügen" → Create Wizard

#### Create Wizard (2 Steps)

**Step 1: Grunddaten**
- Kennzeichen (REQUIRED)
- HSN / TSN (optional, aber empfohlen für Versicherung)
- Erstzulassung (optional)

**Step 2: Details (optional)**
- Halter Name
- Aktueller KM-Stand
- HU gültig bis
- Fahrzeugschein Upload-Slot (optional) → AI-Extraktion befüllt Felder

**Empty State:**
```
🚗 Noch keine Fahrzeuge

Fügen Sie Ihr erstes Fahrzeug hinzu, um den Fuhrpark zu verwalten.
Optional können Sie den Fahrzeugschein hochladen — die Daten werden automatisch ausgelesen.

[+ Fahrzeug hinzufügen]        [Wie funktioniert's?]
```

#### Fahrzeugakte (Detail-View) — Tabs

| Tab | Inhalt | Felder/Komponenten |
|-----|--------|-------------------|
| **Akte** | Stammdaten | Alle Felder aus cars_vehicles, Finanzierung aus cars_financing |
| **Versicherungen** | Liste der Policen | Tabelle aus cars_insurances, CTA "Neue Police" |
| **Schäden** | Liste der Schadensfälle | Tabelle aus cars_claims, CTA "Schaden melden" |
| **Fahrtenbuch** | Provider-Status + Trips | Connection-Panel + Trips-Tabelle |
| **Dokumente** | DMS-Scope | Dateibrowser für Fahrzeug-Subtree |

**Akte-Tab Feldgruppen:**

```
┌─────────────────────────────────────────────────────────────┐
│ FAHRZEUG                                                     │
│ Kennzeichen: B-XY 1234         VIN: WVWZZZ3CZWE123456       │
│ Hersteller: Volkswagen         Modell: Golf                 │
│ Variante: GTI                  Erstzulassung: 01.03.2022    │
│ Leistung: 180 kW               Hubraum: 1.984 ccm           │
│ Kraftstoff: Benzin             CO2: 168 g/km                │
│ Leergewicht: 1.495 kg          Sitze: 5                     │
├─────────────────────────────────────────────────────────────┤
│ KM-STAND & PRÜFUNGEN                                        │
│ Aktueller KM: 45.230           Stand vom: 15.01.2026        │
│ Jährliche Fahrleistung: 15.000 km                           │
│ HU gültig bis: 03/2027         AU gültig bis: 03/2027       │
├─────────────────────────────────────────────────────────────┤
│ HALTER & FAHRER                                             │
│ Halter: Max Mustermann                                      │
│ Adresse: Musterstraße 1, 12345 Berlin                       │
│ Hauptfahrer: Max Mustermann    Geb.: 15.05.1985             │
├─────────────────────────────────────────────────────────────┤
│ FINANZIERUNG / LEASING                                      │
│ Typ: Leasing                   Leasinggeber: BMW Bank       │
│ Vertragsnummer: LS-123456      Laufzeit: 01.2024 – 12.2026  │
│ Monatsrate: 450,00 €           Restwert: 18.500,00 €        │
│ KM-Limit: 45.000 km                                         │
├─────────────────────────────────────────────────────────────┤
│ STATUS & NOTIZEN                                            │
│ Status: Aktiv                                               │
│ Notizen: Winterreifen im Lager                              │
└─────────────────────────────────────────────────────────────┘
```

---

### F2) Versicherungen (Tile 2)

#### Liste (Tabelle)

| Spalte | Feld | Sortierbar |
|--------|------|------------|
| Fahrzeug | `{license_plate} ({make} {model})` | ✅ |
| Versicherer | insurer_name | ✅ |
| Nummer | policy_number | ❌ |
| Deckung | coverage_type (Badge) | ✅ |
| SF-KH | sf_liability | ✅ |
| SB-TK/VK | deductible_partial_cents / deductible_full_cents | ❌ |
| Jahresbeitrag | annual_premium_cents | ✅ |
| Status | status (Badge) | ✅ |
| Aktionen | — | ❌ |

**CTA:** "Neue Police erfassen" → Modal/Wizard

#### Versicherungsakte (Detail-View) — Tabs

| Tab | Inhalt |
|-----|--------|
| **Übersicht** | Stammdaten der Police |
| **Deckung & SF** | SF-Klassen, Selbstbeteiligungen, Extras |
| **Schäden** | Gefilterte Liste: nur Schäden dieser Police |
| **Dokumente** | DMS-Scope: 03_Versicherung/{insuranceId}/ |
| **Vergleich** | Hector-Integration: Quote Compare starten |

**Vergleich-Tab:**
```
┌─────────────────────────────────────────────────────────────┐
│ VERSICHERUNGSVERGLEICH                                      │
│                                                             │
│ Aktuelle Police: Allianz | 780 €/Jahr | SF-Klasse 5        │
│                                                             │
│ [Vergleich starten]                                         │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ Voraussetzungen für Vergleich:                              │
│ ✅ Kennzeichen vorhanden                                     │
│ ✅ HSN/TSN vorhanden                                         │
│ ✅ SF-Klasse bekannt                                         │
│ ⚠️ Geburtsdatum Hauptfahrer fehlt                           │
│                                                             │
│ [Daten ergänzen]                                            │
└─────────────────────────────────────────────────────────────┘
```

**Nach Vergleich:**
```
┌─────────────────────────────────────────────────────────────┐
│ VERGLEICHSERGEBNIS                                          │
│ Generiert am: 06.02.2026 14:32                              │
│                                                             │
│ ┌─────────────┬────────────┬────────────┬────────────┐     │
│ │ Anbieter    │ Typ        │ Jahresbetrag │ Ersparnis │     │
│ ├─────────────┼────────────┼────────────┼────────────┤     │
│ │ HUK24       │ VK         │ 620 €        │ -160 €    │     │
│ │ CosmosDirekt│ VK         │ 655 €        │ -125 €    │     │
│ │ DEVK        │ VK         │ 690 €        │ -90 €     │     │
│ └─────────────┴────────────┴────────────┴────────────┘     │
│                                                             │
│ [Zum Anbieter →]     [Neuer Vergleich]                      │
└─────────────────────────────────────────────────────────────┘
```

#### Schadenfall-Akte (Sub-Detail) — Tabs

| Tab | Inhalt |
|-----|--------|
| **Übersicht** | Schadendaten, Status, Kosten |
| **Dokumente** | DMS-Scope: 04_Schaeden/{claimId}/ |
| **Verlauf** | Status-Timeline + Notizen |

**Status-Stepper:**
```
[Entwurf] → [Offen] → [Warte auf Docs] → [Eingereicht] → [In Prüfung] → [Entschieden]
                                                                              │
                                                                    [Genehmigt] / [Abgelehnt]
```

---

### F3) Fahrtenbuch (Tile 3)

#### Struktur

```
┌─────────────────────────────────────────────────────────────┐
│ FAHRTENBUCH                                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fahrzeug wählen: [ B-XY 1234 (Golf GTI) ▼ ]             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PROVIDER-VERBINDUNG                           [Vimcar]  │ │
│ │ Status: ✅ Verbunden                                     │ │
│ │ Letzte Sync: vor 2 Stunden                              │ │
│ │ [Jetzt synchronisieren]    [Verbindung trennen]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FAHRTEN (Januar 2026)                    [Export ▼]     │ │
│ │ ┌────────┬────────┬──────────┬─────────┬─────────────┐ │ │
│ │ │ Datum  │ Strecke│ Kategorie│ KM      │ Zweck       │ │ │
│ │ ├────────┼────────┼──────────┼─────────┼─────────────┤ │ │
│ │ │ 05.01. │ Berlin→│ Geschäft │ 45 km   │ Kundentermin│ │ │
│ │ │ 05.01. │ Hambur.│          │         │             │ │ │
│ │ └────────┴────────┴──────────┴─────────┴─────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Export-Optionen:**
- PDF (für Finanzamt)
- CSV (für Excel)
- → Export landet in DMS: /06_Fahrtenbuch_Exports/

**Empty State (kein Provider verbunden):**
```
📓 Kein Fahrtenbuch verbunden

Verbinden Sie einen Fahrtenbuch-Provider (z.B. Vimcar), um Ihre Fahrten 
automatisch zu erfassen und für das Finanzamt zu dokumentieren.

[Vimcar verbinden]     [Anderer Provider]     [Manuell erfassen]
```

---

### F4) Angebote (Tile 4)

#### Struktur mit Sub-Tabs

```
┌─────────────────────────────────────────────────────────────┐
│ ANGEBOTE                                                    │
│                                                             │
│ [Leasing-Deals]     [Automiete]                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ LEASING-DEALS                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚗 BMW 320i                                              │ │
│ │ 36 Monate | 10.000 km/Jahr | 0 € Anzahlung              │ │
│ │ ab 449 €/Monat                                          │ │
│ │ [Zum Angebot →]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚗 Mercedes C-Klasse                                     │ │
│ │ 48 Monate | 15.000 km/Jahr | 3.000 € Anzahlung          │ │
│ │ ab 529 €/Monat                                          │ │
│ │ [Zum Angebot →]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ AUTOMIETE (Miete24)                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚐 Transporter für Umzüge                                │ │
│ │ ab 49 €/Tag                                             │ │
│ │ [Bei Miete24 ansehen →]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Hinweis:** Angebote werden über `cars_offers` verwaltet (Curated Content). Miete24-Links sind Affiliate-Links.

---

## 7) ACCEPTANCE TESTS

### Routing & Navigation

| Test | Erwartung | Priorität |
|------|-----------|-----------|
| `/portal/cars` zeigt How It Works | ModuleHowItWorks mit korrektem Content | P0 |
| Klick auf "Fahrzeuge" → `/portal/cars/fahrzeuge` | Fahrzeugliste wird geladen | P0 |
| Klick auf Fahrzeug → `/portal/cars/:id` | Fahrzeugakte mit Tabs | P0 |
| Navigation zwischen Tiles ohne Reload | SPA-Routing funktioniert | P0 |
| Breadcrumb zeigt korrekten Pfad | Car-Management > Fahrzeuge > [Kennzeichen] | P1 |

### Datenfelder immer sichtbar

| Test | Erwartung | Priorität |
|------|-----------|-----------|
| Fahrzeugakte ohne Finanzierung | Finanzierungs-Block zeigt "Keine Finanzierung/Leasing hinterlegt" | P0 |
| Fahrzeugakte ohne HSN/TSN | Felder zeigen "—" statt leer | P0 |
| Versicherungsvergleich ohne HSN | Hinweis "HSN/TSN erforderlich für Vergleich" | P0 |
| Leere Schadensliste | Empty State mit CTA "Schaden melden" | P1 |

### DMS Tree Scoping

| Test | Erwartung | Priorität |
|------|-----------|-----------|
| Neues Fahrzeug anlegen | Subtree mit 7 Ordnern wird erstellt | P0 |
| Upload in Fahrzeugakte | Dokument landet in korrektem Ordner | P0 |
| Versicherungsakte → Dokumente-Tab | Zeigt nur Dokumente aus 03_Versicherung/ | P0 |
| Schadenfall → Dokumente-Tab | Zeigt nur Dokumente aus 04_Schaeden/{claimId}/ | P0 |

### Document Links

| Test | Erwartung | Priorität |
|------|-----------|-----------|
| Fahrzeugschein-Upload | document_link mit object_type='vehicle' | P0 |
| Police-Upload | document_link mit object_type='car_insurance' | P0 |
| Schadenfoto-Upload | document_link mit object_type='car_claim' | P0 |
| Fahrtenbuch-Export | document_link mit doc_type_hint='logbook_export' | P1 |

### Hector Integration (Plan)

| Test | Erwartung | Priorität |
|------|-----------|-----------|
| Zone-1 API-Katalog enthält Hector-Eintrag | provider_key: hector_kfz, status: planned | P0 |
| Quote-Request Interface definiert | Request/Response Typen vorhanden | P0 |
| Vergleich-Tab zeigt Voraussetzungen | Checklist für HSN/TSN/Fahrerdaten | P1 |

### Fahrtenbuch

| Test | Erwartung | Priorität |
|------|-----------|-----------|
| Export-Button → PDF generiert | PDF wird erstellt | P1 |
| Export landet in DMS | Ablage in 06_Fahrtenbuch_Exports/ | P1 |
| Provider-Connection-Panel | Status + Sync-Button sichtbar | P1 |

### Angebote

| Test | Erwartung | Priorität |
|------|-----------|-----------|
| Leasing-Deals und Miete24 getrennt | Zwei Sub-Tabs oder Sections | P0 |
| Angebots-CTA führt zu externem Link | `link_url` öffnet neuen Tab | P0 |
| Curated Offers aus cars_offers | Angebote werden aus DB geladen | P1 |

---

## 8) LOGISCHE PRÜFUNG & VERBESSERUNGSVORSCHLÄGE

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| 1 | **HSN/TSN nicht Pflicht** bei Fahrzeuganlage | Versicherungsvergleich nicht möglich ohne HSN/TSN | HSN/TSN als "empfohlen" markieren, Warnung wenn leer und Vergleich gestartet wird |
| 2 | **Historische Versicherungen** nicht abgebildet | Bei Fahrzeugwechsel der Police fehlt History | Feld `replaced_by_id` oder `is_current` Flag hinzufügen |
| 3 | **Rahmenverträge** nicht modelliert | Flotten mit übergreifenden Verträgen nicht abbildbar | Out-of-Scope für V1, aber als Erweiterung dokumentieren |
| 4 | **Fahrerdaten** nur als String | Keine Verknüpfung zu Kontakten (gewollt), aber Geburtsdatum als einzelnes Feld problematisch | Akzeptabel für V1, da Kontakt-First explizit ausgeschlossen |
| 5 | **Keine Werkstatt-Termine** als eigene Entity | Service-Rechnungen als Dokumente, aber keine Terminplanung | V2: `cars_service_appointments` Tabelle hinzufügen |
| 6 | **TÜV-Erinnerung** nicht automatisiert | Nur manuelle Prüfung von `hu_valid_until` | V2: Scheduled Job für Erinnerungs-Emails |
| 7 | **Doppelte Fahrzeuge** möglich bei Tippfehler | UNIQUE auf license_plate verhindert exakte Duplikate, aber nicht Varianten | UI-Warnung bei ähnlichen Kennzeichen |
| 8 | **Logbook-Export Format** nicht spezifiziert | PDF/CSV ohne konkrete Templates | Template-Definition in V2 (Finanzamt-konform) |
| 9 | **Miete24-Affiliate** ohne Tracking | Keine Attribution der Conversions | Affiliate-Parameter (`?ref=sot`) in `link_url` |
| 10 | **Hector-Sandbox** nicht verfügbar | Entwicklung ohne echte API-Tests | Mock-Service für Development erstellen |

---

## ZUSAMMENFASSUNG

### Was wird erstellt (Plan)

| Komponente | Typ | Priorität |
|------------|-----|-----------|
| 7 Datenbank-Tabellen | DB | P0 |
| 4 Tiles (Fahrzeuge, Versicherungen, Fahrtenbuch, Angebote) | UI | P0 |
| 3 Detail-Akten (Fahrzeug, Versicherung, Schaden) | UI | P0 |
| DMS-Subtree Template VEHICLE_DOSSIER_V1 | DMS | P0 |
| Document Links Policy für car_* object_types | DMS | P0 |
| Hector Zone-1 API-Katalog Eintrag | API | P0 |
| Hector Contract-Skizze | API | P1 |
| moduleContents.ts Update | UI | P0 |
| routesManifest.ts Update | Routing | P0 |

### Was NICHT implementiert wird

- Cross-Module-Abhängigkeiten (keine FKs zu contacts, properties)
- Echte Hector-API-Calls (nur Plan + Mock)
- Echte Vimcar-Integration (nur UI-Slots)
- Miete24-API (nur Affiliate-Links)
- Rahmenverträge für Flotten
- Automatische TÜV-Erinnerungen

---

**ENDE DES PLANUNGSDOKUMENTS — KEINE IMPLEMENTIERUNG**

