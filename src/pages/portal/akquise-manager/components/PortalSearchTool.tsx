/**
 * Portal Search Tool
 * 
 * Search ImmoScout24, Immowelt, eBay-Kleinanzeigen for listings and brokers
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Users, Building2, ExternalLink, Phone, Mail } from 'lucide-react';
import { usePortalSearch, type PortalType, type SearchType, type PortalSearchResult } from '@/hooks/useAcqTools';
import { formatCurrency } from '@/lib/formatters';

const PORTAL_OPTIONS: { value: PortalType; label: string }[] = [
  { value: 'immoscout24', label: 'ImmoScout24' },
  { value: 'immowelt', label: 'Immowelt' },
  { value: 'ebay_kleinanzeigen', label: 'eBay Kleinanzeigen' },
];

const OBJECT_TYPES = ['MFH', 'ETW', 'ZFH', 'Gewerbe'];

export function PortalSearchTool() {
  const [portal, setPortal] = React.useState<PortalType>('immoscout24');
  const [searchType, setSearchType] = React.useState<SearchType>('listings');
  const [query, setQuery] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [priceMin, setPriceMin] = React.useState<string>('');
  const [priceMax, setPriceMax] = React.useState<string>('');
  const [results, setResults] = React.useState<PortalSearchResult[]>([]);

  const portalSearch = usePortalSearch();

  const handleSearch = async () => {
    const searchResult = await portalSearch.mutateAsync({
      portal,
      searchType,
      query: query || undefined,
      region: region || undefined,
      priceMin: priceMin ? parseInt(priceMin) : undefined,
      priceMax: priceMax ? parseInt(priceMax) : undefined,
    });
    setResults(searchResult.results || []);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Portal-Recherche
        </CardTitle>
        <CardDescription>
          Durchsuchen Sie Immobilienportale nach passenden Objekten oder Maklern
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Form */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Portal</Label>
            <Select value={portal} onValueChange={(v) => setPortal(v as PortalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PORTAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Suchbegriff</Label>
            <Input
              placeholder="z.B. MFH Berlin"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <Input
              placeholder="z.B. Berlin, München"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Preisspanne</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant={searchType === 'listings' ? 'default' : 'outline'}
            onClick={() => {
              setSearchType('listings');
              handleSearch();
            }}
            disabled={portalSearch.isPending}
          >
            {portalSearch.isPending && searchType === 'listings' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            Objekte suchen
          </Button>
          <Button
            variant={searchType === 'brokers' ? 'default' : 'outline'}
            onClick={() => {
              setSearchType('brokers');
              handleSearch();
            }}
            disabled={portalSearch.isPending}
          >
            {portalSearch.isPending && searchType === 'brokers' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Makler suchen
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Ergebnisse ({results.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.title || item.broker_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {PORTAL_OPTIONS.find((p) => p.value === item.portal)?.label}
                        </Badge>
                      </div>
                      
                      {searchType === 'listings' ? (
                        <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          {item.address && <p>{item.address}, {item.city}</p>}
                          <div className="flex gap-3 flex-wrap">
                            {item.price && <span>{formatCurrency(item.price)}</span>}
                            {item.units && <span>{item.units} WE</span>}
                            {item.area_sqm && <span>{item.area_sqm} m²</span>}
                            {item.yield_percent && <span>{item.yield_percent}% Rendite</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          {item.broker_company && <p>{item.broker_company}</p>}
                          <div className="flex gap-3 flex-wrap">
                            {item.broker_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {item.broker_phone}
                              </span>
                            )}
                            {item.broker_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {item.broker_email}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {item.url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {portalSearch.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
