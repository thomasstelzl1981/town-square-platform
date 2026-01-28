-- Tile API Internal (Interne Endpunkte pro Modul)
CREATE TABLE public.tile_api_internal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_code TEXT NOT NULL REFERENCES public.tile_catalog(tile_code) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  purpose TEXT,
  auth_roles TEXT[],
  req_schema_ref TEXT,
  resp_schema_ref TEXT,
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tile API External (Externe Integrationen pro Modul)
CREATE TABLE public.tile_api_external (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_code TEXT NOT NULL REFERENCES public.tile_catalog(tile_code) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  endpoint TEXT,
  purpose TEXT,
  auth_method TEXT,
  mapping_notes TEXT,
  lifecycle_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tile Changelog (Änderungshistorie)
CREATE TABLE public.tile_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_code TEXT NOT NULL REFERENCES public.tile_catalog(tile_code) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_note TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id)
);

-- Flowchart-Spalte zu tile_catalog hinzufügen
ALTER TABLE public.tile_catalog ADD COLUMN IF NOT EXISTS flowchart_mermaid TEXT;

-- Indices für Performance
CREATE INDEX idx_tile_api_internal_tile ON public.tile_api_internal(tile_code);
CREATE INDEX idx_tile_api_external_tile ON public.tile_api_external(tile_code);
CREATE INDEX idx_tile_changelog_tile ON public.tile_changelog(tile_code);

-- RLS aktivieren
ALTER TABLE public.tile_api_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tile_api_external ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tile_changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Nur Platform Admins können lesen/schreiben
CREATE POLICY "tile_api_internal_platform_admin_all" ON public.tile_api_internal
  FOR ALL USING (public.is_platform_admin());

CREATE POLICY "tile_api_external_platform_admin_all" ON public.tile_api_external
  FOR ALL USING (public.is_platform_admin());

CREATE POLICY "tile_changelog_platform_admin_all" ON public.tile_changelog
  FOR ALL USING (public.is_platform_admin());

-- Update trigger für updated_at
CREATE TRIGGER update_tile_api_internal_updated_at
  BEFORE UPDATE ON public.tile_api_internal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tile_api_external_updated_at
  BEFORE UPDATE ON public.tile_api_external
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();