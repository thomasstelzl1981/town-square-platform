
-- =====================================================
-- Storage Architecture: Complete Module Tree + Constraint Fix
-- =====================================================

-- Step 1: Fix module_code CHECK constraint to allow ALL 20 modules
ALTER TABLE public.storage_nodes 
DROP CONSTRAINT IF EXISTS storage_nodes_module_code_check;

ALTER TABLE public.storage_nodes 
ADD CONSTRAINT storage_nodes_module_code_check
CHECK (module_code IN (
  'MOD_01', 'MOD_02', 'MOD_03', 'MOD_04', 'MOD_05',
  'MOD_06', 'MOD_07', 'MOD_08', 'MOD_09', 'MOD_10',
  'MOD_11', 'MOD_12', 'MOD_13', 'MOD_14', 'MOD_15',
  'MOD_16', 'MOD_17', 'MOD_18', 'MOD_19', 'MOD_20',
  'SYSTEM', NULL
));

-- Step 2: Migrate existing MOD-13 (hyphen) → MOD_13 (underscore)
UPDATE public.storage_nodes 
SET module_code = 'MOD_13' 
WHERE module_code = 'MOD-13';

-- Step 3: Replace seed_tenant_storage_roots with ALL 20 modules
CREATE OR REPLACE FUNCTION public.seed_tenant_storage_roots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- System folders
  INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
  VALUES 
    (NEW.id, 'Posteingang', 'system', 'inbox', 'SYSTEM', true),
    (NEW.id, 'Eigene Dateien', 'system', 'user_files', 'SYSTEM', true),
    (NEW.id, 'Archiv', 'system', 'archive', 'SYSTEM', true),
    (NEW.id, 'Zur Prüfung', 'system', 'needs_review', 'SYSTEM', true),
    (NEW.id, 'Sonstiges', 'system', 'sonstiges', 'SYSTEM', true),
    (NEW.id, 'Papierkorb', 'system', 'TRASH_ROOT', 'SYSTEM', true);
  
  -- ALL 20 Module root folders
  INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
  VALUES 
    (NEW.id, 'Stammdaten', 'folder', 'MOD_01_ROOT', 'MOD_01', true),
    (NEW.id, 'KI Office', 'folder', 'MOD_02_ROOT', 'MOD_02', true),
    (NEW.id, 'DMS', 'folder', 'MOD_03_ROOT', 'MOD_03', true),
    (NEW.id, 'Immobilien', 'folder', 'MOD_04_ROOT', 'MOD_04', true),
    (NEW.id, 'MSV', 'folder', 'MOD_05_ROOT', 'MOD_05', true),
    (NEW.id, 'Verkauf', 'folder', 'MOD_06_ROOT', 'MOD_06', true),
    (NEW.id, 'Finanzierung', 'folder', 'MOD_07_ROOT', 'MOD_07', true),
    (NEW.id, 'Investments', 'folder', 'MOD_08_ROOT', 'MOD_08', true),
    (NEW.id, 'Vertriebspartner', 'folder', 'MOD_09_ROOT', 'MOD_09', true),
    (NEW.id, 'Leads', 'folder', 'MOD_10_ROOT', 'MOD_10', true),
    (NEW.id, 'Finanzierungsmanager', 'folder', 'MOD_11_ROOT', 'MOD_11', true),
    (NEW.id, 'Akquise-Manager', 'folder', 'MOD_12_ROOT', 'MOD_12', true),
    (NEW.id, 'Projekte', 'folder', 'MOD_13_ROOT', 'MOD_13', true),
    (NEW.id, 'Communication Pro', 'folder', 'MOD_14_ROOT', 'MOD_14', true),
    (NEW.id, 'Fortbildung', 'folder', 'MOD_15_ROOT', 'MOD_15', true),
    (NEW.id, 'Services', 'folder', 'MOD_16_ROOT', 'MOD_16', true),
    (NEW.id, 'Car-Management', 'folder', 'MOD_17_ROOT', 'MOD_17', true),
    (NEW.id, 'Finanzanalyse', 'folder', 'MOD_18_ROOT', 'MOD_18', true),
    (NEW.id, 'Photovoltaik', 'folder', 'MOD_19_ROOT', 'MOD_19', true),
    (NEW.id, 'Miety', 'folder', 'MOD_20_ROOT', 'MOD_20', true);
  
  RETURN NEW;
END;
$$;

-- Step 4: Replace ensure_module_root_folders with ALL 20 modules
CREATE OR REPLACE FUNCTION public.ensure_module_root_folders(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_roots text[][] := ARRAY[
    ARRAY['MOD_01_ROOT', 'Stammdaten', 'MOD_01'],
    ARRAY['MOD_02_ROOT', 'KI Office', 'MOD_02'],
    ARRAY['MOD_03_ROOT', 'DMS', 'MOD_03'],
    ARRAY['MOD_04_ROOT', 'Immobilien', 'MOD_04'],
    ARRAY['MOD_05_ROOT', 'MSV', 'MOD_05'],
    ARRAY['MOD_06_ROOT', 'Verkauf', 'MOD_06'],
    ARRAY['MOD_07_ROOT', 'Finanzierung', 'MOD_07'],
    ARRAY['MOD_08_ROOT', 'Investments', 'MOD_08'],
    ARRAY['MOD_09_ROOT', 'Vertriebspartner', 'MOD_09'],
    ARRAY['MOD_10_ROOT', 'Leads', 'MOD_10'],
    ARRAY['MOD_11_ROOT', 'Finanzierungsmanager', 'MOD_11'],
    ARRAY['MOD_12_ROOT', 'Akquise-Manager', 'MOD_12'],
    ARRAY['MOD_13_ROOT', 'Projekte', 'MOD_13'],
    ARRAY['MOD_14_ROOT', 'Communication Pro', 'MOD_14'],
    ARRAY['MOD_15_ROOT', 'Fortbildung', 'MOD_15'],
    ARRAY['MOD_16_ROOT', 'Services', 'MOD_16'],
    ARRAY['MOD_17_ROOT', 'Car-Management', 'MOD_17'],
    ARRAY['MOD_18_ROOT', 'Finanzanalyse', 'MOD_18'],
    ARRAY['MOD_19_ROOT', 'Photovoltaik', 'MOD_19'],
    ARRAY['MOD_20_ROOT', 'Miety', 'MOD_20'],
    ARRAY['TRASH_ROOT', 'Papierkorb', 'SYSTEM']
  ];
  v_root text[];
BEGIN
  FOREACH v_root SLICE 1 IN ARRAY v_module_roots
  LOOP
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, template_id, module_code)
    VALUES (p_tenant_id, NULL, v_root[2], 'folder', v_root[1], v_root[3])
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Step 5: Backfill existing tenants — create missing module roots
DO $$
DECLARE
  v_tid uuid;
BEGIN
  FOR v_tid IN SELECT id FROM public.organizations
  LOOP
    PERFORM public.ensure_module_root_folders(v_tid);
  END LOOP;
END;
$$;

-- Step 6: Create PV plant folder structure trigger
CREATE OR REPLACE FUNCTION public.create_pv_plant_folder_structure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mod_root_id uuid;
  v_plant_folder_id uuid;
  v_sub_folders text[] := ARRAY[
    '01_Stammdaten',
    '02_MaStR_BNetzA',
    '03_Netzbetreiber',
    '04_Zaehler',
    '05_Wechselrichter_und_Speicher',
    '06_Versicherung',
    '07_Steuer_USt_BWA',
    '08_Wartung_Service'
  ];
  v_folder text;
BEGIN
  -- Find MOD_19 root for this tenant
  SELECT id INTO v_mod_root_id
  FROM storage_nodes
  WHERE tenant_id = NEW.tenant_id
    AND template_id = 'MOD_19_ROOT'
  LIMIT 1;

  -- If no root exists, ensure it
  IF v_mod_root_id IS NULL THEN
    PERFORM ensure_module_root_folders(NEW.tenant_id);
    SELECT id INTO v_mod_root_id
    FROM storage_nodes
    WHERE tenant_id = NEW.tenant_id
      AND template_id = 'MOD_19_ROOT'
    LIMIT 1;
  END IF;

  IF v_mod_root_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create plant folder
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, module_code, pv_plant_id, auto_created)
  VALUES (NEW.tenant_id, v_mod_root_id, NEW.name, 'folder', 'MOD_19', NEW.id, true)
  RETURNING id INTO v_plant_folder_id;

  -- Create sub-folders
  FOREACH v_folder IN ARRAY v_sub_folders
  LOOP
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, module_code, pv_plant_id, auto_created)
    VALUES (NEW.tenant_id, v_plant_folder_id, v_folder, 'folder', 'MOD_19', NEW.id, true);
  END LOOP;

  -- Update pv_plants with dms_root_node_id
  UPDATE pv_plants SET dms_root_node_id = v_plant_folder_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_pv_plant_folders ON public.pv_plants;
CREATE TRIGGER trg_create_pv_plant_folders
AFTER INSERT ON public.pv_plants
FOR EACH ROW
EXECUTE FUNCTION public.create_pv_plant_folder_structure();
