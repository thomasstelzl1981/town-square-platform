
-- Extend category check to include brand-specific categories
ALTER TABLE public.armstrong_knowledge_items 
DROP CONSTRAINT armstrong_knowledge_items_category_check;

ALTER TABLE public.armstrong_knowledge_items 
ADD CONSTRAINT armstrong_knowledge_items_category_check 
CHECK (category IN ('system', 'real_estate', 'tax_legal', 'finance', 'sales', 'templates', 'research', 'photovoltaik', 'ncore', 'otto', 'kaufy', 'futureroom', 'acquiary', 'lennox', 'sot', 'brand_persona'));

-- Extend content_type check to include instruction type
ALTER TABLE public.armstrong_knowledge_items 
DROP CONSTRAINT armstrong_knowledge_items_content_type_check;

ALTER TABLE public.armstrong_knowledge_items 
ADD CONSTRAINT armstrong_knowledge_items_content_type_check 
CHECK (content_type IN ('article', 'playbook', 'checklist', 'script', 'faq', 'research_memo', 'instruction'));

-- Extend scope check to include brand scope
ALTER TABLE public.armstrong_knowledge_items 
DROP CONSTRAINT armstrong_knowledge_items_scope_check;

ALTER TABLE public.armstrong_knowledge_items 
ADD CONSTRAINT armstrong_knowledge_items_scope_check 
CHECK (scope IN ('global', 'tenant', 'brand'));
