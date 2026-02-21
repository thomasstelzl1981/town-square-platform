-- Phase 1: Extend lead_source enum with Zone 3 values
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'kaufy_armstrong';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'kaufy_expose_request';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'futureroom_armstrong';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'sot_demo_booking';