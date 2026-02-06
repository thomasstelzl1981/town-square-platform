-- =====================================================
-- MOD-17 CAR-MANAGEMENT — DATABASE SCHEMA
-- =====================================================

-- ENUMS
CREATE TYPE public.car_vehicle_status AS ENUM ('active', 'inactive', 'sold', 'returned');
CREATE TYPE public.car_fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid_petrol', 'hybrid_diesel', 'lpg', 'cng', 'hydrogen');
CREATE TYPE public.car_finance_type AS ENUM ('owned', 'financed', 'leased');
CREATE TYPE public.car_finance_status AS ENUM ('active', 'completed', 'terminated');
CREATE TYPE public.car_coverage_type AS ENUM ('liability_only', 'liability_tk', 'liability_vk');
CREATE TYPE public.car_insurance_status AS ENUM ('active', 'expired', 'cancelled', 'draft');
CREATE TYPE public.car_payment_frequency AS ENUM ('monthly', 'quarterly', 'semi_annual', 'yearly');
CREATE TYPE public.car_damage_type AS ENUM ('accident', 'theft', 'glass', 'vandalism', 'storm', 'animal', 'fire', 'other');
CREATE TYPE public.car_claim_status AS ENUM ('draft', 'open', 'awaiting_docs', 'submitted', 'in_review', 'approved', 'rejected', 'closed');
CREATE TYPE public.car_fault_assessment AS ENUM ('own_fault', 'partial_fault', 'no_fault', 'unclear');
CREATE TYPE public.car_logbook_provider AS ENUM ('vimcar', 'carcloud', 'none');
CREATE TYPE public.car_logbook_status AS ENUM ('not_connected', 'pending', 'connected', 'error');
CREATE TYPE public.car_trip_classification AS ENUM ('business', 'private', 'commute', 'unclassified');
CREATE TYPE public.car_trip_source AS ENUM ('manual', 'sync');
CREATE TYPE public.car_offer_type AS ENUM ('leasing', 'rental');
CREATE TYPE public.car_offer_provider AS ENUM ('bmw_dealer', 'mercedes_dealer', 'vw_dealer', 'audi_dealer', 'miete24', 'generic');

-- =====================================================
-- C1) cars_vehicles — Fahrzeuge (SSOT)
-- =====================================================
CREATE TABLE public.cars_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  public_id TEXT NOT NULL DEFAULT '',
  license_plate TEXT NOT NULL,
  vin TEXT,
  hsn TEXT,
  tsn TEXT,
  make TEXT,
  model TEXT,
  variant TEXT,
  body_type TEXT,
  color TEXT,
  first_registration_date DATE,
  power_kw INTEGER,
  engine_ccm INTEGER,
  fuel_type public.car_fuel_type DEFAULT 'petrol',
  co2_g_km INTEGER,
  weight_kg INTEGER,
  max_weight_kg INTEGER,
  seats INTEGER,
  doors INTEGER,
  current_mileage_km INTEGER DEFAULT 0,
  mileage_updated_at TIMESTAMPTZ,
  annual_mileage_km INTEGER,
  holder_name TEXT,
  holder_address TEXT,
  primary_driver_name TEXT,
  primary_driver_birthdate DATE,
  hu_valid_until DATE,
  au_valid_until DATE,
  status public.car_vehicle_status NOT NULL DEFAULT 'active',
  dms_folder_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_license_plate_per_tenant UNIQUE (tenant_id, license_plate)
);

-- Generate public_id trigger
CREATE OR REPLACE FUNCTION public.generate_vehicle_public_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.public_id := 'VEH-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_cars_vehicles_public_id
  BEFORE INSERT ON public.cars_vehicles
  FOR EACH ROW
  WHEN (NEW.public_id IS NULL OR NEW.public_id = '')
  EXECUTE FUNCTION public.generate_vehicle_public_id();

-- Updated_at trigger
CREATE TRIGGER tr_cars_vehicles_updated_at
  BEFORE UPDATE ON public.cars_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.cars_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_vehicles_select_member" ON public.cars_vehicles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_vehicles.tenant_id)
  );

CREATE POLICY "cars_vehicles_select_platform_admin" ON public.cars_vehicles
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "cars_vehicles_insert_member" ON public.cars_vehicles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_vehicles.tenant_id)
  );

CREATE POLICY "cars_vehicles_update_member" ON public.cars_vehicles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_vehicles.tenant_id AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY "cars_vehicles_delete_member" ON public.cars_vehicles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_vehicles.tenant_id AND m.role = 'org_admin')
  );

-- =====================================================
-- C2) cars_financing — Finanzierung/Leasing
-- =====================================================
CREATE TABLE public.cars_financing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.cars_vehicles(id) ON DELETE CASCADE,
  finance_type public.car_finance_type NOT NULL DEFAULT 'owned',
  provider_name TEXT,
  contract_number TEXT,
  start_date DATE,
  end_date DATE,
  monthly_rate_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'EUR',
  down_payment_cents INTEGER,
  residual_value_cents INTEGER,
  total_km_limit INTEGER,
  interest_rate_percent NUMERIC(5,2),
  remaining_debt_cents INTEGER,
  status public.car_finance_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_cars_financing_updated_at
  BEFORE UPDATE ON public.cars_financing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cars_financing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_financing_select_member" ON public.cars_financing
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_financing.tenant_id)
  );

CREATE POLICY "cars_financing_select_platform_admin" ON public.cars_financing
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "cars_financing_insert_member" ON public.cars_financing
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_financing.tenant_id)
  );

CREATE POLICY "cars_financing_update_member" ON public.cars_financing
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_financing.tenant_id AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY "cars_financing_delete_member" ON public.cars_financing
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_financing.tenant_id AND m.role = 'org_admin')
  );

-- =====================================================
-- C3) cars_insurances — Versicherungen
-- =====================================================
CREATE TABLE public.cars_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.cars_vehicles(id) ON DELETE CASCADE,
  insurer_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_type public.car_coverage_type NOT NULL DEFAULT 'liability_only',
  sf_liability INTEGER NOT NULL DEFAULT 0,
  sf_full_casco INTEGER,
  deductible_partial_cents INTEGER,
  deductible_full_cents INTEGER,
  annual_premium_cents INTEGER NOT NULL,
  payment_frequency public.car_payment_frequency NOT NULL DEFAULT 'yearly',
  currency TEXT NOT NULL DEFAULT 'EUR',
  term_start DATE NOT NULL,
  term_end DATE,
  renewal_date DATE,
  cancellation_deadline DATE,
  status public.car_insurance_status NOT NULL DEFAULT 'active',
  extras JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_cars_insurances_updated_at
  BEFORE UPDATE ON public.cars_insurances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cars_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_insurances_select_member" ON public.cars_insurances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_insurances.tenant_id)
  );

CREATE POLICY "cars_insurances_select_platform_admin" ON public.cars_insurances
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "cars_insurances_insert_member" ON public.cars_insurances
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_insurances.tenant_id)
  );

CREATE POLICY "cars_insurances_update_member" ON public.cars_insurances
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_insurances.tenant_id AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY "cars_insurances_delete_member" ON public.cars_insurances
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_insurances.tenant_id AND m.role = 'org_admin')
  );

-- =====================================================
-- C4) cars_claims — Schäden/Claims
-- =====================================================
CREATE TABLE public.cars_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.cars_vehicles(id) ON DELETE CASCADE,
  insurance_id UUID REFERENCES public.cars_insurances(id) ON DELETE SET NULL,
  public_id TEXT NOT NULL DEFAULT '',
  damage_date DATE NOT NULL,
  reported_at TIMESTAMPTZ,
  damage_type public.car_damage_type NOT NULL DEFAULT 'accident',
  fault_assessment public.car_fault_assessment,
  location_description TEXT,
  description TEXT,
  police_reference TEXT,
  estimated_cost_cents INTEGER,
  final_cost_cents INTEGER,
  insurer_reference TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status public.car_claim_status NOT NULL DEFAULT 'draft',
  payout_cents INTEGER,
  payout_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generate claim public_id
CREATE OR REPLACE FUNCTION public.generate_claim_public_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.public_id := 'CLM-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_cars_claims_public_id
  BEFORE INSERT ON public.cars_claims
  FOR EACH ROW
  WHEN (NEW.public_id IS NULL OR NEW.public_id = '')
  EXECUTE FUNCTION public.generate_claim_public_id();

CREATE TRIGGER tr_cars_claims_updated_at
  BEFORE UPDATE ON public.cars_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cars_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_claims_select_member" ON public.cars_claims
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_claims.tenant_id)
  );

CREATE POLICY "cars_claims_select_platform_admin" ON public.cars_claims
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "cars_claims_insert_member" ON public.cars_claims
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_claims.tenant_id)
  );

CREATE POLICY "cars_claims_update_member" ON public.cars_claims
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_claims.tenant_id AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY "cars_claims_delete_member" ON public.cars_claims
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_claims.tenant_id AND m.role = 'org_admin')
  );

-- =====================================================
-- C5) cars_logbook_connections — Fahrtenbuch Provider
-- =====================================================
CREATE TABLE public.cars_logbook_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.cars_vehicles(id) ON DELETE CASCADE,
  provider public.car_logbook_provider NOT NULL DEFAULT 'none',
  status public.car_logbook_status NOT NULL DEFAULT 'not_connected',
  external_vehicle_ref TEXT,
  api_credentials_encrypted TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_error_message TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_vehicle_connection UNIQUE (vehicle_id)
);

CREATE TRIGGER tr_cars_logbook_connections_updated_at
  BEFORE UPDATE ON public.cars_logbook_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cars_logbook_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_logbook_connections_select_member" ON public.cars_logbook_connections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbook_connections.tenant_id)
  );

CREATE POLICY "cars_logbook_connections_select_platform_admin" ON public.cars_logbook_connections
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "cars_logbook_connections_insert_member" ON public.cars_logbook_connections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbook_connections.tenant_id)
  );

CREATE POLICY "cars_logbook_connections_update_member" ON public.cars_logbook_connections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbook_connections.tenant_id AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY "cars_logbook_connections_delete_member" ON public.cars_logbook_connections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbook_connections.tenant_id AND m.role = 'org_admin')
  );

-- =====================================================
-- C6) cars_trips — Fahrten
-- =====================================================
CREATE TABLE public.cars_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.cars_vehicles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.cars_logbook_connections(id) ON DELETE SET NULL,
  external_trip_id TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  start_address TEXT,
  end_address TEXT,
  distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  classification public.car_trip_classification NOT NULL DEFAULT 'unclassified',
  purpose TEXT,
  customer_name TEXT,
  source public.car_trip_source NOT NULL DEFAULT 'manual',
  source_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_cars_trips_updated_at
  BEFORE UPDATE ON public.cars_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cars_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_trips_select_member" ON public.cars_trips
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trips.tenant_id)
  );

CREATE POLICY "cars_trips_select_platform_admin" ON public.cars_trips
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "cars_trips_insert_member" ON public.cars_trips
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trips.tenant_id)
  );

CREATE POLICY "cars_trips_update_member" ON public.cars_trips
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trips.tenant_id AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY "cars_trips_delete_member" ON public.cars_trips
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trips.tenant_id AND m.role = 'org_admin')
  );

-- =====================================================
-- C7) cars_offers — Leasing- und Mietangebote
-- =====================================================
CREATE TABLE public.cars_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  offer_type public.car_offer_type NOT NULL DEFAULT 'leasing',
  provider public.car_offer_provider NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  price_monthly_cents INTEGER,
  price_daily_cents INTEGER,
  term_months INTEGER,
  km_per_year INTEGER,
  down_payment_cents INTEGER,
  image_url TEXT,
  link_url TEXT NOT NULL,
  valid_from DATE,
  valid_until DATE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_cars_offers_updated_at
  BEFORE UPDATE ON public.cars_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cars_offers ENABLE ROW LEVEL SECURITY;

-- Offers can be global (tenant_id IS NULL) or tenant-specific
CREATE POLICY "cars_offers_select_active" ON public.cars_offers
  FOR SELECT USING (
    active = true AND (
      tenant_id IS NULL OR 
      EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_offers.tenant_id)
    )
  );

CREATE POLICY "cars_offers_select_platform_admin" ON public.cars_offers
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "cars_offers_insert_platform_admin" ON public.cars_offers
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "cars_offers_update_platform_admin" ON public.cars_offers
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "cars_offers_delete_platform_admin" ON public.cars_offers
  FOR DELETE USING (is_platform_admin());

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_cars_vehicles_tenant ON public.cars_vehicles(tenant_id);
CREATE INDEX idx_cars_vehicles_status ON public.cars_vehicles(status);
CREATE INDEX idx_cars_vehicles_license_plate ON public.cars_vehicles(license_plate);
CREATE INDEX idx_cars_financing_vehicle ON public.cars_financing(vehicle_id);
CREATE INDEX idx_cars_insurances_vehicle ON public.cars_insurances(vehicle_id);
CREATE INDEX idx_cars_insurances_status ON public.cars_insurances(status);
CREATE INDEX idx_cars_claims_vehicle ON public.cars_claims(vehicle_id);
CREATE INDEX idx_cars_claims_insurance ON public.cars_claims(insurance_id);
CREATE INDEX idx_cars_claims_status ON public.cars_claims(status);
CREATE INDEX idx_cars_trips_vehicle ON public.cars_trips(vehicle_id);
CREATE INDEX idx_cars_trips_start_at ON public.cars_trips(start_at);
CREATE INDEX idx_cars_offers_active ON public.cars_offers(active) WHERE active = true;