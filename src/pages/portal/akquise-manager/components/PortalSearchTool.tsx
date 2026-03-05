/**
 * Portal Search Tool — Phase 1
 * 
 * Searches ImmoScout24, Immowelt, Kleinanzeigen in parallel.
 * No broker search — only property listings.
 * Shows per-portal run status and structured results.
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Building2, ExternalLink, MapPin, Home, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { usePortalSearch, type PortalSearchResult, type PortalRunDiagnostics } from '@/hooks/useAcqTools';
import { formatCurrency } from '@/lib/formatters';

const OBJECT_TYPE_OPTIONS = [
  { value: '', label: 'Alle Objektarten' },
  { value: 'MFH', label: 'Mehrfamilienhaus' },
  { value: 'ETW', label: 'Eigentumswohnung' },
  { value: 'ZFH', label: 'Zweifamilienhaus' },
  { value: 'EFH', label: 'Einfamilienhaus' },
  { value: 'Gewerbe', label: 'Gewerbe' },
  { value: 'Grundstück', label: 'Grundstück' },
];

const PORTAL_LABELS: Record<string, string> = {
  immoscout24: 'ImmoScout24',
  immowelt: 'Immowelt',
  ebay_kleinanzeigen: 'Kleinanzeigen',
};

const PORTAL_COLORS: Record<string, string> = {
  immoscout24: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  immowelt: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ebay_kleinanzeigen: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export function PortalSearchTool() {
  const [region, setRegion] = React.useState('');
  const [priceMin, setPriceMin] = React.useState('');
  const [priceMax, setPriceMax] = React.useState('');
  const [areaMin, setAreaMin] = React.useState('');
  const [areaMax, setAreaMax] = React.useState('');
  const [objectType, setObjectType] = React.useState('');
  const [results, setResults] = React.useState<PortalSearchResult[]>([]);
  const [diagnostics, setDiagnostics] = React.useState<PortalRunDiagnostics | null>(null);

  const portalSearch = usePortalSearch();

  const handleSearch = async () => {
    setResults([]);
    setDiagnostics(null);
    
    const searchResult = await portalSearch.mutateAsync({
      region: region || undefined,
      priceMin: priceMin ? parseInt(priceMin) : undefined,
      priceMax: priceMax ? parseInt(priceMax) : undefined,
      areaMin: areaMin ? parseInt(areaMin) : undefined,
      areaMax: areaMax ? parseInt(areaMax) : undefined,
      objectTypes: objectType ? [objectType] : undefined,
    });
    
    setResults(searchResult.results || []);
    setDiagnostics(searchResult.diagnostics || null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Objektfinder — Portalsuche
        </CardTitle>
        <CardDescription>
          Durchsucht ImmoScout24, Immowelt und Kleinanzeigen parallel nach passenden Objekten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Form */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Region / Stadt</Label>
            <Input
              placeholder="z.B. Berlin, München, Hamburg"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Objektart</Label>
            <Select value={objectType} onValueChange={setObjectType}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Objektarten" />
              </SelectTrigger>
              <SelectContent>
                {OBJECT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || '_all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kaufpreis (EUR)</Label>
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

          <div className="space-y-2">
            <Label>Wohnfläche (m²)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={portalSearch.isPending}
          size="lg"
        >
          {portalSearch.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Building2 className="h-4 w-4 mr-2" />
          )}
          {portalSearch.isPending ? 'Durchsuche 3 Portale…' : 'Alle Portale durchsuchen'}
        </Button>

        {/* Run Diagnostics */}
        {diagnostics && (
          <div className="flex gap-3 flex-wrap">
            {Object.entries(diagnostics).map(([portal, diag]) => (
              <div key={portal} className="flex items-center gap-1.5 text-sm">
                {diag.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : diag.status === 'blocked' ? (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="font-medium">{PORTAL_LABELS[portal] || portal}</span>
                <span className="text-muted-foreground">
                  {diag.result_count} Treffer
                  {diag.status === 'blocked' && ' (blockiert)'}
                  {diag.status === 'error' && ' (Fehler)'}
                  {diag.status === 'empty' && ' (leer)'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">{results.length} Objekte gefunden</h4>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {results.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{item.title}</span>
                        <Badge className={`text-xs ${PORTAL_COLORS[item.portal] || ''}`}>
                          {PORTAL_LABELS[item.portal] || item.portal}
                        </Badge>
                        {item.object_type && (
                          <Badge variant="outline" className="text-xs">
                            <Home className="h-3 w-3 mr-1" />
                            {item.object_type}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-1.5 space-y-1">
                        {(item.address || item.city || item.zip_code) && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[item.address, item.zip_code, item.city].filter(Boolean).join(', ')}
                          </p>
                        )}
                        <div className="flex gap-3 flex-wrap text-xs">
                          {item.price != null && (
                            <span className="font-semibold text-foreground">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                          {item.area_sqm != null && <span>{item.area_sqm} m²</span>}
                          {item.rooms != null && <span>{item.rooms} Zi.</span>}
                          {item.units != null && <span>{item.units} WE</span>}
                          {item.year_built != null && <span>Bj. {item.year_built}</span>}
                          {item.yield_percent != null && (
                            <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                              <TrendingUp className="h-3 w-3" />
                              {item.yield_percent}%
                            </span>
                          )}
                          {item.broker_name && (
                            <span className="text-muted-foreground">Makler: {item.broker_name}</span>
                          )}
                        </div>
                      </div>
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

        {/* Loading State */}
        {portalSearch.isPending && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Durchsuche ImmoScout24, Immowelt und Kleinanzeigen…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!portalSearch.isPending && results.length === 0 && diagnostics && (
          <div className="text-center py-6 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>Keine Objekte gefunden. Versuche andere Suchkriterien.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
