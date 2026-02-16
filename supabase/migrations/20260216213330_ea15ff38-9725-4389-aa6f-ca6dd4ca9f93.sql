
CREATE TABLE public.car_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.cars_vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tenant_id uuid NOT NULL,
  partner text DEFAULT 'fairgarage',
  zip text,
  radius_km int DEFAULT 20,
  service_type text NOT NULL,
  problem_note text,
  status text NOT NULL DEFAULT 'draft',
  selected_workshop_name text,
  selected_workshop_id text,
  distance_km numeric,
  quoted_price_min numeric,
  quoted_price_max numeric,
  next_available_at timestamptz,
  appointment_at timestamptz,
  contact_email text,
  contact_phone text,
  confirmed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_car_service_request_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('draft','comparison_shown','workshop_selected','booking_requested','booked','rejected','cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_car_service_request_status
  BEFORE INSERT OR UPDATE ON public.car_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_car_service_request_status();

CREATE TRIGGER update_car_service_requests_updated_at
  BEFORE UPDATE ON public.car_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.car_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own service requests"
  ON public.car_service_requests
  FOR ALL
  USING (tenant_id::text = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (tenant_id::text = (SELECT raw_app_meta_data->>'tenant_id' FROM auth.users WHERE id = auth.uid()));
