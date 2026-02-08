-- =====================================================
-- PHASE 1: KI-Office Communication Backend
-- Mail Accounts, Mail Messages, Extended Sync Fields
-- =====================================================

-- 1. MAIL_ACCOUNTS TABLE
-- Stores connected email accounts per tenant/user
CREATE TABLE public.mail_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Provider type
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'imap')),
  
  -- Display information
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- OAuth tokens (for Google/Microsoft)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- IMAP credentials (encrypted via Vault reference)
  imap_host TEXT,
  imap_port INTEGER DEFAULT 993,
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  credentials_vault_key TEXT,
  
  -- Sync status
  sync_status TEXT DEFAULT 'disconnected' CHECK (sync_status IN ('connected', 'syncing', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, email_address)
);

-- Enable RLS
ALTER TABLE public.mail_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mail_accounts
CREATE POLICY "Users can view own mail accounts" ON public.mail_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own mail accounts" ON public.mail_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own mail accounts" ON public.mail_accounts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own mail accounts" ON public.mail_accounts
  FOR DELETE USING (user_id = auth.uid());

-- Index for faster lookups
CREATE INDEX idx_mail_accounts_user ON public.mail_accounts(user_id);
CREATE INDEX idx_mail_accounts_tenant ON public.mail_accounts(tenant_id);

-- 2. MAIL_MESSAGES TABLE
-- Local cache of email messages for performance
CREATE TABLE public.mail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.mail_accounts(id) ON DELETE CASCADE,
  
  -- Message identification
  message_id TEXT NOT NULL,
  thread_id TEXT,
  folder TEXT NOT NULL DEFAULT 'INBOX',
  
  -- Content
  subject TEXT,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses JSONB DEFAULT '[]',
  cc_addresses JSONB DEFAULT '[]',
  snippet TEXT,
  body_html TEXT,
  body_text TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  
  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(account_id, message_id)
);

-- Enable RLS
ALTER TABLE public.mail_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy for mail_messages (via account ownership)
CREATE POLICY "Users can view messages from own accounts" ON public.mail_messages
  FOR SELECT USING (
    account_id IN (SELECT id FROM public.mail_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages to own accounts" ON public.mail_messages
  FOR INSERT WITH CHECK (
    account_id IN (SELECT id FROM public.mail_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update messages in own accounts" ON public.mail_messages
  FOR UPDATE USING (
    account_id IN (SELECT id FROM public.mail_accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete messages from own accounts" ON public.mail_messages
  FOR DELETE USING (
    account_id IN (SELECT id FROM public.mail_accounts WHERE user_id = auth.uid())
  );

-- Indexes for mail_messages
CREATE INDEX idx_mail_messages_account_folder ON public.mail_messages(account_id, folder);
CREATE INDEX idx_mail_messages_received ON public.mail_messages(received_at DESC);
CREATE INDEX idx_mail_messages_thread ON public.mail_messages(thread_id);

-- 3. EXTEND CONTACTS TABLE
-- Add external provider sync fields
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS google_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS microsoft_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS synced_from TEXT CHECK (synced_from IS NULL OR synced_from IN ('local', 'google', 'microsoft')),
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- 4. EXTEND CALENDAR_EVENTS TABLE
-- Add external calendar sync fields
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT,
  ADD COLUMN IF NOT EXISTS synced_from TEXT CHECK (synced_from IS NULL OR synced_from IN ('local', 'google', 'microsoft')),
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ical_uid TEXT;

-- 5. UPDATE TRIGGER FOR mail_accounts
CREATE TRIGGER update_mail_accounts_updated_at
  BEFORE UPDATE ON public.mail_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();