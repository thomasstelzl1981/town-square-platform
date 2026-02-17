/**
 * LennoxShop — Zone 3 Shop (reads from pet_shop_products DB via Z1 SSOT)
 * Categories: Ernährung, Lennox Style, Fressnapf (from DB)
 * LennoxTracker: hardcoded feature teaser
 */
import { ShoppingBag, ExternalLink, ArrowLeft, Radar, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useActiveShopProducts } from '@/hooks/usePetShopProducts';

const COLORS = {
  primary: 'hsl(155,35%,25%)',
  foreground: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  sand: 'hsl(35,30%,85%)',
};

const SHOP_SECTIONS: { key: string; label: string; desc: string; isAffiliate?: boolean }[] = [
  { key: 'ernaehrung', label: 'Ernährung', desc: 'Premium-Futter & Nahrungsergänzung' },
  { key: 'lennox_style', label: 'Lennox Style', desc: 'Halsbänder, Leinen & Accessoires' },
  { key: 'fressnapf', label: 'Fressnapf', desc: 'Europas größte Fachmarktkette', isAffiliate: true },
];

function ProductSection({ categoryKey, label, desc, isAffiliate }: { categoryKey: string; label: string; desc: string; isAffiliate?: boolean }) {
  const { data: products = [], isLoading } = useActiveShopProducts(categoryKey);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold" style={{ color: COLORS.foreground }}>{label}</h3>
          <p className="text-xs" style={{ color: COLORS.muted }}>{desc}</p>
        </div>
        {isAffiliate && (
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
            Partner
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm" style={{ color: COLORS.muted }}>Lade Produkte…</div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center rounded-lg border border-dashed" style={{ borderColor: COLORS.sand }}>
          <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: COLORS.primary }} />
          <p className="text-sm" style={{ color: COLORS.muted }}>Produkte werden in Kürze hinzugefügt.</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {products.map(p => (
            <a
              key={p.id}
              href={p.external_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="border hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer" style={{ borderColor: COLORS.sand, background: 'white' }}>
                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                  {p.image_url ? (
                    <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-50">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square w-full rounded-lg flex items-center justify-center bg-gray-50">
                      <ShoppingBag className="h-8 w-8 opacity-15" style={{ color: COLORS.primary }} />
                    </div>
                  )}
                  {p.badge && (
                    <Badge className="text-[10px] text-white border-0" style={{ backgroundColor: COLORS.primary }}>
                      {p.badge}
                    </Badge>
                  )}
                  <span className="text-xs font-medium line-clamp-2" style={{ color: COLORS.foreground }}>{p.name}</span>
                  {p.price_label && (
                    <span className="text-xs font-semibold" style={{ color: COLORS.primary }}>{p.price_label}</span>
                  )}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LennoxShop() {
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

      {/* ═══ LENNOX TRACKER TEASER (hardcoded) ═══ */}
      <section>
        <Card className="overflow-hidden" style={{ borderColor: COLORS.sand, background: 'white' }}>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'hsl(155,35%,25%,0.1)' }}>
              <Radar className="h-8 w-8" style={{ color: COLORS.primary }} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold" style={{ color: COLORS.foreground }}>Lennox GPS Tracker</h3>
              <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
                Echtzeit-Ortung, Aktivitätstracking und Geofencing für deinen Liebling.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" disabled style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
              <ShoppingCart className="h-3.5 w-3.5" /> Bald verfügbar
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ═══ PRODUCT SECTIONS (from DB) ═══ */}
      {SHOP_SECTIONS.map(s => (
        <section key={s.key}>
          <ProductSection
            categoryKey={s.key}
            label={s.label}
            desc={s.desc}
            isAffiliate={s.isAffiliate}
          />
        </section>
      ))}

      {/* Checkout hint */}
      <div className="text-center py-4">
        <p className="text-xs" style={{ color: COLORS.muted }}>
          Checkout nur nach <Link to="/website/tierservice/login" className="underline" style={{ color: COLORS.primary }}>Login</Link>.
        </p>
      </div>
    </div>
  );
}
