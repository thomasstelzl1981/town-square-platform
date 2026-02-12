/**
 * PV Monitoring Tab — Aggregated live monitoring with showcase empty state
 */
import { useNavigate } from 'react-router-dom';
import { DESIGN } from '@/config/designManifest';
import { usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { generate24hCurve } from '@/components/photovoltaik/DemoLiveGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Sun, TrendingUp, WifiOff, Plus, Sparkles, Activity } from 'lucide-react';
import { KPICard } from '@/components/shared/KPICard';
import { useMemo } from 'react';
import { usePvDMS } from '@/hooks/usePvDMS';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { toast } from 'sonner';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonitoringTab() {
  const navigate = useNavigate();
  const { plants, isLoading, createPlant, tenantId } = usePvPlants();
  const { liveData, totalPowerW, totalEnergyTodayKwh, totalEnergyMonthKwh, offlineCount } = usePvMonitoring(plants);
  const { createDMSTree } = usePvDMS();
  const { profile } = useAuth();
  const hasPlants = plants.length > 0;

  // Static preview curve for empty state
  const previewCurve = useMemo(() => generate24hCurve(9.8), []);

  const handleSeedDemo = async () => {
    if (!tenantId || !profile?.id) return;
    try {
      const demos = [
        { name: 'Thomas – EFH SMA 9,8 kWp', city: 'Berlin', kwp: 9.8, wr_manufacturer: 'SMA', provider: 'demo' },
        { name: 'Gewerbehalle Solar-Log 49,5 kWp', city: 'München', kwp: 49.5, wr_manufacturer: 'Solar-Log', provider: 'demo' },
      ];
      for (const d of demos) {
        const plant = await createPlant.mutateAsync(d);
        await createDMSTree.mutateAsync({ plantId: plant.id, plantName: plant.name });
      }
      toast.success('2 Demo-Anlagen angelegt');
    } catch { /* handled */ }
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Monitoring"
        description={hasPlants ? 'Echtzeit-Übersicht aller PV-Anlagen' : 'Live-Monitoring Ihrer PV-Anlagen'}
      />

      {/* KPI Cards */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <KPICard icon={Zap} label="Gesamtleistung" value={hasPlants ? `${totalPowerW.toLocaleString('de-DE')} W` : '—'} className={!hasPlants ? 'opacity-50' : ''} />
        <KPICard icon={Sun} label="Ertrag heute" value={hasPlants ? `${totalEnergyTodayKwh.toLocaleString('de-DE')} kWh` : '—'} className={!hasPlants ? 'opacity-50' : ''} />
        <KPICard icon={TrendingUp} label="Monatsertrag" value={hasPlants ? `${totalEnergyMonthKwh.toLocaleString('de-DE')} kWh` : '—'} className={!hasPlants ? 'opacity-50' : ''} />
        <KPICard icon={WifiOff} label="Offline" value={hasPlants ? `${offlineCount} Anlagen` : '—'} className={!hasPlants ? 'opacity-50' : ''} />
      </div>

      {hasPlants ? (
        /* Live plant cards */
        <div className="grid gap-4 md:grid-cols-2">
          {plants.map((plant) => {
            const live = liveData.get(plant.id);
            const curve = generate24hCurve(plant.kwp ?? 10);
            return (
              <Card key={plant.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/portal/photovoltaik/${plant.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plant.name}</CardTitle>
                    <Badge variant={live?.isOnline ? 'default' : 'secondary'}>
                      {live?.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{plant.city} · {plant.kwp} kWp · {plant.wr_manufacturer}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Leistung: </span>
                      <span className="font-mono font-medium">{live?.currentPowerW.toLocaleString('de-DE')} W</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Heute: </span>
                      <span className="font-mono font-medium">{live?.energyTodayKwh.toLocaleString('de-DE')} kWh</span>
                    </div>
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={curve}>
                        <defs>
                          <linearGradient id={`grad-${plant.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="hour" hide />
                        <YAxis hide />
                        <Area type="monotone" dataKey="power_w" stroke="hsl(var(--primary))" fill={`url(#grad-${plant.id})`} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Showcase Empty State */
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Beispiel-Tageskurve 9,8 kWp
              </CardTitle>
            </CardHeader>
            <CardContent className="opacity-50 pointer-events-none">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={previewCurve}>
                    <defs>
                      <linearGradient id="grad-preview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" tickFormatter={(v) => `${v}h`} fontSize={11} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)} kW`} fontSize={11} width={45} />
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString('de-DE')} W`, 'Leistung']} labelFormatter={(l) => `${l}:00 Uhr`} />
                    <Area type="monotone" dataKey="power_w" stroke="hsl(var(--primary))" fill="url(#grad-preview)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-muted-foreground text-center max-w-md">
              Legen Sie eine Anlage an oder erzeugen Sie Demo-Anlagen, um Live-Monitoring zu aktivieren.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSeedDemo} disabled={createPlant.isPending}>
                <Sparkles className="h-4 w-4 mr-2" />
                Demo-Anlagen erzeugen
              </Button>
              <Button onClick={() => navigate('/portal/photovoltaik/neu')}>
                <Plus className="h-4 w-4 mr-2" />
                Anlage anlegen
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
