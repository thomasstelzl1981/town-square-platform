-- ================================================================================
-- Migration: Erweiterte Steuerbasis für Vermietereinheiten und Selbstauskunft
-- ================================================================================

-- 1) Neue Spalte tax_assessment_type in landlord_contexts (EINZEL/SPLITTING)
-- Die Spalte existiert möglicherweise schon unter tax_regime, aber wir brauchen 
-- eine dedizierte Spalte für die Veranlagungsart
ALTER TABLE public.landlord_contexts 
ADD COLUMN IF NOT EXISTS tax_assessment_type text;

-- Kommentar hinzufügen
COMMENT ON COLUMN public.landlord_contexts.tax_assessment_type IS 'Veranlagungsart: EINZEL oder SPLITTING';

-- 2) Erweiterung applicant_profiles für MOD-07 Spiegelung
-- Neue Spalten für Steuer-Daten (Spiegelung von Vermietereinheit)
ALTER TABLE public.applicant_profiles 
ADD COLUMN IF NOT EXISTS taxable_income_yearly numeric;

ALTER TABLE public.applicant_profiles 
ADD COLUMN IF NOT EXISTS church_tax boolean DEFAULT false;

ALTER TABLE public.applicant_profiles 
ADD COLUMN IF NOT EXISTS tax_assessment_type text;

ALTER TABLE public.applicant_profiles 
ADD COLUMN IF NOT EXISTS marginal_tax_rate numeric;

-- Kommentare
COMMENT ON COLUMN public.applicant_profiles.taxable_income_yearly IS 'Zu versteuerndes Einkommen (zVE) jährlich';
COMMENT ON COLUMN public.applicant_profiles.church_tax IS 'Kirchensteuerpflicht';
COMMENT ON COLUMN public.applicant_profiles.tax_assessment_type IS 'Veranlagungsart: EINZEL oder SPLITTING';
COMMENT ON COLUMN public.applicant_profiles.marginal_tax_rate IS 'Berechneter Grenzsteuersatz (dezimal, z.B. 0.42 für 42%)';