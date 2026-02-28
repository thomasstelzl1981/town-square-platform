
-- =====================================================
-- FAHRTENBUCH-SYSTEM: 8 neue Tabellen + ALTER cars_trips
-- =====================================================

-- 1) cars_devices — Tracker-Geräte (herstellerneutral)
CREATE TABLE public.cars_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  imei TEXT,
  manufacturer TEXT,
  protocol_type TEXT NOT NULL DEFAULT 'generic',
  integration_level TEXT NOT NULL DEFAULT 'A',
  source_type TEXT NOT NULL DEFAULT 'traccar',
  category TEXT NOT NULL DEFAULT 'car',
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_signal_at TIMESTAMPTZ,
  upload_interval_sec INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cars_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_devices_select_member" ON public.cars_devices FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_devices.tenant_id));
CREATE POLICY "cars_devices_insert_member" ON public.cars_devices FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_devices.tenant_id));
CREATE POLICY "cars_devices_update_member" ON public.cars_devices FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_devices.tenant_id));
CREATE POLICY "cars_devices_delete_member" ON public.cars_devices FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_devices.tenant_id AND m.role = 'org_admin'::membership_role));

-- 2) cars_logbooks — Fahrtenbuch-Instanzen
CREATE TABLE public.cars_logbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  vehicle_id UUID NOT NULL REFERENCES public.cars_vehicles(id),
  device_id UUID REFERENCES public.cars_devices(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  policy_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cars_logbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_logbooks_select_member" ON public.cars_logbooks FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbooks.tenant_id));
CREATE POLICY "cars_logbooks_insert_member" ON public.cars_logbooks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbooks.tenant_id));
CREATE POLICY "cars_logbooks_update_member" ON public.cars_logbooks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbooks.tenant_id));
CREATE POLICY "cars_logbooks_delete_member" ON public.cars_logbooks FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbooks.tenant_id AND m.role = 'org_admin'::membership_role));

-- 3) cars_device_external_refs — Mapping device_id ↔ Traccar deviceId
CREATE TABLE public.cars_device_external_refs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  device_id UUID NOT NULL REFERENCES public.cars_devices(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'traccar',
  external_device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, source_type, external_device_id)
);

ALTER TABLE public.cars_device_external_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_device_external_refs_select_member" ON public.cars_device_external_refs FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_device_external_refs.tenant_id));
CREATE POLICY "cars_device_external_refs_insert_member" ON public.cars_device_external_refs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_device_external_refs.tenant_id));
CREATE POLICY "cars_device_external_refs_update_member" ON public.cars_device_external_refs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_device_external_refs.tenant_id));
CREATE POLICY "cars_device_external_refs_delete_member" ON public.cars_device_external_refs FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_device_external_refs.tenant_id AND m.role = 'org_admin'::membership_role));

-- 4) cars_device_status — Live-Status pro Gerät
CREATE TABLE public.cars_device_status (
  device_id UUID NOT NULL PRIMARY KEY REFERENCES public.cars_devices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_signal_at TIMESTAMPTZ,
  last_position_at TIMESTAMPTZ,
  last_lat DOUBLE PRECISION,
  last_lon DOUBLE PRECISION,
  last_speed DOUBLE PRECISION,
  last_course DOUBLE PRECISION,
  last_attributes JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cars_device_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_device_status_select_member" ON public.cars_device_status FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_device_status.tenant_id));
CREATE POLICY "cars_device_status_insert_member" ON public.cars_device_status FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_device_status.tenant_id));
CREATE POLICY "cars_device_status_update_member" ON public.cars_device_status FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_device_status.tenant_id));

-- 5) cars_positions_raw — SSOT Rohdaten (immutable)
CREATE TABLE public.cars_positions_raw (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  device_id UUID NOT NULL REFERENCES public.cars_devices(id),
  source_type TEXT NOT NULL DEFAULT 'traccar',
  source_position_id TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  course DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  attributes JSONB DEFAULT '{}',
  UNIQUE(tenant_id, source_type, source_position_id)
);

ALTER TABLE public.cars_positions_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_positions_raw_select_member" ON public.cars_positions_raw FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_positions_raw.tenant_id));
CREATE POLICY "cars_positions_raw_insert_member" ON public.cars_positions_raw FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_positions_raw.tenant_id));
-- No UPDATE/DELETE — positions are immutable for audit

-- 6) cars_trip_audit — Änderungsprotokoll (append-only)
CREATE TABLE public.cars_trip_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.cars_trips(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

ALTER TABLE public.cars_trip_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_trip_audit_select_member" ON public.cars_trip_audit FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trip_audit.tenant_id));
CREATE POLICY "cars_trip_audit_insert_member" ON public.cars_trip_audit FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trip_audit.tenant_id));
-- No UPDATE/DELETE — audit is append-only

-- 7) cars_logbook_locks — Monatsabschlüsse (permanent)
CREATE TABLE public.cars_logbook_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logbook_id UUID NOT NULL REFERENCES public.cars_logbooks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  month DATE NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_by UUID NOT NULL,
  integrity_hash TEXT,
  UNIQUE(logbook_id, month)
);

ALTER TABLE public.cars_logbook_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_logbook_locks_select_member" ON public.cars_logbook_locks FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbook_locks.tenant_id));
CREATE POLICY "cars_logbook_locks_insert_member" ON public.cars_logbook_locks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_logbook_locks.tenant_id));
-- No UPDATE/DELETE — locks are permanent

-- 8) cars_trip_detection_runs — Debug/Audit
CREATE TABLE public.cars_trip_detection_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  logbook_id UUID REFERENCES public.cars_logbooks(id),
  device_id UUID REFERENCES public.cars_devices(id),
  from_ts TIMESTAMPTZ NOT NULL,
  to_ts TIMESTAMPTZ NOT NULL,
  positions_ingested INTEGER NOT NULL DEFAULT 0,
  trips_created INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cars_trip_detection_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_trip_detection_runs_select_member" ON public.cars_trip_detection_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trip_detection_runs.tenant_id));
CREATE POLICY "cars_trip_detection_runs_insert_member" ON public.cars_trip_detection_runs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = cars_trip_detection_runs.tenant_id));

-- 9) ALTER cars_trips — Erweiterung
ALTER TABLE public.cars_trips
  ADD COLUMN IF NOT EXISTS logbook_id UUID REFERENCES public.cars_logbooks(id),
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.cars_devices(id),
  ADD COLUMN IF NOT EXISTS start_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_lon DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_lon DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS business_partner TEXT,
  ADD COLUMN IF NOT EXISTS distance_source TEXT NOT NULL DEFAULT 'gps';

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cars_positions_raw_device_recorded ON public.cars_positions_raw(device_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_cars_trips_logbook ON public.cars_trips(logbook_id);
CREATE INDEX IF NOT EXISTS idx_cars_logbooks_vehicle ON public.cars_logbooks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_cars_device_status_tenant ON public.cars_device_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cars_trip_audit_trip ON public.cars_trip_audit(trip_id);
