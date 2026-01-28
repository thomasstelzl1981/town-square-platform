-- ============================================================================
-- PHASE B: DMS-TEMPLATE-SYSTEM - TRIGGER UPDATES
-- ============================================================================

-- B1: Updated Property Folder Structure Trigger (with doc_type_hints)
CREATE OR REPLACE FUNCTION public.create_property_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  root_node_id uuid;
  allgemein_id uuid;
  einheiten_id uuid;
  prop_label text;
  template_nodes JSONB := '[
    {"sort": 0, "name": "00_Projektdokumentation", "doc_type_hint": "DOC_PROJECT"},
    {"sort": 1, "name": "01_Exposé Ankauf", "doc_type_hint": "DOC_EXPOSE_BUY"},
    {"sort": 2, "name": "02_Exposé Sonstiges", "doc_type_hint": "DOC_EXPOSE_MISC"},
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
  -- Label für Ordner: Code oder Adresse
  prop_label := COALESCE(NEW.code, '') || CASE WHEN NEW.code IS NOT NULL THEN ' - ' ELSE '' END || NEW.address;
  
  -- Erstelle Haupt-Ordner für Property mit Template-ID
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created, template_id, scope_hint)
  VALUES (NEW.tenant_id, NULL, prop_label, 'folder', NEW.id, true, 'PROPERTY_DOSSIER_V1', 'PROPERTY')
  RETURNING id INTO root_node_id;
  
  -- Erstelle Template-Ordner mit doc_type_hints
  FOR node_data IN SELECT * FROM jsonb_array_elements(template_nodes)
  LOOP
    INSERT INTO storage_nodes (
      tenant_id, property_id, parent_id, name, node_type, 
      auto_created, doc_type_hint, sort_index, scope_hint
    )
    VALUES (
      NEW.tenant_id, NEW.id, root_node_id, 
      node_data->>'name', 'folder', true,
      node_data->>'doc_type_hint',
      (node_data->>'sort')::int,
      'PROPERTY'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- B2: Updated Unit Folder Trigger (for Multi-Unit with doc_type_hints)
CREATE OR REPLACE FUNCTION public.create_unit_folder()
RETURNS TRIGGER AS $$
DECLARE
  property_root uuid;
  einheiten_parent_id uuid;
  unit_folder_id uuid;
  prop_multi_unit BOOLEAN;
  template_nodes JSONB := '[
    {"sort": 0, "name": "05_Grundriss", "doc_type_hint": "DOC_FLOORPLAN"},
    {"sort": 1, "name": "08_Mietvertrag", "doc_type_hint": "DOC_LEASE_CONTRACT"},
    {"sort": 2, "name": "09_Rechnungen", "doc_type_hint": "DOC_INVOICE"},
    {"sort": 3, "name": "11_Fotos", "doc_type_hint": "DOC_PHOTOS"},
    {"sort": 4, "name": "14_Sonstiges", "doc_type_hint": "DOC_MISC"},
    {"sort": 5, "name": "16_Sanierung", "doc_type_hint": "DOC_RENOVATION"}
  ]'::JSONB;
  node_data JSONB;
BEGIN
  -- Prüfen ob Multi-Unit aktiviert (default: false = Single Unit = keine Unit-Unterordner)
  SELECT COALESCE(multi_unit_enabled, false) INTO prop_multi_unit 
  FROM properties WHERE id = NEW.property_id;
  
  -- Bei Single-Unit Properties: keine Unit-Unterordner erstellen
  IF NOT prop_multi_unit THEN
    RETURN NEW;
  END IF;

  -- Property-Root finden
  SELECT id INTO property_root FROM storage_nodes 
  WHERE property_id = NEW.property_id AND parent_id IS NULL AND node_type = 'folder'
  LIMIT 1;
  
  IF property_root IS NULL THEN
    RETURN NEW;
  END IF;

  -- Finde oder erstelle "Einheiten"-Ordner des Properties
  SELECT id INTO einheiten_parent_id FROM storage_nodes 
  WHERE property_id = NEW.property_id AND name = 'Einheiten' AND parent_id = property_root;
  
  IF einheiten_parent_id IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, property_id, parent_id, name, node_type, auto_created, scope_hint)
    VALUES (NEW.tenant_id, NEW.property_id, property_root, 'Einheiten', 'folder', true, 'PROPERTY')
    RETURNING id INTO einheiten_parent_id;
  END IF;
  
  -- Erstelle Ordner für diese Unit
  INSERT INTO storage_nodes (
    tenant_id, property_id, unit_id, parent_id, name, 
    node_type, auto_created, template_id, scope_hint
  )
  VALUES (
    NEW.tenant_id, NEW.property_id, NEW.id, einheiten_parent_id,
    COALESCE(NEW.code, NEW.unit_number, 'Einheit'),
    'folder', true, 'UNIT_DOSSIER_V1', 'UNIT'
  )
  RETURNING id INTO unit_folder_id;
  
  -- Erstelle Template-Unterordner für Einheit
  FOR node_data IN SELECT * FROM jsonb_array_elements(template_nodes)
  LOOP
    INSERT INTO storage_nodes (
      tenant_id, property_id, unit_id, parent_id, name, 
      node_type, auto_created, doc_type_hint, sort_index, scope_hint
    )
    VALUES (
      NEW.tenant_id, NEW.property_id, NEW.id, unit_folder_id,
      node_data->>'name', 'folder', true,
      node_data->>'doc_type_hint',
      (node_data->>'sort')::int,
      'UNIT'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure triggers are attached
DROP TRIGGER IF EXISTS create_property_folder_trigger ON properties;
CREATE TRIGGER create_property_folder_trigger
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION create_property_folder_structure();

DROP TRIGGER IF EXISTS create_unit_folder_trigger ON units;
CREATE TRIGGER create_unit_folder_trigger
  AFTER INSERT ON units
  FOR EACH ROW
  EXECUTE FUNCTION create_unit_folder();