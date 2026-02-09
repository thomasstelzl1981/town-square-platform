-- =============================================================================
-- TILE CATALOG SYNC — Align DB sub_tiles with Manifest SSOT
-- Run: 2026-02-09
-- =============================================================================

-- MOD-01: Stammdaten — firma → vertraege
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Profil", "route": "/portal/stammdaten/profil"},
  {"title": "Verträge", "route": "/portal/stammdaten/vertraege"},
  {"title": "Abrechnung", "route": "/portal/stammdaten/abrechnung"},
  {"title": "Sicherheit", "route": "/portal/stammdaten/sicherheit"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-01';

-- MOD-06: Verkauf — add anfragen tile (5 tiles per manifest)
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Objekte", "route": "/portal/verkauf/objekte"},
  {"title": "Anfragen", "route": "/portal/verkauf/anfragen"},
  {"title": "Vorgänge", "route": "/portal/verkauf/vorgaenge"},
  {"title": "Reporting", "route": "/portal/verkauf/reporting"},
  {"title": "Einstellungen", "route": "/portal/verkauf/einstellungen"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-06';

-- MOD-11: Finanzierungsmanager — new 4-tile structure per spec
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Dashboard", "route": "/portal/finanzierungsmanager/dashboard"},
  {"title": "Fälle", "route": "/portal/finanzierungsmanager/faelle"},
  {"title": "Kommunikation", "route": "/portal/finanzierungsmanager/kommunikation"},
  {"title": "Status", "route": "/portal/finanzierungsmanager/status"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-11';

-- MOD-12: Akquise-Manager — kunden → objekteingang
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Dashboard", "route": "/portal/akquise-manager/dashboard"},
  {"title": "Mandate", "route": "/portal/akquise-manager/mandate"},
  {"title": "Objekteingang", "route": "/portal/akquise-manager/objekteingang"},
  {"title": "Tools", "route": "/portal/akquise-manager/tools"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-12';

-- MOD-13: Projekte — new structure per manifest
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Dashboard", "route": "/portal/projekte/dashboard"},
  {"title": "Projekte", "route": "/portal/projekte/projekte"},
  {"title": "Vertrieb", "route": "/portal/projekte/vertrieb"},
  {"title": "Marketing", "route": "/portal/projekte/marketing"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-13';

-- MOD-17: Car-Management — new structure per manifest
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Fahrzeuge", "route": "/portal/cars/fahrzeuge"},
  {"title": "Versicherungen", "route": "/portal/cars/versicherungen"},
  {"title": "Fahrtenbuch", "route": "/portal/cars/fahrtenbuch"},
  {"title": "Angebote", "route": "/portal/cars/angebote"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-17';

-- MOD-18: Finanzanalyse — sync with manifest
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Dashboard", "route": "/portal/finanzanalyse/dashboard"},
  {"title": "Reports", "route": "/portal/finanzanalyse/reports"},
  {"title": "Szenarien", "route": "/portal/finanzanalyse/szenarien"},
  {"title": "Einstellungen", "route": "/portal/finanzanalyse/settings"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-18';

-- MOD-19: Photovoltaik — sync with manifest
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Angebot", "route": "/portal/photovoltaik/angebot"},
  {"title": "Checkliste", "route": "/portal/photovoltaik/checkliste"},
  {"title": "Projekt", "route": "/portal/photovoltaik/projekt"},
  {"title": "Einstellungen", "route": "/portal/photovoltaik/settings"}
]'::jsonb,
updated_at = now()
WHERE tile_code = 'MOD-19';

-- MOD-20: Miety — INSERT if not exists (6-tile exception)
INSERT INTO tile_catalog (
  tile_code, title, description, icon_key, zone, display_order, is_active,
  main_tile_route, main_tile_title, sub_tiles
)
VALUES (
  'MOD-20', 
  'Miety', 
  'Mieter-Portal mit 6 Tiles (Ausnahme vom 4-Tile-Pattern)',
  'home',
  2,
  20,
  true,
  '/portal/miety',
  'Übersicht',
  '[
    {"title": "Übersicht", "route": "/portal/miety/uebersicht"},
    {"title": "Dokumente", "route": "/portal/miety/dokumente"},
    {"title": "Kommunikation", "route": "/portal/miety/kommunikation"},
    {"title": "Zählerstände", "route": "/portal/miety/zaehlerstaende"},
    {"title": "Versorgung", "route": "/portal/miety/versorgung"},
    {"title": "Versicherungen", "route": "/portal/miety/versicherungen"}
  ]'::jsonb
)
ON CONFLICT (tile_code) DO UPDATE SET
  sub_tiles = EXCLUDED.sub_tiles,
  description = EXCLUDED.description,
  updated_at = now();