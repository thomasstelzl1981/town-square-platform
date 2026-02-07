-- Update cleanup_golden_path_data to include Car Management tables
CREATE OR REPLACE FUNCTION public.cleanup_golden_path_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_id uuid := 'a0000000-0000-4000-a000-000000000001'::uuid;
  result jsonb;
BEGIN
  -- Car Management (MOD-17)
  DELETE FROM document_links WHERE tenant_id = t_id AND object_type IN ('vehicle', 'insurance');
  DELETE FROM cars_insurances WHERE tenant_id = t_id;
  DELETE FROM cars_financing WHERE tenant_id = t_id;
  DELETE FROM cars_vehicles WHERE tenant_id = t_id;
  DELETE FROM storage_nodes WHERE tenant_id = t_id AND template_id IN ('CAR_ROOT', 'CAR_VEHICLES', 'VEHICLE_DOSSIER_V1');
  
  -- Acquiary (MOD-08/12)
  DELETE FROM acq_mandate_events WHERE mandate_id IN (SELECT id FROM acq_mandates WHERE tenant_id = t_id);
  DELETE FROM acq_offers WHERE mandate_id IN (SELECT id FROM acq_mandates WHERE tenant_id = t_id);
  DELETE FROM acq_mandates WHERE tenant_id = t_id;
  
  -- Finance (MOD-07/11)
  DELETE FROM applicant_profiles WHERE tenant_id = t_id;
  DELETE FROM finance_requests WHERE tenant_id = t_id;
  
  -- DMS  
  DELETE FROM document_links WHERE tenant_id = t_id;
  DELETE FROM documents WHERE tenant_id = t_id;
  DELETE FROM storage_nodes WHERE tenant_id = t_id;
  
  -- Leases & Loans
  DELETE FROM leases WHERE tenant_id = t_id;
  DELETE FROM loans WHERE tenant_id = t_id;
  
  -- Units & Properties
  DELETE FROM units WHERE tenant_id = t_id;
  DELETE FROM properties WHERE tenant_id = t_id;
  
  -- Landlord Contexts
  DELETE FROM context_members WHERE tenant_id = t_id;
  DELETE FROM landlord_contexts WHERE tenant_id = t_id;
  
  -- Contacts
  DELETE FROM contacts WHERE tenant_id = t_id;
  
  -- Tile Activations
  DELETE FROM tenant_tile_activation WHERE tenant_id = t_id;

  result := jsonb_build_object(
    'success', true,
    'tenant_id', t_id,
    'message', 'Golden Path data cleaned up successfully'
  );
  
  RETURN result;
END;
$$;