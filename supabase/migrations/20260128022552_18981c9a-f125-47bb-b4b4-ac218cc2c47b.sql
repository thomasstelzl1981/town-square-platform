INSERT INTO tile_catalog (
  tile_code, 
  title,
  main_tile_title,
  description, 
  icon_key, 
  main_tile_route, 
  sub_tiles, 
  display_order, 
  is_active
)
VALUES (
  'MOD-11',
  'Finanzierungsmanager',
  'Finanzierungsmanager',
  'Finanzierungsanfragen bearbeiten und bei Banken einreichen',
  'landmark',
  '/portal/finanzierungsmanager',
  '[
    {"title": "So funktioniert''s", "route": "/portal/finanzierungsmanager"},
    {"title": "Selbstauskunft", "route": "/portal/finanzierungsmanager/selbstauskunft"},
    {"title": "Einreichen", "route": "/portal/finanzierungsmanager/einreichen"},
    {"title": "Status", "route": "/portal/finanzierungsmanager/status"}
  ]'::jsonb,
  11,
  true
);