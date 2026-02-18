
ALTER TABLE public.msv_bank_accounts ADD COLUMN owner_type TEXT;
ALTER TABLE public.msv_bank_accounts ADD COLUMN owner_id UUID;

COMMENT ON COLUMN public.msv_bank_accounts.owner_type IS 'Polymorphic owner type: person, property_context, or pv_plant';
COMMENT ON COLUMN public.msv_bank_accounts.owner_id IS 'UUID of the owning entity (household_persons, property_contexts, or pv_plants)';
