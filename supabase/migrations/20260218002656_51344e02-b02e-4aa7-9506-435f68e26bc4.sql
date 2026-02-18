
-- Add password_hash column to pet_z1_customers
ALTER TABLE public.pet_z1_customers ADD COLUMN IF NOT EXISTS password_hash text;

-- Create pet_z3_sessions table
CREATE TABLE IF NOT EXISTS public.pet_z3_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.pet_z1_customers(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_pet_z3_sessions_token ON public.pet_z3_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_pet_z3_sessions_customer ON public.pet_z3_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_pet_z3_sessions_expires ON public.pet_z3_sessions(expires_at);

-- RLS: Only service_role can access (edge function uses service role)
ALTER TABLE public.pet_z3_sessions ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role can access (which is what we want)
-- The edge function uses createClient with SUPABASE_SERVICE_ROLE_KEY
