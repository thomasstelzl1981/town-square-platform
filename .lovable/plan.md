
# Erweiterter Reparaturplan: MOD-04 Immobilien — Drag-and-Drop, Excel-Import & Ordnerstruktur

## Analyse: Was fehlt aktuell?

| Feature | Aktueller Status | Dokumentations-Anforderung |
|---------|------------------|---------------------------|
| **Drag-and-Drop Exposé** | ❌ Nicht vorhanden | Datenraum-Section mit Upload |
| **Drag-and-Drop Portfolio-Liste** | ❌ Nicht vorhanden | Excel-Import für Portfolio |
| **Ordnerstruktur pro Objekt** | ❌ Nicht implementiert | Überordner + Einheiten-Ordner |
| **DMS-Verlinkung** | ❌ Nicht implementiert | `document_links.object_id` |

---

## Teil A: Ordnerstruktur im Storage (KRITISCH)

### Architektur-Anforderung (ADR-038 + MOD-04)

Jedes Property erhält eine automatische Ordnerstruktur im `tenant-vault`:

```
tenant/{tenant_id}/immobilien/{property_id}/
├── allgemein/                  ← Globale Objekt-Unterlagen
│   ├── grundbuch/
│   ├── finanzierung/
│   ├── versicherung/
│   └── sonstiges/
├── einheiten/                  ← Pro Einheit ein Ordner
│   ├── {unit_id_1}/
│   │   ├── mietvertrag/
│   │   ├── protokolle/
│   │   └── korrespondenz/
│   └── {unit_id_2}/
│       └── ...
└── sanierung/                  ← Sanierungsvorgänge
    └── {service_case_id}/
```

### Datenbank: storage_nodes Erweiterung

Die `storage_nodes`-Tabelle benötigt Property-/Unit-Referenzen:

```sql
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id);
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
```

### Automatische Ordner-Erstellung (Trigger)

Bei Anlage eines neuen Property/Unit werden automatisch Ordner erstellt:

```sql
CREATE OR REPLACE FUNCTION create_property_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  root_node_id uuid;
  allgemein_id uuid;
  einheiten_id uuid;
BEGIN
  -- Erstelle Haupt-Ordner für Property
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, NULL, NEW.code || ' - ' || NEW.address, 'property_root', NEW.id, true)
  RETURNING id INTO root_node_id;
  
  -- Erstelle Unterordner "Allgemein"
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, root_node_id, 'Allgemein', 'folder', NEW.id, true)
  RETURNING id INTO allgemein_id;
  
  -- Weitere Unterordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES 
    (NEW.tenant_id, allgemein_id, 'Grundbuch', 'folder', NEW.id, true),
    (NEW.tenant_id, allgemein_id, 'Finanzierung', 'folder', NEW.id, true),
    (NEW.tenant_id, allgemein_id, 'Versicherung', 'folder', NEW.id, true),
    (NEW.tenant_id, allgemein_id, 'Sonstiges', 'folder', NEW.id, true);
  
  -- Erstelle "Einheiten" Container
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, root_node_id, 'Einheiten', 'folder', NEW.id, true)
  RETURNING id INTO einheiten_id;
  
  -- Erstelle "Sanierung" Container
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, root_node_id, 'Sanierung', 'folder', NEW.id, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_folder_structure
  AFTER INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION create_property_folder_structure();
```

### Einheiten-Ordner (Unit Trigger)

```sql
CREATE OR REPLACE FUNCTION create_unit_folder()
RETURNS TRIGGER AS $$
DECLARE
  einheiten_parent_id uuid;
  unit_folder_id uuid;
BEGIN
  -- Finde "Einheiten"-Ordner des Properties
  SELECT id INTO einheiten_parent_id 
  FROM storage_nodes 
  WHERE property_id = NEW.property_id 
    AND name = 'Einheiten' 
    AND node_type = 'folder';
  
  IF einheiten_parent_id IS NOT NULL THEN
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, unit_id, auto_created)
    VALUES (NEW.tenant_id, einheiten_parent_id, NEW.unit_number, 'unit_folder', NEW.property_id, NEW.id, true)
    RETURNING id INTO unit_folder_id;
    
    -- Standard-Unterordner für Einheit
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, unit_id, auto_created)
    VALUES 
      (NEW.tenant_id, unit_folder_id, 'Mietvertrag', 'folder', NEW.property_id, NEW.id, true),
      (NEW.tenant_id, unit_folder_id, 'Protokolle', 'folder', NEW.property_id, NEW.id, true),
      (NEW.tenant_id, unit_folder_id, 'Korrespondenz', 'folder', NEW.property_id, NEW.id, true);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unit_folder_create
  AFTER INSERT ON units
  FOR EACH ROW EXECUTE FUNCTION create_unit_folder();
```

---

## Teil B: Datenraum-Section im Exposé (Drag-and-Drop)

### UI-Erweiterung: PropertyDetail.tsx

Neue Section "Datenraum" im Exposé mit:
1. **Ordnerbaum** (links) — gefiltert auf `property_id`
2. **Dokument-Liste** (mitte) — Dateien im ausgewählten Ordner
3. **Drag-and-Drop Zone** — Upload direkt ins Property

### Komponenten-Struktur

```
src/components/portfolio/
├── ExposeTab.tsx        ← Besteht (Stammdaten)
├── FeaturesTab.tsx      ← Besteht (Feature-Toggles)
├── TenancyTab.tsx       ← Besteht (Mietverhältnis)
└── DatenraumTab.tsx     ← NEU: DMS-Integration im Exposé
```

### DatenraumTab.tsx — Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  DATENRAUM                                           [+ Upload]   │
├────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┬──────────────────────────────────────────────┐ │
│  │  ORDNER       │  DOKUMENTE                                   │ │
│  │               │                                              │ │
│  │  📁 Allgemein │  ┌─────────────────────────────────────────┐ │ │
│  │    ├ Grundbuch│  │ 📄 Grundbuchauszug.pdf    12.01.2026   │ │ │
│  │    ├ Finanz.  │  │ 📄 Kaufvertrag.pdf        08.11.2025   │ │ │
│  │    └ Versich. │  │                                         │ │ │
│  │  📁 Einheiten │  └─────────────────────────────────────────┘ │ │
│  │    ├ WE01     │                                              │ │
│  │    └ WE02     │  ┌─────────────────────────────────────────┐ │ │
│  │  📁 Sanierung │  │         DRAG & DROP ZONE                │ │ │
│  │               │  │    Dateien hier ablegen zum Upload      │ │ │
│  └───────────────┴──└─────────────────────────────────────────┘─┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Upload-Flow (Exposé)

```
1. User droppt Datei auf Datenraum-Zone
2. FileUploader erfasst File[]
3. Edge Function `sot-dms-upload-url` wird aufgerufen mit:
   - filename, mime_type, size_bytes
   - folder: `immobilien/{property_id}/{selected_node_path}`
4. Signed Upload URL wird zurückgegeben
5. Client lädt Datei hoch
6. document + document_links Einträge werden erstellt:
   - document_links.object_id = property_id
   - document_links.node_id = ausgewählter storage_node
7. UI aktualisiert Dokument-Liste
```

---

## Teil C: Excel-Import in der Portfolio-Liste

### Funktionsanforderung

In der PortfolioTab (Immobilienliste) soll ein Excel-Import möglich sein:
1. User droppt Excel-Datei auf Zone
2. System parsed Excel und zeigt Preview
3. User bestätigt Import
4. Objekte werden in `properties` erstellt

### Excel-Struktur (gemäß MOD-04_FIELD_MAPPING.md)

| Spalte | DB-Feld | Pflicht |
|--------|---------|---------|
| A: ID/Code | `code` | Optional |
| B: Art | `property_type` | Ja |
| C: Ort | `city` | Ja |
| D: Straße/Hausnummer | `address` | Ja |
| E: Größe (qm) | `total_area_sqm` | Optional |
| F: Nutzung | `usage_type` | Ja |
| G: Einnahmen | `annual_income` | Optional |
| H: Verkehrswert | `market_value` | Optional |
| I: Restschuld | `current_balance` | Optional |
| J: Rate | `monthly_rate` | Optional |
| K: Warmmiete | `current_monthly_rent` | Optional |
| L: NK-Vorauszahlung | `utility_prepayment` | Optional |
| M: Hausgeld | `management_fee` | Optional |

### UI-Layout: PortfolioTab mit Import-Zone

```
┌────────────────────────────────────────────────────────────────────┐
│  PORTFOLIO-ÜBERSICHT                    [+ Objekt]  [📥 Import]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │         EXCEL IMPORT ZONE                                    │  │
│  │    Ziehen Sie Ihre Portfolio-Excel hierher                  │  │
│  │    (Format: .xlsx, .xls, .csv)                               │  │
│  │    [📄 Muster-Vorlage herunterladen]                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [KPIs: Objekte | Wert | Schuld | Netto | Rendite]                │
│  [Charts: Typ-Verteilung | Regionen]                              │
│  [Tabelle: 13 Spalten]                                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Excel-Parser (Frontend mit xlsx-Bibliothek)

```typescript
// Dependency: xlsx (SheetJS)
import * as XLSX from 'xlsx';

interface ImportPreview {
  valid: PropertyImportRow[];
  errors: { row: number; field: string; message: string }[];
}

function parsePortfolioExcel(file: File): Promise<ImportPreview> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Skip header, map to PropertyImportRow[]
      // Validate required fields
      // Return valid + errors
    };
    reader.readAsArrayBuffer(file);
  });
}
```

### Import-Preview-Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  IMPORT VORSCHAU                                          [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Gefunden: 8 Objekte                                            │
│  ✅ 6 gültig    ⚠️ 2 mit Fehlern                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ # │ Code   │ Adresse          │ Ort       │ Status        │ │
│  ├───┼────────┼──────────────────┼───────────┼───────────────┤ │
│  │ 1 │ ZL002  │ Hauptstr. 15     │ Straubing │ ✅ OK         │ │
│  │ 2 │ ZL003  │ Am Park 7        │ Leiblfing │ ✅ OK         │ │
│  │ 3 │ –      │ –                │ –         │ ⚠️ Adresse fehlt│ │
│  └───┴────────┴──────────────────┴───────────┴───────────────┘ │
│                                                                  │
│  [ ] Fehlerhafte Zeilen überspringen                            │
│                                                                  │
│  [Abbrechen]                              [6 Objekte importieren]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Teil D: Flowchart — Dokument-Upload im Exposé

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DOKUMENT-UPLOAD FLOW (EXPOSÉ)                        │
└─────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │   USER      │
     │ droppt Datei│
     └──────┬──────┘
            │
            ▼
     ┌─────────────────┐
     │ FileUploader    │
     │ erfasst File[]  │
     └───────┬─────────┘
             │
             ▼
     ┌─────────────────────┐      ┌──────────────────────────┐
     │ Ordner ausgewählt?  │──Nein─▶│ Default: property_root  │
     └───────┬─────────────┘      └──────────┬───────────────┘
             │ Ja                            │
             ▼                               ▼
     ┌───────────────────────────────────────────────────────┐
     │  Edge Function: sot-dms-upload-url                    │
     │                                                       │
     │  Input:                                               │
     │  - filename, mime_type, size_bytes                    │
     │  - folder: immobilien/{property_id}/{node_path}       │
     │                                                       │
     │  Output:                                              │
     │  - signed_upload_url                                  │
     │  - document_id                                        │
     │  - file_path                                          │
     └───────────────────────┬───────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────┐
     │  Client: PUT to signed_upload_url                      │
     │  (Datei-Bytes direkt an Supabase Storage)             │
     └───────────────────────┬───────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────┐
     │  Datenbank-Einträge (automatisch via Edge Function):   │
     │                                                        │
     │  documents:                                            │
     │  ├─ id: {document_id}                                  │
     │  ├─ tenant_id: {tenant_id}                             │
     │  ├─ name: {filename}                                   │
     │  ├─ file_path: tenant/{tenant_id}/immobilien/...       │
     │  └─ mime_type: {mime_type}                             │
     │                                                        │
     │  document_links:                                       │
     │  ├─ document_id: {document_id}                         │
     │  ├─ object_id: {property_id}  ← Property-Verknüpfung   │
     │  ├─ unit_id: {unit_id}        ← Optional               │
     │  ├─ node_id: {storage_node_id}                         │
     │  └─ link_status: 'linked'                              │
     └───────────────────────┬───────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────┐
     │  UI: Dokument-Liste aktualisieren                      │
     │  ├─ Query: documents WHERE object_id = property_id     │
     │  └─ Zeige Ordnerstruktur mit Zähler                    │
     └───────────────────────────────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────┐
     │  Optional: User kann Dokument verschieben              │
     │  ├─ Drag in anderen Ordner                             │
     │  └─ Update: document_links.node_id                     │
     │     (KEINE Byte-Verschiebung im Storage!)              │
     └───────────────────────────────────────────────────────┘
```

---

## Teil E: Flowchart — Excel-Import in Portfolio-Liste

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXCEL IMPORT FLOW (PORTFOLIO)                        │
└─────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │   USER      │
     │ droppt Excel│
     └──────┬──────┘
            │
            ▼
     ┌─────────────────────┐
     │ FileUploader        │
     │ (accept: .xlsx,.csv)│
     └───────┬─────────────┘
             │
             ▼
     ┌───────────────────────────────────────────────────────┐
     │  Frontend: XLSX Parser (SheetJS)                       │
     │                                                        │
     │  1. Lese Workbook                                      │
     │  2. Extrahiere erstes Sheet                            │
     │  3. Parse Zeilen ab Row 2 (Header in Row 1)            │
     │  4. Validiere Pflichtfelder:                           │
     │     - property_type, city, address, usage_type         │
     │  5. Erstelle ImportPreview                             │
     └───────────────────────┬───────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────┐
     │  Import-Preview Dialog                                 │
     │                                                        │
     │  ├─ Zeige alle Zeilen mit Status (OK / Fehler)         │
     │  ├─ Checkbox: "Fehler überspringen"                    │
     │  └─ Button: "X Objekte importieren"                    │
     └───────────────────────┬───────────────────────────────┘
                             │
                             ▼ [User bestätigt]
     ┌───────────────────────────────────────────────────────┐
     │  Edge Function: sot-property-crud (action: bulk_create)│
     │                                                        │
     │  Input: PropertyCreatePayload[]                        │
     │  Output: { created: Property[], errors: Error[] }      │
     └───────────────────────┬───────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────┐
     │  Für jedes erstellte Property:                         │
     │                                                        │
     │  1. INSERT properties → Trigger fires                  │
     │  2. Trigger: create_property_folder_structure()        │
     │     └─ Erstellt automatisch Ordnerstruktur             │
     │  3. Optional: Erstelle Units                           │
     │     └─ Trigger: create_unit_folder()                   │
     └───────────────────────┬───────────────────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────────────┐
     │  UI: Erfolgs-Meldung + Liste aktualisieren             │
     │                                                        │
     │  "8 Objekte erfolgreich importiert"                    │
     │  [Zur Portfolio-Liste]                                 │
     └───────────────────────────────────────────────────────┘
```

---

## Teil F: Implementierungs-Reihenfolge

| # | Schritt | Dateien | Priorität |
|---|---------|---------|-----------|
| 1 | DB-Migration: storage_nodes erweitern | SQL Migration | P0 |
| 2 | DB-Trigger: Property-Ordner automatisch | SQL Migration | P0 |
| 3 | DB-Trigger: Unit-Ordner automatisch | SQL Migration | P0 |
| 4 | DatenraumTab.tsx erstellen | Neue Komponente | P0 |
| 5 | PropertyDetail.tsx: Datenraum-Tab hinzufügen | Bearbeitung | P0 |
| 6 | sot-dms-upload-url: object_id Support | Edge Function | P0 |
| 7 | PortfolioTab.tsx: Excel Import Zone | Neue Komponente | P1 |
| 8 | xlsx Dependency installieren | package.json | P1 |
| 9 | Excel Parser + Preview Dialog | Neue Komponenten | P1 |
| 10 | sot-property-crud: bulk_create Action | Edge Function | P1 |
| 11 | Excel-Muster-Vorlage erstellen | public/templates/ | P1 |

---

## Teil G: Zusammenfassung der Bestätigungen

| Anforderung | Status im Plan |
|-------------|----------------|
| Drag-and-Drop im Exposé | ✅ DatenraumTab mit FileUploader |
| Drag-and-Drop in Portfolio-Liste | ✅ Excel-Import Zone |
| Ordnerstruktur pro Objekt | ✅ Automatische Trigger |
| Ordner pro Einheit | ✅ Unit-Folder Trigger |
| Verlinkung zu Supabase Storage | ✅ document_links.object_id |
| Keine Byte-Verschiebung | ✅ Nur DB-Update bei Move |
| Excel-Muster-Vorlage | ✅ Downloadbare Vorlage |

---

## Technische Details

### Neue Abhängigkeit

```json
{
  "dependencies": {
    "xlsx": "^0.18.5"
  }
}
```

### Neue Dateien

```
src/components/portfolio/DatenraumTab.tsx
src/components/portfolio/ExcelImportDialog.tsx
src/pages/portal/immobilien/PortfolioTab.tsx
public/templates/portfolio-import-vorlage.xlsx
```

### Geänderte Dateien

```
src/pages/portfolio/PropertyDetail.tsx  ← Neuer Tab "Datenraum"
supabase/functions/sot-dms-upload-url/index.ts  ← object_id Support
supabase/functions/sot-property-crud/index.ts  ← bulk_create Action
```

### SQL-Migrationen

1. `storage_nodes_property_extension.sql` — Spalten + Trigger
2. `document_links_object_unit.sql` — Falls nicht vorhanden
