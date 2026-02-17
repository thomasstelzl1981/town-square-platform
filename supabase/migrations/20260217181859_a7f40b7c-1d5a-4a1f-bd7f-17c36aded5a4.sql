-- Demo-Seed: Miety Home + 4 Versorgungsverträge für Familie Mustermann
-- Idempotent via ON CONFLICT DO NOTHING

INSERT INTO public.miety_homes (
  id, tenant_id, user_id, name, address, address_house_no, zip, city,
  ownership_type, property_type, area_sqm, rooms_count
) VALUES (
  'e0000000-0000-4000-a000-000000000801',
  'a0000000-0000-4000-a000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'Mein Zuhause',
  'Friedrichstraße', '42', '10117', 'Berlin',
  'miete', 'wohnung', 120, 4
) ON CONFLICT (id) DO NOTHING;

-- Strom
INSERT INTO public.miety_contracts (id, home_id, tenant_id, category, provider_name, contract_number, monthly_cost, start_date)
VALUES (
  'e0000000-0000-4000-a000-000000000811',
  'e0000000-0000-4000-a000-000000000801',
  'a0000000-0000-4000-a000-000000000001',
  'strom', 'E.ON Grundversorgung', 'EON-2024-4711', 85.00, '2022-01-01'
) ON CONFLICT (id) DO NOTHING;

-- Gas
INSERT INTO public.miety_contracts (id, home_id, tenant_id, category, provider_name, contract_number, monthly_cost, start_date)
VALUES (
  'e0000000-0000-4000-a000-000000000812',
  'e0000000-0000-4000-a000-000000000801',
  'a0000000-0000-4000-a000-000000000001',
  'gas', 'Vattenfall', 'VF-2024-0815', 65.00, '2022-01-01'
) ON CONFLICT (id) DO NOTHING;

-- Wasser
INSERT INTO public.miety_contracts (id, home_id, tenant_id, category, provider_name, contract_number, monthly_cost, start_date)
VALUES (
  'e0000000-0000-4000-a000-000000000813',
  'e0000000-0000-4000-a000-000000000801',
  'a0000000-0000-4000-a000-000000000001',
  'wasser', 'Berliner Wasserbetriebe', 'BWB-2024-3344', 42.00, '2020-06-01'
) ON CONFLICT (id) DO NOTHING;

-- Internet
INSERT INTO public.miety_contracts (id, home_id, tenant_id, category, provider_name, contract_number, monthly_cost, start_date)
VALUES (
  'e0000000-0000-4000-a000-000000000814',
  'e0000000-0000-4000-a000-000000000801',
  'a0000000-0000-4000-a000-000000000001',
  'internet', 'Telekom MagentaZuhause L', 'TK-2023-5566', 44.95, '2023-03-01'
) ON CONFLICT (id) DO NOTHING;