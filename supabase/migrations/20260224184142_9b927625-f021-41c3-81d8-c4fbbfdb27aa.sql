
-- Service Shop Products (generalized table for all service modules)
CREATE TABLE public.service_shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_key TEXT NOT NULL,
  category TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_label TEXT,
  price_cents INTEGER,
  image_url TEXT,
  external_url TEXT,
  affiliate_tag TEXT,
  affiliate_network TEXT,
  badge TEXT,
  sub_category TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service Shop Config (affiliate placeholder)
CREATE TABLE public.service_shop_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_key TEXT UNIQUE NOT NULL,
  display_name TEXT,
  affiliate_network TEXT,
  api_credentials JSONB,
  is_connected BOOLEAN DEFAULT false,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance index
CREATE INDEX idx_service_shop_products_key_active ON public.service_shop_products (shop_key, is_active, sort_order);

-- RLS
ALTER TABLE public.service_shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_shop_config ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated
CREATE POLICY "Authenticated users can read products"
  ON public.service_shop_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read config"
  ON public.service_shop_config FOR SELECT TO authenticated USING (true);

-- Write: platform_admin only
CREATE POLICY "Admins can insert products"
  ON public.service_shop_products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can update products"
  ON public.service_shop_products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can delete products"
  ON public.service_shop_products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can manage config"
  ON public.service_shop_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));
