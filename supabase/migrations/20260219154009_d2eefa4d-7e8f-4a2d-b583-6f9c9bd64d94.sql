
-- Fix the audit trigger function to handle tables without active_tenant_id
CREATE OR REPLACE FUNCTION public.fn_audit_pii_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table_name TEXT;
  v_event_prefix TEXT;
  v_changed_fields TEXT[] := '{}';
  v_event_type TEXT;
  v_direction TEXT := 'mutate';
  v_record_id UUID;
  v_tenant_id UUID;
  col_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  v_table_name := TG_TABLE_NAME;
  CASE v_table_name
    WHEN 'applicant_profiles' THEN v_event_prefix := 'applicant_profile';
    WHEN 'contacts' THEN v_event_prefix := 'contact';
    WHEN 'profiles' THEN v_event_prefix := 'profile';
    ELSE v_event_prefix := v_table_name;
  END CASE;

  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    -- Use dynamic SQL to safely get tenant_id based on table
    IF v_table_name = 'profiles' THEN
      EXECUTE 'SELECT ($1).active_tenant_id' INTO v_tenant_id USING OLD;
    ELSE
      v_tenant_id := OLD.tenant_id;
    END IF;
    
    IF v_tenant_id IS NULL THEN
      RETURN OLD;
    END IF;
    
    v_event_type := v_event_prefix || '.deleted';
    v_direction := 'delete';
    INSERT INTO public.data_event_ledger (
      tenant_id, zone, actor_user_id, event_type, direction, source,
      entity_type, entity_id, payload
    ) VALUES (
      v_tenant_id, 'Z2', auth.uid(), v_event_type, v_direction, 'db_trigger',
      v_table_name, v_record_id, jsonb_build_object('record_id', v_record_id, 'table_name', v_table_name)
    );
    RETURN OLD;
  END IF;

  v_record_id := NEW.id;
  IF v_table_name = 'profiles' THEN
    EXECUTE 'SELECT ($1).active_tenant_id' INTO v_tenant_id USING NEW;
  ELSE
    v_tenant_id := NEW.tenant_id;
  END IF;

  -- Soft delete detection
  IF v_table_name IN ('applicant_profiles', 'contacts') THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_event_type := v_event_prefix || '.delete_requested';
      v_direction := 'delete';
      
      IF v_tenant_id IS NULL THEN
        RETURN NEW;
      END IF;
      
      INSERT INTO public.data_event_ledger (
        tenant_id, zone, actor_user_id, event_type, direction, source,
        entity_type, entity_id, payload
      ) VALUES (
        v_tenant_id, 'Z2', auth.uid(), v_event_type, v_direction, 'db_trigger',
        v_table_name, v_record_id, jsonb_build_object('record_id', v_record_id, 'table_name', v_table_name)
      );
      RETURN NEW;
    END IF;
  END IF;

  IF v_tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_event_type := v_event_prefix || '.updated';
  FOR col_name IN
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND information_schema.columns.table_name = v_table_name
    AND column_name NOT IN ('id', 'created_at', 'updated_at', 'tenant_id')
  LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col_name, col_name)
      INTO old_val, new_val USING OLD, NEW;
    IF old_val IS DISTINCT FROM new_val THEN
      v_changed_fields := array_append(v_changed_fields, col_name);
    END IF;
  END LOOP;

  IF array_length(v_changed_fields, 1) > 0 THEN
    INSERT INTO public.data_event_ledger (
      tenant_id, zone, actor_user_id, event_type, direction, source,
      entity_type, entity_id, payload
    ) VALUES (
      v_tenant_id, 'Z2', auth.uid(), v_event_type, v_direction, 'db_trigger',
      v_table_name, v_record_id,
      jsonb_build_object('record_id', v_record_id, 'table_name', v_table_name, 'changed_fields', to_jsonb(v_changed_fields))
    );
  END IF;
  RETURN NEW;
END;
$$;
