
-- Schritt 1: Freeze-Felder auf tile_catalog
ALTER TABLE public.tile_catalog
  ADD COLUMN IF NOT EXISTS freeze_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS frozen_by UUID NULL,
  ADD COLUMN IF NOT EXISTS freeze_reason TEXT NULL;

-- Schritt 2: Ledger-Whitelist um Freeze-Events erweitern
DROP FUNCTION IF EXISTS public.log_data_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.log_data_event(
  p_tenant_id UUID,
  p_zone TEXT,
  p_event_type TEXT,
  p_direction TEXT,
  p_source TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_allowed_types TEXT[] := ARRAY[
    'document.uploaded','document.signed_url.view','document.signed_url.download',
    'access_grant.created','access_grant.revoked',
    'inbound.email.received','outbound.email.sent','inbound.webhook.received',
    'listing.published','listing.unpublished',
    'tenant.reset.started','tenant.reset.completed','data.purge.executed',
    'finance.request.submitted','finance.mandate.assigned','finance.bank.submitted',
    'acq.mandate.submitted','acq.mandate.assigned','acq.offer.created',
    'project.created','project.phase.changed',
    'renter.invite.sent','renter.invite.accepted',
    'lead.captured','lead.assigned',
    'mod05.visibility.error',
    'sales.desk.submit.timeout','sales.desk.submit.error',
    'listing.distribution.timeout','listing.distribution.rejected','listing.distribution.duplicate_detected','listing.distribution.error',
    'finance.handoff.timeout','finance.handoff.error',
    'project.intake.timeout','project.intake.error',
    'finance.request.submit.timeout','finance.request.submit.duplicate_detected','finance.request.submit.error',
    'finance.mandate.assignment.timeout','finance.mandate.assignment.rejected','finance.mandate.assignment.error',
    'finance.bank.submit.timeout','finance.bank.submit.error',
    'acq.mandate.submit.timeout','acq.mandate.submit.duplicate_detected','acq.mandate.submit.error',
    'acq.mandate.assignment.timeout','acq.mandate.assignment.rejected','acq.mandate.assignment.error',
    'acq.outbound.response.timeout','acq.outbound.send.error',
    'project.phase.change.timeout','project.phase.change.error',
    'project.listing.distribution.timeout','project.listing.distribution.rejected','project.listing.distribution.error',
    'project.landing_page.timeout','project.landing_page.error',
    'renter.invite.send.timeout','renter.invite.duplicate_detected','renter.invite.send.error',
    'renter.invite.expired','renter.invite.rejected','renter.invite.accept.error',
    'renter.data_room.activation.error','renter.portal.activation.error',
    'renter.org.provisioned','data_room.access.granted',
    'lead.capture.duplicate_detected','lead.capture.error',
    'consent.given','consent.revoked','consent.updated',
    'applicant_profile.updated','applicant_profile.delete_requested','applicant_profile.deleted',
    'contact.updated','contact.delete_requested','contact.deleted',
    'profile.updated','profile.delete_requested','profile.deleted',
    -- MODULE FREEZE events
    'module.freeze.enabled','module.freeze.disabled'
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
    "data.purge.executed": ["reason","correlation_id","deleted_count","oldest_remaining","retention_days","duration_ms"],
    "consent.given": ["consent_type","agreement_id","scope","context"],
    "consent.revoked": ["consent_type","agreement_id","scope","reason"],
    "consent.updated": ["consent_type","agreement_id","scope","changes"],
    "applicant_profile.updated": ["record_id","table_name","changed_fields"],
    "applicant_profile.delete_requested": ["record_id","table_name"],
    "applicant_profile.deleted": ["record_id","table_name"],
    "contact.updated": ["record_id","table_name","changed_fields"],
    "contact.delete_requested": ["record_id","table_name"],
    "contact.deleted": ["record_id","table_name"],
    "profile.updated": ["record_id","table_name","changed_fields"],
    "profile.delete_requested": ["record_id","table_name"],
    "profile.deleted": ["record_id","table_name"],
    "renter.invite.sent": ["invite_id","lease_id","email_hash"],
    "renter.invite.accepted": ["invite_id","lease_id","renter_org_id"],
    "renter.invite.expired": ["invite_id","lease_id"],
    "renter.org.provisioned": ["org_id","lease_id","renter_name"],
    "data_room.access.granted": ["grant_id","lease_id","renter_org_id"],
    "module.freeze.enabled": ["module_code","new_state","reason","actor_user_id"],
    "module.freeze.disabled": ["module_code","new_state","reason","actor_user_id"]
  }'::jsonb;

  IF p_payload != '{}'::jsonb AND v_allowed_keys ? p_event_type THEN
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
