
-- ============================================================
-- GP-PET Demo Data Seed
-- Populates pet_z1_customers, pet_z1_pets, pet_customers, pets, pet_bookings
-- Uses ON CONFLICT DO NOTHING for idempotency
-- ============================================================

-- Constants
-- DEMO_TENANT_ID  = 'a0000000-0000-4000-a000-000000000001'
-- DEMO_PROVIDER   = 'd0000000-0000-4000-a000-000000000050'

-- ─── Z1 CUSTOMERS (Lead-Pool) ───────────────────────────────

INSERT INTO pet_z1_customers (id, tenant_id, first_name, last_name, email, phone, address, city, postal_code, notes, source, status, assigned_provider_id, assigned_at, created_at)
VALUES
  ('d0000000-0000-4000-a000-000000001040', 'a0000000-0000-4000-a000-000000000001',
   'Thomas', 'Richter', 'thomas.richter@demo.de', '+49 172 5556677',
   'Hauptstraße 88', 'Berlin', '10827',
   'Über Website-Anfrage gekommen, zwei Hunde', 'website', 'assigned',
   'd0000000-0000-4000-a000-000000000050', '2025-11-05T10:00:00Z', '2025-11-02T14:30:00Z'),

  ('d0000000-0000-4000-a000-000000001041', 'a0000000-0000-4000-a000-000000000001',
   'Claudia', 'Stein', 'claudia.stein@demo.de', '+49 176 8889900',
   'Schönhauser Allee 45', 'Berlin', '10435',
   'Bucht für Freundin Sabine Berger (Rocky). Keine eigenen Hunde.', 'website', 'assigned',
   'd0000000-0000-4000-a000-000000000050', '2026-01-12T09:00:00Z', '2026-01-10T09:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Z1 PETS (Lead-Tierakten) ───────────────────────────────

INSERT INTO pet_z1_pets (id, z1_customer_id, tenant_id, name, species, breed, gender, birth_date, weight_kg, chip_number, neutered, notes, created_at)
VALUES
  ('d0000000-0000-4000-a000-000000001051', 'd0000000-0000-4000-a000-000000001040', 'a0000000-0000-4000-a000-000000000001',
   'Mia', 'dog', 'Golden Retriever', 'female', '2024-01-15', 28,
   '276098102345679', false, 'Junghund, noch etwas schüchtern bei neuen Hunden', now()),

  ('d0000000-0000-4000-a000-000000001052', 'd0000000-0000-4000-a000-000000001040', 'a0000000-0000-4000-a000-000000000001',
   'Oskar', 'dog', 'Dackel', 'male', '2019-08-22', 9,
   '276098102345680', false, 'Senior, Arthrose in Hinterläufen, braucht Rampe', now())
ON CONFLICT (id) DO NOTHING;

-- ─── Z2 CUSTOMERS (Provider-Kunden) ────────────────────────

INSERT INTO pet_customers (id, tenant_id, provider_id, z1_customer_id, first_name, last_name, email, phone, address, city, postal_code, notes, source, origin_zone, status, created_at)
VALUES
  ('d0000000-0000-4000-a000-000000001001', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000000050', NULL,
   'Sabine', 'Berger', 'sabine.berger@demo.de', '+49 171 2223344',
   'Lindenstraße 12', 'Berlin', '10969',
   'Stammkundin, Rocky hat Futtermittelallergie (kein Huhn)',
   'manual', 'Z2', 'active', '2025-09-15T10:00:00Z'),

  ('d0000000-0000-4000-a000-000000001002', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000000050', 'd0000000-0000-4000-a000-000000001040',
   'Thomas', 'Richter', 'thomas.richter@demo.de', '+49 172 5556677',
   'Hauptstraße 88', 'Berlin', '10827',
   'Über Website-Anfrage gekommen, zwei Hunde',
   'lead', 'Z3', 'active', '2025-11-02T14:30:00Z'),

  ('d0000000-0000-4000-a000-000000001003', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000000050', 'd0000000-0000-4000-a000-000000001041',
   'Claudia', 'Stein', 'claudia.stein@demo.de', '+49 176 8889900',
   'Schönhauser Allee 45', 'Berlin', '10435',
   'Bucht für Freundin Sabine Berger (Rocky). Keine eigenen Hunde.',
   'lead', 'Z3', 'active', '2026-01-10T09:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── Z2 PETS (Provider-Tierakten mit customer_id) ──────────

INSERT INTO pets (id, tenant_id, customer_id, name, species, breed, gender, birth_date, weight_kg, chip_number, neutered, notes, created_at)
VALUES
  ('d0000000-0000-4000-a000-000000001010', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001001',
   'Rocky', 'dog', 'Labrador Retriever', 'male', '2022-05-10', 32,
   '276098102345678', false,
   'Futtermittelallergie (kein Huhn), sehr freundlich, verträgt sich gut mit anderen Hunden', '2025-09-15T10:00:00Z'),

  ('d0000000-0000-4000-a000-000000001011', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001002',
   'Mia', 'dog', 'Golden Retriever', 'female', '2024-01-15', 28,
   '276098102345679', false,
   'Junghund, noch etwas schüchtern bei neuen Hunden', '2025-11-02T14:30:00Z'),

  ('d0000000-0000-4000-a000-000000001012', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001002',
   'Oskar', 'dog', 'Dackel', 'male', '2019-08-22', 9,
   '276098102345680', false,
   'Senior, Arthrose in Hinterläufen, braucht Rampe', '2025-11-02T14:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ─── BOOKINGS ──────────────────────────────────────────────

INSERT INTO pet_bookings (id, tenant_id, pet_id, service_id, provider_id, status, scheduled_date, scheduled_time_start, duration_minutes, price_cents, client_notes, staff_id, booking_area, created_at)
VALUES
  -- Pension 1: Rocky, Urlaubsbetreuung, 2 Wochen
  ('d0000000-0000-4000-a000-000000001020', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001010', 'd0000000-0000-4000-a000-000000000063',
   'd0000000-0000-4000-a000-000000000050', 'confirmed',
   '2026-03-03', NULL, NULL, 56000,
   'Spezialfutter mitgebracht (allergiefrei)', NULL, 'pension', '2026-02-01T10:00:00Z'),

  -- Pension 2: Mia, Urlaubsbetreuung, 2 Wochen
  ('d0000000-0000-4000-a000-000000001021', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001011', 'd0000000-0000-4000-a000-000000000063',
   'd0000000-0000-4000-a000-000000000050', 'confirmed',
   '2026-03-10', NULL, NULL, 56000,
   'Eingewöhnung am Vortag gewünscht', NULL, 'pension', '2026-02-05T10:00:00Z'),

  -- Service 3: Rocky, Hundesalon, completed
  ('d0000000-0000-4000-a000-000000001022', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001010', 'd0000000-0000-4000-a000-000000000060',
   'd0000000-0000-4000-a000-000000000050', 'completed',
   '2026-02-25', '09:00:00', 90, 6500,
   NULL, '935e7dd4-3d93-4170-9022-0b0148c90811', 'service', '2026-02-10T10:00:00Z'),

  -- Service 4: Oskar, Gassi-Service
  ('d0000000-0000-4000-a000-000000001023', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001012', 'd0000000-0000-4000-a000-000000000061',
   'd0000000-0000-4000-a000-000000000050', 'confirmed',
   '2026-02-27', '10:00:00', 60, 2500,
   'Langsames Tempo wegen Arthrose', 'c198ffb0-1b16-4cfa-b582-a86fa0fbf097', 'service', '2026-02-10T10:00:00Z'),

  -- Service 5: Mia, Hundesalon
  ('d0000000-0000-4000-a000-000000001024', 'a0000000-0000-4000-a000-000000000001',
   'd0000000-0000-4000-a000-000000001011', 'd0000000-0000-4000-a000-000000000060',
   'd0000000-0000-4000-a000-000000000050', 'confirmed',
   '2026-03-01', '14:00:00', 90, 6500,
   NULL, '847b65f8-6f2e-432c-8d3e-cf54a97e4707', 'service', '2026-02-10T10:00:00Z')
ON CONFLICT (id) DO NOTHING;
