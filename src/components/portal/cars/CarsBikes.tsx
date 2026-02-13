/**
 * CarsBikes — Motorcycle widget grid with inline detail
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bike, Plus, ChevronDown, X, FileText, ShieldCheck, BookOpen, FolderOpen, Gauge, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

interface BikeDemo {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  image: string;
  status: 'active' | 'inactive';
  mileage: string;
  hu: string;
  power: string;
  year: string;
}

const DEMO_BIKES: BikeDemo[] = [
  {
    id: 'bike-1', license_plate: 'M-BM 1300', make: 'BMW', model: 'R 1300 GS Adventure',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop',
    status: 'active', mileage: '8.420 km', hu: '09/2027', power: '107 kW (145 PS)', year: '2025',
  },
  {
    id: 'bike-2', license_plate: 'M-DC 4444', make: 'Ducati', model: 'Panigale V4 S',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=250&fit=crop',
    status: 'active', mileage: '3.150 km', hu: '04/2028', power: '158 kW (215 PS)', year: '2025',
  },
  {
    id: 'bike-3', license_plate: 'M-HD 2024', make: 'Harley-Davidson', model: 'Road Glide Special',
    image: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&h=250&fit=crop',
    status: 'active', mileage: '15.800 km', hu: '01/2027', power: '67 kW (91 PS)', year: '2024',
  },
];

export default function CarsBikes() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = DEMO_BIKES.find(b => b.id === selectedId);

  return (
    <PageShell>
      <ModulePageHeader
        title="Bikes"
        description="Motorräder verwalten — Klicken für vollständige Akte"
        actions={<Button><Plus className="h-4 w-4 mr-2" /> Bike hinzufügen</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {DEMO_BIKES.map((bike) => {
          const isSelected = selectedId === bike.id;
          return (
            <Card
              key={bike.id}
              className={cn(
                "glass-card overflow-hidden cursor-pointer group transition-all",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => setSelectedId(isSelected ? null : bike.id)}
            >
              <div className="relative h-36 bg-muted/30 overflow-hidden">
                <img src={bike.image} alt={`${bike.make} ${bike.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute top-2 left-3">
                  <Badge variant="outline" className="text-[9px] bg-status-success/10 text-status-success border-status-success/20">Aktiv</Badge>
                </div>
                <div className="absolute bottom-2 left-3">
                  <div className="bg-background/90 backdrop-blur-sm rounded-md px-3 py-1 border border-border/50">
                    <span className="font-mono font-bold text-sm tracking-wider">{bike.license_plate}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold text-sm">{bike.make} {bike.model}</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  <InfoMini icon={Gauge} label="KM" value={bike.mileage} />
                  <InfoMini icon={Calendar} label="HU" value={bike.hu} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                <Field label="Kennzeichen" value={selected.license_plate} />
                <Field label="Hersteller" value={selected.make} />
                <Field label="Modell" value={selected.model} />
                <Field label="Baujahr" value={selected.year} />
                <Field label="Leistung" value={selected.power} />
                <Field label="KM-Stand" value={selected.mileage} />
                <Field label="HU bis" value={selected.hu} />
                <Field label="Kraftstoff" value="Benzin" />
              </div>
            </Section>
            <Separator />
            <Section icon={ShieldCheck} title="Versicherung">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Versicherer" value="HUK-COBURG" />
                <Field label="Policen-Nr." value="HUK-2025-11234" />
                <Field label="Deckung" value="Vollkasko" />
                <Field label="Jahresbeitrag" value="680,00 €" />
              </div>
            </Section>
            <Separator />
            <Section icon={BookOpen} title="Fahrtenbuch">
              <p className="text-sm text-muted-foreground">Noch keine Fahrten erfasst</p>
            </Section>
            <Separator />
            <Section icon={FolderOpen} title="Dokumente">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Fahrzeugschein', 'Fahrzeugbrief', 'TÜV-Bericht'].map((d) => (
                  <div key={d} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate">{d}</span>
                  </div>
                ))}
              </div>
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
