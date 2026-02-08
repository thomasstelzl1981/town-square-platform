
# DMS Storage Architecture Refactoring Plan

## Executive Summary

Die Analyse hat **5 kritische Probleme** im Storage-/DMS-System identifiziert, die eine fundamentale Inkonsistenz zwischen den Modul-spezifischen Datenräumen und dem zentralen Storage (MOD-03) verursachen.

---

## Teil 1: Identifizierte Probleme

### Problem 1: Fehlende System-Ordner-Hierarchie

**IST-Zustand:**
- `StorageTab.tsx` (MOD-03) seeded nur 7 System-Ordner auf Root-Ebene:
  ```
  Posteingang, Immobilien, Finanzierung, Bonitätsunterlagen, 
  Zur Prüfung, Archiv, Sonstiges
  ```
- Diese werden mit `node_type = 'system'` und `template_id = 'inbox'` etc. erstellt
- ABER: Property-Ordner haben `parent_id = NULL` (nicht unter "Immobilien" eingehängt!)

**DB-Abfrage zeigt:**
```
storage_nodes für Property DEMO-001:
├── parent_id: NULL (ROOT-Level!)
├── template_id: PROPERTY_DOSSIER_V1
└── 18 Unterordner (00_Projektdokumentation bis 17_Grundsteuer)
```

**PROBLEM:** Die Property-Ordner werden nicht als Kinder des "Immobilien"-System-Ordners erstellt.

---

### Problem 2: Inkonsistente Modul-Zuordnung

**IST-Zustand in der DB:**
```
Scope-Hints in storage_nodes:
├── PROPERTY (19 Ordner) — Property + Unterordner
├── CAR (16 Ordner) — Vehicles + Unterordner
├── FINANCE (10 Ordner) — Finanzierungsanfrage
├── NULL (viele Ordner) — Keine Zuordnung!
```

**PROBLEM:** Es gibt keine konsistente Modul-Zuordnung. Einige Ordner haben `scope_hint = NULL`:
- `CAR_ROOT`, `CAR_VEHICLES` haben kein scope_hint
- Vehicle-Dossiers im Golden Path haben scope_hint, dynamisch erstellte nicht

---

### Problem 3: Doppelte Fahrzeug-Ordner

**DB zeigt 4 Vehicle-Ordner mit `template_id = 'VEHICLE_DOSSIER_V1'`:**
```
758b496c... → "B-P911 - 00000000" (parent_id: NULL, scope_hint: CAR)
00000000... → "B-P911" (parent_id: CAR_VEHICLES)
e540ce7a... → "M-M5005 - 00000000" (parent_id: NULL, scope_hint: CAR)
00000000... → "M-M5005" (parent_id: CAR_VEHICLES)
```

**PROBLEM:** Der Trigger `create_vehicle_folder_structure()` erstellt Ordner auf ROOT-Level, aber das Golden Path Seeding erstellt sie unter `CAR_VEHICLES`.

---

### Problem 4: StorageFolderTree filtert falsch

**Code-Analyse (`StorageFolderTree.tsx`, Zeile 109-112):**
```typescript
// Für "Immobilien" System-Ordner: Property-Root-Nodes holen
const isImmobilienFolder = node.node_type === 'system' && node.template_id === 'immobilien';
const propertyRootNodes = isImmobilienFolder 
  ? nodes.filter(n => n.property_id && !n.parent_id && n.node_type !== 'system')
  : [];
```

**LOGIK:** Wenn der User "Immobilien" expandiert, werden Property-Ordner angezeigt, die:
- `property_id` haben UND
- `parent_id = NULL` (Root-Level)

**PROBLEM:** Das funktioniert nur für Properties, nicht für:
- Cars (kein `vehicle_id` Feld in storage_nodes)
- Finance (kein `finance_request_id` Feld)
- Andere Module

---

### Problem 5: Fotos werden nicht modul-übergreifend geteilt

**IST-Zustand:**
- Fotos in `storage_nodes.11_Fotos` (unter Property-Dossier)
- `DatenraumTab.tsx` zeigt sie korrekt an
- `ExposeImageGallery.tsx` kann sie nicht finden, weil:
  - Es nach `document_links.object_type = 'property'` filtert
  - ABER die Bilder müssen auch in `listings`-Kontext verfügbar sein

---

## Teil 2: Ziel-Architektur

### Neue Storage-Hierarchie (SOLL)

```
storage_nodes (tenant_id = root)
│
├── [SYSTEM] Posteingang (template_id: 'inbox')
│   └── Neue Dokumente landen hier
│
├── [SYSTEM] Eigene Dateien (template_id: 'user_files') ← NEU
│   └── Freier User-Bereich
│
├── [MODUL] MOD-03 DMS (template_id: 'MOD_03_ROOT')
│   └── Allgemeine Dokumente
│
├── [MODUL] MOD-04 Immobilien (template_id: 'MOD_04_ROOT')
│   ├── [PROPERTY] DEMO-001 - Leipziger Straße 42
│   │   ├── 00_Projektdokumentation
│   │   ├── ...
│   │   └── 17_Grundsteuer
│   └── [PROPERTY] (weitere Properties)
│
├── [MODUL] MOD-06 Verkauf (template_id: 'MOD_06_ROOT')
│   └── [LISTING] LIS-12345
│       └── Verkaufsspezifische Dokumente
│
├── [MODUL] MOD-07 Finanzierung (template_id: 'MOD_07_ROOT')
│   ├── [APPLICANT] Bonitätsunterlagen Max Mustermann
│   │   ├── 01_Identität
│   │   ├── 02_Einkommen
│   │   └── 03_Vermögen
│   └── [REQUEST] SOT-F-DEMO001
│       └── 04_Objektunterlagen
│
├── [MODUL] MOD-16 Sanierung (template_id: 'MOD_16_ROOT') ← NEU
│   └── [JOB] SAN-00001
│       └── Sanierungsauftrag-Dokumente
│
├── [MODUL] MOD-17 Car-Management (template_id: 'MOD_17_ROOT')
│   └── [VEHICLE] B-P911
│       ├── 01_Fahrzeugschein
│       ├── 02_Finanzierung_Leasing
│       └── ...
│
├── [SYSTEM] Archiv (template_id: 'archive')
│   └── Archivierte Dokumente
│
└── [SYSTEM] Sonstiges (template_id: 'misc')
```

---

## Teil 3: Technische Implementierung

### Phase 1: DB-Schema-Erweiterung

```sql
-- 1. Spalte 'module_code' zu storage_nodes hinzufügen
ALTER TABLE storage_nodes ADD COLUMN module_code TEXT;

COMMENT ON COLUMN storage_nodes.module_code IS 
  'Modul-Zuordnung: MOD_03, MOD_04, MOD_06, MOD_07, MOD_16, MOD_17, SYSTEM';

-- 2. Constraint für valide module_codes
ALTER TABLE storage_nodes ADD CONSTRAINT storage_nodes_module_code_check
CHECK (module_code IN (
  'MOD_03', 'MOD_04', 'MOD_05', 'MOD_06', 'MOD_07', 
  'MOD_08', 'MOD_16', 'MOD_17', 'SYSTEM', NULL
));

-- 3. Index für schnelle Modul-Filterung
CREATE INDEX idx_storage_nodes_module_code ON storage_nodes(tenant_id, module_code);
```

### Phase 2: Modul-Root-Ordner Seeding

```sql
-- Trigger: Bei Tenant-Erstellung automatisch Modul-Roots erstellen
CREATE OR REPLACE FUNCTION seed_tenant_storage_roots()
RETURNS TRIGGER AS $$
DECLARE
  modules TEXT[] := ARRAY[
    'MOD_04_ROOT:Immobilien',
    'MOD_06_ROOT:Verkauf',
    'MOD_07_ROOT:Finanzierung',
    'MOD_16_ROOT:Sanierung',
    'MOD_17_ROOT:Car-Management'
  ];
  m TEXT;
  template_id TEXT;
  folder_name TEXT;
BEGIN
  -- System-Ordner
  INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code)
  VALUES 
    (NEW.id, 'Posteingang', 'system', 'inbox', 'SYSTEM'),
    (NEW.id, 'Eigene Dateien', 'system', 'user_files', 'SYSTEM'),
    (NEW.id, 'Archiv', 'system', 'archive', 'SYSTEM');
  
  -- Modul-Root-Ordner
  FOREACH m IN ARRAY modules
  LOOP
    template_id := split_part(m, ':', 1);
    folder_name := split_part(m, ':', 2);
    
    INSERT INTO storage_nodes (
      tenant_id, name, node_type, template_id, 
      module_code, auto_created
    )
    VALUES (
      NEW.id, folder_name, 'folder', template_id,
      split_part(template_id, '_', 1) || '_' || split_part(template_id, '_', 2),
      true
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seed_tenant_storage
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION seed_tenant_storage_roots();
```

### Phase 3: Property-Trigger anpassen

```sql
-- Property-Ordner unter MOD-04-Root erstellen (nicht Root-Level)
CREATE OR REPLACE FUNCTION create_property_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  mod04_root_id uuid;
  root_node_id uuid;
  -- ... (Rest bleibt gleich)
BEGIN
  -- 1. MOD-04 Root-Ordner finden (oder erstellen)
  SELECT id INTO mod04_root_id FROM storage_nodes 
  WHERE tenant_id = NEW.tenant_id 
    AND template_id = 'MOD_04_ROOT'
  LIMIT 1;
  
  IF mod04_root_id IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
    VALUES (NEW.tenant_id, 'Immobilien', 'folder', 'MOD_04_ROOT', 'MOD_04', true)
    RETURNING id INTO mod04_root_id;
  END IF;
  
  -- 2. Property-Ordner UNTER MOD-04 erstellen
  INSERT INTO storage_nodes (
    tenant_id, parent_id, name, node_type, property_id, 
    auto_created, template_id, scope_hint, module_code
  )
  VALUES (
    NEW.tenant_id, mod04_root_id, prop_label, 'folder', NEW.id, 
    true, 'PROPERTY_DOSSIER_V1', 'PROPERTY', 'MOD_04'
  )
  RETURNING id INTO root_node_id;
  
  -- Rest der Unterordner...
END;
$$ LANGUAGE plpgsql;
```

### Phase 4: Vehicle-Trigger anpassen

```sql
-- Vehicle-Ordner unter MOD-17-Root erstellen
CREATE OR REPLACE FUNCTION create_vehicle_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  mod17_root_id uuid;
  vehicles_folder_id uuid;
  root_node_id uuid;
  -- ...
BEGIN
  -- 1. MOD-17 Root finden/erstellen
  SELECT id INTO mod17_root_id FROM storage_nodes 
  WHERE tenant_id = NEW.tenant_id AND template_id = 'MOD_17_ROOT';
  
  IF mod17_root_id IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
    VALUES (NEW.tenant_id, 'Car-Management', 'folder', 'MOD_17_ROOT', 'MOD_17', true)
    RETURNING id INTO mod17_root_id;
  END IF;
  
  -- 2. "Fahrzeuge"-Unterordner finden/erstellen
  SELECT id INTO vehicles_folder_id FROM storage_nodes
  WHERE parent_id = mod17_root_id AND name = 'Fahrzeuge';
  
  IF vehicles_folder_id IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, template_id, module_code, auto_created)
    VALUES (NEW.tenant_id, mod17_root_id, 'Fahrzeuge', 'folder', 'CAR_VEHICLES', 'MOD_17', true)
    RETURNING id INTO vehicles_folder_id;
  END IF;
  
  -- 3. Vehicle-Ordner UNTER Fahrzeuge erstellen
  INSERT INTO storage_nodes (
    tenant_id, parent_id, name, node_type, 
    auto_created, template_id, scope_hint, module_code
  )
  VALUES (
    NEW.tenant_id, vehicles_folder_id, vehicle_folder_name, 'folder', 
    true, 'VEHICLE_DOSSIER_V1', 'CAR', 'MOD_17'
  )
  RETURNING id INTO root_node_id;
  
  -- Unterordner erstellen...
END;
$$ LANGUAGE plpgsql;
```

### Phase 5: StorageFolderTree refactoren

```typescript
// Neue Logik: Module-basierte Hierarchie
const SYSTEM_MODULE_ICONS = {
  'MOD_04_ROOT': Building2,      // Immobilien
  'MOD_06_ROOT': ShoppingCart,   // Verkauf
  'MOD_07_ROOT': Landmark,       // Finanzierung
  'MOD_16_ROOT': Hammer,         // Sanierung
  'MOD_17_ROOT': Car,            // Car-Management
  'inbox': Inbox,
  'user_files': FolderHeart,
  'archive': Archive,
};

// Root-Nodes sind jetzt NUR System-Ordner und Modul-Roots
const rootNodes = nodes.filter(n => 
  n.parent_id === null && 
  (n.node_type === 'system' || n.template_id?.endsWith('_ROOT'))
);
```

### Phase 6: Verkaufsauftrag → Listing-Ordner

```sql
-- Bei Listing-Erstellung: Ordner unter MOD-06 erstellen
CREATE OR REPLACE FUNCTION create_listing_folder_on_activation()
RETURNS TRIGGER AS $$
DECLARE
  mod06_root_id uuid;
  listing_folder_id uuid;
  property_folder_id uuid;
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    -- MOD-06 Root finden
    SELECT id INTO mod06_root_id FROM storage_nodes
    WHERE tenant_id = NEW.tenant_id AND template_id = 'MOD_06_ROOT';
    
    -- Listing-Ordner erstellen (mit Link zu Property-Dokumenten)
    INSERT INTO storage_nodes (
      tenant_id, parent_id, name, node_type, 
      template_id, module_code, auto_created
    )
    VALUES (
      NEW.tenant_id, mod06_root_id, 
      'Listing ' || NEW.public_id, 'folder',
      'LISTING_DOSSIER_V1', 'MOD_06', true
    )
    RETURNING id INTO listing_folder_id;
    
    -- Referenz auf Property-Fotos erstellen (symbolic link)
    INSERT INTO document_links (
      tenant_id, node_id, object_type, object_id, link_status
    )
    SELECT 
      NEW.tenant_id, listing_folder_id, 'listing', NEW.id, 'active'
    FROM storage_nodes
    WHERE property_id = NEW.property_id 
      AND doc_type_hint = 'DOC_PHOTOS';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Teil 4: Migrations-Strategie

### Schritt 1: Schema-Migration
- `module_code` Spalte hinzufügen
- Constraint erstellen
- Index erstellen

### Schritt 2: Bestehende Daten migrieren
```sql
-- Bestehende Nodes auf module_code setzen
UPDATE storage_nodes SET module_code = 'MOD_04' 
WHERE scope_hint = 'PROPERTY' OR template_id = 'PROPERTY_DOSSIER_V1';

UPDATE storage_nodes SET module_code = 'MOD_17' 
WHERE scope_hint = 'CAR' OR template_id LIKE '%VEHICLE%' OR template_id LIKE '%CAR%';

UPDATE storage_nodes SET module_code = 'MOD_07' 
WHERE scope_hint = 'FINANCE' OR template_id LIKE '%FINANCE%';

UPDATE storage_nodes SET module_code = 'SYSTEM' 
WHERE node_type = 'system';
```

### Schritt 3: Modul-Roots für bestehende Tenants erstellen
```sql
-- Für jeden Tenant: Modul-Roots erstellen falls nicht vorhanden
INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  tenant_id, 'Immobilien', 'folder', 'MOD_04_ROOT', 'MOD_04', true
FROM storage_nodes
WHERE NOT EXISTS (
  SELECT 1 FROM storage_nodes s2 
  WHERE s2.tenant_id = storage_nodes.tenant_id 
    AND s2.template_id = 'MOD_04_ROOT'
);
-- Analog für andere Module...
```

### Schritt 4: Orphan-Nodes unter Modul-Roots verschieben
```sql
-- Property-Ordner unter MOD-04-Root verschieben
UPDATE storage_nodes SET parent_id = (
  SELECT id FROM storage_nodes parent 
  WHERE parent.tenant_id = storage_nodes.tenant_id 
    AND parent.template_id = 'MOD_04_ROOT'
)
WHERE template_id = 'PROPERTY_DOSSIER_V1' 
  AND parent_id IS NULL;
```

### Schritt 5: Trigger aktualisieren
- `create_property_folder_structure()` anpassen
- `create_vehicle_folder_structure()` anpassen
- Neuen Trigger für Listings erstellen

### Schritt 6: Frontend anpassen
- `StorageFolderTree.tsx` für Modul-Hierarchie
- `StorageTab.tsx` Seeding-Logik aktualisieren

---

## Teil 5: Betroffene Dateien

| Datei | Änderungen |
|-------|------------|
| DB Migration | Schema + Daten-Migration |
| `create_property_folder_structure()` | parent_id = MOD_04_ROOT |
| `create_vehicle_folder_structure()` | parent_id = CAR_VEHICLES unter MOD_17_ROOT |
| `StorageTab.tsx` | Seeding auf Modul-Roots umstellen |
| `StorageFolderTree.tsx` | Modul-basierte Hierarchie |
| `DatenraumTab.tsx` | Keine Änderung nötig (filtert nach property_id) |
| Neue Trigger | `create_listing_folder_on_activation()` |

---

## Teil 6: Akzeptanzkriterien

| # | Test |
|---|------|
| 1 | Bei Tenant-Erstellung: Modul-Roots vorhanden (MOD-04, 06, 07, 16, 17) |
| 2 | Bei Tenant-Erstellung: System-Ordner vorhanden (Inbox, Eigene Dateien, Archiv) |
| 3 | Property-Ordner erscheint unter "Immobilien" in MOD-03 Storage |
| 4 | Vehicle-Ordner erscheint unter "Car-Management/Fahrzeuge" in MOD-03 Storage |
| 5 | Finance-Ordner erscheint unter "Finanzierung" in MOD-03 Storage |
| 6 | Bei Verkaufsauftrag-Aktivierung: Listing-Ordner unter "Verkauf" erstellt |
| 7 | Fotos aus MOD-04 werden im Verkaufs-Exposé korrekt angezeigt |
| 8 | DatenraumTab in MOD-04 zeigt weiterhin nur Property-spezifische Ordner |
| 9 | Keine doppelten Ordner nach Migration |
| 10 | Alle bestehenden document_links bleiben funktional |

---

## Teil 7: Implementierungsreihenfolge

1. **DB-Migration (Schema)** — Spalte, Constraint, Index
2. **Daten-Migration** — Bestehende Nodes kategorisieren
3. **Modul-Roots erstellen** — Für alle Tenants
4. **Orphans verschieben** — Unter Modul-Roots
5. **Trigger updaten** — Property, Vehicle, Listing
6. **Frontend anpassen** — StorageTab, StorageFolderTree
7. **Testen** — E2E durch alle Golden Paths
