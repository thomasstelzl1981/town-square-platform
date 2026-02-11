
-- DSGVO MVP: Data Event Ledger + log_data_event RPC

CREATE TABLE public.data_event_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id       UUID REFERENCES public.organizations(id),
  zone            TEXT NOT NULL CHECK (zone IN ('Z1','Z2','Z3','EXTERN')),
  actor_user_id   UUID,
  actor_role      TEXT,
  event_type      TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('ingress','egress','mutate','delete')),
  source          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash         TEXT,
  user_agent_hash TEXT
);

CREATE INDEX idx_del_tenant_created ON public.data_event_ledger(tenant_id, created_at DESC);
CREATE INDEX idx_del_event_type     ON public.data_event_ledger(event_type, created_at DESC);
CREATE INDEX idx_del_entity         ON public.data_event_ledger(entity_type, entity_id);
CREATE INDEX idx_del_direction      ON public.data_event_ledger(direction, created_at DESC);
CREATE INDEX idx_del_created_at     ON public.data_event_ledger(created_at);

ALTER TABLE public.data_event_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY del_select_platform_admin ON public.data_event_ledger
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY del_select_tenant_admin ON public.data_event_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = data_event_ledger.tenant_id
        AND m.role IN ('platform_admin', 'org_admin')
    )
  );

CREATE OR REPLACE FUNCTION public.log_data_event(
  p_tenant_id       UUID DEFAULT NULL,
  p_zone            TEXT DEFAULT 'Z2',
  p_event_type      TEXT DEFAULT NULL,
  p_direction       TEXT DEFAULT 'mutate',
  p_source          TEXT DEFAULT 'ui',
  p_entity_type     TEXT DEFAULT NULL,
  p_entity_id       UUID DEFAULT NULL,
  p_payload         JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
  v_allowed_types TEXT[] := ARRAY[
    'document.uploaded',
    'document.signed_url.view',
    'document.signed_url.download',
    'access_grant.created',
    'access_grant.revoked',
    'inbound.email.received',
    'outbound.email.sent',
    'inbound.webhook.received',
    'listing.published',
    'listing.unpublished',
    'tenant.reset.started',
    'tenant.reset.completed',
    'data.purge.executed'
  ];
  v_allowed_keys JSONB;
  v_payload_keys TEXT[];
  v_key TEXT;
  v_max_payload_size INT := 4096;
  v_event_allowed_keys TEXT[];
BEGIN
  IF p_event_type IS NULL OR NOT (p_event_type = ANY(v_allowed_types)) THEN
    RAISE EXCEPTION 'Invalid event_type: %', COALESCE(p_event_type, 'NULL');
  END IF;

  IF p_direction NOT IN ('ingress', 'egress', 'mutate', 'delete') THEN
    RAISE EXCEPTION 'Invalid direction: %', p_direction;
  END IF;

  IF octet_length(p_payload::text) > v_max_payload_size THEN
    RAISE EXCEPTION 'Payload too large: % bytes (max %)', octet_length(p_payload::text), v_max_payload_size;
  END IF;

  v_allowed_keys := '{
    "document.uploaded": ["bucket","file_path","mime_type","size_bytes","document_id","module_code"],
    "document.signed_url.view": ["document_id","expires_in","mime_type","size_bytes"],
    "document.signed_url.download": ["document_id","expires_in","mime_type","size_bytes"],
    "access_grant.created": ["grant_id","scope_type","scope_id","subject_type"],
    "access_grant.revoked": ["grant_id","scope_type","scope_id","reason"],
    "inbound.email.received": ["inbound_id","from_domain_hash","subject_length","attachment_count"],
    "outbound.email.sent": ["campaign_id","recipient_count","status","sequence_id","enrollment_id","step"],
    "inbound.webhook.received": ["webhook_type","source_system","payload_size"],
    "listing.published": ["listing_id","channel","partner_visibility"],
    "listing.unpublished": ["listing_id","channel","reason"],
    "tenant.reset.started": ["tenant_id","triggered_by"],
    "tenant.reset.completed": ["tenant_id","reason","correlation_id","tables_deleted","storage_deleted","duration_ms"],
    "data.purge.executed": ["reason","correlation_id","deleted_count","oldest_remaining","retention_days","duration_ms"]
  }'::jsonb;

  IF p_payload != '{}'::jsonb THEN
    SELECT array_agg(k) INTO v_payload_keys FROM jsonb_object_keys(p_payload) AS k;
    IF v_payload_keys IS NOT NULL THEN
      SELECT array_agg(val::text) INTO v_event_allowed_keys
      FROM jsonb_array_elements_text(v_allowed_keys->p_event_type) AS val;

      IF v_event_allowed_keys IS NOT NULL THEN
        FOREACH v_key IN ARRAY v_payload_keys LOOP
          IF NOT (v_key = ANY(v_event_allowed_keys)) THEN
            RAISE EXCEPTION 'Disallowed payload key "%" for event_type "%"', v_key, p_event_type;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.data_event_ledger (
    tenant_id, zone, actor_user_id,
    event_type, direction, source,
    entity_type, entity_id, payload
  ) VALUES (
    p_tenant_id, p_zone, auth.uid(),
    p_event_type, p_direction, p_source,
    p_entity_type, p_entity_id, p_payload
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_data_event TO authenticated;
