-- =============================================================================
-- MOD-17 CAR-MANAGEMENT: DMS Folder Structure Trigger (VEHICLE_DOSSIER_V1)
-- =============================================================================

-- Create function to generate vehicle folder structure
CREATE OR REPLACE FUNCTION public.create_vehicle_folder_structure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  root_node_id uuid;
  vehicle_folder_name text;
  template_nodes JSONB := '[
    {"sort": 0, "name": "01_Fahrzeugschein", "doc_type_hint": "DOC_FAHRZEUGSCHEIN"},
    {"sort": 1, "name": "02_Finanzierung_Leasing", "doc_type_hint": "DOC_LEASING_CONTRACT"},
    {"sort": 2, "name": "03_Versicherung", "doc_type_hint": "DOC_INSURANCE_POLICY"},
    {"sort": 3, "name": "04_Schaeden", "doc_type_hint": "DOC_CLAIM_REPORT"},
    {"sort": 4, "name": "05_Service_Rechnungen", "doc_type_hint": "DOC_SERVICE_INVOICE"},
    {"sort": 5, "name": "06_Fahrtenbuch_Exports", "doc_type_hint": "DOC_LOGBOOK_EXPORT"},
    {"sort": 6, "name": "99_Sonstiges", "doc_type_hint": "DOC_MISC"}
  ]'::JSONB;
  node_data JSONB;
BEGIN
  -- Build folder name: "B-XY 1234 - abc123"
  vehicle_folder_name := NEW.license_plate || ' - ' || substring(NEW.id::text, 1, 8);
  
  -- Create root folder for Vehicle with template ID
  INSERT INTO storage_nodes (
    tenant_id, 
    parent_id, 
    name, 
    node_type, 
    auto_created, 
    template_id, 
    scope_hint
  )
  VALUES (
    NEW.tenant_id, 
    NULL, 
    vehicle_folder_name, 
    'folder', 
    true, 
    'VEHICLE_DOSSIER_V1',
    'CAR'
  )
  RETURNING id INTO root_node_id;
  
  -- Update vehicle with DMS folder reference
  NEW.dms_folder_id := root_node_id;
  
  -- Create template subfolders with doc_type_hints
  FOR node_data IN SELECT * FROM jsonb_array_elements(template_nodes)
  LOOP
    INSERT INTO storage_nodes (
      tenant_id, 
      parent_id, 
      name, 
      node_type, 
      auto_created, 
      doc_type_hint, 
      sort_index, 
      scope_hint
    )
    VALUES (
      NEW.tenant_id, 
      root_node_id, 
      node_data->>'name', 
      'folder', 
      true,
      node_data->>'doc_type_hint',
      (node_data->>'sort')::int,
      'CAR'
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on cars_vehicles INSERT
DROP TRIGGER IF EXISTS trg_create_vehicle_folder_structure ON cars_vehicles;
CREATE TRIGGER trg_create_vehicle_folder_structure
  BEFORE INSERT ON cars_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION create_vehicle_folder_structure();

-- Add comment for documentation
COMMENT ON FUNCTION create_vehicle_folder_structure() IS 
  'Creates VEHICLE_DOSSIER_V1 folder structure in DMS when a vehicle is created. Part of MOD-17 Car-Management.';