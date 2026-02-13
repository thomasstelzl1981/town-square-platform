
-- =============================================
-- MOD-02 Videocalls: Tables + RLS
-- =============================================

-- 1. video_calls
CREATE TABLE public.video_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  host_user_id uuid NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'expired')),
  livekit_room_name text UNIQUE NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host can read own calls" ON public.video_calls
  FOR SELECT USING (auth.uid() = host_user_id);

CREATE POLICY "Host can create calls" ON public.video_calls
  FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can update own calls" ON public.video_calls
  FOR UPDATE USING (auth.uid() = host_user_id);

-- 2. video_call_invites
CREATE TABLE public.video_call_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id uuid NOT NULL REFERENCES public.video_calls(id) ON DELETE CASCADE,
  invited_by_user_id uuid,
  invitee_email text NOT NULL,
  invitee_name text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'joined', 'expired', 'revoked')),
  token_hash text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  joined_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '2 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_call_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host can read own invites" ON public.video_call_invites
  FOR SELECT USING (auth.uid() = invited_by_user_id);

CREATE POLICY "Host can create invites" ON public.video_call_invites
  FOR INSERT WITH CHECK (auth.uid() = invited_by_user_id);

-- 3. video_call_participants
CREATE TABLE public.video_call_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id uuid NOT NULL REFERENCES public.video_calls(id) ON DELETE CASCADE,
  user_id uuid,
  email text,
  display_name text,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('host', 'guest')),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz
);

ALTER TABLE public.video_call_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host can read participants" ON public.video_call_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.video_calls vc
      WHERE vc.id = call_id AND vc.host_user_id = auth.uid()
    )
  );

CREATE POLICY "Participant can read own" ON public.video_call_participants
  FOR SELECT USING (auth.uid() = user_id);
