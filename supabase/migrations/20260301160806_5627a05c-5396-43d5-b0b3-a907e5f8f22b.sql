
-- Add ElevenLabs Agent integration columns to commpro_phone_assistants
ALTER TABLE commpro_phone_assistants 
  ADD COLUMN elevenlabs_agent_id text,
  ADD COLUMN elevenlabs_phone_number_id text;

-- Add comment for documentation
COMMENT ON COLUMN commpro_phone_assistants.elevenlabs_agent_id IS 'ElevenLabs Conversational AI Agent ID, synced via sot-phone-agent-sync';
COMMENT ON COLUMN commpro_phone_assistants.elevenlabs_phone_number_id IS 'ElevenLabs Phone Number ID after Twilio number import';
