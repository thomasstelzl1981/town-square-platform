-- Add new columns to social_templates for post creation and approval workflow
ALTER TABLE public.social_templates
  ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_audience jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS campaign_defaults jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- Add description column for post text
ALTER TABLE public.social_templates
  ADD COLUMN IF NOT EXISTS description text;