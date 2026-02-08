-- 1. Alte CHECK CONSTRAINT entfernen
ALTER TABLE public.property_features 
DROP CONSTRAINT IF EXISTS property_features_feature_code_check;

-- 2. Neue CHECK CONSTRAINT mit erweiterten Werten erstellen
ALTER TABLE public.property_features 
ADD CONSTRAINT property_features_feature_code_check 
CHECK (feature_code IN (
  'verkaufsauftrag',
  'kaufy_sichtbarkeit', 
  'immoscout24',
  'msv', 
  'kaufy', 
  'website_visibility'
));