
CREATE TABLE public.pet_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'vet_visit',
  title TEXT NOT NULL,
  description TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vet_name TEXT,
  diagnosis TEXT,
  treatment TEXT,
  medication TEXT,
  cost_amount NUMERIC(10,2),
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for pet_medical_records"
  ON public.pet_medical_records
  FOR ALL
  USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE TRIGGER update_pet_medical_records_updated_at
  BEFORE UPDATE ON public.pet_medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
