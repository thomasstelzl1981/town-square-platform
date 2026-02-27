
-- Armstrong Chat Sessions for server-side conversation persistence
CREATE TABLE public.armstrong_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  zone TEXT NOT NULL DEFAULT 'Z2',
  website TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  entity_context JSONB,
  module TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '90 days')
);

-- Indexes
CREATE INDEX idx_armstrong_chat_sessions_user ON public.armstrong_chat_sessions(user_id);
CREATE INDEX idx_armstrong_chat_sessions_tenant ON public.armstrong_chat_sessions(tenant_id);
CREATE INDEX idx_armstrong_chat_sessions_session ON public.armstrong_chat_sessions(session_id);
CREATE INDEX idx_armstrong_chat_sessions_expires ON public.armstrong_chat_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.armstrong_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can view own chat sessions"
ON public.armstrong_chat_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own chat sessions"
ON public.armstrong_chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own chat sessions"
ON public.armstrong_chat_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own sessions (DSGVO: right to erasure)
CREATE POLICY "Users can delete own chat sessions"
ON public.armstrong_chat_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role can manage all sessions (for auto-cleanup)
CREATE POLICY "Service role full access"
ON public.armstrong_chat_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
