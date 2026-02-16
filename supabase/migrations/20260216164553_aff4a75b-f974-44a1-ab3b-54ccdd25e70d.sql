
-- ============================================================
-- PET INVOICES + INVOICE ITEMS + Invoice Number Sequence
-- ============================================================

-- 1. Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS pet_invoice_number_seq START 1;

-- 2. pet_invoices
CREATE TABLE public.pet_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  booking_id UUID,
  provider_id UUID,
  customer_id UUID,
  amount_cents INT NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 19.0,
  tax_cents INT NOT NULL DEFAULT 0,
  net_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. pet_invoice_items
CREATE TABLE public.pet_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.pet_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Invoice number generator function
CREATE OR REPLACE FUNCTION public.generate_pet_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('pet_invoice_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 5. Trigger for auto invoice number
CREATE TRIGGER trg_pet_invoice_number
  BEFORE INSERT ON public.pet_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_pet_invoice_number();

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_pet_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_pet_invoices_updated_at
  BEFORE UPDATE ON public.pet_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pet_invoices_updated_at();

-- 7. Indexes
CREATE INDEX idx_pet_invoices_provider ON public.pet_invoices(provider_id);
CREATE INDEX idx_pet_invoices_customer ON public.pet_invoices(customer_id);
CREATE INDEX idx_pet_invoices_booking ON public.pet_invoices(booking_id);
CREATE INDEX idx_pet_invoices_status ON public.pet_invoices(status);
CREATE INDEX idx_pet_invoice_items_invoice ON public.pet_invoice_items(invoice_id);

-- 8. Enable RLS
ALTER TABLE public.pet_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_invoice_items ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for pet_invoices
CREATE POLICY "platform_admin_full_pet_invoices"
  ON public.pet_invoices FOR ALL
  USING (public.is_platform_admin());

CREATE POLICY "authenticated_read_pet_invoices"
  ON public.pet_invoices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_pet_invoices"
  ON public.pet_invoices FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_update_pet_invoices"
  ON public.pet_invoices FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 10. RLS Policies for pet_invoice_items
CREATE POLICY "platform_admin_full_pet_invoice_items"
  ON public.pet_invoice_items FOR ALL
  USING (public.is_platform_admin());

CREATE POLICY "authenticated_read_pet_invoice_items"
  ON public.pet_invoice_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_pet_invoice_items"
  ON public.pet_invoice_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_update_pet_invoice_items"
  ON public.pet_invoice_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_pet_invoice_items"
  ON public.pet_invoice_items FOR DELETE
  USING (auth.uid() IS NOT NULL);
