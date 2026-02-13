
-- MOD-04: Verwaltung-Tab hinzufuegen
UPDATE tile_catalog SET sub_tiles = '[
  {"title":"Portfolio","route":"/portal/immobilien/portfolio"},
  {"title":"Vermietereinheit","route":"/portal/immobilien/kontexte"},
  {"title":"Sanierung","route":"/portal/immobilien/sanierung"},
  {"title":"Bewertung","route":"/portal/immobilien/bewertung"},
  {"title":"Verwaltung","route":"/portal/immobilien/verwaltung"}
]'::jsonb WHERE tile_code = 'MOD-04';

-- MOD-05: Umwidmung zu KI-Telefon-Assistent
UPDATE tile_catalog SET
  title = 'KI-Telefon-Assistent',
  sub_tiles = '[{"title":"Übersicht","route":"/portal/msv/uebersicht"}]'::jsonb
WHERE tile_code = 'MOD-05';

-- MOD-20: Display-Name zu "Zuhause"
UPDATE tile_catalog SET title = 'Zuhause' WHERE tile_code = 'MOD-20';
