
-- ═══════════════════════════════════════════════════════════
-- Demo-Daten: Familie Mustermann — Vollständiger Datensatz
-- ═══════════════════════════════════════════════════════════

-- 1. Hauptperson Thomas → Max Mustermann umbenennen
UPDATE public.household_persons SET
  first_name = 'Max',
  last_name = 'Mustermann',
  birth_date = '1982-03-15',
  salutation = 'Herr',
  email = 'max@mustermann-demo.de',
  phone = '+49 170 1234567',
  employment_status = 'selbstaendig',
  employer_name = 'IT-Beratung Mustermann',
  marital_status = 'verheiratet',
  role = 'hauptperson',
  updated_at = now()
WHERE id = 'b1f6d204-05ac-462f-9dae-8fba64ab9f88';

-- 2. Partnerin Lisa
INSERT INTO public.household_persons (id, tenant_id, user_id, role, salutation, first_name, last_name, birth_date, email, phone, employment_status, employer_name, marital_status, sort_order, is_primary)
VALUES (
  'e0000000-0000-4000-a000-000000000101',
  'a0000000-0000-4000-a000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'partner', 'Frau', 'Lisa', 'Mustermann', '1985-07-22',
  'lisa@mustermann-demo.de', '+49 170 7654321',
  'angestellt', 'MediaCorp GmbH', 'verheiratet', 1, false
) ON CONFLICT (id) DO NOTHING;

-- 3. Kind Felix
INSERT INTO public.household_persons (id, tenant_id, user_id, role, salutation, first_name, last_name, birth_date, sort_order, is_primary)
VALUES (
  'e0000000-0000-4000-a000-000000000102',
  'a0000000-0000-4000-a000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'kind', 'Herr', 'Felix', 'Mustermann', '2014-09-03', 2, false
) ON CONFLICT (id) DO NOTHING;

-- 4. Kind Emma
INSERT INTO public.household_persons (id, tenant_id, user_id, role, salutation, first_name, last_name, birth_date, sort_order, is_primary)
VALUES (
  'e0000000-0000-4000-a000-000000000103',
  'a0000000-0000-4000-a000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'kind', 'Frau', 'Emma', 'Mustermann', '2017-11-28', 3, false
) ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 5. Sachversicherungen (7 Verträge)
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.insurance_contracts (id, tenant_id, user_id, category, insurer, policy_no, policyholder, start_date, premium, payment_interval, status, details)
VALUES
  ('e0000000-0000-4000-a000-000000000201', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'haftpflicht', 'HUK-COBURG', 'HUK-PHV-2019-4711', 'Max Mustermann', '2019-01-01', 8.50, 'monatlich', 'aktiv',
   '{"deckungssumme": 50000000, "selbstbeteiligung": 0, "familientarif": true}'::jsonb),
  
  ('e0000000-0000-4000-a000-000000000202', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'hausrat', 'Allianz', 'AZ-HR-2020-0815', 'Max Mustermann', '2020-04-01', 15.90, 'monatlich', 'aktiv',
   '{"versicherungssumme": 65000, "wohnflaeche_qm": 120, "elementar": true}'::jsonb),
  
  ('e0000000-0000-4000-a000-000000000203', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'wohngebaeude', 'ERGO', 'ERGO-WG-2018-3344', 'Max Mustermann', '2018-06-01', 42.00, 'monatlich', 'aktiv',
   '{"wohnflaeche_qm": 180, "elementar": true, "gleitender_neuwert": true}'::jsonb),
  
  ('e0000000-0000-4000-a000-000000000204', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'rechtsschutz', 'ARAG', 'ARAG-RS-2021-9922', 'Max Mustermann', '2021-01-01', 28.50, 'monatlich', 'aktiv',
   '{"selbstbeteiligung": 150, "bereiche": "Privat+Beruf+Verkehr+Miete"}'::jsonb),
  
  ('e0000000-0000-4000-a000-000000000205', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'kfz', 'HUK-COBURG', 'HUK-KFZ-2022-P911', 'Max Mustermann', '2022-03-01', 89.00, 'monatlich', 'aktiv',
   '{"fahrzeug": "Porsche 911 Carrera", "vollkasko": true, "sb_vk": 300, "sb_tk": 150}'::jsonb),
  
  ('e0000000-0000-4000-a000-000000000206', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'kfz', 'Allianz', 'AZ-KFZ-2023-BMW5', 'Lisa Mustermann', '2023-01-01', 62.00, 'monatlich', 'aktiv',
   '{"fahrzeug": "BMW M5 Competition", "teilkasko": true, "sb_tk": 150}'::jsonb),
  
  ('e0000000-0000-4000-a000-000000000207', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'berufsunfaehigkeit', 'Alte Leipziger', 'AL-BU-2017-MM01', 'Max Mustermann', '2017-07-01', 95.00, 'monatlich', 'aktiv',
   '{"monatliche_rente": 3000, "laufzeit_bis": "2047-03-15", "nachversicherung": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 6. Vorsorgeverträge (4 Verträge)
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.vorsorge_contracts (id, tenant_id, user_id, person_id, provider, contract_no, contract_type, start_date, premium, payment_interval, status)
VALUES
  ('e0000000-0000-4000-a000-000000000301', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'b1f6d204-05ac-462f-9dae-8fba64ab9f88', 'Alte Leipziger', 'AL-RUE-2019-001', 'Rürup (Basisrente)', '2019-01-01', 250.00, 'monatlich', 'aktiv'),
  
  ('e0000000-0000-4000-a000-000000000302', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'e0000000-0000-4000-a000-000000000101', 'Allianz', 'AZ-BAV-2020-001', 'bAV (Entgeltumwandlung)', '2020-04-01', 200.00, 'monatlich', 'aktiv'),
  
  ('e0000000-0000-4000-a000-000000000303', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'e0000000-0000-4000-a000-000000000101', 'DWS', 'DWS-RIE-2018-001', 'Riester-Rente', '2018-01-01', 162.17, 'monatlich', 'aktiv'),
  
  ('e0000000-0000-4000-a000-000000000304', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'b1f6d204-05ac-462f-9dae-8fba64ab9f88', 'Vanguard', 'VG-ETF-2021-001', 'Privater ETF-Sparplan', '2021-06-01', 300.00, 'monatlich', 'aktiv')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 7. Abonnements (8 Abos)
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.user_subscriptions (id, tenant_id, user_id, merchant, category, amount, frequency, status)
VALUES
  ('e0000000-0000-4000-a000-000000000401', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'Netflix', 'streaming_video', 17.99, 'monatlich', 'aktiv'),
  ('e0000000-0000-4000-a000-000000000402', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'Spotify Family', 'streaming_music', 16.99, 'monatlich', 'aktiv'),
  ('e0000000-0000-4000-a000-000000000403', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'Amazon Prime', 'ecommerce_membership', 89.90, 'jaehrlich', 'aktiv'),
  ('e0000000-0000-4000-a000-000000000404', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'Microsoft 365 Family', 'software_saas', 99.00, 'jaehrlich', 'aktiv'),
  ('e0000000-0000-4000-a000-000000000405', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'ZEIT Digital', 'news_media', 19.99, 'monatlich', 'aktiv'),
  ('e0000000-0000-4000-a000-000000000406', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'Telekom Magenta L', 'telecom_mobile', 49.95, 'monatlich', 'aktiv'),
  ('e0000000-0000-4000-a000-000000000407', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'Vodafone Kabel 1000', 'internet', 39.99, 'monatlich', 'aktiv'),
  ('e0000000-0000-4000-a000-000000000408', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222',
   'FitX Familie', 'fitness', 29.98, 'monatlich', 'aktiv')
ON CONFLICT (id) DO NOTHING;
