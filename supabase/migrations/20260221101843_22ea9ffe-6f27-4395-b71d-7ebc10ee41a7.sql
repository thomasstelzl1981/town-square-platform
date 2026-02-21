
-- ═══════════════════════════════════════════════════════════════
-- Migration: Manager-Tenant-Lifecycle Foundation
-- Neue Rollen (project_manager, pet_manager) + manager_applications Tabelle
-- + has_delegation_scope() Funktion + get_tiles_for_role() Update
-- ═══════════════════════════════════════════════════════════════

-- 1. Enum-Erweiterungen
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'pet_manager';

-- 2. manager_applications Tabelle
CREATE TABLE IF NOT EXISTS public.manager_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role public.membership_role NOT NULL,
  qualification_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.manager_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own manager applications"
  ON public.manager_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create own manager applications"
  ON public.manager_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own draft applications
CREATE POLICY "Users can update own draft applications"
  ON public.manager_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Platform admins can view all applications
CREATE POLICY "Platform admins can view all manager applications"
  ON public.manager_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'));

-- Platform admins can update applications (approve/reject)
CREATE POLICY "Platform admins can update manager applications"
  ON public.manager_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'platform_admin'));

-- Timestamp trigger
CREATE TRIGGER update_manager_applications_updated_at
  BEFORE UPDATE ON public.manager_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. has_delegation_scope() — prüft ob ein Manager auf bestimmte Modul-Daten zugreifen darf
CREATE OR REPLACE FUNCTION public.has_delegation_scope(
  _manager_org_id UUID,
  _client_org_id UUID,
  _module_code TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_delegations
    WHERE delegate_org_id = _manager_org_id
      AND target_org_id = _client_org_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND scopes->>'modules' IS NOT NULL
      AND scopes->'modules' ? _module_code
  )
$$;

-- 4. Update get_tiles_for_role() to include project_manager and pet_manager
CREATE OR REPLACE FUNCTION public.get_tiles_for_role(_role public.membership_role)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_tiles TEXT[] := ARRAY[
    'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
    'MOD-06','MOD-07','MOD-08','MOD-15','MOD-16','MOD-17',
    'MOD-18','MOD-20'
  ];
BEGIN
  CASE _role
    WHEN 'platform_admin' THEN
      RETURN ARRAY[
        'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
        'MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11',
        'MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17',
        'MOD-18','MOD-19','MOD-20'
      ];
    WHEN 'org_admin' THEN
      RETURN base_tiles;
    WHEN 'sales_partner' THEN
      RETURN base_tiles || ARRAY['MOD-09','MOD-10'];
    WHEN 'finance_manager' THEN
      RETURN base_tiles || ARRAY['MOD-11'];
    WHEN 'akquise_manager' THEN
      RETURN base_tiles || ARRAY['MOD-12'];
    WHEN 'project_manager' THEN
      RETURN base_tiles || ARRAY['MOD-13'];
    WHEN 'pet_manager' THEN
      RETURN base_tiles || ARRAY['MOD-22'];
    ELSE
      RETURN base_tiles;
  END CASE;
END;
$$;
