
-- Phase 3: Add tenant_id to pet_invoices, update RLS

-- Step 1: tenant_id already added by failed migration, check and make NOT NULL
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pet_invoices' AND column_name='tenant_id') THEN
    ALTER TABLE public.pet_invoices ADD COLUMN tenant_id uuid;
  END IF;
END $$;

UPDATE public.pet_invoices SET tenant_id = 'a0000000-0000-4000-a000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.pet_invoices ALTER COLUMN tenant_id SET NOT NULL;

-- FK to organizations (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pet_invoices_tenant_id_fkey') THEN
    ALTER TABLE public.pet_invoices ADD CONSTRAINT pet_invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.organizations(id);
  END IF;
END $$;

-- FK booking_id -> pet_bookings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pet_invoices_booking_id_fkey') THEN
    ALTER TABLE public.pet_invoices ADD CONSTRAINT pet_invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.pet_bookings(id);
  END IF;
END $$;

-- FK provider_id -> pet_providers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pet_invoices_provider_id_fkey') THEN
    ALTER TABLE public.pet_invoices ADD CONSTRAINT pet_invoices_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.pet_providers(id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pet_invoices_tenant_id ON public.pet_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pet_invoices_tenant_created ON public.pet_invoices(tenant_id, created_at DESC);

-- Drop old RLS and add tenant-based
DROP POLICY IF EXISTS "authenticated_read_pet_invoices" ON public.pet_invoices;
DROP POLICY IF EXISTS "authenticated_insert_pet_invoices" ON public.pet_invoices;
DROP POLICY IF EXISTS "authenticated_update_pet_invoices" ON public.pet_invoices;

CREATE POLICY "tenant_read_pet_invoices" ON public.pet_invoices
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_platform_admin());

CREATE POLICY "tenant_insert_pet_invoices" ON public.pet_invoices
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "tenant_update_pet_invoices" ON public.pet_invoices
  FOR UPDATE USING (tenant_id = get_user_tenant_id());

-- pet_invoice_items tenant-based via join
DROP POLICY IF EXISTS "authenticated_read_pet_invoice_items" ON public.pet_invoice_items;
DROP POLICY IF EXISTS "authenticated_insert_pet_invoice_items" ON public.pet_invoice_items;
DROP POLICY IF EXISTS "authenticated_update_pet_invoice_items" ON public.pet_invoice_items;
DROP POLICY IF EXISTS "authenticated_delete_pet_invoice_items" ON public.pet_invoice_items;

CREATE POLICY "tenant_read_pet_invoice_items" ON public.pet_invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pet_invoices pi WHERE pi.id = invoice_id AND (pi.tenant_id = get_user_tenant_id() OR is_platform_admin()))
  );

CREATE POLICY "tenant_insert_pet_invoice_items" ON public.pet_invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pet_invoices pi WHERE pi.id = invoice_id AND pi.tenant_id = get_user_tenant_id())
  );

CREATE POLICY "tenant_update_pet_invoice_items" ON public.pet_invoice_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.pet_invoices pi WHERE pi.id = invoice_id AND pi.tenant_id = get_user_tenant_id())
  );

CREATE POLICY "tenant_delete_pet_invoice_items" ON public.pet_invoice_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.pet_invoices pi WHERE pi.id = invoice_id AND pi.tenant_id = get_user_tenant_id())
  );
