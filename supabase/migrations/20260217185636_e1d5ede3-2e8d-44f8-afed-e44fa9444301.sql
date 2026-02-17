
-- P5.1: Räume / Plätze eines Providers
CREATE TABLE public.pet_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.pet_providers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'zimmer',  -- zimmer, auslauf, box, salon
  capacity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- P5.2: Tier-zu-Raum-Zuordnung (Belegung)
CREATE TABLE public.pet_room_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.pet_rooms(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.pet_bookings(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pet_rooms_provider ON public.pet_rooms(provider_id);
CREATE INDEX idx_pet_rooms_tenant ON public.pet_rooms(tenant_id);
CREATE INDEX idx_pet_room_assignments_room ON public.pet_room_assignments(room_id);
CREATE INDEX idx_pet_room_assignments_booking ON public.pet_room_assignments(booking_id);
CREATE INDEX idx_pet_room_assignments_tenant ON public.pet_room_assignments(tenant_id);
CREATE INDEX idx_pet_room_assignments_active ON public.pet_room_assignments(room_id, check_out_at) WHERE check_out_at IS NULL;

-- RLS
ALTER TABLE public.pet_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_room_assignments ENABLE ROW LEVEL SECURITY;

-- pet_rooms policies
CREATE POLICY "Users can view rooms of their tenant"
  ON public.pet_rooms FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create rooms for their tenant"
  ON public.pet_rooms FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update rooms of their tenant"
  ON public.pet_rooms FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete rooms of their tenant"
  ON public.pet_rooms FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

-- pet_room_assignments policies
CREATE POLICY "Users can view assignments of their tenant"
  ON public.pet_room_assignments FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create assignments for their tenant"
  ON public.pet_room_assignments FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update assignments of their tenant"
  ON public.pet_room_assignments FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete assignments of their tenant"
  ON public.pet_room_assignments FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Trigger for updated_at on pet_rooms
CREATE TRIGGER update_pet_rooms_updated_at
  BEFORE UPDATE ON public.pet_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
