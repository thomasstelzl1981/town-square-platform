
ALTER TABLE armstrong_knowledge_items DROP CONSTRAINT armstrong_knowledge_items_category_check;
ALTER TABLE armstrong_knowledge_items ADD CONSTRAINT armstrong_knowledge_items_category_check 
  CHECK (category = ANY (ARRAY['system', 'real_estate', 'tax_legal', 'finance', 'sales', 'templates', 'research', 'photovoltaik']));
