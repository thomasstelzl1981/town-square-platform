-- Neue RLS-Policy: Öffentliche Provider für alle sichtbar (anon + authenticated)
CREATE POLICY "public_published_providers"
  ON public.pet_providers
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true AND status = 'active');

-- Gleiche Policy für pet_services (Services der öffentlichen Provider)
CREATE POLICY "public_published_provider_services"
  ON public.pet_services
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_providers pp
      WHERE pp.id = pet_services.provider_id
        AND pp.is_published = true
        AND pp.status = 'active'
    )
    AND is_active = true
  );