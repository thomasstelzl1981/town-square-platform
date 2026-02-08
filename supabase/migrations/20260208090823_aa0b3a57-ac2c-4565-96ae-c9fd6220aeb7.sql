-- Helper function for incrementing thread message count
CREATE OR REPLACE FUNCTION increment_thread_message_count(p_thread_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE admin_email_threads
  SET message_count = COALESCE(message_count, 0) + 1,
      last_activity_at = now()
  WHERE id = p_thread_id;
END;
$$;