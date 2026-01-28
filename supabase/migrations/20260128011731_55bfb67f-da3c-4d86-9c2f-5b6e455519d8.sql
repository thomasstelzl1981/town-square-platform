-- ============================================================================
-- PHASE 1A: ENUM-ERWEITERUNG finance_manager
-- ============================================================================
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'finance_manager';