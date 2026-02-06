-- ============================================================================
-- AKQUISE-SERVICE: Complete Setup (Functions + Policies + Triggers)
-- ============================================================================

-- 1. Create is_platform_admin function
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id
      AND role = 'platform_admin'
  )
$$;

-- 2. Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Create generate_acq_mandate_code function
CREATE OR REPLACE FUNCTION public.generate_acq_mandate_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'ACQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('acq_mandate_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create log_acq_mandate_event function
CREATE OR REPLACE FUNCTION public.log_acq_mandate_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.acq_mandate_events (mandate_id, event_type, actor_id, payload)
  VALUES (
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'::acq_mandate_event_type
      WHEN OLD.status = 'draft' AND NEW.status = 'submitted_to_zone1' THEN 'submitted'::acq_mandate_event_type
      WHEN OLD.assigned_manager_user_id IS NULL AND NEW.assigned_manager_user_id IS NOT NULL THEN 'assigned'::acq_mandate_event_type
      WHEN OLD.split_terms_confirmed_at IS NULL AND NEW.split_terms_confirmed_at IS NOT NULL THEN 'split_confirmed'::acq_mandate_event_type
      WHEN OLD.status IS DISTINCT FROM 'active' AND NEW.status = 'active' THEN 'activated'::acq_mandate_event_type
      WHEN OLD.status IS DISTINCT FROM 'paused' AND NEW.status = 'paused' THEN 'paused'::acq_mandate_event_type
      WHEN OLD.status = 'paused' AND NEW.status = 'active' THEN 'resumed'::acq_mandate_event_type
      WHEN NEW.status = 'closed' THEN 'closed'::acq_mandate_event_type
      ELSE 'created'::acq_mandate_event_type
    END,
    auth.uid(),
    jsonb_build_object(
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status::text ELSE NULL END,
      'new_status', NEW.status::text,
      'old_manager', CASE WHEN TG_OP = 'UPDATE' THEN OLD.assigned_manager_user_id::text ELSE NULL END,
      'new_manager', NEW.assigned_manager_user_id::text
    )
  );
  RETURN NEW;
END;
$$;

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_acq_mandates_tenant ON public.acq_mandates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acq_mandates_status ON public.acq_mandates(status);
CREATE INDEX IF NOT EXISTS idx_acq_mandates_assigned_manager ON public.acq_mandates(assigned_manager_user_id);
CREATE INDEX IF NOT EXISTS idx_acq_mandates_created_by ON public.acq_mandates(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_acq_mandate_events_mandate ON public.acq_mandate_events(mandate_id);

-- 6. Enable RLS
ALTER TABLE public.acq_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acq_mandate_events ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies
DROP POLICY IF EXISTS "Platform admins can manage all mandates" ON public.acq_mandates;
DROP POLICY IF EXISTS "Akquise managers can view assigned mandates" ON public.acq_mandates;
DROP POLICY IF EXISTS "Akquise managers can update assigned mandates" ON public.acq_mandates;
DROP POLICY IF EXISTS "Users can create mandates" ON public.acq_mandates;
DROP POLICY IF EXISTS "Users can view own mandates" ON public.acq_mandates;
DROP POLICY IF EXISTS "Platform admins can manage all events" ON public.acq_mandate_events;
DROP POLICY IF EXISTS "Akquise managers can view mandate events" ON public.acq_mandate_events;
DROP POLICY IF EXISTS "Users can view events for own mandates" ON public.acq_mandate_events;
DROP POLICY IF EXISTS "Mandate stakeholders can insert events" ON public.acq_mandate_events;

-- 8. RLS Policies for acq_mandates

CREATE POLICY "Platform admins can manage all mandates"
  ON public.acq_mandates
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Akquise managers can view assigned mandates"
  ON public.acq_mandates
  FOR SELECT
  TO authenticated
  USING (
    assigned_manager_user_id = auth.uid()
    AND public.has_role(auth.uid(), 'akquise_manager')
  );

CREATE POLICY "Akquise managers can update assigned mandates"
  ON public.acq_mandates
  FOR UPDATE
  TO authenticated
  USING (
    assigned_manager_user_id = auth.uid()
    AND public.has_role(auth.uid(), 'akquise_manager')
  )
  WITH CHECK (
    assigned_manager_user_id = auth.uid()
    AND public.has_role(auth.uid(), 'akquise_manager')
  );

CREATE POLICY "Users can create mandates"
  ON public.acq_mandates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = tenant_id
    )
  );

CREATE POLICY "Users can view own mandates"
  ON public.acq_mandates
  FOR SELECT
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- 9. RLS Policies for acq_mandate_events

CREATE POLICY "Platform admins can manage all events"
  ON public.acq_mandate_events
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Akquise managers can view mandate events"
  ON public.acq_mandate_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.acq_mandates m
      WHERE m.id = mandate_id
        AND m.assigned_manager_user_id = auth.uid()
        AND public.has_role(auth.uid(), 'akquise_manager')
    )
  );

CREATE POLICY "Users can view events for own mandates"
  ON public.acq_mandate_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.acq_mandates m
      WHERE m.id = mandate_id
        AND m.created_by_user_id = auth.uid()
    )
  );

CREATE POLICY "Mandate stakeholders can insert events"
  ON public.acq_mandate_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.acq_mandates m
      WHERE m.id = mandate_id
        AND (
          m.created_by_user_id = auth.uid()
          OR m.assigned_manager_user_id = auth.uid()
          OR public.is_platform_admin(auth.uid())
        )
    )
  );

-- 10. Triggers
DROP TRIGGER IF EXISTS trg_generate_acq_mandate_code ON public.acq_mandates;
CREATE TRIGGER trg_generate_acq_mandate_code
  BEFORE INSERT ON public.acq_mandates
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_acq_mandate_code();

DROP TRIGGER IF EXISTS trg_acq_mandates_updated_at ON public.acq_mandates;
CREATE TRIGGER trg_acq_mandates_updated_at
  BEFORE UPDATE ON public.acq_mandates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_log_acq_mandate_changes ON public.acq_mandates;
CREATE TRIGGER trg_log_acq_mandate_changes
  AFTER INSERT OR UPDATE ON public.acq_mandates
  FOR EACH ROW
  EXECUTE FUNCTION public.log_acq_mandate_event();