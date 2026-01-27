import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, Heart, ArrowRight, Loader2, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublicListing {
  id: string;
  public_id: string;
  title: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  monthly_rent_total: number;
  unit_count: number;
  hero_image_path: string | null;
}

export default function KaufyImmobilien() {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kaufy_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  // Fetch listings from database
  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ['public-listings'],
    queryFn: async () => {
      // Try to get from v_public_listings view first
      const { data: viewData, error: viewError } = await supabase
        .from('listings')
        .select(`
          id,
          public_id,
          title,
          asking_price,
          status,
          properties!inner (
            id,
            property_type,
            address,
            city,
            postal_code,
            total_area_sqm
          )
        `)
        .eq('status', 'active')
        .limit(20);

      if (viewError) {
        console.error('Listings query error:', viewError);
        return [];
      }

      // Transform to expected format
      return (viewData || []).map((l: any) => ({
        id: l.id,
        public_id: l.public_id,
        title: l.title || `Objekt ${l.properties?.city || ''}`,
        asking_price: l.asking_price || 0,
        property_type: l.properties?.property_type || 'multi_family',
        address: l.properties?.address || '',
        city: l.properties?.city || '',
        postal_code: l.properties?.postal_code || '',
        total_area_sqm: l.properties?.total_area_sqm || 0,
        monthly_rent_total: 0, // Would come from units aggregation
        unit_count: 0,
        hero_image_path: null,
      }));
    },
  });

  const toggleFavorite = (publicId: string) => {
    const newFavorites = favorites.includes(publicId) 
      ? favorites.filter(f => f !== publicId) 
      : [...favorites, publicId];
    setFavorites(newFavorites);
    localStorage.setItem('kaufy_favorites', JSON.stringify(newFavorites));
  };

  const filteredListings = listings.filter((l: PublicListing) => 
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasListings = filteredListings.length > 0;

  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Kapitalanlage-Immobilien</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Entdecken Sie aktuelle Angebote von geprüften Anbietern.
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
              <input
                type="text"
                placeholder="Stadt oder Objektart suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/10 focus:border-black/30 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="flex items-center justify-between mb-8">
            <p className="zone3-text-small">
              {isLoading ? 'Lade Objekte...' : `${filteredListings.length} Objekte gefunden`}
            </p>
            {favorites.length > 0 && (
              <p className="zone3-text-small flex items-center gap-2">
                <Heart className="w-4 h-4 fill-current" />
                {favorites.length} gemerkt
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !hasListings ? (
            // Empty State
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-black/5 flex items-center justify-center">
                <Home className="w-12 h-12 text-black/30" />
              </div>
              <h3 className="zone3-heading-3 mb-3">Noch keine Objekte verfügbar</h3>
              <p className="zone3-text-small max-w-md mx-auto mb-8">
                Aktuell sind keine Immobilien zur Kapitalanlage veröffentlicht. 
                Registrieren Sie sich, um benachrichtigt zu werden, sobald neue Objekte verfügbar sind.
              </p>
              <Link to="/auth?source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
                Für Updates registrieren
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing: PublicListing) => (
                  <div key={listing.id} className="zone3-card overflow-hidden">
                    {/* Image placeholder */}
                    <div className="h-48 bg-black/5 flex items-center justify-center relative">
                      {listing.hero_image_path ? (
                        <img 
                          src={listing.hero_image_path} 
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-16 h-16 text-black/20" />
                      )}
                      <button
                        onClick={() => toggleFavorite(listing.public_id)}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Heart 
                          className={`w-5 h-5 ${favorites.includes(listing.public_id) ? 'fill-red-500 text-red-500' : 'text-black/40'}`} 
                        />
                      </button>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="zone3-heading-3 mb-2">{listing.title}</h3>
                      <p className="zone3-text-small flex items-center gap-1 mb-4">
                        <MapPin className="w-4 h-4" />
                        {listing.postal_code} {listing.city}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div>
                          <span className="text-black/50">Preis</span>
                          <p className="font-semibold">{listing.asking_price?.toLocaleString('de-DE') || '–'} €</p>
                        </div>
                        <div>
                          <span className="text-black/50">Fläche</span>
                          <p className="font-semibold">{listing.total_area_sqm || '–'} m²</p>
                        </div>
                        <div>
                          <span className="text-black/50">Einheiten</span>
                          <p className="font-semibold">{listing.unit_count || '–'}</p>
                        </div>
                        <div>
                          <span className="text-black/50">Ort</span>
                          <p className="font-semibold">{listing.city}</p>
                        </div>
                      </div>
                      
                      <Link 
                        to={`/kaufy/immobilien/${listing.public_id}`}
                        className="zone3-btn-primary w-full text-center block text-sm"
                      >
                        Details ansehen
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more hint */}
              <div className="text-center mt-12">
                <p className="zone3-text-small mb-4">
                  Registrieren Sie sich für Zugang zu allen Objekten und Detailinformationen.
                </p>
                <Link to="/auth?source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
                  Kostenlos registrieren
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
