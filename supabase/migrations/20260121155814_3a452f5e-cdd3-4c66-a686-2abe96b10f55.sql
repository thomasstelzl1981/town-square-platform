-- =============================================
-- MIGRATION 3A: ENUM ERWEITERUNGEN
-- Phase 1.4A: org_type + membership_role erweitern
-- =============================================

ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'renter';
ALTER TYPE membership_role ADD VALUE IF NOT EXISTS 'renter_user';