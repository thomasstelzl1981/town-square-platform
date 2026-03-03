CREATE POLICY "Public can read active products"
ON public.service_shop_products
FOR SELECT
TO anon
USING (is_active = true);