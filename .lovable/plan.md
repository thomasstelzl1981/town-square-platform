
# MASTERPLAN: MOD-04/05 Immobilienakte + Datenkern Integration

## Executive Summary

Dieses Dokument definiert den vollständigen Implementierungsplan zur Integration von:
- **Prompt 1**: Immobilienakte als UI-Arbeitsoberfläche und Matching-Basis
- **Prompt 2**: Vollkatalog als Backend-Datenkern (DataPoint Catalog + DocType Catalog + Posting-Matrix)

Die bestehende Architektur ist zu 85% kompatibel. Erforderlich sind gezielte Schema-Erweiterungen, neue Konfigurationstabellen und UI-Komponenten.

---

## KOMPATIBILITÄTSANALYSE

### Bestehende Strukturen (nutzbar)

| Komponente | Status | Anmerkung |
|------------|--------|-----------|
| `properties` Tabelle | 80% | Felder erweitern: `address_house_no`, `mea_total`, `land_register_refs` |
| `units` Tabelle | 70% | Felder erweitern: Energy, Features, Condition |
| `leases` Tabelle | 60% | Erweitern: Rent Model, Deposit Status, Index-Felder |
| `storage_nodes` | 90% | Erweitern: `doc_type_hint`, `template_id`, `scope_hint` |
| `documents` | 85% | Vorhanden mit `extracted_json_path` |
| `document_links` | 100% | Vollständig nutzbar |
| `landlord_contexts` | 100% | Vorhanden, unterstützt Tax-Regime |
| `property_financing` | 70% | Erweitern zu vollständigem `loans` Modell |
| Trigger: `create_property_folder_structure` | 100% | Vorhanden, Template erweitern |

### Neue Strukturen (erforderlich)

| Komponente | Beschreibung |
|------------|--------------|
| `dp_catalog` | DataPoint Katalog (JSON-gesteuert) |
| `doc_type_catalog` | Dokumenttyp-Katalog mit Extraktionsregeln |
| `meters` | Zähler für Verbrauchserfassung |
| `bank_transactions` | Kontoumsätze mit Matching-Status |
| `postings` | Buchungswahrheit mit Status-Workflow |
| `nk_periods` | Nebenkostenabrechnungsperioden |
| `nk_allocations` | NK-Zuordnungen (Unit/Property) |
| `unit_dossier` | Aggregate-View für UI |

---

## ARCHITEKTUR-DIAGRAMM

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ZONE 2: MOD-04/05 DATENKERN                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │ landlord_contexts│────▶│   properties    │────▶│     units       │       │
│  │ (Tax Regime)    │     │ (Gebäude)       │     │ (Wohneinheit)   │       │
│  └─────────────────┘     └────────┬────────┘     └────────┬────────┘       │
│                                   │                       │                 │
│         ┌─────────────────────────┼───────────────────────┤                 │
│         │                         │                       │                 │
│         ▼                         ▼                       ▼                 │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│  │    loans    │          │   leases    │          │   meters    │         │
│  │ (Darlehen)  │          │ (Mietvertr.)│          │ (Zähler)    │         │
│  └─────────────┘          └─────────────┘          └─────────────┘         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         DMS / STORAGE LAYER                          │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │  │
│  │  │storage_nodes│──▶│  documents  │──▶│document_links│               │  │
│  │  │+ Template   │   │+ Sidecar    │   │+ Scope      │               │  │
│  │  │+ doc_type   │   │+ Extract    │   │             │               │  │
│  │  └─────────────┘   └─────────────┘   └─────────────┘                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         POSTING ENGINE                               │  │
│  │  ┌───────────────┐   ┌─────────────┐   ┌─────────────────┐          │  │
│  │  │bank_transactions│─▶│  postings   │──▶│ V&V / BWA_SuSa  │          │  │
│  │  │(Kontoumsätze) │   │ (Buchungen) │   │ (Tax Output)    │          │  │
│  │  └───────────────┘   └─────────────┘   └─────────────────┘          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         KATALOG-SYSTEM                               │  │
│  │  ┌─────────────┐   ┌───────────────┐   ┌─────────────────┐          │  │
│  │  │ dp_catalog  │   │doc_type_catalog│  │ posting_matrix  │          │  │
│  │  │(Datenpunkte)│   │(Doku-Typen)   │   │(Kategorien)     │          │  │
│  │  └─────────────┘   └───────────────┘   └─────────────────┘          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE A: SCHEMA-ERWEITERUNGEN (Migration)

### A1: Properties-Tabelle erweitern

```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_house_no TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mea_total NUMERIC(12,4);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS weg_flag BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_register_refs JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS manager_contact JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS insurance_policy_no TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS multi_unit_enabled BOOLEAN DEFAULT false;
```

### A2: Units-Tabelle erweitern

```sql
ALTER TABLE units ADD COLUMN IF NOT EXISTS code TEXT; -- unit.code (Akten-ID)
ALTER TABLE units ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS condition_grade TEXT; -- A/B/C/D
ALTER TABLE units ADD COLUMN IF NOT EXISTS last_renovation_year INT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS energy_certificate_type TEXT; -- DEMAND/CONSUMPTION
ALTER TABLE units ADD COLUMN IF NOT EXISTS energy_certificate_value NUMERIC(6,2);
ALTER TABLE units ADD COLUMN IF NOT EXISTS energy_certificate_valid_until DATE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS features_tags JSONB; -- max 6 Tags
ALTER TABLE units ADD COLUMN IF NOT EXISTS heating_supply TEXT; -- CENTRAL/ETAGE/OTHER
ALTER TABLE units ADD COLUMN IF NOT EXISTS balcony_flag BOOLEAN;
ALTER TABLE units ADD COLUMN IF NOT EXISTS garden_flag BOOLEAN;
ALTER TABLE units ADD COLUMN IF NOT EXISTS parking_count INT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS bathrooms_count INT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS dossier_asof_date DATE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS dossier_data_quality TEXT DEFAULT 'PRUEFEN'; -- OK/PRUEFEN
```

### A3: Leases-Tabelle erweitern

```sql
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_cold_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS nk_advance_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS heating_advance_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_warm_eur NUMERIC(12,2) GENERATED ALWAYS AS (
  COALESCE(rent_cold_eur, 0) + COALESCE(nk_advance_eur, 0) + COALESCE(heating_advance_eur, 0)
) STORED;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS payment_due_day INT CHECK (payment_due_day BETWEEN 1 AND 28);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS deposit_amount_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'OPEN'; -- PAID/OPEN/PARTIAL
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_model TEXT DEFAULT 'FIX'; -- FIX/INDEX/STAFFEL
ALTER TABLE leases ADD COLUMN IF NOT EXISTS index_base_month DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS last_rent_adjustment_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS next_rent_adjustment_earliest_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS staffel_schedule JSONB;
```

### A4: Storage-Nodes erweitern

```sql
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS doc_type_hint TEXT;
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS scope_hint TEXT; -- PROPERTY/UNIT/TENANCY/LOAN
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS sort_index INT DEFAULT 0;
```

### A5: Neue Tabellen erstellen

```sql
-- Loans (erweitertes Finanzierungsmodell)
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  scope TEXT NOT NULL DEFAULT 'PROPERTY', -- PROPERTY/UNIT
  
  bank_name TEXT NOT NULL,
  loan_number TEXT NOT NULL,
  contact_person JSONB,
  
  start_date DATE,
  maturity_date DATE,
  interest_rate_percent NUMERIC(5,3),
  fixed_interest_end_date DATE,
  annuity_monthly_eur NUMERIC(12,2),
  repayment_rate_percent NUMERIC(5,3),
  outstanding_balance_eur NUMERIC(14,2),
  outstanding_balance_asof DATE,
  special_repayment_right_eur_per_year NUMERIC(12,2),
  payment_account_ref TEXT,
  collateral_refs JSONB,
  allocated_unit_shares JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meters (Zähler)
CREATE TABLE meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  scope TEXT NOT NULL DEFAULT 'UNIT', -- PROPERTY/UNIT
  
  meter_type TEXT NOT NULL, -- WATER_COLD/WATER_WARM/HEAT/ELECTRICITY
  serial_no TEXT,
  readings JSONB, -- [{date, value, uom}]
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bank Transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  account_ref TEXT NOT NULL,
  
  booking_date DATE NOT NULL,
  value_date DATE,
  amount_eur NUMERIC(14,2) NOT NULL,
  counterparty TEXT,
  purpose_text TEXT,
  
  match_status TEXT DEFAULT 'UNMATCHED', -- AUTO_MATCHED/NEEDS_REVIEW/UNMATCHED
  matched_entity JSONB, -- {type, id, confidence}
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Postings (Buchungswahrheit)
CREATE TABLE postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  
  posting_date DATE NOT NULL,
  amount_eur NUMERIC(14,2) NOT NULL,
  direction TEXT NOT NULL, -- INCOME/EXPENSE
  accounting_category TEXT NOT NULL,
  tax_category TEXT,
  bwa_group TEXT,
  
  source_refs JSONB NOT NULL, -- [{type: bank_tx/invoice/doc, id/path}]
  status TEXT DEFAULT 'DRAFT', -- DRAFT/CONFIRMED/LOCKED
  confidence NUMERIC(3,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- NK Periods
CREATE TABLE nk_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  allocation_key_default TEXT DEFAULT 'SQM',
  settlement_date DATE,
  settlement_balance_eur NUMERIC(12,2),
  top_cost_blocks JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DataPoint Catalog (Konfiguration)
CREATE TABLE dp_catalog (
  dp_key TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  label_de TEXT NOT NULL,
  datatype TEXT NOT NULL,
  required_level TEXT DEFAULT 'OPTIONAL',
  validation JSONB,
  privacy TEXT DEFAULT 'internal',
  calc_role JSONB,
  evidence_doc_types TEXT[],
  aliases TEXT[],
  default_source_priority TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DocType Catalog (Konfiguration)
CREATE TABLE doc_type_catalog (
  doc_type TEXT PRIMARY KEY,
  scope_default TEXT NOT NULL,
  required_meta TEXT[],
  anchors JSONB,
  extractable_dp_keys TEXT[],
  posting_suggestion_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## PHASE B: DMS-TEMPLATE-SYSTEM

### B1: Template Definitionen (Seed-Daten)

```sql
-- Property Dossier Template V1
INSERT INTO dp_catalog (dp_key, entity, label_de, datatype, required_level) VALUES
-- Property Dossier Nodes with doc_type_hints werden als JSONB Template gespeichert
('PROPERTY_DOSSIER_V1', 'template', 'Property Dossier V1', 'json', 'MUST');

-- Die Template-Struktur wird in der Trigger-Funktion genutzt
```

### B2: Erweiterte Trigger-Funktion

```sql
CREATE OR REPLACE FUNCTION create_property_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  root_id uuid;
  node_id uuid;
  template_nodes JSONB := '[
    {"sort": 0, "name": "00_Projektdokumentation", "doc_type_hint": "DOC_PROJECT"},
    {"sort": 1, "name": "01_Exposé Ankauf", "doc_type_hint": "DOC_EXPOSE_BUY"},
    {"sort": 2, "name": "02_Exposé To&Co", "doc_type_hint": "DOC_EXPOSE_MISC"},
    {"sort": 3, "name": "03_Grundbuchauszug", "doc_type_hint": "DOC_LAND_REGISTER"},
    {"sort": 4, "name": "04_Teilungserklärung", "doc_type_hint": "DOC_DIVISION_DECLARATION"},
    {"sort": 5, "name": "05_Grundriss", "doc_type_hint": "DOC_FLOORPLAN"},
    {"sort": 6, "name": "06_Kurzgutachten", "doc_type_hint": "DOC_VALUATION_SHORT"},
    {"sort": 7, "name": "07_Kaufvertrag", "doc_type_hint": "DOC_PURCHASE_CONTRACT"},
    {"sort": 8, "name": "08_Mietvertrag", "doc_type_hint": "DOC_LEASE_CONTRACT"},
    {"sort": 9, "name": "09_Rechnungen", "doc_type_hint": "DOC_INVOICE"},
    {"sort": 10, "name": "10_Wirtschaftsplan Abrechnungen Protokolle", "doc_type_hint": "DOC_WEG_BUCKET"},
    {"sort": 11, "name": "11_Fotos", "doc_type_hint": "DOC_PHOTOS"},
    {"sort": 12, "name": "12_Energieausweis", "doc_type_hint": "DOC_ENERGY_CERT"},
    {"sort": 13, "name": "13_Wohngebäudeversicherung", "doc_type_hint": "DOC_INSURANCE_BUILDING"},
    {"sort": 14, "name": "14_Sonstiges", "doc_type_hint": "DOC_MISC"},
    {"sort": 15, "name": "15_Darlehen und Finanzierung", "doc_type_hint": "DOC_LOAN_BUCKET"},
    {"sort": 16, "name": "16_Sanierung", "doc_type_hint": "DOC_RENOVATION"},
    {"sort": 17, "name": "17_Grundsteuer", "doc_type_hint": "DOC_PROPERTY_TAX"}
  ]'::JSONB;
  node_data JSONB;
BEGIN
  -- Haupt-Ordner erstellen
  INSERT INTO storage_nodes (tenant_id, property_id, name, node_type, auto_created, template_id)
  VALUES (NEW.tenant_id, NEW.id, COALESCE(NEW.code, NEW.address), 'folder', true, 'PROPERTY_DOSSIER_V1')
  RETURNING id INTO root_id;

  -- Template-Ordner erstellen
  FOR node_data IN SELECT * FROM jsonb_array_elements(template_nodes)
  LOOP
    INSERT INTO storage_nodes (
      tenant_id, property_id, parent_id, name, node_type, 
      auto_created, doc_type_hint, sort_index, scope_hint
    )
    VALUES (
      NEW.tenant_id, NEW.id, root_id, 
      node_data->>'name', 'folder', true,
      node_data->>'doc_type_hint',
      (node_data->>'sort')::int,
      'PROPERTY'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### B3: Unit-Dossier Trigger (Multi-Unit)

```sql
CREATE OR REPLACE FUNCTION create_unit_folder_v2()
RETURNS TRIGGER AS $$
DECLARE
  property_root uuid;
  units_folder uuid;
  unit_folder uuid;
  template_nodes JSONB := '[
    {"sort": 0, "name": "05_Grundriss", "doc_type_hint": "DOC_FLOORPLAN"},
    {"sort": 1, "name": "08_Mietvertrag", "doc_type_hint": "DOC_LEASE_CONTRACT"},
    {"sort": 2, "name": "09_Rechnungen", "doc_type_hint": "DOC_INVOICE"},
    {"sort": 3, "name": "11_Fotos", "doc_type_hint": "DOC_PHOTOS"},
    {"sort": 4, "name": "14_Sonstiges", "doc_type_hint": "DOC_MISC"},
    {"sort": 5, "name": "16_Sanierung", "doc_type_hint": "DOC_RENOVATION"}
  ]'::JSONB;
  node_data JSONB;
  prop_multi_unit BOOLEAN;
BEGIN
  -- Prüfen ob Multi-Unit aktiviert
  SELECT multi_unit_enabled INTO prop_multi_unit 
  FROM properties WHERE id = NEW.property_id;
  
  IF NOT COALESCE(prop_multi_unit, false) THEN
    RETURN NEW;
  END IF;

  -- Property-Root finden
  SELECT id INTO property_root FROM storage_nodes 
  WHERE property_id = NEW.property_id AND parent_id IS NULL LIMIT 1;

  -- Units-Ordner finden oder erstellen
  SELECT id INTO units_folder FROM storage_nodes 
  WHERE property_id = NEW.property_id AND name = 'Einheiten' AND parent_id = property_root;
  
  IF units_folder IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, property_id, parent_id, name, node_type, auto_created)
    VALUES (NEW.tenant_id, NEW.property_id, property_root, 'Einheiten', 'folder', true)
    RETURNING id INTO units_folder;
  END IF;

  -- Unit-Ordner erstellen
  INSERT INTO storage_nodes (
    tenant_id, property_id, unit_id, parent_id, name, 
    node_type, auto_created, template_id, scope_hint
  )
  VALUES (
    NEW.tenant_id, NEW.property_id, NEW.id, units_folder,
    COALESCE(NEW.code, NEW.unit_number, 'Einheit'),
    'folder', true, 'UNIT_DOSSIER_V1', 'UNIT'
  )
  RETURNING id INTO unit_folder;

  -- Template-Ordner erstellen
  FOR node_data IN SELECT * FROM jsonb_array_elements(template_nodes)
  LOOP
    INSERT INTO storage_nodes (
      tenant_id, property_id, unit_id, parent_id, name, 
      node_type, auto_created, doc_type_hint, sort_index, scope_hint
    )
    VALUES (
      NEW.tenant_id, NEW.property_id, NEW.id, unit_folder,
      node_data->>'name', 'folder', true,
      node_data->>'doc_type_hint',
      (node_data->>'sort')::int,
      'UNIT'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## PHASE C: MATCHING-ENGINE + CONFIDENCE-GATE

### C1: Sidecar-JSON Schema

Jedes Dokument erhält ein Sidecar-JSON mit folgender Struktur:

```typescript
interface DocumentSidecar {
  doc_meta: {
    doc_id: string;
    doc_type: string;
    scope: 'LANDLORD_CONTEXT' | 'PROPERTY' | 'UNIT' | 'TENANCY' | 'LOAN';
    doc_date: string | null;
    service_period_start: string | null;
    service_period_end: string | null;
    vendor: string | null;
    source_channel: 'UPLOAD' | 'EMAIL' | 'CONNECTOR' | 'API';
    classification_trace?: { classifier: string; confidence: number };
  };
  extracted_fields: Array<{
    dp_key: string;
    value: unknown;
    confidence: number;
    evidence_span?: string;
  }>;
  entity_matches: {
    property_id?: { id: string; confidence: number };
    unit_id?: { id: string; confidence: number };
    tenancy_id?: { id: string; confidence: number };
    loan_id?: { id: string; confidence: number };
  };
  posting_suggestions?: Array<{
    posting_type: string;
    amount: number;
    accounting_category: string;
    tax_category: string;
    confidence: number;
    source_refs: string[];
  }>;
  review_state: 'AUTO_ACCEPTED' | 'NEEDS_REVIEW' | 'UNASSIGNED';
  versioning: {
    extracted_at: string;
    extractor_version: string;
    mapping_rules_version: string;
  };
}
```

### C2: Matching-Regeln (Priorität)

```typescript
// Matching-Reihenfolge (absteigend nach Stärke)
const MATCHING_PRIORITY = [
  // Stufe 1: Explizite IDs (höchste Konfidenz)
  { type: 'EXPLICIT_ID', fields: ['unit.code', 'loan.loan_number', 'property.mea_te_no'], confidence: 0.99 },
  
  // Stufe 2: Address-Fingerprint
  { type: 'ADDRESS_FP', fields: ['zip', 'street', 'house_no'], confidence: 0.95 },
  
  // Stufe 3: Dokument-spezifische Kombis
  { 
    type: 'DOC_COMBO', 
    doc_types: {
      'DOC_LEASE_CONTRACT': ['start_date', 'rent_cold_eur', 'tenant_name'],
      'DOC_LOAN_*': ['bank_name', 'loan_number', 'outstanding_balance'],
      'DOC_NK_STATEMENT': ['year', 'address', 'settlement_total'],
    },
    confidence: 0.85 
  },
  
  // Stufe 4: Vendor+Amount (nur Vorschlag)
  { type: 'VENDOR_AMOUNT', fields: ['vendor', 'amount', 'period'], confidence: 0.60 },
];

// Confidence Gate
const CONFIDENCE_GATES = {
  AUTO_ACCEPTED: 0.90,   // Darf Draft-Records erstellen
  NEEDS_REVIEW: 0.70,    // Queue für User-Bestätigung
  UNASSIGNED: 0.00,      // Nur speichern
};
```

### C3: Documents-Tabelle Erweiterung

```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_state TEXT DEFAULT 'UNASSIGNED';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS match_confidence NUMERIC(3,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sidecar_json JSONB;
```

---

## PHASE D: POSTING-ENGINE + KATEGORIE-MATRIX

### D1: Accounting Categories (Seed-Daten)

```sql
CREATE TABLE posting_categories (
  accounting_category TEXT PRIMARY KEY,
  direction TEXT NOT NULL, -- INCOME/EXPENSE
  tax_category_vv TEXT,    -- Anlage V Mapping
  bwa_group TEXT,          -- BWA/SuSa Mapping
  description_de TEXT
);

INSERT INTO posting_categories VALUES
('INCOME_RENT_COLD', 'INCOME', 'VV_RENT_INCOME', 'ERLOESE_MIETE', 'Kaltmiete'),
('INCOME_NK_ADVANCE', 'INCOME', 'VV_UMLAGEN_INCOME', 'ERLOESE_NK', 'NK-Vorauszahlung'),
('INCOME_OTHER', 'INCOME', 'VV_OTHER_INCOME', 'SONST_ERTRAEGE', 'Sonstige Einnahmen'),
('EXP_BETRKV_UMLEG', 'EXPENSE', 'VV_PASS_THROUGH_OR_COST', 'AUFWAND_BETRIEBSKOSTEN', 'Betriebskosten umlagefähig'),
('EXP_NON_UMLEG_ADMIN', 'EXPENSE', 'VV_ADM_COSTS', 'VERWALTUNGSAUFWAND', 'Verwaltungskosten'),
('EXP_MAINTENANCE_REPAIR', 'EXPENSE', 'VV_MAINTENANCE', 'INSTANDHALTUNG', 'Instandhaltung'),
('EXP_INSURANCE', 'EXPENSE', 'VV_INSURANCE', 'VERSICHERUNGEN', 'Versicherungen'),
('EXP_TAX_PROPERTY', 'EXPENSE', 'VV_PROPERTY_TAX', 'STEUERN_GRUNDSTEUER', 'Grundsteuer'),
('EXP_BANK_FEES', 'EXPENSE', 'VV_BANK_FEES', 'BANKGEBUEHREN', 'Bankgebühren'),
('EXP_INTEREST', 'EXPENSE', 'VV_INTEREST', 'ZINSAUFWAND', 'Zinsen'),
('EXP_DEPRECIATION_AFA', 'EXPENSE', 'VV_AFA', 'AFA', 'Abschreibung');
```

---

## PHASE E: UI-KOMPONENTEN (Immobilienakte)

### E1: UnitDossierView (Hauptkomponente)

```typescript
// src/components/immobilienakte/UnitDossierView.tsx
interface UnitDossierViewProps {
  unitId: string;
}

// Layout gemäß Prompt 1:
// - Oben: Aktenkopf (Adresse, Unit-Code, Status, Datenstand, Qualität)
// - Links: Eckdaten + Mietverhältnis + Finanzierung
// - Rechts: NK/WEG Summen + KPIs + Dokumente-Checkliste
```

### E2: Neue Dateien

```text
src/components/immobilienakte/
├── UnitDossierView.tsx          # Haupt-Akte-Ansicht
├── DossierHeader.tsx            # Kopfzeile mit Status/Qualität
├── IdentityBlock.tsx            # Block 1: Identität
├── CoreDataBlock.tsx            # Block 2: Eckdaten
├── TenancyBlock.tsx             # Block 3: Mietverhältnis
├── NKWEGBlock.tsx               # Block 4: Nebenkosten/WEG
├── InvestmentKPIBlock.tsx       # Block 5: Kapitalanlage
├── FinancingBlock.tsx           # Block 6: Finanzierung
├── LegalBlock.tsx               # Block 7: Recht/IDs
├── DocumentChecklist.tsx        # Block 8: Dokumente
├── MatchingAnchorsPanel.tsx     # Matching-Debug-Ansicht
└── index.ts
```

### E3: Queues für Unassigned/NeedsReview

```text
src/pages/portal/dms/
├── UnassignedQueue.tsx          # Nicht zugeordnete Dokumente
├── NeedsReviewQueue.tsx         # Dokumente mit niedriger Konfidenz
└── MatchingAssistant.tsx        # UI für manuelle Zuordnung
```

---

## IMPLEMENTIERUNGS-REIHENFOLGE

### Sprint 1: Schema + DMS Templates (3-4 Tage)
1. Migration: Properties/Units/Leases erweitern
2. Migration: Neue Tabellen (loans, meters, bank_transactions, postings)
3. Migration: storage_nodes erweitern
4. Trigger: Property-Dossier-Template V1 mit doc_type_hints
5. Trigger: Unit-Dossier für Multi-Unit

### Sprint 2: Katalog-System + Matching (2-3 Tage)
1. dp_catalog + doc_type_catalog Tabellen
2. Seed-Daten für DataPoints und DocTypes
3. Documents-Tabelle erweitern (sidecar_json, review_state)
4. Matching-Engine Grundlogik in Edge Function

### Sprint 3: Posting-Engine (2-3 Tage)
1. posting_categories Tabelle + Seed
2. Bank-Transactions Import-Logik
3. Draft-Posting-Generierung aus Dokumenten
4. Status-Workflow (DRAFT → CONFIRMED → LOCKED)

### Sprint 4: UI Immobilienakte (3-4 Tage)
1. UnitDossierView mit allen 8 Blöcken
2. Dokumenten-Checkliste mit Vollständigkeits-Anzeige
3. Queues: Unassigned + NeedsReview
4. Integration in /portal/immobilien/:id

---

## AKZEPTANZKRITERIEN

### A) Deterministische Ablage
- Upload in "08_Mietvertrag" setzt `doc_type = DOC_LEASE_CONTRACT`
- Upload in "15_Darlehen" setzt `doc_type = DOC_LOAN_BUCKET`

### B) Wiederholbare Zuordnung
- Sidecar-JSON mit Versioning ermöglicht Re-Extraktion
- Confidence-Gate erzwingt Review bei niedrigen Werten

### C) Datengrundlage für Outputs
- V&V Output aus `postings.tax_category` aggregierbar
- BWA/SuSa Output aus `postings.bwa_group` aggregierbar
- NK-Analyse aus `nk_periods` + `nk_allocations`

### D) Multi-Unit sauber
- Mietverträge landen unit-spezifisch
- Kein Mischordner bei MFH/ETW

---

## RISIKEN + MITIGATIONEN

| Risiko | Mitigation |
|--------|------------|
| Migration bricht bestehende Daten | Alle ALTER ADD COLUMN sind non-breaking, keine Pflichtfelder |
| Matching produziert falsche Zuordnungen | Confidence-Gate + Review-Queue als Sicherheitsnetz |
| Performance bei vielen Dokumenten | Indexes auf `doc_type`, `review_state`, `property_id` |
| User-Akzeptanz der neuen UI | Schrittweise Einführung, alte Ansichten bleiben parallel nutzbar |

---

## NÄCHSTE SCHRITTE

Nach Freigabe dieses Plans beginne ich mit:
1. **Phase A**: Schema-Migrationen für Properties, Units, Leases, Storage-Nodes
2. **Phase B**: Trigger-Updates für Template-basierte Ordnerstruktur
3. Parallel: DataPoint-Katalog und DocType-Katalog Seed-Daten

**Soll ich mit Phase A (Schema-Erweiterungen) beginnen?**
