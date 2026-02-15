/**
 * MandatTab — MOD-08 Investment Search Mandate Management
 * 
 * Golden Path compliant: WidgetGrid + Demo-Widget + Inline-Flow
 */
import * as React from 'react';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, FileSignature, Loader2, Building2, MapPin, 
  Clock, CheckCircle2, ArrowRight, Eye, Search
} from 'lucide-react';
import { useMyAcqMandates, useSubmitAcqMandate } from '@/hooks/useAcqMandate';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { MANDATE_STATUS_CONFIG, ASSET_FOCUS_OPTIONS } from '@/types/acquisition';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoToggles } from '@/hooks/useDemoToggles';

export default function MandatTab() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useMyAcqMandates();
  const submitMandate = useSubmitAcqMandate();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-SUCHMANDAT');

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const getAssetFocusLabels = (focus: string[] | null) => {
    if (!focus || focus.length === 0) return '–';
    return focus.map(f => {
      const option = ASSET_FOCUS_OPTIONS.find(o => o.value === f);
      return option?.label || f;
    }).join(', ');
  };

  const handleSubmit = async (mandateId: string) => {
    await submitMandate.mutateAsync(mandateId);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allMandates = mandates || [];

  return (
    <PageShell>
      <ModulePageHeader
        title="SUCHMANDAT"
        description="Beauftragen Sie einen AkquiseManager mit der Suche nach Ihrem Wunschobjekt"
      />

      <WidgetGrid>
        {/* Demo Widget */}
        {demoEnabled && (
          <WidgetCell>
            <Card className={cn("h-full cursor-pointer transition-colors", DESIGN.DEMO_WIDGET.CARD, DESIGN.DEMO_WIDGET.HOVER)}>
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>Demo</Badge>
                    <Badge variant="outline" className="text-[10px]">Aktiv</Badge>
                  </div>
                  <h3 className="font-semibold text-sm">MFH NRW ab 1 Mio</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Mehrfamilienhäuser</p>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Region</span>
                    <span className="font-medium">NRW</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-mono font-semibold">1 – 3 Mio €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Zielrendite</span>
                    <span className="font-mono">5,0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        )}

        {/* Real Mandates */}
        {allMandates.map((mandate) => {
          const statusConfig = MANDATE_STATUS_CONFIG[mandate.status];
          const isDraft = mandate.status === 'draft';
          return (
            <WidgetCell key={mandate.id}>
              <Card
                className={cn("h-full cursor-pointer transition-colors hover:border-primary/30", getActiveWidgetGlow('amber'), isDraft ? 'border-orange-200' : '')}
                onClick={() => navigate(`/portal/investments/mandat/${mandate.id}`)}
              >
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-muted-foreground">{mandate.code}</span>
                      <Badge variant={statusConfig.variant as any} className="text-[10px]">
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{getAssetFocusLabels(mandate.asset_focus)}</h3>
                    {(mandate.search_area as any)?.region && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {(mandate.search_area as any).region}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-mono">{formatCurrency(mandate.price_min)} – {formatCurrency(mandate.price_max)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(mandate.created_at), { locale: de, addSuffix: true })}
                    </div>
                    {isDraft && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={(e) => { e.stopPropagation(); handleSubmit(mandate.id); }}
                        disabled={submitMandate.isPending}
                      >
                        {submitMandate.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                        Einreichen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}

        {/* CTA Widget */}
        <WidgetCell>
          <Card
            className="glass-card border-dashed border-2 h-full flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => navigate('/portal/investments/mandat/neu')}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Neues Mandat</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Suchmandat erstellen</p>
              </div>
            </CardContent>
          </Card>
        </WidgetCell>
      </WidgetGrid>
    </PageShell>
  );
}
