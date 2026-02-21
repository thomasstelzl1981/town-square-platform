/**
 * Property Research Tool
 * 
 * AI-powered property analysis with location, market, risk, and recommendation data
 */

import * as React from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Brain, MapPin, TrendingUp, AlertTriangle, Lightbulb,
  Building2, Train, ShoppingCart, GraduationCap, CheckCircle2, XCircle, Shield
} from 'lucide-react';
import { useStandaloneAIResearch, useStandaloneGeoMap, type StandaloneResearchResult, type GeoMapResult } from '@/hooks/useAcqTools';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function PropertyResearchTool() {
  const [query, setQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('location');
  const [researchResult, setResearchResult] = React.useState<StandaloneResearchResult | null>(null);
  const [geoMapResult, setGeoMapResult] = React.useState<GeoMapResult | null>(null);

  const aiResearch = useStandaloneAIResearch();
  const geoMap = useStandaloneGeoMap();

  const handleAIResearch = async () => {
    if (!query.trim()) return;
    const result = await aiResearch.mutateAsync({ query });
    setResearchResult(result);
    setActiveTab('location');
  };

  const handleGeoMap = async () => {
    if (!query.trim()) return;
    const result = await geoMap.mutateAsync(query);
    setGeoMapResult(result);
  };

  const handleSprengnetter = async () => {
    if (!query.trim()) return;
    toast.info('Sprengnetter-Bewertung wird abgerufen...');
    try {
      const { data, error } = await supabase.functions.invoke('sot-sprengnetter-valuation', {
        body: { address: query },
      });
      if (error) throw error;
      toast.success('Sprengnetter-Bewertung erhalten');
      // Store result alongside research data
      setResearchResult(prev => prev ? { ...prev, sprengnetter: data } : { query, timestamp: new Date().toISOString(), sprengnetter: data } as any);
    } catch (err: unknown) {
      toast.error('Sprengnetter-Fehler: ' + (err instanceof Error ? err.message : String(err) || 'Unbekannt'));
    }
  };

  const isLoading = aiResearch.isPending || geoMap.isPending;
  const hasResults = researchResult || geoMapResult;

  return (
    <Card className={DESIGN.CARD.BASE}>
      <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
        <CardTitle className={`${DESIGN.TYPOGRAPHY.CARD_TITLE} flex items-center gap-2`}>
          <Building2 className="h-4 w-4 text-primary" />
          Immobilienbewertung
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className={DESIGN.TYPOGRAPHY.MUTED}>
          KI-gestützte Standortanalyse mit optionaler Sprengnetter-Bewertung
        </p>
        {/* Search Input */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="z.B. MFH Berliner Allee 45, 10115 Berlin, 8 WE, Baujahr 1965"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAIResearch()}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAIResearch} disabled={isLoading || !query.trim()}>
              {aiResearch.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              KI-Recherche starten
            </Button>
            <Button variant="outline" onClick={handleGeoMap} disabled={isLoading || !query.trim()}>
              {geoMap.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              GeoMap-Analyse
            </Button>
            <Button variant="outline" onClick={handleSprengnetter} disabled={isLoading || !query.trim()}>
              <Shield className="h-4 w-4 mr-2" />
              Sprengnetter
            </Button>
          </div>
        </div>

        {/* Results Tabs */}
        {hasResults && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="location">
                <MapPin className="h-4 w-4 mr-2" />
                Standort
              </TabsTrigger>
              <TabsTrigger value="market">
                <TrendingUp className="h-4 w-4 mr-2" />
                Markt
              </TabsTrigger>
              <TabsTrigger value="risks">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Risiken
              </TabsTrigger>
              <TabsTrigger value="recommendation">
                <Lightbulb className="h-4 w-4 mr-2" />
                Empfehlung
              </TabsTrigger>
            </TabsList>

            {/* Location Tab */}
            <TabsContent value="location" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {researchResult?.location ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold">
                          {researchResult.location.score}/10
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Standortbewertung</p>
                          <Progress value={researchResult.location.score * 10} className="h-2 mt-1" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4" /> Makrolage
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult.location.macroLocation}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4" /> Mikrolage
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult.location.microLocation}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <ShoppingCart className="h-4 w-4" /> Infrastruktur
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {researchResult.location.infrastructure.map((item, i) => (
                                <Badge key={i} variant="secondary">{item}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <Train className="h-4 w-4" /> ÖPNV
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {researchResult.location.publicTransport.map((item, i) => (
                                <Badge key={i} variant="outline">{item}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : geoMapResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold">
                          {geoMapResult.location_score}/10
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">GeoMap Score</p>
                          <Progress value={geoMapResult.location_score * 10} className="h-2 mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Infrastruktur-Score:</span>
                          <span className="ml-2 font-medium">{geoMapResult.infrastructure_score}/10</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bevölkerungsdichte:</span>
                          <span className="ml-2 font-medium">{geoMapResult.population_density} EW/km²</span>
                        </div>
                      </div>
                      {geoMapResult.poi_summary.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {geoMapResult.poi_summary.map((poi, i) => (
                            <Badge key={i} variant="secondary">{poi}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Starten Sie eine Recherche für Standortdaten
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Market Tab */}
            <TabsContent value="market" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {researchResult?.market || geoMapResult ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Durchschnittsmiete</p>
                          <p className="text-2xl font-bold">
                            {(researchResult?.market?.avgRentPerSqm || geoMapResult?.avg_rent_sqm || 0).toFixed(2)} €/m²
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Kaufpreis-Niveau</p>
                          <p className="text-2xl font-bold">
                            {(researchResult?.market?.avgPricePerSqm || geoMapResult?.avg_price_sqm || 0).toLocaleString('de-DE')} €/m²
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Leerstandsquote</p>
                          <p className="text-2xl font-bold">
                            {(researchResult?.market?.vacancyRate || geoMapResult?.vacancy_rate || 0).toFixed(1)}%
                          </p>
                        </div>
                        {researchResult?.market?.trend && (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Trend</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                researchResult.market.trend === 'rising' ? 'default' :
                                researchResult.market.trend === 'falling' ? 'destructive' : 'secondary'
                              }>
                                {researchResult.market.trend === 'rising' ? '↗️ steigend' :
                                 researchResult.market.trend === 'falling' ? '↘️ fallend' : '→ stabil'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {researchResult.market.trendDescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Starten Sie eine Recherche für Marktdaten
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {researchResult?.risks || geoMapResult ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold">
                          {researchResult?.risks?.score || 7}/10
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Sicherheits-Score (10 = sehr sicher)</p>
                          <Progress value={(researchResult?.risks?.score || 7) * 10} className="h-2 mt-1" />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {(researchResult?.risks?.floodZone || geoMapResult?.flood_zone) ? (
                              <XCircle className="h-5 w-5 text-destructive" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            <span className="font-medium">Hochwasserzone</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(researchResult?.risks?.floodZone || geoMapResult?.flood_zone) 
                              ? 'Objekt liegt in Hochwasserzone' 
                              : 'Keine Hochwassergefährdung'}
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <p className="font-medium mb-2">Lärmbelastung</p>
                          <Badge variant={
                            (researchResult?.risks?.noiseLevel || geoMapResult?.noise_level) === 'high' ? 'destructive' :
                            (researchResult?.risks?.noiseLevel || geoMapResult?.noise_level) === 'medium' ? 'secondary' : 'outline'
                          }>
                            {(researchResult?.risks?.noiseLevel || geoMapResult?.noise_level) === 'high' ? 'Hoch' :
                             (researchResult?.risks?.noiseLevel || geoMapResult?.noise_level) === 'medium' ? 'Mittel' : 'Niedrig'}
                          </Badge>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <p className="font-medium mb-2">Wirtschaftliche Abhängigkeit</p>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.risks?.economicDependency || 'Keine Daten'}
                          </p>
                        </div>
                      </div>

                      {researchResult?.risks?.factors && researchResult.risks.factors.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">Risikofaktoren</p>
                          <div className="flex flex-wrap gap-2">
                            {researchResult.risks.factors.map((factor, i) => (
                              <Badge key={i} variant="outline" className="text-destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Starten Sie eine Recherche für Risikobewertung
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendation Tab */}
            <TabsContent value="recommendation" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {researchResult?.recommendation ? (
                    <>
                      <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                        <p className="font-medium mb-1">Investment-Empfehlung</p>
                        <p className="text-sm">{researchResult.recommendation.summary}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium">Geeignete Strategien</p>
                        <div className="flex gap-2">
                          {researchResult.recommendation.strategies.map((s, i) => (
                            <Badge key={i}>{s}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-medium flex items-center gap-1 text-primary">
                            <CheckCircle2 className="h-4 w-4" /> Stärken
                          </p>
                          <ul className="text-sm space-y-1">
                            {researchResult.recommendation.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium flex items-center gap-1 text-destructive">
                            <XCircle className="h-4 w-4" /> Schwächen
                          </p>
                          <ul className="text-sm space-y-1">
                            {researchResult.recommendation.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-destructive">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Starten Sie eine KI-Recherche für Empfehlungen
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Analysiere Standort...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
