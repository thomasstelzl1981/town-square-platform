/**
 * LennoxStartseite — One-Pager
 * Hero bleibt immer sichtbar (kompakter nach Suche)
 * ?locate=1 löst sofort Geolocation aus
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Star, Search, Shield, Heart, CreditCard, ArrowRight, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchProviders, type SearchProvider } from '@/hooks/usePetProviderSearch';
import { DEMO_LENNOX_SEARCH_PROVIDER } from '@/engines/demoData/petManagerDemo';
import heroImage from '@/assets/lennox/hero_alpine.jpg';

const SERVICE_TAG_LABELS: Record<string, string> = {
  boarding: 'Pension', daycare: 'Tagesstätte', grooming: 'Pflege',
  walking: 'Gassi', training: 'Training', sitting: 'Sitting',
  veterinary: 'Tierarzt', transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

const COLORS = {
  primary: 'hsl(155,35%,25%)',
  bg: 'hsl(40,30%,97%)',
  sand: 'hsl(35,30%,85%)',
  foreground: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  coral: 'hsl(10,85%,60%)',
};

export default function LennoxStartseite() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchLocation, setSearchLocation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const { data: providers = [], isLoading } = useSearchProviders(
    hasSearched ? searchLocation : undefined
  );

  // Auto-trigger geolocation when ?locate=1
  useEffect(() => {
    if (searchParams.get('locate') === '1') {
      // Remove the param so it doesn't re-trigger
      setSearchParams({}, { replace: true });
      triggerGeolocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For now use "Mein Standort" as label — real reverse geocoding could be added later
          setSearchLocation('Mein Standort');
          setHasSearched(true);
        },
        () => {
          // Fallback on denied/error
          setSearchLocation('München');
          setHasSearched(true);
        },
        { timeout: 5000 }
      );
    } else {
      setSearchLocation('München');
      setHasSearched(true);
    }
  };

  const handleSearch = () => {
    if (searchLocation.trim()) {
      setHasSearched(true);
    }
  };

  return (
    <div className="space-y-0">
      {/* ═══ HERO — always visible, compact after search ═══ */}
      <section
        className="relative overflow-hidden transition-all duration-700"
        style={{ minHeight: hasSearched ? '40vh' : '70vh' }}
      >
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>
        <div
          className="relative z-10 max-w-4xl mx-auto px-5 flex flex-col items-center justify-center text-center"
          style={{ minHeight: hasSearched ? '40vh' : '70vh' }}
        >
          <h1 className={`font-bold text-white leading-tight mb-4 transition-all duration-500 ${hasSearched ? 'text-2xl md:text-4xl' : 'text-4xl md:text-6xl'}`}>
            Lennox & Friends
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-2">Dog Resorts</p>
          {!hasSearched && (
            <p className="text-base text-white/70 max-w-lg mb-8">
              Naturverbundene Hundebetreuung durch geprüfte Partner in deiner Region.
            </p>
          )}
          {!hasSearched && (
            <Button
              size="lg"
              className="rounded-full text-base px-8 py-3 text-white font-semibold"
              style={{ background: COLORS.primary }}
              onClick={triggerGeolocation}
            >
              <MapPin className="h-5 w-5 mr-2" /> Partner in meiner Nähe finden
            </Button>
          )}
          {hasSearched && (
            <Badge variant="outline" className="text-sm bg-white/10 border-white/30 text-white">
              <MapPin className="h-3 w-3 mr-1" /> {searchLocation} (Umkreis 15 km)
            </Badge>
          )}
        </div>
      </section>

      {/* ═══ SEARCH BAR — always visible ═══ */}
      <section className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex gap-2">
          <Input
            placeholder="Ort oder PLZ eingeben…"
            value={searchLocation}
            onChange={e => setSearchLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="rounded-full"
            style={{ borderColor: COLORS.sand }}
          />
          <Button className="rounded-full text-white" style={{ background: COLORS.primary }} onClick={handleSearch}>
            <Search className="h-4 w-4 mr-1" /> Suchen
          </Button>
        </div>
      </section>

      {/* ═══ PARTNER KACHELN (nur nach Suche) ═══ */}
      {hasSearched && (
        <section className="max-w-6xl mx-auto px-5 pb-10">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: COLORS.primary }} />
            </div>
          ) : providers.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-sm" style={{ color: COLORS.muted }}>Keine weiteren Partner in dieser Region — aber Lennox & Friends ist für dich da:</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <PartnerCard provider={DEMO_LENNOX_SEARCH_PROVIDER} />
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {providers.slice(0, 8).map(p => (
                <PartnerCard key={p.id} provider={p} />
              ))}
            </div>
          )}
          {providers.length > 8 && (
            <div className="text-center mt-6">
              <Button variant="outline" className="rounded-full">Mehr Partner anzeigen</Button>
            </div>
          )}
        </section>
      )}

      {/* ═══ TRUST KACHELN ═══ */}
      <section className="max-w-4xl mx-auto px-5 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Shield, title: 'Geprüfte Partner', desc: 'Jeder Partner wird persönlich verifiziert.' },
            { icon: Heart, title: 'Natur & Herz', desc: 'Artgerechte Betreuung in natürlicher Umgebung.' },
            { icon: CreditCard, title: '5 € Anzahlung', desc: 'Verbindliche Buchung wird angerechnet.' },
          ].map(t => (
            <Card key={t.title} className="text-center border" style={{ borderColor: COLORS.sand, background: 'white' }}>
              <CardContent className="p-6 space-y-2">
                <t.icon className="h-8 w-8 mx-auto" style={{ color: COLORS.primary }} />
                <h3 className="font-semibold" style={{ color: COLORS.foreground }}>{t.title}</h3>
                <p className="text-sm" style={{ color: COLORS.muted }}>{t.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ SHOP TEASER ═══ */}
      <section className="max-w-4xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: COLORS.foreground }}>Lennox Shop</h2>
          <Link to="/website/tierservice/shop" className="text-sm font-medium flex items-center gap-1" style={{ color: COLORS.primary }}>
            Zum Shop <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['Ernährung', 'Lennox Style', 'Zubehör', 'Pflege'].map(cat => (
            <Link key={cat} to="/website/tierservice/shop">
              <Card className="border hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: COLORS.sand, background: 'white' }}>
                <CardContent className="p-5 text-center space-y-2">
                  <ShoppingBag className="h-8 w-8 mx-auto" style={{ color: COLORS.primary }} />
                  <p className="font-medium text-sm" style={{ color: COLORS.foreground }}>{cat}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ PARTNER CTA ═══ */}
      <section className="max-w-4xl mx-auto px-5 py-12">
        <div className="rounded-2xl text-center py-12 px-6 text-white" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, hsl(155,30%,35%))` }}>
          <h2 className="text-2xl font-bold mb-2">Werden Sie Partner für Ihre Region</h2>
          <p className="text-white/80 max-w-md mx-auto mb-6">
            Profitieren Sie von unserer Plattform und erreichen Sie neue Kunden.
          </p>
          <Link to="/website/tierservice/partner-werden">
            <Button variant="secondary" className="rounded-full font-semibold">
              Partner werden <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function PartnerCard({ provider }: { provider: SearchProvider }) {
  const slug = provider.id;

  return (
    <Link to={`/website/tierservice/partner/${slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow border cursor-pointer" style={{ borderColor: COLORS.sand, background: 'white' }}>
        {provider.cover_image_url ? (
          <div className="h-36 overflow-hidden rounded-t-xl">
            <img src={provider.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-36 rounded-t-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(155,30%,90%), hsl(40,25%,90%))` }}>
            <MapPin className="h-10 w-10" style={{ color: `${COLORS.primary}66` }} />
          </div>
        )}
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-1" style={{ color: COLORS.foreground }}>{provider.company_name}</h3>
            {provider.rating_avg != null && provider.rating_avg > 0 && (
              <div className="flex items-center gap-0.5 text-xs shrink-0" style={{ color: 'hsl(40,90%,45%)' }}>
                <Star className="h-3.5 w-3.5 fill-current" />
                {provider.rating_avg.toFixed(1)}
              </div>
            )}
          </div>
          {provider.address && (
            <p className="text-xs flex items-center gap-1" style={{ color: COLORS.muted }}>
              <MapPin className="h-3 w-3 shrink-0" /> {provider.address}
            </p>
          )}
          {provider.services.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {provider.services.slice(0, 2).map(s => (
                <Badge key={s} variant="secondary" className="text-[10px]" style={{ background: `hsl(155,20%,92%)`, color: COLORS.primary }}>
                  {SERVICE_TAG_LABELS[s] || s}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
