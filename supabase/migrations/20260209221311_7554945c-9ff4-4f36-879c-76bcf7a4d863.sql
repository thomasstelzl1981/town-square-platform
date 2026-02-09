
-- ============================================================
-- MOD-14 SOCIAL — Phase 1: 9 Tabellen + RLS
-- ============================================================

-- Helper: get_user_tenant_id() already exists (per project standard)

-- 1) social_personality_profiles
CREATE TABLE public.social_personality_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  owner_user_id uuid NOT NULL,
  audit_version int NOT NULL DEFAULT 1,
  answers_raw jsonb,
  personality_vector jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_personality_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_personality_profiles FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 2) social_topics
CREATE TABLE public.social_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  owner_user_id uuid NOT NULL,
  topic_label text NOT NULL,
  priority int NOT NULL DEFAULT 1,
  topic_briefing jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_topics FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 3) social_inspiration_sources
CREATE TABLE public.social_inspiration_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  owner_user_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'linkedin',
  display_name text NOT NULL,
  profile_url text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_inspiration_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_inspiration_sources FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 4) social_inspiration_samples
CREATE TABLE public.social_inspiration_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  source_id uuid NOT NULL REFERENCES public.social_inspiration_sources(id) ON DELETE CASCADE,
  sample_type text NOT NULL DEFAULT 'text',
  content_text text,
  document_id uuid,
  extracted_patterns jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_inspiration_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_inspiration_samples FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 5) social_inbound_items
CREATE TABLE public.social_inbound_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  owner_user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'ui_upload',
  moment_voice_text text,
  desired_effect text,
  personal_level int DEFAULT 3,
  one_liner text,
  media_document_ids uuid[],
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_inbound_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_inbound_items FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 6) social_drafts
CREATE TABLE public.social_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  owner_user_id uuid NOT NULL,
  origin text NOT NULL DEFAULT 'creation',
  inbound_item_id uuid REFERENCES public.social_inbound_items(id),
  topic_id uuid REFERENCES public.social_topics(id),
  inspiration_source_ids uuid[],
  draft_title text,
  content_linkedin text,
  content_instagram text,
  content_facebook text,
  storyboard jsonb,
  carousel jsonb,
  assets_used uuid[],
  status text NOT NULL DEFAULT 'draft',
  platform_targets text[],
  planned_at timestamptz,
  posted_at timestamptz,
  generation_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_drafts FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 7) social_metrics
CREATE TABLE public.social_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  draft_id uuid NOT NULL REFERENCES public.social_drafts(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'linkedin',
  impressions int,
  likes int,
  comments int,
  saves int,
  clicks int,
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_metrics FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 8) social_video_jobs
CREATE TABLE public.social_video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  draft_id uuid NOT NULL REFERENCES public.social_drafts(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stub',
  job_type text NOT NULL DEFAULT 'hook_video',
  input_payload jsonb,
  status text NOT NULL DEFAULT 'queued',
  result_document_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_video_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_video_jobs FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- 9) social_assets
CREATE TABLE public.social_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  owner_user_id uuid NOT NULL,
  document_id uuid NOT NULL,
  asset_type text NOT NULL DEFAULT 'portrait',
  tags text[],
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.social_assets FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- updated_at triggers (reuse existing function)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_personality_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_inspiration_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_inbound_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_video_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
