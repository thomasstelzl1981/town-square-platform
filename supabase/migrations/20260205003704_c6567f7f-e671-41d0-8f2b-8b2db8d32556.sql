-- Add is_blocked column to listings for Zone 1 Sales Desk blocking functionality
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;