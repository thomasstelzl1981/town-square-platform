
-- Table: commpro_phone_assistants
create table public.commpro_phone_assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Mein Telefonassistent',
  is_enabled boolean not null default false,
  voice_provider text null,
  voice_preset_key text not null default 'professional_warm',
  voice_settings jsonb not null default '{"stability":70,"clarity":80,"speed":50}'::jsonb,
  first_message text not null default '',
  behavior_prompt text not null default '',
  rules jsonb not null default '{"ask_clarify_once":true,"collect_name":true,"confirm_callback_number":true,"collect_reason":true,"collect_urgency":false,"collect_preferred_times":false,"max_call_seconds":120}'::jsonb,
  documentation jsonb not null default '{"email_enabled":false,"email_target":"","portal_log_enabled":true,"auto_summary":true,"extract_tasks":true,"retention_days":90}'::jsonb,
  forwarding_number_e164 text null,
  binding_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.commpro_phone_assistants enable row level security;

create policy "Users manage own assistant"
  on public.commpro_phone_assistants
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Table: commpro_phone_call_sessions
create table public.commpro_phone_call_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assistant_id uuid not null references public.commpro_phone_assistants(id) on delete cascade,
  direction text not null default 'inbound',
  from_number_e164 text not null,
  to_number_e164 text null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  duration_sec int null,
  status text not null default 'logged',
  transcript_text text null,
  summary_text text null,
  action_items jsonb not null default '[]'::jsonb,
  match jsonb not null default '{"matched_type":"none","matched_id":null,"match_type":"none"}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.commpro_phone_call_sessions enable row level security;

create policy "Users manage own calls"
  on public.commpro_phone_call_sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index idx_call_sessions_user on public.commpro_phone_call_sessions(user_id, started_at desc);
create index idx_call_sessions_assistant on public.commpro_phone_call_sessions(assistant_id, started_at desc);
