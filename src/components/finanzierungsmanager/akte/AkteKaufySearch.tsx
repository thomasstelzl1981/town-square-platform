/**
 * AkteKaufySearch — Kaufy marketplace search + listing selection for FMFinanzierungsakte
 */
import { useRef, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ObjectFormData } from '@/components/finanzierung/FinanceObjectCard';

type SelectedListing = { public_id: string; title: string | null; city: string | null; postal_code: string | null; property_type: string | null; asking_price: number | null; total_area_sqm: number | null; year_built: number | null };

function mapPropertyType(pt: string | null): string {
  if (!pt) return '';
  const map: Record<string, string> = { apartment: 'eigentumswohnung', house: 'einfamilienhaus', multi_family: 'mehrfamilienhaus', land: 'grundstueck', commercial: 'gewerbe' };
  return map[pt] || '';
}

interface AkteKaufySearchProps {
  onAdopt: (objectData: Partial<ObjectFormData>, purchasePrice: string) => void;
}

export function AkteKaufySearch({ onAdopt }: AkteKaufySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedListings, setSelectedListings] = useState<SelectedListing[]>([]);
  const [adopted, setAdopted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: listings } = useQuery({
    queryKey: ['v_public_listings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_public_listings').select('public_id, title, city, postal_code, property_type, total_area_sqm, year_built, asking_price').order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    if (!searchQuery.trim()) return listings.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return listings.filter(l => l.public_id?.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.postal_code?.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, listings]);

  const handleSelect = (listing: NonNullable<typeof listings>[number]) => {
    if (selectedListings.some(s => s.public_id === listing.public_id)) return;
    setSelectedListings(prev => [...prev, { public_id: listing.public_id, title: listing.title, city: listing.city, postal_code: listing.postal_code, property_type: listing.property_type, asking_price: listing.asking_price, total_area_sqm: listing.total_area_sqm, year_built: listing.year_built }]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleAdopt = useCallback(() => {
    if (selectedListings.length === 0) return;
    const primary = selectedListings[0];
    onAdopt({
      city: primary.city ?? '', postalCode: primary.postal_code ?? '',
      objectType: mapPropertyType(primary.property_type), yearBuilt: primary.year_built?.toString() ?? '',
      livingArea: primary.total_area_sqm?.toString() ?? '',
    }, primary.asking_price?.toString() ?? '');
    setAdopted(true);
    toast.success(`${selectedListings.length} Objekt${selectedListings.length > 1 ? 'e' : ''} übernommen`);
  }, [selectedListings, onAdopt]);

  if (adopted) {
    return (
      <Card className="glass-card overflow-hidden border-green-500/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><h3 className="text-base font-semibold">Objekte aus Kaufy</h3><span className="text-xs text-muted-foreground">({selectedListings.length})</span></div>
          <div className="mt-1.5 space-y-1">
            {selectedListings.map(l => <p key={l.public_id} className="text-[11px] text-muted-foreground">{l.postal_code} {l.city} — {l.property_type ?? 'Objekt'} — {l.asking_price ? `${Number(l.asking_price).toLocaleString('de-DE')} €` : '—'}</p>)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1"><ShoppingBag className="h-4 w-4 text-primary" /><h3 className="text-base font-semibold">Objekte aus Kaufy</h3></div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Marktplatz durchsuchen — Stammdaten werden automatisch übernommen.
          {listings && listings.length > 0 && <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 font-medium">{listings.length} Objekte verfügbar</span>}
        </p>
        <div className="relative" ref={searchRef}>
          <Input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} placeholder="Objekt suchen (ID, Ort, Straße...)" className="h-7 text-xs" />
          {showDropdown && filteredListings.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto">
              {filteredListings.map(l => (
                <button key={l.public_id} className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors border-b last:border-b-0" onMouseDown={() => handleSelect(l)}>
                  <div className="font-medium">{l.public_id ?? '—'} — {l.title || l.property_type || 'Objekt'}</div>
                  <div className="text-muted-foreground">{l.postal_code ?? ''} {l.city ?? ''}</div>
                  <div className="text-muted-foreground">{l.asking_price ? `${Number(l.asking_price).toLocaleString('de-DE')} €` : '—'} | {l.property_type ?? '—'} | {l.total_area_sqm ? `${l.total_area_sqm} qm` : '—'}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedListings.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedListings.map(l => (
              <span key={l.public_id} className="inline-flex items-center gap-1 rounded-md bg-muted/50 border text-[11px] px-2 py-1">
                {l.public_id} | {l.postal_code} {l.city} | {l.asking_price ? `${Number(l.asking_price).toLocaleString('de-DE')} €` : '—'} | {l.property_type ?? ''} {l.total_area_sqm ? `${l.total_area_sqm}qm` : ''}
                <button onClick={() => setSelectedListings(prev => prev.filter(s => s.public_id !== l.public_id))} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <Button size="sm" disabled={selectedListings.length === 0} onClick={handleAdopt} className="w-full gap-1.5 h-7 text-xs mt-2">
          <ShoppingBag className="h-3 w-3" />{selectedListings.length <= 1 ? 'Objekt übernehmen' : `${selectedListings.length} Objekte übernehmen`}
        </Button>
      </CardContent>
    </Card>
  );
}
