-- Seed demo private loans for Mustermann tenant
INSERT INTO public.private_loans (id, tenant_id, user_id, loan_purpose, bank_name, loan_amount, remaining_balance, interest_rate, monthly_rate, start_date, end_date, status, notes)
VALUES
  ('e0000000-0000-4000-a000-000000000601', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222', 'autokredit', 'BMW Bank', 35000, 22400, 3.49, 520, '2022-06-01', '2027-05-31', 'aktiv', 'Autokredit für BMW M5 Competition'),
  ('e0000000-0000-4000-a000-000000000602', 'a0000000-0000-4000-a000-000000000001', 'd028bc99-6e29-4fa4-b038-d03015faf222', 'moebel', 'Santander', 12000, 4800, 5.99, 250, '2023-01-15', '2026-12-31', 'aktiv', 'Küchenfinanzierung')
ON CONFLICT (id) DO NOTHING;