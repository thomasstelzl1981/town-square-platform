
# Demo-Finanzierungsakte: CSV-basiertes Seeding (ID-sicher)

## ID-Struktur und Konventionen

Alle IDs folgen dem bestehenden Demo-Range-Pattern `d0000000-0000-4000-a000-*` mit einem neuen Nummernblock `07xx` fuer MOD-07/MOD-11 Finanzierungsdaten:

```text
finance_requests:
  d0000000-0000-4000-a000-000000000701  (FIN-2025-001, Kauf Berlin)
  d0000000-0000-4000-a000-000000000702  (FIN-2025-002, Umschuldung)

applicant_profiles:
  d0000000-0000-4000-a000-000000000711  (Max Mustermann, primary, Fall 001)
  d0000000-0000-4000-a000-000000000712  (Lisa Mustermann, co-applicant, Fall 001)
  d0000000-0000-4000-a000-000000000713  (Thomas Schmidt, primary, Fall 002)

finance_mandates:
  d0000000-0000-4000-a000-000000000721  (Mandat fuer Fall 001)
  d0000000-0000-4000-a000-000000000722  (Mandat fuer Fall 002)
```

Die Property-Referenz in Fall 001 nutzt die bestehende Demo-Property BER-01: `d0000000-0000-4000-a000-000000000001`.

## FK-Cascade-Analyse (geprueft)

```text
finance_requests (Parent)
  ├── applicant_profiles   (ON DELETE CASCADE)
  ├── finance_mandates     (ON DELETE CASCADE)
  ├── finance_submission_logs (ON DELETE CASCADE)
  └── document_reminders   (ON DELETE CASCADE)
```

Beim Cleanup reicht es, `finance_requests` zu loeschen -- alle Kinder werden automatisch von der DB entfernt. Trotzdem registrieren wir alle Entity-Types einzeln im `test_data_registry` fuer die SSOT-Diagnose.

## Neue CSV-Dateien

### 1. `public/demo-data/demo_finance_requests.csv`

Spalten (exakt nach DB-Schema `finance_requests`):
```
id;status;purpose;object_source;property_id;purchase_price;equity_amount;loan_amount_requested;
fixed_rate_period_years;repayment_rate_percent;max_monthly_rate;source;
object_address;object_type;object_construction_year;object_living_area_sqm;
contact_first_name;contact_last_name;contact_email;contact_phone
```

- `tenant_id` und `created_by` werden zur Laufzeit vom Seed-Engine injiziert (wie bei allen anderen CSVs)
- `public_id` wird NICHT im CSV gesetzt (nullable, kein Trigger)
- 2 Zeilen: Fall 001 (status=ready_for_submission) und Fall 002 (status=draft)

### 2. `public/demo-data/demo_applicant_profiles.csv`

Spalten (exakt nach DB-Schema `applicant_profiles`):
```
id;finance_request_id;party_role;profile_type;first_name;last_name;birth_date;
nationality;marital_status;address_street;address_postal_code;address_city;
phone;email;employment_type;employer_name;net_income_monthly;
current_rent_monthly;living_expenses_monthly;bank_savings;iban
```

- `tenant_id` wird zur Laufzeit injiziert
- 3 Zeilen: Max (primary, privat), Lisa (co_applicant, privat), Thomas (primary, privat)
- Alle numerischen Spalten sind in `NUMERIC_KEYS` im Seed-Engine registriert (muss erweitert werden)

### 3. `public/demo-data/demo_finance_mandates.csv`

Spalten (exakt nach DB-Schema `finance_mandates`):
```
id;finance_request_id;status;source
```

- `tenant_id` und `assigned_manager_id` werden zur Laufzeit injiziert
- 2 Zeilen: Mandat fuer Fall 001 (status=open) und Fall 002 (status=new)

## Aenderungen an bestehenden Dateien

### `src/hooks/useDemoSeedEngine.ts`

1. **NUMERIC_KEYS erweitern** um fehlende Spalten aus `applicant_profiles`:
   - `net_income_monthly`, `bonus_yearly`, `current_rent_monthly`, `living_expenses_monthly`, `car_leasing_monthly`, `health_insurance_monthly`, `other_fixed_costs_monthly`, `bank_savings`, `securities_value`, `building_society_value`, `adults_count`, `children_count`, `child_support_amount_monthly`, `child_benefit_monthly`, `other_regular_income_monthly`, `company_employees`, `company_ownership_percent`, `modernization_costs`, `notary_costs`, `transfer_tax`, `broker_fee`, `fixed_rate_period_years`, `max_monthly_rate`, `object_construction_year`, `object_living_area_sqm`, `object_land_area_sqm`

2. **Neue Phase 4.5** im Seed-Orchestrator (zwischen Household/Finance und Miety):
   ```
   // Phase 4.5: Finance Requests (MOD-07/MOD-11)
   await seed('finance_requests', () => seedFromCSV(..., { created_by: userId }));
   await seed('applicant_profiles', () => seedFromCSV(...));
   await seed('finance_mandates', () => seedFromCSV(..., { assigned_manager_id: userId }));
   ```

3. **EXPECTED-Map erweitern**:
   - `finance_requests: 2`
   - `applicant_profiles: 3`
   - `finance_mandates: 2`

### `src/hooks/useDemoCleanup.ts`

`CLEANUP_ORDER` erweitern -- dank CASCADE reicht ein Eintrag, aber fuer saubere Registry-Aufloesung alle drei:
```
'finance_submission_logs',  // FK → finance_requests (CASCADE)
'finance_mandates',         // FK → finance_requests (CASCADE)
'applicant_profiles',       // FK → finance_requests (CASCADE)
'finance_requests',         // Parent
```

Position: VOR `acq_offers` (keine FK-Konflikte zu anderen Demo-Entities).

### `src/config/demoDataRegistry.ts`

3 neue Eintraege:
```typescript
{
  path: 'public/demo-data/demo_finance_requests.csv',
  module: 'MOD-07',
  type: 'hardcoded',
  entities: ['finance_requests'],
  exports: ['CSV'],
},
{
  path: 'public/demo-data/demo_applicant_profiles.csv',
  module: 'MOD-07',
  type: 'hardcoded',
  entities: ['applicant_profiles'],
  exports: ['CSV'],
},
{
  path: 'public/demo-data/demo_finance_mandates.csv',
  module: 'MOD-11',
  type: 'hardcoded',
  entities: ['finance_mandates'],
  exports: ['CSV'],
},
```

### `public/demo-data/demo_manifest.json`

3 neue Entity-Eintraege:
```json
"finance_requests": { "file": "demo_finance_requests.csv", "expectedCount": 2, "dbTable": "finance_requests" },
"applicant_profiles": { "file": "demo_applicant_profiles.csv", "expectedCount": 3, "dbTable": "applicant_profiles" },
"finance_mandates": { "file": "demo_finance_mandates.csv", "expectedCount": 2, "dbTable": "finance_mandates" }
```

### `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx`

E-Mail-Versand-Fix: `handleSendEmail` prueft zuerst `mail_accounts` des Users und sendet ueber `sot-mail-send` (User-Account) statt `sot-system-mail-send`.

## Keine hartcodierten Daten

- Alle 3 CSVs nutzen ausschliesslich IDs im `d0000000-*` Range
- Kein einziger `const MOCK_*` oder inline-Array im Code
- Alle Werte kommen aus CSV, `tenant_id`/`created_by`/`assigned_manager_id` werden dynamisch injiziert
- Alle Entity-Types werden in `test_data_registry` registriert
- Cleanup nutzt bestehende CASCADE-Constraints der DB

## Dateien-Uebersicht

| Datei | Aktion |
|-------|--------|
| `public/demo-data/demo_finance_requests.csv` | NEU |
| `public/demo-data/demo_applicant_profiles.csv` | NEU |
| `public/demo-data/demo_finance_mandates.csv` | NEU |
| `public/demo-data/demo_manifest.json` | 3 neue Entities |
| `src/hooks/useDemoSeedEngine.ts` | Phase 4.5 + NUMERIC_KEYS + EXPECTED |
| `src/hooks/useDemoCleanup.ts` | 4 neue Eintraege in CLEANUP_ORDER |
| `src/config/demoDataRegistry.ts` | 3 neue Eintraege |
| `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx` | E-Mail ueber User-Account |
