
INSERT INTO public.household_persons (
  id, tenant_id, user_id, role, salutation,
  first_name, last_name, birth_date, email, phone,
  employment_status, employer_name, marital_status,
  sort_order, is_primary,
  street, zip, city
) VALUES (
  'b1f6d204-05ac-462f-9dae-8fba64ab9f88',
  'a0000000-0000-4000-a000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'hauptperson', 'Herr', 'Max', 'Mustermann', '1982-03-15',
  'max@mustermann-demo.de', '+49 170 1234567',
  'selbstaendig', 'IT-Beratung Mustermann', 'verheiratet',
  0, true,
  'Leopoldstraße 42', '80802', 'München'
)
ON CONFLICT (id) DO NOTHING;
