
-- Lennox & Friends Provider + Services Seed
-- Idempotent: uses ON CONFLICT DO NOTHING

INSERT INTO public.pet_providers (
  id, tenant_id, user_id, company_name, provider_type, status, is_published,
  bio, phone, email, address, facility_type, max_daily_capacity, rating_avg,
  service_area_postal_codes
) VALUES (
  'd0000000-0000-4000-a000-000000000050',
  'eac1778a-23bc-4d03-b3f9-b26be27c9505',
  '99d271be-4ebb-4495-970d-ad91e943e4f0',
  'Lennox & Friends Dog Resorts',
  'boarding',
  'active',
  true,
  'Naturverbundene Hundebetreuung mit Herz — Pension, Tagesstätte und Hundesalon in Ottobrunn bei München.',
  '+49 176 64 12 68 69',
  'info@lennoxandfriends.app',
  'Rathausstr. 12, 85521 Ottobrunn',
  'daycare',
  12,
  4.9,
  ARRAY['85521','85540','85622','81671','81673']
) ON CONFLICT (id) DO NOTHING;

-- 4 Services
INSERT INTO public.pet_services (id, provider_id, tenant_id, title, description, category, duration_minutes, price_cents, price_type, is_active)
VALUES
  ('d0000000-0000-4000-a000-000000000060', 'd0000000-0000-4000-a000-000000000050', 'eac1778a-23bc-4d03-b3f9-b26be27c9505', 'Hundesalon Komplett', 'Waschen, Schneiden, Föhnen, Krallen', 'grooming', 90, 6500, 'fixed', true),
  ('d0000000-0000-4000-a000-000000000061', 'd0000000-0000-4000-a000-000000000050', 'eac1778a-23bc-4d03-b3f9-b26be27c9505', 'Gassi-Service (1h)', 'Individueller Spaziergang mit Abholung', 'walking', 60, 2500, 'fixed', true),
  ('d0000000-0000-4000-a000-000000000062', 'd0000000-0000-4000-a000-000000000050', 'eac1778a-23bc-4d03-b3f9-b26be27c9505', 'Tagesbetreuung', 'Ganztägige Betreuung in der Hundetagesstätte', 'daycare', 480, 4500, 'fixed', true),
  ('d0000000-0000-4000-a000-000000000063', 'd0000000-0000-4000-a000-000000000050', 'eac1778a-23bc-4d03-b3f9-b26be27c9505', 'Urlaubsbetreuung', 'Übernachtungspension mit Rundumversorgung', 'boarding', 1440, 5600, 'daily', true)
ON CONFLICT (id) DO NOTHING;
