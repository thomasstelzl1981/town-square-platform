/**
 * PV Anlagen Tab — Golden Path compliant with WidgetGrid + Demo-Widget
 */
import { useState } from 'react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sun, Plus, Zap, Activity } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { LoadingState } from '@/components/shared/LoadingState';

export default function AnlagenTab() {
  const navigate = useNavigate();
  const { plants, isLoading } = usePvPlants();
  const { liveData } = usePvMonitoring(plants);
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PV-ANLAGE');

  if (isLoading) {
    return <PageShell><LoadingState /></PageShell>;
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="ANLAGEN"
        description={`${plants.length > 0 ? `${plants.length} PV-Anlage${plants.length > 1 ? 'n' : ''}` : 'Ihr PV-Portfolio'}`}
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
                    <Badge variant="default" className="text-[10px]">Aktiv</Badge>
                  </div>
                  <h3 className="font-semibold text-sm">EFH SMA 9,8 kWp</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Berlin · SMA Sunny Tripower</p>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> Leistung</span>
                    <span className="font-mono font-semibold">4.230 W</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Heute</span>
                    <span className="font-mono">18,4 kWh</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Jahresertrag</span>
                    <span className="font-mono">9.500 kWh</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        )}

        {/* Real Plants */}
        {plants.map((plant) => {
          const live = liveData.get(plant.id);
          return (
            <WidgetCell key={plant.id}>
              <Card
                className="h-full cursor-pointer transition-colors hover:border-primary/30"
                onClick={() => navigate(`/portal/photovoltaik/${plant.id}`)}
              >
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <Badge variant={plant.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {plant.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{plant.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{plant.city || '–'} · {plant.wr_manufacturer || '–'}</p>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">kWp</span>
                      <span className="font-mono font-semibold">{plant.kwp ?? '–'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Leistung</span>
                      <span className="font-mono">{live ? `${live.currentPowerW.toLocaleString('de-DE')} W` : '–'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Heute</span>
                      <span className="font-mono">{live ? `${live.energyTodayKwh.toLocaleString('de-DE')} kWh` : '–'}</span>
                    </div>
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
            onClick={() => navigate('/portal/photovoltaik/neu')}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Neue Anlage</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PV-Anlage hinzufügen</p>
              </div>
            </CardContent>
          </Card>
        </WidgetCell>
      </WidgetGrid>
    </PageShell>
  );
}
