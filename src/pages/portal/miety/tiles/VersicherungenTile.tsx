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
import { Plus, Shield, FolderOpen } from 'lucide-react';

export default function VersicherungenTile() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const { data: homes = [] } = useHomesQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string>('hausrat');

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts-versicherung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_contracts').select('*')
        .eq('tenant_id', activeTenantId)
        .in('category', ['hausrat', 'haftpflicht'])
        .order('created_at', { ascending: false });
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

  const home = homes[0];
  const insuranceTypes = [
    { category: 'hausrat', label: 'Hausratversicherung', sollPrice: 'ab 4,90 EUR/Monat (Grundschutz)', sollPriceComfort: 'ab 8,50 EUR/Monat (Komfort)' },
    { category: 'haftpflicht', label: 'Haftpflichtversicherung', sollPrice: 'ab 3,50 EUR/Monat', sollPriceComfort: null },
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Versicherungen" description="Hausrat, Haftpflicht & Vergleichsangebote" />
      {homes.length === 0 && <NoHomeBanner onCreateClick={() => setShowCreateForm(true)} />}

      <WidgetGrid>
        {insuranceTypes.map(({ category, label, sollPrice, sollPriceComfort }) => {
          const contract = contracts.find(c => c.category === category);
          return (
            <>
              {/* IST Card */}
              <WidgetCell key={`${category}-ist`}>
                <Card className={`${contract ? 'glass-card' : 'border-dashed hover:border-primary/30 transition-colors'} h-full`}>
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg ${contract ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Shield className={`h-4 w-4 ${contract ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Ihr Vertrag</p>
                        <p className="font-medium text-xs">{label}</p>
                        {contract ? (
                          <>
                            <p className="text-xs text-muted-foreground mt-0.5">{contract.provider_name || 'Versicherer'}</p>
                            {contract.monthly_cost && (
                              <p className="text-xs font-medium mt-0.5">{Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</p>
                            )}
                            <Button size="sm" variant="ghost" className="text-[10px] h-6 mt-1 -ml-2 px-2"
                              onClick={() => navigate(`/portal/immobilien/zuhause/zuhause/${contract.home_id}`)}>Details →</Button>
                            <div className="mt-1.5 pt-1.5 border-t border-border/50">
                              <Button size="sm" variant="ghost" className="text-[10px] h-6 -ml-2 px-2 text-muted-foreground">
                                <FolderOpen className="h-3 w-3 mr-1" />Unterlagen herunterladen
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Nicht hinterlegt</p>
                            <Button size="sm" variant="ghost" className="text-[10px] h-6 mt-1 -ml-2 px-2 text-primary" onClick={() => openDrawer(category)}>
                              <Plus className="h-3 w-3 mr-1" />Hinzufügen
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </WidgetCell>

              {/* SOLL Card — Neo Digital */}
              <WidgetCell key={`${category}-soll`}>
                <Card className="glass-card border-blue-500/20 overflow-hidden h-full">
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-600" />
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-500/10">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-blue-600 uppercase tracking-wide mb-0.5">Vergleichsangebot</p>
                        <p className="font-medium text-xs">Neo Digital — {label}</p>
                        {home && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {home.area_sqm && <Badge variant="outline" className="text-[9px] h-4 px-1">{home.area_sqm} m²</Badge>}
                            {home.property_type && <Badge variant="outline" className="text-[9px] h-4 px-1 capitalize">{home.property_type}</Badge>}
                            {home.zip && <Badge variant="outline" className="text-[9px] h-4 px-1">PLZ {home.zip}</Badge>}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1.5">{sollPrice}</p>
                        {sollPriceComfort && <p className="text-[10px] text-muted-foreground">{sollPriceComfort}</p>}
                        {contract?.monthly_cost && (
                          <Badge className="mt-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-[10px]">
                            Einsparung möglich
                          </Badge>
                        )}
                        <div className="flex gap-1.5 mt-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] h-7">Angebot anfordern</Button>
                          <Button size="sm" variant="ghost" className="text-[10px] h-7">Mehr erfahren</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </WidgetCell>
            </>
          );
        })}
      </WidgetGrid>

      <Button variant="outline" onClick={() => openDrawer('sonstige')}>
        <Plus className="h-4 w-4 mr-1.5" />Weitere Versicherung
      </Button>

      {homes.length > 0 && (
        <ContractDrawer open={drawerOpen} onOpenChange={setDrawerOpen} homeId={homes[0].id} defaultCategory={drawerCategory} />
      )}
    </PageShell>
  );
}
