import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, MapPin, Phone, Globe, Star, Plus, X, Loader2, Building2, Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  location: string; // City/Address for search
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualProvider, setManualProvider] = useState<Partial<SelectedProvider>>({});

  // Build search query based on category
  const getCategorySearchTerm = (cat: string): string => {
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
  };

  // Search for providers via Google Places API (Edge Function)
  const handleSearch = useCallback(async () => {
    if (!location) {
      toast.error('Bitte geben Sie einen Standort an');
      return;
    }

    setIsSearching(true);
    try {
      const query = searchQuery 
        ? `${searchQuery} ${location}` 
        : `${getCategorySearchTerm(category)} ${location}`;
      
      const { data, error } = await supabase.functions.invoke('sot-places-search', {
        body: { query, location }
      });

      if (error) throw error;

      if (data?.results) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          toast.info('Keine Ergebnisse gefunden. Versuchen Sie einen anderen Suchbegriff.');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Fehler bei der Suche. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, category, location]);

  // Toggle provider selection
  const toggleProvider = (place: PlaceResult) => {
    const isSelected = selectedProviders.some(p => p.place_id === place.place_id);
    
    if (isSelected) {
      onProvidersChange(selectedProviders.filter(p => p.place_id !== place.place_id));
    } else {
      onProvidersChange([
        ...selectedProviders,
        {
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          phone: place.phone_number,
          website: place.website,
        }
      ]);
    }
  };

  // Add manual provider
  const addManualProvider = () => {
    if (!manualProvider.name || !manualProvider.email) {
      toast.error('Name und E-Mail sind erforderlich');
      return;
    }

    onProvidersChange([
      ...selectedProviders,
      {
        place_id: `manual_${Date.now()}`,
        name: manualProvider.name,
        address: manualProvider.address || '',
        phone: manualProvider.phone,
        email: manualProvider.email,
        website: manualProvider.website,
      }
    ]);

    setManualProvider({});
    setManualEntry(false);
    toast.success('Dienstleister hinzugefügt');
  };

  // Remove provider
  const removeProvider = (placeId: string) => {
    onProvidersChange(selectedProviders.filter(p => p.place_id !== placeId));
  };

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Dienstleister suchen
          </CardTitle>
          <CardDescription>
            Suchen Sie nach Handwerksbetrieben in der Nähe des Objekts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={`z.B. "${getCategorySearchTerm(category)}" oder Firmenname`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Standort: {location || 'Nicht angegeben'}</span>
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {searchResults.map((place) => {
                const isSelected = selectedProviders.some(p => p.place_id === place.place_id);
                return (
                  <div
                    key={place.place_id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                      ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleProvider(place)}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{place.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {place.formatted_address}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {place.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {place.phone_number}
                          </span>
                        )}
                        {place.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {place.rating} ({place.user_ratings_total})
                          </span>
                        )}
                        {place.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Website
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Manuell hinzufügen</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setManualEntry(!manualEntry)}
            >
              {manualEntry ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {manualEntry && (
          <CardContent className="space-y-3">
            <Input
              placeholder="Firmenname *"
              value={manualProvider.name || ''}
              onChange={(e) => setManualProvider({ ...manualProvider, name: e.target.value })}
            />
            <Input
              placeholder="E-Mail *"
              type="email"
              value={manualProvider.email || ''}
              onChange={(e) => setManualProvider({ ...manualProvider, email: e.target.value })}
            />
            <Input
              placeholder="Telefon"
              value={manualProvider.phone || ''}
              onChange={(e) => setManualProvider({ ...manualProvider, phone: e.target.value })}
            />
            <Input
              placeholder="Adresse"
              value={manualProvider.address || ''}
              onChange={(e) => setManualProvider({ ...manualProvider, address: e.target.value })}
            />
            <Button onClick={addManualProvider} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Hinzufügen
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Selected Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Ausgewählte Dienstleister
            <Badge variant="secondary">{selectedProviders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedProviders.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-lg">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Noch keine Dienstleister ausgewählt
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Suchen Sie oben nach Anbietern oder fügen Sie manuell hinzu
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProviders.map((provider) => (
                <div
                  key={provider.place_id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{provider.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {provider.email || provider.phone || provider.address}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProvider(provider.place_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
