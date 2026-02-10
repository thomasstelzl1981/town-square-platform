
CREATE TABLE public.miety_eufy_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  email TEXT NOT NULL,
  token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.miety_eufy_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own eufy account"
ON public.miety_eufy_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own eufy account"
ON public.miety_eufy_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own eufy account"
ON public.miety_eufy_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own eufy account"
ON public.miety_eufy_accounts FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_miety_eufy_accounts_updated_at
BEFORE UPDATE ON public.miety_eufy_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
