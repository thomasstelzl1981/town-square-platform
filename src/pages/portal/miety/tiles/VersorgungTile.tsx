import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MietyCreateHomeForm } from '../components/MietyCreateHomeForm';
import { ContractDrawer } from '../components/ContractDrawer';
import { useHomesQuery } from '../shared/useHomesQuery';
import { NoHomeBanner } from '../shared/NoHomeBanner';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import {
  Plus, Zap, Flame, Droplets, Wifi, Gauge, TrendingDown,
} from 'lucide-react';

export default function VersorgungTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [] } = useHomesQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string>('strom');

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts-versorgung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts').select('*')
        .eq('tenant_id', activeTenantId)
        .in('category', ['strom', 'gas', 'wasser', 'internet'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['miety-meter-readings-all', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_meter_readings').select('*')
        .eq('tenant_id', activeTenantId)
        .order('reading_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  if (showCreateForm) return <div className="p-4"><MietyCreateHomeForm onCancel={() => setShowCreateForm(false)} /></div>;

  const openDrawer = (cat: string) => {
    if (homes.length === 0) { setShowCreateForm(true); return; }
    setDrawerCategory(cat);
    setDrawerOpen(true);
  };

  const supplyCategories = [
    { category: 'strom', label: 'Stromvertrag', icon: Zap, meterType: 'strom', meterUnit: 'kWh', hasSoll: true },
    { category: 'gas', label: 'Gasvertrag', icon: Flame, meterType: 'gas', meterUnit: 'm³', hasSoll: false },
    { category: 'wasser', label: 'Wasservertrag', icon: Droplets, meterType: 'wasser', meterUnit: 'm³', hasSoll: false },
    { category: 'internet', label: 'Internet & Telefon', icon: Wifi, meterType: null, meterUnit: null, hasSoll: false },
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Versorgung" description="Strom, Gas, Wasser & Internet — Verträge und Zählerstände" />
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      <WidgetGrid>
        {supplyCategories.map(({ category, label, icon: SIcon, meterType, meterUnit, hasSoll }) => {
          const contract = contracts.find(c => c.category === category);
          const reading = meterType ? readings.find(r => r.meter_type === meterType) : null;

          return (
            <>
              {/* IST Card */}
              <WidgetCell key={`${category}-ist`}>
                <Card className={`${contract ? 'glass-card' : 'border-dashed hover:border-primary/30 transition-colors'} h-full`}>
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg ${contract ? 'bg-primary/10' : 'bg-muted'}`}>
                        <SIcon className={`h-4 w-4 ${contract ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Ihr Vertrag</p>
                        <p className="font-medium text-xs">{label}</p>
                        {contract ? (
                          <>
                            <p className="text-xs text-muted-foreground mt-0.5">{contract.provider_name || 'Anbieter'}</p>
                            {contract.monthly_cost && (
                              <p className="text-xs font-medium mt-0.5">{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</p>
                            )}
                            <Button size="sm" variant="ghost" className="text-[10px] h-6 mt-1 -ml-2 px-2"
                              onClick={() => navigate(`/portal/immobilien/zuhause/zuhause/${contract.home_id}`)}>Details →</Button>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Kein Vertrag hinterlegt</p>
                            <Button size="sm" variant="ghost" className="text-[10px] h-6 mt-1 -ml-2 px-2 text-primary" onClick={() => openDrawer(category)}>
                              <Plus className="h-3 w-3 mr-1" />Vertrag anlegen
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Integrated meter reading */}
                    {meterType && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Zählerstand</span>
                        </div>
                        {reading ? (
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <p className="text-sm font-semibold">{Number(reading.reading_value).toLocaleString('de-DE')}</p>
                            <span className="text-[10px] text-muted-foreground">{meterUnit} · {new Date(reading.reading_date).toLocaleDateString('de-DE')}</span>
                            <TrendingDown className="h-3 w-3 text-green-500 ml-auto" />
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Noch kein Stand erfasst</p>
                        )}
                        <Button size="sm" variant="ghost" className="text-[10px] h-6 mt-0.5 -ml-2 px-2 text-primary"
                          onClick={() => homes.length > 0 ? navigate(`/portal/immobilien/zuhause/zuhause/${homes[0].id}`) : setShowCreateForm(true)}>
                          <Plus className="h-3 w-3 mr-1" />Neuen Stand erfassen
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </WidgetCell>

              {/* SOLL Card */}
              <WidgetCell key={`${category}-soll`}>
                {hasSoll ? (
                  <Card className="glass-card border-green-500/20 overflow-hidden h-full">
                    <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-600" />
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-green-500/10">
                          <Zap className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-green-600 uppercase tracking-wide mb-0.5">Unser Angebot</p>
                          <p className="font-medium text-xs">Rabot Charge — Strom zum Börsenpreis</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ca. 28,5 ct/kWh (dynamisch)</p>
                          {contract?.monthly_cost && (
                            <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                              <p className="text-[10px] text-muted-foreground">Sie zahlen aktuell <strong>{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</strong></p>
                              <p className="text-[10px] text-green-700 dark:text-green-400 font-medium mt-0.5">
                                → mit Rabot ca. {(Number(contract.monthly_cost) * 0.85).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat
                              </p>
                            </div>
                          )}
                          <Badge className="mt-1.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 text-[10px]">
                            bis zu 15% sparen
                          </Badge>
                          <div className="flex gap-1.5 mt-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-[10px] h-7">Jetzt wechseln</Button>
                            <Button size="sm" variant="ghost" className="text-[10px] h-7">Mehr erfahren</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed opacity-60 h-full">
                    <CardContent className="p-4 flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground text-center">
                        {category === 'gas' ? 'Gasanbieter-Vergleich — demnächst verfügbar' : 'Vergleich nicht verfügbar'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </WidgetCell>
            </>
          );
        })}
      </WidgetGrid>

      <Button variant="outline" onClick={() => openDrawer('sonstige')}>
        <Plus className="h-4 w-4 mr-1.5" />Weiteren Vertrag hinzufügen
      </Button>

      {homes.length > 0 && (
        <ContractDrawer open={drawerOpen} onOpenChange={setDrawerOpen} homeId={homes[0].id} defaultCategory={drawerCategory} />
      )}
    </PageShell>
  );
}
