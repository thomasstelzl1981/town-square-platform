-- Namens-Synchronisation: tile_catalog titles an routesManifest.ts angleichen
-- MOD-09: Vertriebsmanager → Immomanager (Manifest-Name)
UPDATE public.tile_catalog SET title = 'Immomanager', updated_at = now() WHERE tile_code = 'MOD-09';

-- MOD-10: Leadmanager → Provisionen (Manifest-Name)
UPDATE public.tile_catalog SET title = 'Provisionen', updated_at = now() WHERE tile_code = 'MOD-10';

-- MOD-16: Shops → Shop (Manifest-Name)
UPDATE public.tile_catalog SET title = 'Shop', updated_at = now() WHERE tile_code = 'MOD-16';

-- MOD-18: Finanzanalyse → Finanzen (Manifest-Name)
UPDATE public.tile_catalog SET title = 'Finanzen', updated_at = now() WHERE tile_code = 'MOD-18';

-- MOD-20: Zuhause bleibt Zuhause (Manifest sagt "Miety" aber Display soll "Zuhause" sein)
-- Kein Update nötig für MOD-20
