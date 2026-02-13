
-- Remove Stripe columns from hosting_contracts and add credits_charged
ALTER TABLE public.hosting_contracts DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE public.hosting_contracts DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.hosting_contracts ADD COLUMN IF NOT EXISTS credits_charged integer NOT NULL DEFAULT 0;

-- Update contract creation to set status to 'active' directly (no Stripe needed)
-- Contracts become active when terms are accepted
