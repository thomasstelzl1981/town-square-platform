-- ============================================================
-- ADR-037: Integration Registry
-- Central registry for all external APIs, connectors, and edge functions
-- ============================================================

-- 1. Create enum for integration types
CREATE TYPE public.integration_type AS ENUM (
  'integration',    -- INT-xxx: External service (e.g., Resend, Stripe)
  'connector',      -- CONN-xxx: Provider variant (e.g., Resend-EU)
  'edge_function',  -- EDGE-xxx: Backend function
  'secret'          -- SEC-xxx: Secret reference (no cleartext)
);

-- 2. Create enum for integration status
CREATE TYPE public.integration_status AS ENUM (
  'active',
  'inactive',
  'deprecated',
  'pending_setup'
);

-- 3. Create the integration_registry table
CREATE TABLE public.integration_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  public_id text NOT NULL,
  
  -- Classification
  type integration_type NOT NULL,
  code text NOT NULL,  -- e.g., 'RESEND', 'STRIPE', 'SEND-EMAIL'
  name text NOT NULL,  -- Human-readable name
  description text,
  
  -- Configuration
  config_schema jsonb NOT NULL DEFAULT '{}'::jsonb,  -- JSON Schema for config validation
  default_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Scoping
  tenant_id uuid REFERENCES public.organizations(id),  -- NULL = platform-wide
  
  -- Status & Metadata
  status integration_status NOT NULL DEFAULT 'pending_setup',
  version text NOT NULL DEFAULT '1.0.0',
  documentation_url text,
  
  -- Audit
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_integration_code_per_tenant UNIQUE NULLS NOT DISTINCT (code, tenant_id)
);

-- 4. Create trigger function for public_id generation
CREATE OR REPLACE FUNCTION public.set_integration_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  prefix text;
BEGIN
  IF NEW.public_id IS NULL THEN
    -- Determine prefix based on type
    prefix := CASE NEW.type
      WHEN 'integration' THEN 'X'
      WHEN 'connector' THEN 'C'
      WHEN 'edge_function' THEN 'E'
      WHEN 'secret' THEN 'S'
      ELSE 'X'
    END;
    NEW.public_id := generate_public_id(prefix);
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Create trigger
DROP TRIGGER IF EXISTS trg_set_integration_public_id ON public.integration_registry;
CREATE TRIGGER trg_set_integration_public_id
  BEFORE INSERT ON public.integration_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.set_integration_public_id();

-- 6. Create updated_at trigger
DROP TRIGGER IF EXISTS trg_integration_registry_updated_at ON public.integration_registry;
CREATE TRIGGER trg_integration_registry_updated_at
  BEFORE UPDATE ON public.integration_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 7. Create indexes
CREATE UNIQUE INDEX idx_integration_registry_public_id ON public.integration_registry(public_id);
CREATE INDEX idx_integration_registry_type ON public.integration_registry(type);
CREATE INDEX idx_integration_registry_status ON public.integration_registry(status);
CREATE INDEX idx_integration_registry_tenant ON public.integration_registry(tenant_id) WHERE tenant_id IS NOT NULL;

-- 8. Enable RLS
ALTER TABLE public.integration_registry ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies

-- Platform admins can do everything
CREATE POLICY "ir_select_platform_admin"
  ON public.integration_registry FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "ir_insert_platform_admin"
  ON public.integration_registry FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "ir_update_platform_admin"
  ON public.integration_registry FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "ir_delete_platform_admin"
  ON public.integration_registry FOR DELETE
  USING (is_platform_admin());

-- Org admins can view platform-wide integrations and their tenant's integrations
CREATE POLICY "ir_select_org_admin"
  ON public.integration_registry FOR SELECT
  USING (
    tenant_id IS NULL  -- Platform-wide integrations are visible to all
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = integration_registry.tenant_id
        AND m.role IN ('org_admin', 'internal_ops')
    )
  );

-- 10. Seed platform-wide integrations (examples)
INSERT INTO public.integration_registry (type, code, name, description, status, config_schema)
VALUES 
  ('integration', 'RESEND', 'Resend Email', 'Transactional email service', 'pending_setup', 
   '{"type": "object", "properties": {"api_key_ref": {"type": "string"}, "from_domain": {"type": "string"}}, "required": ["api_key_ref"]}'::jsonb),
  
  ('integration', 'STRIPE', 'Stripe Payments', 'Payment processing', 'pending_setup',
   '{"type": "object", "properties": {"secret_key_ref": {"type": "string"}, "webhook_secret_ref": {"type": "string"}}, "required": ["secret_key_ref"]}'::jsonb),
  
  ('integration', 'CAYA', 'Caya DMS', 'Document management and mail digitization', 'pending_setup',
   '{"type": "object", "properties": {"api_key_ref": {"type": "string"}, "mailbox_id": {"type": "string"}}, "required": ["api_key_ref"]}'::jsonb),
  
  ('integration', 'FUTURE_ROOM', 'Future Room', 'Financing partner handoff system', 'pending_setup',
   '{"type": "object", "properties": {"api_key_ref": {"type": "string"}, "environment": {"type": "string", "enum": ["sandbox", "production"]}}, "required": ["api_key_ref"]}'::jsonb),

  ('edge_function', 'SEND_EMAIL', 'Send Email', 'Edge function for sending transactional emails', 'inactive',
   '{"type": "object", "properties": {"integration_ref": {"type": "string", "default": "RESEND"}}, "required": ["integration_ref"]}'::jsonb),
   
  ('edge_function', 'PROCESS_INBOUND', 'Process Inbound', 'Edge function for processing incoming mail from Caya', 'inactive',
   '{"type": "object", "properties": {"integration_ref": {"type": "string", "default": "CAYA"}}, "required": ["integration_ref"]}'::jsonb);