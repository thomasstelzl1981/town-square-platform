
-- ═══════════════════════════════════════════════════════════════
-- GP-PET: Pet Manager Lifecycle — DB Migration
-- Step 1: pet_z1_customers (Zone 1) + pet_customers (Zone 2) + pets.customer_id
-- ═══════════════════════════════════════════════════════════════

-- ─── Zone 1: Globaler Kunden-Pool ─────────────────────────────
CREATE TABLE public.pet_z1_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  source text NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'mod05', 'admin_manual')),
  user_id uuid,
  lead_id uuid,
  assigned_provider_id uuid REFERENCES public.pet_providers(id),
  assigned_at timestamptz,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'assigned', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_z1_customers ENABLE ROW LEVEL SECURITY;

-- Z1 customers visible to platform admins and own tenant
CREATE POLICY "pet_z1_cust_select" ON public.pet_z1_customers FOR SELECT
  USING (is_platform_admin() OR tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_z1_cust_insert" ON public.pet_z1_customers FOR INSERT
  WITH CHECK (is_platform_admin() OR tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_z1_cust_update" ON public.pet_z1_customers FOR UPDATE
  USING (is_platform_admin() OR tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_z1_cust_delete" ON public.pet_z1_customers FOR DELETE
  USING (is_platform_admin());

CREATE INDEX idx_pet_z1_cust_tenant ON public.pet_z1_customers(tenant_id);
CREATE INDEX idx_pet_z1_cust_status ON public.pet_z1_customers(status);
CREATE INDEX idx_pet_z1_cust_source ON public.pet_z1_customers(source);
CREATE INDEX idx_pet_z1_cust_provider ON public.pet_z1_customers(assigned_provider_id);

-- ─── Zone 2: Provider-lokale Kunden ───────────────────────────
CREATE TABLE public.pet_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  provider_id uuid REFERENCES public.pet_providers(id),
  z1_customer_id uuid REFERENCES public.pet_z1_customers(id),
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'lead', 'mod05')),
  origin_zone text NOT NULL DEFAULT 'Z2' CHECK (origin_zone IN ('Z2', 'Z3', 'Z2-MOD05')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_cust_select_own_tenant" ON public.pet_customers FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_cust_insert_own_tenant" ON public.pet_customers FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_cust_update_own_tenant" ON public.pet_customers FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_cust_delete_own_tenant" ON public.pet_customers FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pet_cust_tenant ON public.pet_customers(tenant_id);
CREATE INDEX idx_pet_cust_provider ON public.pet_customers(provider_id);
CREATE INDEX idx_pet_cust_source ON public.pet_customers(source);
CREATE INDEX idx_pet_cust_z1 ON public.pet_customers(z1_customer_id);
CREATE INDEX idx_pet_cust_status ON public.pet_customers(status);

-- ─── Erweiterung: pets.customer_id ────────────────────────────
ALTER TABLE public.pets ADD COLUMN customer_id uuid REFERENCES public.pet_customers(id);
CREATE INDEX idx_pets_customer ON public.pets(customer_id);

-- ─── Updated-at Trigger ───────────────────────────────────────
CREATE TRIGGER update_pet_z1_customers_updated_at
  BEFORE UPDATE ON public.pet_z1_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_customers_updated_at
  BEFORE UPDATE ON public.pet_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
