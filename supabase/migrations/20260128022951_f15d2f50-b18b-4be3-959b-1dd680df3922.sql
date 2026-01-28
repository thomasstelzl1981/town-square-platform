UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Übersicht", "route": "/portal/finanzierung"}
]'::jsonb 
WHERE tile_code = 'MOD-07';