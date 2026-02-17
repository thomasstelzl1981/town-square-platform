
-- 1. New table: pet_staff (Mitarbeiter for Services)
CREATE TABLE public.pet_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.pet_providers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'betreuer',
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  services TEXT[] DEFAULT '{}',
  work_hours JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pet_staff_provider ON public.pet_staff(provider_id);
CREATE INDEX idx_pet_staff_tenant ON public.pet_staff(tenant_id, created_at);

-- RLS
ALTER TABLE public.pet_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pet_staff in their tenant"
  ON public.pet_staff FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can insert pet_staff in their tenant"
  ON public.pet_staff FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update pet_staff in their tenant"
  ON public.pet_staff FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete pet_staff in their tenant"
  ON public.pet_staff FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_pet_staff_updated_at
  BEFORE UPDATE ON public.pet_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add area column to pet_rooms
ALTER TABLE public.pet_rooms ADD COLUMN IF NOT EXISTS area TEXT NOT NULL DEFAULT 'pension';

-- 3. Add staff_id and booking_area to pet_bookings
ALTER TABLE public.pet_bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.pet_staff(id);
ALTER TABLE public.pet_bookings ADD COLUMN IF NOT EXISTS booking_area TEXT NOT NULL DEFAULT 'pension';

CREATE INDEX idx_pet_bookings_staff ON public.pet_bookings(staff_id);
CREATE INDEX idx_pet_bookings_area ON public.pet_bookings(booking_area);
