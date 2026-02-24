/**
 * CarsBikes — Motorcycle widget grid with inline detail
 * Data comes from cars_vehicles table (vehicle_type = 'bike')
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bike, Plus, ChevronDown, X, FileText, ShieldCheck, BookOpen, FolderOpen, Gauge, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';
import { DESIGN } from '@/config/designManifest';
import { format } from 'date-fns';

// Bike images by make
const BIKE_IMAGES: Record<string, string> = {
  'BMW': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop',
  'Ducati': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=250&fit=crop',
  'Harley-Davidson': 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&h=250&fit=crop',
};
const DEFAULT_BIKE_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop';

export default function CarsBikes() {
  const { activeTenantId } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-FAHRZEUG');

  const { data: dbBikes = [] } = useQuery({
    queryKey: ['cars_vehicles_bikes', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await (supabase as any)
        .from('cars_vehicles')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('vehicle_type', 'bike')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const realBikes = dbBikes.filter((v: any) => !isDemoId(v.id));
  const bikes = demoEnabled ? dbBikes : realBikes;
  const isDemo = !realBikes.length && demoEnabled;

  const selected = bikes.find((b: any) => b.id === selectedId);
  const getImage = (v: any) => BIKE_IMAGES[v.make] || DEFAULT_BIKE_IMAGE;

  return (
    <PageShell>
      <ModulePageHeader
        title="Bikes"
        description="Motorräder verwalten — Klicken für vollständige Akte"
        actions={<Button variant="glass" size="icon-round"><Plus className="h-5 w-5" /></Button>}
      />

      <WidgetGrid>
        {bikes.map((bike: any) => {
          const isSelected = selectedId === bike.id;
          return (
            <WidgetCell key={bike.id}>
              <Card
                className={cn(
                  "glass-card overflow-hidden cursor-pointer group transition-all h-full",
                  isDemo ? DESIGN.DEMO_WIDGET.CARD : '',
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
                )}
                onClick={() => setSelectedId(isSelected ? null : bike.id)}
              >
                <div className="relative h-[55%] bg-muted/30 overflow-hidden">
                  <img src={getImage(bike)} alt={`${bike.make} ${bike.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-3 flex gap-1">
                    {isDemo && <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[9px]")}>DEMO</Badge>}
                    <Badge variant="outline" className="text-[9px] bg-status-success/10 text-status-success border-status-success/20">Aktiv</Badge>
                  </div>
                  <div className="absolute bottom-2 left-3">
                    <div className="bg-background/90 backdrop-blur-sm rounded-md px-3 py-1 border border-border/50">
                      <span className="font-mono font-bold text-sm tracking-wider">{bike.license_plate}</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2 h-[45%] flex flex-col justify-between">
                  <h3 className="font-semibold text-sm">{bike.make} {bike.model}</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <InfoMini icon={Gauge} label="KM" value={bike.current_mileage_km?.toLocaleString('de-DE') || '—'} />
                    <InfoMini icon={Calendar} label="HU" value={bike.hu_valid_until ? format(new Date(bike.hu_valid_until), 'MM/yyyy') : '—'} />
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {selected && (
        <Card className="glass-card border-primary/20 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bike className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{selected.make} {selected.model}</h2>
                <Badge className="text-xs">Aktiv</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
            </div>
            <Separator />
            <Section icon={FileText} title="Basisdaten">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Kennzeichen" value={selected.license_plate || '—'} />
                <Field label="Hersteller" value={selected.make || '—'} />
                <Field label="Modell" value={selected.model || '—'} />
                <Field label="Erstzulassung" value={selected.first_registration_date ? format(new Date(selected.first_registration_date), 'yyyy') : '—'} />
                <Field label="Leistung" value={selected.power_kw ? `${selected.power_kw} kW (${Math.round(selected.power_kw * 1.36)} PS)` : '—'} />
                <Field label="KM-Stand" value={selected.current_mileage_km?.toLocaleString('de-DE') || '—'} />
                <Field label="HU bis" value={selected.hu_valid_until ? format(new Date(selected.hu_valid_until), 'MM/yyyy') : '—'} />
                <Field label="Kraftstoff" value={selected.fuel_type || '—'} />
              </div>
            </Section>
            <Separator />
            <Section icon={ShieldCheck} title="Versicherung">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Versicherer" value="—" />
                <Field label="Policen-Nr." value="—" />
                <Field label="Deckung" value="—" />
                <Field label="Jahresbeitrag" value="—" />
              </div>
            </Section>
            <Separator />
            <Section icon={BookOpen} title="Fahrtenbuch">
              <p className="text-sm text-muted-foreground">Noch keine Fahrten erfasst</p>
            </Section>
            <Separator />
            <Section icon={FolderOpen} title="Dokumente">
              <p className="text-sm text-muted-foreground">Noch keine Dokumente</p>
            </Section>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

function InfoMini({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1">
      <Icon className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[8px] text-muted-foreground uppercase">{label}</p>
        <p className="text-[11px] truncate">{value}</p>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3></div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className="text-sm font-medium cursor-text hover:text-primary transition-colors">{value}</dd>
    </div>
  );
}