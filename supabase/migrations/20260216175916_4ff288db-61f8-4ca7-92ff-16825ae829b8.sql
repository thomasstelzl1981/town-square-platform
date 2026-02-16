
-- Phase 4: Caring Events table

-- Enum for caring event types
CREATE TYPE public.pet_caring_event_type AS ENUM (
  'feeding', 'walking', 'grooming', 'medication', 'vet_appointment',
  'vaccination', 'deworming', 'flea_treatment', 'training', 'weight_check', 'other'
);

-- Main table
CREATE TABLE public.pet_caring_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  event_type public.pet_caring_event_type NOT NULL DEFAULT 'other',
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  is_completed boolean NOT NULL DEFAULT false,
  recurring_interval_days integer,
  reminder_enabled boolean NOT NULL DEFAULT false,
  reminder_minutes_before integer DEFAULT 60,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.pet_caring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caring_select_own_tenant" ON public.pet_caring_events
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR is_platform_admin());

CREATE POLICY "caring_insert_own_tenant" ON public.pet_caring_events
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "caring_update_own_tenant" ON public.pet_caring_events
  FOR UPDATE USING (tenant_id = get_user_tenant_id());

CREATE POLICY "caring_delete_own_tenant" ON public.pet_caring_events
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Indexes
CREATE INDEX idx_pet_caring_events_tenant_pet ON public.pet_caring_events(tenant_id, pet_id);
CREATE INDEX idx_pet_caring_events_scheduled ON public.pet_caring_events(tenant_id, scheduled_at);
CREATE INDEX idx_pet_caring_events_overdue ON public.pet_caring_events(tenant_id, is_completed, scheduled_at)
  WHERE is_completed = false;

-- Updated_at trigger
CREATE TRIGGER update_pet_caring_events_updated_at
  BEFORE UPDATE ON public.pet_caring_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
