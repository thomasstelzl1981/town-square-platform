-- ============================================================================
-- MOD-13 PROJEKTE: Database Schema
-- Developer/Aufteiler Project Management System
-- ============================================================================

-- 1. Developer Contexts (Verkäufer-Gesellschaften)
CREATE TABLE public.developer_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'company' CHECK (context_type IN ('company', 'private', 'fund')),
  legal_form TEXT,
  hrb_number TEXT,
  ust_id TEXT,
  managing_director TEXT,
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,
  tax_rate_percent NUMERIC(5,2) DEFAULT 19.00,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Dev Projects (Zentrale Projekt-Entität)
CREATE TABLE public.dev_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  developer_context_id UUID NOT NULL REFERENCES public.developer_contexts(id) ON DELETE CASCADE,
  project_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  address TEXT,
  city TEXT,
  postal_code TEXT,
  state TEXT,
  country TEXT DEFAULT 'Deutschland',
  total_units_count INTEGER DEFAULT 0,
  purchase_price NUMERIC(15,2),
  renovation_budget NUMERIC(15,2),
  total_sale_target NUMERIC(15,2),
  avg_unit_price NUMERIC(15,2),
  commission_rate_percent NUMERIC(5,2) DEFAULT 3.57,
  ancillary_cost_percent NUMERIC(5,2) DEFAULT 12.00,
  holding_period_months INTEGER DEFAULT 24,
  project_start_date DATE,
  target_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, project_code)
);

-- 3. Dev Project Units
CREATE TABLE public.dev_project_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  area_sqm NUMERIC(10,2),
  rooms_count NUMERIC(3,1),
  list_price NUMERIC(15,2),
  min_price NUMERIC(15,2),
  price_per_sqm NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'blocked')),
  grundbuchblatt TEXT,
  te_number TEXT,
  tenant_name TEXT,
  current_rent NUMERIC(10,2),
  rent_net NUMERIC(10,2),
  rent_nk NUMERIC(10,2),
  balcony BOOLEAN DEFAULT false,
  garden BOOLEAN DEFAULT false,
  parking BOOLEAN DEFAULT false,
  parking_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, unit_number)
);

-- 4. Dev Project Reservations
CREATE TABLE public.dev_project_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.dev_project_units(id) ON DELETE CASCADE,
  buyer_contact_id UUID REFERENCES public.contacts(id),
  partner_org_id UUID REFERENCES public.organizations(id),
  partner_user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'notary_scheduled', 'completed', 'cancelled', 'expired')),
  reserved_price NUMERIC(15,2),
  commission_amount NUMERIC(15,2),
  reservation_date TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  confirmation_date TIMESTAMPTZ,
  notary_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. Dev Project Calculations
CREATE TABLE public.dev_project_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  calculation_name TEXT DEFAULT 'Standard',
  purchase_price NUMERIC(15,2),
  ancillary_cost_percent NUMERIC(5,2) DEFAULT 12.00,
  renovation_total NUMERIC(15,2),
  renovation_per_sqm NUMERIC(10,2),
  sales_commission_percent NUMERIC(5,2) DEFAULT 3.57,
  holding_period_months INTEGER DEFAULT 24,
  financing_rate_percent NUMERIC(5,2) DEFAULT 4.00,
  financing_ltv_percent NUMERIC(5,2) DEFAULT 70.00,
  total_investment NUMERIC(15,2),
  total_sale_proceeds NUMERIC(15,2),
  gross_profit NUMERIC(15,2),
  net_profit NUMERIC(15,2),
  profit_margin_percent NUMERIC(5,2),
  annualized_return NUMERIC(5,2),
  profit_per_unit NUMERIC(15,2),
  break_even_units INTEGER,
  is_active BOOLEAN DEFAULT true,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Dev Project Documents
CREATE TABLE public.dev_project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.dev_project_units(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  storage_node_id UUID REFERENCES public.storage_nodes(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL DEFAULT 'general' CHECK (doc_type IN (
    'general', 'expose', 'floor_plan', 'energy_cert', 'grundbuch', 
    'teilungserklaerung', 'purchase_contract', 'reservation', 'other'
  )),
  display_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- INDEXES
CREATE INDEX idx_developer_contexts_tenant ON public.developer_contexts(tenant_id);
CREATE INDEX idx_developer_contexts_default ON public.developer_contexts(tenant_id, is_default) WHERE is_default = true;
CREATE INDEX idx_dev_projects_tenant ON public.dev_projects(tenant_id);
CREATE INDEX idx_dev_projects_context ON public.dev_projects(developer_context_id);
CREATE INDEX idx_dev_projects_status ON public.dev_projects(tenant_id, status);
CREATE INDEX idx_dev_project_units_project ON public.dev_project_units(project_id);
CREATE INDEX idx_dev_project_units_status ON public.dev_project_units(project_id, status);
CREATE INDEX idx_dev_project_reservations_project ON public.dev_project_reservations(project_id);
CREATE INDEX idx_dev_project_reservations_unit ON public.dev_project_reservations(unit_id);
CREATE INDEX idx_dev_project_reservations_status ON public.dev_project_reservations(project_id, status);
CREATE INDEX idx_dev_project_reservations_partner ON public.dev_project_reservations(partner_org_id);
CREATE INDEX idx_dev_project_calculations_project ON public.dev_project_calculations(project_id);
CREATE INDEX idx_dev_project_documents_project ON public.dev_project_documents(project_id);
CREATE INDEX idx_dev_project_documents_unit ON public.dev_project_documents(unit_id);

-- RLS
ALTER TABLE public.developer_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_project_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_project_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_project_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_project_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies using active_tenant_id pattern (consistent with existing codebase)
CREATE POLICY "dev_contexts_tenant_access" ON public.developer_contexts
  FOR ALL USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "dev_projects_tenant_access" ON public.dev_projects
  FOR ALL USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "dev_units_tenant_access" ON public.dev_project_units
  FOR ALL USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "dev_reservations_owner_access" ON public.dev_project_reservations
  FOR ALL USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "dev_reservations_partner_access" ON public.dev_project_reservations
  FOR SELECT USING (partner_org_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "dev_calculations_access" ON public.dev_project_calculations
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.dev_projects WHERE tenant_id = (
        SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "dev_documents_access" ON public.dev_project_documents
  FOR ALL USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_developer_contexts_updated_at
  BEFORE UPDATE ON public.developer_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dev_projects_updated_at
  BEFORE UPDATE ON public.dev_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dev_project_units_updated_at
  BEFORE UPDATE ON public.dev_project_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dev_project_reservations_updated_at
  BEFORE UPDATE ON public.dev_project_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dev_project_calculations_updated_at
  BEFORE UPDATE ON public.dev_project_calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update project unit count
CREATE OR REPLACE FUNCTION public.update_project_unit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE public.dev_projects
    SET total_units_count = (
      SELECT COUNT(*) FROM public.dev_project_units WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_project_unit_count
  AFTER INSERT OR DELETE ON public.dev_project_units
  FOR EACH ROW EXECUTE FUNCTION public.update_project_unit_count();

-- Auto-update unit status on reservation change
CREATE OR REPLACE FUNCTION public.update_unit_status_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('pending', 'confirmed', 'notary_scheduled') THEN
      UPDATE public.dev_project_units SET status = 'reserved', updated_at = now() WHERE id = NEW.unit_id;
    ELSIF NEW.status = 'completed' THEN
      UPDATE public.dev_project_units SET status = 'sold', updated_at = now() WHERE id = NEW.unit_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('cancelled', 'expired') THEN
      UPDATE public.dev_project_units SET status = 'available', updated_at = now() WHERE id = NEW.unit_id;
    ELSIF NEW.status = 'completed' THEN
      UPDATE public.dev_project_units SET status = 'sold', updated_at = now() WHERE id = NEW.unit_id;
    ELSIF NEW.status IN ('pending', 'confirmed', 'notary_scheduled') THEN
      UPDATE public.dev_project_units SET status = 'reserved', updated_at = now() WHERE id = NEW.unit_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.dev_project_units SET status = 'available', updated_at = now() WHERE id = OLD.unit_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_unit_status_on_reservation
  AFTER INSERT OR UPDATE OR DELETE ON public.dev_project_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_unit_status_on_reservation();