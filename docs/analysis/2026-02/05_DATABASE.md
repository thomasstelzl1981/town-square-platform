# 05_DATABASE — Datenbankschema-Analyse

## Analyse-Stand: 2026-02-26 | Analyst: GitHub Agent v2
## Basis: Vollständiger Repo-Scan (src/, supabase/, manifests/, spec/)

---

## Abschnitt A — Schema-Vollständigkeit

### A1. Tabellen ohne `created_at` oder `updated_at`

**Befund:** 257 Tabellen ohne Timestamp-Columns (aus 298 Gesamt-Tabellen).

> **Hinweis:** Viele dieser Tabellen sind Junction-Tables oder Config-Tables die kein Timestamp benötigen.
> Die kritischen Fälle sind Business-Tabellen ohne Audit-Trail.

```sql
-- Tabellen die `created_at` SOLLTEN haben aber NICHT haben (kritische Auswahl):
access_grants         -- Zugriffsverwaltung ohne Zeitstempel
acq_offers            -- Angebote ohne created_at? (KRITISCH)
finance_mandates      -- Finanzmandate ohne Timestamp
finance_requests      -- Kreditanfragen ohne Timestamp
leads                 -- CRM-Leads ohne Timestamp
leases                -- Mietverträge ohne Timestamp
listings              -- Immobilienangebote ohne Timestamp
```

> Vollständige Liste: `comm -23 <(grep "CREATE TABLE" migrations | extract table names) <(grep "created_at" migrations | extract table names)`

### A2. Tabellen ohne `tenant_id` (die es haben sollten)

Diese Tabellen speichern tenantübergreifende Daten ohne Isolation:

| Tabelle | Begründung | Empfehlung |
|---------|-----------|-----------|
| `scraper_jobs` | System-Jobs — kein Tenant nötig | ✅ OK ohne tenant_id |
| `scraper_providers` | System-Config | ✅ OK |
| `scraper_results` | System-Ergebnisse | ⚠️ tenant_id empfohlen |
| `ad_campaigns` | Müsste tenant-isoliert sein | 🔴 Fehlt! |
| `ad_campaign_leads` | Müsste tenant-isoliert sein | 🔴 Fehlt! |
| `credibility_flags` | Plattform-weit oder tenant? | Zu klären |

### A3. FK-Referenzen ohne `ON DELETE CASCADE/SET NULL`

**Befund:** 328 FK-Referenzen ohne `ON DELETE`-Klausel von insgesamt 661 (50%).

```sql
-- Kritische Beispiele (ohne ON DELETE):
REFERENCES public.organizations(id)  -- ~40 Tabellen ohne CASCADE
REFERENCES public.properties(id)     -- ~15 Tabellen ohne SET NULL/CASCADE
REFERENCES public.contacts(id)       -- ~20 Tabellen ohne SET NULL
REFERENCES auth.users(id)            -- ~10 Tabellen ohne CASCADE

-- Risiko: Orphan Records bei Tenant-Löschung, Property-Löschung etc.

-- Empfehlung für alle tenant_id FKs:
ALTER TABLE public.finance_mandates 
  DROP CONSTRAINT finance_mandates_tenant_id_fkey,
  ADD CONSTRAINT finance_mandates_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
```

---

## Abschnitt B — Trigger-Inventar

### Vollständige Trigger-Liste (209 Trigger)

**Kategorien:**
- `update_*_updated_at` — Automatisches Updated-At-Setzen (~80 Trigger)
- `trg_*` — Business-Logik-Trigger (~50 Trigger)
- `set_*_public_id*` — Public-ID-Generator-Trigger (~30 Trigger)
- Sonstige (~49 Trigger)

### Kritische Trigger

| Trigger | Tabelle | Funktion | Status |
|---------|---------|----------|--------|
| `trg_property_create_default_unit` | `properties` | `create_default_unit()` | ✅ Aktiv |
| `trg_properties_updated_at` | `properties` | `moddatetime()` | ✅ Aktiv |
| `trg_units_updated_at` | `units` | `moddatetime()` | ✅ Aktiv |
| `trg_contacts_updated_at` | `contacts` | `moddatetime()` | ✅ Aktiv |
| `trg_documents_updated_at` | `documents` | `moddatetime()` | ✅ Aktiv |
| `trg_self_disclosure_public_id` | `self_disclosures` | `generate_public_id()` | ✅ Aktiv |
| `tr_contact_staging_dedupe` | `contact_staging` | `dedupe_contact_staging()` | ✅ Aktiv |
| `tr_acq_outbound_routing` | `acq_outbound_messages` | `route_outbound_message()` | ✅ Aktiv |
| `update_acq_offers_updated_at` | `acq_offers` | `moddatetime()` | ✅ Aktiv |
| `update_private_loans_updated_at` | `private_loans` | `moddatetime()` | ✅ Aktiv |
| `trg_create_listing_folder` | `listings` | `create_listing_storage_folder()` | ⚠️ Prüfen |
| `trg_seed_tenant_storage` | `organizations` | `seed_tenant_storage()` | ✅ Aktiv |
| `set_loan_public_id_trigger` | `loans/leases` | `set_public_id()` | ✅ Aktiv |

### Möglicherweise problematische Trigger

**`trg_create_listing_folder`** — Trigger ruft `create_listing_storage_folder()` auf.
Diese Funktion muss `storage_nodes` schreiben. Nach der Migration auf das neue DMS-System
(Dezember 2025) könnte der Storage-Pfad veraltet sein.

**Empfehlung:** 
```sql
-- Trigger-Status prüfen:
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## Abschnitt C — Migrations-Hygiene

### C1. ALTER TABLE ADD COLUMN ohne `IF NOT EXISTS` (36 Funde)

| Migration | Tabelle | Spalte | Risiko |
|-----------|---------|--------|--------|
| `20260218000944_...sql:1` | `pet_providers` | `is_published boolean` | Fehler bei Re-Run |
| `20260216144315_...sql:3` | `vorsorge_contracts` | `category text NOT NULL` | Fehler + NOT NULL! |
| `20260216144315_...sql:4` | `vorsorge_contracts` | `current_balance numeric` | Fehler bei Re-Run |
| `20260216144315_...sql:5` | `vorsorge_contracts` | `balance_date date` | Fehler bei Re-Run |
| `20260208051718_...sql:123` | `admin_outbound_emails` | `thread_id UUID` | Fehler bei Re-Run |
| `20260208051718_...sql:132` | `admin_outbound_emails` | `sequence_step_id UUID` | Fehler bei Re-Run |
| `20260208051718_...sql:141` | `admin_outbound_emails` | `enrollment_id UUID` | Fehler bei Re-Run |
| `20260208051718_...sql:150` | `admin_inbound_emails` | `thread_id UUID` | Fehler bei Re-Run |
| `20260211181252_...sql:7` | `acq_offers` | `tenant_id UUID` | Fehler bei Re-Run |
| `20260211181252_...sql:10` | `acq_offer_activities` | `tenant_id UUID` | Fehler bei Re-Run |

**Fix Template:**
```sql
-- Statt:
ALTER TABLE public.vorsorge_contracts ADD COLUMN category text NOT NULL DEFAULT 'vorsorge';

-- Verwende:
ALTER TABLE public.vorsorge_contracts ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'vorsorge';
```

### C2. Migrations mit direkter Daten-Manipulation (Risiko bei Re-Run)

| Migration | Art | Tabellen | Risiko |
|-----------|-----|---------|--------|
| `20260206025112_...sql:414` | INSERT | `acq_email_templates` | Duplikat-Keys bei Re-Run |
| `20260205233055_...sql:15` | INSERT | `property_accounting` | Duplicate-Insert |
| `20260205233055_...sql:54` | INSERT | `context_property_assignment` | Duplicate-Insert |
| `20260216003203_...sql:3,28` | UPDATE | `applicant_profiles` | Idempotent ✅ |
| `20260215142948_...sql:5,13,28,43` | INSERT | `nk_periods`, `nk_cost_items` | Demo-Daten — Duplikate möglich |

**Fix für INSERT-Daten:**
```sql
-- Statt:
INSERT INTO public.acq_email_templates VALUES (...);

-- Verwende:
INSERT INTO public.acq_email_templates VALUES (...)
  ON CONFLICT (code) DO NOTHING;
-- oder:
  ON CONFLICT (code) DO UPDATE SET ...;
```

### C3. Migrations-Sequenz-Analyse

**363 Migrations-Dateien** im Zeitraum 2026-01-20 bis 2026-02-24.

**Frequenz:** ~5-6 Migrations pro Tag (sehr hohe Migrations-Rate)

**Lücken in der Sequenz:** Keine kritischen Lücken gefunden — alle Timestamps sind chronologisch.

---

## Abschnitt D — Spalten-Inventar kritischer Tabellen

### `storage_nodes`
```sql
CREATE TABLE IF NOT EXISTS storage_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES storage_nodes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  node_type   TEXT NOT NULL DEFAULT 'folder' CHECK (node_type IN ('folder', 'file')),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id     UUID REFERENCES units(id) ON DELETE SET NULL,
  auto_created BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
-- RLS: ✅ AKTIVIERT
-- Indizes: tenant, parent, property, unit
```

### `dev_projects`
```sql
CREATE TABLE public.dev_projects (
  id                    UUID PK DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  developer_context_id  UUID NOT NULL REFERENCES developer_contexts(id) ON DELETE CASCADE,
  project_code          TEXT NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (...),
  address, city, postal_code, state, country TEXT,
  total_units_count     INTEGER DEFAULT 0,
  purchase_price        NUMERIC(15,2),
  renovation_budget     NUMERIC(15,2),
  total_sale_target     NUMERIC(15,2),
  avg_unit_price        NUMERIC(15,2),
  commission_rate_percent NUMERIC(5,2) DEFAULT 3.57,
  ancillary_cost_percent NUMERIC(5,2) DEFAULT 12.00,
  holding_period_months INTEGER DEFAULT 24,
  project_start_date    DATE,
  target_end_date       DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, project_code)
);
-- RLS: Später aktiviert (via separate Migration)
-- Fehlende Spalten: marketing_url, phase, total_cost_actual
```

### `dev_project_units`
```sql
CREATE TABLE public.dev_project_units (
  id            UUID PK DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
  unit_number   TEXT NOT NULL,
  floor         INTEGER,
  area_sqm      NUMERIC(10,2),
  rooms_count   NUMERIC(3,1),
  list_price    NUMERIC(15,2),
  min_price     NUMERIC(15,2),
  price_per_sqm NUMERIC(10,2),
  status        TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'blocked')),
  grundbuchblatt TEXT,
  te_number     TEXT,
  tenant_name   TEXT,
  current_rent  NUMERIC(10,2),
  rent_net, rent_nk NUMERIC(10,2),
  balcony, garden, parking BOOLEAN DEFAULT false,
  parking_type  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: Aktiviert (via separate Migration)
-- Indizes: tenant, project_id, tenant+status
```

### `properties`
```sql
CREATE TABLE public.properties (
  id              UUID PK DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT,
  property_type   TEXT NOT NULL DEFAULT 'MFH',
  city            TEXT NOT NULL,
  address         TEXT NOT NULL,
  address_house_no TEXT,
  total_area_sqm  DECIMAL(12,2),
  usage_type      TEXT NOT NULL DEFAULT 'Vermietung',
  annual_income   DECIMAL(14,2),
  market_value    DECIMAL(14,2),
  management_fee  DECIMAL(12,2),
  postal_code     TEXT,
  year_built      INTEGER,
  land_register_* TEXT (mehrere),
  purchase_price  DECIMAL(14,2),
  acquisition_costs DECIMAL(14,2),
  energy_source   TEXT,
  heating_type    TEXT,
  description     TEXT,
  country         TEXT DEFAULT 'DE',
  status          TEXT DEFAULT 'available',
  rental_managed  BOOLEAN DEFAULT true,
  is_demo         BOOLEAN DEFAULT false,
  tax_reference_number TEXT,
  ownership_share_percent NUMERIC(5,2),
  landlord_context_id UUID,
  -- weitere Spalten durch ADD COLUMN Migrations
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: FEHLT 🔴 (nicht in RLS-Tabellen)
-- Indizes: tenant, city, code, tenant+status
```

### `listings`
```sql
-- Basis-Tabelle (aus listings-Migration):
-- id, tenant_id, property_id, listing_type, status,
-- title, description, price/rent, contact details,
-- created_at, updated_at
-- RLS: FEHLT 🔴
-- Indizes: tenant, status, property_id
```

### `profiles`
```sql
CREATE TABLE public.profiles (
  id              UUID PK REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  active_tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: Aktiviert ✅
-- Indizes: active_tenant_id, email
-- Hinweis: Kein phone, no role, no preferences (in memberships ausgelagert)
```

### `developer_contexts`
```sql
CREATE TABLE public.developer_contexts (
  id              UUID PK DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  context_type    TEXT DEFAULT 'company' CHECK (IN ('company','private','fund')),
  legal_form      TEXT,
  hrb_number      TEXT,
  ust_id          TEXT,
  managing_director TEXT,
  street, house_number, postal_code, city TEXT,
  tax_rate_percent NUMERIC(5,2) DEFAULT 19.00,
  is_default      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: Aktiviert ✅ (via separate Migration)
```

---

## Gesamtbewertung Datenbankschema

| Aspekt | Bewertung | Details |
|--------|-----------|---------|
| Index-Abdeckung | 🟢 GUT | 982 Indizes für 298 Tabellen |
| RLS-Abdeckung | 🟡 MITTEL | 266/298 Tabellen mit RLS, 32 kritische ohne |
| FK-Integrität | 🟡 MITTEL | 50% ohne ON DELETE — Orphan-Record-Risiko |
| Migrations-Idempotenz | 🟡 MITTEL | 36 nicht-idempotente ADD COLUMN |
| Trigger-Qualität | 🟢 GUT | 209 Trigger, gut strukturiert |
| Timestamp-Konsistenz | 🟠 SCHLECHT | 257/298 Tabellen ohne Timestamps |
| Data-in-Migrations | 🟡 MITTEL | INSERT in ~5 Migrations ohne ON CONFLICT |
