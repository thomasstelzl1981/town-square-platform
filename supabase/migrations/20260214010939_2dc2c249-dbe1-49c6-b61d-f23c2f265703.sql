
-- Add BIC column to msv_bank_accounts
ALTER TABLE msv_bank_accounts ADD COLUMN IF NOT EXISTS bic text;

-- Seed 5 MSV text templates (tenant_id NULL = global defaults)
INSERT INTO msv_templates (template_code, title, content, placeholders, is_active, locale)
VALUES
(
  'ZAHLUNGSERINNERUNG',
  'Zahlungserinnerung (Stufe 1)',
  E'Hallo {ANREDE} {NACHNAME},\n\nich hoffe, es geht Ihnen gut. Laut unserer Übersicht ist die Miete für {MONAT_JAHR} für die Einheit {UNIT_ID} ({ADRESSE_KURZ}) noch nicht als Zahlung eingegangen.\n\nOffener Betrag: {OFFENER_BETRAG}\nFälligkeitsmonat: {MONAT_JAHR}\n\nBitte prüfen Sie dies kurz. Falls die Überweisung bereits erfolgt ist, können Sie diese Nachricht als gegenstandslos betrachten.\n\nWenn die Zahlung noch aussteht, bitten wir um Überweisung bis spätestens {FRISTDATUM}.\n\nZahlungsdaten:\nEmpfänger: {EMPFAENGER_NAME}\nIBAN: {IBAN}\nBIC: {BIC}\nVerwendungszweck: {VERWENDUNGSZWECK}\n\nVielen Dank und freundliche Grüße\n{ABSENDER_NAME}\n{ABSENDER_FUNKTION}\n{ABSENDER_KONTAKT}\n\nHinweis: Diese Nachricht wurde automatisiert aus unserer Mietübersicht erstellt. Bitte prüfen Sie die Angaben bei Unklarheiten.',
  '["ANREDE","NACHNAME","MONAT_JAHR","UNIT_ID","ADRESSE_KURZ","OFFENER_BETRAG","FRISTDATUM","EMPFAENGER_NAME","IBAN","BIC","VERWENDUNGSZWECK","ABSENDER_NAME","ABSENDER_FUNKTION","ABSENDER_KONTAKT"]'::jsonb,
  true,
  'de'
),
(
  'MAHNUNG',
  'Mahnung (Stufe 2)',
  E'Sehr geehrte/r {ANREDE} {NACHNAME},\n\ntrotz unserer Zahlungserinnerung vom {DATUM_STUFE1} ist die Mietzahlung für {MONAT_JAHR} für die Einheit {UNIT_ID} ({ADRESSE_KURZ}) bislang nicht vollständig eingegangen.\n\nOffener Betrag: {OFFENER_BETRAG}\nUrsprüngliche Fälligkeit: {FAELLIGKEITSDATUM}\n\nWir bitten Sie, den offenen Betrag bis spätestens {FRISTDATUM} auszugleichen oder uns kurzfristig zu kontaktieren, falls es Rückfragen gibt.\n\nZahlungsdaten:\nEmpfänger: {EMPFAENGER_NAME}\nIBAN: {IBAN}\nBIC: {BIC}\nVerwendungszweck: {VERWENDUNGSZWECK}\n\nMit freundlichen Grüßen\n{ABSENDER_NAME}\n{ABSENDER_FUNKTION}\n{ABSENDER_KONTAKT}\n\nHinweis: Dieses Schreiben ist eine standardisierte Mahnvorlage. Bitte prüfen Sie die Inhalte vor Versand. Keine Rechtsberatung.',
  '["ANREDE","NACHNAME","DATUM_STUFE1","MONAT_JAHR","UNIT_ID","ADRESSE_KURZ","OFFENER_BETRAG","FAELLIGKEITSDATUM","FRISTDATUM","EMPFAENGER_NAME","IBAN","BIC","VERWENDUNGSZWECK","ABSENDER_NAME","ABSENDER_FUNKTION","ABSENDER_KONTAKT"]'::jsonb,
  true,
  'de'
),
(
  'LETZTE_MAHNUNG',
  'Letzte Mahnung / Fristsetzung (Stufe 3)',
  E'Sehr geehrte/r {ANREDE} {NACHNAME},\n\nleider ist die Mietzahlung für {MONAT_JAHR} für die Einheit {UNIT_ID} ({ADRESSE_KURZ}) weiterhin nicht vollständig eingegangen.\n\nOffener Betrag: {OFFENER_BETRAG}\nBisherige Kontaktversuche:\n- Zahlungserinnerung vom {DATUM_STUFE1}\n- Mahnung vom {DATUM_STUFE2}\n\nWir setzen Ihnen hiermit eine letzte Frist zur Zahlung bis spätestens {FRISTDATUM}.\nBitte kontaktieren Sie uns umgehend, falls Sie Rückfragen haben oder eine Klärung erforderlich ist.\n\nZahlungsdaten:\nEmpfänger: {EMPFAENGER_NAME}\nIBAN: {IBAN}\nBIC: {BIC}\nVerwendungszweck: {VERWENDUNGSZWECK}\n\nFreundliche Grüße\n{ABSENDER_NAME}\n{ABSENDER_FUNKTION}\n{ABSENDER_KONTAKT}\n\nHinweis: Dieses Schreiben ist eine standardisierte Vorlage. Bitte prüfen Sie die Angaben vor Versand. Keine Rechtsberatung.',
  '["ANREDE","NACHNAME","MONAT_JAHR","UNIT_ID","ADRESSE_KURZ","OFFENER_BETRAG","DATUM_STUFE1","DATUM_STUFE2","FRISTDATUM","EMPFAENGER_NAME","IBAN","BIC","VERWENDUNGSZWECK","ABSENDER_NAME","ABSENDER_FUNKTION","ABSENDER_KONTAKT"]'::jsonb,
  true,
  'de'
),
(
  'MIETERHOEHUNG',
  'Mieterhöhungsschreiben',
  E'Hallo {ANREDE} {NACHNAME},\n\nwir prüfen turnusmäßig die Mietkonditionen für die Einheit {UNIT_ID} ({ADRESSE_KURZ}).\nDie letzte dokumentierte Anpassung liegt vom {DATUM_LETZTE_MIETERHOEHUNG}.\n\nWir möchten die monatliche Miete ab {WIRKSAM_AB} wie folgt anpassen:\n\nBisherige Miete: {MIETE_ALT}\nNeue Miete: {MIETE_NEU}\nÄnderung: {DIFFERENZ}\n\nBitte geben Sie uns bis spätestens {FRISTDATUM} eine kurze Rückmeldung.\nWenn Sie Fragen haben oder eine Klärung wünschen, melden Sie sich gern – wir besprechen das unkompliziert.\n\nFreundliche Grüße\n{ABSENDER_NAME}\n{ABSENDER_FUNKTION}\n{ABSENDER_KONTAKT}\n\nHinweis: Dieses Schreiben ist eine standardisierte Vorlage. Bitte prüfen Sie die Angaben vor Versand. Keine Rechtsberatung.',
  '["ANREDE","NACHNAME","UNIT_ID","ADRESSE_KURZ","DATUM_LETZTE_MIETERHOEHUNG","WIRKSAM_AB","MIETE_ALT","MIETE_NEU","DIFFERENZ","FRISTDATUM","ABSENDER_NAME","ABSENDER_FUNKTION","ABSENDER_KONTAKT"]'::jsonb,
  true,
  'de'
),
(
  'KONTAKT_RUECKFRAGE',
  'Rückfrage zur Miete',
  E'Hallo {ANREDE} {NACHNAME},\nkurze Rückfrage: Wir sehen aktuell noch keinen vollständigen Zahlungseingang für {MONAT_JAHR}. Können Sie kurz bestätigen, ob die Zahlung bereits veranlasst wurde?\n\nDanke & viele Grüße\n{ABSENDER_NAME}',
  '["ANREDE","NACHNAME","MONAT_JAHR","ABSENDER_NAME"]'::jsonb,
  true,
  'de'
)
ON CONFLICT DO NOTHING;

-- Create analytics tables for MOD-18
CREATE TABLE IF NOT EXISTS analytics_budget_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid,
  category text NOT NULL,
  monthly_target numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_budget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budget settings"
  ON analytics_budget_settings FOR ALL
  USING (tenant_id IN (SELECT id FROM organizations WHERE id = tenant_id));

CREATE TABLE IF NOT EXISTS analytics_category_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  merchant_pattern text NOT NULL,
  category text NOT NULL,
  confirmed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_category_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their category overrides"
  ON analytics_category_overrides FOR ALL
  USING (tenant_id IN (SELECT id FROM organizations WHERE id = tenant_id));

CREATE TABLE IF NOT EXISTS analytics_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid,
  widget_key text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their analytics notes"
  ON analytics_notes FOR ALL
  USING (tenant_id IN (SELECT id FROM organizations WHERE id = tenant_id));
