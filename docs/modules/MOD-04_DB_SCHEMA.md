# MOD-04 — Database Schema

> **Version**: 1.0  
> **Datum**: 2026-01-25  
> **Status**: SPEC READY (nicht migriert)

---

## 1. Existierende Tabellen

Diese Tabellen existieren bereits und sind MOD-04 zugeordnet:

| Tabelle | Zweck | Status |
|---------|-------|--------|
| `properties` | Property-Stammdaten | ✅ Produktiv |
| `units` | Einheiten-Struktur | ✅ Produktiv |
| `property_features` | Feature-Flags (sale, msv, etc.) | ✅ Produktiv |
| `property_financing` | Finanzierungsdaten | ✅ Produktiv |

---

## 2. Neue Tabellen — Phase 1 (Kontexte + Bewertung)

### 2.1 landlord_contexts

Vermieter-/Entity-Kontexte für Aggregation und Reporting.

```sql
CREATE TABLE landlord_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  public_id text UNIQUE NOT NULL,
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('PRIVATE', 'BUSINESS')),
  accounting_regime text NOT NULL CHECK (accounting_regime IN ('VV', 'FIBU')),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, name)
);

-- RLS
ALTER TABLE landlord_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view contexts"
  ON landlord_contexts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage contexts"
  ON landlord_contexts FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
  ));

-- Trigger für public_id
CREATE TRIGGER set_landlord_context_public_id
  BEFORE INSERT ON landlord_contexts
  FOR EACH ROW
  EXECUTE FUNCTION generate_public_id_trigger('LC');

-- Trigger für updated_at
CREATE TRIGGER update_landlord_contexts_updated_at
  BEFORE UPDATE ON landlord_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 context_property_assignment

Zuordnung von Properties zu Kontexten (M:N).

```sql
CREATE TABLE context_property_assignment (
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  context_id uuid NOT NULL REFERENCES landlord_contexts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (tenant_id, context_id, property_id)
);

-- Composite FK für Tenant-Isolation
ALTER TABLE context_property_assignment
  ADD CONSTRAINT cpa_property_tenant_fk
  FOREIGN KEY (tenant_id, property_id)
  REFERENCES properties(tenant_id, id);

-- RLS
ALTER TABLE context_property_assignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view assignments"
  ON context_property_assignment FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage assignments"
  ON context_property_assignment FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
  ));
```

### 2.3 property_valuations

Bewertungsergebnisse (Sprengnetter etc.).

```sql
CREATE TABLE property_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  public_id text UNIQUE NOT NULL,
  
  -- Provider
  provider text NOT NULL DEFAULT 'SPRENGNETTER',
  provider_reference text, -- Externe Referenz
  
  -- Status
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'queued', 'running', 'done', 'failed', 'cancelled')),
  
  -- Input (gespeichert für Reproduzierbarkeit)
  input_data jsonb NOT NULL DEFAULT '{}',
  
  -- Ergebnis
  value_amount numeric,
  value_range_min numeric,
  value_range_max numeric,
  value_date date,
  result_json jsonb,
  
  -- Report (DMS-Link)
  report_document_id uuid REFERENCES documents(id),
  
  -- Consent
  consent_given_at timestamptz,
  consent_given_by uuid,
  consent_text text,
  
  -- Credits
  credits_estimated integer DEFAULT 0,
  credits_charged integer DEFAULT 0,
  
  -- Error Handling
  error_message text,
  retry_count integer DEFAULT 0,
  
  -- Timestamps
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Composite FK für Tenant-Isolation
ALTER TABLE property_valuations
  ADD CONSTRAINT pv_property_tenant_fk
  FOREIGN KEY (tenant_id, property_id)
  REFERENCES properties(tenant_id, id);

-- Indexes
CREATE INDEX idx_valuations_property ON property_valuations(property_id);
CREATE INDEX idx_valuations_status ON property_valuations(status);
CREATE INDEX idx_valuations_tenant_status ON property_valuations(tenant_id, status);

-- RLS
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view valuations"
  ON property_valuations FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage valuations"
  ON property_valuations FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
  ));

-- Trigger für public_id
CREATE TRIGGER set_valuation_public_id
  BEFORE INSERT ON property_valuations
  FOR EACH ROW
  EXECUTE FUNCTION generate_public_id_trigger('VAL');

-- Trigger für updated_at
CREATE TRIGGER update_valuations_updated_at
  BEFORE UPDATE ON property_valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Neue Tabellen — Phase 2 (Sanierung)

### 3.1 service_cases

Sanierungsvorgänge / Service Cases.

```sql
CREATE TABLE service_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES units(id),
  
  -- IDs
  public_id text UNIQUE NOT NULL,
  tender_id text UNIQUE NOT NULL, -- T-{PUBLIC_ID}-{DATE}-{SEQ}
  
  -- Details
  category text NOT NULL CHECK (category IN (
    'sanitaer', 'elektro', 'maler', 'dach', 'fenster', 
    'gutachter', 'hausverwaltung', 'sonstiges'
  )),
  title text NOT NULL,
  description text,
  
  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'offers_received', 'decision_pending', 
    'awarded', 'completed', 'cancelled'
  )),
  
  -- Vergabe
  awarded_offer_id uuid, -- FK zu service_case_offers (nach Tabellenerstellung)
  awarded_at timestamptz,
  awarded_by uuid,
  
  -- Timestamps
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Composite FKs für Tenant-Isolation
ALTER TABLE service_cases
  ADD CONSTRAINT sc_property_tenant_fk
  FOREIGN KEY (tenant_id, property_id)
  REFERENCES properties(tenant_id, id);

ALTER TABLE service_cases
  ADD CONSTRAINT sc_unit_tenant_fk
  FOREIGN KEY (tenant_id, unit_id)
  REFERENCES units(tenant_id, id);

-- Indexes
CREATE INDEX idx_service_cases_property ON service_cases(property_id);
CREATE INDEX idx_service_cases_status ON service_cases(status);
CREATE INDEX idx_service_cases_tender ON service_cases(tender_id);

-- RLS
ALTER TABLE service_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view service cases"
  ON service_cases FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage service cases"
  ON service_cases FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
  ));

-- Trigger für public_id
CREATE TRIGGER set_service_case_public_id
  BEFORE INSERT ON service_cases
  FOR EACH ROW
  EXECUTE FUNCTION generate_public_id_trigger('SC');

-- Trigger für Tender-ID (custom function required)
-- CREATE TRIGGER set_service_case_tender_id ...
```

### 3.2 service_case_outbound

Versendete Ausschreibungen.

```sql
CREATE TABLE service_case_outbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_case_id uuid NOT NULL REFERENCES service_cases(id) ON DELETE CASCADE,
  
  -- Empfänger
  vendor_email text NOT NULL,
  vendor_name text,
  vendor_phone text,
  
  -- E-Mail
  subject text NOT NULL,
  body_html text NOT NULL,
  attachments jsonb DEFAULT '[]', -- [{document_id, filename}]
  
  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'confirmed', 'sent', 'delivered', 'failed'
  )),
  
  -- Resend
  resend_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  
  -- Timestamps
  created_by uuid,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_outbound_case ON service_case_outbound(service_case_id);
CREATE INDEX idx_outbound_status ON service_case_outbound(status);

-- RLS
ALTER TABLE service_case_outbound ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view outbound"
  ON service_case_outbound FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage outbound"
  ON service_case_outbound FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
  ));
```

### 3.3 service_case_offers

Eingegangene Angebote.

```sql
CREATE TABLE service_case_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_case_id uuid REFERENCES service_cases(id), -- NULL = unzugeordnet
  
  -- Absender
  vendor_email text NOT NULL,
  vendor_name text,
  
  -- Angebot
  offer_document_id uuid REFERENCES documents(id),
  amount numeric,
  currency text DEFAULT 'EUR',
  valid_until date,
  notes text,
  
  -- Inbound
  inbound_message_id text, -- Resend Inbound ID
  extracted_tender_id text, -- Aus E-Mail extrahiert
  raw_email_json jsonb,
  
  -- Status
  status text NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'assigned', 'accepted', 'rejected'
  )),
  
  -- Entscheidung
  decision_at timestamptz,
  decision_by uuid,
  decision_notes text,
  
  -- Award (wenn akzeptiert)
  award_outbound_id uuid REFERENCES service_case_outbound(id),
  
  -- Timestamps
  received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_offers_case ON service_case_offers(service_case_id);
CREATE INDEX idx_offers_status ON service_case_offers(status);
CREATE INDEX idx_offers_unassigned ON service_case_offers(tenant_id) WHERE service_case_id IS NULL;
CREATE INDEX idx_offers_tender ON service_case_offers(extracted_tender_id);

-- RLS
ALTER TABLE service_case_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view offers"
  ON service_case_offers FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Org admins can manage offers"
  ON service_case_offers FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships 
    WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
  ));
```

---

## 4. Schema-Erweiterungen

### 4.1 properties — Neue Spalte

```sql
-- NK-Vorauszahlung
ALTER TABLE properties ADD COLUMN utility_prepayment numeric;
```

### 4.2 Tender-ID Generator Function

```sql
CREATE OR REPLACE FUNCTION generate_tender_id()
RETURNS TRIGGER AS $$
DECLARE
  prop_public_id text;
  date_part text;
  seq_num integer;
  new_tender_id text;
BEGIN
  -- Property Public ID holen
  SELECT public_id INTO prop_public_id
  FROM properties
  WHERE id = NEW.property_id;
  
  -- Date Part (YYMMDD)
  date_part := to_char(now(), 'YYMMDD');
  
  -- Sequence für diesen Tag
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(tender_id, '^T-.*-\d{6}-', ''), '')::integer
  ), 0) + 1
  INTO seq_num
  FROM service_cases
  WHERE tender_id LIKE 'T-' || prop_public_id || '-' || date_part || '-%';
  
  -- Tender-ID zusammenbauen
  new_tender_id := 'T-' || prop_public_id || '-' || date_part || '-' || lpad(seq_num::text, 3, '0');
  
  NEW.tender_id := new_tender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_case_tender_id
  BEFORE INSERT ON service_cases
  FOR EACH ROW
  WHEN (NEW.tender_id IS NULL)
  EXECUTE FUNCTION generate_tender_id();
```

---

## 5. Indexes (Zusätzlich)

```sql
-- Property-Queries optimieren
CREATE INDEX idx_properties_tenant_type ON properties(tenant_id, property_type);
CREATE INDEX idx_properties_is_public ON properties(is_public_listing) WHERE is_public_listing = true;

-- Kontext-Queries
CREATE INDEX idx_cpa_context ON context_property_assignment(context_id);
CREATE INDEX idx_cpa_property ON context_property_assignment(property_id);
```

---

## 6. Migration Summary

### Phase 1 (MVP)

| Aktion | Tabelle/Spalte |
|--------|----------------|
| CREATE | `landlord_contexts` |
| CREATE | `context_property_assignment` |
| CREATE | `property_valuations` |
| ALTER | `properties.utility_prepayment` |

### Phase 2 (Sanierung)

| Aktion | Tabelle/Spalte |
|--------|----------------|
| CREATE | `service_cases` |
| CREATE | `service_case_outbound` |
| CREATE | `service_case_offers` |
| CREATE | `generate_tender_id()` Function |

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-25 | Initial erstellt |
