-- Add new SLC phases to the slc_phase enum (K1: Phase-Mismatch fix)
-- These must be added BEFORE mandate_active in logical order

ALTER TYPE public.slc_phase ADD VALUE IF NOT EXISTS 'captured' BEFORE 'mandate_active';
ALTER TYPE public.slc_phase ADD VALUE IF NOT EXISTS 'readiness_check' BEFORE 'mandate_active';
ALTER TYPE public.slc_phase ADD VALUE IF NOT EXISTS 'finance_submitted' AFTER 'reserved';

-- Add new SLC event types to sales_lifecycle_events event_type 
-- (event_type is text, no enum change needed)

-- Also add deal.settlement_pending and case.stuck_detected as recognized event types
-- (these are text columns, so no schema change needed)