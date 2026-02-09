
-- ============================================================================
-- WHATSAPP BUSINESS INTEGRATION — 6 Tabellen + RLS + Indizes + Realtime
-- ============================================================================

-- 1) whatsapp_accounts (Tenant-Ebene, 1:1 pro Organisation)
CREATE TABLE public.whatsapp_accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  waba_provider         text NOT NULL DEFAULT 'meta' CHECK (waba_provider IN ('meta')),
  phone_number_id       text NOT NULL,
  business_account_id   text,
  system_phone_e164     text NOT NULL,
  access_token_ref      text,
  webhook_verify_token  text,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('connected','pending','error')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_whatsapp_accounts_tenant ON public.whatsapp_accounts(tenant_id);

CREATE POLICY "tenant_isolation_select" ON public.whatsapp_accounts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.whatsapp_accounts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.whatsapp_accounts
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_delete" ON public.whatsapp_accounts
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- 2) whatsapp_user_settings (User-Ebene)
CREATE TABLE public.whatsapp_user_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_control_e164    text,
  auto_reply_enabled    boolean NOT NULL DEFAULT false,
  auto_reply_text       text DEFAULT 'Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze.',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE public.whatsapp_user_settings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wa_user_settings_tenant ON public.whatsapp_user_settings(tenant_id);
CREATE INDEX idx_wa_user_settings_user ON public.whatsapp_user_settings(user_id);

CREATE POLICY "user_own_select" ON public.whatsapp_user_settings
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());
CREATE POLICY "user_own_insert" ON public.whatsapp_user_settings
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());
CREATE POLICY "user_own_update" ON public.whatsapp_user_settings
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());

-- 3) whatsapp_conversations
CREATE TABLE public.whatsapp_conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  wa_contact_e164   text NOT NULL,
  contact_name      text,
  is_owner_control  boolean NOT NULL DEFAULT false,
  last_message_at   timestamptz,
  unread_count      integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, wa_contact_e164)
);
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wa_conv_tenant ON public.whatsapp_conversations(tenant_id);
CREATE INDEX idx_wa_conv_tenant_last ON public.whatsapp_conversations(tenant_id, last_message_at DESC);

CREATE POLICY "tenant_isolation_select" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.whatsapp_conversations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.whatsapp_conversations
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- 4) whatsapp_messages (Realtime enabled)
CREATE TABLE public.whatsapp_messages (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id         uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction               text NOT NULL CHECK (direction IN ('in','out')),
  from_e164               text NOT NULL,
  to_e164                 text NOT NULL,
  body_text               text,
  message_type            text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','document','audio','video','location','contact')),
  media_count             integer NOT NULL DEFAULT 0,
  owner_control_command   boolean NOT NULL DEFAULT false,
  wa_message_id           text,
  status                  text NOT NULL DEFAULT 'received' CHECK (status IN ('received','sent','delivered','read','failed')),
  raw_payload             jsonb,
  created_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wa_msg_conv ON public.whatsapp_messages(conversation_id, created_at);
CREATE INDEX idx_wa_msg_tenant ON public.whatsapp_messages(tenant_id);
CREATE INDEX idx_wa_msg_wa_id ON public.whatsapp_messages(wa_message_id);

CREATE POLICY "tenant_isolation_select" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.whatsapp_messages
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Enable Realtime for live chat updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- 5) whatsapp_attachments
CREATE TABLE public.whatsapp_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message_id      uuid NOT NULL REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  file_name       text NOT NULL,
  mime_type       text,
  size_bytes      integer,
  storage_node_id uuid REFERENCES public.storage_nodes(id),
  wa_media_id     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_attachments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wa_attach_msg ON public.whatsapp_attachments(message_id);
CREATE INDEX idx_wa_attach_tenant ON public.whatsapp_attachments(tenant_id);

CREATE POLICY "tenant_isolation_select" ON public.whatsapp_attachments
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.whatsapp_attachments
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- 6) armstrong_command_events (Audit/Billing für WhatsApp-Commands)
CREATE TABLE public.armstrong_command_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id),
  source              text NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp','chat','voice','api')),
  source_message_id   uuid,
  action_code         text NOT NULL,
  status              text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','executing','completed','failed','cancelled')),
  output_ref          jsonb,
  error_message       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);
ALTER TABLE public.armstrong_command_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_arm_cmd_tenant ON public.armstrong_command_events(tenant_id);
CREATE INDEX idx_arm_cmd_action ON public.armstrong_command_events(action_code);

CREATE POLICY "tenant_isolation_select" ON public.armstrong_command_events
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.armstrong_command_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.armstrong_command_events
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- updated_at trigger for relevant tables
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON public.whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_user_settings_updated_at
  BEFORE UPDATE ON public.whatsapp_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
