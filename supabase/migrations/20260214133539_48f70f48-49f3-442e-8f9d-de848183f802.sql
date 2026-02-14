-- SIA-0007: Move pg_trgm extension from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop dependent index first
DROP INDEX IF EXISTS public.idx_organizations_path;

-- Move extension
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate index using extensions schema operator class
CREATE INDEX idx_organizations_path ON public.organizations USING gist (materialized_path extensions.gist_trgm_ops);