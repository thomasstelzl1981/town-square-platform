
-- ═══════════════════════════════════════════════════════════
-- pet_shop_products — SSOT für alle Shop-Produkte (Z1/Z2/Z3)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.pet_shop_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  price_label text,
  price_cents integer,
  image_url text,
  external_url text,
  badge text,
  sub_category text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Constraint: valid categories
ALTER TABLE public.pet_shop_products
  ADD CONSTRAINT pet_shop_products_category_check
  CHECK (category IN ('ernaehrung', 'lennox_tracker', 'lennox_style', 'fressnapf'));

-- Index for category lookups
CREATE INDEX idx_pet_shop_products_category ON public.pet_shop_products (category, sort_order);
CREATE INDEX idx_pet_shop_products_active ON public.pet_shop_products (is_active, category);

-- Timestamp trigger
CREATE TRIGGER update_pet_shop_products_updated_at
  BEFORE UPDATE ON public.pet_shop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══ RLS ═══
ALTER TABLE public.pet_shop_products ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users (Z2 Portal + Z3 Website)
CREATE POLICY "Authenticated users can read shop products"
  ON public.pet_shop_products FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anon read for Z3 website (public shop)
CREATE POLICY "Anon users can read active shop products"
  ON public.pet_shop_products FOR SELECT
  TO anon
  USING (is_active = true);

-- INSERT/UPDATE/DELETE: only platform_admin
CREATE POLICY "Platform admins can insert shop products"
  ON public.pet_shop_products FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update shop products"
  ON public.pet_shop_products FOR UPDATE
  TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete shop products"
  ON public.pet_shop_products FOR DELETE
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- ═══ SEED: Lakefields (Ernährung) ═══
INSERT INTO public.pet_shop_products (category, name, description, price_label, price_cents, image_url, external_url, sub_category, badge, sort_order) VALUES
  ('ernaehrung', 'Nassfutter-Menü Wild (400 g)', 'Hochwertiges Nassfutter mit Wild', '3,89 €', 389, 'https://lakefields.b-cdn.net/media/f3/de/f5/1761171770/nassfutter-wild-adult-lf-an1140_17611717700602593.webp?ts=1761171770', 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Wild-400-g', 'Nassfutter', NULL, 1),
  ('ernaehrung', 'Nassfutter-Menü Rind (400 g)', 'Naturbelassenes Rindfleisch-Menü', '3,69 €', 369, 'https://lakefields.b-cdn.net/media/04/bc/54/1761171799/nassfutter-rind-adult-lf-an2140_17611717992052295.webp?ts=1761171799', 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Rind-400-g', 'Nassfutter', NULL, 2),
  ('ernaehrung', 'Nassfutter-Menü Lamm (400 g)', 'Lamm-Menü aus nachhaltiger Produktion', '3,89 €', 389, 'https://lakefields.b-cdn.net/media/50/b4/4e/1761171618/nassfutter-lamm-adult-lf-an3140_1761171618393151.webp?ts=1761171618', 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Lamm-400-g', 'Nassfutter', NULL, 3),
  ('ernaehrung', 'Nassfutter-Menü Huhn (400 g)', 'Leichtes Huhn-Menü für empfindliche Mägen', '3,69 €', 369, 'https://lakefields.b-cdn.net/media/70/70/1d/1761171644/nassfutter-huhn-adult-lf-an4140_176117164369239.webp?ts=1761171644', 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Huhn-400-g', 'Nassfutter', NULL, 4),
  ('ernaehrung', 'Nassfutter-Menü Pferd (400 g)', 'Hypoallergenes Pferd-Menü', '4,29 €', 429, 'https://lakefields.b-cdn.net/media/a7/b6/0b/1763104330/nassfutter-pferd-adult-lf-an7140_1763104329593948.webp?ts=1763104330', 'https://www.lakefields.de/Hundefutter/Nassfutter/Adult-Menue-Pferd-400-g', 'Nassfutter', 'Neu', 5),
  ('ernaehrung', 'Nassfutter-Menü Rind Welpe (400 g)', 'Welpenfutter mit Rind', '3,69 €', 369, 'https://lakefields.b-cdn.net/media/3b/1c/02/1761171825/nassfutter-rind-welpe-lf-wn2140_17611718246539207.webp?ts=1761171825', 'https://www.lakefields.de/Hundefutter/Nassfutter/Welpe-Menue-Rind-400-g', 'Welpenfutter', NULL, 6);

-- ═══ SEED: Fressnapf ═══
INSERT INTO public.pet_shop_products (category, name, description, price_label, price_cents, image_url, external_url, sub_category, badge, sort_order) VALUES
  ('fressnapf', 'MultiFit Mint DentalCare Sticks Junior', 'Zahnpflege-Sticks für Welpen', '4,29 €', 429, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Dog-hund-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/multifit-mint-dentalcare-sticks-junior-multipack-28-stueck-1002921001/', 'Zahnpflege', 'Exklusiv', 1),
  ('fressnapf', 'MultiFit Mint DentalCare Sticks S', 'Zahnpflege-Sticks Größe S', '5,49 €', 549, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Cat-katze-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/multifit-mint-dentalcare-sticks-multipack-s-1002921002/', 'Zahnpflege', '4 Varianten', 2),
  ('fressnapf', 'PREMIERE Dental Wrap Mini Rolls', 'Dental-Snacks für kleine Hunde', '3,49 €', 349, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-kleintier-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/premiere-dental-wrap-mini-dental-rolls-8-stueck-1278304/', 'Snacks', 'Exklusiv', 3),
  ('fressnapf', 'TAKE CARE Zahncreme 100ml', 'Spezial-Zahncreme für Hunde', '6,49 €', 649, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-bird-vogel-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/take-care-zahncreme-100ml-1291566/', 'Zahnpflege', 'Exklusiv', 4),
  ('fressnapf', 'TAKE CARE Silikon Finger', 'Silikon-Fingerling für Zahnpflege', '8,49 €', 849, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-aqua-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/take-care-silikon-finger-1291564/', 'Pflege', 'Exklusiv', 5),
  ('fressnapf', 'TAKE CARE Zahn Lipid Gel', 'Lipid-Gel zur Zahnpflege', '13,99 €', 1399, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-terra-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/take-care-zahn-lipid-gel-1291567/', 'Zahnpflege', NULL, 6),
  ('fressnapf', 'TAKE CARE Zahnpflege Set', 'Komplettset für die Zahnpflege', '12,49 €', 1249, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-garden-garten-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/take-care-zahnpflege-set-1291569/', 'Pflege', 'Exklusiv', 7),
  ('fressnapf', 'TAKE CARE Zahnbürste', 'Ergonomische Zahnbürste für Hunde', '6,49 €', 649, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-VET-pet-health-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/take-care-zahnbuerste-1291568/', 'Pflege', 'Exklusiv', 8),
  ('fressnapf', 'TAKE CARE Anti-Plaque Finger', 'Anti-Plaque Fingerling', '12,99 €', 1299, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Dog-hund-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/take-care-anti-plaque-finger-1291565/', 'Pflege', NULL, 9),
  ('fressnapf', 'SELECT GOLD Sensitive Dental Snacks', 'Dental-Snacks für sensible Hunde', '2,99 €', 299, 'https://media.os.fressnapf.com/cms/2024/04/Flyout-bilder-Cat-katze-xl.png?f=webp&t=prod_xxs', 'https://www.fressnapf.de/p/select-gold-sensitive-dental-snacks-alge-mini-99-g-1230943/', 'Snacks', 'Exklusiv', 10);
