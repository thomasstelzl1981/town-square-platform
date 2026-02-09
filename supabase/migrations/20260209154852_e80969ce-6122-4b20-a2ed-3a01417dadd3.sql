
-- ============================================================
-- MOD-19 PHOTOVOLTAIK: pv_plants, pv_connectors, pv_measurements
-- ============================================================

-- 1. pv_plants
CREATE TABLE public.pv_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES public.profiles(id),
  owner_org_id uuid REFERENCES public.organizations(id),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  -- Standort
  street text,
  house_number text,
  postal_code text,
  city text,
  location_notes text,
  -- Technik
  kwp numeric(10,2),
  commissioning_date date,
  wr_manufacturer text,
  wr_model text,
  has_battery boolean DEFAULT false,
  battery_kwh numeric(10,2),
  -- BNetzA / MaStR
  mastr_account_present boolean DEFAULT false,
  mastr_plant_id text,
  mastr_unit_id text,
  mastr_status text DEFAULT 'draft',
  -- Energieversorger / Netzbetreiber
  grid_operator text,
  energy_supplier text,
  customer_reference text,
  -- Zaehler
  feed_in_meter_no text,
  feed_in_meter_operator text,
  feed_in_start_reading numeric,
  consumption_meter_no text,
  consumption_meter_operator text,
  consumption_start_reading numeric,
  -- Monitoring
  provider text NOT NULL DEFAULT 'demo',
  last_sync_at timestamptz,
  data_quality text DEFAULT 'unknown',
  -- DMS
  dms_root_node_id uuid,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_pv_plant_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid pv_plant status: %', NEW.status;
  END IF;
  IF NEW.provider NOT IN ('demo', 'sma', 'solarlog') THEN
    RAISE EXCEPTION 'Invalid pv_plant provider: %', NEW.provider;
  END IF;
  IF NEW.mastr_status IS NOT NULL AND NEW.mastr_status NOT IN ('draft', 'submitted', 'confirmed') THEN
    RAISE EXCEPTION 'Invalid mastr_status: %', NEW.mastr_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_pv_plant
  BEFORE INSERT OR UPDATE ON public.pv_plants
  FOR EACH ROW EXECUTE FUNCTION public.validate_pv_plant_status();

-- Updated_at trigger
CREATE TRIGGER update_pv_plants_updated_at
  BEFORE UPDATE ON public.pv_plants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pv_plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view pv_plants"
  ON public.pv_plants FOR SELECT
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(auth.uid()))));

CREATE POLICY "Tenant members can insert pv_plants"
  ON public.pv_plants FOR INSERT
  WITH CHECK (tenant_id IN (SELECT unnest(public.my_scope_org_ids(auth.uid()))));

CREATE POLICY "Tenant members can update pv_plants"
  ON public.pv_plants FOR UPDATE
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(auth.uid()))));

CREATE POLICY "Tenant members can delete pv_plants"
  ON public.pv_plants FOR DELETE
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(auth.uid()))));

-- 2. pv_connectors
CREATE TABLE public.pv_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pv_plant_id uuid NOT NULL REFERENCES public.pv_plants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected',
  config_json jsonb DEFAULT '{}',
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_pv_connector()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.provider NOT IN ('sma', 'solarlog', 'finapi') THEN
    RAISE EXCEPTION 'Invalid connector provider: %', NEW.provider;
  END IF;
  IF NEW.status NOT IN ('not_connected', 'prepared', 'connected', 'error') THEN
    RAISE EXCEPTION 'Invalid connector status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_pv_connector
  BEFORE INSERT OR UPDATE ON public.pv_connectors
  FOR EACH ROW EXECUTE FUNCTION public.validate_pv_connector();

ALTER TABLE public.pv_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access pv_connectors via plant tenant"
  ON public.pv_connectors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pv_plants
      WHERE pv_plants.id = pv_connectors.pv_plant_id
      AND pv_plants.tenant_id IN (SELECT unnest(public.my_scope_org_ids(auth.uid())))
    )
  );

-- 3. pv_measurements
CREATE TABLE public.pv_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pv_plant_id uuid NOT NULL REFERENCES public.pv_plants(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL DEFAULT now(),
  current_power_w numeric(10,1) DEFAULT 0,
  energy_today_kwh numeric(10,2) DEFAULT 0,
  energy_month_kwh numeric(12,2) DEFAULT 0,
  source text NOT NULL DEFAULT 'demo'
);

CREATE OR REPLACE FUNCTION public.validate_pv_measurement_source()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source NOT IN ('demo', 'sma', 'solarlog') THEN
    RAISE EXCEPTION 'Invalid measurement source: %', NEW.source;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_pv_measurement
  BEFORE INSERT OR UPDATE ON public.pv_measurements
  FOR EACH ROW EXECUTE FUNCTION public.validate_pv_measurement_source();

ALTER TABLE public.pv_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access pv_measurements via plant tenant"
  ON public.pv_measurements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pv_plants
      WHERE pv_plants.id = pv_measurements.pv_plant_id
      AND pv_plants.tenant_id IN (SELECT unnest(public.my_scope_org_ids(auth.uid())))
    )
  );

CREATE INDEX idx_pv_measurements_plant_ts ON public.pv_measurements(pv_plant_id, ts DESC);

-- 4. Add pv_plant_id to storage_nodes
ALTER TABLE public.storage_nodes ADD COLUMN IF NOT EXISTS pv_plant_id uuid REFERENCES public.pv_plants(id);
