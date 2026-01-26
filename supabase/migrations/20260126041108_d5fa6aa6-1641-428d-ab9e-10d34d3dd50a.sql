-- =====================================================
-- PHASE 3: FIX CONSTRAINTS + TILE CATALOG + SEEDS
-- =====================================================

-- Remove the sub_tiles_count constraint (too restrictive)
ALTER TABLE tile_catalog DROP CONSTRAINT IF EXISTS sub_tiles_count;

-- Add flexible constraint (1-6 sub_tiles)
ALTER TABLE tile_catalog ADD CONSTRAINT sub_tiles_count_flexible 
  CHECK (jsonb_array_length(sub_tiles) >= 1 AND jsonb_array_length(sub_tiles) <= 6);

-- Add UNIQUE constraint for tile_code if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tile_catalog_tile_code_key') THEN
    ALTER TABLE tile_catalog ADD CONSTRAINT tile_catalog_tile_code_key UNIQUE (tile_code);
  END IF;
END $$;

-- SEED TILE CATALOG (10 MODULES) with 4 sub_tiles each
INSERT INTO tile_catalog (tile_code, title, main_tile_title, main_tile_route, icon_key, zone, display_order, is_active, sub_tiles, description)
VALUES
  ('MOD-01', 'Stammdaten', 'Stammdaten', '/portal/stammdaten', 'Users', 2, 1, true, 
   '[{"title":"Profil","route":"/portal/stammdaten/profil"},{"title":"Kontakte","route":"/portal/stammdaten/kontakte"},{"title":"Adressen","route":"/portal/stammdaten/adressen"},{"title":"Einstellungen","route":"/portal/stammdaten/einstellungen"}]'::jsonb,
   'Kontakte, Adressen, Bankdaten'),
  ('MOD-02', 'KI Office', 'Office', '/portal/office', 'Bot', 2, 2, true,
   '[{"title":"Chat","route":"/portal/office/chat"},{"title":"Aufgaben","route":"/portal/office/aufgaben"},{"title":"Kalender","route":"/portal/office/kalender"},{"title":"Notizen","route":"/portal/office/notizen"}]'::jsonb,
   'KI-gestütztes Backoffice'),
  ('MOD-03', 'DMS', 'Dokumente', '/portal/dms', 'FileText', 2, 3, true,
   '[{"title":"Ablage","route":"/portal/dms/storage"},{"title":"Posteingang","route":"/portal/dms/post"},{"title":"Sortieren","route":"/portal/dms/sort"},{"title":"Einstellungen","route":"/portal/dms/settings"}]'::jsonb,
   'Dokumentenmanagement'),
  ('MOD-04', 'Immobilien', 'Portfolio', '/portal/immobilien', 'Building2', 2, 4, true,
   '[{"title":"Liste","route":"/portal/immobilien/liste"},{"title":"Neu","route":"/portal/immobilien/neu"},{"title":"Karte","route":"/portal/immobilien/karte"},{"title":"Analyse","route":"/portal/immobilien/analyse"}]'::jsonb,
   'Immobilienverwaltung'),
  ('MOD-05', 'MSV', 'Mietmanagement', '/portal/msv', 'Home', 2, 5, true,
   '[{"title":"Übersicht","route":"/portal/msv/uebersicht"},{"title":"Mieter","route":"/portal/msv/mieter"},{"title":"Zahlungen","route":"/portal/msv/zahlungen"},{"title":"Mahnungen","route":"/portal/msv/mahnungen"}]'::jsonb,
   'Mieter-Selbstverwaltung'),
  ('MOD-06', 'Verkauf', 'Verkauf', '/portal/verkauf', 'Tag', 2, 6, true,
   '[{"title":"Inserate","route":"/portal/verkauf/inserate"},{"title":"Anfragen","route":"/portal/verkauf/anfragen"},{"title":"Reservierungen","route":"/portal/verkauf/reservierungen"},{"title":"Transaktionen","route":"/portal/verkauf/transaktionen"}]'::jsonb,
   'Immobilienverkauf'),
  ('MOD-07', 'Finanzierung', 'Finanzierung', '/portal/finanzierung', 'Landmark', 2, 7, true,
   '[{"title":"Fälle","route":"/portal/finanzierung/faelle"},{"title":"Dokumente","route":"/portal/finanzierung/dokumente"},{"title":"Export","route":"/portal/finanzierung/export"},{"title":"Status","route":"/portal/finanzierung/status"}]'::jsonb,
   'Finanzierungsvorbereitung'),
  ('MOD-08', 'Investments', 'Investment-Suche', '/portal/investments', 'Search', 2, 8, true,
   '[{"title":"Suche","route":"/portal/investments/suche"},{"title":"Favoriten","route":"/portal/investments/favoriten"},{"title":"Profile","route":"/portal/investments/profile"},{"title":"Alerts","route":"/portal/investments/alerts"}]'::jsonb,
   'Investment-Suche & Ankauf'),
  ('MOD-09', 'Vertriebspartner', 'Partner', '/portal/vertriebspartner', 'Handshake', 2, 9, true,
   '[{"title":"Dashboard","route":"/portal/vertriebspartner/dashboard"},{"title":"Katalog","route":"/portal/vertriebspartner/katalog"},{"title":"Auswahl","route":"/portal/vertriebspartner/auswahl"},{"title":"Netzwerk","route":"/portal/vertriebspartner/netzwerk"}]'::jsonb,
   'Vertriebspartner-Modul'),
  ('MOD-10', 'Leadgenerierung', 'Leads', '/portal/leads', 'Target', 2, 10, true,
   '[{"title":"Inbox","route":"/portal/leads/inbox"},{"title":"Pipeline","route":"/portal/leads/pipeline"},{"title":"Kampagnen","route":"/portal/leads/kampagnen"},{"title":"Statistik","route":"/portal/leads/statistik"}]'::jsonb,
   'Lead-Generierung & Kampagnen')
ON CONFLICT (tile_code) DO UPDATE SET
  title = EXCLUDED.title,
  main_tile_title = EXCLUDED.main_tile_title,
  main_tile_route = EXCLUDED.main_tile_route,
  icon_key = EXCLUDED.icon_key,
  display_order = EXCLUDED.display_order,
  sub_tiles = EXCLUDED.sub_tiles,
  description = EXCLUDED.description;

-- SEED INTEGRATION REGISTRY
INSERT INTO integration_registry (public_id, code, name, type, status, description, version, config_schema)
VALUES
  (generate_public_id('INT'), 'future_room', 'Future Room', 'integration', 'pending_setup', 
   'Finanzierungsplattform - Export/Handoff', '1.0.0', '{"fields":["webhook_url","api_key"]}'::jsonb),
  (generate_public_id('INT'), 'scout24', 'ImmoScout24', 'integration', 'pending_setup',
   'Immobilienportal-Integration', '1.0.0', '{"fields":["api_key","customer_id"]}'::jsonb),
  (generate_public_id('INT'), 'meta_ads', 'Meta Ads', 'integration', 'pending_setup',
   'Meta/Facebook Ads für Leadgenerierung', '1.0.0', '{"fields":["access_token","ad_account_id"]}'::jsonb),
  (generate_public_id('INT'), 'apify', 'Apify Scraper', 'integration', 'pending_setup',
   'Web Scraping für Investment-Suche', '1.0.0', '{"fields":["api_token"]}'::jsonb),
  (generate_public_id('INT'), 'resend', 'Resend Email', 'integration', 'active',
   'E-Mail-Versand', '1.0.0', '{"fields":["api_key"]}'::jsonb)
ON CONFLICT DO NOTHING;