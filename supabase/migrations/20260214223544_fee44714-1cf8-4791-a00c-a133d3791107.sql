-- Insert 5 Sortierkacheln für Demo-Akten (3 Properties + 2 Fahrzeuge)
-- Demo-Tenant: a0000000-0000-4000-a000-000000000001

-- Property: Schadowstr., Berlin (BER-01)
INSERT INTO public.inbox_sort_containers (id, tenant_id, name, is_enabled, property_id, entity_type, entity_id)
VALUES ('c0000000-0000-4000-a000-000000000010', 'a0000000-0000-4000-a000-000000000001', 'Schadowstr., Berlin', true, 'd0000000-0000-4000-a000-000000000001', 'property', 'd0000000-0000-4000-a000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inbox_sort_rules (tenant_id, container_id, field, operator, keywords_json)
VALUES ('a0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000010', 'subject', 'contains', '["Schadowstr", "Berlin", "BER-01"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Property: Leopoldstr., München (MUC-01)
INSERT INTO public.inbox_sort_containers (id, tenant_id, name, is_enabled, property_id, entity_type, entity_id)
VALUES ('c0000000-0000-4000-a000-000000000011', 'a0000000-0000-4000-a000-000000000001', 'Leopoldstr., München', true, 'd0000000-0000-4000-a000-000000000002', 'property', 'd0000000-0000-4000-a000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inbox_sort_rules (tenant_id, container_id, field, operator, keywords_json)
VALUES ('a0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000011', 'subject', 'contains', '["Leopoldstr", "München", "MUC-01"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Property: Osterstr., Hamburg (HH-01)
INSERT INTO public.inbox_sort_containers (id, tenant_id, name, is_enabled, property_id, entity_type, entity_id)
VALUES ('c0000000-0000-4000-a000-000000000012', 'a0000000-0000-4000-a000-000000000001', 'Osterstr., Hamburg', true, 'd0000000-0000-4000-a000-000000000003', 'property', 'd0000000-0000-4000-a000-000000000003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inbox_sort_rules (tenant_id, container_id, field, operator, keywords_json)
VALUES ('a0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000012', 'subject', 'contains', '["Osterstr", "Hamburg", "HH-01"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Fahrzeug: Porsche 911 (B-P911)
INSERT INTO public.inbox_sort_containers (id, tenant_id, name, is_enabled, entity_type, entity_id)
VALUES ('c0000000-0000-4000-a000-000000000013', 'a0000000-0000-4000-a000-000000000001', 'Porsche 911 (B-P911)', true, 'vehicle', '00000000-0000-4000-a000-000000000301')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inbox_sort_rules (tenant_id, container_id, field, operator, keywords_json)
VALUES ('a0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000013', 'subject', 'contains', '["Porsche", "911", "B-P911"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Fahrzeug: BMW M5 (M-M5005)
INSERT INTO public.inbox_sort_containers (id, tenant_id, name, is_enabled, entity_type, entity_id)
VALUES ('c0000000-0000-4000-a000-000000000014', 'a0000000-0000-4000-a000-000000000001', 'BMW M5 (M-M5005)', true, 'vehicle', '00000000-0000-4000-a000-000000000302')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inbox_sort_rules (tenant_id, container_id, field, operator, keywords_json)
VALUES ('a0000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000014', 'subject', 'contains', '["BMW", "M5", "M-M5005"]'::jsonb)
ON CONFLICT DO NOTHING;