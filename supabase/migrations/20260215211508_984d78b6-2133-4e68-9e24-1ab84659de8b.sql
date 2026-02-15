
-- Schritt 1: Legacy-Eintraege entfernen
DELETE FROM integration_registry WHERE code IN (
  'ARLO_SMARTHOME', 'IPFI', 'RADIO_BROWSER', 'CAYA', 
  'UNSTRUCTURED', 'PROCESS_INBOUND', 'SEND_EMAIL'
);

-- Schritt 2: Fehlende aktive Integrationen nachtragen
INSERT INTO integration_registry (code, name, type, status, description, auth_type, base_url, guardrails)
VALUES
  ('ELEVENLABS', 'ElevenLabs', 'integration', 'active', 
   'KI-Sprachsynthese und Echtzeit-Transkription fuer Armstrong Voice', 'api_key',
   'https://api.elevenlabs.io/v1', 'rate-limit-respect'),
  ('LIVEKIT', 'LiveKit Video', 'integration', 'active',
   'WebRTC Video-Calls fuer Beratungsgespraeche', 'api_key',
   'https://livekit.io', NULL),
  ('PERPLEXITY', 'Perplexity AI', 'integration', 'active',
   'KI-gestuetzte Web-Recherche fuer Dossier Auto-Research', 'api_key',
   'https://api.perplexity.ai', 'cost-per-query'),
  ('OPENAI', 'OpenAI', 'integration', 'active',
   'Reserve-KI-Provider (Legacy, primaer Lovable AI)', 'api_key',
   'https://api.openai.com/v1', NULL),
  ('CRON_SYSTEM', 'Cron System', 'secret', 'active',
   'Internes Cron-Secret fuer automatisierte Jobs', 'api_key',
   NULL, NULL),
  ('VIMCAR', 'Vimcar Fleet', 'integration', 'pending_setup',
   'Automatisches Fahrtenbuch und Fuhrpark-Management (MOD-17)', 'api_key',
   'https://api.vimcar.com/v1', NULL);

-- Schritt 3: Status-Korrekturen
UPDATE integration_registry SET status = 'active' WHERE code = 'NASA_APOD';
UPDATE integration_registry SET status = 'active' WHERE code = 'ZENQUOTES';
UPDATE integration_registry SET status = 'active' WHERE code = 'apify';
UPDATE integration_registry SET status = 'active' WHERE code = 'FIRECRAWL';
