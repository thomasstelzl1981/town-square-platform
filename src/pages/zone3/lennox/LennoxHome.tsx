/**
 * LennoxHome — Public provider directory listing
 * Route: /website/tierservice
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, PawPrint, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchProviders, type SearchProvider } from '@/hooks/usePetProviderSearch';

const categoryLabels: Record<string, string> = {
  betreuung: 'Betreuung',
  gassi: 'Gassi-Service',
  pflege: 'Pflege',
  training: 'Training',
  tierarzt: 'Tierarzt',
  pension: 'Pension',
  sonstiges: 'Sonstiges',
};

export default function LennoxHome() {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const { data: providers = [], isLoading } = useSearchProviders(
    location || undefined,
    category || undefined
  );

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <PawPrint className="h-14 w-14 text-[hsl(25,85%,55%)]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[hsl(25,30%,15%)] leading-tight">
          Liebevolle Tierbetreuung<br className="hidden md:block" /> in deiner Nähe
        </h1>
        <p className="text-lg text-[hsl(25,15%,45%)] max-w-xl mx-auto">
          Finde geprüfte Tierbetreuer, Hundesitter und Pflegedienste – vertrauensvoll und einfach buchbar.
        </p>
      </section>

      {/* Search bar */}
      <section className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(25,15%,55%)]" />
          <Input
            placeholder="PLZ oder Ort eingeben…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10 rounded-full border-[hsl(35,30%,85%)] bg-white"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-[hsl(35,30%,85%)] bg-white px-4 py-2 text-sm text-[hsl(25,20%,30%)]"
        >
          <option value="">Alle Services</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </section>

      {/* Results */}
      <section>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(25,85%,55%)] border-t-transparent" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Search className="h-10 w-10 text-[hsl(25,15%,75%)] mx-auto" />
            <p className="text-[hsl(25,15%,55%)]">Keine Anbieter gefunden. Versuche einen anderen Ort oder Service.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map(p => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="text-center py-10 space-y-4 rounded-2xl bg-gradient-to-br from-[hsl(25,85%,55%)] to-[hsl(35,80%,50%)] text-white">
        <h2 className="text-2xl font-bold">Du bist Tierbetreuer?</h2>
        <p className="text-white/80 max-w-md mx-auto">
          Werde Partner bei Lennox & Friends und erreiche neue Kunden in deiner Region.
        </p>
        <Link to="/auth">
          <Button variant="secondary" className="rounded-full font-semibold mt-2">
            Jetzt registrieren <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function ProviderCard({ provider }: { provider: SearchProvider }) {
  return (
    <Link to={`/website/tierservice/anbieter/${provider.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow border-[hsl(35,30%,90%)] bg-white cursor-pointer">
        {provider.cover_image_url ? (
          <div className="h-40 overflow-hidden rounded-t-2xl">
            <img src={provider.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-40 rounded-t-2xl bg-gradient-to-br from-[hsl(25,50%,92%)] to-[hsl(35,40%,88%)] flex items-center justify-center">
            <PawPrint className="h-12 w-12 text-[hsl(25,85%,55%,0.4)]" />
          </div>
        )}
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[hsl(25,30%,15%)] line-clamp-1">{provider.company_name}</h3>
            {provider.rating_avg != null && provider.rating_avg > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-[hsl(40,90%,45%)] shrink-0">
                <Star className="h-3.5 w-3.5 fill-current" />
                {provider.rating_avg.toFixed(1)}
              </div>
            )}
          </div>
          {provider.address && (
            <p className="text-xs text-[hsl(25,15%,55%)] flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" /> {provider.address}
            </p>
          )}
          {provider.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {provider.services.slice(0, 3).map(s => (
                <Badge key={s} variant="secondary" className="text-[10px] bg-[hsl(35,40%,94%)] text-[hsl(25,30%,35%)]">
                  {categoryLabels[s] || s}
                </Badge>
              ))}
              {provider.services.length > 3 && (
                <Badge variant="secondary" className="text-[10px] bg-[hsl(35,40%,94%)] text-[hsl(25,30%,35%)]">
                  +{provider.services.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
