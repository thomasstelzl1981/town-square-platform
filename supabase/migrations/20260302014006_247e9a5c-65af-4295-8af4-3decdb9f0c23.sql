
-- Drop the tables created by the failed migration attempt (if they exist partially)
DROP TABLE IF EXISTS public.tenancy_handover_protocols CASCADE;
DROP TABLE IF EXISTS public.tenancy_meter_readings CASCADE;

-- Handover Protocols (Übergabeprotokolle)
CREATE TABLE public.tenancy_handover_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  lease_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  protocol_type TEXT NOT NULL DEFAULT 'move_in',
  protocol_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector_name TEXT,
  tenant_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
  meter_readings JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_handover JSONB NOT NULL DEFAULT '[]'::jsonb,
  general_notes TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  signed_at TIMESTAMPTZ,
  signed_by_inspector TEXT,
  signed_by_tenant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenancy_handover_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view handover protocols for their org"
  ON public.tenancy_handover_protocols FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create handover protocols for their org"
  ON public.tenancy_handover_protocols FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update handover protocols for their org"
  ON public.tenancy_handover_protocols FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete handover protocols for their org"
  ON public.tenancy_handover_protocols FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Meter Readings (Zählerstände)
CREATE TABLE public.tenancy_meter_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  unit_id UUID NOT NULL,
  lease_id UUID,
  meter_type TEXT NOT NULL,
  meter_number TEXT,
  reading_value NUMERIC NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_type TEXT NOT NULL DEFAULT 'regular',
  photo_path TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenancy_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meter readings for their org"
  ON public.tenancy_meter_readings FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create meter readings for their org"
  ON public.tenancy_meter_readings FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update meter readings for their org"
  ON public.tenancy_meter_readings FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Extend tenancy_tasks with SLA and defect columns
ALTER TABLE public.tenancy_tasks 
  ADD COLUMN IF NOT EXISTS sla_hours INTEGER,
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reported_by_contact_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_to_contact_id UUID,
  ADD COLUMN IF NOT EXISTS location_detail TEXT,
  ADD COLUMN IF NOT EXISTS severity_assessment TEXT,
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_handover_protocols;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_meter_readings;
