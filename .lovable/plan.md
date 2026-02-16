
# Selbstauskunft befuellen + Demo-Daten-Lueckenanalyse

## 1. Selbstauskunft fuer Max Mustermann befuellen (SQL-Migration)

Die bestehende persistente `applicant_profiles`-Zeile (`a23366ab-e769-46b0-8d44-f8117f901c15`, `finance_request_id = NULL`, `party_role = 'primary'`) ist komplett leer. Sie wird per SQL-UPDATE mit Max Mustermanns Daten befuellt:

### Feldwerte fuer Max Mustermann (Sektion 1-7)

| Sektion | Feld | Wert |
|---|---|---|
| **1. Person** | salutation | Herr |
| | first_name | Max |
| | last_name | Mustermann |
| | birth_date | 1982-03-15 |
| | birth_place | Muenchen |
| | birth_country | DE |
| | nationality | DE |
| | address_street | Leopoldstrasse 42 |
| | address_postal_code | 80802 |
| | address_city | Muenchen |
| | address_since | 2015-06-01 |
| | phone | +49 89 12345678 |
| | phone_mobile | +49 170 1234567 |
| | email | max@mustermann-demo.de |
| | tax_id | 12 345 678 901 |
| **2. Haushalt** | marital_status | verheiratet |
| | property_separation | false |
| | adults_count | 2 |
| | children_count | 2 |
| | children_birth_dates | 2014-09-03, 2017-11-28 |
| **3. Beruf** | employment_type | selbstaendig |
| | company_name | IT-Beratung Mustermann |
| | company_legal_form | Einzelunternehmen |
| | company_founded | 2010-01-01 |
| | company_industry | IT / Software-Beratung |
| | company_managing_director | true |
| | company_ownership_percent | 100 |
| | vehicles_count | 2 |
| **4. Bank** | iban | DE89 3704 0044 0532 0130 00 |
| | bic | COBADEFFXXX |
| **5. Einkommen** | self_employed_income_monthly | 8500 |
| | rental_income_monthly | 2800 |
| | has_rental_properties | true |
| | child_benefit_monthly | 500 |
| **6. Ausgaben** | current_rent_monthly | 0 (Eigentuemer) |
| | living_expenses_monthly | 2200 |
| | health_insurance_monthly | 685 |
| | car_leasing_monthly | 890 |
| | other_fixed_costs_monthly | 350 |
| **7. Vermoegen** | bank_savings | 85000 |
| | securities_value | 120000 |
| | life_insurance_value | 45000 |
| | completion_score | 92 |

Zusaetzlich: Die Co-Applicant-Zeile (`703e1648-...`) wird fuer Lisa Mustermann befuellt (Angestellte, GKV).

### SQL-Migration

```sql
-- 1. Primary: Max Mustermann Selbstauskunft
UPDATE applicant_profiles SET
  salutation = 'Herr', first_name = 'Max', last_name = 'Mustermann',
  birth_date = '1982-03-15', birth_place = 'München', birth_country = 'DE',
  nationality = 'DE', address_street = 'Leopoldstraße 42',
  address_postal_code = '80802', address_city = 'München',
  address_since = '2015-06-01', phone = '+49 89 12345678',
  phone_mobile = '+49 170 1234567', email = 'max@mustermann-demo.de',
  tax_id = '12 345 678 901', marital_status = 'verheiratet',
  property_separation = false, adults_count = 2, children_count = 2,
  children_birth_dates = '2014-09-03, 2017-11-28',
  employment_type = 'selbstaendig', company_name = 'IT-Beratung Mustermann',
  company_legal_form = 'Einzelunternehmen', company_founded = '2010-01-01',
  company_industry = 'IT / Software-Beratung', company_managing_director = true,
  company_ownership_percent = 100, vehicles_count = 2,
  iban = 'DE89370400440532013000', bic = 'COBADEFFXXX',
  self_employed_income_monthly = 8500, rental_income_monthly = 2800,
  has_rental_properties = true, child_benefit_monthly = 500,
  current_rent_monthly = 0, living_expenses_monthly = 2200,
  health_insurance_monthly = 685, car_leasing_monthly = 890,
  other_fixed_costs_monthly = 350, bank_savings = 85000,
  securities_value = 120000, life_insurance_value = 45000,
  completion_score = 92
WHERE id = 'a23366ab-e769-46b0-8d44-f8117f901c15';

-- 2. Co-Applicant: Lisa Mustermann
UPDATE applicant_profiles SET
  salutation = 'Frau', first_name = 'Lisa', last_name = 'Mustermann',
  birth_date = '1985-07-22', birth_place = 'Hamburg', birth_country = 'DE',
  nationality = 'DE', address_street = 'Leopoldstraße 42',
  address_postal_code = '80802', address_city = 'München',
  phone_mobile = '+49 170 7654321', email = 'lisa@mustermann-demo.de',
  employment_type = 'angestellt', employer_name = 'MediaCorp GmbH',
  employer_location = 'München', employer_industry = 'Marketing',
  position = 'Marketing Managerin', employed_since = '2012-03-01',
  contract_type = 'unbefristet', employer_in_germany = true,
  net_income_monthly = 3200, bonus_yearly = 5000,
  iban = 'DE72100110012345678901', bic = 'NTSBDEB1XXX',
  completion_score = 78
WHERE id = '703e1648-5dbf-40da-8f5f-040dc04bbc31';
```

## 2. Engine-Erweiterung: DemoSelbstauskunft

### `spec.ts` — Neues Interface

```typescript
/** Demo-Selbstauskunft (Applicant Profile) */
export interface DemoSelbstauskunft {
  readonly primaryProfileId: string;
  readonly coApplicantProfileId: string;
  readonly primaryData: Record<string, unknown>;
  readonly coApplicantData: Record<string, unknown>;
}
```

### `data.ts` — Neue Konstante

```typescript
export const DEMO_SELBSTAUSKUNFT_PRIMARY_ID = 'a23366ab-e769-46b0-8d44-f8117f901c15';
export const DEMO_SELBSTAUSKUNFT_CO_ID = '703e1648-5dbf-40da-8f5f-040dc04bbc31';
```

Diese IDs werden in `ALL_DEMO_IDS` aufgenommen.

### `DemoDataSpec` erweitern

```typescript
export interface DemoDataSpec {
  // ...bestehend...
  readonly selbstauskunft: DemoSelbstauskunft;
}
```

## 3. goldenPathProcesses.ts — Akquise-Daten aktualisieren

Das Demo-Widget fuer `GP-AKQUISE-MANDAT` referenziert noch "Investoren GbR Rhein" / "Koeln/Duesseldorf". Update auf:

```typescript
demoWidget: {
  title: 'Demo: Aufteiler-Akquise München',
  subtitle: 'Suchprofil: MFH/Aufteiler, München/Oberbayern',
  data: {
    clientName: 'Mustermann Projektentwicklung GmbH',
    assetFocus: ['MFH', 'Aufteiler'],
    region: 'München / Oberbayern',
    minUnits: 6,
    budgetMax: 5000000,
  },
}
```

Ebenso `GP-SUCHMANDAT`: "MFH NRW ab 1 Mio" anpassen an "MFH Muenchen / Oberbayern — Aufteiler".

## 4. Demo-Daten-Lueckenanalyse: Wo fehlen noch Demodaten?

### Vollstaendig abgedeckt (nach dieser Aenderung)

| GP-Prozess | Modul | Demo-Daten-Quelle | Status |
|---|---|---|---|
| GP-PORTFOLIO | MOD-04 | DB: 3 Properties, Landlord Context | OK |
| GP-VERWALTUNG | MOD-04 | DB: Leases, NK, V+V | OK |
| GP-SANIERUNG | MOD-04 | Clientseitig: Demo-Widget | OK |
| GP-FINANZIERUNG | MOD-07 | DB: Selbstauskunft (nach dieser Migration) | OK (neu) |
| GP-SUCHMANDAT | MOD-08 | Clientseitig: useDemoAcquisition | OK (nach Update) |
| GP-SIMULATION | MOD-08 | Clientseitig: Demo-Widget | OK |
| GP-AKQUISE-MANDAT | MOD-12 | DB: acq_mandates + acq_offers | OK (nach Update) |
| GP-PROJEKT | MOD-13 | Clientseitig: demoProjectData.ts | OK |
| GP-FAHRZEUG | MOD-17 | DB: 2 Fahrzeuge | OK |
| GP-PV-ANLAGE | MOD-19 | DB: PV-Anlage | OK |
| GP-KONTEN | MOD-18 | Clientseitig: Demo-Bankkonto | OK |

### Teilweise abgedeckt — Handlungsbedarf spaeter

| GP-Prozess | Modul | Luecke | Prioritaet |
|---|---|---|---|
| GP-FM-FALL | MOD-11 | Manager-Seite: kein Demo-Finanzierungsfall (bewusst — kein Case angelegt) | Niedrig |
| GP-SERIEN-EMAIL | MOD-14 | Nur Demo-Widget, keine echte Sequenz | Niedrig |
| GP-RECHERCHE | MOD-14 | Nur Demo-Widget, keine echten Ergebnisse | Niedrig |
| GP-PETS | MOD-05 | Phase 1, noch nicht implementiert | Spaeter |
| GP-PRIVATKREDIT | MOD-07 | Kein GP-Eintrag, nur PrivatkreditTab | Niedrig |

### Dokumentation in der Engine

Die `data.ts` erhaelt am Ende einen Kommentar-Block `DEMO_COVERAGE_MAP` der den Abdeckungsstatus aller 15 GPs dokumentiert.

## 5. Dateien-Uebersicht

| Datei | Aktion | Beschreibung |
|---|---|---|
| `src/engines/demoData/spec.ts` | EDIT | Neues Interface `DemoSelbstauskunft` |
| `src/engines/demoData/data.ts` | EDIT | Selbstauskunft-IDs, Coverage-Map Dokumentation |
| `src/manifests/goldenPathProcesses.ts` | EDIT | GP-AKQUISE-MANDAT + GP-SUCHMANDAT Demo-Widget auf Mustermann |
| SQL-Migration | NEU | UPDATE applicant_profiles fuer Max + Lisa |

## 6. Ergebnis

- Selbstauskunft unter `/portal/finanzierung/selbstauskunft` zeigt vorausgefuellte Daten (92% complete)
- Co-Applicant Lisa mit 78% Ausfuellgrad
- Ein Finanzierungsmandat kann manuell erstellt werden (kein automatischer Demo-Case)
- Engine dokumentiert vollstaendig welche GP-Prozesse abgedeckt sind und wo Luecken bestehen
- Alle Demo-Widget-Texte in goldenPathProcesses.ts konsistent mit "Mustermann"-Story
