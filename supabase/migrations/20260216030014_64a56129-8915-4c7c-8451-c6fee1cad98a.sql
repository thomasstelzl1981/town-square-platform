
-- Demo financing data for V+V tax module
INSERT INTO public.property_financing (id, tenant_id, property_id, loan_number, bank_name, original_amount, current_balance, interest_rate, monthly_rate, annual_interest, is_active)
VALUES
  ('f0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'DL-BER-2019-001', 'Berliner Sparkasse', 224000, 198500, 2.80, 525, 5558, true),
  ('f0000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002', 'DL-MUC-2020-001', 'HypoVereinsbank', 385000, 352000, 3.10, 890, 10912, true),
  ('f0000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', 'DL-HH-2021-001', 'Hamburger Sparkasse', 295000, 278000, 2.95, 720, 8201, true)
ON CONFLICT (id) DO NOTHING;
