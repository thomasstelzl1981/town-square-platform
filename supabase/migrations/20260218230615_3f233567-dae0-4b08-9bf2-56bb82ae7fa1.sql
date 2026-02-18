
DROP POLICY IF EXISTS "Admins can manage brand assets" ON public.social_brand_assets;
CREATE POLICY "Admins can manage brand assets" ON public.social_brand_assets 
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
