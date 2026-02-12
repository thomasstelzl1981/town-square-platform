
-- Insert agreement template for Finance Tipp commission agreement
INSERT INTO public.agreement_templates (code, title, content, version, is_active, requires_consent, valid_from)
VALUES (
  'FINANCE_TIPP_AGREEMENT',
  'Tippgeber-Provisionsvereinbarung',
  E'## Tippgeber-Provisionsvereinbarung\n\nAls verifizierter Finanzierungsmanager auf der Plattform System of a Town verpflichte ich mich, 25% der Finanzierungsprovision (Brutto) als Tippgeberprovision an System of a Town abzuführen.\n\n### Konditionen\n\n- **Provisionsanteil:** 25% der Brutto-Finanzierungsprovision\n- **Fälligkeit:** Mit Auszahlung der Finanzierungsprovision durch das finanzierende Institut\n- **Abrechnung:** Monatliche Abrechnung über die Plattform\n\n### Geltungsbereich\n\nDiese Vereinbarung gilt für alle über die Plattform vermittelten Finanzierungsmandate.\n\nDurch Akzeptieren dieser Vereinbarung bestätige ich die vorstehenden Konditionen.',
  1,
  true,
  true,
  now()
)
ON CONFLICT DO NOTHING;
