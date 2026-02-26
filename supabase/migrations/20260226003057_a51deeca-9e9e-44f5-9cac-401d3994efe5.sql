
-- Expand landing_pages table for project landing page template
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS highlights_json jsonb DEFAULT '[]';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS advisor_ids uuid[] DEFAULT '{}';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS footer_company_name text;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS footer_address text;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS imprint_text text;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS privacy_text text;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS custom_domain text;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS domain_status text DEFAULT 'none';
