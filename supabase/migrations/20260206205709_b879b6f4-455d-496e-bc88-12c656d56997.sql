-- =====================================================
-- MOD-07 Document Checklist & Reminders (CORRECTED ENUM)
-- =====================================================

-- 1. Document Checklist Items (Standard-Checkliste gemäß PDF)
CREATE TABLE public.document_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  checklist_type text NOT NULL CHECK (checklist_type IN ('applicant', 'request')),
  category text NOT NULL CHECK (category IN ('identity', 'income', 'assets', 'liabilities', 'retirement', 'property')),
  doc_type text NOT NULL,
  label text NOT NULL,
  is_required boolean DEFAULT false,
  for_employment_type text CHECK (for_employment_type IS NULL OR for_employment_type IN ('employed', 'self_employed')),
  sort_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Document Reminders
CREATE TABLE public.document_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  finance_request_id uuid REFERENCES finance_requests(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'disabled' CHECK (reminder_type IN ('weekly', 'on_missing', 'disabled')),
  last_sent_at timestamptz,
  next_reminder_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id, finance_request_id)
);

-- Enable RLS
ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_checklist_items (using correct enum values)
CREATE POLICY "Users can view checklist items for their tenant"
  ON public.document_checklist_items FOR SELECT
  USING (tenant_id IS NULL OR tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage checklist items"
  ON public.document_checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.user_id = auth.uid() 
      AND memberships.tenant_id = document_checklist_items.tenant_id 
      AND memberships.role IN ('platform_admin', 'org_admin')
    )
  );

-- RLS Policies for document_reminders
CREATE POLICY "Users can manage their own reminders"
  ON public.document_reminders FOR ALL
  USING (user_id = auth.uid());

-- Seed standard checklist (tenant_id = NULL for global defaults)
INSERT INTO public.document_checklist_items (tenant_id, checklist_type, category, doc_type, label, is_required, for_employment_type, sort_index) VALUES
-- IDENTITÄT
(NULL, 'applicant', 'identity', 'DOC_ID_CARD', 'Personalausweiskopie (Vorder- & Rückseite)', true, NULL, 1),

-- EINKOMMEN (Angestellte)
(NULL, 'applicant', 'income', 'DOC_PAYSLIP', 'Gehaltsabrechnungen (letzte 3 Monate)', true, 'employed', 10),
(NULL, 'applicant', 'income', 'DOC_PAYSLIP_DEC', 'Gehaltsabrechnung Dezember (Vorjahr)', true, 'employed', 11),
(NULL, 'applicant', 'income', 'DOC_TAX_ASSESSMENT', 'Einkommensteuerbescheid (aktuell)', true, 'employed', 12),
(NULL, 'applicant', 'income', 'DOC_PKV_PROOF', 'PKV-Nachweis (falls zutreffend)', false, 'employed', 13),

-- EINKOMMEN (Selbstständige)
(NULL, 'applicant', 'income', 'DOC_ANNUAL_STATEMENT', 'Jahresabschlüsse (letzte 3 Jahre)', true, 'self_employed', 20),
(NULL, 'applicant', 'income', 'DOC_BWA', 'BWA mit Summen-/Saldenliste (aktuell)', true, 'self_employed', 21),
(NULL, 'applicant', 'income', 'DOC_TAX_DECLARATION', 'Einkommensteuererklärung (aktuell)', true, 'self_employed', 22),
(NULL, 'applicant', 'income', 'DOC_TAX_ASSESSMENTS_2Y', 'Einkommensteuerbescheide (letzte 2 Jahre)', true, 'self_employed', 23),
(NULL, 'applicant', 'income', 'DOC_TRADE_REGISTER', 'Handelsregisterauszug / Gesellschaftsvertrag', true, 'self_employed', 24),

-- VERMÖGEN
(NULL, 'applicant', 'assets', 'DOC_BANK_STATEMENT', 'Konto-/Depotauszüge (Eigenkapitalnachweis)', true, NULL, 30),
(NULL, 'applicant', 'assets', 'DOC_LIFE_INSURANCE', 'Rückkaufswerte Lebensversicherung', false, NULL, 31),
(NULL, 'applicant', 'assets', 'DOC_BUILDING_SOCIETY', 'Jahreskontoauszug Bausparguthaben', false, NULL, 32),
(NULL, 'applicant', 'assets', 'DOC_GIFT_PROOF', 'Schenkungsnachweise (falls zutreffend)', false, NULL, 33),

-- VERPFLICHTUNGEN
(NULL, 'applicant', 'liabilities', 'DOC_LOAN_CONTRACT', 'Darlehensverträge + aktuelle Kontoauszüge', true, NULL, 40),
(NULL, 'applicant', 'liabilities', 'DOC_INSTALLMENT_CREDIT', 'Ratenkredite / Leasing-Verträge', false, NULL, 41),
(NULL, 'applicant', 'liabilities', 'DOC_GUARANTEE', 'Bürgschaftserklärungen', false, NULL, 42),
(NULL, 'applicant', 'liabilities', 'DOC_ALIMONY', 'Unterhaltsurteile / Scheidungsvereinbarung', false, NULL, 43),

-- ALTERSVORSORGE
(NULL, 'applicant', 'retirement', 'DOC_PENSION_INFO', 'Renteninformation (Deutsche Rentenversicherung)', false, NULL, 50),

-- OBJEKTUNTERLAGEN (pro Anfrage)
(NULL, 'request', 'property', 'DOC_EXPOSE', 'Exposé', true, NULL, 100),
(NULL, 'request', 'property', 'DOC_LAND_REGISTER', 'Grundbuchauszug (max. 3 Monate alt)', true, NULL, 101),
(NULL, 'request', 'property', 'DOC_PURCHASE_CONTRACT', 'Kaufvertrag / Entwurf', true, NULL, 102),
(NULL, 'request', 'property', 'DOC_FLOOR_AREA', 'Wohnflächenberechnung', true, NULL, 103),
(NULL, 'request', 'property', 'DOC_FLOOR_PLAN', 'Grundriss mit Maßangaben', true, NULL, 104),
(NULL, 'request', 'property', 'DOC_SECTION_DRAWING', 'Schnittzeichnung (bei Häusern)', false, NULL, 105),
(NULL, 'request', 'property', 'DOC_BUILDING_DESC', 'Baubeschreibung', false, NULL, 106),
(NULL, 'request', 'property', 'DOC_ENERGY_CERT', 'Energieausweis (min. 1 Jahr gültig)', true, NULL, 107),
(NULL, 'request', 'property', 'DOC_SITE_PLAN', 'Lageplan / Flurkarte', true, NULL, 108),
(NULL, 'request', 'property', 'DOC_PHOTOS', 'Farbfotos (Vorder-/Rückseite, Innen)', true, NULL, 109),
(NULL, 'request', 'property', 'DOC_PARTITION_DECL', 'Teilungserklärung (bei ETW)', false, NULL, 110),
(NULL, 'request', 'property', 'DOC_COST_ESTIMATE', 'Kostenaufstellung (bei Neubau/Sanierung)', false, NULL, 111);

-- Indexes
CREATE INDEX idx_checklist_items_type ON public.document_checklist_items(checklist_type, category);
CREATE INDEX idx_reminders_user ON public.document_reminders(user_id, reminder_type);
CREATE INDEX idx_reminders_next ON public.document_reminders(next_reminder_at) WHERE reminder_type != 'disabled';