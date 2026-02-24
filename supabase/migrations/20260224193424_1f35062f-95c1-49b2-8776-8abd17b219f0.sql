-- Add metadata_schema column to service_shop_config
ALTER TABLE service_shop_config ADD COLUMN IF NOT EXISTS metadata_schema JSONB DEFAULT '[]'::jsonb;