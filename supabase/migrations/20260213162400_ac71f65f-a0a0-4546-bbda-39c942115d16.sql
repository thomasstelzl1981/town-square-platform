
-- =====================================================================
-- SPRINT S1: tile_catalog Synchronisation (Backlog v5)
-- 13 Updates fuer Module mit Drift
-- =====================================================================

-- S1-01: MOD-02 — Videocalls hinzufuegen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/office/email", "title": "E-Mail"},
  {"route": "/portal/office/brief", "title": "Brief"},
  {"route": "/portal/office/kontakte", "title": "Kontakte"},
  {"route": "/portal/office/kalender", "title": "Kalender"},
  {"route": "/portal/office/widgets", "title": "Widgets"},
  {"route": "/portal/office/whatsapp", "title": "WhatsApp"},
  {"route": "/portal/office/videocalls", "title": "Videocalls"}
]'::jsonb WHERE tile_code = 'MOD-02';

-- S1-02: MOD-04 — bewertung entfernen, zuhause hinzufuegen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/immobilien/zuhause", "title": "ZUHAUSE"},
  {"route": "/portal/immobilien/portfolio", "title": "Portfolio"},
  {"route": "/portal/immobilien/verwaltung", "title": "Verwaltung"},
  {"route": "/portal/immobilien/sanierung", "title": "Sanierung"}
]'::jsonb WHERE tile_code = 'MOD-04';

-- S1-03: MOD-06 — einstellungen entfernen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/verkauf/objekte", "title": "Objekte"},
  {"route": "/portal/verkauf/anfragen", "title": "Anfragen"},
  {"route": "/portal/verkauf/vorgaenge", "title": "Vorgänge"},
  {"route": "/portal/verkauf/reporting", "title": "Reporting"}
]'::jsonb WHERE tile_code = 'MOD-06';

-- S1-04: MOD-07 — privatkredit hinzufuegen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/finanzierung/selbstauskunft", "title": "Selbstauskunft"},
  {"route": "/portal/finanzierung/dokumente", "title": "Dokumente"},
  {"route": "/portal/finanzierung/anfrage", "title": "Anfrage"},
  {"route": "/portal/finanzierung/status", "title": "Status"},
  {"route": "/portal/finanzierung/privatkredit", "title": "Privatkredit"}
]'::jsonb WHERE tile_code = 'MOD-07';

-- S1-05: MOD-11 — komplett ersetzen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/finanzierungsmanager/dashboard", "title": "Dashboard"},
  {"route": "/portal/finanzierungsmanager/finanzierungsakte", "title": "Finanzierungsakte"},
  {"route": "/portal/finanzierungsmanager/einreichung", "title": "Einreichung"},
  {"route": "/portal/finanzierungsmanager/provisionen", "title": "Provisionen"},
  {"route": "/portal/finanzierungsmanager/archiv", "title": "Archiv"}
]'::jsonb WHERE tile_code = 'MOD-11';

-- S1-06: MOD-12 — datenbank hinzufuegen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/akquise-manager/dashboard", "title": "Dashboard"},
  {"route": "/portal/akquise-manager/mandate", "title": "Mandate"},
  {"route": "/portal/akquise-manager/objekteingang", "title": "Objekteingang"},
  {"route": "/portal/akquise-manager/datenbank", "title": "Datenbank"},
  {"route": "/portal/akquise-manager/tools", "title": "Tools"}
]'::jsonb WHERE tile_code = 'MOD-12';

-- S1-07: MOD-14 — agenten durch ki-telefon ersetzen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/communication-pro/serien-emails", "title": "Serien-E-Mails"},
  {"route": "/portal/communication-pro/recherche", "title": "Recherche"},
  {"route": "/portal/communication-pro/social", "title": "Social"},
  {"route": "/portal/communication-pro/ki-telefon", "title": "KI-Telefonassistent"}
]'::jsonb WHERE tile_code = 'MOD-14';

-- S1-08: MOD-16 — komplett ersetzen + Titel
UPDATE public.tile_catalog SET 
  title = 'Shops',
  sub_tiles = '[
  {"route": "/portal/services/amazon", "title": "Amazon Business"},
  {"route": "/portal/services/otto-office", "title": "OTTO Office"},
  {"route": "/portal/services/miete24", "title": "Miete24"},
  {"route": "/portal/services/bestellungen", "title": "Bestellungen"}
]'::jsonb WHERE tile_code = 'MOD-16';

-- S1-09: MOD-17 — boote+privatjet statt versicherungen+fahrtenbuch
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/cars/fahrzeuge", "title": "Fahrzeuge"},
  {"route": "/portal/cars/boote", "title": "Boote"},
  {"route": "/portal/cars/privatjet", "title": "Privatjet"},
  {"route": "/portal/cars/angebote", "title": "Angebote"}
]'::jsonb WHERE tile_code = 'MOD-17';

-- S1-10: MOD-18 — bereits korrekte Routes, Titel-Konsistenz
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/finanzanalyse/dashboard", "title": "Dashboard"},
  {"route": "/portal/finanzanalyse/reports", "title": "Reports"},
  {"route": "/portal/finanzanalyse/szenarien", "title": "Szenarien"},
  {"route": "/portal/finanzanalyse/settings", "title": "Einstellungen"}
]'::jsonb WHERE tile_code = 'MOD-18';

-- S1-11: MOD-19 — komplett ersetzen
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/photovoltaik/anlagen", "title": "Anlagen"},
  {"route": "/portal/photovoltaik/monitoring", "title": "Monitoring"},
  {"route": "/portal/photovoltaik/dokumente", "title": "Dokumente"},
  {"route": "/portal/photovoltaik/einstellungen", "title": "Einstellungen"}
]'::jsonb WHERE tile_code = 'MOD-19';

-- S1-12: MOD-20 — 5er-Struktur (Miety)
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/miety/uebersicht", "title": "Übersicht"},
  {"route": "/portal/miety/versorgung", "title": "Versorgung"},
  {"route": "/portal/miety/versicherungen", "title": "Versicherungen"},
  {"route": "/portal/miety/smarthome", "title": "Smart Home"},
  {"route": "/portal/miety/kommunikation", "title": "Kommunikation"}
]'::jsonb WHERE tile_code = 'MOD-20';

-- S1-13: MOD-09 — Leads → Leadeingang
UPDATE public.tile_catalog SET sub_tiles = '[
  {"route": "/portal/vertriebspartner/katalog", "title": "Katalog"},
  {"route": "/portal/vertriebspartner/beratung", "title": "Beratung"},
  {"route": "/portal/vertriebspartner/kunden", "title": "Kunden"},
  {"route": "/portal/vertriebspartner/network", "title": "Netzwerk"},
  {"route": "/portal/vertriebspartner/leads", "title": "Leadeingang"}
]'::jsonb WHERE tile_code = 'MOD-09';
