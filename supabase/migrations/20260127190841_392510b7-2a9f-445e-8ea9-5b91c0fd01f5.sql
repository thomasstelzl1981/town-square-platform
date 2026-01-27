-- Phase 1: Test Data Registry (without admin role check)

-- Create test_data_registry table
CREATE TABLE IF NOT EXISTS public.test_data_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  batch_id UUID NOT NULL,
  batch_name TEXT,
  imported_by UUID REFERENCES public.profiles(id),
  imported_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_test_entity UNIQUE (entity_type, entity_id)
);

-- Indexes for fast batch operations
CREATE INDEX IF NOT EXISTS idx_tdr_batch ON public.test_data_registry(batch_id);
CREATE INDEX IF NOT EXISTS idx_tdr_entity ON public.test_data_registry(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.test_data_registry ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policy: Authenticated users can manage test data
CREATE POLICY "Authenticated users can manage test data" ON public.test_data_registry
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to delete a test batch with cascading cleanup
CREATE OR REPLACE FUNCTION public.delete_test_batch(p_batch_id UUID)
RETURNS TABLE(entity_type TEXT, deleted_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete in reverse dependency order
  
  -- 1. Listing publications
  DELETE FROM listing_publications lp
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'listing'
    AND lp.listing_id = tdr.entity_id;
  
  -- 2. Listing partner terms
  DELETE FROM listing_partner_terms lpt
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'listing'
    AND lpt.listing_id = tdr.entity_id;
  
  -- 3. Listing inquiries
  DELETE FROM listing_inquiries li
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'listing'
    AND li.listing_id = tdr.entity_id;
  
  -- 4. Listings
  DELETE FROM listings l
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'listing'
    AND l.id = tdr.entity_id;
  
  -- 5. Leases
  DELETE FROM leases le
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'lease'
    AND le.id = tdr.entity_id;
  
  -- 6. Document links
  DELETE FROM document_links dl
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'property'
    AND dl.object_id::uuid = tdr.entity_id;
  
  -- 7. Documents
  DELETE FROM documents d
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'document'
    AND d.id = tdr.entity_id;
  
  -- 8. Units
  DELETE FROM units u
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'unit'
    AND u.id = tdr.entity_id;
  
  -- 9. Storage nodes
  DELETE FROM storage_nodes sn
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'property'
    AND sn.property_id = tdr.entity_id;
  
  -- 10. Contacts
  DELETE FROM contacts c
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'contact'
    AND c.id = tdr.entity_id;
  
  -- 11. Properties
  DELETE FROM properties p
  USING test_data_registry tdr
  WHERE tdr.batch_id = p_batch_id 
    AND tdr.entity_type = 'property'
    AND p.id = tdr.entity_id;
  
  -- 12. Finally delete the registry entries
  DELETE FROM test_data_registry WHERE batch_id = p_batch_id;
  
  RETURN QUERY SELECT 'batch_deleted'::TEXT, 1::BIGINT;
END;
$$;