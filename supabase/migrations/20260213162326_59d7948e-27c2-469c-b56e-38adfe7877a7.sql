
-- Erweitere sub_tiles Constraint von max 6 auf max 10 (zukunftssicher)
ALTER TABLE public.tile_catalog DROP CONSTRAINT sub_tiles_count_flexible;
ALTER TABLE public.tile_catalog ADD CONSTRAINT sub_tiles_count_flexible 
  CHECK (jsonb_array_length(sub_tiles) >= 1 AND jsonb_array_length(sub_tiles) <= 10);
