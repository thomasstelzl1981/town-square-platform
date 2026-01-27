-- Allow anon users to read tile_catalog for development mode
CREATE POLICY "tile_catalog_select_anon" 
ON public.tile_catalog 
FOR SELECT 
TO anon
USING (true);