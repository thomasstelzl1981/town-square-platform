
-- Step 1: Update finance_request to submitted
UPDATE public.finance_requests 
SET status = 'submitted', 
    purpose = 'umschuldung', 
    updated_at = now() 
WHERE id = '00000000-0000-4000-a000-000000000004';

-- Step 2: Update applicant_profile for Prolongation (use 'umschuldung')
UPDATE public.applicant_profiles
SET purpose = 'umschuldung',
    purchase_price = NULL,
    equity_amount = NULL,
    loan_amount_requested = 176000,
    updated_at = now()
WHERE id = '00000000-0000-4000-a000-000000000005';

-- Step 3: Create finance_mandate
INSERT INTO public.finance_mandates (
  id, finance_request_id, public_id, status, tenant_id, 
  assigned_manager_id, accepted_at, created_at, updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000011',
  '00000000-0000-4000-a000-000000000004',
  'SOT-FM-DEMO001',
  'accepted',
  'a0000000-0000-4000-a000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Create future_room_case
INSERT INTO public.future_room_cases (
  id, finance_mandate_id, status, manager_tenant_id,
  created_at, updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000012',
  '00000000-0000-4000-a000-000000000011',
  'active',
  'a0000000-0000-4000-a000-000000000001',
  now(), now()
) ON CONFLICT (id) DO NOTHING;
