-- Helper function for incrementing sequence statistics
CREATE OR REPLACE FUNCTION increment_sequence_stats(
  p_sequence_id UUID,
  p_field TEXT
) RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE admin_email_sequences
  SET stats = COALESCE(stats, '{}'::jsonb) || 
    jsonb_build_object(p_field, COALESCE((stats->>p_field)::int, 0) + 1)
  WHERE id = p_sequence_id;
END;
$$;

-- Add stats column if not exists (safe migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_email_sequences' 
    AND column_name = 'stats'
  ) THEN
    ALTER TABLE admin_email_sequences ADD COLUMN stats JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add stats column to sequence steps for tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_email_sequence_steps' 
    AND column_name = 'stats'
  ) THEN
    ALTER TABLE admin_email_sequence_steps ADD COLUMN stats JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add enrollment_id to outbound emails if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_outbound_emails' 
    AND column_name = 'enrollment_id'
  ) THEN
    ALTER TABLE admin_outbound_emails 
      ADD COLUMN enrollment_id UUID REFERENCES admin_email_enrollments(id);
  END IF;
END $$;