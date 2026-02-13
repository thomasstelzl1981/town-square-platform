/**
 * ObjectSearchPanel — Reusable search/filter component for acq_offers
 * Used in both Zone 1 (AcquiaryDatenbank) and Zone 2 (AkquiseDatenbank)
 */
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, ChevronDown, X, SlidersHorizontal } from 'lucide-react';

export interface ObjectFilters {
  search: string;
  status: string;
  sourceType: string;
  mandateId: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  city: string;
  yieldMin: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: ObjectFilters = {
  search: '',
  status: 'all',
  sourceType: 'all',
  mandateId: 'all',
  priceMin: '',
  priceMax: '',
  areaMin: '',
  areaMax: '',
  city: '',
  yieldMin: '',
  sortBy: 'created_at',
  sortDir: 'desc',
};

interface ObjectSearchPanelProps {
  filters: ObjectFilters;
  onFiltersChange: (filters: ObjectFilters) => void;
  resultCount: number;
  showMandateFilter?: boolean;
  mandates?: Array<{ id: string; code: string; client_display_name?: string | null }>;
}

export function ObjectSearchPanel({
  filters,
  onFiltersChange,
  resultCount,
  showMandateFilter = false,
  mandates = [],
}: ObjectSearchPanelProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const update = (partial: Partial<ObjectFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const activeFilterCount = [
    filters.status !== 'all',
    filters.sourceType !== 'all',
    filters.mandateId !== 'all',
    filters.priceMin !== '',
    filters.priceMax !== '',
    filters.areaMin !== '',
    filters.areaMax !== '',
    filters.city !== '',
    filters.yieldMin !== '',
  ].filter(Boolean).length;

  const resetFilters = () => onFiltersChange({ ...DEFAULT_FILTERS, search: filters.search });

  return (
    <div className="space-y-3">
      {/* Main search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Titel, Adresse, Stadt, PLZ..."
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
        <Select value={filters.sortBy} onValueChange={v => update({ sortBy: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sortierung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Datum</SelectItem>
            <SelectItem value="price_asking">Preis</SelectItem>
            <SelectItem value="yield_indicated">Rendite</SelectItem>
            <SelectItem value="city">Stadt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expandable filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={filters.status} onValueChange={v => update({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="new">Neu</SelectItem>
                  <SelectItem value="analyzing">In Analyse</SelectItem>
                  <SelectItem value="analyzed">Analysiert</SelectItem>
                  <SelectItem value="presented">Präsentiert</SelectItem>
                  <SelectItem value="accepted">Akzeptiert</SelectItem>
                  <SelectItem value="rejected">Abgelehnt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Quelle</label>
              <Select value={filters.sourceType} onValueChange={v => update({ sourceType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="inbound_email">E-Mail</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="manual">Manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showMandateFilter && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mandat</label>
                <Select value={filters.mandateId} onValueChange={v => update({ mandateId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mandate</SelectItem>
                    {mandates.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Stadt / PLZ</label>
              <Input placeholder="z.B. Berlin, 10115" value={filters.city} onChange={e => update({ city: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preis von</label>
              <Input type="number" placeholder="€ Min" value={filters.priceMin} onChange={e => update({ priceMin: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preis bis</label>
              <Input type="number" placeholder="€ Max" value={filters.priceMax} onChange={e => update({ priceMax: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fläche von (m²)</label>
              <Input type="number" placeholder="m² Min" value={filters.areaMin} onChange={e => update({ areaMin: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mindestrendite (%)</label>
              <Input type="number" placeholder="z.B. 4.5" value={filters.yieldMin} onChange={e => update({ yieldMin: e.target.value })} />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">{activeFilterCount} Filter aktiv</span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-3 w-3 mr-1" /> Filter zurücksetzen
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Result count */}
      <div className="text-sm text-muted-foreground">{resultCount} Objekte gefunden</div>
    </div>
  );
}
