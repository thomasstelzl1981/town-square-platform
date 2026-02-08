
# MOD-13 PROJEKTE — Vollständige Implementierungsplanung

## Zusammenfassung

MOD-13 wird als eigenständiges Modul für **Bauträger/Aufteiler** implementiert, das den kompletten Projekt-Lebenszyklus von der Erfassung bis zum Abverkauf und Marketing abbildet. Die Architektur orientiert sich am bewährten MOD-04-Pattern (Kontexte → Portfolio → Akte), adaptiert aber die Fachlichkeit für Mehreinheiten-Projekte mit Aufteiler-KPIs.

---

## 1. Datenbank-Architektur

### 1.1 Neue Tabellen

```text
┌─────────────────────────────────────────────────────────────────┐
│                    developer_contexts                           │
│  (analog zu landlord_contexts für Bauträger/Aufteiler)         │
├─────────────────────────────────────────────────────────────────┤
│  id, tenant_id, name, context_type (GmbH/KG/Privat)            │
│  legal_form, hrb_number, ust_id, managing_director             │
│  street, postal_code, city, tax_rate_percent                   │
│  is_default, created_at, updated_at                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       dev_projects                              │
│  (Zentrale Projekt-Entität)                                    │
├─────────────────────────────────────────────────────────────────┤
│  id, tenant_id, developer_context_id, project_code             │
│  name, description, status (draft/active/completed/archived)   │
│  address, city, postal_code, total_units_count                 │
│  purchase_price, renovation_budget, total_sale_target          │
│  avg_unit_price, commission_rate_percent                       │
│  holding_period_months, project_start_date, target_end_date    │
│  created_at, updated_at                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ dev_project_    │  │ dev_project_    │  │ dev_project_    │
│ units           │  │ calculations    │  │ documents       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 1.2 Tabellen-Definitionen

**developer_contexts**
- Verwaltet Verkäufer-Gesellschaften (analog zu `landlord_contexts`)
- Felder: `id`, `tenant_id`, `name`, `context_type`, `legal_form`, `hrb_number`, `ust_id`, `managing_director`, `street`, `house_number`, `postal_code`, `city`, `tax_rate_percent`, `is_default`, `created_at`, `updated_at`

**dev_projects**
- Kern-Projekt-Entität mit Aufteiler-spezifischen Feldern
- Felder: `id`, `tenant_id`, `developer_context_id` (FK), `project_code`, `name`, `description`, `status`, `address`, `city`, `postal_code`, `total_units_count`, `purchase_price`, `renovation_budget`, `total_sale_target`, `avg_unit_price`, `commission_rate_percent`, `holding_period_months`, `project_start_date`, `target_end_date`, `created_at`, `updated_at`

**dev_project_units**
- Einheiten innerhalb eines Projekts (nicht verknüpft mit MOD-04 units)
- Felder: `id`, `tenant_id`, `project_id` (FK), `unit_number`, `floor`, `area_sqm`, `rooms_count`, `list_price`, `min_price`, `status` (frei/reserviert/verkauft), `grundbuchblatt`, `te_number`, `tenant_name`, `current_rent`, `created_at`, `updated_at`

**dev_project_reservations**
- Reservierungen pro Einheit
- Felder: `id`, `tenant_id`, `project_id`, `unit_id` (FK), `buyer_contact_id` (FK contacts), `partner_id`, `status` (pending/confirmed/cancelled/completed), `reserved_price`, `reservation_date`, `expiry_date`, `notary_date`, `notes`, `created_at`, `updated_at`

**dev_project_calculations**
- Gespeicherte Aufteiler-Kalkulationen pro Projekt
- Felder: `id`, `project_id`, `purchase_price`, `ancillary_cost_percent`, `renovation_total`, `sales_commission_percent`, `holding_period_months`, `total_sale_proceeds`, `gross_profit`, `profit_margin_percent`, `annualized_return`, `calculated_at`

**dev_project_documents**
- Projekt-Dokumente (global + pro Einheit)
- Felder: `id`, `tenant_id`, `project_id`, `unit_id` (nullable), `document_id` (FK documents), `doc_type`, `created_at`

---

## 2. Routen-Struktur & Navigation

### 2.1 URL-Schema

```text
/portal/projekte              → Dashboard (Projekt-Liste + CTA)
/portal/projekte/neu          → Create Flow (2-Step Wizard)
/portal/projekte/kontexte     → Kontext-Verwaltung (Verkäufer-Gesellschaften)
/portal/projekte/portfolio    → Portfolio-Ansicht (aktiver Kontext)
/portal/projekte/:projectId   → Projektakte (kanonisch)
/portal/projekte/vertrieb     → Reservierungen & Vertrieb
/portal/projekte/marketing    → Kaufy Listing & Landingpages
```

### 2.2 Menüstruktur (4 Tiles)

| Nr | Tile | Route | Inhalt |
|----|------|-------|--------|
| 1 | **Kontexte** | `/projekte/kontexte` | Verkäufer-Gesellschaften anlegen/verwalten, Context Switcher |
| 2 | **Portfolio** | `/projekte/portfolio` | Projektliste im aktiven Kontext, Aufteiler-KPIs, Eye-Icon → Akte |
| 3 | **Vertrieb** | `/projekte/vertrieb` | Reservierungen, Partner-Performance, Reporting |
| 4 | **Marketing** | `/projekte/marketing` | Kaufy free, Paid Projekt-Landingpage, Social Leadgen |

---

## 3. Komponenten-Architektur

### 3.1 Kontext-Management (analog MOD-04)

```text
src/pages/portal/projekte/
├── index.ts                      # Exports
├── KontexteTab.tsx               # Verkäufer-Gesellschaften (Kopie von KontexteTab MOD-04)
├── PortfolioTab.tsx              # Projektliste mit Aufteiler-KPIs
├── ProjectDetailPage.tsx         # Projektakte (10-Block-Struktur)
├── VertriebTab.tsx               # Reservierungen & Partner
├── MarketingTab.tsx              # Kaufy + Landingpages
└── CreateProjectRedirect.tsx     # /neu → Portfolio?create=1
```

### 3.2 Projektakte (10 Sections analog Immobilienakte)

| Block | Name | Inhalt |
|-------|------|--------|
| A | Identität/Status | Projektcode, Typ, Status, aktiver Kontext |
| B | Standort/Story | Adresse, Beschreibung, Lage-Notes |
| C | Einheiten | Einheiten-Liste mit Status (frei/reserviert/verkauft) |
| D | Aufteilerkalkulation | Integrierte Kalkulations-Engine (aus MOD-12) |
| E | Preisliste/Provision | Listenpreis, Mindestpreis, Provisionssatz je Einheit |
| F | Dokumente | Global + je Einheit (DMS-Tree) |
| G | Reservierungen | Pro Einheit: Käufer, Status, Ablauf |
| H | Vertrieb | Partner-Zuordnung, Deals, Kommunikation |
| I | Verträge | Kaufvertragsstatus, Drafts |
| J | Veröffentlichung | Kaufy free/paid, Leadstatus, Projekt-Landingpage |

### 3.3 Neue Komponenten

```text
src/components/projekte/
├── CreateDeveloperContextDialog.tsx    # Verkäufer-Gesellschaft anlegen
├── CreateProjectDialog.tsx             # Projekt-Create (2-Step)
├── ProjectPortfolioTable.tsx           # Portfolio-Tabelle mit Aufteiler-KPIs
├── ProjectDossierView.tsx              # Projektakte-Layout
├── blocks/
│   ├── ProjectIdentityBlock.tsx
│   ├── ProjectLocationBlock.tsx
│   ├── ProjectUnitsBlock.tsx           # Einheiten-Liste mit Status-Badges
│   ├── ProjectCalculationBlock.tsx     # Integrierte Aufteilerkalkulation
│   ├── ProjectPricingBlock.tsx         # Preisliste/Provision
│   ├── ProjectDocumentsBlock.tsx
│   ├── ProjectReservationsBlock.tsx
│   ├── ProjectSalesBlock.tsx           # Partner/Deals
│   ├── ProjectContractsBlock.tsx
│   └── ProjectPublicationBlock.tsx     # Kaufy + Landingpage
├── ReservationDialog.tsx               # Reservierung erfassen
├── UnitStatusBadge.tsx                 # frei/reserviert/verkauft
└── SalesPartnerAssignment.tsx          # Partner zuordnen
```

---

## 4. Kalkulations-Engine

Die Aufteilerkalkulation wird aus MOD-12 übernommen und erweitert:

```text
Eingaben:
- Kaufpreis gesamt
- Anzahl Einheiten
- Ø Verkaufspreis/Einheit (oder individuelle Preise)
- Sanierungskosten gesamt (oder pro Einheit)
- Vertriebsprovision %
- Haltedauer (Monate)
- Erwerbsnebenkosten %

Ausgaben:
- Gesamter Verkaufserlös
- Bruttogewinn
- Marge %
- Annualisierte Rendite
- Gewinn/Einheit
- Break-Even-Punkt (Anzahl verkaufter Einheiten)
```

### 4.1 KPI-Spalten in Portfolio-Tabelle

| Spalte | Beschreibung |
|--------|--------------|
| Projekt-Code | z.B. "BT-2024-001" |
| Name/Standort | Projektname + Stadt |
| Einheiten | Total / Frei / Reserviert / Verkauft |
| Kaufpreis | Gesamt-Einkaufspreis |
| Verkaufsziel | Σ Listenpreise |
| Marge | Bruttogewinn % |
| Fortschritt | % verkauft (visueller Balken) |
| Status | Draft/Aktiv/Abgeschlossen |

---

## 5. Vertrieb & Reservierungen

### 5.1 Reservierungs-Workflow

```text
1. Einheit "frei" → Partner/Käufer zuordnen → Status "reserviert"
2. Reservierung bestätigen (Owner + Buyer Consent)
3. Notartermin eintragen
4. Nach Beurkundung → Status "verkauft"
5. Bei Abbruch → Status zurück auf "frei" + Grund dokumentieren
```

### 5.2 Partner-Performance View

- Welcher Partner hat welche Einheiten reserviert/verkauft
- Provisions-Tracking
- Export für Abrechnung

---

## 6. Marketing & Veröffentlichung

### 6.1 Kaufy Integration (Free)

- Projekt in Zone 3 Kaufy-Marktplatz listen
- Consent-Flow analog MOD-06

### 6.2 Paid Features (Platzhalter-UI)

| Feature | Preis | Beschreibung |
|---------|-------|--------------|
| Projekt-Präsentation | 200€/Monat | Featured Placement unter Kaufy → Projekte |
| Projekt-Landingpage | 200€/Monat | Generierte Subdomain mit Investment-Rechner |
| Social Leadgen | Variabel | Integration mit MOD-10 Leads |

---

## 7. Hooks & Services

### 7.1 Neue Hooks

```text
src/hooks/
├── useDeveloperContexts.ts        # CRUD für Verkäufer-Kontexte
├── useDevProjects.ts              # Projekt-CRUD + Portfolio-Query
├── useProjectDossier.ts           # Aggregierte Akte-Daten
├── useProjectUnits.ts             # Einheiten-CRUD
├── useProjectReservations.ts      # Reservierungs-Management
├── useProjectCalculation.ts       # Aufteilerkalkulation (abgeleitet von useAcqTools)
└── useProjectPublication.ts       # Kaufy-Listing + Paid-Features
```

### 7.2 Type-Definitionen

```text
src/types/projekte.ts
├── DeveloperContext
├── DevProject
├── DevProjectUnit
├── DevProjectReservation
├── ProjectDossierData
├── AufteilerCalculation
└── ProjectPublicationStatus
```

---

## 8. Implementierungs-Phasen

### Phase 1: Datenbank + Grundstruktur
1. Migration: Tabellen `developer_contexts`, `dev_projects`, `dev_project_units`
2. RLS-Policies (tenant_id-basiert)
3. Basis-Routing in `ProjektePage.tsx`

### Phase 2: Kontext-Management
4. `CreateDeveloperContextDialog` (kopiert/adaptiert von MOD-04)
5. `KontexteTab` mit Context-Switcher

### Phase 3: Portfolio + Create-Flow
6. `CreateProjectDialog` (2-Step Wizard)
7. `PortfolioTab` mit Aufteiler-KPIs
8. Portfolio-Tabelle mit Status-Aggregation

### Phase 4: Projektakte
9. `ProjectDetailPage` (Routing)
10. 10-Block-Struktur implementieren (A-J)
11. Integrierte Aufteilerkalkulation (Block D)
12. Einheiten-Management (Block C)

### Phase 5: Vertrieb & Reservierungen
13. Migration: `dev_project_reservations`
14. `ReservationDialog` + Status-Workflow
15. `VertriebTab` mit Partner-Performance

### Phase 6: Marketing & Veröffentlichung
16. `MarketingTab` mit Kaufy-Toggle
17. Paid-Feature Platzhalter-UI
18. Integration mit Zone 1 Sales Desk (Übergabe-Logik)

---

## 9. Abhängigkeiten & Integrationen

| System | Integration |
|--------|-------------|
| **MOD-02 KI-Office** | Kontakte (Käufer), Kalender (Notartermine) |
| **Zone 1 Sales Desk** | Projekt-Übergabe für Marktplatz-Freigabe |
| **MOD-09 Partner-Netzwerk** | Partner-Zuordnung bei Reservierungen |
| **MOD-10 Leads** | Leadgen-Kampagnen für Projekte |
| **Zone 3 Kaufy** | Projekt-Listings + Landingpages |

---

## 10. Technische Details

### 10.1 RLS-Policies

```sql
-- developer_contexts: Nur eigener Tenant
CREATE POLICY "tenant_isolation" ON developer_contexts
  FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- dev_projects: Tenant + optional Context-Scoping
CREATE POLICY "tenant_isolation" ON dev_projects
  FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- dev_project_units: Via project_id
CREATE POLICY "via_project" ON dev_project_units
  FOR ALL USING (
    project_id IN (SELECT id FROM dev_projects WHERE tenant_id = auth.jwt() ->> 'tenant_id')
  );
```

### 10.2 Bestehende Komponenten (Wiederverwendung)

- `PropertyTable` → adaptiert zu `ProjectPortfolioTable`
- `CreateContextDialog` → adaptiert zu `CreateDeveloperContextDialog`
- `calculateAufteilerKPIs` aus `useAcqTools` → direkt nutzbar
- `UnitDossierView` Layout → Vorlage für `ProjectDossierView`

---

## Erwartetes Ergebnis

Nach Implementierung ist der **Golden Path** vollständig klickbar:

1. **Kontext anlegen** → Verkäufer-Gesellschaft erfassen
2. **Projekt erstellen** → Adresse, Einheiten, Kaufpreis
3. **Portfolio** → Übersicht aller Projekte mit Aufteiler-KPIs
4. **Projektakte** → Detailansicht mit Kalkulation, Einheiten, Dokumenten
5. **Reservierung** → Einheit einem Käufer/Partner zuordnen
6. **Vertrieb** → Partner-Performance, Provisionen
7. **Marketing** → Kaufy-Listing, Landingpage-Option
8. **Übergabe** → Zone 1 Sales Desk für Marktplatz-Freigabe
