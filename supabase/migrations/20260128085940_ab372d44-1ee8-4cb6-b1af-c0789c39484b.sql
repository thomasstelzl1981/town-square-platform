-- A1: Update tile_catalog sub_tiles for MOD-07 to 4 entries
UPDATE tile_catalog
SET sub_tiles = '[
  {"route": "/portal/finanzierung", "title": "Dashboard"},
  {"route": "/portal/finanzierung/faelle", "title": "Fälle"},
  {"route": "/portal/finanzierung/dokumente", "title": "Dokumente"},
  {"route": "/portal/finanzierung/einstellungen", "title": "Einstellungen"}
]'::jsonb,
    updated_at = now()
WHERE tile_code = 'MOD-07';