/**
 * GeoMap Analysis Tool
 * 
 * Standalone location analysis using sot-geomap-snapshot edge function
 */

import * as React from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, MapPin, Users, Building2, Train, ShoppingCart,
  AlertTriangle, Droplets, Volume2, TrendingUp
} from 'lucide-react';
import { useStandaloneGeoMap, type GeoMapResult } from '@/hooks/useAcqTools';

export function GeoMapTool() {
  const [address, setAddress] = React.useState('');
  const [result, setResult] = React.useState<GeoMapResult | null>(null);
  const geoMap = useStandaloneGeoMap();

  const handleAnalyze = async () => {
    if (!address.trim()) return;
    const data = await geoMap.mutateAsync(address);
    setResult(data);
  };

  return (
    <Card className={DESIGN.CARD.BASE}>
      <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
        <CardTitle className={`${DESIGN.TYPOGRAPHY.CARD_TITLE} flex items-center gap-2`}>
          <MapPin className="h-4 w-4 text-primary" />
          GeoMap-Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className={DESIGN.TYPOGRAPHY.MUTED}>
          Standortdaten für Demografie, Infrastruktur, Markt und Risikofaktoren abrufen
        </p>

        {/* Input */}
        <div className="flex gap-3">
          <Input
            placeholder="Adresse eingeben, z.B. Berliner Allee 45, 10115 Berlin"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            className="flex-1"
          />
          <Button onClick={handleAnalyze} disabled={geoMap.isPending || !address.trim()}>
            {geoMap.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            Analyse starten
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Score Overview */}
            <div className={`${DESIGN.KPI_GRID.FULL}`}>
              <ScoreCard label="Standort-Score" value={result.location_score} max={10} icon={<MapPin className="h-4 w-4" />} />
              <ScoreCard label="Infrastruktur" value={result.infrastructure_score} max={10} icon={<Building2 className="h-4 w-4" />} />
              <ScoreCard label="Ø Miete" value={result.avg_rent_sqm} suffix="€/m²" icon={<TrendingUp className="h-4 w-4" />} />
              <ScoreCard label="Ø Kaufpreis" value={result.avg_price_sqm} suffix="€/m²" icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            {/* Detail Grid */}
            <div className={DESIGN.FORM_GRID.FULL}>
              {/* Demographics & Market */}
              <div className="space-y-3">
                <h4 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Demografie & Markt</h4>
                <div className="space-y-2">
                  <DetailRow icon={<Users className="h-3.5 w-3.5" />} label="Bevölkerungsdichte" value={`${result.population_density} EW/km²`} />
                  <DetailRow icon={<TrendingUp className="h-3.5 w-3.5" />} label="Leerstandsquote" value={`${result.vacancy_rate.toFixed(1)}%`} />
                </div>
              </div>

              {/* Risks */}
              <div className="space-y-3">
                <h4 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Risikofaktoren</h4>
                <div className="space-y-2">
                  <DetailRow
                    icon={<Droplets className="h-3.5 w-3.5" />}
                    label="Hochwasserzone"
                    value={result.flood_zone ? 'Ja — Gefährdungsgebiet' : 'Nein'}
                    variant={result.flood_zone ? 'danger' : 'success'}
                  />
                  <DetailRow
                    icon={<Volume2 className="h-3.5 w-3.5" />}
                    label="Lärmbelastung"
                    value={result.noise_level === 'high' ? 'Hoch' : result.noise_level === 'medium' ? 'Mittel' : 'Niedrig'}
                    variant={result.noise_level === 'high' ? 'danger' : result.noise_level === 'medium' ? 'warn' : 'success'}
                  />
                </div>
              </div>
            </div>

            {/* POI Summary */}
            {result.poi_summary.length > 0 && (
              <div className="space-y-2">
                <h4 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Infrastruktur (POIs)</h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.poi_summary.map((poi, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{poi}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {geoMap.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ label, value, max, suffix, icon }: {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className={DESIGN.TYPOGRAPHY.HINT}>{label}</span>
      </div>
      <p className={DESIGN.TYPOGRAPHY.VALUE}>
        {typeof value === 'number' ? (suffix ? `${value.toLocaleString('de-DE')}` : value) : '–'}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
      {max && (
        <Progress value={(value / max) * 100} className="h-1.5" />
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, variant }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant?: 'success' | 'danger' | 'warn';
}) {
  const colorMap = {
    success: 'text-emerald-500',
    danger: 'text-destructive',
    warn: 'text-amber-500',
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className={DESIGN.TYPOGRAPHY.HINT}>{label}</span>
      </div>
      <span className={`text-sm font-medium ${variant ? colorMap[variant] : ''}`}>{value}</span>
    </div>
  );
}
