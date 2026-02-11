
-- ═══════════════════════════════════════════════════════════════
-- P0 HARDENING: Status Transition Validation Triggers
-- ═══════════════════════════════════════════════════════════════

-- 1. finance_requests
CREATE OR REPLACE FUNCTION public.fn_validate_finance_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_allowed BOOLEAN := FALSE;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  
  v_allowed := CASE
    WHEN OLD.status = 'draft' AND NEW.status = 'submitted' THEN TRUE
    WHEN OLD.status = 'submitted' AND NEW.status IN ('assigned', 'timeout') THEN TRUE
    WHEN OLD.status = 'assigned' AND NEW.status = 'processing' THEN TRUE
    WHEN OLD.status = 'processing' AND NEW.status IN ('completed', 'rejected') THEN TRUE
    ELSE FALSE
  END;
  
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid status transition: % -> % (finance_requests)', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_finance_request_status ON public.finance_requests;
CREATE TRIGGER trg_validate_finance_request_status
  BEFORE UPDATE OF status ON public.finance_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_finance_request_status();

-- 2. acq_mandates
CREATE OR REPLACE FUNCTION public.fn_validate_acq_mandate_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_allowed BOOLEAN := FALSE;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  
  v_allowed := CASE
    WHEN OLD.status = 'draft' AND NEW.status = 'submitted' THEN TRUE
    WHEN OLD.status = 'submitted' AND NEW.status IN ('assigned', 'timeout') THEN TRUE
    WHEN OLD.status = 'assigned' AND NEW.status = 'active' THEN TRUE
    WHEN OLD.status = 'active' AND NEW.status IN ('completed', 'rejected') THEN TRUE
    ELSE FALSE
  END;
  
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid status transition: % -> % (acq_mandates)', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_acq_mandate_status ON public.acq_mandates;
CREATE TRIGGER trg_validate_acq_mandate_status
  BEFORE UPDATE OF status ON public.acq_mandates
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_acq_mandate_status();

-- 3. dev_projects
CREATE OR REPLACE FUNCTION public.fn_validate_dev_project_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_allowed BOOLEAN := FALSE;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  
  v_allowed := CASE
    WHEN OLD.status = 'planning' AND NEW.status = 'construction' THEN TRUE
    WHEN OLD.status = 'construction' AND NEW.status = 'sales' THEN TRUE
    WHEN OLD.status = 'sales' AND NEW.status = 'handover' THEN TRUE
    WHEN OLD.status = 'handover' AND NEW.status = 'completed' THEN TRUE
    ELSE FALSE
  END;
  
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid status transition: % -> % (dev_projects)', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_dev_project_status ON public.dev_projects;
CREATE TRIGGER trg_validate_dev_project_status
  BEFORE UPDATE OF status ON public.dev_projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_dev_project_status();

-- 4. leases
CREATE OR REPLACE FUNCTION public.fn_validate_lease_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_allowed BOOLEAN := FALSE;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  
  v_allowed := CASE
    WHEN OLD.status = 'draft' AND NEW.status = 'active' THEN TRUE
    WHEN OLD.status = 'active' AND NEW.status IN ('terminated', 'expired') THEN TRUE
    ELSE FALSE
  END;
  
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid status transition: % -> % (leases)', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_lease_status ON public.leases;
CREATE TRIGGER trg_validate_lease_status
  BEFORE UPDATE OF status ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_lease_status();
