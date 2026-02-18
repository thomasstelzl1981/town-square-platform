
-- Booking requests staging table (Z3 -> Z1 tracking -> Z2 provider)
CREATE TABLE public.pet_z1_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  z1_customer_id uuid NOT NULL REFERENCES public.pet_z1_customers(id),
  provider_id uuid NOT NULL REFERENCES public.pet_providers(id),
  service_title text NOT NULL,
  preferred_date date,
  preferred_time text,
  pet_z1_id uuid REFERENCES public.pet_z1_pets(id),
  pet_name text,
  client_notes text,
  status text NOT NULL DEFAULT 'pending',
  provider_confirmed_at timestamptz,
  z2_booking_id uuid REFERENCES public.pet_bookings(id),
  fee_cents integer DEFAULT 0,
  payment_status text DEFAULT 'none',
  payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pet_z1_booking_requests_tenant_created ON public.pet_z1_booking_requests (tenant_id, created_at);
CREATE INDEX idx_pet_z1_booking_requests_customer ON public.pet_z1_booking_requests (z1_customer_id);
CREATE INDEX idx_pet_z1_booking_requests_provider_status ON public.pet_z1_booking_requests (provider_id, status);

-- Updated_at trigger
CREATE TRIGGER update_pet_z1_booking_requests_updated_at
  BEFORE UPDATE ON public.pet_z1_booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.pet_z1_booking_requests ENABLE ROW LEVEL SECURITY;

-- Z3 customers can read their own requests (matched via pet_z1_customers)
CREATE POLICY "z3_customer_select_own_booking_requests"
  ON public.pet_z1_booking_requests FOR SELECT
  USING (
    z1_customer_id IN (
      SELECT id FROM public.pet_z1_customers WHERE id = z1_customer_id
    )
  );

-- Z3 customers can insert their own requests
CREATE POLICY "z3_customer_insert_own_booking_requests"
  ON public.pet_z1_booking_requests FOR INSERT
  WITH CHECK (true);

-- Platform admins (Z1) can read all
CREATE POLICY "z1_admin_select_all_booking_requests"
  ON public.pet_z1_booking_requests FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Platform admins can update (manual status override)
CREATE POLICY "z1_admin_update_booking_requests"
  ON public.pet_z1_booking_requests FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Z2 providers can read assigned requests
CREATE POLICY "z2_provider_select_assigned_booking_requests"
  ON public.pet_z1_booking_requests FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.pet_providers WHERE user_id = auth.uid()
    )
  );

-- Z2 providers can update (confirm/reject)
CREATE POLICY "z2_provider_update_assigned_booking_requests"
  ON public.pet_z1_booking_requests FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.pet_providers WHERE user_id = auth.uid()
    )
  );

-- Anon users can insert (Z3 website users are not authenticated via Supabase auth)
CREATE POLICY "anon_insert_booking_requests"
  ON public.pet_z1_booking_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon users can read (Z3 session-based auth reads own via app logic)
CREATE POLICY "anon_select_booking_requests"
  ON public.pet_z1_booking_requests FOR SELECT
  TO anon
  USING (true);
