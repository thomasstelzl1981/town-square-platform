

# MOD-07 FINANZIERUNG — VERFEINERTER REFACTORING-PLAN

## KLARSTELLUNG: GOLDEN PATH FINANZIERUNG

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           FINANZIERUNG GOLDEN PATH                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ZONE 2: MOD-07 (Kunde)              ZONE 1: FutureRoom (Admin)     ZONE 2: MOD-11 (Manager)│
│  ═══════════════════════             ══════════════════════════     ═════════════════════════│
│                                                                                             │
│  ┌─────────────────────┐                                                                    │
│  │ 1. SELBSTAUSKUNFT   │    Nur Datenerfassung                                              │
│  │    9 Sektionen      │    ─────────────────►  KEINE Übergabe an Banken!                   │
│  │    (Antragsteller   │                        KEIN Europace/BaufiSmart!                   │
│  │     1 + optional 2) │                                                                    │
│  └─────────┬───────────┘                                                                    │
│            │                                                                                │
│            ▼                                                                                │
│  ┌─────────────────────┐                                                                    │
│  │ 2. DOKUMENTE        │    DMS-Checkliste                                                  │
│  │    (Bonitäts-       │    für Bankunterlagen                                              │
│  │     unterlagen)     │                                                                    │
│  └─────────┬───────────┘                                                                    │
│            │                                                                                │
│            ▼                                                                                │
│  ┌─────────────────────┐                                                                    │
│  │ 3. ANFRAGE          │    Objektdaten                                                     │
│  │    (Finanzierungs-  │    + Kostenaufstellung                                             │
│  │     vorhaben)       │    + Finanzierungsplan                                             │
│  └─────────┬───────────┘                                                                    │
│            │                                                                                │
│            │  status = 'submitted'                                                          │
│            ▼                                                                                │
│  ┌─────────────────────┐   ┌─────────────────────────┐                                      │
│  │ 4. STATUS           │──►│ FutureRoom INBOX        │                                      │
│  │    (Einreichung)    │   │ Triage + Delegation     │                                      │
│  └─────────────────────┘   └───────────┬─────────────┘                                      │
│                                        │                                                    │
│       ◄──────────────────────────────  │  status = 'assigned'                               │
│       Benachrichtigung                 ▼                                                    │
│                            ┌─────────────────────────┐   ┌─────────────────────────────────┐│
│                            │ FutureRoom ZUWEISUNG    │──►│ MOD-11 FINANZIERUNGSMANAGER     ││
│                            │ Manager auswählen       │   │                                 ││
│                            └─────────────────────────┘   │ ┌─────────────────────────────┐ ││
│                                                          │ │ Dashboard                   │ ││
│                                                          │ │ Fälle                       │ ││
│                                                          │ │ Kommunikation               │ ││
│                                                          │ │ Status                      │ ││
│                                                          │ └─────────────────────────────┘ ││
│                                                          │                                 ││
│                                                          │ ┌─────────────────────────────┐ ││
│                                                          │ │ EINREICHEN AN BANK          │ ││
│                                                          │ │ • E-Mail + Datenraum-Link   │ ││
│                                                          │ │ • ODER Europace API         │ ││
│                                                          │ │   (NUR HIER!)               │ ││
│                                                          │ └─────────────────────────────┘ ││
│                                                          └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## KRITISCHE KLARSTELLUNG

| Modul | Funktion | Bank-Übergabe |
|-------|----------|---------------|
| **MOD-07** | Datenerfassung durch Kunden | **NEIN** — nur Einreichung an Zone 1 |
| **Zone 1 FutureRoom** | Triage + Delegation | **NEIN** — nur Zuweisung an Manager |
| **MOD-11** | Operatives Processing | **JA** — E-Mail oder Europace API |

**Die Europace/BaufiSmart-API wird AUSSCHLIESSLICH in MOD-11 implementiert, NICHT in MOD-07!**

---

## IST-STAND: PROBLEME IM AKTUELLEN CODE

### 1. API-Katalog-Bereinigung erforderlich

**Zu entfernen aus API-600..699 (MOD-07):**
- ❌ `API-650`: Generate Export — gehört zu MOD-11
- ❌ `API-651`: List Exports — gehört zu MOD-11
- ❌ `API-660`: Prepare Handoff — gehört zu MOD-11
- ❌ `API-661`: Send Handoff — gehört zu MOD-11

**Neu hinzufügen zu API-Bereich MOD-11 (neuer Range: API-1100..1199):**
- ✅ `API-1100`: GET `/manager/cases` — Liste der zugewiesenen Fälle
- ✅ `API-1101`: GET `/manager/cases/:id` — Fall-Detail
- ✅ `API-1110`: POST `/manager/cases/:id/export/email` — Export als E-Mail mit Datenraum-Link
- ✅ `API-1111`: POST `/manager/cases/:id/export/europace` — Export via Europace API
- ✅ `API-1120`: GET `/manager/banks` — Bankkontakte
- ✅ `API-1130`: POST `/manager/cases/:id/submit` — Bei Bank einreichen

### 2. Types zu bereinigen (`src/types/finance.ts`)

**Felder die NICHT in MOD-07 gehören:**
- Objektdaten sind derzeit in `ApplicantProfile` — diese gehören in `finance_requests`

### 3. SelbstauskunftForm.tsx (1327 Zeilen!)

**Aktuell vermischt:**
- Personendaten ✓ (korrekt)
- Firmendaten ✓ (korrekt)
- Objektdaten ✗ (gehören in Anfrage!)
- Finanzierungsdaten ✗ (gehören in Anfrage!)

---

## SOLL-STRUKTUR

### Sub-Tile 1: SELBSTAUSKUNFT

**9 Sektionen entsprechend PDF (selbstauskunft.pdf):**

| # | Sektion | Felder | Besonderheit |
|---|---------|--------|--------------|
| 1 | Angaben zur Person | Anrede, Name, Geburtsdaten, Adresse, Ausweis | Antragsteller 1 + optional 2 (Tabs) |
| 2 | Haushalt | Familienstand, Kinder, Gütertrennung | — |
| 3 | Beschäftigung | Arbeitgeber ODER Firma | Switch: "Angestellt" ↔ "Selbstständig" |
| 4 | Bankverbindung | IBAN, BIC | — |
| 5 | Monatliche Einnahmen | Netto, Bonus, Mieteinnahmen, Kindergeld | Mit Vorausfüllung aus MOD-04 |
| 6 | Monatliche Ausgaben | Miete, PKV, Unterhalt, Raten | — |
| 7 | Vermögen | Bankguthaben, Wertpapiere, Bausparer, **MOD-04 Immobilien (read-only)** | — |
| 8 | Verbindlichkeiten | Immobiliendarlehen, Ratenkredite (1:N Tabelle) | Neue Tabelle `applicant_liabilities` |
| 9 | Erklärungen | SCHUFA, Insolvenz, Steuerrückstände, Datenrichtigkeit | Checkboxen |

**Vorausfüllung:**
- Button "Aus Vermietereinheit übernehmen" → lädt Daten aus MOD-04 `landlord_contexts` + `context_members`

### Sub-Tile 2: DOKUMENTE

**Unverändert** — DMS-Checkliste für Bonitätsunterlagen

### Sub-Tile 3: ANFRAGE

**Entsprechend PDF (selbstauskunft_immo.pdf):**

| # | Sektion | Felder | Besonderheit |
|---|---------|--------|--------------|
| A | Vorhaben | Kauf, Neubau, Umschuldung, Modernisierung | Dropdown |
| B | Informationen zur Immobilie | Adresse, Typ, Baujahr, Flächen, Ausstattung | **Vorausfüllung aus MOD-04 möglich** |
| C | Kostenzusammenstellung | Kaufpreis, Notar, GrESt, Makler, Modernisierung | Berechnung Gesamtkosten |
| D | Finanzierungsplan | Eigenkapital, Darlehensbetrag, Zinsbindung, Tilgung | — |

**Vorausfüllung:**
- Button "Objekt aus Portfolio" → lädt Property-Daten aus MOD-04

### Sub-Tile 4: STATUS

**Unverändert** — Timeline der Anfrage

---

## TECHNISCHER IMPLEMENTIERUNGSPLAN

### Phase 1: Datenbank-Bereinigung + Erweiterung

**Migration 1: Neue Felder in `applicant_profiles`**
```sql
-- Personendaten (aus PDF)
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS salutation text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS birth_name text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS birth_country text DEFAULT 'DE';
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS address_since date;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS previous_address_street text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS previous_address_postal_code text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS previous_address_city text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS phone_mobile text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS property_separation boolean DEFAULT false;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS children_birth_dates text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS bic text;

-- Erweiterte Beschäftigung
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS contract_type text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS employer_in_germany boolean DEFAULT true;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'EUR';
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS salary_payments_per_year integer DEFAULT 12;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS has_side_job boolean DEFAULT false;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS side_job_type text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS side_job_since date;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS side_job_income_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS vehicles_count integer DEFAULT 0;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS retirement_date date;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS pension_state_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS pension_private_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS rental_income_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS alimony_income_monthly numeric(12,2);
```

**Migration 2: Neue Tabelle `applicant_liabilities`**
```sql
CREATE TABLE applicant_liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  applicant_profile_id uuid NOT NULL REFERENCES applicant_profiles(id) ON DELETE CASCADE,
  liability_type text NOT NULL, -- 'immobiliendarlehen' | 'ratenkredit' | 'leasing' | 'sonstige'
  creditor_name text,
  original_amount numeric(12,2),
  remaining_balance numeric(12,2),
  monthly_rate numeric(12,2),
  interest_rate_fixed_until date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE applicant_liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON applicant_liabilities
  FOR ALL USING (tenant_id = (SELECT active_tenant_id()));
```

**Migration 3: Objektfelder in `finance_requests` (NICHT in applicant_profiles!)**
```sql
-- Diese Felder gehören zum ANTRAG, nicht zur Person
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS purpose text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_address text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_type text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_construction_year integer;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_living_area_sqm numeric(10,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_land_area_sqm numeric(10,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_equipment_level text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_location_quality text;

-- Kostenaufstellung
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS modernization_costs numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS notary_costs numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS transfer_tax numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS broker_fee numeric(12,2);

-- Finanzierungsplan
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS equity_amount numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS loan_amount_requested numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS fixed_rate_period_years integer;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS repayment_rate_percent numeric(5,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS max_monthly_rate numeric(12,2);
```

### Phase 2: UI-Refactoring

**2.1 Neue Selbstauskunft-Komponenten**
```text
src/components/finanzierung/
├── SelbstauskunftFormV2.tsx              # NEU: Haupt-Formular
├── sections/
│   ├── PersonSection.tsx                 # Antragsteller 1 + 2 (Tabs)
│   ├── HouseholdSection.tsx              # Haushalt
│   ├── EmploymentSection.tsx             # Angestellt/Selbstständig Switch
│   ├── BankSection.tsx                   # Bankverbindung
│   ├── IncomeSection.tsx                 # Einnahmen
│   ├── ExpensesSection.tsx               # Ausgaben
│   ├── AssetsSection.tsx                 # Vermögen + MOD-04 Preview
│   ├── LiabilitiesSection.tsx            # Verbindlichkeiten (1:N)
│   └── DeclarationsSection.tsx           # Erklärungen
├── LiabilitiesEditor.tsx                 # Inline-Tabelle für Darlehen
└── MOD04PropertiesCard.tsx               # Read-only Vermögensübersicht
```

**2.2 Neue Anfrage-Komponenten**
```text
src/components/finanzierung/
├── AnfrageFormV2.tsx                     # NEU: Haupt-Formular
├── request-sections/
│   ├── PurposeSection.tsx                # Vorhaben
│   ├── PropertySection.tsx               # Immobilie (mit MOD-04 Selector)
│   ├── CostSection.tsx                   # Kostenzusammenstellung
│   └── FinancingPlanSection.tsx          # Finanzierungsplan
└── MOD04PropertySelector.tsx             # Vorausfüllung aus Portfolio
```

### Phase 3: Code-Bereinigung

**Zu löschen/entfernen:**
- `API-650..661` aus `API_NUMBERING_CATALOG.md` (gehören zu MOD-11)
- Objektfelder aus `ApplicantProfile`-Interface entfernen (nach Migration)
- Finanzierungsfelder aus `SelbstauskunftForm.tsx` entfernen

**Alte Komponenten archivieren:**
- `SelbstauskunftForm.tsx` → `SelbstauskunftForm.legacy.tsx` (temporär)

### Phase 4: Dokumentation

**Neue Dokumente:**
1. `docs/workflows/GOLDEN_PATH_FINANZIERUNG.md` — Vollständiger Workflow
2. Update `API_NUMBERING_CATALOG.md`:
   - MOD-07 API-600..629 (nur Selbstauskunft + Anfrage)
   - MOD-11 API-1100..1130 (Bank-Übergabe)

---

## DATENTRENNUNG: ZUSAMMENFASSUNG

| Feld | Speicherort | Editable in |
|------|-------------|-------------|
| Personendaten (Name, Adresse, Ausweis) | `applicant_profiles` | MOD-07 Selbstauskunft |
| Haushaltsdaten | `applicant_profiles` | MOD-07 Selbstauskunft |
| Beschäftigungsdaten | `applicant_profiles` | MOD-07 Selbstauskunft |
| Einnahmen/Ausgaben | `applicant_profiles` | MOD-07 Selbstauskunft |
| Vermögen | `applicant_profiles` + MOD-04 (read-only) | MOD-07 Selbstauskunft |
| Verbindlichkeiten | `applicant_liabilities` | MOD-07 Selbstauskunft |
| **Objektdaten** | `finance_requests` | **MOD-07 Anfrage** |
| **Kostenaufstellung** | `finance_requests` | **MOD-07 Anfrage** |
| **Finanzierungsplan** | `finance_requests` | **MOD-07 Anfrage** |
| Bank-Einreichung | `future_room_cases` | **MOD-11** |

---

## ACCEPTANCE CRITERIA

### MOD-07 Selbstauskunft
- [ ] 9 Sektionen wie in PDF
- [ ] Antragsteller 1 + 2 in separaten Tabs
- [ ] Beschäftigungsart als Switch (nicht als separate Module)
- [ ] Vorausfüllung aus Vermietereinheit (MOD-04) funktioniert
- [ ] Verbindlichkeiten als 1:N-Tabelle
- [ ] MOD-04 Immobilien als read-only Vermögen
- [ ] Alle Felder editierbar und speicherbar
- [ ] Completion Score basierend auf Pflichtfeldern

### MOD-07 Anfrage
- [ ] Objektdaten in `finance_requests` (nicht in `applicant_profiles`)
- [ ] Vorausfüllung aus MOD-04 Portfolio
- [ ] Kostenzusammenstellung vollständig
- [ ] Finanzierungsplan editierbar
- [ ] Einreichung ändert Status → Zone 1

### API-Katalog
- [ ] API-650..661 aus MOD-07 entfernt
- [ ] Neue API-Range für MOD-11: API-1100..1130

### Dokumentation
- [ ] Golden Path Finanzierung dokumentiert
- [ ] Europace-Mapping in MOD-11 (nicht MOD-07) referenziert

---

## GESCHÄTZTE DAUER

| Phase | Umfang | Dauer |
|-------|--------|-------|
| Phase 1 | DB-Migration (3 Skripte) | 1 Tag |
| Phase 2 | UI-Refactoring (2 Formulare) | 3-4 Tage |
| Phase 3 | Code-Bereinigung + API-Katalog | 1 Tag |
| Phase 4 | Dokumentation | 0.5 Tage |
| **Gesamt** | | **5-6 Tage** |

