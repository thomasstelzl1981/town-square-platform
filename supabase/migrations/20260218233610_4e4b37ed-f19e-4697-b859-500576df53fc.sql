-- Agreement Templates für Systemgebühr (Immo + Akquise)
-- Finance-Template existiert bereits als FINANCE_TIPP_AGREEMENT

INSERT INTO public.agreement_templates (code, title, content, version, is_active, requires_consent, valid_from)
VALUES
  (
    'IMMO_SYSTEM_FEE_AGREEMENT',
    'Systemgebühr-Vereinbarung Immobilienmanager',
    'Als Immobilienmanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats wird eine erfolgsabhängige Systemgebühr in Höhe von 25% Ihrer Netto-Provision fällig. Diese Gebühr deckt die Bereitstellung der Plattform, Lead-Generierung und technische Infrastruktur ab.',
    1,
    true,
    true,
    now()
  ),
  (
    'ACQ_SYSTEM_FEE_AGREEMENT',
    'Systemgebühr-Vereinbarung Akquisemanager',
    'Als Akquisemanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats wird eine erfolgsabhängige Systemgebühr in Höhe von 25% Ihrer Netto-Provision fällig. Diese Gebühr deckt die Bereitstellung der Plattform, Lead-Generierung und technische Infrastruktur ab.',
    1,
    true,
    true,
    now()
  )
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_active = true,
  updated_at = now();

-- Update Finance Template Text (korrigierte Terminologie)
UPDATE public.agreement_templates
SET 
  title = 'Systemgebühr-Vereinbarung Finanzierungsmanager',
  content = 'Als Finanzierungsmanager nutzen Sie die Plattform von System of a Town für Lead-Zulieferung, CRM und operative Tools. Bei erfolgreichem Abschluss eines Mandats wird eine erfolgsabhängige Systemgebühr in Höhe von 25% Ihrer Netto-Provision fällig. Diese Gebühr deckt die Bereitstellung der Plattform, Lead-Generierung und technische Infrastruktur ab.',
  updated_at = now()
WHERE code = 'FINANCE_TIPP_AGREEMENT';
