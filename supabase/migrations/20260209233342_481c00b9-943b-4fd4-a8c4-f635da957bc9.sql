-- Fix mailbox address to use User-ID instead of org slug
UPDATE public.inbound_mailboxes
SET address_local_part = 'd028bc99'
WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001';

-- Drop the old auto-provisioning trigger (we'll use lazy provisioning instead)
DROP TRIGGER IF EXISTS auto_create_mailbox ON public.organizations;
DROP FUNCTION IF EXISTS public.auto_create_inbound_mailbox();