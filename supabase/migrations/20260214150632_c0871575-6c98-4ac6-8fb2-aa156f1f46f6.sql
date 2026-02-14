
-- Direct Postgres function for ledger retention (used by pg_cron)
CREATE OR REPLACE FUNCTION public.purge_expired_ledger_entries(p_retention_days INT DEFAULT 180)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_deleted_count INT;
  v_oldest_remaining TIMESTAMPTZ;
BEGIN
  v_cutoff := now() - (p_retention_days || ' days')::interval;
  
  DELETE FROM public.data_event_ledger
  WHERE created_at < v_cutoff;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  SELECT MIN(created_at) INTO v_oldest_remaining FROM public.data_event_ledger;
  
  -- Self-log the purge
  INSERT INTO public.data_event_ledger (zone, actor_role, event_type, direction, source, payload)
  VALUES ('Z1', 'system', 'data.purge.executed', 'delete', 'cron', jsonb_build_object(
    'deleted_count', v_deleted_count,
    'retention_days', p_retention_days,
    'cutoff_date', v_cutoff,
    'oldest_remaining', v_oldest_remaining
  ));
  
  RETURN jsonb_build_object(
    'deleted_count', v_deleted_count,
    'retention_days', p_retention_days,
    'oldest_remaining', v_oldest_remaining
  );
END;
$$;
