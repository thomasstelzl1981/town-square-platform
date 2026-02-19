

# Zone 1 Compliance Desk — MVP Implementation Plan

## Bewertung des Architekturentwurfs

Der Entwurf ist solide und passt zur bestehenden Architektur. Drei Anpassungen sind noetig:

1. **Namenskollision**: `legal_documents` existiert bereits (MOD-18 Vorsorge/Testament — Patientenverfuegung, Testamente). Die neuen Compliance-Tabellen muessen `compliance_documents` / `compliance_document_versions` heissen.
2. **Engine-Pattern**: Die bestehenden Engines (akquiseCalc, finanzierung etc.) sind **reine Berechnungsfunktionen ohne DB-Zugriff**. Eine `legalEngine.ts` mit CRUD/DB-Logik passt nicht in dieses Pattern. Stattdessen: ein **Hook** (`useComplianceEngine.ts`) fuer DB-Operationen + ein schlanker `complianceHelpers.ts` fuer reine Hilfsfunktionen (Slug-Generierung, Version-Validierung etc.).
3. **Sidebar-Gruppierung**: Neuer Eintrag `compliance` als eigene Gruppe in `AdminSidebar.tsx` (Priority 8, zwischen Operative Desks und System), mit nur einem Sidebar-Eintrag "Compliance Desk" — Sub-Navigation intern via Tabs.

## Datenmodell (7 neue Tabellen)

### 1. `compliance_company_profile` (Firmendaten SSOT)
```text
id                   UUID PK
company_name         TEXT NOT NULL
legal_form           TEXT
address_line1        TEXT
address_line2        TEXT
postal_code          TEXT
city                 TEXT
country              TEXT DEFAULT 'DE'
email                TEXT
phone                TEXT
managing_directors   JSONB
commercial_register  JSONB  -- { court, number }
vat_id               TEXT
supervisory_authority TEXT
website_url          TEXT
last_updated_at      TIMESTAMPTZ DEFAULT now()
last_updated_by      UUID REFERENCES auth.users(id)
```
Single-row Tabelle (Platform-SSOT, kein tenant_id).

### 2. `compliance_documents` (Legaltext-Katalog)
```text
id                UUID PK
doc_key           TEXT UNIQUE NOT NULL  -- z.B. 'portal_agb', 'website_privacy_kaufy'
doc_type          TEXT NOT NULL         -- Enum-artig
scope             TEXT NOT NULL         -- 'portal' | 'website' | 'internal'
brand             TEXT                  -- nullable: kaufy, futureroom, sot, acquiary, tierservice
locale            TEXT DEFAULT 'de-DE'
title             TEXT NOT NULL
description       TEXT
status            TEXT DEFAULT 'draft'  -- draft | active | deprecated | archived
current_version   INT DEFAULT 0
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### 3. `compliance_document_versions` (Versionierung)
```text
id                UUID PK
document_id       UUID REFERENCES compliance_documents(id) ON DELETE CASCADE
version           INT NOT NULL
status            TEXT DEFAULT 'draft'  -- draft | active | deprecated
content_md        TEXT NOT NULL         -- Markdown-Inhalt
change_note       TEXT
created_at        TIMESTAMPTZ DEFAULT now()
created_by        UUID REFERENCES auth.users(id)
activated_at      TIMESTAMPTZ
UNIQUE(document_id, version)
```

### 4. `compliance_bundles` (TermsGate Bundles)
```text
id                UUID PK
bundle_key        TEXT UNIQUE NOT NULL  -- z.B. 'BUNDLE_PORTAL_ONBOARDING'
title             TEXT NOT NULL
description       TEXT
status            TEXT DEFAULT 'draft'  -- draft | active
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### 5. `compliance_bundle_items` (Bundle-Zuordnung)
```text
id                UUID PK
bundle_id         UUID REFERENCES compliance_bundles(id) ON DELETE CASCADE
document_id       UUID REFERENCES compliance_documents(id)
required_version  INT
required          BOOLEAN DEFAULT true
sort_order        INT DEFAULT 0
```

### 6. `dsar_requests` (Datenauskunft Art. 15)
```text
id                UUID PK
tenant_id         UUID NOT NULL
user_id           UUID REFERENCES auth.users(id)
requester_email   TEXT NOT NULL
requester_name    TEXT
request_type      TEXT DEFAULT 'access'  -- access | rectification | portability
status            TEXT DEFAULT 'open'    -- open | verifying | in_progress | delivered | closed
due_date          DATE
notes             TEXT
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
closed_at         TIMESTAMPTZ
```

### 7. `deletion_requests` (Loeschung Art. 17)
```text
id                UUID PK
tenant_id         UUID NOT NULL
user_id           UUID REFERENCES auth.users(id)
requester_email   TEXT NOT NULL
status            TEXT DEFAULT 'open'  -- open | verifying | scheduled | executed | closed
legal_hold_reason TEXT
notes             TEXT
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
executed_at       TIMESTAMPTZ
```

### RLS-Strategie
- `compliance_company_profile`: Nur Platform Admins (via `is_platform_admin()` Check)
- `compliance_documents` + `versions`: SELECT fuer alle authentifizierten User (Legaltexte muessen lesbar sein), INSERT/UPDATE/DELETE nur Platform Admins
- `compliance_bundles` + `items`: Gleich wie documents
- `dsar_requests` / `deletion_requests`: tenant_id-basiert via `get_user_tenant_id()` + Platform Admin full access

## Route-Struktur

### Manifest-Eintrag (routesManifest.ts)
```text
// Compliance Desk
{ path: "compliance", component: "ComplianceDeskRouter", title: "Compliance Desk" },
```

Ein einzelner Manifest-Eintrag. Die 10 Sub-Seiten werden intern via **Tab-Navigation** (wie Armstrong, FutureRoom) geloest — nicht als separate Manifest-Routen.

### AdminSidebar.tsx Anpassungen
```text
GROUP_CONFIG += 'compliance': { label: 'Compliance', priority: 8 }
getGroupKey: path === 'compliance' => 'compliance'
ICON_MAP: 'ComplianceDeskRouter': Shield (oder Scale)
```

## Dateistruktur (neue Dateien)

```text
src/pages/admin/compliance/
  ComplianceDeskRouter.tsx        -- Hauptseite mit Tab-Navigation (10 Tabs)
  ComplianceOverview.tsx          -- Tab 1: Dashboard + Go-Live-Checklist
  ComplianceCompanyProfile.tsx    -- Tab 2: Firmendaten-Formular
  CompliancePublicPages.tsx       -- Tab 3: Website-Legaltexte (pro Brand)
  CompliancePortalTerms.tsx       -- Tab 4: Portal AGB/Privacy
  ComplianceBundles.tsx           -- Tab 5: TermsGate Bundle Editor
  ComplianceAgreements.tsx        -- Tab 6: Wrapper um bestehende Agreements.tsx
  ComplianceConsents.tsx          -- Tab 7: consent_templates UI
  ComplianceDSAR.tsx              -- Tab 8: DSAR Case Management
  ComplianceDeletion.tsx          -- Tab 9: Deletion Case Management
  ComplianceAuditSecurity.tsx     -- Tab 10: Security ToDos + Ledger Viewer
  useComplianceDocuments.ts       -- Hook: CRUD fuer compliance_documents + versions
  useComplianceCompany.ts         -- Hook: CRUD fuer compliance_company_profile
  useComplianceCases.ts           -- Hook: CRUD fuer dsar_requests + deletion_requests
  useComplianceBundles.ts         -- Hook: CRUD fuer compliance_bundles + items

src/lib/complianceHelpers.ts      -- Pure Hilfsfunktionen (kein DB-Zugriff)
```

## Bestehende Strukturen (NICHT aendern)

| Bestehendes | Aktion |
|-------------|--------|
| `agreement_templates` (11 Eintraege) | Bleibt unveraendert. Tab 6 zeigt bestehende Agreements.tsx als Embed/Wrapper |
| `consent_templates` (leer) | Bleibt. Tab 7 baut darauf auf (endlich UI dafuer) |
| `user_consents` (9 Eintraege) | Bleibt. Read-only-Ansicht in Tab 7 |
| `data_event_ledger` | Wird erweitert um `legal.*` Event-Typen in der Whitelist |
| `TermsGatePanel` | Bleibt unveraendert. Spaeter Bundle-Integration |
| `legal_documents` (MOD-18) | Bleibt unveraendert (Vorsorge/Testament) |

## Ledger-Events (Whitelist-Erweiterung)

Neue Event-Typen fuer `log_data_event()`:
```text
legal.company.updated
legal.document.created
legal.document.version_created
legal.document.activated
legal.document.deprecated
legal.bundle.created
legal.bundle.activated
legal.bundle.updated
legal.dsar.created
legal.dsar.status_changed
legal.dsar.closed
legal.deletion.created
legal.deletion.status_changed
legal.deletion.executed
```

## MVP Doc-Types (Seed-Daten)

Bei Migration werden 15+ Platzhalter-Dokumente in `compliance_documents` angelegt (nur Katalog-Eintraege, keine Inhalte):

| doc_key | doc_type | scope | brand |
|---------|----------|-------|-------|
| portal_agb | portal_agb | portal | null |
| portal_privacy | portal_privacy | portal | null |
| portal_security_notice | portal_security_notice | portal | null |
| website_imprint_kaufy | website_imprint | website | kaufy |
| website_privacy_kaufy | website_privacy | website | kaufy |
| website_imprint_futureroom | website_imprint | website | futureroom |
| website_privacy_futureroom | website_privacy | website | futureroom |
| website_imprint_sot | website_imprint | website | sot |
| website_privacy_sot | website_privacy | website | sot |
| website_imprint_acquiary | website_imprint | website | acquiary |
| website_privacy_acquiary | website_privacy | website | acquiary |
| website_imprint_tierservice | website_imprint | website | tierservice |
| website_privacy_tierservice | website_privacy | website | tierservice |
| internal_retention_policy | internal_retention_policy | internal | null |
| internal_subprocessor_register | internal_subprocessor_register | internal | null |

Plus 1 MVP-Bundle:
```text
BUNDLE_PORTAL_ONBOARDING → portal_agb (required) + portal_privacy (required)
```

## UI-Design je Tab (Kurzfassung)

1. **Overview**: KPI-Cards (Dokumente aktiv, Cases offen, Checklist-Status) + Go-Live-Checklist mit gruenen/roten Haken
2. **Company Profile**: Single-Form (alle Felder), Save-Button, "Impressum-Preview" Collapsible
3. **Public Pages**: Matrix-Tabelle (Brands x Typen), Status-Badges, Inline-Editor mit Markdown-Textarea
4. **Portal Terms**: Wie Public Pages, aber ohne Brand-Dimension
5. **Bundles**: Bundle-Liste + Bundle-Editor (Dokumente zuordnen, Reihenfolge, required-Toggle)
6. **Agreements**: Einbettung der bestehenden Agreements.tsx (kein Neubau)
7. **Consents**: consent_templates CRUD (Code, Version, Body, Active-Toggle)
8. **DSAR**: Case-Liste + Status-Workflow + Notes
9. **Deletion**: Case-Liste + Status-Workflow + Legal-Hold-Flag
10. **Audit & Security**: Security-Checklist (statisch) + Ledger-Viewer (Filter: `legal.*`)

## Umsetzungsreihenfolge

1. DB-Migration: 7 Tabellen + RLS + Seed-Daten + Ledger-Whitelist-Erweiterung
2. Manifest + Sidebar: Route + Gruppierung + Icon
3. ComplianceDeskRouter.tsx: Tab-Shell mit 10 Tabs
4. Tab 2 (Company Profile): Formular + Hook — sofort testbar
5. Tab 1 (Overview): Dashboard + Checklist
6. Tabs 3+4 (Public Pages + Portal Terms): Document CRUD + Versioning
7. Tab 5 (Bundles): Bundle-Editor
8. Tab 6 (Agreements): Wrapper
9. Tab 7 (Consents): consent_templates UI
10. Tabs 8+9 (DSAR + Deletion): Case Management
11. Tab 10 (Audit): Security-Checklist + Ledger-Viewer

