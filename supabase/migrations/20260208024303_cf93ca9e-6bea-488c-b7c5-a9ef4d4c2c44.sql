-- Phase 1.1: MOD-00 Dashboard in tile_catalog einfügen
-- Dieses Modul fehlt aktuell im Katalog

INSERT INTO tile_catalog (
  tile_code,
  title,
  description,
  icon_key,
  zone,
  display_order,
  is_active,
  main_tile_route,
  main_tile_title,
  sub_tiles
) VALUES (
  'MOD-00',
  'Dashboard',
  'Zentrales Dashboard mit Widgets, KPIs und Armstrong KI-Assistent',
  'layout-dashboard',
  2,
  0,
  true,
  '/portal',
  'Dashboard',
  '[{"route":"/portal","title":"Home"},{"route":"/portal/chat","title":"Armstrong Chat"}]'::jsonb
)
ON CONFLICT (tile_code) DO NOTHING;