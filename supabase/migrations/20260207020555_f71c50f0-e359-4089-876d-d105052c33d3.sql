-- Extend cleanup_golden_path_data to include Acquiary tables
CREATE OR REPLACE FUNCTION cleanup_golden_path_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_id uuid := 'a0000000-0000-4000-a000-000000000001'::uuid;
  counts jsonb := '{}'::jsonb;
  deleted_count integer;
BEGIN
  -- ACQUIARY TABLES (new) --
  
  -- 0a. acq_offer_documents (depends on acq_offers)
  DELETE FROM acq_offer_documents WHERE offer_id IN (
    SELECT o.id FROM acq_offers o
    JOIN acq_mandates m ON o.mandate_id = m.id
    WHERE m.tenant_id = t_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('acq_offer_documents', deleted_count);

  -- 0b. acq_analysis_runs (depends on acq_offers)
  DELETE FROM acq_analysis_runs WHERE offer_id IN (
    SELECT o.id FROM acq_offers o
    JOIN acq_mandates m ON o.mandate_id = m.id
    WHERE m.tenant_id = t_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('acq_analysis_runs', deleted_count);

  -- 0c. acq_offers (depends on acq_mandates)
  DELETE FROM acq_offers WHERE mandate_id IN (
    SELECT id FROM acq_mandates WHERE tenant_id = t_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('acq_offers', deleted_count);

  -- 0d. acq_mandate_events (depends on acq_mandates)
  DELETE FROM acq_mandate_events WHERE mandate_id IN (
    SELECT id FROM acq_mandates WHERE tenant_id = t_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('acq_mandate_events', deleted_count);

  -- 0e. acq_mandates
  DELETE FROM acq_mandates WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('acq_mandates', deleted_count);

  -- ORIGINAL TABLES --

  -- 1. document_links (depends on documents)
  DELETE FROM document_links WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('document_links', deleted_count);

  -- 2. documents
  DELETE FROM documents WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('documents', deleted_count);

  -- 3. listing_publications (depends on listings)
  DELETE FROM listing_publications WHERE listing_id IN (
    SELECT id FROM listings WHERE tenant_id = t_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('listing_publications', deleted_count);

  -- 4. listings
  DELETE FROM listings WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('listings', deleted_count);

  -- 5. finance_mandates (depends on finance_requests)
  DELETE FROM finance_mandates WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('finance_mandates', deleted_count);

  -- 6. finance_requests (depends on applicant_profiles via FK, but profiles reference requests)
  DELETE FROM finance_requests WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('finance_requests', deleted_count);

  -- 7. applicant_profiles
  DELETE FROM applicant_profiles WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('applicant_profiles', deleted_count);

  -- 8. leases (depends on units + contacts)
  DELETE FROM leases WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('leases', deleted_count);

  -- 9. loans (depends on properties)
  DELETE FROM loans WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('loans', deleted_count);

  -- 10. units (depends on properties)
  DELETE FROM units WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('units', deleted_count);

  -- 11. storage_nodes (auto-created only, scoped to tenant)
  DELETE FROM storage_nodes WHERE tenant_id = t_id AND auto_created = true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('storage_nodes', deleted_count);

  -- 12. properties
  DELETE FROM properties WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('properties', deleted_count);

  -- 13. context_members (depends on landlord_contexts)
  DELETE FROM context_members WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('context_members', deleted_count);

  -- 14. landlord_contexts
  DELETE FROM landlord_contexts WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('landlord_contexts', deleted_count);

  -- 15. contacts
  DELETE FROM contacts WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('contacts', deleted_count);

  -- 16. module_activations (optional)
  DELETE FROM tenant_tile_activation WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('module_activations', deleted_count);

  RETURN jsonb_build_object('success', true, 'cleanup_counts', counts);
END;
$$;