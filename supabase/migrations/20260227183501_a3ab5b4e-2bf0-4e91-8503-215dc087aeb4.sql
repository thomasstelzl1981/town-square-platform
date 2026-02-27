-- Add new lead sources for Ncore and Otto² Advisory
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'ncore_projekt';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'ncore_kooperation';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'otto_advisory_kontakt';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'otto_advisory_finanzierung';