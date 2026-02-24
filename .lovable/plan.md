
# Implementierungsplan: Service Desk (Zone 1) — Schritte 1-6

Alle 6 Schritte werden ohne Rueckfrage umgesetzt. Ich habe die Codebasis vollstaendig analysiert und alle notwendigen Aenderungen identifiziert.

## Schritt 1: Datenbank — Neue Tabellen

**Migration:** `service_shop_products` + `service_shop_config`

```sql
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

-- Indices
CREATE INDEX idx_service_shop_products_key_active ON public.service_shop_products (shop_key, is_active, sort_order);

-- RLS
ALTER TABLE public.service_shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_shop_config ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users
CREATE POLICY "Authenticated users can read products"
  ON public.service_shop_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read config"
  ON public.service_shop_config FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE: Platform admins only (via has_role)
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
```

## Schritt 2: Hook — `useServiceShopProducts.ts`

**Neue Datei:** `src/hooks/useServiceShopProducts.ts`

Generalisierter CRUD-Hook (analog zu `usePetShopProducts`):
- `useServiceShopProducts(shopKey)` — Zone 1 CRUD (alle Produkte)
- `useActiveServiceProducts(shopKey)` — Zone 2 Read-Only (`is_active = true`)
- `useCreateServiceProduct()`, `useUpdateServiceProduct()`, `useDeleteServiceProduct()`

## Schritt 3: Service Desk Seiten (Zone 1)

**7 neue Dateien:**

| Datei | Zweck |
|-------|-------|
| `src/pages/admin/service-desk/ServiceDeskRouter.tsx` | Haupt-Router mit 5 Modul-Tabs |
| `src/pages/admin/service-desk/ServiceDeskProductCRUD.tsx` | Wiederverwendbare CRUD-Komponente mit Side-Menu |
| `src/pages/admin/service-desk/ServiceDeskShops.tsx` | MOD-16: Amazon, OTTO, Miete24, Smart Home |
| `src/pages/admin/service-desk/ServiceDeskFortbildung.tsx` | MOD-15: Delegiert an AdminFortbildung |
| `src/pages/admin/service-desk/ServiceDeskFahrzeuge.tsx` | MOD-17: Fahrzeuge, Boote, Privatjet, Angebote |
| `src/pages/admin/service-desk/ServiceDeskPV.tsx` | MOD-19: Anbieter, Produkte, Partner, Monitoring |
| `src/pages/admin/service-desk/ServiceDeskPetShop.tsx` | MOD-05: Ernaehrung, Tracker, Style, Fressnapf |

Die `ServiceDeskProductCRUD`-Komponente repliziert das PetDeskShop-Pattern mit:
- Links: Sub-Tab-Sidebar (4 Buttons pro Modul)
- Rechts: Produktliste aus DB mit CRUD
- Create/Edit Dialog inkl. Affiliate-Felder
- Affiliate-Config Info-Box (Platzhalter)

## Schritt 4: Zone 2 ShopTab.tsx umbauen

**Datei:** `src/pages/portal/services/ShopTab.tsx`

- ~380 Zeilen hardcoded Produktdaten ENTFERNEN
- 42 lokale Bild-Imports ENTFERNEN
- Stattdessen: `useActiveServiceProducts(shopKey)` laden
- Shop-Header (Name, Tagline, Gradient) bleibt als UI-Config
- Smart Home: ebenfalls dynamisch aus DB laden
- "Nicht verbunden"-Accordion bleibt (Affiliate-Placeholder)

## Schritt 5: Pet-Shop Migration

**Daten-Migration:** `pet_shop_products` -> `service_shop_products` per SQL INSERT:
- `ernaehrung` -> shop_key `pet-ernaehrung`
- `lennox_tracker` -> shop_key `pet-tracker`
- `lennox_style` -> shop_key `pet-style`
- `fressnapf` -> shop_key `pet-fressnapf`

**Zone 2 PetsShop.tsx:** `useActiveShopProducts` -> `useActiveServiceProducts` umstellen

**Pet Desk:** Shop-Tab aus `pet-desk` Route entfernen (Route bleibt, verweist auf Service Desk)

## Schritt 6: Routing + Sidebar

**routesManifest.ts:**
- Route `service-desk` hinzufuegen (nach `pet-desk`)
- `fortbildung` Route bleibt (aber Sidebar-Gruppe aendert sich)

**ManifestRouter.tsx:**
- `service-desk` in `adminDeskMap` registrieren
- Skip-Filter erweitern

**AdminSidebar.tsx:**
- `service-desk` in `getGroupKey` als `desks` registrieren
- `fortbildung` aus `system` in `desks` verschieben (oder entfernen, da via Service Desk erreichbar)
- Icon: ShoppingBag fuer Service Desk
- `shouldShowInNav`: `service-desk` als sichtbar, `fortbildung` ausblenden

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| NEU | `src/hooks/useServiceShopProducts.ts` |
| NEU | `src/pages/admin/service-desk/ServiceDeskRouter.tsx` |
| NEU | `src/pages/admin/service-desk/ServiceDeskProductCRUD.tsx` |
| NEU | `src/pages/admin/service-desk/ServiceDeskShops.tsx` |
| NEU | `src/pages/admin/service-desk/ServiceDeskFortbildung.tsx` |
| NEU | `src/pages/admin/service-desk/ServiceDeskFahrzeuge.tsx` |
| NEU | `src/pages/admin/service-desk/ServiceDeskPV.tsx` |
| NEU | `src/pages/admin/service-desk/ServiceDeskPetShop.tsx` |
| EDIT | `src/pages/portal/services/ShopTab.tsx` |
| EDIT | `src/pages/portal/pets/PetsShop.tsx` |
| EDIT | `src/manifests/routesManifest.ts` |
| EDIT | `src/router/ManifestRouter.tsx` |
| EDIT | `src/components/admin/AdminSidebar.tsx` |
| DB | Migration: 2 neue Tabellen |
| DB | Data: pet_shop_products -> service_shop_products kopieren |
