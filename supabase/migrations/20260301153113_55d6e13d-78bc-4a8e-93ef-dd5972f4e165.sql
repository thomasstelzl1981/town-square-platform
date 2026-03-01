-- Add conversation_turns JSONB column to store the live dialog context during Gather-loop calls
ALTER TABLE public.commpro_phone_call_sessions
ADD COLUMN conversation_turns jsonb DEFAULT '[]'::jsonb;

-- Add admin_notified_at to track when the Zone 1 admin was notified
ALTER TABLE public.commpro_phone_call_sessions
ADD COLUMN admin_notified_at timestamp with time zone;