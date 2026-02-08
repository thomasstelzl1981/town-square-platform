import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Loader2, Home } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { InvestmentSearchCard } from '@/components/zone3/kaufy/InvestmentSearchCard';

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
  status: string;
  hero_image_path: string | null;
  monthly_rent_total: number;
}

export default function KaufyImmobilien() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [metricsCache, setMetricsCache] = useState<Record<string, any>>({});
  const { calculate, isLoading: isCalculating } = useInvestmentEngine();

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

  // Fetch only Kaufy-published listings (gemäß Plan: channel='kaufy')
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['kaufy-public-listings'],
    queryFn: async () => {
      // 1. Get listing IDs with active Kaufy publication
      const { data: kaufyPubs, error: pubError } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'kaufy')
        .eq('status', 'active');

      if (pubError) {
        console.error('Publication query error:', pubError);
        return [];
      }

      const listingIds = kaufyPubs?.map(p => p.listing_id) || [];
      
      if (listingIds.length === 0) return [];

      // 2. Fetch listing details with property info
      const { data: listingsData, error: listingsError } = await supabase
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
            total_area_sqm,
            annual_income
          )
        `)
        .in('id', listingIds)
        .in('status', ['active', 'reserved']);

      if (listingsError) {
        console.error('Listings query error:', listingsError);
        return [];
      }

      // 3. Fetch hero images for all properties
      const propertyIds = (listingsData || []).map((l: any) => l.properties?.id).filter(Boolean);
      
      let heroImages: Record<string, string> = {};
      
      if (propertyIds.length > 0) {
        // Get cover images from document_links
        const { data: imageLinks } = await supabase
          .from('document_links')
          .select(`
            object_id,
            is_title_image,
            documents!inner (
              id,
              file_path,
              mime_type
            )
          `)
          .eq('object_type', 'property')
          .in('object_id', propertyIds)
          .like('documents.mime_type', 'image/%');

        // Get first/cover image for each property
        for (const link of (imageLinks || [])) {
          const propId = link.object_id;
          const doc = link.documents as any;
          
          // Prefer title image, otherwise use first found
          if (!heroImages[propId] || link.is_title_image) {
            const { data: urlData } = await supabase.storage
              .from('tenant-documents')
              .createSignedUrl(doc.file_path, 3600);
            
            if (urlData?.signedUrl) {
              heroImages[propId] = urlData.signedUrl;
            }
          }
        }
      }

      // Transform to expected format with monthly_rent_total
      return (listingsData || []).map((l: any) => {
        const annualIncome = l.properties?.annual_income || 0;
        const monthlyRent = annualIncome > 0 
          ? annualIncome / 12 
          : (l.asking_price || 0) * 0.04 / 12;

        return {
          id: l.id,
          public_id: l.public_id || l.id,
          title: l.title || `Objekt ${l.properties?.city || ''}`,
          asking_price: l.asking_price || 0,
          property_type: l.properties?.property_type || 'multi_family',
          address: l.properties?.address || '',
          city: l.properties?.city || '',
          postal_code: l.properties?.postal_code || '',
          total_area_sqm: l.properties?.total_area_sqm || 0,
          status: l.status,
          hero_image_path: heroImages[l.properties?.id] || null,
          monthly_rent_total: Math.round(monthlyRent),
        };
      });
    },
  });

  const toggleFavorite = (publicId: string) => {
    const newFavorites = favorites.includes(publicId) 
      ? favorites.filter(f => f !== publicId) 
      : [...favorites, publicId];
    setFavorites(newFavorites);
    localStorage.setItem('kaufy_favorites', JSON.stringify(newFavorites));
  };

  // Investment search handler - calculates metrics for all listings
  const handleInvestmentSearch = useCallback(async (params: {
    zvE: number;
    equity: number;
    maritalStatus: 'single' | 'married';
    hasChurchTax: boolean;
    state: string;
  }) => {
    if (listings.length === 0) {
      setHasSearched(true);
      return;
    }

    const newCache: Record<string, any> = {};

    await Promise.all(
      listings.slice(0, 20).map(async (listing: PublicListing) => {
        const input: CalculationInput = {
          ...defaultInput,
          purchasePrice: listing.asking_price,
          monthlyRent: listing.monthly_rent_total || (listing.asking_price * 0.04 / 12),
          equity: params.equity,
          taxableIncome: params.zvE,
          maritalStatus: params.maritalStatus,
          hasChurchTax: params.hasChurchTax,
          churchTaxState: params.state,
        };

        const result = await calculate(input);
        if (result) {
          newCache[listing.id] = {
            monthlyBurden: result.summary.monthlyBurden,
            roiAfterTax: result.summary.roiAfterTax,
            loanAmount: result.summary.loanAmount,
            yearlyInterest: result.summary.yearlyInterest,
            yearlyRepayment: result.summary.yearlyRepayment,
            yearlyTaxSavings: result.summary.yearlyTaxSavings,
          };
        }
      })
    );

    setMetricsCache(newCache);
    setHasSearched(true);
  }, [listings, calculate]);

  const hasListings = listings.length > 0;

  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Kapitalanlage-Immobilien</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Entdecken Sie aktuelle Angebote von geprüften Anbietern.
          </p>
          
          {/* Investment Search Card */}
          <div className="max-w-3xl mx-auto">
            <InvestmentSearchCard 
              onSearch={handleInvestmentSearch} 
              isLoading={isCalculating} 
            />
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="flex items-center justify-between mb-8">
            <p className="zone3-text-small">
              {isLoading ? 'Lade Objekte...' : `${listings.length} Objekte gefunden`}
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
                {listings.map((listing: PublicListing) => (
                  <InvestmentResultTile
                    key={listing.id}
                    listing={{
                      listing_id: listing.id,
                      public_id: listing.public_id,
                      title: listing.title,
                      asking_price: listing.asking_price,
                      property_type: listing.property_type,
                      address: listing.address,
                      city: listing.city,
                      postal_code: listing.postal_code,
                      total_area_sqm: listing.total_area_sqm,
                      unit_count: 1,
                      monthly_rent_total: listing.monthly_rent_total,
                      hero_image_path: listing.hero_image_path,
                    }}
                    metrics={hasSearched ? metricsCache[listing.id] : null}
                    isFavorite={favorites.includes(listing.public_id)}
                    onToggleFavorite={() => toggleFavorite(listing.public_id)}
                    linkPrefix="/kaufy/immobilien"
                  />
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
