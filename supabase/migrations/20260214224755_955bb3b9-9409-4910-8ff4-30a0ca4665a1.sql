
-- Insert PV plant
INSERT INTO public.pv_plants (
  id, tenant_id, name, status, street, house_number, postal_code, city,
  location_notes, kwp, commissioning_date,
  wr_manufacturer, wr_model, has_battery, battery_kwh,
  mastr_account_present, mastr_plant_id, mastr_unit_id, mastr_status,
  grid_operator, energy_supplier, customer_reference,
  feed_in_meter_no, feed_in_meter_operator, feed_in_start_reading,
  consumption_meter_no, consumption_meter_operator, consumption_start_reading,
  provider, data_quality, public_id
) VALUES (
  '00000000-0000-4000-a000-000000000901',
  'a0000000-0000-4000-a000-000000000001',
  'EFH SMA 9,8 kWp', 'active',
  'Schadowstr.', '12', '10117', 'Berlin',
  'Süd-Dach, 30° Neigung, keine Verschattung',
  9.8, '2024-06-15',
  'SMA', 'Sunny Tripower 10.0', true, 10.0,
  true, 'SEE912345678', 'SEE987654321', 'confirmed',
  'Stromnetz Berlin GmbH', 'Vattenfall', 'VTF-2024-88321',
  'EHZ-1ESM-0044721', 'Stromnetz Berlin', 0,
  'EHZ-1ESM-0078834', 'Stromnetz Berlin', 14520,
  'demo', 'complete', 'SOT-PV-SMA98'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- DMS root folder
INSERT INTO public.storage_nodes (id, name, node_type, parent_id, tenant_id, module_code, entity_type, entity_id, pv_plant_id)
VALUES ('00000000-0000-4000-a000-000000000910', 'EFH SMA 9,8 kWp', 'folder',
        'bae9c64f-c0c6-4489-911a-a357872aa0f6',
        'a0000000-0000-4000-a000-000000000001', 'MOD-19', 'pv_plant',
        '00000000-0000-4000-a000-000000000901', '00000000-0000-4000-a000-000000000901')
ON CONFLICT (tenant_id, parent_id, name) WHERE parent_id IS NOT NULL
DO UPDATE SET entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id, pv_plant_id = EXCLUDED.pv_plant_id;

-- Link dms_root_node_id
UPDATE public.pv_plants SET dms_root_node_id = (
  SELECT id FROM storage_nodes WHERE name = 'EFH SMA 9,8 kWp' AND parent_id = 'bae9c64f-c0c6-4489-911a-a357872aa0f6' AND tenant_id = 'a0000000-0000-4000-a000-000000000001' LIMIT 1
)
WHERE id = '00000000-0000-4000-a000-000000000901';

-- Repair entity links
UPDATE public.storage_nodes SET entity_type = 'property', entity_id = 'd0000000-0000-4000-a000-000000000001'
WHERE id = '000b5182-fde3-4031-853d-5c40ee2ce560';
UPDATE public.storage_nodes SET entity_type = 'property', entity_id = 'd0000000-0000-4000-a000-000000000002'
WHERE id = '9bd893e6-7d49-4ae6-8ca3-9dd44a1b0077';
UPDATE public.storage_nodes SET entity_type = 'property', entity_id = 'd0000000-0000-4000-a000-000000000003'
WHERE id = '95166693-ba1e-4e51-af2e-997e363c5a63';
UPDATE public.storage_nodes SET entity_type = 'vehicle', entity_id = '00000000-0000-4000-a000-000000000301'
WHERE id = '00000000-0000-4000-a000-000000000360';
UPDATE public.storage_nodes SET entity_type = 'vehicle', entity_id = '00000000-0000-4000-a000-000000000302'
WHERE id = '00000000-0000-4000-a000-000000000370';

-- Sort container
INSERT INTO public.inbox_sort_containers (id, tenant_id, name, entity_type, entity_id, is_enabled)
VALUES ('c0000000-0000-4000-a000-000000000015',
        'a0000000-0000-4000-a000-000000000001',
        'EFH SMA 9,8 kWp', 'pv_plant', '00000000-0000-4000-a000-000000000901', true)
ON CONFLICT (id) DO UPDATE SET entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id;

-- Sort rule
INSERT INTO public.inbox_sort_rules (id, container_id, tenant_id, field, operator, keywords_json)
VALUES ('a0000000-0000-4000-a000-000000000915',
        'c0000000-0000-4000-a000-000000000015',
        'a0000000-0000-4000-a000-000000000001',
        'subject', 'contains', '["SMA","Photovoltaik","SOT-PV-SMA98","9,8 kWp","EFH SMA"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
