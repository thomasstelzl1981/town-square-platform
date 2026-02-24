
-- Add desk column to contact_staging for desk-specific contact books
ALTER TABLE contact_staging ADD COLUMN IF NOT EXISTS desk TEXT DEFAULT 'acquiary';
CREATE INDEX IF NOT EXISTS idx_contact_staging_desk ON contact_staging(desk);

-- Add desk column to soat_search_orders for desk-specific search orders
ALTER TABLE soat_search_orders ADD COLUMN IF NOT EXISTS desk TEXT DEFAULT 'acquiary';
CREATE INDEX IF NOT EXISTS idx_soat_search_orders_desk ON soat_search_orders(desk);
