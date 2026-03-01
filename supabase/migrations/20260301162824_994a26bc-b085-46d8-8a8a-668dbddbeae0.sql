-- Add updated_at column to commpro_phone_call_sessions
ALTER TABLE public.commpro_phone_call_sessions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add trigger for automatic timestamp updates (reuse existing function if available)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS update_commpro_phone_call_sessions_updated_at ON public.commpro_phone_call_sessions;
CREATE TRIGGER update_commpro_phone_call_sessions_updated_at
BEFORE UPDATE ON public.commpro_phone_call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();