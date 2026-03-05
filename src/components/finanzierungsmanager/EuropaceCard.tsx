/**
 * EuropaceCard — Kachel 4: API-Konditionen + LeadRating
 * Extracted from FMEinreichung.tsx (R-1)
 */
import { Loader2, Globe, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { eurFormat } from './fmEinreichungTypes';
import type { EuropaceVorschlag, EuropaceLeadRating } from '@/services/europace/consumerLoanAdapter';

interface EuropaceCardProps {
  selectedId: string | null;
  request: any;
  epLoading: boolean;
  epAnfrageId: string | null;
  epVorschlaege: EuropaceVorschlag[];
  epLeadRating: EuropaceLeadRating | null;
  epError: string | null;
  handleEuropaceRequest: () => Promise<void>;
  // Manual handoff
  externalSoftwareName: string;
  setExternalSoftwareName: (n: string) => void;
  handleExternalHandoff: () => Promise<void>;
  createLogPending: boolean;
}

export function EuropaceCard({
  selectedId, request, epLoading, epAnfrageId, epVorschlaege, epLeadRating, epError,
  handleEuropaceRequest, externalSoftwareName, setExternalSoftwareName,
  handleExternalHandoff, createLogPending,
}: EuropaceCardProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" /> 4. Europace — Konditionen & Übergabe
          </h3>
          {epLeadRating?.successRating && (
            <Badge variant={epLeadRating.successRating <= 'B' ? 'default' : 'secondary'} className="text-xs">
              Lead: {epLeadRating.successRating} · Machbarkeit {epLeadRating.feasibilityRating ?? '–'}%
            </Badge>
          )}
        </div>
        <div className="p-4 space-y-4">
          {/* Aktion: Konditionen ermitteln */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleEuropaceRequest}
              disabled={epLoading || !selectedId || !request}
              className="h-8 text-xs"
            >
              {epLoading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Ermittle Konditionen…</>
              ) : (
                <><TrendingUp className="h-3.5 w-3.5 mr-1" /> Konditionen ermitteln</>
              )}
            </Button>
            {!selectedId && (
              <span className="text-[10px] text-muted-foreground">Bitte wählen Sie oben eine Akte aus.</span>
            )}
            {epAnfrageId && (
              <span className="text-[10px] text-muted-foreground font-mono">ID: {epAnfrageId.slice(0, 20)}…</span>
            )}
          </div>

          {/* Fehler */}
          {epError && (
            <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{epError}</p>
            </div>
          )}

          {/* Vorschläge als Karten */}
          {epVorschlaege.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {epVorschlaege.map((v, idx) => (
                <div key={v.finanzierungsVorschlagId} className="border rounded-lg p-3 space-y-2 bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Vorschlag {idx + 1}</span>
                    {v.kennung && <Badge variant="outline" className="text-[9px]">{v.kennung}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">Sollzins</span>
                      <p className="font-semibold text-sm">{v.sollZins?.toFixed(2)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Effektivzins</span>
                      <p className="font-semibold text-sm">{v.effektivZins?.toFixed(2)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate / Monat</span>
                      <p className="font-semibold text-sm">{eurFormat.format(v.gesamtRateProMonat)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Darlehenssumme</span>
                      <p className="font-semibold text-sm">{eurFormat.format(v.darlehensSumme)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Zinsbindung</span>
                      <p className="font-semibold text-sm">{v.zinsbindungInJahrenMinMax || '–'} Jahre</p>
                    </div>
                    {v.finanzierungsbausteine?.[0]?.produktAnbieter && (
                      <div>
                        <span className="text-muted-foreground">Bank</span>
                        <p className="font-semibold text-sm">{v.finanzierungsbausteine[0].produktAnbieter}</p>
                      </div>
                    )}
                  </div>
                  {v.annahmeFrist && (
                    <p className="text-[10px] text-muted-foreground">Gültig bis: {v.annahmeFrist}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LeadRating */}
          {epLeadRating && (
            <div className="flex items-center gap-4 text-xs border-t pt-3">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Lead-Score:</span>
                <Badge variant={epLeadRating.successRating && epLeadRating.successRating <= 'B' ? 'default' : 'outline'}
                  className="text-xs font-bold">
                  {epLeadRating.successRating || '–'}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Machbarkeit:</span>
                <span className="font-semibold">{epLeadRating.feasibilityRating ?? '–'}%</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Manuelle Übergabe */}
          <div className="border border-dashed rounded-md p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground">Oder: Fall manuell als „übergeben" markieren (ohne API)</p>
            <div className="flex items-center gap-2">
              <Input
                value={externalSoftwareName}
                onChange={(e) => setExternalSoftwareName(e.target.value)}
                placeholder="Software-Name"
                className="h-7 text-xs max-w-[180px]"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleExternalHandoff}
                disabled={createLogPending || !selectedId}
                className="h-7 text-xs"
              >
                <Globe className="h-3 w-3 mr-1" /> Fall übergeben
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
