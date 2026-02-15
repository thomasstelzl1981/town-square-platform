ALTER TABLE leases ADD COLUMN linked_bank_account_id UUID REFERENCES msv_bank_accounts(id);
ALTER TABLE leases ADD COLUMN auto_match_enabled BOOLEAN DEFAULT false;