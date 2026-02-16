
-- Add category, current_balance, balance_date to vorsorge_contracts
ALTER TABLE vorsorge_contracts ADD COLUMN category text NOT NULL DEFAULT 'vorsorge';
ALTER TABLE vorsorge_contracts ADD COLUMN current_balance numeric DEFAULT NULL;
ALTER TABLE vorsorge_contracts ADD COLUMN balance_date date DEFAULT NULL;
