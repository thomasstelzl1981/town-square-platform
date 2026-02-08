-- Add config JSONB column to property_features for storing feature-specific configuration
ALTER TABLE public.property_features 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.property_features.config IS 
  'Feature-spezifische Konfiguration (z.B. commission_rate für verkaufsauftrag)';