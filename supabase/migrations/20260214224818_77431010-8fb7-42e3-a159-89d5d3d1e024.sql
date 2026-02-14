
-- Sub-folders for PV plant DMS root
INSERT INTO public.storage_nodes (name, node_type, parent_id, tenant_id, module_code, pv_plant_id) VALUES
('01_Stammdaten',                    'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901'),
('02_MaStR_BNetzA',                  'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901'),
('03_Netzbetreiber',                 'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901'),
('04_Zaehler',                       'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901'),
('05_Wechselrichter_und_Speicher',   'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901'),
('06_Versicherung',                  'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901'),
('07_Steuer_USt_BWA',               'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901'),
('08_Wartung_Service',               'folder', '680b808e-7aaa-47f3-a92d-2ddf44e26bca', 'a0000000-0000-4000-a000-000000000001', 'MOD-19', '00000000-0000-4000-a000-000000000901')
ON CONFLICT (tenant_id, parent_id, name) WHERE parent_id IS NOT NULL DO NOTHING;
