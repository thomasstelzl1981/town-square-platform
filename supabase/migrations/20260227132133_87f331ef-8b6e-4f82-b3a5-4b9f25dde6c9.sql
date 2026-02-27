
-- ═══════════════════════════════════════════════════════════════
-- P0 Tables: invoice_extractions + document_structured_data
-- ═══════════════════════════════════════════════════════════════

-- 1) Invoice Extractions — AI-parsed invoice data with auto-assignment
CREATE TABLE public.invoice_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  document_id UUID REFERENCES public.documents(id),
  property_id UUID REFERENCES public.properties(id),
  unit_id UUID REFERENCES public.units(id),
  
  -- Extracted fields
  vendor_name TEXT,
  vendor_address TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  total_gross NUMERIC,
  total_net NUMERIC,
  vat_amount NUMERIC,
  vat_rate NUMERIC,
  currency TEXT DEFAULT 'EUR',
  purpose TEXT,
  iban TEXT,
  
  -- NK mapping
  nk_cost_category TEXT,
  billing_period_start DATE,
  billing_period_end DATE,
  
  -- Assignment
  match_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (match_status IN ('auto_matched', 'needs_review', 'confirmed', 'rejected')),
  match_confidence NUMERIC DEFAULT 0,
  match_method TEXT CHECK (match_method IN ('vendor_match', 'address_match', 'amount_pattern', 'ai_suggestion', 'manual')),
  matched_by UUID,
  matched_at TIMESTAMPTZ,
  
  -- Meta
  ai_raw_response JSONB,
  extractor_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view invoice extractions"
  ON public.invoice_extractions FOR SELECT
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant members can insert invoice extractions"
  ON public.invoice_extractions FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant members can update invoice extractions"
  ON public.invoice_extractions FOR UPDATE
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE INDEX idx_invoice_extractions_tenant ON public.invoice_extractions(tenant_id);
CREATE INDEX idx_invoice_extractions_property ON public.invoice_extractions(property_id);
CREATE INDEX idx_invoice_extractions_status ON public.invoice_extractions(match_status);
CREATE INDEX idx_invoice_extractions_document ON public.invoice_extractions(document_id);

-- 2) Document Structured Data — structured extraction from any document
CREATE TABLE public.document_structured_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  document_id UUID NOT NULL REFERENCES public.documents(id),
  
  -- Classification
  doc_category TEXT NOT NULL, -- 'kaufvertrag', 'mietvertrag', 'versicherung', 'grundbuch', etc.
  
  -- Structured output
  extracted_fields JSONB NOT NULL DEFAULT '{}',
  
  -- Linked entities
  property_id UUID REFERENCES public.properties(id),
  unit_id UUID REFERENCES public.units(id),
  contact_id UUID REFERENCES public.contacts(id),
  
  -- Quality
  confidence NUMERIC DEFAULT 0,
  needs_review BOOLEAN DEFAULT true,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  
  -- Meta
  extractor_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_structured_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view structured data"
  ON public.document_structured_data FOR SELECT
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant members can insert structured data"
  ON public.document_structured_data FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant members can update structured data"
  ON public.document_structured_data FOR UPDATE
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE INDEX idx_doc_structured_tenant ON public.document_structured_data(tenant_id);
CREATE INDEX idx_doc_structured_document ON public.document_structured_data(document_id);
CREATE INDEX idx_doc_structured_category ON public.document_structured_data(doc_category);
CREATE INDEX idx_doc_structured_property ON public.document_structured_data(property_id);

-- Trigger for updated_at
CREATE TRIGGER update_invoice_extractions_updated_at
  BEFORE UPDATE ON public.invoice_extractions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doc_structured_data_updated_at
  BEFORE UPDATE ON public.document_structured_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
