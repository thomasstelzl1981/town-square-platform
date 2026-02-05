-- Fix: remove duplicate folder-creation triggers (prevents duplicate storage_nodes trees)
DROP TRIGGER IF EXISTS create_property_folder_trigger ON public.properties;
DROP TRIGGER IF EXISTS create_unit_folder_trigger ON public.units;