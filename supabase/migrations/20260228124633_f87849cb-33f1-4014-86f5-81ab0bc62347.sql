
-- Add Twilio-specific fields to phone assistants
ALTER TABLE public.commpro_phone_assistants
  ADD COLUMN IF NOT EXISTS twilio_number_sid TEXT,
  ADD COLUMN IF NOT EXISTS twilio_phone_number_e164 TEXT,
  ADD COLUMN IF NOT EXISTS armstrong_inbound_email TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'standard'
    CHECK (tier IN ('standard', 'premium'));

-- Add Twilio call SID and recording URL to call sessions
ALTER TABLE public.commpro_phone_call_sessions
  ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS armstrong_notified_at TIMESTAMPTZ;

-- Index for looking up assistant by Twilio number (inbound webhook)
CREATE INDEX IF NOT EXISTS idx_phone_assistants_twilio_number
  ON public.commpro_phone_assistants (twilio_phone_number_e164)
  WHERE twilio_phone_number_e164 IS NOT NULL;

-- Index for looking up calls by Twilio SID
CREATE INDEX IF NOT EXISTS idx_phone_calls_twilio_sid
  ON public.commpro_phone_call_sessions (twilio_call_sid)
  WHERE twilio_call_sid IS NOT NULL;
