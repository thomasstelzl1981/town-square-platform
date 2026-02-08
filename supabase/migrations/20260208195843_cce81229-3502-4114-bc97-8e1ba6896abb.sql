-- =====================================================
-- DMS Storage Architecture Refactoring Migration
-- Phase 0: Fix node_type constraint to allow 'system'
-- =====================================================

-- Drop and recreate node_type constraint to include 'system'
ALTER TABLE public.storage_nodes 
DROP CONSTRAINT IF EXISTS storage_nodes_node_type_check;

ALTER TABLE public.storage_nodes 
ADD CONSTRAINT storage_nodes_node_type_check 
CHECK (node_type IN ('folder', 'file', 'system'));

-- =====================================================
-- Phase 1: Schema Extension
-- =====================================================

-- Add module_code column if not exists
ALTER TABLE public.storage_nodes 
ADD COLUMN IF NOT EXISTS module_code TEXT;

COMMENT ON COLUMN public.storage_nodes.module_code IS 
  'Modul-Zuordnung: MOD_03, MOD_04, MOD_06, MOD_07, MOD_16, MOD_17, SYSTEM';

-- Drop if exists then add constraint for valid module_codes
ALTER TABLE public.storage_nodes 
DROP CONSTRAINT IF EXISTS storage_nodes_module_code_check;

ALTER TABLE public.storage_nodes 
ADD CONSTRAINT storage_nodes_module_code_check
CHECK (module_code IN (
  'MOD_03', 'MOD_04', 'MOD_05', 'MOD_06', 'MOD_07', 
  'MOD_08', 'MOD_16', 'MOD_17', 'SYSTEM', NULL
));

-- Create index for fast module filtering
CREATE INDEX IF NOT EXISTS idx_storage_nodes_module_code 
ON public.storage_nodes(tenant_id, module_code);

-- =====================================================
-- Phase 2: Migrate existing data
-- =====================================================

-- Set module_code for existing property nodes
UPDATE public.storage_nodes SET module_code = 'MOD_04' 
WHERE module_code IS NULL 
  AND (scope_hint = 'PROPERTY' OR template_id = 'PROPERTY_DOSSIER_V1' OR property_id IS NOT NULL);

-- Set module_code for existing car/vehicle nodes
UPDATE public.storage_nodes SET module_code = 'MOD_17' 
WHERE module_code IS NULL 
  AND (scope_hint = 'CAR' OR template_id LIKE '%VEHICLE%' OR template_id LIKE '%CAR%' OR template_id LIKE 'car_%');

-- Set module_code for existing finance nodes
UPDATE public.storage_nodes SET module_code = 'MOD_07' 
WHERE module_code IS NULL 
  AND (scope_hint = 'FINANCE' OR template_id LIKE '%FINANCE%' OR template_id LIKE '%BONIT%');

-- Set module_code for system nodes
UPDATE public.storage_nodes SET module_code = 'SYSTEM' 
WHERE module_code IS NULL AND node_type = 'system';

-- =====================================================
-- Phase 3: Create Module Root folders for existing tenants
-- =====================================================

-- Create MOD_04_ROOT (Immobilien) for tenants that don't have it
INSERT INTO public.storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  o.id, 'Immobilien', 'folder', 'MOD_04_ROOT', 'MOD_04', true
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.storage_nodes s 
  WHERE s.tenant_id = o.id AND s.template_id = 'MOD_04_ROOT'
);

-- Create MOD_06_ROOT (Verkauf) for tenants that don't have it
INSERT INTO public.storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  o.id, 'Verkauf', 'folder', 'MOD_06_ROOT', 'MOD_06', true
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.storage_nodes s 
  WHERE s.tenant_id = o.id AND s.template_id = 'MOD_06_ROOT'
);

-- Create MOD_07_ROOT (Finanzierung) for tenants that don't have it
INSERT INTO public.storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  o.id, 'Finanzierung', 'folder', 'MOD_07_ROOT', 'MOD_07', true
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.storage_nodes s 
  WHERE s.tenant_id = o.id AND s.template_id = 'MOD_07_ROOT'
);

-- Create MOD_16_ROOT (Sanierung) for tenants that don't have it
INSERT INTO public.storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  o.id, 'Sanierung', 'folder', 'MOD_16_ROOT', 'MOD_16', true
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.storage_nodes s 
  WHERE s.tenant_id = o.id AND s.template_id = 'MOD_16_ROOT'
);

-- Create MOD_17_ROOT (Car-Management) for tenants that don't have it
INSERT INTO public.storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  o.id, 'Car-Management', 'folder', 'MOD_17_ROOT', 'MOD_17', true
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.storage_nodes s 
  WHERE s.tenant_id = o.id AND s.template_id = 'MOD_17_ROOT'
);

-- Create "Eigene Dateien" system folder for tenants that don't have it
INSERT INTO public.storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  o.id, 'Eigene Dateien', 'system', 'user_files', 'SYSTEM', true
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.storage_nodes s 
  WHERE s.tenant_id = o.id AND s.template_id = 'user_files'
);

-- =====================================================
-- Phase 4: Move orphan nodes under Module Roots
-- =====================================================

-- Move Property dossiers (parent_id = NULL) under MOD_04_ROOT
UPDATE public.storage_nodes child
SET parent_id = parent.id
FROM public.storage_nodes parent
WHERE child.template_id = 'PROPERTY_DOSSIER_V1'
  AND child.parent_id IS NULL
  AND parent.tenant_id = child.tenant_id
  AND parent.template_id = 'MOD_04_ROOT';

-- Create "Fahrzeuge" subfolder under MOD_17_ROOT if needed
INSERT INTO public.storage_nodes (tenant_id, parent_id, name, node_type, template_id, module_code, auto_created)
SELECT DISTINCT 
  root.tenant_id, root.id, 'Fahrzeuge', 'folder', 'CAR_VEHICLES', 'MOD_17', true
FROM public.storage_nodes root
WHERE root.template_id = 'MOD_17_ROOT'
  AND NOT EXISTS (
    SELECT 1 FROM public.storage_nodes s 
    WHERE s.tenant_id = root.tenant_id 
      AND s.parent_id = root.id 
      AND s.template_id = 'CAR_VEHICLES'
  );

-- Move orphan vehicle dossiers under the "Fahrzeuge" folder
UPDATE public.storage_nodes child
SET parent_id = vehicles.id
FROM public.storage_nodes vehicles
WHERE child.template_id = 'VEHICLE_DOSSIER_V1'
  AND child.parent_id IS NULL
  AND vehicles.tenant_id = child.tenant_id
  AND vehicles.template_id = 'CAR_VEHICLES';

-- =====================================================
-- Phase 5: Update property folder trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_property_folder_structure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mod04_root_id uuid;
  root_node_id uuid;
  prop_label text;
  subfolders text[] := ARRAY[
    '00_Projektdokumentation',
    '01_Ankauf',
    '02_Teilungserklärung',
    '03_Wirtschaftsplan',
    '04_Eigentümerversammlungen',
    '05_Instandhaltungsrücklagen',
    '06_Verträge',
    '07_Nebenkostenabrechnungen',
    '08_Mietverträge',
    '09_Mieterkorrespondenz',
    '10_Hausverwaltung',
    '11_Fotos',
    '12_Grundbuch',
    '13_Versicherungen',
    '14_Darlehen_Finanzierung',
    '15_Steuern',
    '16_Renovierungen_Reparaturen',
    '17_Grundsteuer'
  ];
  subfolder text;
BEGIN
  -- Build property label
  prop_label := COALESCE(NEW.code, '') || ' - ' || COALESCE(NEW.address, NEW.id::text);
  
  -- 1. Find or create MOD-04 Root folder
  SELECT id INTO mod04_root_id FROM storage_nodes 
  WHERE tenant_id = NEW.tenant_id 
    AND template_id = 'MOD_04_ROOT'
  LIMIT 1;
  
  IF mod04_root_id IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
    VALUES (NEW.tenant_id, 'Immobilien', 'folder', 'MOD_04_ROOT', 'MOD_04', true)
    RETURNING id INTO mod04_root_id;
  END IF;
  
  -- 2. Create Property folder UNDER MOD-04 Root
  INSERT INTO storage_nodes (
    tenant_id, parent_id, name, node_type, property_id, 
    auto_created, template_id, scope_hint, module_code
  )
  VALUES (
    NEW.tenant_id, mod04_root_id, prop_label, 'folder', NEW.id, 
    true, 'PROPERTY_DOSSIER_V1', 'PROPERTY', 'MOD_04'
  )
  RETURNING id INTO root_node_id;
  
  -- 3. Create all subfolders
  FOREACH subfolder IN ARRAY subfolders
  LOOP
    INSERT INTO storage_nodes (
      tenant_id, parent_id, name, node_type, property_id, 
      auto_created, template_id, scope_hint, module_code
    )
    VALUES (
      NEW.tenant_id, root_node_id, subfolder, 'folder', NEW.id,
      true, subfolder, 'PROPERTY', 'MOD_04'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Phase 6: Update vehicle folder trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_vehicle_folder_structure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mod17_root_id uuid;
  vehicles_folder_id uuid;
  root_node_id uuid;
  vehicle_label text;
  subfolders text[] := ARRAY[
    '01_Fahrzeugschein',
    '02_Finanzierung_Leasing',
    '03_Versicherung',
    '04_Reparaturen_Wartung',
    '05_TÜV_Hauptuntersuchung',
    '06_Tankkarten_Abrechnungen',
    '07_Sonstiges'
  ];
  subfolder text;
BEGIN
  -- Build vehicle label
  vehicle_label := COALESCE(NEW.license_plate, '') || ' - ' || COALESCE(NEW.make, '') || ' ' || COALESCE(NEW.model, '');
  
  -- 1. Find or create MOD-17 Root folder
  SELECT id INTO mod17_root_id FROM storage_nodes 
  WHERE tenant_id = NEW.tenant_id 
    AND template_id = 'MOD_17_ROOT'
  LIMIT 1;
  
  IF mod17_root_id IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
    VALUES (NEW.tenant_id, 'Car-Management', 'folder', 'MOD_17_ROOT', 'MOD_17', true)
    RETURNING id INTO mod17_root_id;
  END IF;
  
  -- 2. Find or create "Fahrzeuge" subfolder
  SELECT id INTO vehicles_folder_id FROM storage_nodes
  WHERE tenant_id = NEW.tenant_id 
    AND parent_id = mod17_root_id 
    AND template_id = 'CAR_VEHICLES';
  
  IF vehicles_folder_id IS NULL THEN
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, template_id, module_code, auto_created)
    VALUES (NEW.tenant_id, mod17_root_id, 'Fahrzeuge', 'folder', 'CAR_VEHICLES', 'MOD_17', true)
    RETURNING id INTO vehicles_folder_id;
  END IF;
  
  -- 3. Create Vehicle folder UNDER Fahrzeuge
  INSERT INTO storage_nodes (
    tenant_id, parent_id, name, node_type, 
    auto_created, template_id, scope_hint, module_code
  )
  VALUES (
    NEW.tenant_id, vehicles_folder_id, vehicle_label, 'folder', 
    true, 'VEHICLE_DOSSIER_V1', 'CAR', 'MOD_17'
  )
  RETURNING id INTO root_node_id;
  
  -- 4. Create all subfolders
  FOREACH subfolder IN ARRAY subfolders
  LOOP
    INSERT INTO storage_nodes (
      tenant_id, parent_id, name, node_type,
      auto_created, template_id, scope_hint, module_code
    )
    VALUES (
      NEW.tenant_id, root_node_id, subfolder, 'folder',
      true, subfolder, 'CAR', 'MOD_17'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Phase 7: Create listing folder trigger (Verkaufsauftrag)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_listing_folder_on_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mod06_root_id uuid;
  listing_folder_id uuid;
  listing_label text;
BEGIN
  -- Only trigger when status changes to 'active'
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'active') THEN
    
    -- Build listing label
    listing_label := 'Listing ' || COALESCE(NEW.public_id, NEW.id::text);
    
    -- 1. Find or create MOD-06 Root folder
    SELECT id INTO mod06_root_id FROM storage_nodes
    WHERE tenant_id = NEW.tenant_id AND template_id = 'MOD_06_ROOT';
    
    IF mod06_root_id IS NULL THEN
      INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
      VALUES (NEW.tenant_id, 'Verkauf', 'folder', 'MOD_06_ROOT', 'MOD_06', true)
      RETURNING id INTO mod06_root_id;
    END IF;
    
    -- 2. Create Listing folder under MOD-06 Root
    INSERT INTO storage_nodes (
      tenant_id, parent_id, name, node_type, 
      template_id, module_code, auto_created
    )
    VALUES (
      NEW.tenant_id, mod06_root_id, listing_label, 'folder',
      'LISTING_DOSSIER_V1', 'MOD_06', true
    )
    RETURNING id INTO listing_folder_id;
    
    -- 3. Create symbolic link to property photos if property exists
    IF NEW.property_id IS NOT NULL THEN
      INSERT INTO document_links (tenant_id, node_id, object_type, object_id, link_status)
      SELECT DISTINCT
        NEW.tenant_id, listing_folder_id, 'listing', NEW.id, 'active'
      FROM storage_nodes
      WHERE property_id = NEW.property_id 
        AND template_id = '11_Fotos'
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on listings table for activation
DROP TRIGGER IF EXISTS trg_create_listing_folder ON public.listings;
CREATE TRIGGER trg_create_listing_folder
AFTER INSERT OR UPDATE OF status ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.create_listing_folder_on_activation();

-- =====================================================
-- Phase 8: Create tenant seeding trigger for new tenants
-- =====================================================

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
    (NEW.id, 'Sonstiges', 'system', 'sonstiges', 'SYSTEM', true);
  
  -- Module root folders
  INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
  VALUES 
    (NEW.id, 'Immobilien', 'folder', 'MOD_04_ROOT', 'MOD_04', true),
    (NEW.id, 'Verkauf', 'folder', 'MOD_06_ROOT', 'MOD_06', true),
    (NEW.id, 'Finanzierung', 'folder', 'MOD_07_ROOT', 'MOD_07', true),
    (NEW.id, 'Sanierung', 'folder', 'MOD_16_ROOT', 'MOD_16', true),
    (NEW.id, 'Car-Management', 'folder', 'MOD_17_ROOT', 'MOD_17', true);
  
  RETURN NEW;
END;
$$;

-- Create trigger on organizations table for new tenants
DROP TRIGGER IF EXISTS trg_seed_tenant_storage ON public.organizations;
CREATE TRIGGER trg_seed_tenant_storage
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.seed_tenant_storage_roots();