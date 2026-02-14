/**
 * ProviderSearchPanel — Uses sot-research-engine for contractor search
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, MapPin, Phone, Globe, Star, Plus, X, Loader2, Building2, Users, Mail, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { DESIGN } from '@/config/designManifest';
import { useResearchEngine, type ResearchContact } from '@/hooks/useResearchEngine';

// ============================================================================
// Types
// ============================================================================
export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  email?: string;
  emailLoading?: boolean;
}

export interface SelectedProvider {
  place_id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface ProviderSearchPanelProps {
  category: string;
  location: string;
  selectedProviders: SelectedProvider[];
  onProvidersChange: (providers: SelectedProvider[]) => void;
}

// ============================================================================
// Component
// ============================================================================
export function ProviderSearchPanel({
  category,
  location,
  selectedProviders,
  onProvidersChange,
}: ProviderSearchPanelProps) {
  const getCategorySearchTerm = useCallback((cat: string): string => {
    const terms: Record<string, string> = {
      sanitaer: 'Sanitär Installateur',
      elektro: 'Elektriker',
      maler: 'Maler Lackierer',
      dach: 'Dachdecker',
      fenster: 'Fensterbauer Tischler',
      heizung: 'Heizungsbauer',
      gutachter: 'Sachverständiger Immobilien',
      hausverwaltung: 'Hausmeisterservice',
      sonstige: 'Handwerker',
    };
    return terms[cat] || 'Handwerker';
  }, []);

  const [searchQuery, setSearchQuery] = useState(() => getCategorySearchTerm(category));
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const hasAutoSearched = useRef(false);
  const [showManual, setShowManual] = useState(false);
  const [manualProvider, setManualProvider] = useState<Partial<SelectedProvider>>({});
  const [manualEmails, setManualEmails] = useState<Record<string, string>>({});

  const { search, isSearching } = useResearchEngine();

  const handleSearch = useCallback(async () => {
    if (!location) { toast.error('Bitte geben Sie einen Standort an'); return; }
    
    const query = searchQuery 
      ? searchQuery
      : getCategorySearchTerm(category);

    const response = await search({
      intent: 'find_contractors',
      query,
      location,
      max_results: 20,
      filters: { industry: category },
      context: { module: 'sanierung' },
    });

    if (response?.results) {
      const mapped: PlaceResult[] = response.results.map((r: ResearchContact, idx: number) => ({
        place_id: `engine_${idx}_${Date.now()}`,
        name: r.name,
        formatted_address: r.address || '',
        phone_number: r.phone || undefined,
        website: r.website || undefined,
        rating: r.rating || undefined,
        user_ratings_total: r.reviews_count || undefined,
        email: r.email || undefined,
        emailLoading: false,
      }));
      setSearchResults(mapped);
      if (mapped.length === 0) {
        toast.info('Keine Ergebnisse gefunden.');
      }
    }
  }, [searchQuery, category, location, getCategorySearchTerm, search]);

  useEffect(() => {
    if (location && !hasAutoSearched.current) {
      hasAutoSearched.current = true;
      handleSearch();
    }
  }, [location, handleSearch]);

  const toggleProvider = (place: PlaceResult) => {
    const isSelected = selectedProviders.some(p => p.place_id === place.place_id);
    if (isSelected) {
      onProvidersChange(selectedProviders.filter(p => p.place_id !== place.place_id));
    } else {
      const email = place.email || manualEmails[place.place_id] || undefined;
      onProvidersChange([...selectedProviders, {
        place_id: place.place_id, name: place.name, address: place.formatted_address,
        phone: place.phone_number, email, website: place.website,
      }]);
    }
  };

  const addManualProvider = () => {
    if (!manualProvider.name || !manualProvider.email) {
      toast.error('Name und E-Mail sind erforderlich');
      return;
    }
    onProvidersChange([...selectedProviders, {
      place_id: `manual_${Date.now()}`, name: manualProvider.name,
      address: manualProvider.address || '', phone: manualProvider.phone,
      email: manualProvider.email, website: manualProvider.website,
    }]);
    setManualProvider({});
    setShowManual(false);
    toast.success('Dienstleister hinzugefügt');
  };

  const removeProvider = (placeId: string) => {
    onProvidersChange(selectedProviders.filter(p => p.place_id !== placeId));
  };

  const handleManualEmailChange = (placeId: string, email: string) => {
    setManualEmails(prev => ({ ...prev, [placeId]: email }));
    const selected = selectedProviders.find(p => p.place_id === placeId);
    if (selected) {
      onProvidersChange(selectedProviders.map(p =>
        p.place_id === placeId ? { ...p, email } : p
      ));
    }
  };

  return (
    <div className={DESIGN.SPACING.CARD}>
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          placeholder={`z.B. "${getCategorySearchTerm(category)}"`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>{location || 'Kein Standort'}</span>
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 border rounded-lg">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
          {searchResults.map((place) => {
            const isSelected = selectedProviders.some(p => p.place_id === place.place_id);
            return (
              <div
                key={place.place_id}
                className={`p-2.5 border rounded-lg transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-start gap-2.5 cursor-pointer" onClick={() => toggleProvider(place)}>
                  <Checkbox checked={isSelected} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{place.name}</div>
                    <div className={DESIGN.TYPOGRAPHY.HINT + ' truncate'}>{place.formatted_address}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      {place.phone_number && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{place.phone_number}</span>}
                      {place.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" />{place.rating}</span>}
                      {place.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Web</span>}
                      {place.email ? (
                        <span className="flex items-center gap-1 text-foreground font-medium"><Mail className="h-3 w-3" />{place.email}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {!place.email && (
                  <div className="mt-1.5 ml-7 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                    <Input
                      className="h-6 text-xs"
                      placeholder="E-Mail eingeben"
                      type="email"
                      value={manualEmails[place.place_id] || ''}
                      onChange={(e) => handleManualEmailChange(place.place_id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Selected Providers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className={DESIGN.TYPOGRAPHY.CARD_TITLE + ' flex items-center gap-2'}>
            <Users className="h-3.5 w-3.5" />
            Ausgewählt
            <Badge variant="secondary" className="text-[10px]">{selectedProviders.length}</Badge>
          </h4>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowManual(!showManual)}>
            <Plus className="h-3 w-3 mr-1" />
            Manuell
          </Button>
        </div>

        {showManual && (
          <div className="space-y-2 mb-3 p-3 border border-dashed rounded-lg">
            <Input placeholder="Firmenname *" value={manualProvider.name || ''} onChange={(e) => setManualProvider({ ...manualProvider, name: e.target.value })} className="h-8 text-sm" />
            <Input placeholder="E-Mail *" type="email" value={manualProvider.email || ''} onChange={(e) => setManualProvider({ ...manualProvider, email: e.target.value })} className="h-8 text-sm" />
            <Input placeholder="Telefon" value={manualProvider.phone || ''} onChange={(e) => setManualProvider({ ...manualProvider, phone: e.target.value })} className="h-8 text-sm" />
            <Button size="sm" onClick={addManualProvider} className="w-full h-8">
              <Plus className="h-3 w-3 mr-1" />
              Hinzufügen
            </Button>
          </div>
        )}

        {selectedProviders.length === 0 ? (
          <div className="text-center py-4 border border-dashed rounded-lg">
            <Building2 className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/50" />
            <p className={DESIGN.TYPOGRAPHY.HINT}>Noch keine Dienstleister ausgewählt</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {selectedProviders.map((provider) => (
              <div key={provider.place_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{provider.name}</div>
                  <div className={DESIGN.TYPOGRAPHY.HINT}>
                    {provider.email ? (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{provider.email}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="h-3 w-3" />Keine E-Mail</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeProvider(provider.place_id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
