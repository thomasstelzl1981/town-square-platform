/**
 * LennoxShop — Zone 3 Shop with 4-Widget Tile Navigation
 * Reads from service_shop_products (Zone 1 SSOT)
 * Widgets: Tracker, Style, Ernährung, Zooplus
 */
import { useState } from 'react';
import { ArrowLeft, Radar, PawPrint, UtensilsCrossed, Store, ShoppingBag, ShoppingCart, ExternalLink, MapPin, Activity, Shield, Battery, Droplets, Heart, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useActiveServiceProducts } from '@/hooks/useServiceShopProducts';
import { LENNOX as C } from './lennoxTheme';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

type ShopWidget = 'tracker' | 'style' | 'ernaehrung' | 'zooplus';

const WIDGETS: { key: ShopWidget; title: string; icon: typeof Store; desc: string; badge?: string }[] = [
  { key: 'tracker', title: 'Lennox Tracker', icon: Radar, desc: 'GPS-Tracker für deinen Liebling' },
  { key: 'style', title: 'Lennox Style', icon: PawPrint, desc: 'Accessoires & Kollektion' },
  { key: 'ernaehrung', title: 'Ernährung', icon: UtensilsCrossed, desc: 'Lakefields Premium-Futter' },
  { key: 'zooplus', title: 'Zooplus', icon: Store, desc: 'Premium Tierbedarf' },
];

const SHOP_KEY_MAP: Record<ShopWidget, string> = {
  tracker: 'pet-tracker',
  style: 'pet-style',
  ernaehrung: 'pet-ernaehrung',
  zooplus: 'pet-zooplus',
};

/* ── Generic Product Grid ─── */
function ProductGrid({ shopKey }: { shopKey: string }) {
  const { data: products = [], isLoading } = useActiveServiceProducts(shopKey);

  if (isLoading) return <div className="py-12 text-center text-sm" style={{ color: C.barkMuted }}>Lade Produkte…</div>;
  if (products.length === 0) return (
    <div className="py-12 text-center rounded-lg border border-dashed" style={{ borderColor: C.sand }}>
      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: C.forest }} />
      <p className="text-sm" style={{ color: C.barkMuted }}>Produkte werden in Kürze hinzugefügt.</p>
    </div>
  );

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 auto-rows-fr">
      {products.map(p => (
        <a key={p.id} href={p.external_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
          <Card className="h-full border hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer" style={{ borderColor: C.sand, background: 'white' }}>
            <CardContent className="p-3 flex flex-col h-full">
              <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 opacity-15" style={{ color: C.forest }} />
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 items-center text-center gap-1 pt-2">
                {p.badge && <Badge className="text-[10px] text-white border-0" style={{ backgroundColor: C.forest }}>{p.badge}</Badge>}
                <span className="text-xs font-medium line-clamp-2" style={{ color: C.bark }}>{p.name}</span>
                <span className="text-xs font-semibold mt-auto pt-1" style={{ color: C.forest }}>{p.price_label || '\u00A0'}</span>
              </div>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}

/* ── Tracker Section with Feature Cards + Products ─── */
function TrackerSection() {
  const { data: products = [], isLoading } = useActiveServiceProducts('pet-tracker');
  const trackers = products.filter(p => p.sub_category === 'Tracker');
  const subscription = products.find(p => p.sub_category === 'Abo');

  const FEATURES = [
    { icon: MapPin, title: 'Live-Ortung', desc: 'GPS/GLONASS/BDS/WIFI/LBS — weltweit in Echtzeit' },
    { icon: Activity, title: 'Aktivitätstracking', desc: 'Schritte, Ruhezeiten und Kalorien deines Vierbeiners' },
    { icon: Shield, title: 'Geofencing', desc: 'Sichere Zonen definieren und Alarme erhalten' },
    { icon: Battery, title: 'Bis 30 Tage Akku', desc: 'Intelligentes Power-Management, USB-C Laden' },
    { icon: Droplets, title: 'IP67 Wasserdicht', desc: 'Robust bei Regen, Schlamm und Badespaß' },
    { icon: Heart, title: 'Gesundheitsdaten', desc: 'Schlaf, Aktivität und Auffälligkeiten erkennen' },
  ];

  return (
    <div className="space-y-6">
      {/* Feature Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="rounded-xl p-4 space-y-2" style={{ backgroundColor: C.sandLight }}>
              <div className="p-2 rounded-lg w-fit" style={{ backgroundColor: `${C.forest}18` }}>
                <Icon className="h-4 w-4" style={{ color: C.forest }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: C.bark }}>{f.title}</p>
              <p className="text-[11px] leading-snug" style={{ color: C.barkMuted }}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Tracker Products */}
      {isLoading ? (
        <div className="py-8 text-center text-sm" style={{ color: C.barkMuted }}>Lade Produkte…</div>
      ) : (
        <>
          {trackers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trackers.map(t => {
                const md = (t.metadata as Record<string, unknown>) ?? {};
                return (
                  <a key={t.id} href={t.external_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                    <Card className="overflow-hidden border hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ borderColor: C.sand, background: 'white' }}>
                      <div className="aspect-square w-full bg-gray-50 relative">
                        {t.image_url && <img src={t.image_url} alt={t.name} className="w-full h-full object-contain p-4" />}
                        {t.badge && (
                          <Badge className="absolute top-3 left-3 text-[10px] text-white border-0" style={{ backgroundColor: C.forest }}>{t.badge}</Badge>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm" style={{ color: C.bark }}>{t.name}</h4>
                        <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: C.barkMuted }}>{t.description}</p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-bold" style={{ color: C.forest }}>{t.price_label}</span>
                          <div className="flex items-center gap-2 text-[10px]" style={{ color: C.barkMuted }}>
                            {md.weight && <span>{String(md.weight)}</span>}
                            {md.ip_rating && <span>• {String(md.ip_rating)}</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          )}

          {/* Single Subscription */}
          {subscription && (
            <Card className="border" style={{ borderColor: C.forest + '30', background: C.sandLight }}>
              <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${C.forest}15` }}>
                  <Radar className="h-6 w-6" style={{ color: C.forest }} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h4 className="font-semibold text-sm" style={{ color: C.bark }}>{subscription.name}</h4>
                    {subscription.badge && <Badge className="text-[10px] text-white border-0" style={{ backgroundColor: C.forest }}>{subscription.badge}</Badge>}
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: C.barkMuted }}>{subscription.description}</p>
                  {(() => {
                    const md = (subscription.metadata as Record<string, unknown>) ?? {};
                    const features = Array.isArray(md.features) ? md.features as string[] : [];
                    return features.length > 0 ? (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {features.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px]" style={{ color: C.barkMuted }}>
                            <Check className="h-3 w-3" style={{ color: C.forest }} />{f}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: C.forest }}>{subscription.price_label}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function LennoxShop() {
  const [activeWidget, setActiveWidget] = useState<ShopWidget>('tracker');

  return (
    <div className="space-y-8">
      <SEOHead
        brand="lennox"
        page={{
          title: 'Shop — Premium Hundezubehör & GPS-Tracker',
          description: 'Kuratiertes Hundezubehör von Lennox & Friends: GPS-Tracker, Premium-Futter, Accessoires und Partner-Angebote für deinen Vierbeiner.',
          path: '/shop',
        }}
      />

      <div className="max-w-5xl mx-auto px-5 space-y-8">
        <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: C.barkMuted }}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: C.bark }}>Lennox Shop</h1>
          <p className="text-sm mt-1" style={{ color: C.barkMuted }}>Alles für deinen Vierbeiner — kuratiert von Lennox & Friends.</p>
        </div>

        {/* ═══ 4-Widget Tile Navigation ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {WIDGETS.map(w => {
            const Icon = w.icon;
            const isActive = activeWidget === w.key;
            return (
              <button
                key={w.key}
                onClick={() => setActiveWidget(w.key)}
                className="rounded-xl border p-4 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
                style={{
                  borderColor: isActive ? C.forest : C.sand,
                  backgroundColor: isActive ? `${C.forest}08` : 'white',
                  boxShadow: isActive ? `0 0 20px -5px ${C.forest}30` : 'none',
                }}
              >
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: isActive ? `${C.forest}15` : C.sandLight }}>
                  <Icon className="h-5 w-5" style={{ color: isActive ? C.forest : C.barkMuted }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: isActive ? C.forest : C.bark }}>{w.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.barkMuted }}>{w.desc}</p>
                </div>
                {w.badge && <Badge variant="outline" className="text-[9px]" style={{ borderColor: C.forest, color: C.forest }}>{w.badge}</Badge>}
              </button>
            );
          })}
        </div>

        {/* ═══ Active Widget Content ═══ */}
        {activeWidget === 'tracker' && <TrackerSection />}

        {activeWidget === 'style' && (
          <div className="space-y-4">
            <div className="rounded-xl p-5" style={{ backgroundColor: C.sandLight }}>
              <p className="text-sm" style={{ color: C.bark }}>
                Für unsere Fans haben wir eine kleine Kollektion an Accessoires gestaltet — mit Liebe zum Detail und dem unverwechselbaren Lennox-Style.
              </p>
            </div>
            <ProductGrid shopKey="pet-style" />
          </div>
        )}

        {activeWidget === 'ernaehrung' && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: C.sandLight }}>
              <p className="text-sm" style={{ color: C.bark }}>
                Wir empfehlen <a href="https://www.lakefields.de" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2" style={{ color: C.forest }}>Lakefields</a> — eine Manufaktur am Bodensee, die Premium-Hundefutter in Lebensmittelqualität herstellt.
              </p>
              <Button size="sm" variant="outline" className="gap-1.5" style={{ borderColor: C.forest, color: C.forest }} onClick={() => window.open('https://www.lakefields.de/Hundefutter/', '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" /> Lakefields Shop
              </Button>
            </div>
            <ProductGrid shopKey="pet-ernaehrung" />
          </div>
        )}

        {activeWidget === 'zooplus' && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: C.sandLight }}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: C.bark }}>Zooplus</p>
              </div>
              <p className="text-sm" style={{ color: C.bark }}>
                Unsere Auswahl an hochwertigem Tierbedarf von Zooplus — Europas führender Online-Shop für Haustierbedarf.
              </p>
              <Button size="sm" variant="outline" className="gap-1.5" style={{ borderColor: C.forest, color: C.forest }} onClick={() => window.open('https://www.zooplus.de', '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" /> Zooplus Shop
              </Button>
            </div>
            <ProductGrid shopKey="pet-zooplus" />
          </div>
        )}

        {/* Checkout hint */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: C.barkMuted }}>
            Checkout nur nach <Link to="/website/tierservice/login" className="underline" style={{ color: C.forest }}>Login</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
