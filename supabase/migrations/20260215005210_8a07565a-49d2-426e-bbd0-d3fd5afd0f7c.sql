
-- WF-MEET-01: Meeting Recorder Widget — alle 4 Tabellen

-- 1) meeting_sessions
CREATE TABLE public.meeting_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Meeting',
  started_at timestamptz,
  ended_at timestamptz,
  consent_confirmed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'idle',
  stt_engine_used text,
  total_duration_sec integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meeting sessions" ON public.meeting_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meeting sessions" ON public.meeting_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meeting sessions" ON public.meeting_sessions FOR UPDATE USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_sessions;

-- 2) meeting_transcript_chunks
CREATE TABLE public.meeting_transcript_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.meeting_sessions(id) ON DELETE CASCADE,
  seq integer NOT NULL DEFAULT 0,
  text text NOT NULL DEFAULT '',
  engine_source text NOT NULL DEFAULT 'browser',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_transcript_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transcript chunks" ON public.meeting_transcript_chunks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.meeting_sessions ms WHERE ms.id = meeting_transcript_chunks.session_id AND ms.user_id = auth.uid()));

-- 3) meeting_outputs
CREATE TABLE public.meeting_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.meeting_sessions(id) ON DELETE CASCADE,
  summary_md text,
  action_items_json jsonb DEFAULT '[]'::jsonb,
  decisions_json jsonb DEFAULT '[]'::jsonb,
  open_questions_json jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meeting outputs" ON public.meeting_outputs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.meeting_sessions ms WHERE ms.id = meeting_outputs.session_id AND ms.user_id = auth.uid()));
CREATE POLICY "Users can insert own meeting outputs" ON public.meeting_outputs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.meeting_sessions ms WHERE ms.id = meeting_outputs.session_id AND ms.user_id = auth.uid()));

-- 4) contact_conversations
CREATE TABLE public.contact_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  type text NOT NULL DEFAULT 'meeting_summary',
  subject text,
  body_md text,
  linked_session_id uuid REFERENCES public.meeting_sessions(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage contact conversations" ON public.contact_conversations FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));
