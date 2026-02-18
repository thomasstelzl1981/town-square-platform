/**
 * LennoxStartseite — Alpine Chic One-Pager
 * Kitzbühel-style premium dog services network
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Star, Search, Shield, Heart, CreditCard, ArrowRight, ShoppingBag, Mountain, Users, CheckCircle, Globe, PawPrint } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchProviders, type SearchProvider } from '@/hooks/usePetProviderSearch';
import { DEMO_LENNOX_SEARCH_PROVIDER } from '@/engines/demoData/petManagerDemo';
import heroImage from '@/assets/lennox/hero_alpine_chic.jpg';
import cozyImage from '@/assets/lennox/section_cozy.jpg';
import lennoxPatch from '@/assets/logos/lennox_logo_patch.jpeg';
import lennoxBadge from '@/assets/logos/lennox_logo_badge.jpeg';

const SERVICE_TAG_LABELS: Record<string, string> = {
  boarding: 'Pension', daycare: 'Tagesstätte', grooming: 'Pflege',
  walking: 'Gassi', training: 'Training', sitting: 'Sitting',
  veterinary: 'Tierarzt', transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

/* ─── Alpine Chic Palette ─── */
const C = {
  forest: 'hsl(155,35%,22%)',
  forestLight: 'hsl(155,28%,32%)',
  cream: 'hsl(38,45%,96%)',
  warmWhite: 'hsl(40,40%,99%)',
  sand: 'hsl(32,35%,82%)',
  sandLight: 'hsl(35,40%,92%)',
  bark: 'hsl(25,30%,18%)',
  barkMuted: 'hsl(25,15%,42%)',
  coral: 'hsl(10,78%,58%)',
  coralHover: 'hsl(10,78%,50%)',
  gold: 'hsl(40,85%,50%)',
};

export default function LennoxStartseite() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchLocation, setSearchLocation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const { data: providers = [], isLoading } = useSearchProviders(
    hasSearched ? searchLocation : undefined
  );

  useEffect(() => {
    if (searchParams.get('locate') === '1') {
      setSearchParams({}, { replace: true });
      triggerGeolocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => { setSearchLocation('Mein Standort'); setHasSearched(true); },
        () => { setSearchLocation('München'); setHasSearched(true); },
        { timeout: 5000 }
      );
    } else {
      setSearchLocation('München');
      setHasSearched(true);
    }
  };

  const handleSearch = () => {
    if (searchLocation.trim()) setHasSearched(true);
  };

  return (
    <div style={{ background: C.cream }}>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: hasSearched ? '45vh' : '85vh' }}>
        <div className="absolute inset-0">
          <img src={heroImage} alt="Hund auf Alpenwiese" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center"
          style={{ minHeight: hasSearched ? '45vh' : '85vh' }}>
          
          
          <h1 className={`font-bold text-white leading-tight tracking-tight transition-all duration-500 ${hasSearched ? 'text-2xl md:text-4xl mb-3' : 'text-4xl md:text-6xl lg:text-7xl mb-4'}`}
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Lennox & Friends
          </h1>
          
          {!hasSearched && (
            <>
              <p className="text-lg md:text-xl text-white/90 font-light tracking-wide mb-2"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
                Dein Netzwerk für geprüfte Hundeprofis
              </p>
              <p className="text-sm md:text-base text-white/70 max-w-2xl mb-10 leading-relaxed">
                Von den Alpen bis zur Küste — damit dein Liebling immer in den besten Händen ist.
                Geprüft. Familiär. Mit Herz.
              </p>
              
              {/* Search integrated in Hero */}
              <div className="w-full max-w-xl">
                <div className="flex gap-2 bg-white/95 backdrop-blur-md rounded-full p-1.5 shadow-2xl">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.barkMuted }} />
                    <Input
                      placeholder="Ort oder PLZ eingeben…"
                      value={searchLocation}
                      onChange={e => setSearchLocation(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                      style={{ color: C.bark }}
                    />
                  </div>
                  <Button className="rounded-full text-white px-6 font-semibold" style={{ background: C.forest }} onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-1.5" /> Suchen
                  </Button>
                </div>
                <button onClick={triggerGeolocation} className="mt-3 text-white/80 text-sm hover:text-white transition-colors flex items-center gap-1 mx-auto">
                  <MapPin className="h-3.5 w-3.5" /> Meinen Standort verwenden
                </button>
              </div>
            </>
          )}
          
          {hasSearched && (
            <Badge className="text-sm bg-white/15 border-white/30 text-white backdrop-blur-sm">
              <MapPin className="h-3 w-3 mr-1" /> {searchLocation} (Umkreis 15 km)
            </Badge>
          )}
        </div>
      </section>

      {/* ═══════════════════ SEARCH BAR (after search) ═══════════════════ */}
      {hasSearched && (
        <section className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex gap-2 bg-white rounded-full p-1.5 shadow-lg border" style={{ borderColor: C.sandLight }}>
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.barkMuted }} />
              <Input
                placeholder="Ort oder PLZ…"
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                style={{ color: C.bark }}
              />
            </div>
            <Button className="rounded-full text-white px-6" style={{ background: C.forest }} onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* ═══════════════════ RESULTS ═══════════════════ */}
      {hasSearched && (
        <section className="max-w-6xl mx-auto px-6 pb-12">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: C.forest }} />
            </div>
          ) : providers.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-sm" style={{ color: C.barkMuted }}>Noch keine Partner in dieser Region — Lennox & Friends ist aber für dich da:</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <PartnerCard provider={DEMO_LENNOX_SEARCH_PROVIDER} />
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {providers.slice(0, 8).map(p => <PartnerCard key={p.id} provider={p} />)}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════ TRUST — Alpine Icons ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.warmWhite }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: C.coral }}>
            Warum Lennox & Friends
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: C.bark }}>
            Dein Hund verdient das Beste
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: Shield, title: 'Geprüfte Profis', desc: 'Jeder Partner wird persönlich verifiziert und regelmäßig überprüft.' },
              { icon: Heart, title: 'Mit Liebe zum Tier', desc: 'Artgerechte Betreuung durch leidenschaftliche Hundemenschen.' },
              { icon: Globe, title: 'DACH-weit', desc: 'Wachsendes Netzwerk in Deutschland & Österreich — von Bayern bis Hamburg.' },
              { icon: Mountain, title: 'Alpine Qualität', desc: 'Inspiriert von der Natur — hohe Standards, persönlich & familiär.' },
            ].map(t => (
              <div key={t.title} className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: `${C.forest}12` }}>
                  <t.icon className="h-7 w-7" style={{ color: C.forest }} />
                </div>
                <h3 className="font-semibold text-sm" style={{ color: C.bark }}>{t.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: C.barkMuted }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ STORY — Die Idee ═══════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: C.coral }}>
              Unsere Geschichte
            </p>
            <h2 className="text-2xl md:text-3xl font-bold leading-snug" style={{ color: C.bark }}>
              Von einer Leidenschaft zum größten Hunde-Netzwerk im DACH-Raum
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: C.barkMuted }}>
              <p>
                <strong style={{ color: C.bark }}>Lennox & Friends</strong> wurde aus einer einfachen Überzeugung geboren: 
                Jeder Hund verdient die beste Betreuung — egal wo in Deutschland oder Österreich man lebt.
              </p>
              <p>
                Unsere Gründerin betreibt seit vielen Jahren ein äußerst erfolgreiches Hundesitting-Unternehmen 
                in Bayern. Was als kleine, familiäre Hundebetreuung in den Alpen begann, wird jetzt zu einem 
                Netzwerk aus geprüften Hundeprofis im gesamten deutschsprachigen Raum ausgebaut.
              </p>
              <p>
                Wir verbinden <strong style={{ color: C.bark }}>langjährige Erfahrung</strong> mit 
                einem <strong style={{ color: C.bark }}>hohen Qualitätsanspruch</strong> — 
                von der Betreuung bis zu sorgfältig getesteten Produkten. 
                Alles mit einer großen Portion Liebe zum Tier.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {['10+ Jahre Erfahrung', '100% geprüft', 'Familiär & persönlich'].map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: C.sandLight, color: C.forest }}>
                  <CheckCircle className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src={cozyImage} alt="Hund im gemütlichen Chalet" className="rounded-2xl shadow-xl w-full h-80 object-cover" />
            <img src={lennoxBadge} alt="Lennox Badge" className="absolute -bottom-4 -left-4 h-20 w-20 rounded-xl object-cover shadow-lg border-4 border-white" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ NETZWERK VISION ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.forest }}>
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: C.coral }}>
            Unsere Vision
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-snug max-w-3xl mx-auto">
            Ein Netzwerk, dem du vertraust — von den Alpen bis an die Küste
          </h2>
          <p className="text-white/75 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            Ob du auf Geschäftsreise bist, in den Urlaub fährst oder einfach mal eine Auszeit brauchst —
            mit Lennox & Friends findest du immer einen geprüften Hundeprofi in deiner Nähe. 
            Kein Zufall, kein Risiko. Nur die besten Hände für deinen besten Freund.
          </p>
          <div className="grid gap-6 md:grid-cols-3 pt-4">
            {[
              { icon: Users, value: 'Wachsend', label: 'Partner-Netzwerk in ganz DACH' },
              { icon: Shield, value: '100%', label: 'Persönlich verifizierte Betreuer' },
              { icon: Heart, value: 'Immer', label: 'Liebe zum Tier an erster Stelle' },
            ].map(s => (
              <div key={s.label} className="space-y-2">
                <s.icon className="h-6 w-6 mx-auto" style={{ color: C.coral }} />
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <p className="text-xs text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
          <Link to="/website/tierservice/partner-werden">
            <Button className="rounded-full font-semibold px-8 text-white mt-4" style={{ background: C.coral }}>
              Partner werden <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══════════════════ SHOP TEASER ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.warmWhite }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: C.coral }}>
                Lennox Style
              </p>
              <h2 className="text-2xl font-bold" style={{ color: C.bark }}>Aus Liebe zum Detail</h2>
            </div>
            <Link to="/website/tierservice/shop" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: C.forest }}>
              Zum Shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Trucker Caps', img: '/shop/lennox-cap-green.jpg', price: '34,90 €' },
              { name: 'Bommelmützen-Set', img: '/shop/lennox-beanies.jpg', price: '29,90 €' },
              { name: 'Hundehalsbänder', img: '/shop/lennox-collars.jpg', price: '24,90 €' },
              { name: 'Canvas Tote Bag', img: '/shop/lennox-tote-bag.jpg', price: '39,90 €' },
            ].map(p => (
              <Link key={p.name} to="/website/tierservice/shop">
                <Card className="border overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  style={{ borderColor: C.sandLight, background: 'white' }}>
                  <div className="h-44 overflow-hidden">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-4 space-y-1">
                    <p className="font-semibold text-sm" style={{ color: C.bark }}>{p.name}</p>
                    <p className="text-xs font-medium" style={{ color: C.forest }}>ab {p.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PARTNER CTA ═══════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${C.forest}, ${C.forestLight})` }}>
          <div className="absolute top-4 right-4 opacity-10">
            <PawPrint className="h-40 w-40 text-white" />
          </div>
          <div className="relative z-10 text-center py-14 px-8">
            <img src={lennoxPatch} alt="" className="h-14 w-14 rounded-xl object-cover mx-auto mb-6 shadow-lg border-2 border-white/20" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Werde Teil der Lennox-Familie
            </h2>
            <p className="text-white/80 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
              Du bist leidenschaftlicher Hundeprofi und möchtest Teil unseres Netzwerks werden? 
              Profitiere von unserer Reichweite, unserer Erfahrung und einer Community, 
              die Hunde über alles liebt.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/website/tierservice/partner-werden">
                <Button className="rounded-full font-semibold px-8 text-white" style={{ background: C.coral }}>
                  Partner werden <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/website/tierservice?locate=1">
                <Button variant="outline" className="rounded-full font-semibold px-8 border-white/30 text-white hover:bg-white/10">
                  Partner finden
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PartnerCard({ provider }: { provider: SearchProvider }) {
  return (
    <Link to={`/website/tierservice/partner/${provider.id}`}>
      <Card className="h-full hover:shadow-xl transition-all border cursor-pointer group overflow-hidden"
        style={{ borderColor: C.sandLight, background: 'white' }}>
        {provider.cover_image_url ? (
          <div className="h-36 overflow-hidden">
            <img src={provider.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="h-36 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${C.sandLight}, ${C.cream})` }}>
            <PawPrint className="h-10 w-10 opacity-20" style={{ color: C.forest }} />
          </div>
        )}
        <CardContent className="p-3.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-1" style={{ color: C.bark }}>{provider.company_name}</h3>
            {provider.rating_avg != null && provider.rating_avg > 0 && (
              <div className="flex items-center gap-0.5 text-xs shrink-0" style={{ color: C.gold }}>
                <Star className="h-3.5 w-3.5 fill-current" />
                {provider.rating_avg.toFixed(1)}
              </div>
            )}
          </div>
          {provider.address && (
            <p className="text-xs flex items-center gap-1" style={{ color: C.barkMuted }}>
              <MapPin className="h-3 w-3 shrink-0" /> {provider.address}
            </p>
          )}
          {provider.services.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {provider.services.slice(0, 2).map(s => (
                <Badge key={s} variant="secondary" className="text-[10px]"
                  style={{ background: `${C.forest}10`, color: C.forest }}>
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
