/**
 * Pets — Caring Tab (Redesign V2)
 * Service-Suchmaschine: 4 Kategorie-Kacheln + PLZ-Suche + Anbieter-Ergebnisse
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footprints, Sun, Home, Scissors, Baby, Search, Star, MapPin } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { CARD, DEMO_WIDGET, getActiveWidgetGlow } from '@/config/designManifest';
import { useSearchProviders } from '@/hooks/usePetProviderSearch';
import { isDemoId } from '@/engines/demoData/engine';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const SERVICE_CATEGORIES = [
  { key: 'boarding', label: 'Pension', icon: Home, description: 'Mehrtägige Unterbringung' },
  { key: 'daycare', label: 'Tagesstätte', icon: Sun, description: 'Tagesbetreuung' },
  { key: 'walking', label: 'Gassi-Service', icon: Footprints, description: 'Dog-Walking' },
  { key: 'grooming', label: 'Hundesalon', icon: Scissors, description: 'Pflege & Styling' },
  { key: 'puppy_class', label: 'Welpenspielstunde', icon: Baby, description: 'Sozialisierung & Training' },
] as const;

export default function PetsCaring() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTriggered, setSearchTriggered] = useState(true);

  const { data: providers = [], isLoading } = useSearchProviders(
    searchTriggered ? searchLocation : undefined,
    searchTriggered ? selectedCategory : undefined,
  );

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prev => prev === category ? '' : category);
  };

  const handleSearch = () => {
    setSearchTriggered(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="CARING"
        description="Finde den passenden Service für dein Tier"
      />

      {/* Service-Kategorie-Kacheln */}
      <WidgetGrid variant="widget" className="mb-6">
        {SERVICE_CATEGORIES.slice(0, 4).map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <WidgetCell key={cat.key}>
              <button
                onClick={() => handleCategoryClick(cat.key)}
                className={cn(
                  'w-full h-full rounded-xl border p-4 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer',
                  isActive ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50 bg-card',
                )}
              >
                <div className={cn(
                  'p-3 rounded-lg',
                  isActive ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground',
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
              </button>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Full-width Suchfeld */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="PLZ oder Ort eingeben…"
            value={searchLocation}
            onChange={e => setSearchLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11"
          />
        </div>
        <Button onClick={handleSearch} className="h-11 px-6" disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Suchen
        </Button>
      </div>

      {/* Ergebnis-Grid */}
      {searchTriggered && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Unsere Partner</h2>
            <Separator className="mt-2" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mt-3">
                Keine Anbieter gefunden. Versuche eine andere PLZ oder einen anderen Service.
              </p>
            </div>
          ) : (
            <WidgetGrid variant="widget">
              {providers.map(provider => (
                <WidgetCell key={provider.id}>
                  <button
                    onClick={() => navigate(`provider/${provider.id}`)}
                    className={cn(
                      CARD.BASE, CARD.INTERACTIVE,
                      'w-full h-full flex flex-col justify-between p-5 text-left relative overflow-hidden',
                      isDemoId(provider.id) ? getActiveWidgetGlow('emerald') : getActiveWidgetGlow('teal'),
                    )}
                  >
                    {isDemoId(provider.id) && (
                      <Badge className={cn(DEMO_WIDGET.BADGE, 'absolute top-3 right-3 text-[10px]')}>DEMO</Badge>
                    )}
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{provider.company_name}</h4>
                      {provider.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {provider.address}
                        </p>
                      )}
                      {provider.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{provider.bio}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3.5 w-3.5',
                              i < Math.round(provider.rating_avg || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30',
                            )}
                          />
                        ))}
                        {provider.rating_avg != null && (
                          <span className="text-xs text-muted-foreground ml-1">{provider.rating_avg.toFixed(1)}</span>
                        )}
                      </div>
                      {/* Service-Badges */}
                      {provider.services && provider.services.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {provider.services.slice(0, 3).map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px]">
                              {SERVICE_CATEGORIES.find(c => c.key === s)?.label || s}
                            </Badge>
                          ))}
                          {provider.services.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">+{provider.services.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </WidgetCell>
              ))}
            </WidgetGrid>
          )}
        </>
      )}
    </PageShell>
  );
}
