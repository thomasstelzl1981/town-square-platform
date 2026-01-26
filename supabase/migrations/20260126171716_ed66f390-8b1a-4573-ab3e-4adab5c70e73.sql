-- MSV Templates für Briefe
CREATE TABLE public.msv_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES organizations(id),
  template_code text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  placeholders jsonb DEFAULT '[]',
  locale text DEFAULT 'de',
  version int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Communication Preferences
CREATE TABLE public.msv_communication_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  scope_type text NOT NULL CHECK (scope_type IN ('tenant', 'property', 'lease')),
  scope_id uuid NOT NULL,
  preferred_channel text NOT NULL CHECK (preferred_channel IN ('email', 'letter')),
  fallback_channel text,
  require_confirmation boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Readiness Items für Premium-Aktivierung
CREATE TABLE public.msv_readiness_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  enrollment_id uuid NOT NULL REFERENCES msv_enrollments(id) ON DELETE CASCADE,
  requirement_code text NOT NULL,
  status text NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'provided', 'waived')),
  details text,
  requested_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- msv_enrollments erweitern
ALTER TABLE public.msv_enrollments 
  ADD COLUMN IF NOT EXISTS scope_type text DEFAULT 'property',
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'base' CHECK (tier IN ('base', 'premium')),
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS credits_per_unit int DEFAULT 40,
  ADD COLUMN IF NOT EXISTS readiness_snapshot jsonb;

-- rent_payments erweitern
ALTER TABLE public.rent_payments
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date,
  ADD COLUMN IF NOT EXISTS expected_amount numeric,
  ADD COLUMN IF NOT EXISTS matched_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matched_source text DEFAULT 'manual' CHECK (matched_source IN ('manual', 'finapi')),
  ADD COLUMN IF NOT EXISTS matched_transaction_id text;

-- rent_reminders erweitern
ALTER TABLE public.rent_reminders
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'friendly' CHECK (stage IN ('friendly', 'first', 'final')),
  ADD COLUMN IF NOT EXISTS content_text text,
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES documents(id),
  ADD COLUMN IF NOT EXISTS auto_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES profiles(id);

-- RLS Policies
ALTER TABLE public.msv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msv_communication_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msv_readiness_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant templates" ON public.msv_templates
  FOR SELECT USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own tenant templates" ON public.msv_templates
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own comm prefs" ON public.msv_communication_prefs
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own comm prefs" ON public.msv_communication_prefs
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own readiness items" ON public.msv_readiness_items
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own readiness items" ON public.msv_readiness_items
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- Default Templates einfügen
INSERT INTO public.msv_templates (tenant_id, template_code, title, content, placeholders) VALUES
(NULL, 'KUENDIGUNG', 'Kündigung Mietvertrag', 'Sehr geehrte/r {{mieter_name}},

hiermit kündigen wir das Mietverhältnis für die Wohnung {{einheit}} in {{adresse}} ordentlich zum {{kuendigungsdatum}}.

Bitte übergeben Sie die Wohnung bis zum genannten Termin in vertragsgemäßem Zustand.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "einheit", "adresse", "kuendigungsdatum", "vermieter_name"]'),

(NULL, 'MIETERHOEHUNG', 'Mieterhöhung', 'Sehr geehrte/r {{mieter_name}},

wir erhöhen die Miete für die Wohnung {{einheit}} in {{adresse}} von derzeit {{alte_miete}} € auf {{neue_miete}} € monatlich ab dem {{stichtag}}.

Begründung: {{begruendung}}

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "einheit", "adresse", "alte_miete", "neue_miete", "stichtag", "begruendung", "vermieter_name"]'),

(NULL, 'DATENANFORDERUNG', 'Datenanforderung Mieter', 'Sehr geehrte/r {{mieter_name}},

für unsere Unterlagen benötigen wir folgende Dokumente von Ihnen:

{{dokumente_liste}}

Bitte senden Sie uns diese bis zum {{frist}} zu.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "dokumente_liste", "frist", "vermieter_name"]'),

(NULL, 'MAHNUNG_1', 'Zahlungserinnerung', 'Sehr geehrte/r {{mieter_name}},

wir haben festgestellt, dass die Miete für {{monat}} in Höhe von {{betrag}} € noch nicht eingegangen ist.

Bitte überweisen Sie den Betrag umgehend auf unser Konto.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "monat", "betrag", "vermieter_name"]'),

(NULL, 'MAHNUNG_2', 'Erste Mahnung', 'Sehr geehrte/r {{mieter_name}},

trotz unserer Erinnerung ist die Miete für {{monat}} in Höhe von {{betrag}} € noch nicht eingegangen.

Wir fordern Sie hiermit auf, den Betrag bis zum {{frist}} zu überweisen.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "monat", "betrag", "frist", "vermieter_name"]'),

(NULL, 'MAHNUNG_3', 'Letzte Mahnung', 'Sehr geehrte/r {{mieter_name}},

die Miete für {{monat}} in Höhe von {{betrag}} € ist weiterhin nicht eingegangen.

Dies ist unsere letzte Mahnung. Sollte der Betrag nicht bis zum {{frist}} eingehen, behalten wir uns rechtliche Schritte vor.

Mit freundlichen Grüßen
{{vermieter_name}}', '["mieter_name", "monat", "betrag", "frist", "vermieter_name"]');

-- tile_catalog Update für Einstellungen
UPDATE public.tile_catalog 
SET sub_tiles = jsonb_set(
  COALESCE(sub_tiles, '[]'::jsonb),
  '{4}',
  '{"title": "Einstellungen", "route": "/portal/msv/einstellungen", "icon": "Settings"}'::jsonb
)
WHERE tile_code = 'MOD-05';