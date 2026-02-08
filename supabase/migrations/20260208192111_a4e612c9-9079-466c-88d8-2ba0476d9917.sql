-- Migration: Verkaufsauftrag Feature-Codes und Agreement-Template
-- ================================================================

-- 1. MSV-Einträge entfernen (Freemium, kein Toggle nötig)
DELETE FROM property_features WHERE feature_code = 'msv';

-- 2. Kaufy → Verkaufsauftrag umbenennen
UPDATE property_features 
SET feature_code = 'verkaufsauftrag' 
WHERE feature_code = 'kaufy';

-- 3. website_visibility → kaufy_sichtbarkeit umbenennen
UPDATE property_features 
SET feature_code = 'kaufy_sichtbarkeit' 
WHERE feature_code = 'website_visibility';

-- 4. Neues Agreement-Template für Verkaufsauftrag (SALES_MANDATE_V2)
INSERT INTO agreement_templates (
  code,
  version,
  title,
  content,
  requires_consent,
  is_active,
  valid_from
) VALUES (
  'SALES_MANDATE_V2',
  2,
  'Verkaufsauftrag zur Immobilienvermarktung',
  'Mit diesem Auftrag erteilen Sie der System of a Town GmbH den Auftrag, Ihre Immobilie über das Kapitalanlage-Vertriebsnetzwerk zu vermarkten. Bei erfolgreicher Vermittlung wird eine Systemgebühr von 2.000 € netto fällig.

Leistungsumfang:
- Erstellung und Optimierung des Verkaufsexposés
- Verteilung an geprüfte Kapitalanlage-Vertriebspartner
- Anfragenmanagement und Qualifizierung
- Unterstützung bis zum Notartermin

Kosten:
- Käufer-Provision: Wird vom Käufer getragen (konfigurierbarer Prozentsatz)
- Systemgebühr: 2.000 € netto bei erfolgreichem Abschluss',
  true,
  true,
  now()
) ON CONFLICT (code) DO UPDATE SET
  version = EXCLUDED.version,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  requires_consent = EXCLUDED.requires_consent,
  is_active = EXCLUDED.is_active;

-- 5. Agreement-Template für Datenrichtigkeit
INSERT INTO agreement_templates (
  code,
  version,
  title,
  content,
  requires_consent,
  is_active,
  valid_from
) VALUES (
  'DATA_ACCURACY_CONSENT',
  1,
  'Bestätigung der Datenrichtigkeit',
  'Ich bestätige hiermit, dass alle im Exposé enthaltenen Angaben zu meiner Immobilie nach bestem Wissen und Gewissen korrekt und vollständig sind.',
  true,
  true,
  now()
) ON CONFLICT (code) DO UPDATE SET
  version = EXCLUDED.version,
  title = EXCLUDED.title,
  content = EXCLUDED.content;

-- 6. Agreement-Template für Systemgebühr
INSERT INTO agreement_templates (
  code,
  version,
  title,
  content,
  requires_consent,
  is_active,
  valid_from
) VALUES (
  'SYSTEM_SUCCESS_FEE',
  1,
  'Erfolgsgebühr bei Vermittlung',
  'Ich akzeptiere die Systemgebühr von 2.000 € netto, die bei erfolgreicher Vermittlung (Notartermin) fällig wird.',
  true,
  true,
  now()
) ON CONFLICT (code) DO UPDATE SET
  version = EXCLUDED.version,
  title = EXCLUDED.title,
  content = EXCLUDED.content;