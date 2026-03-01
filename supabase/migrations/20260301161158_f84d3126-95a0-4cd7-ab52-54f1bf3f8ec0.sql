
-- Add elevenlabs_conversation_id to call sessions for webhook matching
ALTER TABLE commpro_phone_call_sessions 
  ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id text;

-- Index for fast webhook lookup
CREATE INDEX IF NOT EXISTS idx_call_sessions_elevenlabs_conv_id 
  ON commpro_phone_call_sessions (elevenlabs_conversation_id) 
  WHERE elevenlabs_conversation_id IS NOT NULL;
