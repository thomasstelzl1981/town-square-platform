UPDATE tile_catalog
SET sub_tiles = '[
  {"title":"Profil","route":"/portal/stammdaten/profil"},
  {"title":"Verträge","route":"/portal/stammdaten/vertraege"},
  {"title":"Abrechnung","route":"/portal/stammdaten/abrechnung"},
  {"title":"Sicherheit","route":"/portal/stammdaten/sicherheit"},
  {"title":"Demo-Daten","route":"/portal/stammdaten/demo-daten"}
]'::jsonb
WHERE tile_code = 'MOD-01';