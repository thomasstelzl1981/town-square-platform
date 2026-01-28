
# STEP 0 — KOMPATIBILITÄTSPRÜFUNG + MASTERPLAN

## COMPATIBILITY MATRIX (A–H)

| Check | Bereich | Status | Befund |
|-------|---------|--------|--------|
| **A** | Routen-/Navigation | ✅ KOMPATIBEL | Zone 3 Website 04 (Future Room) fehlt, aber kann ergänzt werden analog zu `/kaufy`, `/miety`, `/sot`. Zone 1 `/admin/futureroom` neu. Zone 2 MOD-11 `/portal/finanzierungsmanager` neu. Keine Kollisionen. |
| **B** | Rollen-/Provisioning | ⚠️ RISKANT | `finance_manager` Rolle existiert nicht in `membership_role` Enum. Minimal-Fix: Enum erweitern. 3 Entry-Wege intakt. |
| **C** | DMS/Storage | ✅ KOMPATIBEL | `storage_nodes`, `documents`, `document_links` vorhanden. Bonitätsordner-Blueprint passt in bestehende Trigger-Logik (`create_property_folder_structure`). Parallele Ordnerstruktur für `finance_cases` möglich. |
| **D** | JSON-Pipeline | ✅ KOMPATIBEL | `sot-document-parser` + `useSmartUpload` vorhanden. `documents.extracted_json_path` existiert. Worker-Architektur (ADR-039) unterstützt `extract_document` Jobs. Paar-Ablage Datei+JSON bereits definiert in ADR-038. |
| **E** | Object-Source | ✅ KOMPATIBEL | MOD-04 `properties` + MOD-08 `investment_profiles` vorhanden. `custom_object` kann als JSONB-Feld in `finance_cases` ergänzt werden. |
| **F** | SoT-/Sync | ⚠️ RISKANT | `finance_cases` existiert mit Status-Enum `draft→collecting→ready→exported→submitted→acknowledged`. SoT-Wanderung zu Zone 1 fehlt: Braucht `finance_mandates` Tabelle + Delegation-Logik. Minimal-Fix: Neue Tabelle, kein Umbau. |
| **G** | FinAPI | ✅ KOMPATIBEL (konzeptionell) | `msv_bank_accounts` + `connectors` vorhanden. `consent_records` (`user_consents`) existiert. FinAPI kann analog zu Dropbox/OneDrive integriert werden. Keine öffentliche API-Expose. |
| **H** | Website-Regeln | ✅ KOMPATIBEL | Zone 3 Websites zeigen keine API-Details. Armstrong/AI-UX Pattern vorhanden (Kaufy). Future Room Website folgt gleichem Muster. |

---

## KONFLIKTLISTE

| # | Konflikt | Betroffene Regel | Minimal-Fix |
|---|----------|------------------|-------------|
| 1 | `finance_manager` Rolle fehlt | Rollen-Provisioning (FROZEN) | `ALTER TYPE membership_role ADD VALUE 'finance_manager'` |
| 2 | SoT-Wanderung Zone 1 fehlt | SoT-Regel (FROZEN) | Neue Tabelle `finance_mandates` für Zone 1 Inbox, keine Änderung an `finance_cases` |
| 3 | Bonitätsordner-Trigger fehlt | DMS/Storage | Neuer Trigger `create_finance_case_folder_structure` analog Property-Trigger |
| 4 | `applicant_profiles` Tabelle fehlt | Selbstauskunft-Datenstruktur | Neue Tabelle für strukturierte Selbstauskunft |

**Kritische Konflikte: 0**  
**Riskante Konflikte: 2** (beide mit Minimal-Fix lösbar)

---

## ARCHITECTURE INTEGRITY STATEMENT

Die bestehende Architektur ist vollständig kompatibel mit dem geplanten Finanzierungsmodul. Die Zone-Trennung (1/2/3) bleibt intakt. Die DMS-Pipeline (Upload → Storage → Worker → JSON) ist bereits implementiert und kann für Finanzierungsdokumente genutzt werden. Die einzigen Erweiterungen betreffen (1) eine neue Rolle `finance_manager` im bestehenden Enum, (2) eine neue Tabelle `finance_mandates` für die Zone-1-Inbox, (3) eine neue Tabelle `applicant_profiles` für die strukturierte Selbstauskunft, und (4) einen zusätzlichen Storage-Trigger für Finanzierungsordner. Alle Änderungen sind additiv und gefährden keine bestehenden Funktionen. Die SoT-Regel (Draft in Zone 2 → Submission in Zone 1 → Delegation → Annahme in Zone 2 MOD-11) kann vollständig umgesetzt werden.

**Freigabe für STEP 1: ✅ ERTEILT**

---

## DATENMODELL-ERWEITERUNG

### Neue Tabellen (12 Tabellen)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ZONE 2: MOD-07 (Kunden-Modul "Finanzierungen")                     │
├─────────────────────────────────────────────────────────────────────┤
│  applicant_profiles          ← Strukturierte Selbstauskunft        │
│  applicant_income_records    ← Einkommensnachweise (Person)         │
│  applicant_assets            ← Vermögenswerte                       │
│  applicant_liabilities       ← Verbindlichkeiten                    │
│  applicant_documents         ← Dokument-Zuordnung zur Person        │
│  finance_requests            ← Draft-Antrag (Zone 2 SoT)            │
│  finance_request_objects     ← Objektzuordnung (Bestand/Favorites)  │
│  credibility_flags           ← Mismatch/Missing-Warnungen           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ZONE 1: FutureRoom (Admin-Modul)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  finance_mandates            ← Eingereichte Mandate (Zone 1 SoT)    │
│  finance_bank_contacts       ← Banken-Ordner (nur Finanzpartner)    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ZONE 2: MOD-11 (Manager-Modul "Finanzierungsmanager")              │
├─────────────────────────────────────────────────────────────────────┤
│  future_room_cases           ← Angenommene Fälle (Zone 2 SoT)       │
│  future_room_submissions     ← Bank-Einreichungen                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Kerntabelle: `applicant_profiles`

```sql
CREATE TABLE applicant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  finance_request_id UUID REFERENCES finance_requests(id),
  
  -- Typ
  profile_type TEXT NOT NULL DEFAULT 'private', -- private | entrepreneur
  party_role TEXT NOT NULL DEFAULT 'primary', -- primary | co_applicant
  
  -- Person A: Identität
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  birth_place TEXT,
  nationality TEXT,
  marital_status TEXT,
  address_street TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  phone TEXT,
  email TEXT,
  id_document_type TEXT, -- PA | RP
  id_document_number TEXT,
  id_document_valid_until DATE,
  tax_id TEXT,
  iban TEXT,
  
  -- Haushalt
  adults_count INT,
  children_count INT,
  children_ages TEXT,
  child_support_obligation BOOLEAN DEFAULT false,
  child_support_amount_monthly NUMERIC(12,2),
  child_benefit_monthly NUMERIC(12,2),
  other_regular_income_monthly NUMERIC(12,2),
  other_income_description TEXT,
  
  -- Beschäftigung (Privat)
  employer_name TEXT,
  employer_location TEXT,
  employer_industry TEXT,
  employment_type TEXT, -- unbefristet | befristet | beamter | selbststaendig
  position TEXT,
  employed_since DATE,
  probation_until DATE,
  net_income_monthly NUMERIC(12,2),
  bonus_yearly NUMERIC(12,2),
  
  -- Unternehmer-Erweiterung
  company_name TEXT,
  company_legal_form TEXT,
  company_address TEXT,
  company_founded DATE,
  company_register_number TEXT,
  company_vat_id TEXT,
  company_industry TEXT,
  company_employees INT,
  company_ownership_percent NUMERIC(5,2),
  company_managing_director BOOLEAN,
  
  -- Ausgaben
  current_rent_monthly NUMERIC(12,2),
  living_expenses_monthly NUMERIC(12,2),
  car_leasing_monthly NUMERIC(12,2),
  health_insurance_monthly NUMERIC(12,2),
  other_fixed_costs_monthly NUMERIC(12,2),
  
  -- Vermögen
  bank_savings NUMERIC(14,2),
  securities_value NUMERIC(14,2),
  building_society_value NUMERIC(14,2),
  life_insurance_value NUMERIC(14,2),
  other_assets_value NUMERIC(14,2),
  other_assets_description TEXT,
  
  -- Finanzierungswunsch
  purpose TEXT, -- eigennutzung | kapitalanlage | neubau | modernisierung | umschuldung
  object_address TEXT,
  object_type TEXT,
  purchase_price NUMERIC(14,2),
  ancillary_costs NUMERIC(14,2),
  modernization_costs NUMERIC(14,2),
  planned_rent_monthly NUMERIC(12,2),
  rental_status TEXT, -- vermietet | leer | teil
  equity_amount NUMERIC(14,2),
  equity_source TEXT,
  loan_amount_requested NUMERIC(14,2),
  fixed_rate_period_years INT,
  repayment_rate_percent NUMERIC(5,2),
  max_monthly_rate NUMERIC(12,2),
  
  -- Selbsterklärungen
  schufa_consent BOOLEAN DEFAULT false,
  no_insolvency BOOLEAN DEFAULT false,
  no_tax_arrears BOOLEAN DEFAULT false,
  data_correct_confirmed BOOLEAN DEFAULT false,
  
  -- Meta
  completion_score INT DEFAULT 0,
  last_synced_from_finapi_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### SoT-Wanderung Tabellen

```sql
-- Zone 2: Draft (Kunde)
CREATE TABLE finance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  public_id TEXT,
  status TEXT DEFAULT 'draft', -- draft | collecting | ready | submitted
  
  -- Objektquelle
  object_source TEXT, -- mod04_property | mod08_favorite | custom
  property_id UUID REFERENCES properties(id),
  listing_id UUID,
  custom_object_data JSONB,
  
  -- Bonitätsordner
  storage_folder_id UUID REFERENCES storage_nodes(id),
  
  created_by UUID,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Zone 1: Nach Einreichung
CREATE TABLE finance_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  finance_request_id UUID UNIQUE NOT NULL REFERENCES finance_requests(id),
  public_id TEXT,
  
  status TEXT DEFAULT 'new', -- new | triage | delegated | accepted | rejected
  priority INT DEFAULT 0,
  
  -- Delegation
  assigned_manager_id UUID,
  delegated_at TIMESTAMPTZ,
  delegated_by UUID,
  accepted_at TIMESTAMPTZ,
  
  -- Audit
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Zone 2: Nach Manager-Annahme
CREATE TABLE future_room_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_tenant_id UUID NOT NULL REFERENCES organizations(id),
  finance_mandate_id UUID UNIQUE NOT NULL REFERENCES finance_mandates(id),
  
  status TEXT DEFAULT 'active', -- active | missing_docs | ready_to_submit | submitted | closed
  
  -- Bank-Einreichung
  target_bank_id UUID,
  submitted_to_bank_at TIMESTAMPTZ,
  bank_response TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ROUTEN-STRUKTUR

### Zone 1: Admin Portal (Erweiterung)

```text
/admin/futureroom              ← NEU: FutureRoom Dashboard
/admin/futureroom/mandate      ← Mandate-Inbox
/admin/futureroom/managers     ← Finance Manager Verwaltung
/admin/futureroom/banken       ← Bankkontakte-Ordner
/admin/futureroom/provision    ← Provision/Consent
```

### Zone 2: Portal (Erweiterung)

```text
/portal/finanzierungen              ← MOD-07 Dashboard (bestehend)
/portal/finanzierungen/neu          ← Neuer Antrag
/portal/finanzierungen/:id          ← Antrag Detail
/portal/finanzierungen/:id/selbstauskunft  ← Selbstauskunft
/portal/finanzierungen/:id/dokumente       ← Dokumente
/portal/finanzierungen/:id/objekt          ← Objektwahl
/portal/finanzierungen/:id/status          ← Status (Spiegel)

/portal/finanzierungsmanager              ← MOD-11 (NEU)
/portal/finanzierungsmanager/how-it-works ← Menü 1
/portal/finanzierungsmanager/selbstauskunft/:id ← Menü 2
/portal/finanzierungsmanager/einreichen/:id    ← Menü 3
/portal/finanzierungsmanager/status/:id        ← Menü 4
```

### Zone 3: Websites (Erweiterung)

```text
/futureroom              ← Website 04: Future Room
/futureroom/bonitat      ← Bonitätscheck Entry
/futureroom/karriere     ← Manager-Bewerbung
/futureroom/faq          ← FAQ
```

---

## DOKUMENTENPIPELINE: SELBSTAUSKUNFT-BEFÜLLUNG

### Worker-Erweiterung: Feld-Mapping

```text
DOKUMENT-TYP              → ZIEL-FELDER
──────────────────────────────────────────────────────────
Gehaltszettel             → net_income_monthly, employer_name, 
                            employed_since, position
Kontoauszug               → bank_savings (Saldo), 
                            FinAPI: income_pattern_detected
Arbeitsvertrag            → employment_type, probation_until
Personalausweis           → first_name, last_name, birth_date,
                            id_document_number, id_document_valid_until
Steuerbescheid            → tax_id, verified_income
BWA                       → company revenue (Unternehmer)
Mietvertrag               → planned_rent_monthly, tenant_info
Grundbuchauszug           → property ownership verification
Energieausweis            → property energy data
```

### Confidence-Gate Logik

```typescript
interface ExtractionResult {
  field: string;
  value: any;
  confidence: number; // 0.0 - 1.0
  source_page: number;
  source_document_id: string;
}

// High Confidence (>0.85): Auto-Prefill, Auto-Attach
// Medium Confidence (0.5-0.85): Prefill mit Warnung
// Low Confidence (<0.5): Needs Review Queue
```

---

## BONITÄTSWÄCHTER: MISMATCH-LOGIK

```sql
CREATE TABLE credibility_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  applicant_profile_id UUID NOT NULL REFERENCES applicant_profiles(id),
  
  flag_type TEXT NOT NULL, -- income_mismatch | missing_doc | expired_doc | 
                           -- period_gap | employer_mismatch
  severity TEXT DEFAULT 'warn', -- info | warn | block
  
  field_name TEXT,
  declared_value TEXT,
  detected_value TEXT,
  source_document_id UUID REFERENCES documents(id),
  
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Beispiel-Flags

| Flag-Typ | Trigger | Severity | Beispiel |
|----------|---------|----------|----------|
| `income_mismatch` | Selbstauskunft != Gehaltszettel/FinAPI | warn | "3.200€ angegeben, 2.700€ erkannt" |
| `missing_doc` | Pflichtdokument fehlt | warn | "Gehaltszettel fehlt" |
| `expired_doc` | Dokument älter als 3 Monate | info | "Kontoauszug älter als 90 Tage" |
| `employer_mismatch` | Arbeitgeber abweichend | warn | "Arbeitsvertrag: ABC GmbH, Gehaltszettel: XYZ AG" |

---

## STORAGE: BONITÄTSORDNER-BLUEPRINT

### Trigger: Ordnerstruktur bei Finance-Request

```sql
CREATE OR REPLACE FUNCTION create_finance_request_folders()
RETURNS trigger AS $$
DECLARE
  root_id uuid;
  privat_id uuid;
  firma_id uuid;
BEGIN
  -- Haupt-Ordner
  INSERT INTO storage_nodes (tenant_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, 'Finanzierung ' || NEW.public_id, 'folder', true)
  RETURNING id INTO root_id;
  
  UPDATE finance_requests SET storage_folder_id = root_id WHERE id = NEW.id;
  
  -- Privat-Ordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, root_id, 'Privat', 'folder', true)
  RETURNING id INTO privat_id;
  
  -- Privat-Unterordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES 
    (NEW.tenant_id, privat_id, 'Identität', 'folder', true),
    (NEW.tenant_id, privat_id, 'Einkommen', 'folder', true),
    (NEW.tenant_id, privat_id, 'Vermögen', 'folder', true),
    (NEW.tenant_id, privat_id, 'Verpflichtungen', 'folder', true),
    (NEW.tenant_id, privat_id, 'Sonstiges', 'folder', true);
  
  -- Firma-Ordner (falls Unternehmer)
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, root_id, 'Firma', 'folder', true)
  RETURNING id INTO firma_id;
  
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES 
    (NEW.tenant_id, firma_id, 'BWA-SuSa', 'folder', true),
    (NEW.tenant_id, firma_id, 'Jahresabschlüsse', 'folder', true),
    (NEW.tenant_id, firma_id, 'Steuern', 'folder', true);
  
  -- Objekt-Ordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, root_id, 'Objektunterlagen', 'folder', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## IMPLEMENTIERUNGS-REIHENFOLGE

### Phase 1: Datenmodell (Migration)

1. Rolle `finance_manager` zum Enum hinzufügen
2. Tabellen erstellen: `applicant_profiles`, `finance_requests`, `finance_mandates`, `future_room_cases`, `credibility_flags`
3. Storage-Trigger für Finanzierungsordner
4. RLS-Policies

### Phase 2: MOD-07 Kern-UI

1. Selbstauskunft-Formular (Privat + Unternehmer)
2. Dokument-Upload mit JSON-Pipeline
3. Objektwahl (MOD-04 / MOD-08 / Custom)
4. Einreichen-Flow

### Phase 3: Zone 1 FutureRoom

1. Admin-Sidebar erweitern
2. Mandate-Inbox UI
3. Manager-Zuordnung
4. Bankkontakte-Ordner

### Phase 4: MOD-11 Finanzierungsmanager

1. 4-Menü-Struktur
2. Selbstauskunft-Ansicht (read/edit)
3. Einreichen an Bank
4. Status-Spiegel

### Phase 5: Bonitätswächter

1. FinAPI-Integration (konzeptionell)
2. Mismatch-Detection
3. Missing-Docs-Checkliste
4. Credibility-Flags UI

### Phase 6: Zone 3 Website 04

1. Future Room Layout
2. Lite-Entry (eingeschränkt)
3. Armstrong AI-UX

---

## TECHNISCHE ABHÄNGIGKEITEN

| Komponente | Abhängigkeit | Status |
|------------|--------------|--------|
| `sot-document-parser` | Lovable AI | ✅ Vorhanden |
| `useSmartUpload` | Storage + Parser | ✅ Vorhanden |
| `documents` Tabelle | DMS | ✅ Vorhanden |
| `storage_nodes` Tabelle | DMS | ✅ Vorhanden |
| `user_consents` Tabelle | Backbone | ✅ Vorhanden |
| `audit_events` Tabelle | Backbone | ✅ Vorhanden |
| `jobs` Tabelle | Worker | ✅ Vorhanden |
| `connectors` Tabelle | User-Data | ✅ Vorhanden |

---

## ZUSAMMENFASSUNG

Der Plan ist **vollständig kompatibel** mit der bestehenden Architektur. Alle Erweiterungen sind additiv:

- **4 neue Tabellen** für Selbstauskunft und SoT-Wanderung
- **1 Enum-Erweiterung** für `finance_manager` Rolle
- **1 Storage-Trigger** für Finanzierungsordner
- **Zone 1 Erweiterung** mit `/admin/futureroom`
- **Zone 2 Erweiterung** mit MOD-11 `/portal/finanzierungsmanager`
- **Zone 3 Erweiterung** mit Website 04 `/futureroom`

Die bestehende JSON-Pipeline (`sot-document-parser` + Worker) wird für die Dokumenten-Extraktion und Selbstauskunft-Befüllung genutzt. Keine Umbaumaßnahmen erforderlich.
