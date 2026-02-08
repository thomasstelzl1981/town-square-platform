-- =====================================================
-- KI-OFFICE MARKETING AUTOMATION TABLES
-- Phase 1: Complete Database Schema for Zone 1 KI-Office
-- =====================================================

-- 1. E-Mail-Templates für wiederverwendbare Inhalte
CREATE TABLE IF NOT EXISTS admin_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  category TEXT, -- 'onboarding', 'sales', 'follow_up', 'newsletter', 'partner', 'eigentuemer'
  variables JSONB DEFAULT '[]', -- [{name: 'VORNAME', description: '...'}]
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. E-Mail-Sequenzen (Drip-Kampagnen)
CREATE TABLE IF NOT EXISTS admin_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'contact_created', 'tag_added'
  trigger_config JSONB DEFAULT '{}', -- { tag: 'neuer_partner' } for tag_added trigger
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  target_categories TEXT[] DEFAULT '{}', -- ['Partner', 'Eigentümer', 'Makler']
  stats JSONB DEFAULT '{"enrolled": 0, "active": 0, "completed": 0, "unsubscribed": 0}',
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sequenz-Schritte (E-Mails in einer Serie)
CREATE TABLE IF NOT EXISTS admin_email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES admin_email_sequences ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  template_id UUID REFERENCES admin_email_templates,
  subject_override TEXT, -- Optional: Überschreibt Template-Subject
  body_override TEXT,    -- Optional: Überschreibt Template-Body
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  send_condition TEXT DEFAULT 'always', -- 'always', 'if_not_replied', 'if_not_opened'
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "replied": 0}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_step_order CHECK (step_order >= 0)
);

-- 4. Kontakt-Einschreibungen in Sequenzen
CREATE TABLE IF NOT EXISTS admin_email_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES admin_email_sequences ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'unsubscribed'
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(sequence_id, contact_id)
);

-- 5. E-Mail-Threading für Konversationen
CREATE TABLE IF NOT EXISTS admin_email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts ON DELETE SET NULL,
  subject TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- 'open', 'awaiting_reply', 'closed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Kontakt-Tags für Segmentierung
CREATE TABLE IF NOT EXISTS admin_contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, tag)
);

-- 7. Recherche-Aufträge für Apollo/Firecrawl
CREATE TABLE IF NOT EXISTS admin_research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'apollo_search', 'firecrawl_scrape', 'company_enrich'
  query_params JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  results_count INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]',
  error_message TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 8. Saved Segments für dynamische Zielgruppen
CREATE TABLE IF NOT EXISTS admin_saved_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filter_config JSONB NOT NULL, -- { categories: ['Partner'], tags: ['hamburg'], cities: ['Hamburg'] }
  contact_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ALTER EXISTING TABLES: Add thread references
-- =====================================================

-- Add thread_id to outbound emails (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_outbound_emails' AND column_name = 'thread_id') THEN
    ALTER TABLE admin_outbound_emails ADD COLUMN thread_id UUID REFERENCES admin_email_threads;
  END IF;
END $$;

-- Add sequence_step_id to outbound emails (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_outbound_emails' AND column_name = 'sequence_step_id') THEN
    ALTER TABLE admin_outbound_emails ADD COLUMN sequence_step_id UUID REFERENCES admin_email_sequence_steps;
  END IF;
END $$;

-- Add enrollment_id to outbound emails (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_outbound_emails' AND column_name = 'enrollment_id') THEN
    ALTER TABLE admin_outbound_emails ADD COLUMN enrollment_id UUID REFERENCES admin_email_enrollments;
  END IF;
END $$;

-- Add thread_id to inbound emails (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_inbound_emails' AND column_name = 'thread_id') THEN
    ALTER TABLE admin_inbound_emails ADD COLUMN thread_id UUID REFERENCES admin_email_threads;
  END IF;
END $$;

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_admin_email_templates_category ON admin_email_templates(category);
CREATE INDEX IF NOT EXISTS idx_admin_email_templates_active ON admin_email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_email_sequences_status ON admin_email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_admin_email_sequences_trigger ON admin_email_sequences(trigger_type);

CREATE INDEX IF NOT EXISTS idx_admin_email_sequence_steps_sequence ON admin_email_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_sequence_steps_order ON admin_email_sequence_steps(sequence_id, step_order);

CREATE INDEX IF NOT EXISTS idx_admin_email_enrollments_sequence ON admin_email_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_enrollments_contact ON admin_email_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_enrollments_status ON admin_email_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_admin_email_enrollments_next_send ON admin_email_enrollments(next_send_at) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_admin_email_threads_contact ON admin_email_threads(contact_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_threads_activity ON admin_email_threads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_email_threads_status ON admin_email_threads(status);

CREATE INDEX IF NOT EXISTS idx_admin_contact_tags_contact ON admin_contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_admin_contact_tags_tag ON admin_contact_tags(tag);

CREATE INDEX IF NOT EXISTS idx_admin_research_jobs_status ON admin_research_jobs(status);
CREATE INDEX IF NOT EXISTS idx_admin_research_jobs_type ON admin_research_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_admin_outbound_thread ON admin_outbound_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_admin_inbound_thread ON admin_inbound_emails(thread_id);

-- =====================================================
-- RLS POLICIES: Platform Admin only
-- =====================================================

ALTER TABLE admin_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_saved_segments ENABLE ROW LEVEL SECURITY;

-- Templates: Platform admins can manage
CREATE POLICY "Platform admins can manage templates"
  ON admin_email_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- Sequences: Platform admins can manage
CREATE POLICY "Platform admins can manage sequences"
  ON admin_email_sequences FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- Sequence Steps: Platform admins can manage
CREATE POLICY "Platform admins can manage sequence steps"
  ON admin_email_sequence_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- Enrollments: Platform admins can manage
CREATE POLICY "Platform admins can manage enrollments"
  ON admin_email_enrollments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- Threads: Platform admins can manage
CREATE POLICY "Platform admins can manage threads"
  ON admin_email_threads FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- Tags: Platform admins can manage
CREATE POLICY "Platform admins can manage tags"
  ON admin_contact_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- Research Jobs: Platform admins can manage
CREATE POLICY "Platform admins can manage research jobs"
  ON admin_research_jobs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- Saved Segments: Platform admins can manage
CREATE POLICY "Platform admins can manage saved segments"
  ON admin_saved_segments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  ));

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_email_templates_updated_at ON admin_email_templates;
CREATE TRIGGER update_admin_email_templates_updated_at
  BEFORE UPDATE ON admin_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

DROP TRIGGER IF EXISTS update_admin_email_sequences_updated_at ON admin_email_sequences;
CREATE TRIGGER update_admin_email_sequences_updated_at
  BEFORE UPDATE ON admin_email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

DROP TRIGGER IF EXISTS update_admin_saved_segments_updated_at ON admin_saved_segments;
CREATE TRIGGER update_admin_saved_segments_updated_at
  BEFORE UPDATE ON admin_saved_segments
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- =====================================================
-- SEED: Initial Templates for common use cases
-- =====================================================

INSERT INTO admin_email_templates (name, subject, body_html, body_text, category, variables) VALUES
  ('Partner Willkommen', 
   'Willkommen bei System of a Town – Ihre Partnerschaft startet jetzt!',
   '<div style="font-family: sans-serif;"><h2>Herzlich willkommen, {{VORNAME}}!</h2><p>Wir freuen uns, Sie als Partner bei System of a Town begrüßen zu dürfen.</p><p>Mit freundlichen Grüßen,<br>Ihr SoT Team</p></div>',
   'Herzlich willkommen, {{VORNAME}}!\n\nWir freuen uns, Sie als Partner bei System of a Town begrüßen zu dürfen.\n\nMit freundlichen Grüßen,\nIhr SoT Team',
   'onboarding',
   '[{"name": "VORNAME", "description": "Vorname des Kontakts"}, {"name": "FIRMA", "description": "Firmenname"}]'),
   
  ('Follow-Up 1', 
   'Kurze Rückfrage: Haben Sie Fragen zu unserer Plattform?',
   '<div style="font-family: sans-serif;"><p>Guten Tag {{VORNAME}},</p><p>vor einigen Tagen haben wir Ihnen Informationen zu System of a Town gesendet. Haben Sie Fragen oder möchten Sie mehr erfahren?</p><p>Wir stehen Ihnen gerne zur Verfügung!</p></div>',
   'Guten Tag {{VORNAME}},\n\nvor einigen Tagen haben wir Ihnen Informationen zu System of a Town gesendet. Haben Sie Fragen oder möchten Sie mehr erfahren?\n\nWir stehen Ihnen gerne zur Verfügung!',
   'follow_up',
   '[{"name": "VORNAME", "description": "Vorname des Kontakts"}]'),
   
  ('Eigentümer Erstansprache',
   'Ihre Immobilie professionell verwalten – kostenlose Beratung',
   '<div style="font-family: sans-serif;"><p>Sehr geehrte/r {{VORNAME}} {{NACHNAME}},</p><p>als Immobilieneigentümer wissen Sie: Gute Verwaltung spart Zeit und Geld. Mit System of a Town digitalisieren Sie Ihre Immobilienverwaltung in wenigen Minuten.</p><p>Dürfen wir Ihnen in einem kurzen Gespräch zeigen, wie?</p></div>',
   'Sehr geehrte/r {{VORNAME}} {{NACHNAME}},\n\nals Immobilieneigentümer wissen Sie: Gute Verwaltung spart Zeit und Geld. Mit System of a Town digitalisieren Sie Ihre Immobilienverwaltung in wenigen Minuten.\n\nDürfen wir Ihnen in einem kurzen Gespräch zeigen, wie?',
   'sales',
   '[{"name": "VORNAME", "description": "Vorname"}, {"name": "NACHNAME", "description": "Nachname"}]'),
   
  ('Makler Kooperation',
   'Kooperationsanfrage: Gemeinsam mehr erreichen',
   '<div style="font-family: sans-serif;"><p>Guten Tag {{VORNAME}},</p><p>als {{FIRMA}} sind Sie als Makler in der Region bekannt. Wir von System of a Town suchen starke Partner für unser Vertriebsnetzwerk.</p><p>Interesse an einem unverbindlichen Gespräch?</p></div>',
   'Guten Tag {{VORNAME}},\n\nals {{FIRMA}} sind Sie als Makler in der Region bekannt. Wir von System of a Town suchen starke Partner für unser Vertriebsnetzwerk.\n\nInteresse an einem unverbindlichen Gespräch?',
   'partner',
   '[{"name": "VORNAME", "description": "Vorname"}, {"name": "FIRMA", "description": "Firmenname"}]')
ON CONFLICT DO NOTHING;