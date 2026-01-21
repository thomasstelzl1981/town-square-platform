-- =====================================================
-- TILE CATALOG & TENANT ACTIVATION SYSTEM
-- Central control for Zone 2 module rendering
-- =====================================================

-- Tile Catalog: Definitive list of all Zone 2 modules
CREATE TABLE public.tile_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tile_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon_key TEXT NOT NULL DEFAULT 'layout-grid',
  zone INTEGER NOT NULL DEFAULT 2 CHECK (zone = 2),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Main tile definition
  main_tile_title TEXT NOT NULL,
  main_tile_route TEXT NOT NULL,
  
  -- Exactly 4 sub-tiles (JSONB array with title, route, icon_key)
  sub_tiles JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: sub_tiles must have exactly 4 entries
  CONSTRAINT sub_tiles_count CHECK (jsonb_array_length(sub_tiles) = 4)
);

-- Tenant Tile Activation: Per-tenant module activation
CREATE TABLE public.tenant_tile_activation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tile_code TEXT NOT NULL REFERENCES public.tile_catalog(tile_code) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Audit fields
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_by UUID REFERENCES auth.users(id),
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one activation per tenant per tile
  UNIQUE(tenant_id, tile_code)
);

-- Updated_at trigger for tile_catalog
CREATE TRIGGER update_tile_catalog_updated_at
  BEFORE UPDATE ON public.tile_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Updated_at trigger for tenant_tile_activation
CREATE TRIGGER update_tenant_tile_activation_updated_at
  BEFORE UPDATE ON public.tenant_tile_activation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.tile_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_tile_activation ENABLE ROW LEVEL SECURITY;

-- tile_catalog: Read by all authenticated, write by platform_admin only
CREATE POLICY "tile_catalog_select_authenticated"
  ON public.tile_catalog FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tile_catalog_insert_platform_admin"
  ON public.tile_catalog FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "tile_catalog_update_platform_admin"
  ON public.tile_catalog FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "tile_catalog_delete_platform_admin"
  ON public.tile_catalog FOR DELETE
  USING (is_platform_admin());

-- tenant_tile_activation: Scoped to tenant members + platform_admin
CREATE POLICY "tta_select_member"
  ON public.tenant_tile_activation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.user_id = auth.uid() 
      AND m.tenant_id = tenant_tile_activation.tenant_id
    )
  );

CREATE POLICY "tta_select_platform_admin"
  ON public.tenant_tile_activation FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "tta_insert_platform_admin"
  ON public.tenant_tile_activation FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "tta_update_platform_admin"
  ON public.tenant_tile_activation FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "tta_delete_platform_admin"
  ON public.tenant_tile_activation FOR DELETE
  USING (is_platform_admin());

-- Org admins can also manage activations for their own tenant
CREATE POLICY "tta_insert_org_admin"
  ON public.tenant_tile_activation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = tenant_tile_activation.tenant_id
      AND m.role = 'org_admin'
    )
  );

CREATE POLICY "tta_update_org_admin"
  ON public.tenant_tile_activation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
      AND m.tenant_id = tenant_tile_activation.tenant_id
      AND m.role = 'org_admin'
    )
  );

-- =====================================================
-- SEED DEFAULT TILE CATALOG
-- =====================================================

INSERT INTO public.tile_catalog (tile_code, title, description, icon_key, display_order, main_tile_title, main_tile_route, sub_tiles) VALUES
(
  'immobilien',
  'Immobilien',
  'Portfolio-Verwaltung und Objektdaten',
  'building-2',
  1,
  'Portfolio',
  '/portal/immobilien',
  '[
    {"title": "Objekte", "route": "/portal/immobilien/objekte", "icon_key": "home"},
    {"title": "Verwaltung", "route": "/portal/immobilien/verwaltung", "icon_key": "settings"},
    {"title": "Vertrieb", "route": "/portal/immobilien/vertrieb", "icon_key": "trending-up"},
    {"title": "Dokumente", "route": "/portal/immobilien/dokumente", "icon_key": "file-text"}
  ]'::jsonb
),
(
  'kaufy',
  'Kaufy',
  'Vertrieb und Verkaufsprozesse',
  'shopping-cart',
  2,
  'Vertrieb',
  '/portal/kaufy',
  '[
    {"title": "Angebote", "route": "/portal/kaufy/angebote", "icon_key": "file-plus"},
    {"title": "Reservierungen", "route": "/portal/kaufy/reservierungen", "icon_key": "calendar-check"},
    {"title": "Pipeline", "route": "/portal/kaufy/pipeline", "icon_key": "git-branch"},
    {"title": "Abschlüsse", "route": "/portal/kaufy/abschluesse", "icon_key": "check-circle"}
  ]'::jsonb
),
(
  'miety',
  'Miety',
  'Mieterportal und Mietverwaltung',
  'users',
  3,
  'Mieter',
  '/portal/miety',
  '[
    {"title": "Mietverträge", "route": "/portal/miety/vertraege", "icon_key": "file-signature"},
    {"title": "Kommunikation", "route": "/portal/miety/kommunikation", "icon_key": "message-circle"},
    {"title": "Anfragen", "route": "/portal/miety/anfragen", "icon_key": "help-circle"},
    {"title": "Dokumente", "route": "/portal/miety/dokumente", "icon_key": "folder"}
  ]'::jsonb
),
(
  'dokumente',
  'Dokumente',
  'Dokumentenmanagement und Archiv',
  'folder-open',
  4,
  'Dokumente',
  '/portal/dokumente',
  '[
    {"title": "Ablage", "route": "/portal/dokumente/ablage", "icon_key": "archive"},
    {"title": "Vorlagen", "route": "/portal/dokumente/vorlagen", "icon_key": "file-copy"},
    {"title": "Freigaben", "route": "/portal/dokumente/freigaben", "icon_key": "share-2"},
    {"title": "Suche", "route": "/portal/dokumente/suche", "icon_key": "search"}
  ]'::jsonb
),
(
  'kommunikation',
  'Kommunikation',
  'Nachrichten und Benachrichtigungen',
  'mail',
  5,
  'Kommunikation',
  '/portal/kommunikation',
  '[
    {"title": "Posteingang", "route": "/portal/kommunikation/eingang", "icon_key": "inbox"},
    {"title": "Postausgang", "route": "/portal/kommunikation/ausgang", "icon_key": "send"},
    {"title": "Kampagnen", "route": "/portal/kommunikation/kampagnen", "icon_key": "megaphone"},
    {"title": "Vorlagen", "route": "/portal/kommunikation/vorlagen", "icon_key": "layout"}
  ]'::jsonb
),
(
  'services',
  'Services',
  'Aufgaben und Serviceanfragen',
  'wrench',
  6,
  'Services',
  '/portal/services',
  '[
    {"title": "Aufgaben", "route": "/portal/services/aufgaben", "icon_key": "check-square"},
    {"title": "Tickets", "route": "/portal/services/tickets", "icon_key": "ticket"},
    {"title": "Kalender", "route": "/portal/services/kalender", "icon_key": "calendar"},
    {"title": "Team", "route": "/portal/services/team", "icon_key": "users"}
  ]'::jsonb
),
(
  'einstellungen',
  'Einstellungen',
  'Benutzereinstellungen und Integrationen',
  'settings',
  7,
  'Einstellungen',
  '/portal/einstellungen',
  '[
    {"title": "Profil", "route": "/portal/einstellungen/profil", "icon_key": "user"},
    {"title": "Benachrichtigungen", "route": "/portal/einstellungen/benachrichtigungen", "icon_key": "bell"},
    {"title": "Integrationen", "route": "/portal/einstellungen/integrationen", "icon_key": "plug"},
    {"title": "Sicherheit", "route": "/portal/einstellungen/sicherheit", "icon_key": "shield"}
  ]'::jsonb
);