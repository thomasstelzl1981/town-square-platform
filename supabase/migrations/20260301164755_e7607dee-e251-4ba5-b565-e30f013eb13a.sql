
-- Add brand_key column to armstrong_knowledge_items for brand-scoped knowledge
ALTER TABLE public.armstrong_knowledge_items
ADD COLUMN IF NOT EXISTS brand_key TEXT DEFAULT NULL;

-- Create index for fast brand-scoped lookups
CREATE INDEX IF NOT EXISTS idx_armstrong_knowledge_items_brand_key 
ON public.armstrong_knowledge_items (brand_key) 
WHERE brand_key IS NOT NULL;

-- Create composite index for sync queries (brand_key + status + category)
CREATE INDEX IF NOT EXISTS idx_armstrong_knowledge_items_brand_status
ON public.armstrong_knowledge_items (brand_key, status, category);

-- Add a phone_prompt_priority column to control ordering in prompt assembly
ALTER TABLE public.armstrong_knowledge_items
ADD COLUMN IF NOT EXISTS phone_prompt_priority INTEGER DEFAULT 50;

COMMENT ON COLUMN public.armstrong_knowledge_items.brand_key IS 'Brand key (ncore, kaufy, otto, etc.). NULL = global knowledge available to all brands.';
COMMENT ON COLUMN public.armstrong_knowledge_items.phone_prompt_priority IS 'Priority for phone prompt assembly. Lower = higher priority. Default 50.';
