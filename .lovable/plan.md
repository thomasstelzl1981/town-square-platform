
# MOD-13 PROJEKTE — Vollständige Implementierung

## Zusammenfassung

Diese Planung adressiert alle identifizierten Lücken in MOD-13, um einen vollständigen Golden Path für Bauträger/Aufteiler zu ermöglichen. Die wichtigsten Arbeitspakete sind:

1. **DMS-Integration**: Automatische Ordnerstruktur bei Projektanlage
2. **Mastervorlage**: Neue Zone 1 Projektakte-Vorlage
3. **Projektakte erweitern**: Einheiten-Detailansicht + vollständige Blöcke
4. **Reservierungs-Workflow**: Vollständiger CRUD mit Status-Tracking
5. **Marketing-Funktionalität**: Kaufy-Integration + Landingpage-Builder

---

## Phase 1: DMS-Integration (Automatische Ordnerstruktur)

### 1.1 Problem

Aktuell wird bei Projektanlage **keine DMS-Ordnerstruktur** in `storage_nodes` erstellt. Dies muss analog zur Logik in MOD-04 erfolgen.

### 1.2 Lösung

**Neue Funktion in `useDevProjects.ts`:**

```typescript
async function createProjectDMSStructure(projectId: string, projectCode: string, units: CreateProjectUnitInput[]) {
  const baseFolders = [
    { name: projectCode, node_type: 'folder', level: 0 },
    { name: 'Allgemein', parent: projectCode, node_type: 'folder', level: 1 },
    { name: 'Exposé', parent: 'Allgemein', node_type: 'folder', level: 2 },
    { name: 'Grundbuch', parent: 'Allgemein', node_type: 'folder', level: 2 },
    { name: 'Teilungserklärung', parent: 'Allgemein', node_type: 'folder', level: 2 },
    { name: 'Energieausweis', parent: 'Allgemein', node_type: 'folder', level: 2 },
    { name: 'Fotos', parent: 'Allgemein', node_type: 'folder', level: 2 },
    { name: 'Einheiten', parent: projectCode, node_type: 'folder', level: 1 },
  ];
  
  // Pro Einheit: Ordner unter /Einheiten/{unit_number}
  units.forEach(unit => {
    baseFolders.push({
      name: `WE-${unit.unit_number}`,
      parent: 'Einheiten',
      node_type: 'folder',
      level: 2,
      unit_id: unit.id // Verknüpfung
    });
  });
  
  // Insert into storage_nodes mit hierarchischer parent_id Auflösung
}
```

### 1.3 Ordnerstruktur (Vorlage)

```text
/Projekte/
└── BT-2024-001/                    ← Projekt-Root
    ├── Allgemein/                  ← Globalobjekt-Dokumente
    │   ├── Exposé/
    │   ├── Grundbuch/
    │   ├── Teilungserklärung/
    │   ├── Energieausweis/
    │   └── Fotos/
    └── Einheiten/                  ← Einheiten-Dokumente
        ├── WE-001/
        │   ├── Grundriss/
        │   ├── Mietvertrag/
        │   └── Kaufvertrag/
        ├── WE-002/
        └── WE-003/
```

### 1.4 Integration

- Trigger nach `createProject.mutateAsync()` Erfolg
- Optional: Database-Trigger auf `dev_projects INSERT`

---

## Phase 2: Mastervorlage für Projektakte (Zone 1)

### 2.1 Neue Datei

**Pfad:** `src/pages/admin/MasterTemplatesProjektakte.tsx`

### 2.2 Block-Struktur (Projektakte)

| Block | Titel | Entität | Felder-Anzahl |
|-------|-------|---------|---------------|
| A | Identität | dev_projects | 12 |
| B | Standort | dev_projects | 7 |
| C | Einheiten | dev_project_units | 18 |
| D | Aufteilerkalkulation | dev_project_calculations | 14 |
| E | Preisliste | dev_project_units | 5 |
| F | Dokumente | dev_project_documents | 8 |
| G | Reservierungen | dev_project_reservations | 12 |
| H | Vertrieb | dev_project_reservations | 6 |
| I | Verträge | dev_project_documents | 4 |
| J | Veröffentlichung | dev_projects | 5 |

### 2.3 Globalobjekt-Felder (Block A-B, D-F, I-J)

```typescript
interface ProjectGlobalFields {
  // Block A: Identität
  id: string;
  tenant_id: string;
  developer_context_id: string;
  project_code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  total_units_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Block B: Standort
  address: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  
  // Block D: Kalkulation
  purchase_price: number;
  ancillary_cost_percent: number;
  renovation_budget: number;
  total_sale_target: number;
  commission_rate_percent: number;
  holding_period_months: number;
  financing_rate_percent: number;
  financing_ltv_percent: number;
  // Calculated
  total_investment: number;
  gross_profit: number;
  profit_margin_percent: number;
  annualized_return: number;
  profit_per_unit: number;
  break_even_units: number;
  
  // Block J: Veröffentlichung
  kaufy_listed: boolean;
  kaufy_featured: boolean;
  landingpage_enabled: boolean;
  landingpage_url: string;
  leadgen_enabled: boolean;
}
```

### 2.4 Einheiten-Felder (Block C, E, G)

```typescript
interface ProjectUnitFields {
  // Block C: Einheit-Stammdaten
  id: string;
  project_id: string;
  unit_number: string;
  floor: number;
  area_sqm: number;
  rooms_count: number;
  balcony: boolean;
  garden: boolean;
  parking: boolean;
  parking_type: string;
  grundbuchblatt: string;
  te_number: string;
  tenant_name: string;
  current_rent: number;
  rent_net: number;
  rent_nk: number;
  notes: string;
  status: UnitStatus;
  
  // Block E: Preise
  list_price: number;
  min_price: number;
  price_per_sqm: number;
  commission_amount: number;
  net_proceeds: number;
  
  // Block G: Reservierung (1:1 pro Einheit)
  reservation_id: string;
  buyer_contact_id: string;
  partner_org_id: string;
  reserved_price: number;
  reservation_date: string;
  expiry_date: string;
  confirmation_date: string;
  notary_date: string;
  completion_date: string;
  reservation_status: ReservationStatus;
}
```

### 2.5 Route & Navigation

- Route: `/admin/master-templates/projektakte`
- Link in `MasterTemplates.tsx` neben Immobilienakte und Selbstauskunft

---

## Phase 3: Projektakte erweitern

### 3.1 Einheiten-Detailansicht

**Neue Datei:** `src/pages/portal/projekte/UnitDetailPage.tsx`

- Route: `/portal/projekte/:projectId/einheit/:unitId`
- Zeigt alle Felder einer Einheit (Block C, E, G)
- Editierbar (analog zu `EditableUnitDossierView` aus MOD-04)

### 3.2 Vollständige Blöcke E-J

Ersetze Platzhalter in `ProjectDetailPage.tsx`:

| Tab | Inhalt | Komponenten |
|-----|--------|-------------|
| E | Preisliste | Tabelle mit Listenpreis, Mindestpreis, €/m² pro Einheit |
| F | Dokumente | DMS-Tree-Ansicht (aus `storage_nodes`) |
| G | Reservierungen | Tabelle + `CreateReservationDialog` |
| H | Vertrieb | Partner-Performance, Provisions-Tracking |
| I | Verträge | Upload/Status für Kaufverträge |
| J | Veröffentlichung | Kaufy-Toggle, Landingpage-Config |

### 3.3 Neue Komponenten

```text
src/components/projekte/
├── blocks/
│   ├── ProjectPricingBlock.tsx
│   ├── ProjectDocumentsBlock.tsx
│   ├── ProjectReservationsBlock.tsx
│   ├── ProjectSalesBlock.tsx
│   ├── ProjectContractsBlock.tsx
│   └── ProjectPublicationBlock.tsx
├── CreateReservationDialog.tsx
├── EditUnitDialog.tsx
└── UnitDetailView.tsx
```

---

## Phase 4: Reservierungs-Workflow

### 4.1 Status-Workflow

```text
available → reserved (pending) → confirmed → notary_scheduled → completed
                ↓                    ↓
             cancelled           cancelled
                ↓                    ↓
             expired              expired
```

### 4.2 CreateReservationDialog

```typescript
interface CreateReservationDialogProps {
  projectId: string;
  unitId: string;
  onSuccess: () => void;
}

// Felder:
// - Käufer (Autocomplete aus contacts)
// - Partner (Select aus organizations mit type='partner')
// - Reservierungspreis
// - Ablaufdatum (Default: +14 Tage)
// - Notizen
```

### 4.3 Reservierungs-Tabelle im VertriebTab

```typescript
// Spalten:
// - Einheit (WE-001)
// - Käufer (Name)
// - Partner (Organisation)
// - Status (Badge)
// - Preis
// - Ablauf
// - Aktionen (Bestätigen, Notartermin, Abschließen, Stornieren)
```

### 4.4 Partner-Performance

```typescript
// Aggregation pro Partner:
// - Anzahl Reservierungen
// - Anzahl Verkäufe
// - Gesamt-Volumen
// - Gesamt-Provision
// - Conversion-Rate (Reservierung → Verkauf)
```

---

## Phase 5: Marketing-Funktionalität

### 5.1 Kaufy-Integration

**Datenbank-Erweiterung:**

```sql
ALTER TABLE dev_projects ADD COLUMN kaufy_listed BOOLEAN DEFAULT false;
ALTER TABLE dev_projects ADD COLUMN kaufy_featured BOOLEAN DEFAULT false;
ALTER TABLE dev_projects ADD COLUMN landingpage_slug VARCHAR(100);
```

**MarketingTab.tsx Erweiterung:**

```typescript
// Switch-Handler für Kaufy-Listing
const handleKaufyToggle = async (projectId: string, enabled: boolean) => {
  await updateProject.mutateAsync({ 
    id: projectId, 
    kaufy_listed: enabled 
  });
  // Trigger: Projekt in Zone 3 Kaufy-Marktplatz anzeigen/ausblenden
};
```

### 5.2 Projekt-Landingpage-Generator

**Konzept:**

- Subdomain: `{projekt-slug}.kaufy.de`
- Template: Hero + Projekt-Galerie + Einheiten-Liste + Investment-Rechner + Lead-Formular
- Integration mit `useInvestmentEngine` für Rechner

**Neue Route (Zone 3):**

```text
src/pages/zone3/projekt/[slug]/
├── index.tsx           ← Landing
├── einheiten.tsx       ← Einheiten-Liste
└── rechner.tsx         ← Investment-Rechner
```

### 5.3 Social Leadgen (Platzhalter)

- Integration mit MOD-10 Leads
- Kampagnen-Verwaltung (Facebook, Instagram, Google)
- Lead-Attribution zu Projekten

---

## Technische Details

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/admin/MasterTemplatesProjektakte.tsx` | Zone 1 Mastervorlage |
| `src/pages/portal/projekte/UnitDetailPage.tsx` | Einheiten-Detailansicht |
| `src/components/projekte/blocks/*.tsx` | 6 neue Block-Komponenten |
| `src/components/projekte/CreateReservationDialog.tsx` | Reservierung erfassen |
| `src/components/projekte/EditUnitDialog.tsx` | Einheit bearbeiten |
| `src/hooks/useProjectDMS.ts` | DMS-Ordner-Management |
| `src/pages/zone3/projekt/[slug].tsx` | Projekt-Landingpage |

### Datenbank-Migration

```sql
-- DMS-Integration
ALTER TABLE storage_nodes ADD COLUMN dev_project_id UUID REFERENCES dev_projects(id);

-- Marketing-Felder
ALTER TABLE dev_projects 
  ADD COLUMN kaufy_listed BOOLEAN DEFAULT false,
  ADD COLUMN kaufy_featured BOOLEAN DEFAULT false,
  ADD COLUMN landingpage_slug VARCHAR(100),
  ADD COLUMN landingpage_enabled BOOLEAN DEFAULT false;

-- Index für Landingpage-Lookup
CREATE UNIQUE INDEX idx_dev_projects_landingpage_slug 
  ON dev_projects(landingpage_slug) WHERE landingpage_slug IS NOT NULL;
```

### Implementierungs-Reihenfolge

1. **DMS-Integration** (kritisch für Dokumenten-Workflow)
2. **Mastervorlage** (Dokumentation + Referenz)
3. **Reservierungs-Workflow** (Core Business Logic)
4. **Projektakte-Blöcke** (UI-Vervollständigung)
5. **Marketing** (Monetarisierung)

---

## Erwartetes Ergebnis

Nach Implementierung:

- Vollständiger Golden Path: Kontext → Projekt → Einheiten → Reservierung → Verkauf → Marketing
- Automatische DMS-Struktur bei Projektanlage
- Mastervorlage als Referenz in Zone 1
- Jede Einheit hat eine eigene Verkaufsakte mit Dokumenten
- Reservierungs-Status-Tracking mit Partner-Attribution
- Kaufy-Marktplatz-Integration für Projekte
- Landingpage-Generator für Premium-Projekte
