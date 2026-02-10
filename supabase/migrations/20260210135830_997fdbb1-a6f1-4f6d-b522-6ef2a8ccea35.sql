
-- Phase 1.2: Commissions-Tabelle erweitern (alle neuen Spalten nullable, kein Breaking Change)
ALTER TABLE public.commissions
  ALTER COLUMN pipeline_id DROP NOT NULL;

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS commission_type text,
  ADD COLUMN IF NOT EXISTS liable_user_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS liable_role text,
  ADD COLUMN IF NOT EXISTS gross_commission numeric,
  ADD COLUMN IF NOT EXISTS platform_share_pct numeric DEFAULT 30,
  ADD COLUMN IF NOT EXISTS platform_fee numeric,
  ADD COLUMN IF NOT EXISTS reference_id uuid,
  ADD COLUMN IF NOT EXISTS reference_type text,
  ADD COLUMN IF NOT EXISTS contract_document_id uuid REFERENCES public.documents(id);

-- Indexes fuer neue Spalten (KB.SYSTEM.007)
CREATE INDEX IF NOT EXISTS idx_commissions_commission_type ON public.commissions(commission_type);
CREATE INDEX IF NOT EXISTS idx_commissions_liable_user_id ON public.commissions(liable_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_reference_type_id ON public.commissions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_commission_type ON public.commissions(tenant_id, commission_type);

-- Phase 1.3: Agreement Templates einfuegen (5 Vertragsvorlagen)
INSERT INTO public.agreement_templates (code, title, content, version, is_active, requires_consent, valid_from) VALUES
(
  'FIN_MANDATE_ACCEPTANCE_V1',
  'Finanzierungsmandat-Uebernahme',
  E'VERTRAG ueber die Uebernahme eines Finanzierungsmandats\n\nZwischen:\n  System of a Town GmbH ("Plattform")\nund:\n  {{partner_name}}, {{partner_email}} ("Finance Manager")\n\n1. Gegenstand\nDer Finance Manager uebernimmt das Finanzierungsmandat fuer:\n  Antragsteller: {{applicant_name}}\n  Darlehensbetrag: {{loan_amount}} EUR\n  Referenz: {{mandate_id}}\n\n2. Verguetung\nDie Bearbeitungsprovision des Finance Managers betraegt {{gross_commission_pct}}% des Darlehensbetrags (= {{gross_commission}} EUR).\n\n3. Plattformgebuehr\nDer Finance Manager entrichtet eine Plattformgebuehr von 30% seiner Bearbeitungsprovision (= {{platform_fee}} EUR) an die Plattform.\nFaelligkeit: bei erfolgreicher Auszahlung des Darlehens.\n\n4. Schlussbestimmungen\nDatum: {{date}}\nAkzeptiert digital durch: {{partner_name}}',
  1, true, true, now()
),
(
  'ACQ_MANDATE_ACCEPTANCE_V1',
  'Akquise-Mandat-Uebernahme',
  E'VERTRAG ueber die Uebernahme eines Akquise-Mandats\n\nZwischen:\n  System of a Town GmbH ("Plattform")\nund:\n  {{partner_name}}, {{partner_email}} ("Akquise-Manager")\n\n1. Gegenstand\nDer Akquise-Manager uebernimmt das Suchmandat:\n  Auftraggeber: {{investor_name}}\n  Suchkriterien: {{search_criteria}}\n  Referenz: {{mandate_id}}\n\n2. Verguetung\nDie Akquise-Provision betraegt {{gross_commission_pct}}% (= {{gross_commission}} EUR).\n\n3. Plattformgebuehr\nDer Akquise-Manager entrichtet eine Plattformgebuehr von 30% seiner Akquise-Provision (= {{platform_fee}} EUR) an die Plattform.\nFaelligkeit: bei erfolgreichem Ankauf.\n\n4. Schlussbestimmungen\nDatum: {{date}}\nAkzeptiert digital durch: {{partner_name}}',
  1, true, true, now()
),
(
  'PARTNER_RELEASE_V1',
  'Partner-Netzwerk-Freigabe',
  E'VERTRAG ueber die Freigabe einer Immobilie an das Partner-Netzwerk\n\nZwischen:\n  System of a Town GmbH ("Plattform")\nund:\n  {{owner_name}} ("Eigentuemer")\n\n1. Gegenstand\nDer Eigentuemer gibt folgende Immobilie fuer das Partner-Netzwerk frei:\n  Objekt: {{listing_title}}\n  Angebotspreis: {{asking_price}} EUR\n  Referenz: {{listing_id}}\n\n2. Kaeufer-Provision\nDie vom Kaeufer zu zahlende Provision betraegt {{commission_rate}}% des Kaufpreises (= {{gross_commission}} EUR).\n\n3. Plattformgebuehr\nDer Eigentuemer entrichtet eine Plattformgebuehr von 30% der Kaeufer-Provision (= {{platform_fee}} EUR) an die Plattform.\nFaelligkeit: bei Notartermin.\n\n4. Schlussbestimmungen\nDatum: {{date}}\nAkzeptiert digital durch: {{owner_name}}',
  1, true, true, now()
),
(
  'LEAD_ASSIGNMENT_V1',
  'Lead-Zuweisungsvertrag',
  E'VERTRAG ueber die Zuweisung eines Leads\n\nZwischen:\n  System of a Town GmbH ("Plattform")\nund:\n  {{partner_name}}, {{partner_email}} ("Partner")\n\n1. Gegenstand\nDem Partner wird folgender Lead zugewiesen:\n  Lead: {{lead_name}}\n  Quelle: {{lead_source}}\n  Interesse: {{interest_type}}\n\n2. Verguetung\nDie Provision wird bei erfolgreicher Konversion bestimmt.\n\n3. Plattformgebuehr\nDer Partner entrichtet eine Plattformgebuehr von 30% bei erfolgreicher Konversion an die Plattform.\n\n4. Schlussbestimmungen\nDatum: {{date}}\nAkzeptiert digital durch: {{partner_name}}',
  1, true, true, now()
),
(
  'REFERRAL_AGREEMENT_V1',
  'Tippgeber-Vereinbarung',
  E'TIPPGEBER-VEREINBARUNG\n\nZwischen:\n  System of a Town GmbH ("Plattform")\nund:\n  {{partner_name}}, {{partner_email}} ("Tippgeber")\n\n1. Gegenstand\nDer Tippgeber vermittelt Kontakte und Geschaeftsmoeglichkeiten an die Plattform.\n\n2. Verguetung\nDie Tippgeber-Provision wird fallbezogen vereinbart.\n\n3. Plattformgebuehr\nDer Tippgeber entrichtet eine Plattformgebuehr von 30% seiner Provision an die Plattform.\n\n4. Schlussbestimmungen\nDatum: {{date}}\nAkzeptiert digital durch: {{partner_name}}',
  1, true, true, now()
);
