/**
 * LennoxShop — Produktstruktur (keine Beispielprodukte, werden über Z1 angelegt)
 * Section 1: Lennox Essentials (Ernährung, Lennox Style)
 * Section 2: Affiliate Shops
 */
import { ShoppingBag, ExternalLink, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const COLORS = {
  primary: 'hsl(155,35%,25%)',
  foreground: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  sand: 'hsl(35,30%,85%)',
};

const CATEGORIES = [
  { key: 'ernaehrung', label: 'Ernährung', desc: 'Premium-Futter & Nahrungsergänzung' },
  { key: 'lennox_style', label: 'Lennox Style', desc: 'Halsbänder, Leinen & Accessoires' },
  { key: 'zubehoer', label: 'Zubehör', desc: 'Betten, Transportboxen & mehr' },
  { key: 'pflege', label: 'Pflege', desc: 'Shampoos, Bürsten & Pflegeprodukte' },
];

const AFFILIATE_SHOPS = [
  { name: 'Zooplus', url: '#', desc: 'Über 8.000 Produkte' },
  { name: 'Fressnapf', url: '#', desc: 'Deutschlands größte Fachhandels-Kette' },
  { name: 'Specials', url: '#', desc: 'Exklusive Lennox-Partner Angebote' },
];

export default function LennoxShop() {
  // TODO: Load products from Z1 pet_shop_products table when created
  // For now just show category structure

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-10">
      <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: COLORS.muted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      <div className="text-center space-y-2">
        <ShoppingBag className="h-10 w-10 mx-auto" style={{ color: COLORS.primary }} />
        <h1 className="text-3xl font-bold" style={{ color: COLORS.foreground }}>Lennox Shop</h1>
        <p className="text-sm" style={{ color: COLORS.muted }}>Alles für deinen Vierbeiner — kuratiert von Lennox & Friends.</p>
      </div>

      {/* ═══ LENNOX ESSENTIALS ═══ */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: COLORS.foreground }}>Lennox Essentials</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map(cat => (
            <Card key={cat.key} className="border hover:shadow-md transition-shadow" style={{ borderColor: COLORS.sand, background: 'white' }}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium" style={{ color: COLORS.foreground }}>{cat.label}</h3>
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
                    Bald verfügbar
                  </Badge>
                </div>
                <p className="text-sm" style={{ color: COLORS.muted }}>{cat.desc}</p>
                <ShoppingBag className="h-12 w-12 mx-auto opacity-20" style={{ color: COLORS.primary }} />
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs mt-3 text-center" style={{ color: COLORS.muted }}>
          Produkte werden über den Lennox Admin-Bereich gepflegt.
        </p>
      </section>

      {/* ═══ AFFILIATE SHOPS ═══ */}
      <section>
        <h2 className="text-xl font-semibold mb-4" style={{ color: COLORS.foreground }}>Partner-Shops</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {AFFILIATE_SHOPS.map(shop => (
            <a key={shop.name} href={shop.url} target="_blank" rel="noopener noreferrer">
              <Card className="border hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: COLORS.sand, background: 'white' }}>
                <CardContent className="p-5 text-center space-y-2">
                  <ExternalLink className="h-6 w-6 mx-auto" style={{ color: COLORS.primary }} />
                  <h3 className="font-medium" style={{ color: COLORS.foreground }}>{shop.name}</h3>
                  <p className="text-xs" style={{ color: COLORS.muted }}>{shop.desc}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* Checkout hint */}
      <div className="text-center py-4">
        <p className="text-xs" style={{ color: COLORS.muted }}>
          Checkout nur nach <Link to="/website/tierservice/login" className="underline" style={{ color: COLORS.primary }}>Login</Link>.
        </p>
      </div>
    </div>
  );
}
