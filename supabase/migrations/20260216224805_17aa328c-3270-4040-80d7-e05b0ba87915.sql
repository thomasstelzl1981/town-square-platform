
-- ═══════════════════════════════════════════════════════════
-- Demo-Daten: Adressen + Lisa Renteninformation + Einkommen
-- ═══════════════════════════════════════════════════════════

-- 1. Adresse für Max Mustermann (falls noch nicht gesetzt)
UPDATE public.household_persons SET
  street = 'Am Stadtpark',
  house_number = '12a',
  zip = '80331',
  city = 'München'
WHERE id = 'b1f6d204-05ac-462f-9dae-8fba64ab9f88'
  AND street IS NULL;

-- 2. Adresse + Einkommen für Lisa Mustermann
UPDATE public.household_persons SET
  street = 'Am Stadtpark',
  house_number = '12a',
  zip = '80331',
  city = 'München',
  net_income_monthly = 2800,
  gross_income_monthly = 4200
WHERE id = 'e0000000-0000-4000-a000-000000000101';

-- 3. Adresse für Felix
UPDATE public.household_persons SET
  street = 'Am Stadtpark',
  house_number = '12a',
  zip = '80331',
  city = 'München'
WHERE id = 'e0000000-0000-4000-a000-000000000102';

-- 4. Adresse für Emma
UPDATE public.household_persons SET
  street = 'Am Stadtpark',
  house_number = '12a',
  zip = '80331',
  city = 'München'
WHERE id = 'e0000000-0000-4000-a000-000000000103';

-- 5. Renteninformation für Lisa (DRV)
INSERT INTO public.pension_records (
  id, person_id, tenant_id, pension_type, info_date,
  current_pension, projected_pension, disability_pension
) VALUES (
  'e0000000-0000-4000-a000-000000000701',
  'e0000000-0000-4000-a000-000000000101',
  'a0000000-0000-4000-a000-000000000001',
  'drv',
  '2025-06-15',
  680,
  1420,
  890
) ON CONFLICT (id) DO UPDATE SET
  projected_pension = EXCLUDED.projected_pension,
  disability_pension = EXCLUDED.disability_pension,
  current_pension = EXCLUDED.current_pension,
  info_date = EXCLUDED.info_date;
